"use client";

import { useState, useMemo, type ReactNode } from "react";
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
import {
  Search,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Calendar,
  MoreHorizontal,
  Pencil,
  FileText,
  Radio,
} from "lucide-react";
import { ListFiltersPanel } from "@/components/admin/list-filters-panel";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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

function ActionIconTooltip({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" sideOffset={4}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}

export function EventsList({ events }: EventsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [locationFilter, setLocationFilter] = useState<string>("all");
  const [dateFilterMode, setDateFilterMode] = useState<"none" | "single" | "range">("none");
  const [singleDate, setSingleDate] = useState<string>("");
  const [startDate, setStartDate] = useState<string>("");
  const [endDate, setEndDate] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const hasActiveFilters =
    Boolean(searchQuery) ||
    statusFilter !== "all" ||
    locationFilter !== "all" ||
    dateFilterMode !== "none";

  const clearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setLocationFilter("all");
    setDateFilterMode("none");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
    setCurrentPage(1);
  };

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
      <ListFiltersPanel
        filteredCount={filteredEvents.length}
        totalCount={events.length}
        hasActiveFilters={hasActiveFilters}
        onClearFilters={clearFilters}
      >
                <div className="relative">
                  <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                  <Input
                    type="text"
                    placeholder="ชื่อ Event, สถานที่, วันที่, ระยะทาง..."
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
                        <SelectItem value="draft">ร่าง</SelectItem>
                        <SelectItem value="scheduled">กำหนดการ</SelectItem>
                        <SelectItem value="ongoing">กำลังดำเนินการ</SelectItem>
                        <SelectItem value="finished">เสร็จสิ้น</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-medium text-slate-600">
                      สถานที่
                    </label>
                    <Select
                      value={locationFilter}
                      onValueChange={(value) =>
                        handleFilterChange(setLocationFilter, value)
                      }
                    >
                      <SelectTrigger className="h-8 rounded-lg text-sm">
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

                <div className="space-y-2 rounded-lg border border-slate-200 bg-slate-50/80 p-2.5">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                    <span className="text-[11px] font-semibold text-slate-600">
                      วันที่
                    </span>
                    {(
                      [
                        ["none", "ไม่กรอง"],
                        ["single", "เจาะจง"],
                        ["range", "ช่วง"],
                      ] as const
                    ).map(([mode, label]) => (
                      <label
                        key={mode}
                        className="flex cursor-pointer items-center gap-1.5 text-[11px] text-slate-700"
                      >
                        <input
                          type="radio"
                          name="dateFilterMode"
                          value={mode}
                          checked={dateFilterMode === mode}
                          onChange={() => {
                            setDateFilterMode(mode);
                            if (mode === "none") {
                              setSingleDate("");
                              setStartDate("");
                              setEndDate("");
                            } else if (mode === "single") {
                              setStartDate("");
                              setEndDate("");
                            } else {
                              setSingleDate("");
                            }
                            setCurrentPage(1);
                          }}
                          className="h-3.5 w-3.5 text-blue-600"
                        />
                        <span>{label}</span>
                      </label>
                    ))}
                  </div>

                  {dateFilterMode === "single" && (
                    <div className="relative">
                      <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                      <Input
                        type="date"
                        value={singleDate}
                        onChange={(e) => {
                          setSingleDate(e.target.value);
                          setCurrentPage(1);
                        }}
                        className="h-8 rounded-lg bg-white pl-8 text-sm"
                      />
                    </div>
                  )}

                  {dateFilterMode === "range" && (
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="date"
                          value={startDate}
                          onChange={(e) => {
                            setStartDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="h-8 rounded-lg bg-white pl-8 text-sm"
                          aria-label="วันที่เริ่มต้น"
                        />
                      </div>
                      <div className="relative">
                        <Calendar className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
                        <Input
                          type="date"
                          value={endDate}
                          onChange={(e) => {
                            setEndDate(e.target.value);
                            setCurrentPage(1);
                          }}
                          className="h-8 rounded-lg bg-white pl-8 text-sm"
                          aria-label="วันที่สิ้นสุด"
                        />
                      </div>
                    </div>
                  )}
                </div>

      </ListFiltersPanel>

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
                          {/* LIVE badge — only while the event is actually ongoing */}
                          {event.status === "ongoing" && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold tracking-wide text-red-700">
                              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
                              LIVE
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
                          {/* Prominent live-action buttons — only while the event is ongoing */}
                          {event.status === "ongoing" && (
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
                                  <ArrowUpRight className="h-3 w-3" />
                                </Button>
                              </Link>
                            </>
                          )}

                          {/* 3-dot menu for scheduled / finished (not draft, not ongoing) */}
                          {event.status !== "ongoing" && event.status !== "draft" && (
                            <DropdownMenu>
                              <ActionIconTooltip label="เมนูเพิ่มเติม">
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
                              </ActionIconTooltip>
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
                                {event.status !== "finished" && (
                                  <DropdownMenuItem asChild>
                                    <Link
                                      href={`/judge/events/${event.id}/join`}
                                      target="_blank"
                                      className="flex w-full items-center justify-between"
                                    >
                                      <span>ลิงก์กรรมการ</span>
                                      <ArrowUpRight className="h-3 w-3" />
                                    </Link>
                                  </DropdownMenuItem>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                          <ActionIconTooltip label="รายละเอียด/แก้ไข">
                            <Link href={`/admin/events/${event.id}`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-lg border-slate-200 p-0 text-slate-500 hover:text-slate-700"
                                aria-label="รายละเอียด/แก้ไข"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </Link>
                          </ActionIconTooltip>
                          <ActionIconTooltip label="Export Report">
                            <Link href={`/admin/events/${event.id}/report`}>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-8 w-8 rounded-lg border-slate-200 p-0 text-slate-500 hover:text-slate-700"
                                aria-label="Export Report"
                              >
                                <FileText className="h-4 w-4" />
                              </Button>
                            </Link>
                          </ActionIconTooltip>
                          {event.status !== "draft" && (
                            <ActionIconTooltip label="Moderator">
                              <Link href={`/admin/events/${event.id}/moderator`}>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="h-8 w-8 rounded-lg border-emerald-200 p-0 text-emerald-700 hover:bg-emerald-50"
                                  aria-label="Moderator"
                                >
                                  <Radio className="h-4 w-4" />
                                </Button>
                              </Link>
                            </ActionIconTooltip>
                          )}
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

