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
import { MinusIcon, PlusIcon } from "lucide-react";
import { Controller, useForm } from "react-hook-form";
import { Input } from "@/components/ui/input";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
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
import { INVENTORY_UNITS } from "../constants/units";

function adjustInventoryNumber(value: number | "", change: 1 | -1): number {
  const currentValue = value === "" ? 0 : value;

  if (value === "" && change === 1) {
    return 1;
  }

  return Math.max(0, currentValue + change);
}

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

          <FieldGroup className="gap-3 px-4 pt-4 pb-3">
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

            <div className="gap-4 grid grid-cols-2">
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
                    <InputGroup>
                      <InputGroupAddon>
                        <InputGroupButton
                          size="icon-xs"
                          aria-label="ลดจำนวนปัจจุบัน"
                          disabled={field.value === "" || field.value <= 0}
                          onClick={() =>
                            field.onChange(
                              adjustInventoryNumber(field.value, -1),
                            )
                          }
                        >
                          <MinusIcon />
                        </InputGroupButton>
                      </InputGroupAddon>
                      <InputGroupInput
                        {...field}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value === ""
                              ? ""
                              : Number(e.target.value),
                          )
                        }
                        min="0"
                        step="1"
                        id={field.name}
                        type="number"
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align="inline-end">
                        <InputGroupButton
                          size="icon-xs"
                          aria-label="เพิ่มจำนวนปัจจุบัน"
                          onClick={() =>
                            field.onChange(
                              adjustInventoryNumber(field.value, 1),
                            )
                          }
                        >
                          <PlusIcon />
                        </InputGroupButton>
                      </InputGroupAddon>
                    </InputGroup>
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
                  <InputGroup>
                    <InputGroupAddon>
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="ลดจุดแจ้งเตือน"
                        disabled={field.value === "" || field.value <= 0}
                        onClick={() =>
                          field.onChange(adjustInventoryNumber(field.value, -1))
                        }
                      >
                        <MinusIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                    <InputGroupInput
                      {...field}
                      onChange={(e) =>
                        field.onChange(
                          e.target.value === "" ? "" : Number(e.target.value),
                        )
                      }
                      min="0"
                      step="1"
                      id={field.name}
                      type="number"
                      aria-invalid={fieldState.invalid}
                    />
                    <InputGroupAddon align="inline-end">
                      <InputGroupButton
                        size="icon-xs"
                        aria-label="เพิ่มจุดแจ้งเตือน"
                        onClick={() =>
                          field.onChange(adjustInventoryNumber(field.value, 1))
                        }
                      >
                        <PlusIcon />
                      </InputGroupButton>
                    </InputGroupAddon>
                  </InputGroup>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2 px-4 pt-2 pb-4">
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
                form="update-inventory-form"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={form.formState.isSubmitting}
               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
