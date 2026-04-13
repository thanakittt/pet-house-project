"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteServiceVariant } from "../actions/delete-service-variant";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceVariantId: string;
}

export function DeleteServiceVariantDialog({
  open,
  onOpenChange,
  serviceVariantId,
}: DeleteServiceDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteServiceVariant({ id: serviceVariantId });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ลบข้อมูลตัวเลือกบริการเรียบร้อย");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("deleteServiceVariant error:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลตัวเลือกบริการ");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ยืนยันการลบข้อมูลตัวเลือกบริการ
          </AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบข้อมูลตัวเลือกบริการหรือไม่?
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
