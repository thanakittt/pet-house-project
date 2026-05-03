"use client";

import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldContent,
  FieldDescription,
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
import { Textarea } from "@/components/ui/textarea";
import { Controller, type Control } from "react-hook-form";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPES,
  type AnnouncementForm,
} from "../types/announcement";

type AnnouncementFormFieldsProps = {
  control: Control<AnnouncementForm>;
  idPrefix: string;
};

export function AnnouncementFormFields({
  control,
  idPrefix,
}: AnnouncementFormFieldsProps) {
  return (
    <FieldGroup className="gap-3 px-4 pb-3">
      <Controller
        name="title"
        control={control}
        rules={{
          required: "กรุณาระบุหัวข้อประกาศ",
          maxLength: {
            value: 200,
            message: "หัวข้อประกาศไม่เกิน 200 ตัวอักษร",
          },
          validate: (value) =>
            value.trim() ? true : "กรุณาระบุหัวข้อประกาศ",
        }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
              หัวข้อประกาศ
            </FieldLabel>
            <Input
              {...field}
              id={`${idPrefix}-${field.name}`}
              aria-invalid={fieldState.invalid}
              placeholder="เช่น โปรโมชันอาบน้ำตัดขนประจำเดือน"
              autoComplete="off"
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="content"
        control={control}
        rules={{
          required: "กรุณาระบุเนื้อหาประกาศ",
          validate: (value) =>
            value.trim() ? true : "กรุณาระบุเนื้อหาประกาศ",
        }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
              เนื้อหาประกาศ
            </FieldLabel>
            <Textarea
              {...field}
              id={`${idPrefix}-${field.name}`}
              aria-invalid={fieldState.invalid}
              placeholder="รายละเอียดที่ต้องการแจ้งให้ลูกค้าทราบ"
              rows={5}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="type"
        control={control}
        rules={{ required: "กรุณาเลือกประเภทประกาศ" }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-type`}>ประเภทประกาศ</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger
                id={`${idPrefix}-type`}
                className="w-full"
                aria-invalid={fieldState.invalid}
              >
                <SelectValue placeholder="เลือกประเภทประกาศ" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {ANNOUNCEMENT_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>
                      {ANNOUNCEMENT_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="imageUrl"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
              URL รูปภาพ
            </FieldLabel>
            <Input
              {...field}
              id={`${idPrefix}-${field.name}`}
              aria-invalid={fieldState.invalid}
              placeholder="https://example.com/banner.jpg"
              autoComplete="off"
            />
            <FieldDescription>
              เวอร์ชันนี้เก็บเป็น URL เท่านั้น ยังไม่อัปโหลดไฟล์เข้าระบบ
            </FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="startDisplayAt"
        control={control}
        rules={{ required: "กรุณาระบุวันเริ่มแสดงประกาศ" }}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
              วันเริ่มแสดง
            </FieldLabel>
            <Input
              {...field}
              id={`${idPrefix}-${field.name}`}
              type="datetime-local"
              aria-invalid={fieldState.invalid}
            />
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </Field>
        )}
      />

      <Controller
        name="endDisplayAt"
        control={control}
        render={({ field, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`${idPrefix}-${field.name}`}>
              วันสิ้นสุด
            </FieldLabel>
            <Input
              {...field}
              id={`${idPrefix}-${field.name}`}
              type="datetime-local"
              aria-invalid={fieldState.invalid}
            />
            <FieldDescription>เว้นว่างได้ หากต้องการให้แสดงต่อเนื่อง</FieldDescription>
          </Field>
        )}
      />

      <Controller
        name="isActive"
        control={control}
        render={({ field }) => (
          <Field orientation="horizontal">
            <Checkbox
              id={`${idPrefix}-is-active`}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
            <FieldContent>
              <FieldLabel htmlFor={`${idPrefix}-is-active`}>
                เปิดใช้งานประกาศ
              </FieldLabel>
              <FieldDescription>
                ถ้าปิดไว้ ประกาศจะไม่แสดงแม้จะอยู่ในช่วงวันที่แล้ว
              </FieldDescription>
            </FieldContent>
          </Field>
        )}
      />
    </FieldGroup>
  );
}
