"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
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
  FieldDescription
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
import { useRouter } from "next/navigation";

const DAY_TO_SECONDS = 60 * 60 * 24;

type BanUserDialogProps = {
  userId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function BanUserDialog({
  userId,
  open,
  onOpenChange,
}: BanUserDialogProps) {
  const router = useRouter();

  const {
    handleSubmit,
    control,
    reset,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      banReason: "",
      banExpiresIn: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: {
    banReason: string;
    banExpiresIn: string;
  }) => {
    try {
      let banExpiresIn = data.banExpiresIn
        ? Number(data.banExpiresIn)
        : undefined;
      if (banExpiresIn) {
        banExpiresIn = banExpiresIn * DAY_TO_SECONDS;
      }
      const { error } = await authClient.admin.banUser({
        userId: userId,
        banReason: data.banReason,
        banExpiresIn: banExpiresIn,
      });
      if (error) {
        console.error("Ban user error:", error);
        toast.error("เกิดข้อผิดพลาดในการแบนผู้ใช้");
        return;
      }

      toast.success("แบนผู้ใช้สำเร็จ");
      onOpenChange(false);
      reset();
      router.refresh();
    } catch (error) {
      console.error("Ban user error:", error);
      toast.error("เกิดข้อผิดพลาดในการแบนผู้ใช้");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) {
          reset();
        }
        onOpenChange(isOpen);
      }}
    >
      <form onSubmit={handleSubmit(onSubmit)} id="ban-user-form">
        <DialogContent className="md:max-w-md">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle>แบนผู้ใช้</DialogTitle>
            <DialogDescription>
              กรุณาระบุเหตุผลและระยะเวลาการแบน
            </DialogDescription>
          </DialogHeader>

          <FieldGroup className="gap-3 px-4 pb-3">
            <Controller
              name="banReason"
              control={control}
              rules={{
                required: "กรุณาระบุเหตุผลการแบน",
                maxLength: {
                  value: 100,
                  message: "เหตุผลการแบนไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>เหตุผลการแบน</FieldLabel>
                  <Textarea
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุเหตุผลการแบน"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="banExpiresIn"
              control={control}
              rules={{
                validate: (value) => {
                  if (value === "") {
                    return true;
                  }
                  const numValue = Number(value);
                  if (isNaN(numValue)) {
                    return "กรุณาระบุตัวเลข";
                  }
                  if (numValue <= 0) {
                    return "กรุณาระบุตัวเลขที่มากกว่า 0";
                  }
                  return true;
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ระยะเวลาการแบน (วัน)
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุระยะเวลาการแบน"
                    autoComplete="off"
                  />
                  <FieldDescription>
                    ปล่อยว่างไว้เพื่อแบนถาวร
                  </FieldDescription>
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
                <Button variant="outline">ยกเลิก</Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="ban-user-form"
                isLoading={isSubmitting}
                loadingText="กำลังแบน..."
              >
                แบน
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
