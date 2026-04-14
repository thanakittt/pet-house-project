import { requireStaff } from "@/lib/session";
import { PetBreedManagement } from "@/modules/pet-breed/components/PetBreedManagement";
import { listPetBreeds } from "@/modules/pet-breed/queries/list-pet-breeds";

export default async function PetBreedsPage() {
  await requireStaff();

  const petBreeds = await listPetBreeds();

  if (!petBreeds.success) {
    throw new Error(petBreeds.error);
  }

  return <PetBreedManagement petBreeds={petBreeds.data} />;
}
