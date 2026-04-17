import { AppointmentStatus } from "@/modules/appointment/types/status";

export const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; colorClass: string }
> = {
  PENDING_DEPOSIT: {
    label: "รอชำระค่ามัดจำ",
    colorClass: "bg-amber-100 text-amber-800 border-amber-200",
  },
  PENDING_APPROVAL: {
    label: "รออนุมัติ/ตรวจสอบ",
    colorClass: "bg-orange-100 text-orange-800 border-orange-200",
  },
  CONFIRMED: {
    label: "ยืนยันแล้ว",
    colorClass: "bg-blue-100 text-blue-800 border-blue-200",
  },
  CHECKED_IN: {
    label: "รับฝากแล้ว",
    colorClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
  },
  IN_PROGRESS: {
    label: "กำลังดำเนินการ",
    colorClass: "bg-purple-100 text-purple-800 border-purple-200",
  },
  READY_FOR_PICKUP: {
    label: "รอรับกลับ",
    colorClass: "bg-pink-100 text-pink-800 border-pink-200",
  },
  COMPLETED: {
    label: "เสร็จสมบูรณ์",
    colorClass: "bg-green-100 text-green-800 border-green-200",
  },
  CANCELLED: {
    label: "ยกเลิก",
    colorClass: "bg-red-100 text-red-800 border-red-200",
  },
  NO_SHOW: {
    label: "ไม่มาตามนัด",
    colorClass: "bg-slate-100 text-slate-800 border-slate-200",
  },
};
