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
import { customer } from "@/lib/permissions";
import { deletePet } from "../actions/delete-pet";

interface DeletePetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  pet: {
    name: string;
    id: string;
  };
}

export function DeletePetDialog({
  open,
  onOpenChange,
  pet,
}: DeletePetDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deletePet({ id: pet.id });
        
        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ลบข้อมูลสัตว์เลี้ยงเรียบร้อย");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("deletePet error:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลสัตว์เลี้ยง");
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
          <AlertDialogTitle>ยืนยันการลบข้อมูลสัตว์เลี้ยง</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบข้อมูลสัตว์เลี้ยง &quot;{pet.name}&quot; หรือไม่?
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
