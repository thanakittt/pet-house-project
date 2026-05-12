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
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  InventoryCategory,
  InventoryCategoryForm,
} from "../types/inventory-category";
import { updateInventoryCategory } from "../actions/update-inventory-category";

interface UpdateInventoryCategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inventoryCategory: InventoryCategory;
}

export function UpdateInventoryCategoryDialog({
  open,
  onOpenChange,
  inventoryCategory,
}: UpdateInventoryCategoryDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: inventoryCategory.name,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({
      name: inventoryCategory.name,
    });
  }, [inventoryCategory, form]);

  const onSubmit = async (data: InventoryCategoryForm) => {
    try {
      setServerError(null);

      const result = await updateInventoryCategory({
        id: inventoryCategory.id,
        data,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onOpenChange(false);
      toast.success("แก้ไขข้อมูลหมวดหมู่สินค้าเรียบร้อย");
      router.refresh();
    } catch (error) {
      console.error("UpdateInventoryCategory Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลหมวดหมู่สินค้า");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset({
            name: inventoryCategory.name,
          });
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id="update-inventory-category"
      >
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขหมวดหมู่สินค้า
            </DialogTitle>
            <DialogDescription>แก้ไขข้อมูลหมวดหมู่สินค้า</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

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
                form="update-inventory-category"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
