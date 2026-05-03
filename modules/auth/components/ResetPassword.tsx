"use client";

import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { authClient } from "@/lib/auth-client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

type ResetPasswordFormValues = {
  password: string;
  confirmPassword: string;
};

type ResetPasswordProps = {
  token?: string;
  error?: string;
};

const invalidTokenMessage =
  "ลิงก์รีเซ็ตรหัสผ่านไม่ถูกต้องหรือหมดอายุแล้ว";

export function ResetPassword({ token, error }: ResetPasswordProps) {
  const router = useRouter();
  const {
    control,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<ResetPasswordFormValues>({
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const hasInvalidToken = !token || error === "INVALID_TOKEN";

  const onSubmit = async (data: ResetPasswordFormValues) => {
    if (!token) {
      toast.error(invalidTokenMessage);
      return;
    }

    try {
      const { error } = await authClient.resetPassword({
        token,
        newPassword: data.password,
      });

      if (error) {
        toast.error(
          error.code === "INVALID_TOKEN"
            ? invalidTokenMessage
            : error.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้ในขณะนี้",
        );
        return;
      }

      toast.success("รีเซ็ตรหัสผ่านเรียบร้อยแล้ว", {
        description: <span className="text-muted-foreground">กรุณาเข้าสู่ระบบด้วยรหัสผ่านใหม่</span>,
      });
      router.push("/sign-in");
    } catch (error) {
      console.error("Reset Password Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อระบบได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  if (hasInvalidToken) {
    return (
      <div className="flex justify-center items-center px-4 min-h-svh">
        <section className="flex flex-col items-center rounded-lg w-full max-w-sm text-center">
          <Image
            className="mb-2 rounded-sm"
            src="/images/logo/1.png"
            alt="Logo Pet House"
            width={60}
            height={60}
            priority
          />
          <h1 className="mb-2 font-bold text-2xl">Pet House</h1>
          <h2 className="mb-2 font-semibold text-lg">ลิงก์ไม่พร้อมใช้งาน</h2>
          <p className="mb-5 text-muted-foreground text-sm">
            {invalidTokenMessage} กรุณาขอลิงก์ใหม่อีกครั้ง
          </p>
          <div className="flex flex-col gap-3 w-full">
            <Button asChild>
              <Link href="/forgot-password">ขอลิงก์ใหม่</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/sign-in">กลับไปหน้าเข้าสู่ระบบ</Link>
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center px-4 min-h-svh">
      <section className="flex flex-col items-center rounded-lg w-full max-w-sm">
        <Image
          className="mb-2 rounded-sm"
          src="/images/logo/1.png"
          alt="Logo Pet House"
          width={60}
          height={60}
          priority
        />
        <h1 className="mb-2 font-bold text-2xl text-center">Pet House</h1>
        <h2 className="mb-2 font-semibold text-lg text-center">
          ตั้งรหัสผ่านใหม่
        </h2>
        <p className="mb-5 text-muted-foreground text-sm text-center">
          กรอกรหัสผ่านใหม่สำหรับบัญชี Pet House ของคุณ
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="w-full">
          <FieldGroup className="gap-3 p-0">
            <Controller
              name="password"
              control={control}
              rules={{
                required: "กรุณาระบุรหัสผ่านใหม่",
                minLength: {
                  value: 8,
                  message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    รหัสผ่านใหม่
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="รหัสผ่านใหม่"
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="confirmPassword"
              control={control}
              rules={{
                required: "กรุณายืนยันรหัสผ่าน",
                validate: (value, formValues) =>
                  value === formValues.password || "รหัสผ่านไม่ตรงกัน",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    ยืนยันรหัสผ่าน
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    placeholder="ยืนยันรหัสผ่าน"
                    autoComplete="new-password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Button className="mt-2 w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "กำลังรีเซ็ตรหัสผ่าน..." : "รีเซ็ตรหัสผ่าน"}
            </Button>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
