"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlusIcon } from "lucide-react";

import { addHealthReport } from "@/modules/operation/actions/create-health-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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

type HealthReportForm = {
  topic: string;
  description: string;
};

interface Props {
  appointmentId: string;
  petId: string;
}

export default function HealthReportModal({ appointmentId, petId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<HealthReportForm>({
    defaultValues: {
      topic: "",
      description: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: HealthReportForm) => {
    try {
      setServerError(null);

      const result = await addHealthReport({
        ...data,
        appointmentId,
        petId,
      });

      if (!result.success) {
        setServerError(result.error || "เกิดข้อผิดพลาด");
        return;
      }

      setOpen(false);
      form.reset();
      toast.success("บันทึกรายงานสุขภาพสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateHealthReport Error:", error);
      setServerError("เกิดข้อผิดพลาดในการบันทึกรายงานสุขภาพ");
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
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-health-report">
        {/* Trigger Button: ปรับ style ให้เหมาะกับ Header ของ Card */}
        <DialogTrigger asChild className="text-sm cursor-pointer">
          <Button type="button" size="lg" variant="outline">
            <PlusIcon className="mr-2 size-3.5" /> เพิ่มรายงาน
          </Button>
        </DialogTrigger>

        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              เพิ่มรายงานสุขภาพเบื้องต้น
            </DialogTitle>
            <DialogDescription>
              บันทึกความผิดปกติ เห็บหมัด หรือข้อควรระวังสำหรับสัตว์เลี้ยง
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-4 px-4 pt-2 pb-3">
            {/* Topic Field */}
            <Controller
              name="topic"
              control={form.control}
              rules={{
                required: "กรุณาระบุหัวข้อ",
                maxLength: {
                  value: 100,
                  message: "หัวข้อไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    หัวข้อ
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="เช่น พบเห็บหมัด, มีแผลที่หูซ้าย..."
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
                required: "กรุณาระบุรายละเอียด",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    รายละเอียด
                  </FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="อธิบายรายละเอียดเพิ่มเติม..."
                    rows={4}
                    className="resize-none"
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
                form="create-health-report"
                className="px-6 py-5 text-sm cursor-pointer"

                isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
