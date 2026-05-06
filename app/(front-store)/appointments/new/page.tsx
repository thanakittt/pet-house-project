import AppointmentStepper from "@/modules/appointment/components/front-store/AppointmentStepper";
import PendingDepositPaymentScreen from "@/modules/appointment/components/front-store/PendingDepositPaymentScreen";
import { getLatestPendingDepositAppointment } from "@/modules/appointment/queries/get-latest-pending-deposit-appointment";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { listPets } from "@/modules/pet/queries/list-pets";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { redirect } from "next/navigation";

export default async function Page() {
  // หน้านี้เป็น Server Component จึงตรวจ session และอ่าน DB ได้ก่อนส่ง UI ไปให้ browser
  // ถ้าผู้ใช้ไม่ใช่ customer ระบบจะ redirect ตาม behavior ของ requireCustomer()
  const session = await requireCustomer();

  if (!session) {
    redirect("/sign-in");
  }

  // ดึง customer profile จาก user ใน session ก่อน เพราะ flow จองคิวผูกกับ customerId
  // ไม่ใช้ userId ตรง ๆ เพื่อให้ข้อมูลการจอง, สัตว์เลี้ยง และการชำระเงินอยู่ใต้ profile ลูกค้าเดียวกัน
  const profile = await getCustomerProfile(session.user);

  if (!profile.success) {
    throw new Error(profile.error);
  }

  if (!profile.data) {
    redirect("/setup-profile");
  }

  // กติกาใหม่: ถ้าลูกค้ามีคิวที่ยังรอชำระมัดจำอยู่ ให้บล็อกการจองคิวใหม่ก่อน
  // จึง query pending deposit ก่อนโหลด pets/services เพื่อลดงาน DB และกัน UI stepper โผล่ผิดจังหวะ
  const pendingDeposit = await getLatestPendingDepositAppointment(
    profile.data.customerId,
  );

  if (!pendingDeposit.success) {
    throw new Error(pendingDeposit.error);
  }

  if (pendingDeposit.data) {
    return (
      <PendingDepositPaymentScreen
        appointmentId={pendingDeposit.data.id}
        appointmentCreatedAt={pendingDeposit.data.createdAt.toISOString()}
      />
    );
  }

  // ถึงจุดนี้แปลว่าลูกค้าไม่มีคิวค้างมัดจำแล้ว จึงค่อยโหลดข้อมูลสำหรับเริ่มจองคิวใหม่
  const [pets, services] = await Promise.all([
    listPets(profile.data.customerId),
    listServicesWithVariants(),
  ]);

  if (!services.success) {
    throw new Error(services.error);
  }

  if (!pets.success) {
    throw new Error(pets.error);
  }

  return (
    <AppointmentStepper
      pets={pets.data}
      services={services.data}
    />
  );
}
