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
import { Search, ChevronLeft, ChevronRight, ArrowUpRight, Calendar, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type AdminEvent = {
  id: string;
  name: string;
  date: string;
  location: string;
  distance_km: string;
  status: "draft" | "scheduled" | "ongoing" | "finished";
  isCurrent?: boolean;
};

type EventsListProps = {
  events: AdminEvent[];
};

const ITEMS_PER_PAGE = 10;

const STATUS_LABEL: Record<AdminEvent["status"], string> = {
  draft: "ร่าง",
  scheduled: "กำหนดการ",
  ongoing: "กำลังดำเนินการ",
  finished: "เสร็จสิ้น",
};

export function EventsList({ events }: EventsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [dateFilterMode, setDateFilterMode] = useState<"none" | "single" | "range">("none");
  const [singleDate, setSingleDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);

  // Extract unique values for filters
  const locations = useMemo(() => {
    const uniqueLocations = Array.from(
      new Set(events.map((e) => e.location).filter(Boolean) as string[])
    ).sort();
    return uniqueLocations;
  }, [events]);

  // Filter and search logic
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search filter
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch =
        !searchQuery ||
        event.name.toLowerCase().includes(searchLower) ||
        event.location.toLowerCase().includes(searchLower) ||
        event.date.includes(searchQuery) ||
        event.distance_km.includes(searchQuery);

      // Status filter
      const matchesStatus =
        statusFilter === "all" || event.status === statusFilter;

      // Location filter
      const matchesLocation =
        locationFilter === "all" || event.location === locationFilter;

      // Date filter
      let matchesDate = true;
      if (dateFilterMode === "single" && singleDate) {
        matchesDate = event.date === singleDate;
      } else if (dateFilterMode === "range") {
        const eventDate = new Date(event.date);
        if (startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          matchesDate = eventDate >= start && eventDate <= end;
        } else if (startDate) {
          const start = new Date(startDate);
          matchesDate = eventDate >= start;
        } else if (endDate) {
          const end = new Date(endDate);
          matchesDate = eventDate <= end;
        }
      }

      return matchesSearch && matchesStatus && matchesLocation && matchesDate;
    });
  }, [events, searchQuery, statusFilter, locationFilter, dateFilterMode, singleDate, startDate, endDate]);

  // Pagination
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedEvents = filteredEvents.slice(startIndex, endIndex);

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
                placeholder="ค้นหาด้วย ชื่อ Event, สถานที่, วันที่, ระยะทาง..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 rounded-xl"
              />
            </div>

            {/* Filters */}
            <div className="grid gap-3 sm:grid-cols-2">
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
                    <SelectItem value="draft">ร่าง</SelectItem>
                    <SelectItem value="scheduled">กำหนดการ</SelectItem>
                    <SelectItem value="ongoing">กำลังดำเนินการ</SelectItem>
                    <SelectItem value="finished">เสร็จสิ้น</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Location Filter */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-slate-700">
                  สถานที่
                </label>
                <Select
                  value={locationFilter}
                  onValueChange={(value) =>
                    handleFilterChange(setLocationFilter, value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="ทั้งหมด" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">ทั้งหมด</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date Filter Section */}
            <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center gap-4">
                <label className="text-xs font-semibold text-slate-700">
                  กรองตามวันที่:
                </label>
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilterMode"
                      value="none"
                      checked={dateFilterMode === "none"}
                      onChange={() => {
                        setDateFilterMode("none");
                        setSingleDate("");
                        setStartDate("");
                        setEndDate("");
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>ไม่กรอง</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilterMode"
                      value="single"
                      checked={dateFilterMode === "single"}
                      onChange={() => {
                        setDateFilterMode("single");
                        setStartDate("");
                        setEndDate("");
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>วันที่เจาะจง</span>
                  </label>
                  <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                    <input
                      type="radio"
                      name="dateFilterMode"
                      value="range"
                      checked={dateFilterMode === "range"}
                      onChange={() => {
                        setDateFilterMode("range");
                        setSingleDate("");
                        setCurrentPage(1);
                      }}
                      className="h-4 w-4 text-blue-600 focus:ring-2 focus:ring-blue-500"
                    />
                    <span>ช่วงวันที่</span>
                  </label>
                </div>
              </div>

              {/* Single Date Input */}
              {dateFilterMode === "single" && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-700">
                    เลือกวันที่
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <Input
                      type="date"
                      value={singleDate}
                      onChange={(e) => {
                        setSingleDate(e.target.value);
                        setCurrentPage(1);
                      }}
                      className="pl-9 rounded-xl text-sm bg-white"
                    />
                  </div>
                </div>
              )}

              {/* Date Range Inputs */}
              {dateFilterMode === "range" && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      วันที่เริ่มต้น
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-slate-700">
                      วันที่สิ้นสุด
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
                      <Input
                        type="date"
                        value={endDate}
                        onChange={(e) => {
                          setEndDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="pl-9 rounded-xl text-sm bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Results count */}
            <div className="flex items-center justify-between border-t border-slate-200 pt-3">
              <p className="text-xs text-slate-600">
                แสดง {paginatedEvents.length} จาก {filteredEvents.length}{" "}
                รายการ
                {filteredEvents.length !== events.length &&
                  ` (กรองจากทั้งหมด ${events.length} รายการ)`}
              </p>
              {(searchQuery ||
                statusFilter !== "all" ||
                locationFilter !== "all" ||
                dateFilterMode !== "none") && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setLocationFilter("all");
                    setDateFilterMode("none");
                    setSingleDate("");
                    setStartDate("");
                    setEndDate("");
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

      {/* Events Table */}
      <Card className="overflow-hidden rounded-2xl border-slate-200">
        <CardContent className="p-0">
          <div className="min-w-full overflow-x-auto">
            <table className="min-w-full border-collapse text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 text-xs font-medium uppercase text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-left">ชื่อ Event</th>
                  <th className="px-4 py-3 text-left">วันที่แข่งขัน</th>
                  <th className="px-4 py-3 text-left">สถานที่</th>
                  <th className="px-4 py-3 text-left">ระยะทาง (กม.)</th>
                  <th className="px-4 py-3 text-left">สถานะ</th>
                  <th className="px-4 py-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {paginatedEvents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-sm text-slate-500"
                    >
                      ไม่พบข้อมูล Event ที่ตรงกับเงื่อนไขที่เลือก
                    </td>
                  </tr>
                ) : (
                  paginatedEvents.map((event) => (
                    <tr key={event.id} className="hover:bg-slate-50/80">
                      <td className="px-4 py-3 text-sm font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{event.name}</span>
                          {event.isCurrent && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              กิจกรรมปัจจุบัน
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.date}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.location || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {event.distance_km || "-"}
                      </td>
                      <td className="px-4 py-3 text-xs text-slate-600">
                        {STATUS_LABEL[event.status]}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex flex-wrap justify-end gap-2">
                          {/* ปุ่มสำหรับ Event ปัจจุบัน (show prominent) */}
                          {event.isCurrent && (
                            <>
                              <Link
                                href={`/events/${event.id}`}
                                target="_blank"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-emerald-300 bg-emerald-500/5 text-xs font-medium text-emerald-700 hover:bg-emerald-500/15"
                                >
                                  <span>เปิดหน้าอีเวนต์</span>
                                  <ArrowUpRight className="ml-1 h-3 w-3" />
                                </Button>
                              </Link>
                              <Link
                                href={`/judge/events/${event.id}/join`}
                                target="_blank"
                              >
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="rounded-lg border-indigo-200 bg-indigo-500/5 text-xs font-medium text-indigo-700 hover:bg-indigo-500/15"
                                >
                                  ลิงก์กรรมการ
                                </Button>
                              </Link>
                            </>
                          )}

                          {/* ปุ่ม 3 จุด สำหรับดู action ย้อนหลัง / เผื่อกรณี Event ที่ไม่ใช่กิจกรรมปัจจุบัน */}
                          {!event.isCurrent && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 rounded-full border-slate-200 p-0 text-slate-500 hover:text-slate-700"
                                  aria-label="เมนูเพิ่มเติมของ Event นี้"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-44 text-xs">
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/events/${event.id}`}
                                    target="_blank"
                                    className="flex w-full items-center justify-between"
                                  >
                                    <span>เปิดหน้าอีเวนต์</span>
                                    <ArrowUpRight className="h-3 w-3" />
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/judge/events/${event.id}/join`}
                                    target="_blank"
                                    className="flex w-full items-center"
                                  >
                                    <span>ลิงก์กรรมการ</span>
                                  </Link>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <Link href={`/admin/events/${event.id}`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-200 text-xs"
                            >
                              รายละเอียด / แก้ไข
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/report`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-slate-200 text-xs"
                            >
                              รายงาน
                            </Button>
                          </Link>
                          <Link href={`/admin/events/${event.id}/moderator`}>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg border-emerald-200 text-xs text-emerald-700 hover:bg-emerald-50"
                            >
                              Moderator
                            </Button>
                          </Link>
                        </div>
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

