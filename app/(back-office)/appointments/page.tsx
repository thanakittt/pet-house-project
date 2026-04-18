import AppointmentManagement from "@/modules/appointment/components/appointmentManagement";

import { format } from "date-fns";
import { getScheduleByDate } from "@/modules/appointment/queries/get-schedule";
import { SiteHeader } from "@/components/site-header";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  // ดึงวันที่จาก URL หากไม่มีให้ใช้วันนี้เป็นค่าเริ่มต้น
  const targetDate =
    (await searchParams).date || format(new Date(), "yyyy-MM-dd");

  // เรียก Query โดยตรงบนฝั่ง Server
  const result = await getScheduleByDate(targetDate);
  const appointments = result.success && result.data ? result.data : [];

  return (
    <>
      <SiteHeader title="จัดการนัดหมาย" />
      <div className="p-6">
        <AppointmentManagement
          initialDate={targetDate}
          appointments={appointments}
        />
      </div>
    </>
  );
}
