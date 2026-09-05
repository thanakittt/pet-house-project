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
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { createVendor } from "../actions/create-vendor";
import { VendorFormValues } from "../types/vendor";

export function CreateVendorDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<VendorFormValues>({
    defaultValues: {
      name: "",
      contactName: "",
      phone: "",
      email: "",
      address: "",
      taxId: "",
      isActive: true,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: VendorFormValues) => {
    try {
      setServerError(null);

      const result = await createVendor(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("เพิ่มข้อมูลผู้จำหน่ายสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateVendor Error:", error);
      setServerError("เกิดข้อผิดพลาดในการเพิ่มข้อมูลผู้จำหน่าย");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-vendor-form">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            <PlusIcon className="size-4" /> เพิ่มผู้จำหน่าย
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มข้อมูลผู้จำหน่าย
            </DialogTitle>
            <DialogDescription>
              กรอกข้อมูลคู่ค้า/ผู้จำหน่ายสำหรับจัดซื้อสินค้า
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive font-medium">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            {/* Vendor Name Field */}
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อผู้จำหน่าย",
                maxLength: {
                  value: 150,
                  message: "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ชื่อผู้จำหน่าย <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="เช่น บริษัท เพ็ทแลนด์ จำกัด"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Row 1: Contact Person & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name="contactName"
                control={form.control}
                rules={{
                  maxLength: {
                    value: 100,
                    message: "ชื่อผู้ติดต่อต้องไม่เกิน 100 ตัวอักษร",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>ชื่อผู้ติดต่อ</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น คุณสมชาย (ฝ่ายขาย)"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="phone"
                control={form.control}
                rules={{
                  maxLength: {
                    value: 50,
                    message: "เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>เบอร์โทรศัพท์</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น 02-123-4567, 081-xxx-xxxx"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Row 2: Email & Tax ID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Controller
                name="email"
                control={form.control}
                rules={{
                  maxLength: {
                    value: 100,
                    message: "อีเมลต้องไม่เกิน 100 ตัวอักษร",
                  },
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: "รูปแบบอีเมลไม่ถูกต้อง",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>อีเมล</FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={field.name}
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น contact@supplier.com"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <Controller
                name="taxId"
                control={form.control}
                rules={{
                  maxLength: {
                    value: 20,
                    message: "เลขผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      เลขประจำตัวผู้เสียภาษี
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="เช่น 0105559012345"
                      autoComplete="off"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </div>

            {/* Address */}
            <Controller
              name="address"
              control={form.control}
              rules={{
                maxLength: {
                  value: 500,
                  message: "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ที่อยู่</FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ที่อยู่สำหรับออกใบสั่งซื้อ / จัดส่งสินค้า"
                    rows={3}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter className="px-4 pb-4">
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                  type="button"
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="create-vendor-form"
                className="px-6 py-5 text-sm cursor-pointer"
                isLoading={form.formState.isSubmitting}
                loadingText="กำลังบันทึก..."
              >
                บันทึก
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
