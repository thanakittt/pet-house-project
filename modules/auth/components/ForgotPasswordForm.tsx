"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { ThemeLogo } from "@/components/theme-logo";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type ForgotPasswordFormValues = {
  email: string;
};

const EMAIL_PATTERN = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;
const RESEND_COOLDOWN_SECONDS = 60;

export function ForgotPasswordForm() {
  const [countdown, setCountdown] = useState(0);
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    defaultValues: {
      email: "",
    },
    mode: "onBlur",
  });

  useEffect(() => {
    if (countdown <= 0) return;

    const timer = setInterval(() => {
      setCountdown((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  const onSubmit = async (data: ForgotPasswordFormValues) => {
    try {
      const { error } = await authClient.requestPasswordReset({
        email: data.email.trim().toLowerCase(),
        redirectTo: "/reset-password",
      });

      if (error) {
        toast.error(
          error.message || "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้ในขณะนี้",
        );
        return;
      }

      toast.success("ส่งลิงก์รีเซ็ตรหัสผ่านเรียบร้อยแล้ว", {
        description:
          <span className="text-muted-foreground">หากอีเมลนี้มีอยู่ในระบบ กรุณาตรวจสอบกล่องจดหมายของคุณ</span>,
      });
      setCountdown(RESEND_COOLDOWN_SECONDS);
    } catch (error) {
      console.error("Forgot Password Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  return (
    <div className="flex justify-center items-center px-4 min-h-svh">
      <section className="flex flex-col items-center rounded-lg w-full max-w-sm">
        <ThemeLogo
          className="mb-2 rounded-sm"
          alt="Logo Pet House"
          width={60}
          height={60}
          priority
        />
        <h1 className="mb-2 font-bold text-2xl text-center">Pet House</h1>
        <h2 className="mb-2 font-semibold text-lg text-center">
          ลืมรหัสผ่าน
        </h2>
        <p className="mb-5 text-muted-foreground text-sm text-center">
          กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับตั้งรหัสผ่านใหม่
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <FieldGroup className="gap-3 p-0">
            <Controller
              name="email"
              control={control}
              rules={{
                required: "กรุณาระบุอีเมล",
                pattern: {
                  value: EMAIL_PATTERN,
                  message: "รูปแบบอีเมลไม่ถูกต้อง",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    อีเมล
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    placeholder="name@example.com"
                    autoComplete="email"
                    spellCheck={false}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <LoadingButton
              className="mt-2 w-full"
              type="submit"
              disabled={countdown > 0}
              isLoading={isSubmitting}
              loadingText="กำลังส่ง..."
            >
              {countdown > 0
                ? `ส่งอีกครั้งใน ${countdown} วินาที`
                : "ส่งลิงก์รีเซ็ตรหัสผ่าน"}
            </LoadingButton>
          </FieldGroup>
        </form>

        <p className="mt-6 text-sm text-center">
          กลับไปหน้า{" "}
          <Link
            href="/sign-in"
            className="font-medium text-primary underline underline-offset-4"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </div>
  );
}
