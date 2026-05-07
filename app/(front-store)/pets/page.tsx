import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { listAllPetBreeds } from "@/modules/pet-breed/queries/list-pet-breeds";
import { PetInfoForm } from "@/modules/pet/components/PetInfoForm";
import { listPets } from "@/modules/pet/queries/list-pets";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "สัตว์เลี้ยงของฉัน",
  description: "จัดการข้อมูลสัตว์เลี้ยงของลูกค้า Pet House",
};

export default async function CustomerPetsPage() {
  const session = await requireCustomer();

  if (!session) {
    redirect("/sign-in");
  }

  const profile = await getCustomerProfile(session.user);

  if (!profile.success) {
    throw new Error(profile.error);
  }

  if (!profile.data) {
    redirect("/setup-profile");
  }

  const [pets, petBreeds] = await Promise.all([
    listPets(profile.data.customerId),
    listAllPetBreeds(),
  ]);

  if (!pets.success) {
    throw new Error(pets.error);
  }

  if (!petBreeds.success) {
    throw new Error(petBreeds.error);
  }

  return (
    <main className="space-y-6 mx-auto p-4 md:p-8 pb-20 max-w-5xl min-h-screen overflow-x-hidden font-noto-thai">
      <header className="space-y-2">
        <h1 className="font-bold text-2xl md:text-3xl">
          สัตว์เลี้ยงของฉัน
        </h1>
        <p className="text-muted-foreground">
          เพิ่ม แก้ไข หรือลบข้อมูลสัตว์เลี้ยงของคุณ เพื่อให้การจองคิวและการดูแลทำได้สะดวกขึ้น
        </p>
      </header>

      <PetInfoForm
        pets={pets.data}
        petBreeds={petBreeds.data}
        customerId={profile.data.customerId}
        actionMode="customer"
      />
    </main>
  );
}
