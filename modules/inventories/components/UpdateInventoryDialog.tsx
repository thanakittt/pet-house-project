"use client";

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
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { useEffect, useState } from "react";
import { InventoryForm, InventoryItem } from "../types/inventory";
import { updateInventory } from "../actions/update-inventory";
import { toast } from "sonner";
import { InventoryCategory } from "@/modules/inventory-category/types/inventory-category";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { INVENTORY_UNITS } from "../constants/units";

export function UpdateInventoryDialog({
  inventoryCategories,
  inventory,
  open,
  onOpenChange,
}: {
  inventoryCategories: InventoryCategory[];
  inventory: InventoryItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<InventoryForm>({
    defaultValues: {
      name: "",
      quantity: 0,
      reorderLevel: 0,
      inventoryCategoryId: "",
      unit: "PIECE",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (inventory && open) {
      form.reset({
        name: inventory.name,
        quantity: inventory.quantity,
        reorderLevel: inventory.reorderLevel,
        inventoryCategoryId: inventory.inventoryCategoryId,
        unit: inventory.unit,
      });
    }
  }, [inventory, open, form]);

  const onSubmit = async (data: InventoryForm) => {
    if (!inventory) return;

    try {
      setServerError(null);
      const response = await updateInventory(inventory.id, data);

      if (response.success) {
        toast.success("แก้ไขข้อมูลสินค้าคงคลังเรียบร้อยแล้ว");
        onOpenChange(false);
      } else {
        setServerError(
          response.error || "เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้าคงคลัง",
        );
      }
    } catch (error) {
      console.error("UpdateInventory Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลสินค้าคงคลัง");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(val) => {
        setServerError(null);
        if (!val) {
          form.reset();
        }
        onOpenChange(val);
      }}
    >
      <DialogContent className="md:max-w-md">
        <form onSubmit={form.handleSubmit(onSubmit)} id="update-inventory-form">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลสินค้า
            </DialogTitle>
            <DialogDescription>
              แก้ไขรายละเอียดข้อมูลสินค้าคงคลัง
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3 pt-4">
            <Controller
              name="name"
              control={form.control}
              rules={{ required: "กรุณาระบุชื่อสินค้า" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อสินค้า</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="เช่น แชมพู, ทิชชู่"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="inventoryCategoryId"
              control={form.control}
              rules={{ required: "กรุณาระบุหมวดหมู่สินค้า" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>หมวดหมู่สินค้า</FieldLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                    >
                      <SelectValue placeholder="เลือกหมวดหมู่สินค้า" />
                    </SelectTrigger>
                    <SelectContent>
                      {inventoryCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <Controller
                name="quantity"
                control={form.control}
                rules={{
                  required: "กรุณาระบุจำนวนสินค้า",
                  min: { value: 0, message: "จำนวนต้องไม่ติดลบ" },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>จำนวนปัจจุบัน</FieldLabel>
                    <Input
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value ? Number(e.target.value) : "",
                        )
                      }
                      id={field.name}
                      type="number"
                      aria-invalid={fieldState.invalid}
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="unit"
                control={form.control}
                rules={{ required: "กรุณาระบุหน่วยสินค้า" }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>หน่วย</FieldLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger
                        id={field.name}
                        aria-invalid={fieldState.invalid}
                      >
                        <SelectValue placeholder="เลือกหน่วย" />
                      </SelectTrigger>
                      <SelectContent>
                        {INVENTORY_UNITS.map((u) => (
                          <SelectItem key={u.value} value={u.value}>
                            {u.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            <Controller
              name="reorderLevel"
              control={form.control}
              rules={{
                required: "กรุณาระบุจุดสั่งซื้อ",
                min: { value: 0, message: "ต้องไม่ติดลบ" },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    จุดแจ้งเตือน (Reorder Level)
                  </FieldLabel>
                  <Input
                    {...field}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? Number(e.target.value) : "",
                      )
                    }
                    id={field.name}
                    type="number"
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2 px-4 pb-4 pt-2">
              <DialogClose asChild>
                <Button
                  type="button"
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                  disabled={form.formState.isSubmitting}
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="update-inventory-form"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
