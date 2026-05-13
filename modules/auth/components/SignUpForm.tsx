"use client";

import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field";
import { LoadingButton } from "@/components/shared/LoadingButton";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Controller, useForm, useWatch } from "react-hook-form";
import Link from "next/link";
import { SignUpFormData } from "../types/sign-up";
import { signUpCustomer } from "../actions/sign-up-customer";

export function SignUpForm() {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting },
  } = useForm({
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });
  const passwordValue = useWatch({ control, name: "password" });

  const onSubmit = async (data: SignUpFormData) => {
    try {
      const result = await signUpCustomer(data);

      if (!result.success) {
        console.error(result.error);
        toast.error(result.error || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
        return;
      }

      toast.success("สมัครสมาชิกสำเร็จ");

      await authClient.signIn.email(
        {
          email: data.email,
          password: data.password,
        },
        {
          onSuccess: () => {
            router.push("/");
          },
          onError: () => {
            toast.error("สมัครสมาชิกสำเร็จ กรุณาเข้าสู่ระบบอีกครั้ง");
            router.push("/sign-in");
          },
        },
      );
    } catch (error) {
      console.error("Sign Up Error:", error);
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อระบบ");
    }
  };

  const handleSocialSignIn = async (provider: "google" | "line") => {
    try {
      await authClient.signIn.social(
        {
          provider,
          newUserCallbackURL: "/setup-profile",
        },
        {
          onError: () => {
            toast.error(`ไม่สามารถเชื่อมต่อ ${provider} ได้ในขณะนี้`);
          },
        },
      );
    } catch {
      toast.error(`ไม่สามารถเชื่อมต่อ ${provider} ได้ในขณะนี้`);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-svh">
      <section className="flex flex-col justify-center items-center rounded-lg w-xs">
        <Image
          className="mb-2 rounded-sm"
          src="/images/logo/1.png"
          alt="Logo Pet House"
          width={60}
          height={60}
          priority
        />
        <h1 className="mb-2 font-bold text-2xl">Pet House</h1>
        <h2 className="mb-4 font-semibold text-lg">สมัครสมาชิก</h2>

        <form
          id="sign-up-form"
          className="flex flex-col items-center w-full"
          onSubmit={handleSubmit(onSubmit)}
        >
          <FieldGroup className="flex flex-col gap-3 p-0 w-full">
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              rules={{
                required: "กรุณาระบุชื่อ-นามสกุล",
                maxLength: { value: 100, message: "ชื่อไม่เกิน 100 ตัวอักษร" },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    ชื่อ-นามสกุล
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ชื่อ-นามสกุล"
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

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

            {/* Phone Field */}
            <Controller
              name="phone"
              control={control}
              rules={{
                required: "กรุณาระบุเบอร์โทรศัพท์",
                pattern: {
                  // บังคับขึ้นต้นด้วย 0 ตามด้วยตัวเลข 0-9 อีก 9 หลัก (รวมเป็น 10 หลัก)
                  value: /^0[0-9]{9}$/,
                  message: "เบอร์โทรศัพท์ต้องเริ่มต้นด้วย 0 และมีครบ 10 หลัก",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="text-sm">
                    เบอร์โทรศัพท์
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    placeholder="08xxxxxxxx"
                    autoComplete="tel"
                    maxLength={10}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <div className="flex flex-row gap-2 w-full">
              {/* Password Field */}
              <Controller
                name="password"
                control={control}
                rules={{
                  required: "กรุณาระบุรหัสผ่าน",
                  minLength: { value: 8, message: "อย่างน้อย 8 ตัวอักษร" },
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-full">
                    <FieldLabel htmlFor={field.name} className="text-sm">
                      รหัสผ่าน
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      aria-invalid={fieldState.invalid}
                      placeholder="รหัสผ่านอย่างน้อย 8 ตัวอักษร"
                      autoComplete="new-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />

              {/* Confirm Password Field */}
              <Controller
                name="confirmPassword"
                control={control}
                rules={{
                  required: "กรุณายืนยันรหัสผ่าน",
                  validate: (value) =>
                    value === passwordValue || "รหัสผ่านไม่ตรงกัน",
                }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid} className="w-full">
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
            </div>
          </FieldGroup>

          <div className="flex justify-center items-center pt-5 w-full">
            <LoadingButton
              className="py-5 w-full"
              size="default"
              variant="default"
              type="submit"
              form="sign-up-form"
              isLoading={isSubmitting}
              loadingText="กำลังดำเนินการ..."
            >
              สมัครสมาชิก
            </LoadingButton>
          </div>
        </form>

        <div className="pt-5 w-full">
          <FieldSeparator>หรือ</FieldSeparator>
        </div>

        <Button
          className="mt-5 py-5 w-full"
          size="default"
          variant="outline"
          onClick={() => handleSocialSignIn("google")}
        >
          <Image
            src="/icons/google.svg"
            alt="Google"
            width={20}
            height={20}
            data-icon="inline-start"
          />
          สมัครสมาชิกด้วย Google
        </Button>

        <Button
          className="mt-5 py-5 w-full"
          size="default"
          variant="outline"
          onClick={() => handleSocialSignIn("line")}
        >
          <Image
            src="/icons/line.svg"
            alt="Line"
            width={20}
            height={20}
            data-icon="inline-start"
          />
          สมัครสมาชิกด้วย Line
        </Button>

        <p className="mt-5 text-sm">
          มีบัญชีอยู่แล้ว?{" "}
          <Link
            href="/sign-in"
            className="text-primary underline underline-offset-4"
          >
            เข้าสู่ระบบ
          </Link>
        </p>
      </section>
    </div>
  );
}
