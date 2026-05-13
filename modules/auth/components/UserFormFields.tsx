"use client";

import { Control, Controller } from "react-hook-form";
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
import { UserForm } from "@/modules/auth/types/create-user-form";

type UserFormFieldsProps = {
  control: Control<UserForm>;
  passwordRequired?: boolean;
  requireProfileFields?: boolean;
  roleOptions?: Array<{ value: string; label: string }>;
};

const defaultRoleOptions = [
  { value: "admin", label: "ผู้ดูแลระบบ" },
  { value: "staff", label: "พนักงาน" },
  { value: "owner", label: "เจ้าของร้าน" },
];

export function UserFormFields({
  control,
  passwordRequired = false,
  requireProfileFields = false,
  roleOptions = defaultRoleOptions,
}: UserFormFieldsProps) {
  return (
    <FieldGroup className="gap-3 px-4 pb-3">
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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

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
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="phoneNumber"
        control={control}
        rules={{
          required: "กรุณาระบุเบอร์โทรศัพท์",
          validate: (value) => {
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
              value={field.value ?? ""}
              id={field.name}
              aria-invalid={fieldState.invalid}
              placeholder="ระบุเบอร์โทรศัพท์"
              autoComplete="off"
              maxLength={10}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="password"
        control={control}
        rules={{
          required: passwordRequired ? "กรุณาระบุรหัสผ่าน" : false,
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
              placeholder="ระบุรหัสผ่านอย่างน้อย 8 ตัวอักษร"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <div className="flex items-start gap-2">
        <Controller
          name="gender"
          control={control}
          rules={{
            required: requireProfileFields
              ? "กรุณาเลือกเพศ"
              : false,
          }}
          render={({ field, fieldState }) => (
            <Field orientation="responsive" data-invalid={fieldState.invalid}>
              <FieldContent>
                <FieldLabel htmlFor={field.name}>
                  <span>เพศ</span>
                  {!requireProfileFields && (
                    <span className="text-muted-foreground">(ไม่บังคับ)</span>
                  )}
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
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />

        <Controller
          name="birthDate"
          control={control}
          rules={{
            required: requireProfileFields
              ? "กรุณาระบุวันเกิด"
              : false,
          }}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={field.name}>
                <span>วันเกิด</span>
                {!requireProfileFields && (
                  <span className="text-muted-foreground">(ไม่บังคับ)</span>
                )}
              </FieldLabel>
              <Input
                {...field}
                value={field.value ?? ""}
                type="date"
                id={field.name}
                aria-invalid={fieldState.invalid}
                placeholder="ระบุวันเกิด"
                autoComplete="off"
              />
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </Field>
          )}
        />
      </div>

      <Controller
        name="role"
        control={control}
        rules={{
          required: "กรุณาเลือกบทบาท",
        }}
        render={({ field, fieldState }) => (
          <Field orientation="responsive" data-invalid={fieldState.invalid}>
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
                {roleOptions.map((role) => (
                  <SelectItem key={role.value} value={role.value}>
                    {role.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />
    </FieldGroup>
  );
}
