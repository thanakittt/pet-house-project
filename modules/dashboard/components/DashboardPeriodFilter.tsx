"use client";

import { useCallback, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { th } from "react-day-picker/locale";
import { CalendarDays } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
} from "@/components/ui/popover";
import { Spinner } from "@/components/ui/spinner";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { formatDateOnly } from "@/lib/finance/date";
import { formatThaiDate } from "@/lib/utils";
import type { DashboardFilter, DashboardPeriod } from "../types/dashboard";

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: "DAILY", label: "รายวัน" },
  { value: "MONTHLY", label: "รายเดือน" },
  { value: "YEARLY", label: "รายปี" },
  { value: "CUSTOM", label: "กำหนดเอง" },
];

function toBangkokDate(value: string) {
  return new Date(`${value}T00:00:00+07:00`);
}

function toCalendarRange(filter: DashboardFilter): DateRange {
  return {
    from: toBangkokDate(filter.startDateValue),
    to: toBangkokDate(filter.endDateValue),
  };
}

export function DashboardPeriodFilter({ filter }: { filter: DashboardFilter }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [open, setOpen] = useState(false);
  const [draftRange, setDraftRange] = useState<DateRange>(() => toCalendarRange(filter));
  const [isPending, startTransition] = useTransition();
  const today = toBangkokDate(formatDateOnly(new Date()));
  const [currentYear, currentMonth] = formatDateOnly(today).split("-").map(Number);
  const calendarStartMonth = toBangkokDate(`${currentYear - 10}-01-01`);
  const calendarEndMonth = toBangkokDate(
    `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`,
  );

  const navigate = useCallback(
    (params: URLSearchParams) => {
      startTransition(() => router.push(`${pathname}?${params.toString()}`));
    },
    [pathname, router],
  );

  const handlePeriodChange = (value: string) => {
    if (!value) return;
    if (value === "CUSTOM") {
      setDraftRange(toCalendarRange(filter));
      setOpen(true);
      return;
    }
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", value);
    params.delete("from");
    params.delete("to");
    setOpen(false);
    navigate(params);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) setDraftRange(toCalendarRange(filter));
    setOpen(nextOpen);
  };

  const handleApply = () => {
    if (!draftRange.from || !draftRange.to) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set("period", "CUSTOM");
    params.set("from", formatDateOnly(draftRange.from));
    params.set("to", formatDateOnly(draftRange.to));
    setOpen(false);
    navigate(params);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverAnchor asChild>
        <div className="flex flex-col items-stretch gap-2 sm:items-end">
          <ToggleGroup
            type="single"
            value={filter.period}
            onValueChange={handlePeriodChange}
            disabled={isPending}
            className="flex-wrap rounded-lg border bg-muted/50 p-1"
          >
            {PERIOD_OPTIONS.map((option) => (
              <ToggleGroupItem
                key={option.value}
                value={option.value}
                aria-label={`ดูข้อมูล${option.label}`}
                className="px-3 py-1.5 text-sm data-[state=on]:bg-background data-[state=on]:shadow-sm"
              >
                {option.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          {filter.period === "CUSTOM" && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={() => setOpen(true)}
              className="justify-start sm:w-fit"
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <CalendarDays data-icon="inline-start" />
              )}
              {filter.label}
            </Button>
          )}
        </div>
      </PopoverAnchor>

      <PopoverContent align="end" className="w-auto max-w-[calc(100vw-2rem)] p-3">
        <PopoverHeader>
          <PopoverTitle>เลือกช่วงวันที่</PopoverTitle>
          <PopoverDescription>เลือกวันเริ่มต้นและวันสิ้นสุด แล้วกดนำไปใช้</PopoverDescription>
        </PopoverHeader>
        <Calendar
          mode="range"
          required
          selected={draftRange}
          onSelect={setDraftRange}
          disabled={{ after: today }}
          defaultMonth={draftRange.from}
          numberOfMonths={1}
          captionLayout="dropdown"
          navLayout="after"
          startMonth={calendarStartMonth}
          endMonth={calendarEndMonth}
          formatters={{
            formatYearDropdown: (date) => String(date.getFullYear() + 543),
          }}
          locale={th}
          timeZone="Asia/Bangkok"
          className="[--cell-size:--spacing(8)]"
        />
        <p className="text-xs text-muted-foreground">
          {draftRange.from
            ? draftRange.to
              ? `${formatThaiDate(draftRange.from)} – ${formatThaiDate(draftRange.to)}`
              : `เริ่ม ${formatThaiDate(draftRange.from)}`
            : "ยังไม่ได้เลือกช่วงวันที่"}
        </p>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => handleOpenChange(false)}>
            ยกเลิก
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={!draftRange.from || !draftRange.to || isPending}
            onClick={handleApply}
          >
            นำไปใช้
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
