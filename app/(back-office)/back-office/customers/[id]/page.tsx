import { listPets } from "@/modules/pet/queries/list-pets";
import CustomerDetail from "@/modules/customer/components/CustomerDetail";
import { listAllPetBreeds } from "@/modules/pet-breed/queries/list-pet-breeds";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { requireStaff } from "@/lib/session";
import {
  getCustomerAppointmentHistory,
  parseCustomerAppointmentHistoryPage,
} from "@/modules/appointment/queries/get-customer-history";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    historyPage?: string;
  }>;
}

export default async function CustomerDetailPage({
  params,
  searchParams,
}: CustomerDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  await requireStaff();

  if (!id) {
    notFound();
  }

  const historyPage = parseCustomerAppointmentHistoryPage(query.historyPage);

  const [petBreeds, appointmentHistory] = await Promise.all([
    listAllPetBreeds(),
    getCustomerAppointmentHistory(id, { page: historyPage }),
  ]);

  if (!petBreeds.success) {
    return (
      <div className="flex flex-col justify-center items-center bg-destructive/10 p-8 border border-destructive rounded-lg text-destructive text-center">
        <h2 className="mb-2 font-semibold text-lg">
          เกิดข้อผิดพลาดในการดึงข้อมูล
        </h2>
        <p>{petBreeds.error || "ไม่สามารถโหลดข้อมูลสายพันธุ์สัตว์เลี้ยงได้"}</p>
      </div>
    );
  }

  if (!petBreeds.data || petBreeds.data.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center p-8 border border-dashed rounded-lg text-center">
        <h2 className="mb-2 font-semibold text-foreground text-lg">
          ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง
        </h2>
        <p className="text-muted-foreground">
          กรุณาเพิ่มข้อมูลสายพันธุ์สัตว์เลี้ยงก่อน
        </p>
      </div>
    );
  }

  const pets = await listPets(id);

  if (!pets.success) {
    throw new Error(pets.error);
  }

  return (
    <>
      <SiteHeader title="รายละเอียดลูกค้า" />
      <div className="p-6">
        <CustomerDetail
          appointmentHistory={appointmentHistory}
          petBreeds={petBreeds.data}
          customerId={id}
          pets={pets.data}
        />
      </div>
    </>
  );
}
