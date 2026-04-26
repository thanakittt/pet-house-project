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
import { th } from "date-fns/locale";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  Loader2,
  StickyNote, // เพิ่ม Icon สำหรับโน้ต
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScheduleRecord } from "@/modules/appointment/types/schedule";
import { ButtonGroup } from "@/components/ui/button-group";
import { toast } from "sonner";
import { updateAppointmentStatus } from "@/modules/appointment/actions/update-appointment";
import { STATUS_CONFIG } from "@/lib/constants/appointment-status";

const START_HOUR = 9;
const END_HOUR = 18;
const TOTAL_HOURS = END_HOUR - START_HOUR;
const ROW_HEIGHT_PX = 120;
const CANVAS_PADDING_TOP = 16;

const hoursGrid = Array.from(
  { length: TOTAL_HOURS + 1 },
  (_, i) => START_HOUR + i,
);

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

  const currentConfig = STATUS_CONFIG[optimisticStatus] ||
    STATUS_CONFIG[currentStatus] || {
      label: optimisticStatus,
      colorClass: "bg-slate-100 text-slate-800 border-slate-200",
    };

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
        className={`appearance-none outline-none cursor-pointer pl-3 pr-8 py-1.5 text-sm font-bold rounded-full border transition-colors ${currentConfig.colorClass} ${isPending ? "opacity-50 cursor-not-allowed" : "hover:brightness-95"}`}
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
          <Loader2 size={14} className="opacity-70 text-current animate-spin" />
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
}

export default function ScheduleCanvas({
  initialDate,
  appointments,
}: ScheduleCanvasProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentDate = parseISO(initialDate);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const isToday = isSameDay(currentDate, new Date());

  const getCurrentTimePosition = () => {
    const now = new Date();
    if (now.getHours() < START_HOUR || now.getHours() >= END_HOUR) return null;

    const dayStart = new Date(now);
    dayStart.setHours(START_HOUR, 0, 0, 0);
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
    dayStart.setHours(START_HOUR, 0, 0, 0);

    const minutesFromStart = differenceInMinutes(start, dayStart);
    const durationMinutes = differenceInMinutes(end, start);

    const topPositionPx = (minutesFromStart / 60) * ROW_HEIGHT_PX;
    const heightPx = (durationMinutes / 60) * ROW_HEIGHT_PX;

    return { top: `${topPositionPx}px`, height: `${heightPx}px` };
  };

  return (
    <div className="flex flex-col bg-white shadow-sm mx-auto border border-slate-200 rounded-2xl w-full max-w-6xl h-[800px] overflow-hidden">
      {/* Calendar Header */}
      <div className="z-20 flex sm:flex-row flex-col justify-between items-center gap-4 bg-white px-6 py-5 border-slate-200 border-b shrink-0">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="hidden sm:block bg-primary/10 p-2 rounded-lg text-primary">
              <CalendarIcon size={24} />
            </div>
            <div>
              <h2 className="font-bold text-slate-800 text-xl leading-none">
                {format(currentDate, "d MMMM yyyy", { locale: th })}
              </h2>
              {isToday && (
                <p className="mt-1 font-medium text-primary text-sm">วันนี้</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
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
                className="hidden sm:flex h-9"
                onClick={handleToday}
              >
                กลับไปวันนี้
              </Button>
            )}
          </div>
        </div>

        <Button variant="default" className="shadow-sm" asChild>
          <Link href="/appointments/create">เพิ่มนัดหมาย</Link>
        </Button>
      </div>

      {/* Schedule Canvas */}
      <div
        ref={scrollContainerRef}
        className="relative flex flex-1 bg-slate-50/50 overflow-y-auto scroll-smooth"
      >
        {/* แกนเวลา (Y-Axis) */}
        <div className="left-0 z-20 sticky flex-shrink-0 bg-white shadow-[1px_0_5px_rgba(0,0,0,0.02)] pt-4 border-slate-200 border-r w-20">
          {hoursGrid.map((hour) => (
            <div
              key={hour}
              className="relative flex justify-center items-start"
              style={{ height: `${ROW_HEIGHT_PX}px` }}
            >
              <span className="-top-2.5 absolute bg-white px-2 font-medium text-slate-400 text-sm">
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
              className="absolute border-slate-200/60 border-t w-full"
              style={{
                top: `${(hour - START_HOUR) * ROW_HEIGHT_PX + CANVAS_PADDING_TOP}px`,
              }}
            />
          ))}

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
            <div className="absolute inset-0 flex flex-col justify-center items-center opacity-60 text-slate-400 pointer-events-none">
              <Clock size={48} className="mb-4 text-slate-300" />
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
                href={`/appointments/${appt.id}`}
                className="group right-4 left-2 z-10 hover:z-20 absolute"
                style={{
                  top: `calc(${top} + ${CANVAS_PADDING_TOP}px)`,
                  height,
                }}
              >
                <div className="relative flex flex-col bg-white shadow-sm hover:shadow-lg p-3 border-slate-200 border-y border-r border-l-4 border-l-primary rounded-md w-full h-full transition-all group-hover:-translate-y-0.5 duration-200">
                  <div className="flex justify-between items-start gap-2 mb-1.5">
                    <div className="flex items-center gap-1 font-bold text-primary text-base truncate leading-tight">
                      {appt.petName}{" "}
                      <span className="font-normal text-slate-500 text-base">
                        ({appt.customerName})
                      </span>
                      {/* [NEW] แสดงไอคอนโน้ตหากมีการบันทึกหมายเหตุ */}
                      {appt.note && (
                        <StickyNote size={14} className="text-amber-500" />
                      )}
                    </div>

                    <InteractiveStatusSelect
                      appointmentId={appt.id}
                      currentStatus={appt.status}
                    />
                  </div>
                  <p className="flex items-center gap-1 font-medium text-slate-500 text-base">
                    <Clock size={10} />
                    {format(parseISO(appt.startTimeIso), "HH:mm")} -{" "}
                    {format(parseISO(appt.endTimeIso), "HH:mm")}
                  </p>
                  <p className="mt-1 font-medium text-slate-700 text-base truncate">
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
