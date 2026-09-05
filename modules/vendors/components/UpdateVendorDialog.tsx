"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateVendor } from "../actions/update-vendor";
import { Vendor, VendorFormValues } from "../types/vendor";

interface UpdateVendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor: Vendor;
}

export function UpdateVendorDialog({
  open,
  onOpenChange,
  vendor,
}: UpdateVendorDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<VendorFormValues>({
    defaultValues: {
      name: vendor.name,
      contactName: vendor.contactName ?? "",
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      address: vendor.address ?? "",
      taxId: vendor.taxId ?? "",
      isActive: vendor.isActive,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({
      name: vendor.name,
      contactName: vendor.contactName ?? "",
      phone: vendor.phone ?? "",
      email: vendor.email ?? "",
      address: vendor.address ?? "",
      taxId: vendor.taxId ?? "",
      isActive: vendor.isActive,
    });
  }, [vendor, form]);

  const onSubmit = async (data: VendorFormValues) => {
    try {
      setServerError(null);

      const result = await updateVendor({
        id: vendor.id,
        data,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      onOpenChange(false);
      toast.success("แก้ไขข้อมูลผู้จำหน่ายสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateVendor Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้จำหน่าย");
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
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={form.handleSubmit(onSubmit)} id="update-vendor-form">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขข้อมูลผู้จำหน่าย
            </DialogTitle>
            <DialogDescription>
              อัปเดตรายละเอียดและสถานะการใช้งานของผู้จำหน่าย
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
                  <FieldLabel htmlFor={`update-${field.name}`}>
                    ชื่อผู้จำหน่าย <span className="text-destructive">*</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`update-${field.name}`}
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

            {/* Contact Person */}
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
                  <FieldLabel htmlFor={`update-${field.name}`}>
                    ชื่อผู้ติดต่อ
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id={`update-${field.name}`}
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Phone */}
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
                    <FieldLabel htmlFor={`update-${field.name}`}>
                      เบอร์โทรศัพท์
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`update-${field.name}`}
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

              {/* Tax ID */}
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
                    <FieldLabel htmlFor={`update-${field.name}`}>
                      เลขประจำตัวผู้เสียภาษี
                    </FieldLabel>
                    <Input
                      {...field}
                      value={field.value ?? ""}
                      id={`update-${field.name}`}
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

            {/* Email */}
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
                  <FieldLabel htmlFor={`update-${field.name}`}>
                    อีเมล
                  </FieldLabel>
                  <Input
                    {...field}
                    value={field.value ?? ""}
                    id={`update-${field.name}`}
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
                  <FieldLabel htmlFor={`update-${field.name}`}>
                    ที่อยู่
                  </FieldLabel>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    id={`update-${field.name}`}
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

            {/* Active Status Checkbox */}
            <Controller
              name="isActive"
              control={form.control}
              render={({ field }) => (
                <div className="flex items-center space-x-2 pt-2">
                  <Checkbox
                    id="update-vendor-is-active"
                    checked={field.value}
                    onCheckedChange={(checked) => field.onChange(Boolean(checked))}
                  />
                  <label
                    htmlFor="update-vendor-is-active"
                    className="text-sm font-medium leading-none cursor-pointer peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    เปิดใช้งานผู้จำหน่ายนี้ (สามารถเลือกในใบสั่งซื้อได้)
                  </label>
                </div>
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
                form="update-vendor-form"
                className="px-6 py-5 text-sm cursor-pointer"
                isLoading={form.formState.isSubmitting}
                loadingText="กำลังบันทึก..."
              >
                บันทึกการเปลี่ยนแปลง
              </LoadingButton>
            </div>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
