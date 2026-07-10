"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  format,
  addDays,
  subDays,
  differenceInMinutes,
  parseISO,
  isSameDay,
} from "date-fns";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  StickyNote,
  PlusIcon, // เพิ่ม Icon สำหรับโน้ต
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { ScheduleRecord } from "@/modules/appointment/types/schedule";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/modules/appointment/actions/update-appointment";
import {
  getAppointmentStatusConfig,
  STATUS_CONFIG,
} from "@/lib/constants/appointment-status";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { formatThaiDate } from "@/lib/utils";
import type { OperatingInterval } from "@/modules/business-rules/types/business-rules";

const ROW_HEIGHT_PX = 120;
const CANVAS_PADDING_TOP = 16;

// ----------------------------------------------------------------------
// 1. Component ใหม่: Interactive Status Select
// ----------------------------------------------------------------------
const InteractiveStatusSelect = ({
  appointmentId,
  currentStatus,
}: {
  appointmentId: string;
  currentStatus: ScheduleRecord["status"];
}) => {
  const [isPending, startTransition] = useTransition();
  const [optimisticStatus, setOptimisticStatus] =
    useState<ScheduleRecord["status"]>(currentStatus);

  useEffect(() => {
    setOptimisticStatus(currentStatus);
  }, [currentStatus]);

  const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    e.stopPropagation();

    const newStatus = e.target.value as ScheduleRecord["status"];
    const previousStatus = optimisticStatus;

    if (newStatus === "COMPLETED") {
      toast.info("กรุณาชำระเงินผ่านระบบ POS เพื่อเสร็จสิ้นการนัดหมาย");
      return;
    }

    setOptimisticStatus(newStatus);

    startTransition(async () => {
      try {
        const result = await updateAppointmentStatus(appointmentId, newStatus);
        if (result.success) {
          toast.success("อัปเดตสถานะสำเร็จ");
        } else {
          setOptimisticStatus(previousStatus);
          toast.error(result.error || "เกิดข้อผิดพลาด");
        }
      } catch (error) {
        console.error("updateAppointmentStatus error:", error);
        setOptimisticStatus(previousStatus);
        toast.error("ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้");
      }
    });
  };

  const currentConfig = getAppointmentStatusConfig(optimisticStatus);

  return (
    <div
      className="relative"
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <select
        value={optimisticStatus}
        onChange={handleStatusChange}
        disabled={isPending}
        className={`max-w-full appearance-none outline-none cursor-pointer pl-3 pr-8 py-1.5 text-sm font-bold rounded-full border transition-colors ${currentConfig.colorClass} ${isPending ? "opacity-50 cursor-not-allowed" : "hover:brightness-95"}`}
      >
        <optgroup label="ช่วงการจอง" className="bg-background text-foreground">
          <option value="PENDING_DEPOSIT">
            {STATUS_CONFIG["PENDING_DEPOSIT"].label}
          </option>
          <option value="PENDING_APPROVAL">
            {STATUS_CONFIG["PENDING_APPROVAL"].label}
          </option>
          <option value="CONFIRMED">{STATUS_CONFIG["CONFIRMED"].label}</option>
        </optgroup>
        <optgroup
          label="วันที่มาใช้บริการ"
          className="bg-background text-foreground"
        >
          <option value="CHECKED_IN">
            {STATUS_CONFIG["CHECKED_IN"].label}
          </option>
          <option value="IN_PROGRESS">
            {STATUS_CONFIG["IN_PROGRESS"].label}
          </option>
          <option value="READY_FOR_PICKUP">
            {STATUS_CONFIG["READY_FOR_PICKUP"].label}
          </option>
        </optgroup>
        <optgroup label="จบงาน" className="bg-background text-foreground">
          <option value="COMPLETED" disabled={optimisticStatus !== "COMPLETED"}>
            {STATUS_CONFIG["COMPLETED"].label}
          </option>
          <option value="CANCELLED">{STATUS_CONFIG["CANCELLED"].label}</option>
          <option value="NO_SHOW">{STATUS_CONFIG["NO_SHOW"].label}</option>
        </optgroup>
      </select>

      <div className="top-1/2 right-3 absolute flex items-center -translate-y-1/2 pointer-events-none">
        {isPending ? (
          <Spinner className="opacity-70 text-current" />
        ) : (
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="opacity-70"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        )}
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------
// Main Component
// ----------------------------------------------------------------------
interface ScheduleCanvasProps {
  initialDate: string;
  appointments: ScheduleRecord[];
  operatingIntervals: OperatingInterval[];
}

function MobileScheduleList({
  appointments,
}: {
  appointments: ScheduleRecord[];
}) {
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center bg-muted/50 p-8 border border-dashed rounded-lg text-muted-foreground/50 text-center">
        <Clock size={30} className="mb-3" />
        <p className="font-medium text-base">ไม่มีคิวนัดหมายในวันนี้</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {appointments.map((appt) => (
        <Link
          key={`${appt.id}-${appt.petId}`}
          href={`/back-office/appointments/${appt.id}`}
          className="group block bg-card shadow-sm hover:shadow-md p-4 border border-l-4 border-l-primary rounded-lg min-w-0 transition-shadow"
        >
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap justify-between items-start gap-2 min-w-0">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1 min-w-0 font-bold text-primary text-base leading-tight">
                    <span className="min-w-0 break-words">{appt.petName}</span>
                    <span className="font-normal text-muted-foreground break-words">
                      ({appt.customerName})
                    </span>
                    {appt.note && (
                      <StickyNote
                        size={14}
                        className="text-amber-500 shrink-0"
                      />
                    )}
                  </div>
                </div>

                <AppointmentStatusBadge status={appt.status} />
              </div>

              <p className="flex items-center gap-1.5 font-medium text-muted-foreground text-sm break-words">
                <Clock size={14} className="shrink-0" />
                {format(parseISO(appt.startTimeIso), "HH:mm")} -{" "}
                {format(parseISO(appt.endTimeIso), "HH:mm")}
              </p>
            </div>

            <p className="font-medium text-muted-foreground text-sm break-words">
              {appt.serviceNames || "-"}
            </p>
          </div>
        </Link>
      ))}
      <div className="hidden">
        <InteractiveStatusSelect
          appointmentId={appointments[0].id}
          currentStatus={appointments[0].status}
        />
      </div>
    </div>
  );
}

export default function ScheduleCanvas({
  initialDate,
  appointments,
  operatingIntervals,
}: ScheduleCanvasProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDate = parseISO(initialDate);
  const intervalHours = operatingIntervals.flatMap((interval) => [
    Number(interval.startTime.slice(0, 2)),
    Math.ceil(
      Number(interval.endTime.slice(0, 2)) +
        Number(interval.endTime.slice(3, 5)) / 60,
    ),
  ]);
  const appointmentHours = appointments.flatMap((appointment) => {
    const start = parseISO(appointment.startTimeIso);
    const end = parseISO(appointment.endTimeIso);
    return [start.getHours(), Math.ceil(end.getHours() + end.getMinutes() / 60)];
  });
  const timeBounds = [...intervalHours, ...appointmentHours];
  const startHour = timeBounds.length ? Math.min(...timeBounds) : 9;
  const endHour = timeBounds.length
    ? Math.max(...timeBounds, startHour + 1)
    : 18;
  const hoursGrid = Array.from(
    { length: endHour - startHour + 1 },
    (_, index) => startHour + index,
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isToday = isSameDay(currentDate, new Date());

  const getCurrentTimePosition = () => {
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const isWithinOperatingTime = operatingIntervals.some((interval) => {
      const [startHourValue, startMinute] = interval.startTime.split(":").map(Number);
      const [endHourValue, endMinute] = interval.endTime.split(":").map(Number);
      return (
        currentMinutes >= startHourValue * 60 + startMinute &&
        currentMinutes < endHourValue * 60 + endMinute
      );
    });
    if (!isWithinOperatingTime) return null;

    const dayStart = new Date(now);
    dayStart.setHours(startHour, 0, 0, 0);
    const minutesFromStart = differenceInMinutes(now, dayStart);
    return (minutesFromStart / 60) * ROW_HEIGHT_PX;
  };

  const currentTimePosition = isToday ? getCurrentTimePosition() : null;

  useEffect(() => {
    if (isToday && currentTimePosition && scrollContainerRef.current) {
      const scrollPosition =
        currentTimePosition - 100 > 0 ? currentTimePosition - 100 : 0;
      scrollContainerRef.current.scrollTo({
        top: scrollPosition,
        behavior: "smooth",
      });
    }
  }, [isToday, currentTimePosition]);

  const updateDateUrl = (newDate: Date) => {
    const params = new URLSearchParams(searchParams);
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`${pathname}?${params.toString()}`);
  };

  const handlePrevDay = () => updateDateUrl(subDays(currentDate, 1));
  const handleNextDay = () => updateDateUrl(addDays(currentDate, 1));
  const handleToday = () => updateDateUrl(new Date());

  const calculatePosition = (startTimeIso: string, endTimeIso: string) => {
    const start = parseISO(startTimeIso);
    const end = parseISO(endTimeIso);
    const dayStart = new Date(start);
    dayStart.setHours(startHour, 0, 0, 0);

    const minutesFromStart = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);

    const topPositionPx = (minutesFromStart / 60) * ROW_HEIGHT_PX;
    const heightPx = (durationMinutes / 60) * ROW_HEIGHT_PX;

    return { top: `${topPositionPx}px`, height: `${heightPx}px` };
  };

  return (
    <div className="flex flex-col bg-card shadow-sm mx-auto border rounded-2xl w-full min-w-0 max-w-6xl overflow-hidden">
      {/* Calendar Header */}
      <div className="z-20 flex sm:flex-row flex-col justify-between items-stretch sm:items-center gap-4 bg-card px-4 sm:px-6 py-5 border-b shrink-0">
        <div className="flex sm:flex-row flex-col sm:items-center gap-4 sm:gap-6 min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="hidden sm:block bg-amber-50 p-3 rounded-lg text-amber-600">
              <CalendarIcon size={20} />
            </div>
            <div className="min-w-0">
              <h2 className="font-bold text-xl wrap-break-word leading-tight">
                {formatThaiDate(currentDate)}
              </h2>
              {isToday && (
                <p className="mt-1 font-medium text-primary text-sm">วันนี้</p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonGroup>
              <Button variant="outline" onClick={handlePrevDay}>
                <ChevronLeft size={18} />
              </Button>
              <Button variant="outline" onClick={handleNextDay}>
                <ChevronRight size={18} />
              </Button>
            </ButtonGroup>

            {!isToday && (
              <Button
                variant="outline"
                size="sm"
                className="h-9"
                onClick={handleToday}
              >
                กลับไปวันนี้
              </Button>
            )}
          </div>
        </div>

        <Button className="max-lg:hidden shadow-sm w-full sm:w-auto" asChild>
          <Link href="/back-office/appointments/create">
            <PlusIcon className="size-4" />
            เพิ่มนัดหมาย
          </Link>
        </Button>
      </div>

      <div className="md:hidden bg-muted/40 p-4">
        {operatingIntervals.length === 0 ? (
          <p className="mb-3 text-center text-muted-foreground text-sm">
            ร้านปิดในวันนี้
          </p>
        ) : null}
        <MobileScheduleList appointments={appointments} />
      </div>

      {/* Schedule Canvas */}
      <div
        ref={scrollContainerRef}
        className="hidden relative md:flex flex-1 bg-background h-[720px] overflow-y-auto scroll-smooth"
      >
        {/* แกนเวลา (Y-Axis) */}
        <div className="left-0 z-20 sticky flex-shrink-0 bg-card shadow-[1px_0_5px_rgba(0,0,0,0.02)] pt-4 border-muted-foreground/30 border-r w-20">
          {hoursGrid.map((hour) => (
            <div
              key={hour}
              className="relative flex justify-center items-start"
              style={{ height: `${ROW_HEIGHT_PX}px` }}
            >
              <span className="-top-2.5 absolute bg-card px-2 font-medium text-muted-foreground text-sm">
                {hour.toString().padStart(2, "0")}:00
              </span>
            </div>
          ))}
        </div>

        {/* พื้นที่ตารางหลัก */}
        <div className="relative flex-1 pt-4 pb-10 min-w-[600px]">
          {hoursGrid.map((hour) => (
            <div
              key={hour}
              className="absolute border-muted-foreground/30 border-t w-full"
              style={{
                top: `${(hour - startHour) * ROW_HEIGHT_PX + CANVAS_PADDING_TOP}px`,
              }}
            />
          ))}

          {operatingIntervals.map((interval) => {
            const [startHourValue, startMinute] = interval.startTime.split(":").map(Number);
            const [endHourValue, endMinute] = interval.endTime.split(":").map(Number);
            const intervalStart = startHourValue + startMinute / 60;
            const intervalEnd = endHourValue + endMinute / 60;
            return (
              <div
                key={`${interval.startTime}-${interval.endTime}`}
                className="absolute bg-primary/5 border-primary/20 border-y w-full pointer-events-none"
                style={{
                  top: `${(intervalStart - startHour) * ROW_HEIGHT_PX + CANVAS_PADDING_TOP}px`,
                  height: `${(intervalEnd - intervalStart) * ROW_HEIGHT_PX}px`,
                }}
              />
            );
          })}

          {isToday && currentTimePosition !== null && (
            <div
              className="z-10 absolute flex items-center w-full pointer-events-none"
              style={{ top: `${currentTimePosition + CANVAS_PADDING_TOP}px` }}
            >
              <div className="relative bg-red-500 shadow-sm -ml-1 rounded-full w-2 h-2">
                <span className="inline-flex absolute bg-red-400 opacity-75 rounded-full w-full h-full animate-ping"></span>
              </div>
              <div className="opacity-60 border-red-500 border-t-2 w-full"></div>
            </div>
          )}

          {appointments.length === 0 && (
            <div className="absolute inset-0 flex flex-col justify-center items-center opacity-60 text-muted-foreground/50 pointer-events-none">
              <Clock size={48} className="mb-4" />
              <p className="font-medium text-lg">ไม่มีคิวนัดหมายในวันนี้</p>
            </div>
          )}

          {appointments.map((appt) => {
            const { top, height } = calculatePosition(
              appt.startTimeIso,
              appt.endTimeIso,
            );

            return (
              <Link
                key={`${appt.id}-${appt.petId}`}
                href={`/back-office/appointments/${appt.id}`}
                className="group right-4 left-2 z-10 hover:z-20 absolute"
                style={{
                  top: `calc(${top} + ${CANVAS_PADDING_TOP}px)`,
                  height,
                }}
              >
                <div className="relative flex flex-col bg-card shadow-sm hover:shadow-lg p-4 border-y border-r border-l-4 border-l-primary rounded-md w-full h-full transition-all group-hover:-translate-y-0.5 duration-200">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex items-center gap-1 font-bold text-primary text-base truncate leading-tight">
                      {appt.petName}{" "}
                      <span className="font-normal text-muted-foreground text-base">
                        (คุณ {appt.customerName})
                      </span>
                      {/* [NEW] แสดงไอคอนโน้ตหากมีการบันทึกหมายเหตุ */}
                      {appt.note && (
                        <StickyNote size={14} className="text-amber-500" />
                      )}
                    </div>
                    <AppointmentStatusBadge
                      status={appt.status}
                      className="p-3"
                    />
                  </div>
                  <p className="flex items-center gap-1 font-medium text-muted-foreground text-base">
                    <Clock size={14} />
                    {format(parseISO(appt.startTimeIso), "HH:mm")} -{" "}
                    {format(parseISO(appt.endTimeIso), "HH:mm")}
                  </p>
                  <p className="mt-1 font-medium text-base truncate">
                    {appt.serviceNames}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
