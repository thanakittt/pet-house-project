import type { Metadata } from "next";
import AppointmentManagement from "@/modules/appointment/components/appointmentManagement";

import { getScheduleByDate } from "@/modules/appointment/queries/get-schedule";
import { getConfirmedAppointmentRequests } from "@/modules/appointment/queries/get-confirmed-appointment-requests";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import { getBangkokTodayString } from "@/lib/finance/date";

export const metadata: Metadata = {
  title: "จัดการนัดหมาย",
  description: "ดูและจัดการตารางนัดหมายของลูกค้า Pet House",
};

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  await requireStaff();

  // ดึงวันที่จาก URL หากไม่มีให้ใช้วันนี้เป็นค่าเริ่มต้น
  const targetDate =
    (await searchParams).date || getBangkokTodayString();

  // เรียกข้อมูลทั้งสองแท็บพร้อมกัน เพื่อลดเวลารอของหน้า appointments
  const [scheduleResult, newRequestsResult] = await Promise.all([
    getScheduleByDate(targetDate),
    getConfirmedAppointmentRequests(),
  ]);

  const appointments =
    scheduleResult.success && scheduleResult.data ? scheduleResult.data : [];
  const newAppointmentRequests = newRequestsResult.success
    ? newRequestsResult.data
    : [];

  return (
    <>
      <SiteHeader title="จัดการนัดหมาย" />
      <BackOfficeContainer>
        <AppointmentManagement
          initialDate={targetDate}
          appointments={appointments}
          newAppointmentRequests={newAppointmentRequests}
        />
      </BackOfficeContainer>
    </>
  );
}
