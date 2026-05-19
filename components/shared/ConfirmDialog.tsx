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
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

/**
 * ConfirmDialog — คอมโพเนนต์ยืนยันการดำเนินการแบบ Generic
 *
 * ใช้แทน Confirm Dialog เฉพาะ module ทั้งหมด (Customer, Service, Pet, PetBreed, ServiceVariant)
 * โดยรับ props สำหรับกำหนดข้อความและ action ที่ต้องการเรียก
 *
 * @example
 * <ConfirmDialog
 *   open={isConfirmOpen}
 *   onOpenChange={setIsConfirmOpen}
 *   title="ยืนยันการดำเนินการ"
 *   description={`คุณต้องการดำเนินการ "${action}" หรือไม่?`}
 *   onConfirm={() => performAction()}
 *   successMessage="ดำเนินการเรียบร้อย"
 *   errorMessage="เกิดข้อผิดพลาดในการดำเนินการ"
 * />
 */

interface ConfirmDialogProps {
  /** สถานะเปิด/ปิดของ Dialog */
  open: boolean;
  /** callback เมื่อสถานะเปิด/ปิดเปลี่ยน */
  onOpenChange: (open: boolean) => void;
  /** หัวข้อของ Dialog เช่น "ยืนยันการดำเนินการ" */
  title: string;
  /** คำอธิบายรายละเอียด เช่น "คุณต้องการดำเนินการ "xxx" หรือไม่?" */
  description: string;
  /** ฟังก์ชันที่เรียกเมื่อผู้ใช้กดยืนยัน — ควรเป็น server action ที่คืนค่าผลลัพธ์ */
  onConfirm: () => Promise<{ success: boolean; error?: string }>;
  /** ข้อความแสดงเมื่อดำเนินการสำเร็จ */
  successMessage: string;
  /** ข้อความแสดงเมื่อเกิดข้อผิดพลาดที่ไม่คาดคิด (catch block) */
  errorMessage: string;
  /** โหมดของ Dialog — ใช้ "delete" เมื่อต้องการให้ปุ่มยืนยันเป็น destructive */
  mode?: "default" | "delete";
  /** ทางกลับหลังหลังจากดำเนินการสำเร็จ (optional) */
  redirectPath?: string;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  successMessage,
  errorMessage,
  mode = "default",
  redirectPath = "",
}: ConfirmDialogProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const confirmButtonVariant = mode === "delete" ? "destructive" : "default";

  /** จัดการการกดยืนยันลบ — ใช้ useTransition เพื่อป้องกัน UI freeze */
  const handleConfirm = async () => {
    startTransition(async () => {
      try {
        const result = await onConfirm();

        if (!result.success) {
          toast.error(result.error || errorMessage);
          return;
        }

        toast.success(successMessage);
        onOpenChange(false);
        if (redirectPath) {
          router.push(redirectPath);
        } else {
          router.refresh();
        }
      } catch (error) {
        console.error("Confirm error:", error);
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
            variant={confirmButtonVariant}
            onClick={(e) => {
              e.preventDefault();
              handleConfirm();
            }}
            disabled={isPending}
          >
            <LoadingButtonContent isLoading={isPending} loadingText="กำลังดำเนินการ...">ยืนยัน</LoadingButtonContent>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
