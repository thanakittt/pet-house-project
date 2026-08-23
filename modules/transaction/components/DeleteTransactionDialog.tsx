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
} from "@/components/ui/alert-dialog";
import { useState } from "react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Transaction } from "../types/transaction";
import { deleteTransaction } from "../actions/delete-transaction";

interface DeleteTransactionDialogProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export function DeleteTransactionDialog({
  transaction,
  onClose,
}: DeleteTransactionDialogProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!transaction) return;

    try {
      setIsDeleting(true);
      const result = await deleteTransaction(transaction.id);

      if (!result.success) {
        toast.error(result.error || "เกิดข้อผิดพลาดในการลบรายการ");
        return;
      }

      toast.success("ลบรายการเคลื่อนไหวสำเร็จ");
      router.refresh();
      onClose();
    } catch (error) {
      console.error("DeleteTransaction Error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบรายการ");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <AlertDialog open={!!transaction} onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>ยืนยันการลบรายการ?</AlertDialogTitle>
          <AlertDialogDescription>
            คุณต้องการลบรายการ <strong>{transaction?.note || "ไม่มีหมายเหตุ"}</strong> จำนวน{" "}
            <strong>{transaction?.amount} บาท</strong> ใช่หรือไม่? การดำเนินการนี้ไม่สามารถย้อนกลับได้
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isDeleting}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            <LoadingButtonContent isLoading={isDeleting} loadingText="กำลังลบ...">ลบข้อมูล</LoadingButtonContent>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
