"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { BellRing, LinkIcon, LockKeyhole } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { ThemeLogo } from "@/components/theme-logo";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { authClient } from "@/lib/auth-client";

type SignInFormValues = {
  email: string;
  password: string;
};

export function LIFFSignInForm() {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: SignInFormValues) => {
    try {
      const { error } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error) {
        if (error.code === "INVALID_EMAIL_OR_PASSWORD") {
          toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        } else {
          toast.error(error.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        }
        return;
      }

      toast.success("เข้าสู่ระบบสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("ไม่สามารถเชื่อมต่อกับระบบได้");
    }
  };

  const handleSocialSignIn = async (provider: "google" | "line") => {
    try {
      await authClient.signIn.social(
        {
          provider,
          callbackURL: "/connect-line",
          newUserCallbackURL: "/setup-profile?returnTo=/connect-line",
        },
        {
          onError: () => {
            toast.error(`ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้ในขณะนี้`);
          },
        },
      );
    } catch {
      toast.error(`ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
    }
  };

  return (
    <main className="flex justify-center items-center bg-background px-4 py-10 min-h-dvh text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 px-6 pt-6 text-center">
          <div className="flex justify-center">
            <ThemeLogo
              className="rounded-sm"
              alt="Logo Pet House"
              width={50}
              height={50}
              priority
            />
          </div>
          <div className="space-y-2">
            <CardTitle className="font-semibold text-2xl">
              เข้าสู่ระบบเพื่อเชื่อมต่อ LINE
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm leading-6">
              เชื่อมบัญชี Pet House กับ LINE
              เพื่อรับแจ้งเตือนสถานะนัดหมายและบริการ
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 pb-6">
          <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-3 border border-emerald-200 dark:border-emerald-900/70 rounded-lg text-emerald-900 dark:text-emerald-200">
            <div className="flex gap-3">
              <div className="flex justify-center items-center bg-white/80 dark:bg-emerald-950/50 rounded-lg ring-1 ring-emerald-100 dark:ring-emerald-900/60 size-9 text-emerald-700 dark:text-emerald-300 shrink-0">
                <BellRing className="size-4" aria-hidden="true" />
              </div>
              <div className="space-y-1">
                <p className="font-medium leading-6">รับแจ้งเตือนผ่าน LINE</p>
                <p className="text-emerald-800/90 dark:text-emerald-200/90 text-sm leading-6">
                  หลังเข้าสู่ระบบแล้ว ระบบจะพาคุณกลับมาเชื่อมต่อ LINE อัตโนมัติ
                </p>
              </div>
            </div>
          </div>

          <form id="sign-in-form" onSubmit={handleSubmit(onSubmit)}>
            <FieldGroup className="p-0">
              <Controller
                name="email"
                control={control}
                rules={{
                  required: "กรุณาระบุอีเมล",
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "รูปแบบอีเมลไม่ถูกต้อง",
                  },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>อีเมล</FieldLabel>
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

              <Controller
                name="password"
                control={control}
                rules={{
                  required: "กรุณาระบุรหัสผ่าน",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className="flex justify-between items-center gap-3">
                      <FieldLabel htmlFor={field.name}>รหัสผ่าน</FieldLabel>
                      <Link
                        href="/forgot-password"
                        className="font-medium text-muted-foreground hover:text-foreground text-xs hover:underline underline-offset-4"
                      >
                        ลืมรหัสผ่าน?
                      </Link>
                    </div>
                    <PasswordInput
                      {...field}
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      placeholder="รหัสผ่าน"
                      autoComplete="current-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              <LoadingButton
                className="mt-2 w-full h-11"
                type="submit"
                isLoading={isSubmitting}
                loadingText="กำลังเข้าสู่ระบบ..."
              >
                <LockKeyhole data-icon="inline-start" />
                เข้าสู่ระบบ
              </LoadingButton>
            </FieldGroup>
          </form>

          <FieldSeparator>หรือ</FieldSeparator>

          <div className="flex flex-col gap-3">
            <Button
              type="button"
              variant="outline"
              className="w-full h-11"
              onClick={() => handleSocialSignIn("google")}
            >
              <Image
                src="/icons/google.svg"
                alt="Google"
                width={20}
                height={20}
                data-icon="inline-start"
              />
              เข้าสู่ระบบด้วย Google
            </Button>

            <Button
              type="button"
              className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 w-full h-11 text-white dark:text-emerald-950"
              onClick={() => handleSocialSignIn("line")}
            >
              <Image
                src="/icons/line.svg"
                alt="LINE"
                width={20}
                height={20}
                data-icon="inline-start"
              />
              เข้าสู่ระบบด้วย LINE
            </Button>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t text-muted-foreground text-sm text-center">
            <p>ยังไม่มีบัญชี?</p>
            <Button asChild variant="link" className="p-0 h-auto">
              <Link href="/sign-up?returnTo=/connect-line">
                <LinkIcon data-icon="inline-start" />
                สมัครสมาชิก Pet House
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
