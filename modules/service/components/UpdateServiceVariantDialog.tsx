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
import { Controller, useForm, useWatch } from "react-hook-form";
import { PET_TYPE_OPTIONS } from "@/lib/constants/pet-type";
import { PET_SIZE_OPTIONS } from "@/lib/constants/service-type";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { updateServiceVariant } from "../actions/update-service-variant";
import { ServiceVariant, UpdateServiceVariantForm } from "../types/service-variant";

interface UpdateServiceVariantDialogProps {
  serviceVariant: ServiceVariant;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function UpdateServiceVariantDialog({
  serviceVariant,
  open,
  onOpenChange,
}: UpdateServiceVariantDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      petType: "",
      size: "",
      minPrice: "",
      maxPrice: "",
      isStartingPriceOnly: "",
      durationMinutes: "",
    },
    mode: "onBlur",
  });
  const isStartingPriceOnlyValue = useWatch({
    control: form.control,
    name: "isStartingPriceOnly",
  });
  const minPriceValue = useWatch({
    control: form.control,
    name: "minPrice",
  });

  useEffect(() => {
    // reset form ทุกครั้งที่ serviceVariant เปลี่ยนแปลง (เช่น เปิด dialog สำหรับ variant อื่น)
    // `form` ถูกรวมใน deps เพื่อให้ ESLint พอใจ — object นี้มี stable reference จาก useForm
    form.reset({
      petType: serviceVariant.petType,
      size: serviceVariant.size,
      minPrice: serviceVariant.minPrice.toString(),
      maxPrice: serviceVariant.maxPrice.toString(),
      isStartingPriceOnly: serviceVariant.isStartingPriceOnly.toString(),
      durationMinutes: serviceVariant.durationMinutes.toString(),
    });
  }, [serviceVariant, form]);

  const onSubmit = async (data: UpdateServiceVariantForm) => {
    try {
      setServerError(null);

      if (
        data.isStartingPriceOnly !==
          serviceVariant.isStartingPriceOnly.toString() &&
        data.isStartingPriceOnly === "true"
      ) {
        data.maxPrice = "0";
      }

      const result = await updateServiceVariant({
        petType: data.petType,
        size: data.size,
        minPrice: data.minPrice,
        maxPrice: data.maxPrice,
        isStartingPriceOnly: data.isStartingPriceOnly === "true",
        durationMinutes: parseInt(data.durationMinutes),
        id: serviceVariant.id,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onOpenChange(false);
      toast.success("แก้ไขตัวเลือกบริการสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateServiceVariant Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขตัวเลือกบริการ");
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
        onOpenChange(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="update-service-variant">
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขตัวเลือกบริการ
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลตัวเลือกบริการ</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Pet Type Field */}
            <Controller
              name="petType"
              control={form.control}
              rules={{
                required: "กรุณาเลือกประเภทสัตว์เลี้ยง",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภทสัตว์เลี้ยง
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_TYPE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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

            {/* Pet Size Field */}
            <Controller
              name="size"
              control={form.control}
              rules={{
                required: "กรุณาเลือกขนาดสัตว์เลี้ยง",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ขนาดสัตว์เลี้ยง</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {PET_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
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

            {/* Is Starting Price Only Field */}
            <Controller
              name="isStartingPriceOnly"
              control={form.control}
              rules={{
                required: "กรุณาเลือกประเภทราคา",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ราคาเริ่มต้นหรือไม่
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">ราคาเริ่มต้น</SelectItem>
                      <SelectItem value="false">ราคาปกติ</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Min Price Field */}
            <Controller
              name="minPrice"
              control={form.control}
              rules={{
                required: "กรุณาระบุราคาขั้นต่ำ",
                min: {
                  value: 1,
                  message: "ราคาขั้นต่ำต้องมากกว่า 0",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ราคาขั้นต่ำ</FieldLabel>
                  <Input
                    type="number"
                    placeholder="0.00"
                    {...field}
                    onChange={field.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Max Price Field */}
            <Controller
              name="maxPrice"
              control={form.control}
              rules={{
                validate: (value) => {
                  const isStartingPriceOnly =
                    isStartingPriceOnlyValue === "true";
                  if (isStartingPriceOnly) {
                    return true;
                  }

                  if (!value) {
                    return "กรุณาระบุราคาสูงสุด";
                  }

                  const maxPriceNum = parseFloat(String(value)) || 0;
                  const minPriceNum =
                    parseFloat(String(minPriceValue)) || 0;
                  return (
                    maxPriceNum >= minPriceNum ||
                    "ราคาสูงสุดต้องมากกว่าหรือเท่ากับราคาขั้นต่ำ"
                  );
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ราคาสูงสุด</FieldLabel>
                  <Input
                    type="number"
                    placeholder="0.00"
                    disabled={isStartingPriceOnlyValue === "true"}
                    {...field}
                    onChange={field.onChange}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Duration Minutes Field */}
            <Controller
              name="durationMinutes"
              control={form.control}
              rules={{
                required: "กรุณาระบุระยะเวลา",
                min: {
                  value: 1,
                  message: "ระยะเวลาต้องมากกว่า 0",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ระยะเวลา (นาที)</FieldLabel>
                  <Input
                    type="number"
                    placeholder="0"
                    {...field}
                    onChange={field.onChange}
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
                form="update-service-variant"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
