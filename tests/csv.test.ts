import { describe, it, expect } from "vitest";
import { escapeCsv, toCsv } from "@/lib/csv/serialize";
import { parseCsv, pick } from "@/lib/csv/parse";
import {
  normalizeCountry,
  normalizeProvince,
  parseDateOnly,
  normalizeJudgeStatus,
} from "@/lib/csv/normalize";

describe("serialize", () => {
  it("escapes commas, quotes, newlines; passes plain/empty", () => {
    expect(escapeCsv("plain")).toBe("plain");
    expect(escapeCsv("a,b")).toBe('"a,b"');
    expect(escapeCsv('he said "hi"')).toBe('"he said ""hi"""');
    expect(escapeCsv("line1\nline2")).toBe('"line1\nline2"');
    expect(escapeCsv(null)).toBe("");
    expect(escapeCsv(undefined)).toBe("");
    expect(escapeCsv(5)).toBe("5");
  });

  it("toCsv prepends BOM and joins with CRLF", () => {
    const out = toCsv(["id", "name"], [["1", "ก,ข"]]);
    expect(out.startsWith("﻿")).toBe(true);
    expect(out).toBe('﻿id,name\r\n1,"ก,ข"');
  });
});

describe("parse", () => {
  it("lowercases/trims headers, strips BOM, trims cells", () => {
    const { rows, headers } = parseCsv("﻿ ID , First_Name \r\n cuid1 , สมชาย ");
    expect(headers).toContain("id");
    expect(headers).toContain("first_name");
    expect(rows[0].id).toBe("cuid1");
    expect(rows[0].first_name).toBe("สมชาย");
  });

  it("handles quoted fields with embedded comma + newline", () => {
    const { rows } = parseCsv('id,note\r\n1,"a, b\nc"\r\n,plain');
    expect(rows).toHaveLength(2);
    expect(rows[0].note).toBe("a, b\nc");
    expect(pick(rows[1], "id")).toBe("");
    expect(pick(rows[1], "note")).toBe("plain");
  });

  it("pick returns '' for missing columns", () => {
    const { rows } = parseCsv("id\n1");
    expect(pick(rows[0], "nope")).toBe("");
  });

  it("skips fully empty lines", () => {
    const { rows } = parseCsv("id\n1\n\n2\n");
    expect(rows.map((r) => r.id)).toEqual(["1", "2"]);
  });
});

describe("normalizeCountry", () => {
  it("accepts code, English name, empty (→TH); rejects junk", () => {
    expect(normalizeCountry("th")).toEqual({ ok: true, value: "TH" });
    expect(normalizeCountry("US")).toEqual({ ok: true, value: "US" });
    expect(normalizeCountry("Thailand")).toEqual({ ok: true, value: "TH" });
    expect(normalizeCountry("")).toEqual({ ok: true, value: "TH" });
    expect(normalizeCountry("ZZ").ok).toBe(false);
  });
});

describe("normalizeProvince", () => {
  it("accepts canonical Thai + English (→Thai), null when empty", () => {
    expect(normalizeProvince("กรุงเทพมหานคร", "TH")).toEqual({ ok: true, value: "กรุงเทพมหานคร" });
    expect(normalizeProvince("Bangkok", "TH")).toEqual({ ok: true, value: "กรุงเทพมหานคร" });
    expect(normalizeProvince("", "TH")).toEqual({ ok: true, value: null });
  });
  it("rejects unknown province and any province for non-TH", () => {
    expect(normalizeProvince("Nowhere", "TH").ok).toBe(false);
    expect(normalizeProvince("Bangkok", "US").ok).toBe(false);
    expect(normalizeProvince("", "US")).toEqual({ ok: true, value: null });
  });
});

describe("parseDateOnly", () => {
  it("accepts YYYY-MM-DD, empty→null, rejects bad", () => {
    const r = parseDateOnly("2025-03-15");
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.value?.toISOString().slice(0, 10)).toBe("2025-03-15");
    expect(parseDateOnly("")).toEqual({ ok: true, value: null });
    expect(parseDateOnly("15/03/2025").ok).toBe(false);
    expect(parseDateOnly("2025-13-40").ok).toBe(false);
  });
});

describe("normalizeJudgeStatus", () => {
  it("case-insensitive, empty→ACTIVE, rejects junk", () => {
    expect(normalizeJudgeStatus("active")).toEqual({ ok: true, value: "ACTIVE" });
    expect(normalizeJudgeStatus("INACTIVE")).toEqual({ ok: true, value: "INACTIVE" });
    expect(normalizeJudgeStatus("")).toEqual({ ok: true, value: "ACTIVE" });
    expect(normalizeJudgeStatus("foo").ok).toBe(false);
  });
});
