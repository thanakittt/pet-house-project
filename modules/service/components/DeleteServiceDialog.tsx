"use client";

import { LoadingButtonContent } from "@/components/shared/LoadingButton";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  // AlertDialogTrigger ไม่ได้ใช้ — Dialog นี้ถูกควบคุมด้วย open prop จากภายนอก
} from "@/components/ui/alert-dialog";
// Button ไม่ได้ใช้โดยตรง — ใช้ AlertDialogAction/Cancel แทน
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { deleteService } from "../actions/delete-service";

interface DeleteServiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: {
    id: string;
    name: string;
  };
}

export function DeleteServiceDialog({
  open,
  onOpenChange,
  service,
}: DeleteServiceDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteService({ id: service.id });

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ลบข้อมูลบริการเรียบร้อย");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("deleteService error:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลบริการ");
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            ยืนยันการลบข้อมูลบริการ
          </AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบข้อมูลบริการ &quot;{service.name}&quot;
            หรือไม่?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete} disabled={isPending}>
            <LoadingButtonContent isLoading={isPending} loadingText="กำลังลบ...">ยืนยัน</LoadingButtonContent>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
