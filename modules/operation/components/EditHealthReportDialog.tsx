"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Edit2Icon } from "lucide-react";

import { updateHealthReport } from "../actions/update-health-report";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
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
import type { HealthReport } from "./OperationDetailClient"; // ปรับ path ให้ดึง interface มาใช้

type HealthReportForm = {
  topic: string;
  description: string;
};

interface Props {
  report: HealthReport;
  appointmentId: string;
  petId: string;
}

export default function EditHealthReportDialog({
  report,
  appointmentId,
  petId,
}: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<HealthReportForm>({
    defaultValues: {
      topic: report.topic,
      description: report.description,
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: HealthReportForm) => {
    try {
      setServerError(null);

      const result = await updateHealthReport({
        id: report.id,
        topic: data.topic,
        description: data.description,
        appointmentId,
        petId,
      });

      if (!result.success) {
        setServerError(result.error || "เกิดข้อผิดพลาด");
        return;
      }

      setOpen(false);
      toast.success("แก้ไขรายงานสุขภาพสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("EditHealthReport Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขรายงานสุขภาพ");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset({ topic: report.topic, description: report.description });
          setServerError(null);
        }
        setOpen(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id={`edit-health-report-${report.id}`}
      >
        <DialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8 text-muted-foreground hover:text-blue-600"
          >
            <Edit2Icon className="w-4 h-4" />
          </Button>
        </DialogTrigger>

        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขรายงานสุขภาพ
            </DialogTitle>
            <DialogDescription>
              ปรับปรุงรายละเอียดความผิดปกติของสัตว์เลี้ยง
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <FieldGroup className="gap-4 px-4 pt-2 pb-3">
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
                    หัวข้อ <span className="text-destructive">*</span>
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

            <Controller
              name="description"
              control={form.control}
              rules={{ required: "กรุณาระบุรายละเอียด" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    รายละเอียด <span className="text-destructive">*</span>
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
              <Button
                type="submit"
                form={`edit-health-report-${report.id}`}
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
