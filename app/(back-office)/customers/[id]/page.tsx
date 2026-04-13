import { listPets } from "@/modules/pet/queries/list-pets";
import CustomerDetail from "@/modules/customer/components/CustomerDetail";
import { listPetBreeds } from "@/modules/pet-breed/queries/list-pet-breeds";
import { notFound } from "next/navigation";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({
  params,
}: CustomerDetailPageProps) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const petBreeds = await listPetBreeds();

  if (!petBreeds.success) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-destructive bg-destructive/10 p-8 text-center text-destructive">
        <h2 className="mb-2 text-lg font-semibold">
          เกิดข้อผิดพลาดในการดึงข้อมูล
        </h2>
        <p>{petBreeds.error || "ไม่สามารถโหลดข้อมูลสายพันธุ์สัตว์เลี้ยงได้"}</p>
      </div>
    );
  }

  if (!petBreeds.data || petBreeds.data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <h2 className="mb-2 text-lg font-semibold text-foreground">
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
    <CustomerDetail
      petBreeds={petBreeds.data}
      customerId={id}
      pets={pets.data}
    />
  );
}
