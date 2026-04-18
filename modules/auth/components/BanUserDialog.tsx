"use client";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  // DialogTrigger ไม่ได้ใช้ — Dialog ถูกควบคุมด้วย isBanUserDialogOpen prop
} from "@/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
// Ban icon ถูกลบออก — ไม่ได้ใช้แสดงในปุ่มหรือ label ใดๆ
import { Button } from "@/components/ui/button";
import { Controller, useForm } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";
// useState ถูกลบออก — state ถูกจัดการผ่าน prop setIsBanUserDialogOpen
import { useRouter } from "next/navigation";

const DAY_TO_SECONDS = 60 * 60 * 24;

type BanUserDialogProps = {
  userId: string;
  /** สถานะเปิด/ปิดของ Dialog */
  open: boolean;
  /** callback เมื่อสถานะเปิด/ปิดเปลี่ยน */
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
    formState: { isSubmitting, isValid },
  } = useForm({
    defaultValues: {
      banReason: "",
      banExpiresIn: "",
    },
    mode: "onChange",
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
        <DialogContent className="sm:max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>แบนผู้ใช้</DialogTitle>
          </DialogHeader>
          <FieldGroup>
            {/* ban reason */}
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

            {/* ban expires in */}
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
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">ยกเลิก</Button>
            </DialogClose>
            <Button
              type="submit"
              form="ban-user-form"
              disabled={isSubmitting || !isValid}
            >
              {isSubmitting ? "กำลังแบน..." : "แบน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
