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

/**
 * DeleteConfirmDialog — คอมโพเนนต์ยืนยันการลบข้อมูลแบบ Generic
 *
 * ใช้แทน Delete Dialog เฉพาะ module ทั้งหมด (Customer, Service, Pet, PetBreed, ServiceVariant)
 * โดยรับ props สำหรับกำหนดข้อความและ action ที่ต้องการเรียก
 *
 * @example
 * <DeleteConfirmDialog
 *   open={isDeleteOpen}
 *   onOpenChange={setIsDeleteOpen}
 *   title="ยืนยันการลบข้อมูลลูกค้า"
 *   description={`คุณต้องการลบข้อมูลลูกค้า "${customer.nickname}" หรือไม่?`}
 *   onConfirm={() => deleteCustomer(customer.id)}
 *   successMessage="ลบข้อมูลลูกค้าเรียบร้อย"
 *   errorMessage="เกิดข้อผิดพลาดในการลบข้อมูลลูกค้า"
 * />
 */

interface DeleteConfirmDialogProps {
  /** สถานะเปิด/ปิดของ Dialog */
  open: boolean;
  /** callback เมื่อสถานะเปิด/ปิดเปลี่ยน */
  onOpenChange: (open: boolean) => void;
  /** หัวข้อของ Dialog เช่น "ยืนยันการลบข้อมูลลูกค้า" */
  title: string;
  /** คำอธิบายรายละเอียด เช่น "คุณต้องการลบข้อมูลลูกค้า "xxx" หรือไม่?" */
  description: string;
  /** ฟังก์ชันที่เรียกเมื่อผู้ใช้กดยืนยัน — ควรเป็น server action ที่คืนค่าผลลัพธ์ */
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  /** ข้อความแสดงเมื่อลบสำเร็จ */
  successMessage: string;
  /** ข้อความแสดงเมื่อเกิดข้อผิดพลาดที่ไม่คาดคิด (catch block) */
  errorMessage: string;
}

export function DeleteConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  successMessage,
  errorMessage,
}: DeleteConfirmDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  /** จัดการการกดยืนยันลบ — ใช้ useTransition เพื่อป้องกัน UI freeze */
  const handleDelete = async () => {
    startTransition(async () => {
      try {
        const result = await onConfirm();

        if (!result.success) {
          toast.error(result.error);
          return;
        }

        toast.success(successMessage);
        onOpenChange(false);
        router.refresh();
      } catch (error) {
        console.error("Delete error:", error);
        toast.error(errorMessage);
      }
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault();
              handleDelete();
            }}
            disabled={isPending}
          >
            {isPending ? "กำลังลบ..." : "ยืนยัน"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
