import { getTodayAppointmentsBoard } from "@/modules/operation/queries/get-today-appointments";
import DailyAppointmentsBoard from "@/modules/operation/components/DailyAppointmentsBoard";
import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";

export default async function DailyBoardPage() {
  await requireStaff();
  
  const result = await getTodayAppointmentsBoard();

  if (!result.success || !result.data) {
    return (
      <div className="p-6 text-red-600">
        <h2>เกิดข้อผิดพลาดในการดึงข้อมูลคิวงาน</h2>
        <p>{result.error}</p>
      </div>
    );
  }

  return (
    <>
      <SiteHeader title="คิวงานประจำวัน" />
      {/* โยน Data จาก Server Action เข้าไปยัง Client Component */}
      <div className="p-6">
        <DailyAppointmentsBoard initialAppointments={result.data} />
      </div>
    </>
  );
}
