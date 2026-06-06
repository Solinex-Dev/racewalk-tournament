"use client";

import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { PREFIX_OPTIONS } from "@/lib/person-name";

const PREFIX_COMBO = PREFIX_OPTIONS.map((p) => ({ value: p, label: p }));

export type PersonNamePatch = Partial<{
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
}>;

/**
 * Shared prefix / first name / middle name / last name inputs used by the
 * athlete, judge and admin forms. The prefix is a creatable combobox so presets
 * (นาย/นาง/นางสาว) or custom titles (ดร., ผศ.ดร. …) can be used. Middle name is
 * optional.
 */
export function PersonNameFields({
  prefix,
  firstName,
  middleName,
  lastName,
  onChange,
  disabled,
  firstNameRequired = true,
}: Readonly<{
  prefix: string;
  firstName: string;
  middleName: string;
  lastName: string;
  onChange: (patch: PersonNamePatch) => void;
  disabled?: boolean;
  firstNameRequired?: boolean;
}>) {
  return (
    <div className="grid gap-4 sm:grid-cols-[9rem_1fr_1fr_1fr]">
      <div className="space-y-1.5">
        <label htmlFor="person-prefix" className="block text-xs font-medium text-slate-800">คำนำหน้า</label>
        <Combobox
          id="person-prefix"
          options={PREFIX_COMBO}
          value={prefix}
          onChange={(v) => onChange({ prefix: v })}
          creatable
          clearable
          disabled={disabled}
          placeholder="ไม่ระบุ"
          searchPlaceholder="นาย / ดร. / พิมพ์เอง…"
          emptyText="พิมพ์เพื่อใช้คำนำหน้าเอง"
        />
      </div>
      <div className="space-y-1.5">
        <label className="block text-xs font-medium text-slate-800">
          ชื่อจริง {firstNameRequired && <span className="text-red-500">*</span>}
        </label>
        <Input
          required={firstNameRequired}
          value={firstName}
          onChange={(e) => onChange({ firstName: e.target.value })}
          placeholder="เช่น สมชาย"
          className="rounded-xl text-sm"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="person-middle-name" className="block text-xs font-medium text-slate-800">ชื่อกลาง</label>
        <Input
          id="person-middle-name"
          value={middleName}
          onChange={(e) => onChange({ middleName: e.target.value })}
          placeholder="(ถ้ามี)"
          className="rounded-xl text-sm"
          disabled={disabled}
        />
      </div>
      <div className="space-y-1.5">
        <label htmlFor="person-last-name" className="block text-xs font-medium text-slate-800">นามสกุล</label>
        <Input
          id="person-last-name"
          value={lastName}
          onChange={(e) => onChange({ lastName: e.target.value })}
          placeholder="เช่น ใจดี"
          className="rounded-xl text-sm"
          disabled={disabled}
        />
      </div>
    </div>
  );
}
