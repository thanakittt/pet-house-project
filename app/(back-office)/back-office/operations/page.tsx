import { getTodayAppointmentsBoard } from "@/modules/operation/queries/get-today-appointments";
import DailyAppointmentsBoard from "@/modules/operation/components/DailyAppointmentsBoard";
import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";

export default async function DailyBoardPage() {
  await requireStaff();

  const result = await getTodayAppointmentsBoard();

  if (!result.success) {
    throw new Error(result.error || "ไม่สามารถดึงคิวงานได้");
  }

  if (!result.data) {
    return (
      <>
        <SiteHeader title="คิวงานประจำวัน" />
        <div className="p-6">
          <p className="text-muted-foreground">ไม่มีข้อมูลคิวงานวันนี้</p>
        </div>
      </>
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
