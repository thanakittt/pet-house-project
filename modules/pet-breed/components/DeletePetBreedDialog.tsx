"use client";

import {  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { PetBreed } from "../types/pet-breed";
import { deletePetBreed } from "../actions/delete-pet-breed";

interface DeletePetBreedDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  petBreed: PetBreed;
}

export function DeletePetBreedDialog({
  open,
  onOpenChange,
  petBreed,
}: DeletePetBreedDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deletePetBreed({ id: petBreed.id });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ลบข้อมูลสายพันธุ์เรียบร้อย");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("deleteCustomer error:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลสายพันธุ์");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      {/* <AlertDialogTrigger asChild>
        <Button variant="outline">Show Dialog</Button>
      </AlertDialogTrigger> */}
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบข้อมูลสายพันธุ์สัตว์เลี้ยง</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบข้อมูลสายพันธุ์สัตว์เลี้ยง &quot;{petBreed.name}&quot; หรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            {isPending ? "กำลังลบ..." : "ยืนยัน"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
