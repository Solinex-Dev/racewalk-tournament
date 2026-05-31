"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ListFiltersPanel } from "@/components/admin/list-filters-panel";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type Admin = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: "active" | "inactive";
};

type AdminsListProps = {
  admins: Admin[];
};

const ITEMS_PER_PAGE = 10;

export function AdminsList({ admins }: AdminsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const roles = useMemo(() => {
    const uniqueRoles = Array.from(
      new Set(admins.map((a) => a.role).filter(Boolean) as string[])
    ).sort();
    return uniqueRoles;
  }, [admins]);

  // Filter and search logic
  const filteredAdmins = useMemo(() => {
    return admins.filter((admin) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        admin.name.toLowerCase().includes(searchLower) ||
        admin.email.toLowerCase().includes(searchLower) ||
        admin.role.toLowerCase().includes(searchLower);

      // Role filter
      const matchesRole = roleFilter === "all" || admin.role === roleFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" || admin.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [admins, searchQuery, roleFilter, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAdmins.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAdmins = filteredAdmins.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) || roleFilter !== "all" || statusFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setRoleFilter("all");
    setStatusFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <ListFiltersPanel
        filteredCount={filteredAdmins.length}
        totalCount={admins.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาด้วย ชื่อ, อีเมล, บทบาท..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg pl-8 text-sm"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              สิทธิ์ / บทบาท
            </label>
            <Select
              value={roleFilter}
              onValueChange={(value) =>
                handleFilterChange(setRoleFilter, value)
              }
            >
              <SelectTrigger className="h-8 rounded-lg text-sm">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                {roles.map((role) => (
                  <SelectItem key={role} value={role}>
                    {role}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              สถานะ
            </label>
            <Select
              value={statusFilter}
              onValueChange={(value) =>
                handleFilterChange(setStatusFilter, value)
              }
            >
              <SelectTrigger className="h-8 rounded-lg text-sm">
                <SelectValue placeholder="ทั้งหมด" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">ทั้งหมด</SelectItem>
                <SelectItem value="active">ใช้งานอยู่</SelectItem>
                <SelectItem value="inactive">ปิดการใช้งาน</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </ListFiltersPanel>

      {/* Admins Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-200">
        <CardContent className="p-0">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">ชื่อ</th>
                  <th className="px-4 py-3 text-left">อีเมล</th>
                  <th className="px-4 py-3 text-left">สิทธิ์ / บทบาท</th>
                  <th className="px-4 py-3 text-left">สถานะ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedAdmins.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูล Admin ที่ตรงกับเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  paginatedAdmins.map((admin) => (
                    <tr key={admin.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {admin.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {admin.email}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {admin.role}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            admin.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {admin.status === "active"
                            ? "ใช้งานอยู่"
                            : "ปิดการใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/admins/${admin.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-lg border-slate-200 text-xs"
                          >
                            ดู / แก้ไข
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
              <p className="text-xs text-slate-600">
                หน้า {currentPage} จาก {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8 rounded-lg text-xs"
                >
                  <ChevronLeft className="h-4 w-4" />
                  ก่อนหน้า
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="h-8 rounded-lg text-xs"
                >
                  ถัดไป
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

