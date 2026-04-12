import { Pet } from "@/modules/pet/types/pet";
import PetTypeBadge from "./PetTypeBadge";
import { Button } from "@/components/ui/button";
import { PencilIcon, TrashIcon } from "lucide-react";

interface PetCardProps {
  pet: Pet;
  onEdit: () => void;
  onDelete: () => void;
}

export function PetCard({ pet, onEdit, onDelete }: PetCardProps) {
  return (
    <div
      className="flex justify-between gap-2 p-4 border rounded-lg transition-colors cursor-pointer"
    >
      <div className="flex flex-row items-start gap-4">
        <PetTypeBadge
          type={pet.breed.type.toLowerCase()}
          className="px-3 py-6 rounded-md"
        />
        <div className="flex flex-col gap-2 w-full">
          <p className="font-bold text-base md:text-lg">{pet.name}</p>
          <div className="flex flex-row gap-2 text-muted-foreground text-sm">
            <p className="text-sm md:text-base">{pet.breed.name}</p>
          </div>
        </div>
      </div>

      <div className="space-x-2">
        <Button
          variant="outline"
          size="icon"
          aria-label="แก้ไขข้อมูล"
          onClick={onEdit}
        >
          <PencilIcon className="size-3.5" />
        </Button>

        <Button
          variant="outline"
          size="icon"
          aria-label="ลบข้อมูล"
          onClick={onDelete}
        >
          <TrashIcon className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
