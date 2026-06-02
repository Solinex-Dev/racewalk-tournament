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

type Athlete = {
  id: string;
  first_name: string;
  last_name: string;
  affiliation: string;
  country: string;
  province: string;
  club?: string;
  note?: string;
};

type AthletesListProps = {
  athletes: Athlete[];
};

const ITEMS_PER_PAGE = 10;

export function AthletesList({ athletes }: AthletesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [provinceFilter, setProvinceFilter] = useState<string>("all");
  const [affiliationFilter, setAffiliationFilter] = useState<string>("all");
  const [clubFilter, setClubFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const countries = useMemo(() => {
    const uniqueCountries = Array.from(
      new Set(athletes.map((a) => a.country).filter(Boolean) as string[])
    ).sort();
    return uniqueCountries;
  }, [athletes]);

  const provinces = useMemo(() => {
    const uniqueProvinces = Array.from(
      new Set(athletes.map((a) => a.province).filter(Boolean) as string[])
    ).sort();
    return uniqueProvinces;
  }, [athletes]);

  const affiliations = useMemo(() => {
    const uniqueAffiliations = Array.from(
      new Set(athletes.map((a) => a.affiliation).filter(Boolean) as string[])
    ).sort();
    return uniqueAffiliations;
  }, [athletes]);

  const clubs = useMemo(() => {
    const uniqueClubs = Array.from(
      new Set(athletes.map((a) => a.club).filter(Boolean) as string[])
    ).sort();
    return uniqueClubs;
  }, [athletes]);

  // Filter and search logic
  const filteredAthletes = useMemo(() => {
    return athletes.filter((athlete) => {
      // Search filter (name, affiliation, country, province, club, note)
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        athlete.first_name.toLowerCase().includes(searchLower) ||
        athlete.last_name.toLowerCase().includes(searchLower) ||
        athlete.affiliation.toLowerCase().includes(searchLower) ||
        athlete.country.toLowerCase().includes(searchLower) ||
        athlete.province.toLowerCase().includes(searchLower) ||
        athlete.club?.toLowerCase().includes(searchLower) ||
        athlete.note?.toLowerCase().includes(searchLower);

      // Country filter
      const matchesCountry =
        countryFilter === "all" || athlete.country === countryFilter;

      // Province filter
      const matchesProvince =
        provinceFilter === "all" || athlete.province === provinceFilter;

      // Affiliation filter
      const matchesAffiliation =
        affiliationFilter === "all" || athlete.affiliation === affiliationFilter;

      // Club filter
      const matchesClub = clubFilter === "all" || athlete.club === clubFilter;

      return (
        matchesSearch &&
        matchesCountry &&
        matchesProvince &&
        matchesAffiliation &&
        matchesClub
      );
    });
  }, [
    athletes,
    searchQuery,
    countryFilter,
    provinceFilter,
    affiliationFilter,
    clubFilter,
  ]);

  // Pagination
  const totalPages = Math.ceil(filteredAthletes.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedAthletes = filteredAthletes.slice(startIndex, endIndex);

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
    provinceFilter !== "all" ||
    affiliationFilter !== "all" ||
    clubFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setCountryFilter("all");
    setProvinceFilter("all");
    setAffiliationFilter("all");
    setClubFilter("all");
    setCurrentPage(1);
  };

  return (
    <div className="space-y-4">
      <ListFiltersPanel
        filteredCount={filteredAthletes.length}
        totalCount={athletes.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
          <Input
            type="text"
            placeholder="ค้นหาด้วย ชื่อ, สังกัด, ประเทศ, จังหวัด, สโมสร, หมายเหตุ..."
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setCurrentPage(1);
            }}
            className="h-8 rounded-lg pl-8 text-sm"
          />
        </div>

        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
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

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  สังกัด
                </label>
                <Select
                  value={affiliationFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setAffiliationFilter, value)
                  }
                >
                  <SelectTrigger className="h-8 rounded-lg text-sm">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {affiliations.map((affiliation) => (
                      <SelectItem key={affiliation} value={affiliation}>
                        {affiliation}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-600">
                  สโมสร
                </label>
                <Select
                  value={clubFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setClubFilter, value)
                  }
                >
                  <SelectTrigger className="h-8 rounded-lg text-sm">
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {clubs.map((club) => (
                      <SelectItem key={club} value={club}>
                        {club}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
      </ListFiltersPanel>

      {/* Athletes Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-200">
        <CardContent className="p-0">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">ชื่อ - นามสกุล</th>
                  <th className="px-4 py-3 text-left">สังกัด</th>
                  <th className="px-4 py-3 text-left">สโมสร</th>
                  <th className="px-4 py-3 text-left">ประเทศ</th>
                  <th className="px-4 py-3 text-left">จังหวัด</th>
                  <th className="px-4 py-3 text-left">หมายเหตุ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedAthletes.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูลนักกีฬาที่ตรงกับเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  paginatedAthletes.map((athlete) => (
                    <tr key={athlete.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        {athlete.first_name} {athlete.last_name}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.affiliation || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.club || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.country || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.province || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {athlete.note || "-"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Link href={`/admin/athletes/${athlete.id}`}>
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

