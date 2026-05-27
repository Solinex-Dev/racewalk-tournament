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
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type Judge = {
  id: string;
  first_name: string;
  last_name: string;
  department: string;
  organization: string;
  country?: string;
  province?: string;
  status: "active" | "inactive";
  note?: string;
};

type JudgesListProps = {
  judges: Judge[];
};

const ITEMS_PER_PAGE = 10;

export function JudgesList({ judges }: JudgesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [organizationFilter, setOrganizationFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(judges.map((j) => j.country).filter(Boolean) as string[])
    ).sort();
    return uniqueCountries;
  }, [judges]);

  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(judges.map((j) => j.province).filter(Boolean) as string[])
    ).sort();
    return uniqueProvinces;
  }, [judges]);

  const organizations = useMemo(() => {
    const uniqueOrganizations = Array.from(
      new Set(judges.map((j) => j.organization).filter(Boolean) as string[])
    ).sort();
    return uniqueOrganizations;
  }, [judges]);

  // Filter and search logic
  const filteredJudges = useMemo(() => {
    return judges.filter((judge) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        judge.first_name.toLowerCase().includes(searchLower) ||
        judge.last_name.toLowerCase().includes(searchLower) ||
        judge.department.toLowerCase().includes(searchLower) ||
        judge.organization.toLowerCase().includes(searchLower) ||
        judge.country?.toLowerCase().includes(searchLower) ||
        judge.province?.toLowerCase().includes(searchLower) ||
        judge.note?.toLowerCase().includes(searchLower);

      // Country filter
      const matchesCountry =
        countryFilter === "all" || judge.country === countryFilter;

      // Province filter
      const matchesProvince =
        provinceFilter === "all" || judge.province === provinceFilter;

      // Organization filter
      const matchesOrganization =
        organizationFilter === "all" ||
        judge.organization === organizationFilter;

      // Status filter
      const matchesStatus =
        statusFilter === "all" || judge.status === statusFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesProvince &&
        matchesOrganization &&
        matchesStatus
      );
    });
  }, [
    judges,
    searchQuery,
    countryFilter,
    provinceFilter,
    organizationFilter,
    statusFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredJudges.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedJudges = filteredJudges.slice(startIndex, endIndex);

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      {/* Search and Filters */}
      <Card className="rounded-2xl border-slate-200">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="ค้นหาด้วย ชื่อ, แผนก, องค์กร, ประเทศ, จังหวัด, หมายเหตุ..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 rounded-xl"
              />
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {/* Country Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  ประเทศ
                </label>
                <Select
                  value={countryFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setCountryFilter, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {countries.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Province Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  จังหวัด
                </label>
                <Select
                  value={provinceFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setProvinceFilter, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {provinces.map((province) => (
                      <SelectItem key={province} value={province}>
                        {province}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Organization Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  องค์กร / สังกัด
                </label>
                <Select
                  value={organizationFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setOrganizationFilter, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {organizations.map((organization) => (
                      <SelectItem key={organization} value={organization}>
                        {organization}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  สถานะ
                </label>
                <Select
                  value={statusFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setStatusFilter, value)
                  }
                >
                  <SelectTrigger>
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

            {/* Results count */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-600">
                แสดง {paginatedJudges.length} จาก {filteredJudges.length}{" "}
                รายการ
                {filteredJudges.length !== judges.length &&
                  ` (กรองจากทั้งหมด ${judges.length} รายการ)`}
              </p>
              {(searchQuery ||
                countryFilter !== "all" ||
                provinceFilter !== "all" ||
                organizationFilter !== "all" ||
                statusFilter !== "all") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setCountryFilter("all");
                    setProvinceFilter("all");
                    setOrganizationFilter("all");
                    setStatusFilter("all");
                    setCurrentPage(1);
                  }}
                  className="h-7 rounded-lg text-xs"
                >
                  ล้างตัวกรอง
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Judges Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-200">
        <CardContent className="p-0">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">ชื่อ - นามสกุล</th>
                  <th className="px-4 py-3 text-left">ประเทศ</th>
                  <th className="px-4 py-3 text-left">จังหวัด</th>
                  <th className="px-4 py-3 text-left">แผนก / หน่วยงาน</th>
                  <th className="px-4 py-3 text-left">องค์กร / สังกัด</th>
                  <th className="px-4 py-3 text-left">สถานะ</th>
                  <th className="px-4 py-3 text-left">หมายเหตุ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedJudges.length === 0 ? (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูลกรรมการที่ตรงกับเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  paginatedJudges.map((judge) => (
                    <tr key={judge.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {judge.first_name} {judge.last_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.country || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.province || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.department || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.organization || "-"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            judge.status === "active"
                              ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                              : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                          }`}
                        >
                          {judge.status === "active"
                            ? "ใช้งานอยู่"
                            : "ปิดการใช้งาน"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {judge.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/judges/${judge.id}`}>
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

