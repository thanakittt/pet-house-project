"use client";

import { Button } from "@/components/ui/button";
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
import { ImageIcon, Trash2, UploadIcon, XIcon } from "lucide-react";
import Image from "next/image";
import type { ChangeEvent } from "react";
import { Controller, type Control } from "react-hook-form";
import {
  ANNOUNCEMENT_TYPE_LABELS,
  ANNOUNCEMENT_TYPES,
  type AnnouncementForm,
} from "../types/announcement";

type AnnouncementFormFieldsProps = {
  control: Control<AnnouncementForm>;
  idPrefix: string;
  currentImageUrl?: string | null;
  imagePreviewUrl: string | null;
  isImageMarkedForRemoval?: boolean;
  selectedImageName?: string | null;
  onImageFileChange: (file: File | null) => void;
  onRemoveImage?: () => void;
};

export function AnnouncementFormFields({
  control,
  idPrefix,
  currentImageUrl,
  imagePreviewUrl,
  isImageMarkedForRemoval = false,
  selectedImageName,
  onImageFileChange,
  onRemoveImage,
}: AnnouncementFormFieldsProps) {
  const visibleImageUrl =
    imagePreviewUrl ?? (isImageMarkedForRemoval ? null : currentImageUrl);

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    onImageFileChange(file);
    event.target.value = "";
  };

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
              placeholder="เช่น โปรโมชั่นอาบน้ำตัดขนประจำเดือน"
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
            <FieldLabel htmlFor={`${idPrefix}-type`}>
              ประเภทประกาศ
            </FieldLabel>
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

      <Field>
        <FieldLabel htmlFor={`${idPrefix}-image-file`}>รูปภาพประกาศ</FieldLabel>
        <div className="flex sm:flex-row flex-col sm:items-start gap-3">
          {visibleImageUrl ? (
            <div className="relative flex justify-center items-center bg-muted/40 border rounded-md min-w-[150] max-w-[150] min-h-[150] size-[150] overflow-hidden text-muted-foreground shrink-0">
              <Image
                src={visibleImageUrl}
                alt="รูปภาพประกาศ"
                fill
                sizes="150"
                className="p-1 object-contain"
                // unoptimized={visibleImageUrl.startsWith("blob:")}
                unoptimized
              />
            </div>
          ) : (
            <div className="flex justify-center items-center bg-muted/30 border border-dashed rounded-md min-w-[150] max-w-[150] min-h-[150] size-[150] text-muted-foreground shrink-0">
              <ImageIcon className="size-5" />
            </div>
          )}

          <div className="flex flex-col flex-1 gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" asChild>
              <label
                htmlFor={`${idPrefix}-image-file`}
                className="cursor-pointer"
              >
                <UploadIcon data-icon="inline-start" />
                เลือกรูป
              </label>
            </Button>

            {(visibleImageUrl || selectedImageName) && (
              <Button
                type="button"
                variant="outline"
                onClick={onRemoveImage}
                className="text-destructive hover:text-destructive"
              >
                {imagePreviewUrl ? (
                  <XIcon data-icon="inline-start" />
                ) : (
                  <Trash2 data-icon="inline-start" />
                )}
                ลบรูป
              </Button>
            )}
          </div>

          <Input
            id={`${idPrefix}-image-file`}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleImageChange}
            className="sr-only"
          />

          <FieldDescription>
            รองรับ JPG, PNG และ WebP ขนาดไม่เกิน 5MB
            {selectedImageName ? ` · เลือกแล้ว: ${selectedImageName}` : ""}
          </FieldDescription>
          </div>
        </div>
      </Field>

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
            <FieldDescription>
              เว้นว่างได้ หากต้องการให้แสดงต่อเนื่อง
            </FieldDescription>
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
