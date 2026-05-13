import type { SearchableComboboxOption } from "@/components/shared/SearchableCombobox";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import type { PetBreed } from "@/modules/pet-breed/types/pet-breed";

const PET_SIZE_GROUP_ORDER = ["S", "M", "L", "ALL"] as const;

function getPetSizeOrder(size: string): number {
  const sizeIndex = PET_SIZE_GROUP_ORDER.indexOf(
    size as (typeof PET_SIZE_GROUP_ORDER)[number],
  );

  if (sizeIndex === -1) {
    return PET_SIZE_GROUP_ORDER.length;
  }

  return sizeIndex;
}

export function createPetBreedComboboxOptions(
  petBreeds: PetBreed[],
  selectedPetType: string,
): SearchableComboboxOption[] {
  return petBreeds
    .filter((breed) => breed.type === selectedPetType)
    .sort((firstBreed, secondBreed) => {
      // เรียงตามขนาดเพื่อให้หัวข้อใน combobox แสดงจากเล็กไปใหญ่เสมอ
      return (
        getPetSizeOrder(firstBreed.size) - getPetSizeOrder(secondBreed.size)
      );
    })
    .map((breed) => ({
      value: breed.id,
      label: breed.name,
      groupLabel: PET_SIZE_LABELS[breed.size] ?? breed.size,
    }));
}
