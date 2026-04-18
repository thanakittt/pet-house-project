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
import { SERVICE_TYPE_OPTIONS } from "@/lib/constants/service-type";
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
import { Service, ServiceForm } from "../types/service";
// createService ถูกลบออก — UpdateServiceDialog ใช้แค่ updateService
import { updateService } from "../actions/update-service";

interface UpdateServiceDialogProps {
  service: Service,
  open: boolean,
  onOpenChange: (open: boolean) => void,
}

export function UpdateServiceDialog({ service, open, onOpenChange }: UpdateServiceDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm({
    defaultValues: {
      name: "",
      serviceType: "",
      description: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (service) {
      form.reset({
        name: service.name,
        serviceType: service.serviceType,
        description: service.description || "",
      });
    }
  }, [service, form]);
  const onSubmit = async (data: ServiceForm) => {
    try {
      setServerError(null);

      const result = await updateService({
        ...data,
        id: service.id,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onOpenChange(false);
      form.reset();
      toast.success("แก้ไขบริการสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateService Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขบริการ");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="update-service">
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลบริการ
            </DialogTitle>
            <DialogDescription>
              กรุณากรอกข้อมูลบริการ
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Service Name Field */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อบริการ",
                maxLength: {
                  value: 100,
                  message: "ชื่อบริการไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อบริการ</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อบริการ"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Description Field */}
            <Controller
              name="description"
              control={form.control}
              rules={{
                maxLength: {
                  value: 1000,
                  message: "คำอธิบายไม่เกิน 1000 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>คำอธิบาย</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุคำอธิบาย"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Service Type Field */}
            <Controller
              name="serviceType"
              control={form.control}
              rules={{
                required: "กรุณาเลือกประเภทบริการ",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภทบริการ
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_TYPE_OPTIONS.map((option) => (
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
                form="update-service"
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
