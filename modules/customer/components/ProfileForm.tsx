"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import { formatPhoneNumber } from "@/lib/utils";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import {
  changeCustomerPassword,
  requestCustomerEmailChange,
  setCustomerPassword,
  updateCustomerProfile,
} from "@/modules/customer/actions/profile";
import { CustomerProfile } from "@/modules/customer/queries/get-profile";
import { PencilIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";

const GENDER_OPTIONS = [
  { label: "ไม่ระบุ", value: "UNSPECIFIED" },
  { label: "ชาย", value: "MALE" },
  { label: "หญิง", value: "FEMALE" },
] as const;

type Gender = (typeof GENDER_OPTIONS)[number]["value"];

type ProfileFormData = {
  name: string;
  phoneNumber: string;
  birthDate: string;
  gender: Gender;
};

type EmailFormData = {
  newEmail: string;
};

type PasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

type ProfileFormProps = {
  profile: CustomerProfile;
};

function formatBirthDate(value: string | null) {
  if (!value) {
    return "-";
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("th-TH", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatGender(value: Gender) {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label ?? "-";
}

function displayValue(value: string | null | undefined) {
  return value?.trim() ? value : "-";
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border px-4 py-3">
      <dt className="shrink-0 text-sm font-medium">{label}</dt>
      <dd className="min-w-0 truncate text-sm text-muted-foreground">
        {value}
      </dd>
    </div>
  );
}

function ProfileDetailsDialog({
  open,
  onOpenChange,
  profile,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profile: CustomerProfile;
}) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<ProfileFormData>({
    defaultValues: {
      name: profile.name,
      phoneNumber: profile.phoneNumber ?? "",
      birthDate: profile.birthDate ?? "",
      gender: profile.gender,
    },
    mode: "onBlur",
  });

  useEffect(() => {
    form.reset({
      name: profile.name,
      phoneNumber: profile.phoneNumber ?? "",
      birthDate: profile.birthDate ?? "",
      gender: profile.gender,
    });
  }, [form, profile]);

  const onSubmit = async (data: ProfileFormData) => {
    try {
      setServerError(null);
      const result = await updateCustomerProfile(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("บันทึกข้อมูลส่วนตัวสำเร็จ");
      onOpenChange(false);
      router.refresh();
    } catch (error) {
      console.error("Profile update error:", error);
      setServerError("เกิดข้อผิดพลาดในการบันทึกข้อมูลส่วนตัว");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form id="profile-details-form" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>แก้ไขข้อมูลส่วนตัว</DialogTitle>
            <DialogDescription>
              ปรับข้อมูลพื้นฐานสำหรับบัญชีลูกค้าของคุณ
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Controller
              name="name"
              control={form.control}
              rules={{
                required: "กรุณาระบุชื่อ-นามสกุล",
                maxLength: {
                  value: 100,
                  message: "ชื่อ-นามสกุลไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ชื่อ-นามสกุล
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    autoComplete="name"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="phoneNumber"
              control={form.control}
              rules={{
                required: "กรุณาระบุเบอร์โทรศัพท์",
                pattern: {
                  value: /^0[0-9]{9}$/,
                  message: "เบอร์โทรศัพท์ต้องขึ้นต้นด้วย 0 และมี 10 หลัก",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>เบอร์โทรศัพท์</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="tel"
                    aria-invalid={fieldState.invalid}
                    autoComplete="tel"
                    inputMode="numeric"
                    maxLength={10}
                    onChange={(event) => {
                      field.onChange(event.target.value.replace(/\D/g, ""));
                    }}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="birthDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>วันเกิด</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="date"
                    aria-invalid={fieldState.invalid}
                    max={new Date().toISOString().split("T")[0]}
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Controller
              name="gender"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>เพศ</FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      className="w-full"
                    >
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {GENDER_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              form="profile-details-form"
              isLoading={form.formState.isSubmitting}
              loadingText="กำลังบันทึก..."
            >
              บันทึก
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

function EmailDialog({
  open,
  onOpenChange,
  currentEmail,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentEmail: string;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<EmailFormData>({
    defaultValues: {
      newEmail: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: EmailFormData) => {
    try {
      setServerError(null);
      const result = await requestCustomerEmailChange(data);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success("ส่งลิงก์ยืนยันไปยังอีเมลใหม่แล้ว");
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Email change error:", error);
      setServerError("เกิดข้อผิดพลาดในการส่งอีเมลยืนยัน");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form id="profile-email-form" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>เปลี่ยนอีเมล</DialogTitle>
            <DialogDescription>
              ระบบจะส่งลิงก์ยืนยันไปยังอีเมลใหม่ก่อนเปลี่ยนข้อมูล
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-4">
            <Field>
              <FieldLabel>อีเมลปัจจุบัน</FieldLabel>
              <Input value={currentEmail} disabled />
            </Field>

            <Controller
              name="newEmail"
              control={form.control}
              rules={{
                required: "กรุณาระบุอีเมลใหม่",
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: "รูปแบบอีเมลไม่ถูกต้อง",
                },
                validate: (value) =>
                  value.trim().toLowerCase() !== currentEmail.toLowerCase() ||
                  "อีเมลใหม่ต้องไม่ซ้ำกับอีเมลปัจจุบัน",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>อีเมลใหม่</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="email"
                    aria-invalid={fieldState.invalid}
                    autoComplete="email"
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
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              form="profile-email-form"
              isLoading={form.formState.isSubmitting}
              loadingText="กำลังส่ง..."
            >
              ส่งลิงก์ยืนยัน
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

function PasswordDialog({
  open,
  onOpenChange,
  hasPassword,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  hasPassword: boolean;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const form = useForm<PasswordFormData>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
    mode: "onBlur",
  });

  const onSubmit = async (data: PasswordFormData) => {
    try {
      setServerError(null);

      if (data.newPassword !== data.confirmPassword) {
        setServerError("ยืนยันรหัสผ่านใหม่ไม่ตรงกัน");
        return;
      }

      const result = hasPassword
        ? await changeCustomerPassword({
            currentPassword: data.currentPassword,
            newPassword: data.newPassword,
          })
        : await setCustomerPassword({
            newPassword: data.newPassword,
          });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      toast.success(
        hasPassword ? "เปลี่ยนรหัสผ่านสำเร็จ" : "ตั้งรหัสผ่านสำเร็จ",
      );
      onOpenChange(false);
      form.reset();
    } catch (error) {
      console.error("Password update error:", error);
      setServerError(
        hasPassword
          ? "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน"
          : "เกิดข้อผิดพลาดในการตั้งรหัสผ่าน",
      );
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          form.reset();
          setServerError(null);
        }
        onOpenChange(value);
      }}
    >
      <form id="profile-password-form" onSubmit={form.handleSubmit(onSubmit)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}
            </DialogTitle>
            <DialogDescription>
              {hasPassword
                ? "หลังเปลี่ยนสำเร็จ ระบบจะออกจากระบบในอุปกรณ์อื่น"
                : "ตั้งรหัสผ่านเพื่อให้บัญชีนี้เข้าสู่ระบบด้วยอีเมลและรหัสผ่านได้"}
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-4">
            {hasPassword && (
              <Controller
                name="currentPassword"
                control={form.control}
                rules={{ required: "กรุณาระบุรหัสผ่านปัจจุบัน" }}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      รหัสผ่านปัจจุบัน
                    </FieldLabel>
                    <Input
                      {...field}
                      id={field.name}
                      type="password"
                      aria-invalid={fieldState.invalid}
                      autoComplete="current-password"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            )}

            <Controller
              name="newPassword"
              control={form.control}
              rules={{
                required: "กรุณาระบุรหัสผ่านใหม่",
                minLength: {
                  value: 8,
                  message: "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>รหัสผ่านใหม่</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
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
              control={form.control}
              rules={{
                required: "กรุณายืนยันรหัสผ่านใหม่",
                validate: (value) =>
                  value === form.getValues("newPassword") ||
                  "ยืนยันรหัสผ่านใหม่ไม่ตรงกัน",
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ยืนยันรหัสผ่านใหม่
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    type="password"
                    aria-invalid={fieldState.invalid}
                    autoComplete="new-password"
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
              <Button type="button" variant="outline">
                ยกเลิก
              </Button>
            </DialogClose>
            <LoadingButton
              type="submit"
              form="profile-password-form"
              isLoading={form.formState.isSubmitting}
              loadingText="กำลังบันทึก..."
            >
              {hasPassword ? "เปลี่ยนรหัสผ่าน" : "ตั้งรหัสผ่าน"}
            </LoadingButton>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}

export default function ProfileForm({ profile }: ProfileFormProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [passwordOpen, setPasswordOpen] = useState(false);
  const passwordActionLabel = profile.hasPassword
    ? "เปลี่ยนรหัสผ่าน"
    : "ตั้งรหัสผ่าน";

  return (
    <main className="w-full p-5">
      <header className="mb-2">
        <h1 className="text-pretty text-2xl font-bold">บัญชีผู้ใช้</h1>
      </header>
      <Separator className="mb-5" />

      <div className="mx-auto max-w-4xl">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              ข้อมูลส่วนตัว
            </CardTitle>
            <CardAction>
              <Button
                variant="outline"
                size="icon"
                aria-label="แก้ไขข้อมูลส่วนตัว"
                onClick={() => setDetailsOpen(true)}
              >
                <PencilIcon />
              </Button>
            </CardAction>
          </CardHeader>

          <CardContent>
            <dl className="flex flex-col gap-3">
              <ProfileRow
                label="ชื่อ-นามสกุล"
                value={displayValue(profile.name)}
              />
              <ProfileRow
                label="เบอร์โทรศัพท์"
                value={formatPhoneNumber(profile.phoneNumber)}
              />
              <ProfileRow
                label="วันเกิด"
                value={formatBirthDate(profile.birthDate)}
              />
              <ProfileRow label="เพศ" value={formatGender(profile.gender)} />
            </dl>
          </CardContent>
        </Card>

        <Card className="mt-5 w-full">
          <CardHeader>
            <CardTitle className="text-base font-bold">
              ความปลอดภัยและการเข้าถึง
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">อีเมล</p>
                  <p className="text-sm text-muted-foreground">
                    ใช้สำหรับเข้าสู่ระบบและรับการแจ้งเตือน
                  </p>
                  <p className="mt-1 truncate text-sm">{profile.email}</p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label="เปลี่ยนอีเมล"
                  className="shrink-0"
                  onClick={() => setEmailOpen(true)}
                >
                  <PencilIcon />
                </Button>
              </div>

              <div className="flex items-start justify-between gap-4 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">รหัสผ่าน</p>
                  <p className="text-sm text-muted-foreground">
                    {profile.hasPassword
                      ? "เปลี่ยนรหัสผ่านเพื่อความปลอดภัย"
                      : "ตั้งรหัสผ่านเพื่อเข้าสู่ระบบด้วยอีเมลได้"}
                  </p>
                  <p className="mt-1 text-sm">
                    {profile.hasPassword ? "••••••••" : "ยังไม่ได้ตั้งรหัสผ่าน"}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  aria-label={passwordActionLabel}
                  className="shrink-0"
                  onClick={() => setPasswordOpen(true)}
                >
                  <PencilIcon />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <ProfileDetailsDialog
        open={detailsOpen}
        onOpenChange={setDetailsOpen}
        profile={profile}
      />
      <EmailDialog
        open={emailOpen}
        onOpenChange={setEmailOpen}
        currentEmail={profile.email}
      />
      <PasswordDialog
        open={passwordOpen}
        onOpenChange={setPasswordOpen}
        hasPassword={profile.hasPassword}
      />
    </main>
  );
}
