"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Loader2, Receipt } from "lucide-react"; // เพิ่ม Receipt icon
import Link from "next/link"; // เพิ่ม Link
import { Button } from "@/components/ui/button";
import { AppointmentStatus } from "@/modules/appointment/types/status";
import { STATUS_CONFIG } from "@/lib/constants/appointment-status";
import { updateAppointmentStatus } from "../actions/update-appointment";

interface Props {
  appointmentId: string;
  currentStatus: AppointmentStatus;
}

const PATH_FLOW: AppointmentStatus[] = [
  "PENDING_DEPOSIT",
  "PENDING_APPROVAL",
  "CONFIRMED",
  "CHECKED_IN",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
];

export default function AppointmentStatusManager({
  appointmentId,
  currentStatus,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  const isWorking = isLoading || isPending;

  const getNextStatus = (): AppointmentStatus | null => {
    const currentIndex = PATH_FLOW.indexOf(currentStatus);
    if (currentIndex >= 0 && currentIndex < PATH_FLOW.length - 1) {
      return PATH_FLOW[currentIndex + 1];
    }
    return null;
  };

  const nextStatus = getNextStatus();
  const isFinished = ["COMPLETED", "CANCELLED", "NO_SHOW"].includes(
    currentStatus,
  );

  const handleUpdateStatus = async (newStatus: AppointmentStatus) => {
    if (newStatus === "COMPLETED") {
      toast.info("กรุณาชำระเงินผ่านระบบ POS เพื่อเสร็จสิ้นการนัดหมาย");
      return;
    }

    setIsLoading(true);
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        // เพิ่มเงื่อนไขแจ้งเตือนพิเศษสำหรับสถานะ CONFIRMED
        if (newStatus === "CONFIRMED") {
          toast.success(
            `อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" และบันทึกค่ามัดจำ 100 บาท เรียบร้อยแล้ว`,
          );
        } else {
          toast.success(
            `อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" สำเร็จ`,
          );
        }
      } else {
        toast.error(result.error);
      }
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setIsLoading(false);
    }
  };

  // Handler สำหรับ Select Dropdown
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStatus = e.target.value as AppointmentStatus;
    if (newStatus === currentStatus) return;

    if (newStatus === "COMPLETED") {
      toast.info("กรุณาชำระเงินผ่านระบบ POS เพื่อเสร็จสิ้นการนัดหมาย");
      return;
    }

    if (["CANCELLED", "NO_SHOW"].includes(newStatus)) {
      if (
        !window.confirm(
          `ยืนยันการเปลี่ยนสถานะเป็น "${STATUS_CONFIG[newStatus].label}" ใช่หรือไม่?`,
        )
      ) {
        return;
      }
    }

    startTransition(async () => {
      try {
        const result = await updateAppointmentStatus(appointmentId, newStatus);
        if (result.success) {
          // เพิ่มเงื่อนไขแจ้งเตือนพิเศษสำหรับสถานะ CONFIRMED
          if (newStatus === "CONFIRMED") {
            toast.success(
              `อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" และบันทึกค่ามัดจำ 100 บาท เรียบร้อยแล้ว`,
            );
          } else {
            toast.success(
              `อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" สำเร็จ`,
            );
          }
        } else {
          toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
        }
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
      }
    });
  };

  return (
    <div className="flex sm:flex-row flex-col justify-between items-center gap-4 bg-slate-50 p-4 border border-slate-100 rounded-xl">
      {/* 1. แสดงและเลือกสถานะปัจจุบัน (Dropdown) */}
      <div className="flex items-center gap-3 w-full sm:w-auto shrink-0">
        <span className="font-medium text-slate-500 text-sm">
          สถานะปัจจุบัน:
        </span>
        <div className="relative">
          <select
            value={currentStatus}
            onChange={handleSelectChange}
            disabled={isWorking}
            className={`appearance-none outline-none cursor-pointer pl-3 pr-8 py-1.5 text-sm font-bold rounded-full border transition-colors ${STATUS_CONFIG[currentStatus].colorClass} ${isWorking ? "opacity-50 cursor-not-allowed" : "hover:brightness-95"}`}
          >
            <optgroup
              label="ช่วงการจอง"
              className="bg-background text-foreground"
            >
              <option value="PENDING_DEPOSIT">
                {STATUS_CONFIG["PENDING_DEPOSIT"].label}
              </option>
              <option value="PENDING_APPROVAL">
                {STATUS_CONFIG["PENDING_APPROVAL"].label}
              </option>
              <option value="CONFIRMED">
                {STATUS_CONFIG["CONFIRMED"].label}
              </option>
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
              <option
                value="COMPLETED"
                disabled={currentStatus !== "COMPLETED"}
              >
                {STATUS_CONFIG["COMPLETED"].label}
              </option>
              <option value="CANCELLED">
                {STATUS_CONFIG["CANCELLED"].label}
              </option>
              <option value="NO_SHOW">{STATUS_CONFIG["NO_SHOW"].label}</option>
            </optgroup>
          </select>

          <div className="top-1/2 right-3 absolute flex items-center -translate-y-1/2 pointer-events-none">
            {isPending ? (
              <Loader2
                size={14}
                className="opacity-70 text-current animate-spin"
              />
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
      </div>

      {/* 2. ปุ่มควบคุมสถานะตาม Flow */}
      <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
        {!isFinished && (
          <>
            {currentStatus === "CONFIRMED" && (
              <Button
                variant="outline"
                className="hover:bg-slate-200 text-slate-600"
                disabled={isWorking}
                onClick={() => {
                  if (window.confirm("ยืนยันว่าลูกค้าไม่มาตามนัด (No Show)?")) {
                    handleUpdateStatus("NO_SHOW");
                  }
                }}
              >
                ไม่มาตามนัด
              </Button>
            )}

            <Button
              variant="outline"
              className="hover:bg-red-50 border-red-200 text-red-600 hover:text-red-700"
              disabled={isWorking}
              onClick={() => {
                if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการยกเลิกคิวนี้?")) {
                  handleUpdateStatus("CANCELLED");
                }
              }}
            >
              ยกเลิกคิว
            </Button>
          </>
        )}

        {/* --- ปุ่มลัดไปหน้า POS (จะโชว์เฉพาะสถานะ READY_FOR_PICKUP) --- */}
        {currentStatus === "READY_FOR_PICKUP" && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/back-office/pos/${appointmentId}`}>
              <Receipt className="mr-2 w-4 h-4" />
              ไปหน้ารับชำระเงิน (POS)
            </Link>
          </Button>
        )}

        {/* --- ปุ่มลัดไปหน้าใบเสร็จ (จะโชว์เฉพาะสถานะ COMPLETED) --- */}
        {currentStatus === "COMPLETED" && (
          <Button asChild className="w-full sm:w-auto">
            <Link href={`/receipt/${appointmentId}`}>
              <Receipt className="mr-2 w-4 h-4" />
              ใบเสร็จ
            </Link>
          </Button>
        )}

        {nextStatus && (
          <Button
            variant={
              currentStatus === "READY_FOR_PICKUP" ? "outline" : "default"
            }
            disabled={isWorking}
            onClick={() => handleUpdateStatus(nextStatus)}
            className="flex-1 sm:flex-none min-w-[180px]"
          >
            {isLoading ? (
              <Loader2 size={16} className="mr-2 animate-spin" />
            ) : null}
            {isLoading
              ? "กำลังอัปเดต..."
              : `เปลี่ยนเป็น: ${STATUS_CONFIG[nextStatus].label}`}
          </Button>
        )}
      </div>
    </div>
  );
}
