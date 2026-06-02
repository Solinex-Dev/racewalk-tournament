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
import { Search, ChevronLeft, ChevronRight, Eye } from "lucide-react";

type Affiliation = {
  id: string;
  name: string;
  head_of_affiliation: string;
  join_at: string;
  country?: string;
  province?: string;
  note?: string;
};

type AffiliationsListProps = {
  affiliations: Affiliation[];
};

const ITEMS_PER_PAGE = 10;

export function AffiliationsList({ affiliations }: AffiliationsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(affiliations.map((a) => a.country).filter(Boolean) as string[])
    ).sort();
    return uniqueCountries;
  }, [affiliations]);

  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(affiliations.map((a) => a.province).filter(Boolean) as string[])
    ).sort();
    return uniqueProvinces;
  }, [affiliations]);

  // Filter and search logic
  const filteredAffiliations = useMemo(() => {
    return affiliations.filter((affiliation) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        affiliation.name.toLowerCase().includes(searchLower) ||
        affiliation.head_of_affiliation.toLowerCase().includes(searchLower) ||
        affiliation.country?.toLowerCase().includes(searchLower) ||
        affiliation.province?.toLowerCase().includes(searchLower) ||
        affiliation.note?.toLowerCase().includes(searchLower);

      // Country filter
      const matchesCountry =
        countryFilter === "all" || affiliation.country === countryFilter;

      // Province filter
      const matchesProvince =
        provinceFilter === "all" || affiliation.province === provinceFilter;

      return matchesSearch && matchesCountry && matchesProvince;
    });
  }, [affiliations, searchQuery, countryFilter, provinceFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredAffiliations.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAffiliations = filteredAffiliations.slice(
    startIndex,
    endIndex
  );

  // Reset to page 1 when filters change
  const handleFilterChange = (
    setter: (value: string) => void,
    value: string
  ) => {
    setter(value);
    setCurrentPage(1);
  };

  const hasActiveFilters =
    Boolean(searchQuery) ||
    countryFilter !== "all" ||
    provinceFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCountryFilter("all");
    setProvinceFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <ListFiltersPanel
        filteredCount={filteredAffiliations.length}
        totalCount={affiliations.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาด้วย ชื่อสังกัด, ผู้ดูแล, ประเทศ, จังหวัด, หมายเหตุ..."
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
              ประเทศ
            </label>
            <Select
              value={countryFilter}
              onValueChange={(value) =>
                handleFilterChange(setCountryFilter, value)
              }
            >
              <SelectTrigger className="h-8 rounded-lg text-sm">
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

          <div className="space-y-1">
            <label className="text-[11px] font-medium text-slate-600">
              จังหวัด
            </label>
            <Select
              value={provinceFilter}
              onValueChange={(value) =>
                handleFilterChange(setProvinceFilter, value)
              }
            >
              <SelectTrigger className="h-8 rounded-lg text-sm">
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
        </div>
      </ListFiltersPanel>

      {/* Affiliations Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-200">
        <CardContent className="p-0">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">ชื่อสังกัด / สโมสร</th>
                  <th className="px-4 py-3 text-left">ประเทศ</th>
                  <th className="px-4 py-3 text-left">จังหวัด</th>
                  <th className="px-4 py-3 text-left">ผู้ดูแล / หัวหน้าสังกัด</th>
                  <th className="px-4 py-3 text-left">วันที่เข้าร่วม</th>
                  {/* <th className="px-4 py-3 text-left">หมายเหตุ</th> */}
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedAffiliations.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูลสังกัดที่ตรงกับเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  paginatedAffiliations.map((affiliation) => (
                    <tr key={affiliation.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {affiliation.name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.country || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.province || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.head_of_affiliation || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.join_at || "-"}
                      </td>
                      {/* <td className="px-4 py-3 text-xs text-slate-600">
                        {affiliation.note || "-"}
                      </td> */}
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/affiliations/${affiliation.id}`}>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 w-8 rounded-lg border-slate-200 p-0 text-slate-500 hover:text-slate-700"
                            aria-label="ดู / แก้ไข"
                            title="ดู / แก้ไข"
                          >
                            <Eye className="h-4 w-4" />
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

