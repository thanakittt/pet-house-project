"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Controller, useForm } from "react-hook-form";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { ThemeLogo } from "@/components/theme-logo";

export function StaffLoginForm() {
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

  const onSubmit = async (data: { email: string; password: string }) => {
    try {
      const { error, data: resultSignIn } = await authClient.signIn.email({
        email: data.email,
        password: data.password,
      });

      if (error && error.code === "INVALID_EMAIL_OR_PASSWORD") {
        toast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
        return;
      }

      if (error && error.code === "BANNED_USER") {
        toast.error("คุณถูกแบนจากการใช้งานแอปพลิเคชันนี้", {
          description: (
            <span className="text-muted-foreground">
              หากคุณเชื่อว่านี่เป็นความผิดพลาด กรุณาติดต่อแอดมิน
            </span>
          ),
        });
        return;
      }

      if (error) {
        console.log(error);
        toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
        return;
      }

      const userRole = resultSignIn?.user?.role;

      // Redirect based on user role
      if (
        userRole === "admin" ||
        userRole === "staff" ||
        userRole === "owner"
      ) {
        router.push("/back-office");
      } else {
        // For customer or other roles, redirect to home page
        router.push("/");
      }
    } catch (error) {
      console.error("Login Error:", error);
      toast.error("เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen">
      <section className="flex flex-col justify-center items-center px-5 rounded-lg w-full md:w-[400px]">
        <ThemeLogo
          className="mx-auto mb-3 rounded-sm"
          alt="Logo Pet House"
          width={60}
          height={60}
          loading="eager"
          priority
        />
        <h1 className="mb-1 font-bold text-xl uppercase">Pet House</h1>
        <h2 className="mb-5 font-semibold text-base md:text-lg">
          เข้าสู่ระบบสำหรับพนักงาน
        </h2>
        <form
          id="create-user"
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col items-center w-full"
        >
          <FieldGroup>
            {/* Email Field */}
            <Controller
              name="email"
              control={control}
              rules={{
                required: "กรุณาระบุอีเมล",
                maxLength: {
                  value: 100,
                  message: "อีเมลไม่เกิน 100 ตัวอักษร",
                },
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
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุอีเมล"
                    autoComplete="email"
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
                minLength: {
                  value: 8,
                  message: "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร",
                },
                maxLength: {
                  value: 100,
                  message: "รหัสผ่านไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>รหัสผ่าน</FieldLabel>
                  <PasswordInput
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุรหัสผ่าน"
                    autoComplete="password"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <LoadingButton
              type="submit"
              variant="default"
              size="default"
              className="mt-3"
              disabled={isSubmitting}
              isLoading={isSubmitting}
              loadingText="กำลังเข้าสู่ระบบ..."
            >
              เข้าสู่ระบบ
            </LoadingButton>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
