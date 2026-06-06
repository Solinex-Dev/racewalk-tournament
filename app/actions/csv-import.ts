"use server";

/**
 * CSV import (ROOT ADMIN only) for Athlete, Judge, Affiliation.
 *
 * Two phases: `preview*` validates the uploaded file and returns a per-row
 * verdict (create / update / error) + counts WITHOUT writing; `commit*` re-parses
 * + re-validates the same file and writes everything in one transaction
 * (all-or-nothing). The commit is stateless — the client re-sends the file — so no
 * server-side session state is held between the two calls.
 *
 * Matching: row `id` empty → insert; `id` matching a live row → update; `id` not
 * found (or duplicated in-file) → row error. FKs resolve by `*_id` first, then by
 * exact live `*_name` (ambiguous/missing → error), EXCEPT a judge's organization /
 * department, which auto-create by name (Org by exact name, Dept by org+name).
 */
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { getCurrentAdmin } from "@/lib/authz";
import { logCurrentAdmin, ActivityLogAction } from "@/lib/activity-log";
import { composeName } from "@/lib/person-name";
import { parseCsv, pick, type CsvRow } from "@/lib/csv/parse";
import {
  normalizeCountry,
  normalizeProvince,
  normalizeJudgeStatus,
  parseDateOnly,
} from "@/lib/csv/normalize";
import type {
  ImportEntity,
  ImportPreview,
  PreviewRow,
  RowVerdict,
  CommitResult,
} from "@/lib/csv/import-types";

const MAX_ROWS = 5000;
const MAX_BYTES = 5 * 1024 * 1024; // 5 MB

async function requireRoot() {
  const me = await getCurrentAdmin();
  if (!me?.isRoot) throw new Error("เฉพาะ Root Admin เท่านั้นที่นำเข้าข้อมูลได้");
  return me;
}

type Upload = { rows: CsvRow[]; headers: string[] } | { topError: string };

async function readUpload(formData: FormData, required: string[]): Promise<Upload> {
  const file = formData.get("file");
  if (!(file instanceof File)) return { topError: "ไม่พบไฟล์ที่อัปโหลด" };
  if (file.size === 0) return { topError: "ไฟล์ว่างเปล่า" };
  if (file.size > MAX_BYTES) return { topError: `ไฟล์ใหญ่เกินไป (จำกัด ${MAX_BYTES / 1024 / 1024} MB)` };

  const { rows, headers, error } = parseCsv(await file.text());
  if (error) return { topError: error };
  const missing = required.filter((h) => !headers.includes(h));
  if (missing.length > 0) return { topError: `ไฟล์ขาดคอลัมน์ที่จำเป็น: ${missing.join(", ")}` };
  if (rows.length === 0) return { topError: "ไม่พบข้อมูล (มีแต่หัวตาราง?)" };
  if (rows.length > MAX_ROWS) return { topError: `จำนวนแถวเกินกำหนด (สูงสุด ${MAX_ROWS})` };
  return { rows, headers };
}

/** Decide create/update from the `id` column; push errors for unknown / duplicate ids. */
function idVerdict(
  id: string,
  existing: Set<string>,
  seen: Set<string>,
  errors: string[],
): { verdict: "create" | "update"; id: string | null } {
  if (!id) return { verdict: "create", id: null };
  if (seen.has(id)) errors.push(`id ซ้ำในไฟล์: ${id}`);
  seen.add(id);
  if (existing.has(id)) return { verdict: "update", id };
  errors.push(`ไม่พบ id ในระบบ: ${id}`);
  return { verdict: "update", id };
}

type ResolvedRow<TPayload> = {
  rowNumber: number;
  verdict: RowVerdict;
  label: string;
  reasons: string[];
  id: string | null;
  payload: TPayload | null;
};

function finalVerdict(base: "create" | "update", errors: string[]): RowVerdict {
  return errors.length > 0 ? "error" : base;
}

function toPreview<T>(entity: ImportEntity, resolved: ResolvedRow<T>[]): ImportPreview {
  const rows: PreviewRow[] = resolved.map((r) => ({
    rowNumber: r.rowNumber,
    verdict: r.verdict,
    label: r.label,
    reasons: r.reasons,
  }));
  return {
    entity,
    counts: {
      create: rows.filter((r) => r.verdict === "create").length,
      update: rows.filter((r) => r.verdict === "update").length,
      error: rows.filter((r) => r.verdict === "error").length,
      total: rows.length,
    },
    rows,
  };
}

function assertNoErrors<T>(resolved: ResolvedRow<T>[]) {
  if (resolved.some((r) => r.verdict === "error")) {
    throw new Error("มีแถวที่ไม่ผ่านการตรวจสอบ — กรุณาแก้ไขไฟล์แล้วลองใหม่");
  }
}

// ─── Athletes ─────────────────────────────────────────────────────────────────

type AthletePayload = {
  name: string;
  prefix: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  country: string;
  province: string | null;
  club: string | null;
  affiliationId: string | null;
  note: string | null;
};

async function resolveAthletes(rows: CsvRow[]): Promise<ResolvedRow<AthletePayload>[]> {
  const [athletes, affiliations] = await Promise.all([
    prisma.athlete.findMany({ where: { deletedAt: null }, select: { id: true } }),
    prisma.affiliation.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
  ]);
  const existing = new Set(athletes.map((a) => a.id));
  const affById = new Set(affiliations.map((a) => a.id));
  const affByName = new Map<string, string[]>();
  for (const a of affiliations) {
    const k = a.name.toLowerCase();
    affByName.set(k, [...(affByName.get(k) ?? []), a.id]);
  }
  const seen = new Set<string>();

  return rows.map((row, i) => {
    const errors: string[] = [];
    const { verdict: base, id } = idVerdict(pick(row, "id"), existing, seen, errors);

    const firstName = pick(row, "first_name");
    if (!firstName) errors.push("ต้องมีชื่อจริง (first_name)");

    const c = normalizeCountry(pick(row, "country"));
    const country = c.ok ? c.value : "TH";
    if (!c.ok) errors.push(c.error);
    const p = normalizeProvince(pick(row, "province"), country);
    if (!p.ok) errors.push(p.error);

    // Affiliation FK (id first, then exact name).
    let affiliationId: string | null = null;
    const affId = pick(row, "affiliation_id");
    const affName = pick(row, "affiliation_name");
    if (affId) {
      if (affById.has(affId)) affiliationId = affId;
      else errors.push(`ไม่พบ affiliation_id: ${affId}`);
    } else if (affName) {
      const ms = affByName.get(affName.toLowerCase()) ?? [];
      if (ms.length === 0) errors.push(`ไม่พบสังกัดชื่อ: ${affName}`);
      else if (ms.length > 1) errors.push(`ชื่อสังกัดซ้ำ (${ms.length}) — ระบุ affiliation_id แทน: ${affName}`);
      else affiliationId = ms[0];
    }

    const prefix = pick(row, "prefix");
    const middleName = pick(row, "middle_name");
    const lastName = pick(row, "last_name");
    const name = composeName({ prefix, firstName, middleName, lastName });

    const payload: AthletePayload | null = errors.length
      ? null
      : {
          name,
          prefix: prefix || null,
          firstName,
          middleName: middleName || null,
          lastName: lastName || null,
          country,
          province: p.ok ? p.value : null,
          club: pick(row, "club") || null,
          affiliationId,
          note: pick(row, "note") || null,
        };

    return {
      rowNumber: i + 1,
      verdict: finalVerdict(base, errors),
      label: name || firstName || "(ไม่มีชื่อ)",
      reasons: errors,
      id,
      payload,
    };
  });
}

export async function previewAthleteImport(formData: FormData): Promise<ImportPreview> {
  await requireRoot();
  const up = await readUpload(formData, ["first_name"]);
  if ("topError" in up) return { entity: "athlete", counts: { create: 0, update: 0, error: 0, total: 0 }, rows: [], topError: up.topError };
  return toPreview("athlete", await resolveAthletes(up.rows));
}

export async function commitAthleteImport(formData: FormData): Promise<CommitResult> {
  const me = await requireRoot();
  const up = await readUpload(formData, ["first_name"]);
  if ("topError" in up) throw new Error(up.topError);
  const resolved = await resolveAthletes(up.rows);
  assertNoErrors(resolved);

  const ops = resolved.map((r) =>
    r.verdict === "create"
      ? prisma.athlete.create({ data: { ...r.payload!, createdById: me.id, updatedById: me.id } })
      : prisma.athlete.update({ where: { id: r.id! }, data: { ...r.payload!, updatedById: me.id } }),
  );
  await prisma.$transaction(ops, { timeout: 30000, maxWait: 15000 });

  const created = resolved.filter((r) => r.verdict === "create").length;
  const updated = resolved.length - created;
  await logCurrentAdmin(ActivityLogAction.ATHLETES_BULK_IMPORTED, "Athlete", "*", { created, updated });
  revalidatePath("/admin/athletes");
  return { created, updated };
}

// ─── Affiliations ───────────────────────────────────────────────────────────

type AffiliationPayload = {
  name: string;
  country: string;
  province: string | null;
  headJudgeId: string | null;
  joinedAt: Date | null;
  note: string | null;
};

async function resolveAffiliations(rows: CsvRow[]): Promise<ResolvedRow<AffiliationPayload>[]> {
  const [affiliations, judges] = await Promise.all([
    prisma.affiliation.findMany({ where: { deletedAt: null }, select: { id: true } }),
    prisma.judge.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
  ]);
  const existing = new Set(affiliations.map((a) => a.id));
  const judgeById = new Set(judges.map((j) => j.id));
  const judgeByName = new Map<string, string[]>();
  for (const j of judges) {
    const k = j.name.toLowerCase();
    judgeByName.set(k, [...(judgeByName.get(k) ?? []), j.id]);
  }
  const seen = new Set<string>();

  return rows.map((row, i) => {
    const errors: string[] = [];
    const { verdict: base, id } = idVerdict(pick(row, "id"), existing, seen, errors);

    const name = pick(row, "name");
    if (!name) errors.push("ต้องมีชื่อสังกัด (name)");

    const c = normalizeCountry(pick(row, "country"));
    const country = c.ok ? c.value : "TH";
    if (!c.ok) errors.push(c.error);
    const p = normalizeProvince(pick(row, "province"), country);
    if (!p.ok) errors.push(p.error);
    const d = parseDateOnly(pick(row, "joined_at"));
    if (!d.ok) errors.push(d.error);

    // Head judge FK (id first, then exact name).
    let headJudgeId: string | null = null;
    const hjId = pick(row, "head_judge_id");
    const hjName = pick(row, "head_judge_name");
    if (hjId) {
      if (judgeById.has(hjId)) headJudgeId = hjId;
      else errors.push(`ไม่พบ head_judge_id: ${hjId}`);
    } else if (hjName) {
      const ms = judgeByName.get(hjName.toLowerCase()) ?? [];
      if (ms.length === 0) errors.push(`ไม่พบกรรมการชื่อ: ${hjName}`);
      else if (ms.length > 1) errors.push(`ชื่อกรรมการซ้ำ (${ms.length}) — ระบุ head_judge_id แทน: ${hjName}`);
      else headJudgeId = ms[0];
    }

    const payload: AffiliationPayload | null = errors.length
      ? null
      : {
          name,
          country,
          province: p.ok ? p.value : null,
          headJudgeId,
          joinedAt: d.ok ? d.value : null,
          note: pick(row, "note") || null,
        };

    return {
      rowNumber: i + 1,
      verdict: finalVerdict(base, errors),
      label: name || "(ไม่มีชื่อ)",
      reasons: errors,
      id,
      payload,
    };
  });
}

export async function previewAffiliationImport(formData: FormData): Promise<ImportPreview> {
  await requireRoot();
  const up = await readUpload(formData, ["name"]);
  if ("topError" in up) return { entity: "affiliation", counts: { create: 0, update: 0, error: 0, total: 0 }, rows: [], topError: up.topError };
  return toPreview("affiliation", await resolveAffiliations(up.rows));
}

export async function commitAffiliationImport(formData: FormData): Promise<CommitResult> {
  const me = await requireRoot();
  const up = await readUpload(formData, ["name"]);
  if ("topError" in up) throw new Error(up.topError);
  const resolved = await resolveAffiliations(up.rows);
  assertNoErrors(resolved);

  const ops = resolved.map((r) =>
    r.verdict === "create"
      ? prisma.affiliation.create({ data: { ...r.payload!, createdById: me.id, updatedById: me.id } })
      : prisma.affiliation.update({ where: { id: r.id! }, data: { ...r.payload!, updatedById: me.id } }),
  );
  await prisma.$transaction(ops, { timeout: 30000, maxWait: 15000 });

  const created = resolved.filter((r) => r.verdict === "create").length;
  const updated = resolved.length - created;
  await logCurrentAdmin(ActivityLogAction.AFFILIATIONS_BULK_IMPORTED, "Affiliation", "*", { created, updated });
  revalidatePath("/admin/affiliations");
  return { created, updated };
}

// ─── Judges (org/dept auto-create) ────────────────────────────────────────────

type OrgSpec = { kind: "none" } | { kind: "id"; id: string } | { kind: "create"; name: string };
type DeptSpec = { kind: "none" } | { kind: "id"; id: string } | { kind: "create"; name: string };

type JudgeFields = {
  name: string;
  prefix: string | null;
  firstName: string;
  middleName: string | null;
  lastName: string | null;
  country: string;
  province: string | null;
  status: "ACTIVE" | "INACTIVE";
  note: string | null;
};

type JudgeRow = {
  rowNumber: number;
  verdict: RowVerdict;
  label: string;
  reasons: string[];
  id: string | null;
  fields: JudgeFields | null;
  org: OrgSpec;
  dept: DeptSpec;
};

async function resolveJudges(rows: CsvRow[]): Promise<JudgeRow[]> {
  const [judges, orgs, depts] = await Promise.all([
    prisma.judge.findMany({ where: { deletedAt: null }, select: { id: true } }),
    prisma.organization.findMany({ where: { deletedAt: null }, select: { id: true, name: true } }),
    prisma.department.findMany({ where: { deletedAt: null }, select: { id: true, name: true, organizationId: true } }),
  ]);
  const existing = new Set(judges.map((j) => j.id));
  const orgById = new Set(orgs.map((o) => o.id));
  const orgByName = new Map<string, string[]>();
  for (const o of orgs) {
    const k = o.name.toLowerCase();
    orgByName.set(k, [...(orgByName.get(k) ?? []), o.id]);
  }
  const deptById = new Map(depts.map((d) => [d.id, { orgId: d.organizationId, name: d.name }]));
  const deptByKey = new Map(depts.map((d) => [`${d.organizationId}::${d.name.toLowerCase()}`, d.id]));
  const seen = new Set<string>();

  return rows.map((row, i): JudgeRow => {
    const errors: string[] = [];
    const notes: string[] = [];
    const { verdict: base, id } = idVerdict(pick(row, "id"), existing, seen, errors);

    const firstName = pick(row, "first_name");
    if (!firstName) errors.push("ต้องมีชื่อจริง (first_name)");

    const c = normalizeCountry(pick(row, "country"));
    const country = c.ok ? c.value : "TH";
    if (!c.ok) errors.push(c.error);
    const p = normalizeProvince(pick(row, "province"), country);
    if (!p.ok) errors.push(p.error);
    const s = normalizeJudgeStatus(pick(row, "status"));
    if (!s.ok) errors.push(s.error);

    // Organization.
    let org: OrgSpec = { kind: "none" };
    const orgId = pick(row, "organization_id");
    const orgName = pick(row, "organization_name");
    if (orgId) {
      if (orgById.has(orgId)) org = { kind: "id", id: orgId };
      else errors.push(`ไม่พบ organization_id: ${orgId}`);
    } else if (orgName) {
      const ms = orgByName.get(orgName.toLowerCase()) ?? [];
      if (ms.length === 0) { org = { kind: "create", name: orgName }; notes.push(`จะสร้างองค์กรใหม่: ${orgName}`); }
      else if (ms.length > 1) errors.push(`ชื่อองค์กรซ้ำ (${ms.length}) — ระบุ organization_id แทน: ${orgName}`);
      else org = { kind: "id", id: ms[0] };
    }

    // Department (depends on org; a department_id implies its own org).
    let dept: DeptSpec = { kind: "none" };
    const deptId = pick(row, "department_id");
    const deptName = pick(row, "department_name");
    if (deptId) {
      const d = deptById.get(deptId);
      if (!d) errors.push(`ไม่พบ department_id: ${deptId}`);
      else {
        dept = { kind: "id", id: deptId };
        if (org.kind === "id" && org.id !== d.orgId) errors.push("department ไม่ได้อยู่ในองค์กรที่ระบุ");
        else if (org.kind === "create") errors.push("organization_name ขัดกับองค์กรของ department_id");
        else org = { kind: "id", id: d.orgId }; // adopt the department's organization
      }
    } else if (deptName) {
      if (org.kind === "none") {
        errors.push("ต้องระบุองค์กร (organization) เมื่อระบุ department");
      } else if (org.kind === "id") {
        const did = deptByKey.get(`${org.id}::${deptName.toLowerCase()}`);
        if (did) dept = { kind: "id", id: did };
        else { dept = { kind: "create", name: deptName }; notes.push(`จะสร้างแผนกใหม่: ${deptName}`); }
      } else {
        dept = { kind: "create", name: deptName }; notes.push(`จะสร้างแผนกใหม่: ${deptName}`);
      }
    }

    const prefix = pick(row, "prefix");
    const middleName = pick(row, "middle_name");
    const lastName = pick(row, "last_name");
    const name = composeName({ prefix, firstName, middleName, lastName });

    const fields: JudgeFields | null = errors.length
      ? null
      : {
          name,
          prefix: prefix || null,
          firstName,
          middleName: middleName || null,
          lastName: lastName || null,
          country,
          province: p.ok ? p.value : null,
          status: s.ok ? s.value : "ACTIVE",
          note: pick(row, "note") || null,
        };

    return {
      rowNumber: i + 1,
      verdict: finalVerdict(base, errors),
      label: name || firstName || "(ไม่มีชื่อ)",
      reasons: [...errors, ...notes],
      id,
      fields,
      org,
      dept,
    };
  });
}

export async function previewJudgeImport(formData: FormData): Promise<ImportPreview> {
  await requireRoot();
  const up = await readUpload(formData, ["first_name"]);
  if ("topError" in up) return { entity: "judge", counts: { create: 0, update: 0, error: 0, total: 0 }, rows: [], topError: up.topError };
  const resolved = await resolveJudges(up.rows);
  return {
    entity: "judge",
    counts: {
      create: resolved.filter((r) => r.verdict === "create").length,
      update: resolved.filter((r) => r.verdict === "update").length,
      error: resolved.filter((r) => r.verdict === "error").length,
      total: resolved.length,
    },
    rows: resolved.map((r) => ({ rowNumber: r.rowNumber, verdict: r.verdict, label: r.label, reasons: r.reasons })),
  };
}

export async function commitJudgeImport(formData: FormData): Promise<CommitResult> {
  const me = await requireRoot();
  const up = await readUpload(formData, ["first_name"]);
  if ("topError" in up) throw new Error(up.topError);
  const resolved = await resolveJudges(up.rows);
  if (resolved.some((r) => r.verdict === "error")) {
    throw new Error("มีแถวที่ไม่ผ่านการตรวจสอบ — กรุณาแก้ไขไฟล์แล้วลองใหม่");
  }

  let created = 0;
  let updated = 0;

  await prisma.$transaction(
    async (tx) => {
      const orgCache = new Map<string, string>(); // nameLower → id
      const deptCache = new Map<string, string>(); // `${orgId}::${nameLower}` → id

      const resolveOrgId = async (org: OrgSpec): Promise<string | null> => {
        if (org.kind === "none") return null;
        if (org.kind === "id") return org.id;
        const key = org.name.toLowerCase();
        const cached = orgCache.get(key);
        if (cached) return cached;
        const found = await tx.organization.findFirst({
          where: { name: org.name, deletedAt: null },
          select: { id: true },
        });
        const orgId = found
          ? found.id
          : (await tx.organization.create({
              data: { name: org.name, createdById: me.id, updatedById: me.id },
              select: { id: true },
            })).id;
        orgCache.set(key, orgId);
        return orgId;
      };

      const resolveDeptId = async (dept: DeptSpec, orgId: string | null): Promise<string | null> => {
        if (dept.kind === "none") return null;
        if (dept.kind === "id") return dept.id;
        if (!orgId) return null; // unreachable: resolve required an org for create
        const key = `${orgId}::${dept.name.toLowerCase()}`;
        const cached = deptCache.get(key);
        if (cached) return cached;
        const d = await tx.department.upsert({
          where: { organizationId_name: { organizationId: orgId, name: dept.name } },
          create: { organizationId: orgId, name: dept.name, createdById: me.id, updatedById: me.id },
          update: {},
          select: { id: true },
        });
        deptCache.set(key, d.id);
        return d.id;
      };

      for (const r of resolved) {
        const organizationId = await resolveOrgId(r.org);
        const departmentId = await resolveDeptId(r.dept, organizationId);
        const data = { ...r.fields!, organizationId, departmentId };
        if (r.verdict === "create") {
          await tx.judge.create({ data: { ...data, createdById: me.id, updatedById: me.id } });
          created++;
        } else {
          await tx.judge.update({ where: { id: r.id! }, data: { ...data, updatedById: me.id } });
          updated++;
        }
      }
    },
    { timeout: 60000, maxWait: 15000 },
  );

  await logCurrentAdmin(ActivityLogAction.JUDGES_BULK_IMPORTED, "Judge", "*", { created, updated });
  revalidatePath("/admin/judges");
  return { created, updated };
}
