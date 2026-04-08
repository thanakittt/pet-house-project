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
import { deleteCustomer } from "../actions/delete-customer";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

interface DeleteCustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: {
    nickname: string;
    id: string;
  };
}

export function DeleteCustomerDialog({
  open,
  onOpenChange,
  customer,
}: DeleteCustomerDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await deleteCustomer(customer.id);

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success("ลบข้อมูลลูกค้าเรียบร้อย");
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("deleteCustomer error:", error);
        toast.error("เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า");
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
          <AlertDialogTitle>ยืนยันการลบข้อมูลลูกค้า</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบข้อมูลลูกค้า &quot;{customer.nickname}&quot; หรือไม่?
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
