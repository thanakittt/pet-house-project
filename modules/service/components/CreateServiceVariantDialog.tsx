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
  // FieldContent ถูกลบออกเนื่องจากไม่ได้ใช้งานในคอมโพเนนต์นี้
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PlusIcon } from "lucide-react";
import { useState } from "react";
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
// Textarea ถูกลบออกเพราะไม่มี field ที่ต้องการ textarea ในฟอร์มนี้
import { createServiceVariant } from "../actions/create-service-variant";
// import เฉพาะ ServiceVariantForm — ServiceVariant ไม่ได้ใช้โดยตรง
import { ServiceVariantForm } from "../types/service-variant";

interface CreateServiceVariantDialogProps {
  serviceId: string;
}

export function CreateServiceVariantDialog({
  serviceId,
}: CreateServiceVariantDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      petType: "",
      size: "",
      minPrice: "",
      maxPrice: "",
      isStartingPriceOnly: "false",
      durationMinutes: "",
      serviceId: serviceId,
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

  const onSubmit = async (data: ServiceVariantForm) => {
    try {
      setServerError(null);

      const result = await createServiceVariant(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("สร้างตัวเลือกบริการสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateService Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างตัวเลือกบริการ");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-service-variant">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            {" "}
            <PlusIcon className="size-4" /> เพิ่มตัวเลือกบริการ
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มตัวเลือกบริการ
            </DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลตัวเลือกบริการ</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

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
                form="create-service-variant"
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
