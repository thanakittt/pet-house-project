"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { ThemeLogo } from "@/components/theme-logo";
import { Input } from "@/components/ui/input";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { setupProfile } from "../actions/setup-profile";

const GENDER_OPTIONS = [
  { label: "ไม่ระบุ", value: "UNSPECIFIED" },
  { label: "ชาย", value: "MALE" },
  { label: "หญิง", value: "FEMALE" },
];

type setupProfileFormData = {
  birthDate: string;
  gender: string;
  phoneNumbers: string;
};

interface SetupProfileFormProps {
  userId: string;
  name: string;
  returnTo?: string | null;
}

export function SetupProfileForm({ name, returnTo }: SetupProfileFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<setupProfileFormData>({
    defaultValues: {
      birthDate: "",
      gender: "UNSPECIFIED",
      phoneNumbers: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: setupProfileFormData) => {
    try {
      setServerError(null);

      const result = await setupProfile({
        nickname: name,
        walkInPhoneNumber: data.phoneNumbers,
        gender: data.gender as "MALE" | "FEMALE" | "UNSPECIFIED",
        birthDate: data.birthDate || undefined,
      });
      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("บันทึกข้อมูลโปรไฟล์สำเร็จ");
      router.push(returnTo ?? "/");

    } catch (error) {
      console.error("SetupProfile Error:", error);
      setServerError("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  };

  return (
    <div className="flex flex-col justify-center items-center p-4 min-h-svh">
      <section className="rounded-lg w-full max-w-sm">
        <div className="flex flex-col items-center mb-6">
          <ThemeLogo
            className="mb-4 rounded-sm"
            alt="Logo Pet House"
            width={60}
            height={60}
            priority
          />
          <h1 className="mb-1 font-bold text-2xl">ตั้งค่าโปรไฟล์</h1>
          <p className="text-muted-foreground text-sm text-center">
            กรุณากรอกข้อมูลส่วนตัวเพื่อเริ่มต้นใช้งานระบบ
          </p>
          {serverError && (
            <p className="mt-2 font-medium text-destructive text-sm">
              {serverError}
            </p>
          )}
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} id="setup-profile-form">
          <FieldGroup className="gap-4 p-0">
            <Controller
              name="phoneNumbers"
              control={form.control}
              rules={{
                required: "กรุณากรอกเบอร์โทรศัพท์",
                pattern: {
                  value: /^0[0-9]{9}$/,
                  message: "เบอร์โทรศัพท์ต้องเริ่มต้นด้วย 0 และมีครบ 10 หลัก",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>เบอร์โทรศัพท์ที่ติดต่อได้</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    placeholder="08xxxxxxxx"
                    autoComplete="tel"
                    maxLength={10}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "");
                      field.onChange(value);
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Birth Date Field */}
            <Controller
              name="birthDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    วัน/เดือน/ปีเกิด{" "}
                    <span className="text-muted-foreground">(ไม่บังคับ)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="date"
                    aria-invalid={fieldState.invalid}
                    // การตั้งค่า max เพื่อป้องกันการเลือกวันที่ในอนาคต (Optional)
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Gender Field */}
            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    เพศ{" "}
                    <span className="text-muted-foreground">(ไม่บังคับ)</span>
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      {GENDER_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <LoadingButton
              type="submit"
              form="setup-profile-form"
              className="mt-4 py-5 w-full"
              isLoading={form.formState.isSubmitting}
              loadingText="กำลังบันทึก..."
            >
              บันทึกข้อมูล
            </LoadingButton>
          </FieldGroup>
        </form>
      </section>
    </div>
  );
}
