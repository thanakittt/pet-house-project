"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Receipt } from "lucide-react";
import Link from "next/link";
import {
  LoadingButton,
  LoadingButtonContent,
} from "@/components/shared/LoadingButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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

const BOOKING_STATUS_OPTIONS: AppointmentStatus[] = [
  "PENDING_DEPOSIT",
  "PENDING_APPROVAL",
  "CONFIRMED",
];

const SERVICE_DAY_STATUS_OPTIONS: AppointmentStatus[] = [
  "CHECKED_IN",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
];

const FINAL_STATUS_OPTIONS: AppointmentStatus[] = [
  "COMPLETED",
  "CANCELLED",
  "NO_SHOW",
];

export default function AppointmentStatusManager({
  appointmentId,
  currentStatus,
}: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmStatus, setConfirmStatus] = useState<AppointmentStatus | null>(
    null,
  );

  const isWorking = isLoading;

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

  const showSuccessToast = (newStatus: AppointmentStatus) => {
    // สถานะ CONFIRMED มี side effect เรื่องค่ามัดจำ จึงต้องแจ้งรายละเอียดเพิ่มให้ผู้ใช้รู้
    if (newStatus === "CONFIRMED") {
      toast.success(
        `อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" และบันทึกค่ามัดจำ 100 บาท เรียบร้อยแล้ว`,
      );
      return;
    }

    toast.success(`อัปเดตสถานะเป็น "${STATUS_CONFIG[newStatus].label}" สำเร็จ`);
  };

  const handleUpdateStatus = async (
    newStatus: AppointmentStatus,
  ): Promise<boolean> => {
    if (newStatus === "COMPLETED") {
      toast.info("กรุณาชำระเงินผ่านระบบ POS เพื่อเสร็จสิ้นการนัดหมาย");
      return false;
    }

    setIsLoading(true);
    try {
      const result = await updateAppointmentStatus(appointmentId, newStatus);
      if (result.success) {
        showSuccessToast(newStatus);
        return true;
      }

      toast.error(result.error || "เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
      return false;
    } catch {
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const requestStatusChange = async (newStatus: AppointmentStatus) => {
    if (newStatus === currentStatus) return;

    if (newStatus === "COMPLETED") {
      toast.info("กรุณาชำระเงินผ่านระบบ POS เพื่อเสร็จสิ้นการนัดหมาย");
      return;
    }

    if (["CANCELLED", "NO_SHOW"].includes(newStatus)) {
      setConfirmStatus(newStatus);
      return;
    }

    await handleUpdateStatus(newStatus);
  };

  const handleConfirmStatusChange = async () => {
    if (!confirmStatus) return;

    const isSuccess = await handleUpdateStatus(confirmStatus);
    if (isSuccess) {
      setConfirmStatus(null);
    }
  };

  const confirmDialogTitle =
    confirmStatus === "NO_SHOW"
      ? "ยืนยันว่าลูกค้าไม่มาตามนัด"
      : "ยืนยันการยกเลิกคิว";

  const confirmDialogDescription =
    confirmStatus === "NO_SHOW"
      ? "เมื่อตั้งสถานะนี้ ระบบจะบันทึกว่านัดหมายนี้เป็น No Show"
      : "เมื่อตั้งสถานะนี้ ระบบจะบันทึกว่านัดหมายนี้ถูกยกเลิก";

  return (
    <>
      <div className="hidden lg:flex sm:flex-row flex-col justify-between items-stretch sm:items-center gap-4 bg-muted/50 p-4 rounded-lg">
        <div className="flex flex-col gap-2 w-full sm:w-auto">
          <span className="font-medium text-muted-foreground text-sm">
            สถานะปัจจุบัน
          </span>

          <Select
            value={currentStatus}
            onValueChange={(value) =>
              requestStatusChange(value as AppointmentStatus)
            }
            disabled={isWorking}
          >
            <SelectTrigger className="w-full sm:w-[220px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>ช่วงการจอง</SelectLabel>
                {BOOKING_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>วันที่มาใช้บริการ</SelectLabel>
                {SERVICE_DAY_STATUS_OPTIONS.map((status) => (
                  <SelectItem key={status} value={status}>
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectGroup>

              <SelectGroup>
                <SelectLabel>จบงาน</SelectLabel>
                {FINAL_STATUS_OPTIONS.map((status) => (
                  <SelectItem
                    key={status}
                    value={status}
                    disabled={
                      status === "COMPLETED" && currentStatus !== "COMPLETED"
                    }
                  >
                    {STATUS_CONFIG[status].label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-wrap justify-end gap-2 w-full sm:w-auto">
          {!isFinished && (
            <>
              {currentStatus === "CONFIRMED" && (
                <Button
                  variant="outline"
                  disabled={isWorking}
                  onClick={() => requestStatusChange("NO_SHOW")}
                >
                  ไม่มาตามนัด
                </Button>
              )}

              <Button
                variant="destructive"
                disabled={isWorking}
                onClick={() => requestStatusChange("CANCELLED")}
              >
                ยกเลิกคิว
              </Button>
            </>
          )}

          {currentStatus === "READY_FOR_PICKUP" && (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/back-office/pos/${appointmentId}`}>
                <Receipt data-icon="inline-start" />
                ไปหน้ารับชำระเงิน (POS)
              </Link>
            </Button>
          )}

          {currentStatus === "COMPLETED" && (
            <Button asChild className="w-full sm:w-auto">
              <Link href={`/receipt/${appointmentId}`}>
                <Receipt data-icon="inline-start" />
                ใบเสร็จ
              </Link>
            </Button>
          )}

          {nextStatus && (
            <LoadingButton
              variant={
                currentStatus === "READY_FOR_PICKUP" ? "outline" : "default"
              }
              disabled={isWorking}
              isLoading={isLoading}
              loadingText="กำลังอัปเดต..."
              onClick={() => handleUpdateStatus(nextStatus)}
              className="flex-1 sm:flex-none min-w-[180px]"
            >
              {`เปลี่ยนเป็น: ${STATUS_CONFIG[nextStatus].label}`}
            </LoadingButton>
          )}
        </div>
      </div>

      <AlertDialog
        open={Boolean(confirmStatus)}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmStatus(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialogTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialogDescription}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWorking}>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isWorking}
              onClick={(event) => {
                event.preventDefault();
                handleConfirmStatusChange();
              }}
            >
              <LoadingButtonContent
                isLoading={isLoading}
                loadingText="กำลังอัปเดต..."
              >
                ยืนยัน
              </LoadingButtonContent>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
