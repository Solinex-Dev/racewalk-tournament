"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Building2, ChevronDown, Plus, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  createOrganization,
  updateOrganization,
  deleteOrganization,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/app/actions/organizations";

type OrgNode = { id: string; name: string; departments: { id: string; name: string }[] };
type Target = { kind: "org" | "dept"; id: string; name: string };

export function OrgDepartmentManager({ organizations }: Readonly<{ organizations: OrgNode[] }>) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [isPending, startTransition] = React.useTransition();
  const [newOrgName, setNewOrgName] = React.useState("");
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [newDeptName, setNewDeptName] = React.useState<Record<string, string>>({});

  // Rename + delete go through dialogs (no native prompt/confirm).
  const [renameTarget, setRenameTarget] = React.useState<Target | null>(null);
  const [renameValue, setRenameValue] = React.useState("");
  const [deleteTarget, setDeleteTarget] = React.useState<Target | null>(null);

  const run = (fn: () => Promise<unknown>, ok: string) =>
    startTransition(async () => {
      try {
        await fn();
        toast.success(ok);
        router.refresh();
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "เกิดข้อผิดพลาด");
      }
    });

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  const addOrg = () => {
    const name = newOrgName.trim();
    if (!name) return;
    run(async () => {
      await createOrganization({ name });
      setNewOrgName("");
    }, "สร้างองค์กรเรียบร้อย");
  };

  const addDept = (orgId: string) => {
    const name = (newDeptName[orgId] ?? "").trim();
    if (!name) return;
    run(async () => {
      await createDepartment({ organizationId: orgId, name });
      setNewDeptName((p) => ({ ...p, [orgId]: "" }));
    }, "สร้างแผนกเรียบร้อย");
  };

  const openRename = (target: Target) => {
    setRenameValue(target.name);
    setRenameTarget(target);
  };

  const submitRename = () => {
    if (!renameTarget) return;
    const target = renameTarget;
    const name = renameValue.trim();
    setRenameTarget(null);
    if (!name || name === target.name) return;
    run(
      () =>
        target.kind === "org"
          ? updateOrganization(target.id, { name })
          : updateDepartment(target.id, { name }),
      target.kind === "org" ? "เปลี่ยนชื่อองค์กรเรียบร้อย" : "เปลี่ยนชื่อแผนกเรียบร้อย",
    );
  };

  const submitDelete = () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setDeleteTarget(null);
    run(
      () => (target.kind === "org" ? deleteOrganization(target.id) : deleteDepartment(target.id)),
      target.kind === "org" ? "ลบองค์กรเรียบร้อย" : "ลบแผนกเรียบร้อย",
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="rounded-xl border-slate-200 text-sm">
            <Building2 className="mr-1.5 h-4 w-4" /> จัดการแผนก / องค์กร
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[85vh] overflow-y-auto border-slate-200 sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">จัดการแผนก / องค์กร</DialogTitle>
            <DialogDescription className="text-left text-xs text-slate-600">
              องค์กร (เช่น สมาคมกรีฑาฯ) และแผนกภายใต้องค์กร — ใช้ซ้ำตอนเพิ่มกรรมการ ไม่ต้องพิมพ์ใหม่ทุกครั้ง
            </DialogDescription>
          </DialogHeader>

          {/* Add organization */}
          <div className="flex items-center gap-2">
            <Input
              value={newOrgName}
              onChange={(e) => setNewOrgName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addOrg();
                }
              }}
              placeholder="ชื่อองค์กรใหม่…"
              className="h-9 rounded-xl text-sm"
              disabled={isPending}
            />
            <Button
              type="button"
              onClick={addOrg}
              disabled={isPending || !newOrgName.trim()}
              className="h-9 shrink-0 rounded-xl text-sm"
            >
              <Plus className="mr-1 h-4 w-4" /> เพิ่มองค์กร
            </Button>
          </div>

          <div className="space-y-2">
            {organizations.length === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">ยังไม่มีองค์กร — เพิ่มได้ที่ช่องด้านบน</p>
            ) : (
              organizations.map((org) => {
                const isOpen = expanded.has(org.id);
                return (
                  <div key={org.id} className="rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 px-3 py-2">
                      <button
                        type="button"
                        onClick={() => toggle(org.id)}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      >
                        <ChevronDown
                          className={cn("h-4 w-4 shrink-0 text-slate-400 transition-transform", isOpen && "rotate-180")}
                        />
                        <span className="truncate text-sm font-medium text-slate-900">{org.name}</span>
                        <span className="shrink-0 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500">
                          {org.departments.length} แผนก
                        </span>
                      </button>
                      <div className="flex shrink-0 items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openRename({ kind: "org", id: org.id, name: org.name })}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                          title="เปลี่ยนชื่อ"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ kind: "org", id: org.id, name: org.name })}
                          disabled={isPending}
                          className="rounded-md p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                          title="ลบองค์กร"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-1.5 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
                        {org.departments.map((d) => (
                          <div
                            key={d.id}
                            className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5"
                          >
                            <span className="truncate text-xs text-slate-700">{d.name}</span>
                            <div className="flex shrink-0 items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openRename({ kind: "dept", id: d.id, name: d.name })}
                                disabled={isPending}
                                className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                                title="เปลี่ยนชื่อ"
                              >
                                <Pencil className="h-3 w-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteTarget({ kind: "dept", id: d.id, name: d.name })}
                                disabled={isPending}
                                className="rounded-md p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                                title="ลบแผนก"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 pt-1">
                          <Input
                            value={newDeptName[org.id] ?? ""}
                            onChange={(e) => setNewDeptName((p) => ({ ...p, [org.id]: e.target.value }))}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                addDept(org.id);
                              }
                            }}
                            placeholder="ชื่อแผนกใหม่…"
                            className="h-8 rounded-lg text-xs"
                            disabled={isPending}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => addDept(org.id)}
                            disabled={isPending || !(newDeptName[org.id] ?? "").trim()}
                            className="h-8 shrink-0 rounded-lg border-slate-200 text-xs"
                          >
                            <Plus className="mr-1 h-3.5 w-3.5" /> แผนก
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Rename dialog */}
      <Dialog open={renameTarget !== null} onOpenChange={(o) => !o && setRenameTarget(null)}>
        <DialogContent className="border-slate-200 sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-left text-slate-900">
              {renameTarget?.kind === "org" ? "เปลี่ยนชื่อองค์กร" : "เปลี่ยนชื่อแผนก"}
            </DialogTitle>
          </DialogHeader>
          <div className="py-1">
            <Input
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitRename();
                }
              }}
              className="rounded-xl text-sm"
              disabled={isPending}
            />
          </div>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              className="rounded-xl border-slate-200"
              onClick={() => setRenameTarget(null)}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="rounded-xl bg-slate-900 text-white hover:bg-slate-800"
              disabled={!renameValue.trim()}
              onClick={submitRename}
            >
              บันทึก
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => !o && setDeleteTarget(null)}
        title={deleteTarget?.kind === "org" ? "ลบองค์กร" : "ลบแผนก"}
        description={
          deleteTarget?.kind === "org" ? (
            <>
              ลบองค์กร <span className="font-medium text-slate-900">{deleteTarget?.name}</span>{" "}
              และแผนกทั้งหมดภายใต้องค์กรนี้? การลบไม่สามารถย้อนกลับได้
            </>
          ) : (
            <>
              ลบแผนก <span className="font-medium text-slate-900">{deleteTarget?.name}</span>?
            </>
          )
        }
        destructive
        confirmText="ลบ"
        isPending={isPending}
        onConfirm={submitDelete}
      />
    </>
  );
}
