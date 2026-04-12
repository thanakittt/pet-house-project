import { listPets } from "@/modules/pet/queries/list-pets";
import CustomerDetail from "@/modules/customer/components/CustomerDetail";
import { listPetBreeds } from "@/modules/pet-breed/actions/list-pet-breeds";

interface CustomerDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function CustomerDetailPage({ params }: CustomerDetailPageProps) {
  const { id } = await params;

  if (!id) {
    throw new Error("ไม่พบ ID ของลูกค้า กรุณาลองใหม่อีกครั้ง");
  }

  const petBreeds = await listPetBreeds();

  if (!petBreeds.success) {
    throw new Error(petBreeds.error);
  }

  if (!petBreeds.data || petBreeds.data.length === 0) {
    throw new Error("ไม่พบข้อมูลสายพันธุ์สัตว์เลี้ยง กรุณาเพิ่มข้อมูลสายพันธุ์สัตว์เลี้ยงก่อน");
  }

  const pets = await listPets(id);

  if (!pets.success) {
    throw new Error(pets.error);
  }

  return <CustomerDetail petBreeds={petBreeds.data} customerId={id} pets={pets.data} />;
}
