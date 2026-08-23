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
  DialogTrigger,
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
import { PlusIcon } from "lucide-react";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { TransactionCategoryForm } from "../types/transaction-category";
import { createTransactionCategory } from "../actions/create-transaction-category";

export function CreateTransactionCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // กำหนดค่าเริ่มต้นของฟอร์ม
  const form = useForm<TransactionCategoryForm>({
    defaultValues: {
      name: "",
      type: "EXPENSE",
    },
    mode: "onBlur",
  });

  // จัดการ submit ฟอร์ม
  const onSubmit = async (data: TransactionCategoryForm) => {
    try {
      setServerError(null);

      const result = await createTransactionCategory(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      // ปิด dialog, reset ฟอร์ม, แสดงการแจ้งเตือน และ refresh หน้า
      setOpen(false);
      form.reset();
      toast.success("สร้างหมวดหมู่ธุรกรรมสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateTransactionCategory Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างหมวดหมู่ธุรกรรม");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        // เมื่อปิด dialog ให้ reset ฟอร์มและล้าง error
        if (!value) {
          form.reset();
          setServerError(null);
        }
        setOpen(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id="create-transaction-category"
      >
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            <PlusIcon className="size-4" /> เพิ่มหมวดหมู่ธุรกรรม
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มหมวดหมู่ธุรกรรม
            </DialogTitle>
            <DialogDescription>
              กรุณากรอกข้อมูลหมวดหมู่ธุรกรรม
            </DialogDescription>
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
                  <FieldLabel htmlFor="type">ประเภทธุรกรรม</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id="type"
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
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="create-transaction-category"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
