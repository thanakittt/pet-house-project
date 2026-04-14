"use client";

import { Controller, useForm } from "react-hook-form";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldContent,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import Link from "next/link";
import { toast } from "sonner";
import { UserForm } from "@/modules/auth/types/create-user-form";

import { AuthUserWithProfile } from "../types/user";
import { updateUser } from "../actions/update-user";
import { useRouter } from "next/navigation";

export default function EditUserForm({ user }: { user: AuthUserWithProfile }) {
  const router = useRouter();
  const {
    handleSubmit,
    control,
    formState: { isSubmitting, isValid },
  } = useForm({
    mode: "onChange",
    defaultValues: {
      name: user.name,
      email: user.email,
      // phoneNumber อาจเป็น null/undefined ได้ตาม schema → ใช้ empty string เป็นค่าเริ่มต้น
      phoneNumber: user.phoneNumber ?? "",
      password: "",
      gender: user.gender ?? "",
      birthDate: user.birthDate ?? "",
      role: user.role ?? "",
    },
  });

  const onSubmit = async (data: UserForm) => {
    try {
      const dataUpdate = {
        name: data.name === user.name ? undefined : data.name,
        nickname: data.name,
        email: data.email === user.email ? undefined : data.email,
        phoneNumber:
          data.phoneNumber === user.phoneNumber ? undefined : data.phoneNumber,
        password: data.password === "" ? undefined : data.password,
        gender: data.gender === user.gender ? undefined : data.gender,
        birthDate:
          data.birthDate === user.birthDate ? undefined : data.birthDate,
        role: data.role,
      };

      if (
        dataUpdate.name === undefined &&
        dataUpdate.email === undefined &&
        dataUpdate.phoneNumber === undefined &&
        dataUpdate.password === undefined &&
        dataUpdate.gender === undefined &&
        dataUpdate.birthDate === undefined &&
        dataUpdate.role === undefined
      ) {
        toast.error("กรุณาระบุข้อมูลที่ต้องการแก้ไข");
        return;
      }
      const result = await updateUser({
        userId: user.id,
        ...dataUpdate,
      });

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("แก้ไขข้อมูลผู้ใช้สำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateUser Error:", error);
      toast.error("เกิดข้อผิดพลาดในการแก้ไขข้อมูลผู้ใช้");
    }
  };

  return (
    <Card className="w-full sm:max-w-md">
      <CardContent>
        <form id="edit-user" onSubmit={handleSubmit(onSubmit)}>
          <FieldGroup>
            {/* Name Field */}
            <Controller
              name="name"
              control={control}
              rules={{
                required: "กรุณาระบุชื่อ-นามสกุล",
                maxLength: {
                  value: 100,
                  message: "ชื่อ-นามสกุลไม่เกิน 100 ตัวอักษร",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>ชื่อ-นามสกุล</FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุชื่อ-นามสกุล"
                    autoComplete="off"
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
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Phone Number Field */}
            <Controller
              name="phoneNumber"
              control={control}
              rules={{
                required: "กรุณาระบุเบอร์โทรศัพท์",
                validate: (value) => {
                  // value อาจเป็น null/undefined ได้ → แปลงเป็น string ก่อนตรวจความยาว
                  if ((value ?? "").length !== 10) {
                    return "เบอร์โทรศัพท์ต้องมี 10 หลัก";
                  }
                  return true;
                },
                pattern: {
                  value: /^[0-9]+$/,
                  message: "เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น",
                },
              }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>เบอร์โทรศัพท์</FieldLabel>
                  <Input
                    {...field}
                    // Input ต้องการ string → coerce null/undefined เป็น empty string
                    value={field.value ?? ""}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุเบอร์โทรศัพท์"
                    autoComplete="off"
                    maxLength={10}
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
                  <Input
                    {...field}
                    type="password"
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุรหัสผ่าน"
                    autoComplete="off"
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
              control={control}
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>
                      <span>เพศ</span>
                      <span className="text-muted-foreground">(ไม่บังคับ)</span>
                    </FieldLabel>
                  </FieldContent>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      className="min-w-[120px]"
                    >
                      <SelectValue placeholder="เลือกเพศ" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      <SelectItem value="MALE">ชาย</SelectItem>
                      <SelectItem value="FEMALE">หญิง</SelectItem>
                      <SelectItem value="UNSPECIFIED">ไม่ระบุ</SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Birth Date Field */}
            <Controller
              name="birthDate"
              control={control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    <span>วันเกิด</span>
                    <span className="text-muted-foreground">(ไม่บังคับ)</span>
                  </FieldLabel>
                  <Input
                    {...field}
                    type="date"
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="ระบุวันเกิด"
                    autoComplete="off"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            {/* Role Field */}
            <Controller
              name="role"
              control={control}
              rules={{
                required: "กรุณาเลือกบทบาท",
              }}
              render={({ field, fieldState }) => (
                <Field
                  orientation="responsive"
                  data-invalid={fieldState.invalid}
                >
                  <FieldContent>
                    <FieldLabel htmlFor={field.name}>บทบาท</FieldLabel>
                  </FieldContent>
                  <Select
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                  >
                    <SelectTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      className="min-w-[120px]"
                    >
                      <SelectValue placeholder="เลือกบทบาท" />
                    </SelectTrigger>
                    <SelectContent position="item-aligned">
                      {user.role === "customer" ? (
                        <SelectItem value="customer">ลูกค้า</SelectItem>
                      ) : (
                        <>
                          <SelectItem value="admin">ผู้ดูแลระบบ</SelectItem>
                          <SelectItem value="staff">พนักงาน</SelectItem>
                          <SelectItem value="owner">เจ้าของร้าน</SelectItem>
                        </>
                      )}
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </FieldGroup>
        </form>
      </CardContent>
      <CardFooter>
        <Field orientation="horizontal">
          <Button type="button" variant="outline" asChild>
            <Link href="/users">กลับ</Link>
          </Button>
          <Button
            type="submit"
            form="edit-user"
            disabled={isSubmitting || !isValid}
          >
            {isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
          </Button>
        </Field>
      </CardFooter>
    </Card>
  );
}
