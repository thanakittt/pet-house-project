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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { PlusIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Controller, useForm } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Textarea } from "@/components/ui/textarea";
import { ServiceForm } from "../types/service";
import { createService } from "../actions/create-service";
import { createServiceVariant } from "../actions/create-service-variant";
import { ServiceVariant } from "../types/service-variant";
import { UpdateServiceVariantForm } from "../types/service-variant";
import { updateServiceVariant } from "../actions/update-service-variant";
// import { ServiceForm } from "../types/service";
// import { createService } from "../actions/create-service";

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

  useEffect(() => {
    form.reset({
      petType: serviceVariant.petType,
      size: serviceVariant.size,
      minPrice: serviceVariant.minPrice.toString(),
      maxPrice: serviceVariant.maxPrice.toString(),
      isStartingPriceOnly: serviceVariant.isStartingPriceOnly.toString(),
      durationMinutes: serviceVariant.durationMinutes.toString(),
    });
  }, [serviceVariant]);

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
                      <SelectItem value="DOG">หมา</SelectItem>
                      <SelectItem value="CAT">แมว</SelectItem>
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
                      <SelectItem value="S">เล็ก (S)</SelectItem>
                      <SelectItem value="M">กลาง (M)</SelectItem>
                      <SelectItem value="L">ใหญ่ (L)</SelectItem>
                      <SelectItem value="ALL">ทุกขนาด</SelectItem>
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
                    form.watch("isStartingPriceOnly") === "true";
                  if (isStartingPriceOnly) {
                    return true;
                  }

                  if (!value) {
                    return "กรุณาระบุราคาสูงสุด";
                  }

                  const maxPriceNum = parseFloat(String(value)) || 0;
                  const minPriceNum =
                    parseFloat(String(form.watch("minPrice"))) || 0;
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
                    disabled={form.watch("isStartingPriceOnly") === "true"}
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
              <Button
                type="submit"
                form="update-service-variant"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
