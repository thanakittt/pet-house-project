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
import { InventoryCategoryForm } from "../types/inventory-category";
import { createInventoryCategory } from "../actions/create-inventory-category";

export function CreateInventoryCategoryDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: InventoryCategoryForm) => {
    try {
      setServerError(null);

      const result = await createInventoryCategory(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างหมวดหมู่สินค้าสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateInventoryCategory Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างหมวดหมู่สินค้า");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
          setServerError(null);
        }
        setOpen(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id="create-inventory-category"
      >
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            <PlusIcon className="size-4" /> เพิ่มหมวดหมู่สินค้า
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มหมวดหมู่สินค้า
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลหมวดหมู่สินค้า</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Category Name Field */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อหมวดหมู่",
                maxLength: {
                  value: 100,
                  message: "ชื่อหมวดหมู่ไม่เกิน 100 ตัวอักษร",
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
                form="create-inventory-category"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
