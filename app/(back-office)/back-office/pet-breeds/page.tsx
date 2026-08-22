import type { Metadata } from "next";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { requireStaff } from "@/lib/session";
import { PetBreedManagement } from "@/modules/pet-breed/components/PetBreedManagement";
import {
  listPetBreeds,
  parsePetBreedPage,
  parsePetBreedSizeFilter,
  parsePetBreedTypeFilter,
} from "@/modules/pet-breed/queries/list-pet-breeds";

export const metadata: Metadata = {
  title: "จัดการสายพันธุ์สัตว์เลี้ยง",
  description: "ดูแลข้อมูลสายพันธุ์สัตว์เลี้ยงที่ใช้ในระบบ",
};

type PetBreedsPageProps = {
  searchParams: Promise<{
    page?: string;
    q?: string;
    size?: string;
    type?: string;
  }>;
};

export default async function PetBreedsPage({
  searchParams,
}: PetBreedsPageProps) {
  await requireStaff();

  const query = await searchParams;
  const petBreeds = await listPetBreeds({
    page: parsePetBreedPage(query.page),
    q: query.q,
    size: parsePetBreedSizeFilter(query.size),
    type: parsePetBreedTypeFilter(query.type),
  });

  if (!petBreeds.success) {
    throw new Error(petBreeds.error);
  }

  return (
    <>
      <SiteHeader title="จัดการสายพันธุ์" />
      <BackOfficeContainer>
        <PetBreedManagement {...petBreeds.data} />
      </BackOfficeContainer>
    </>
  );
}
