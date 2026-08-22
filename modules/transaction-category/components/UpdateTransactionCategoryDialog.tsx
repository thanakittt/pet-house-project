"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  TransactionCategory,
  TransactionCategoryForm,
} from "../types/transaction-category";
import { updateTransactionCategory } from "../actions/update-transaction-category";

interface UpdateTransactionCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transactionCategory: TransactionCategory;
}

export function UpdateTransactionCategoryDialog({
  open,
  onOpenChange,
  transactionCategory,
}: UpdateTransactionCategoryDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  // กำหนดค่าเริ่มต้นของฟอร์มจากข้อมูลที่รับมา
  const form = useForm<TransactionCategoryForm>({
    defaultValues: {
      name: transactionCategory.name,
      type: transactionCategory.type,
    },
    mode: "onBlur",
  });

  // เมื่อ prop transactionCategory เปลี่ยน (เปลี่ยน row ที่เลือก) ให้ reset ค่าฟอร์มใหม่
  useEffect(() => {
    form.reset({
      name: transactionCategory.name,
      type: transactionCategory.type,
    });
  }, [transactionCategory, form]);

  // จัดการ submit ฟอร์ม
  const onSubmit = async (data: TransactionCategoryForm) => {
    try {
      setServerError(null);

      const result = await updateTransactionCategory({
        id: transactionCategory.id,
        data,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // ปิด dialog, แสดงการแจ้งเตือน และ refresh หน้า
      onOpenChange(false);
      toast.success("แก้ไขข้อมูลหมวดหมู่ธุรกรรมเรียบร้อย");
      router.refresh();
    } catch (error) {
      console.error("UpdateTransactionCategory Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลหมวดหมู่ธุรกรรม");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // เมื่อปิด dialog ให้ reset ฟอร์มกลับค่าเดิมและล้าง error
        if (!value) {
          form.reset({
            name: transactionCategory.name,
            type: transactionCategory.type,
          });
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id="update-transaction-category"
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขหมวดหมู่ธุรกรรม
            </DialogTitle>
            <DialogDescription>แก้ไขข้อมูลหมวดหมู่ธุรกรรม</DialogDescription>
            {/* แสดง server error ถ้ามี */}
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* ชื่อหมวดหมู่ */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อหมวดหมู่",
                maxLength: {
                  value: 100,
                  message: "ชื่อหมวดหมู่ไม่เกิน 100 ตัวอักษร",
                },
                validate: (value: string) => {
                  if (value.trim() === "") {
                    return "กรุณาระบุชื่อหมวดหมู่";
                  }
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อหมวดหมู่</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อหมวดหมู่"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* ประเภทธุรกรรม (EXPENSE / INCOME) */}
            <Controller
              name="type"
              control={form.control}
              rules={{ required: "กรุณาเลือกประเภทธุรกรรม" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="update-type">ประเภทธุรกรรม</FieldLabel>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id="update-type"
                      className="w-full"
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="เลือกประเภทธุรกรรม" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EXPENSE">รายจ่าย</SelectItem>
                      <SelectItem value="INCOME">รายรับ</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="update-transaction-category"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
