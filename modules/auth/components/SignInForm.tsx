"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";

type SignInFormValues = {
  email: string;
  password: string;
};

export function SignInForm() {
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
      router.push("/");
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
          callbackURL: "/",
          newUserCallbackURL: "/setup-profile",
        },
        {
          onError: () => {
            toast.error(`ไม่สามารถเชื่อมต่อ ${provider} ได้ในขณะนี้`);
          },
        },
      );
    } catch {
      toast.error(`ไม่สามารถเข้าสู่ระบบด้วย ${provider} ได้`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-svh">
      <section className="flex flex-col items-center rounded-lg w-sm">
        <Image
          className="mx-auto mb-2 rounded-sm"
          src="/images/logo/1.png"
          alt="Logo Pet House"
          width={60}
          height={60}
          priority
        />
        <h1 className="mb-2 font-bold text-2xl text-center">Pet House</h1>
        <h2 className="mb-5 font-semibold text-lg text-center">เข้าสู่ระบบ</h2>

        <form
          id="sign-in-form"
          onSubmit={handleSubmit(onSubmit)}
          className="w-full"
        >
          <FieldGroup className="p-0">
            {/* Email Field */}
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

            {/* Password Field */}
            <Controller
              name="password"
              control={control}
              rules={{
                required: "กรุณาระบุรหัสผ่าน",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <div className="flex justify-between items-center">
                    <FieldLabel htmlFor={field.name}>รหัสผ่าน</FieldLabel>
                    <Link
                      href="/forgot-password"
                      className="text-muted-foreground text-xs hover:underline underline-offset-4"
                    >
                      ลืมรหัสผ่าน?
                    </Link>
                  </div>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
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

            <Button
              className="mt-2 w-full"
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </Button>
          </FieldGroup>
        </form>

        <div className="pt-6 w-full">
          <FieldSeparator>หรือ</FieldSeparator>
        </div>

        <div className="flex flex-col gap-3 mt-5 w-full">
          <Button
            variant="outline"
            className="py-5"
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
            variant="outline"
            className="py-5"
            onClick={() => handleSocialSignIn("line")}
          >
            <Image
              src="/icons/line.svg"
              alt="Line"
              width={20}
              height={20}
              data-icon="inline-start"
            />
            เข้าสู่ระบบด้วย Line
          </Button>
        </div>

        <p className="mt-6 text-sm text-center">
          ยังไม่มีบัญชี?{" "}
          <Link
            href="/sign-up"
            className="font-medium text-primary underline underline-offset-4"
          >
            สมัครสมาชิก
          </Link>
        </p>
      </section>
    </div>
  );
}
