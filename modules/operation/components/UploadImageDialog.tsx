"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { PlusIcon, UploadIcon } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Image from "next/image";

import { uploadServiceImages } from "../actions/upload-service-images"; // ปรับ path ตามโปรเจกต์ของคุณ

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { cn } from "@/lib/utils";

// 1. เปลี่ยนจากการเก็บ URL เป็นการเก็บ File Object ของจริง
type UploadImageForm = {
  type: "BEFORE" | "AFTER" | "ISSUE";
  imageFiles: File[];
};

interface Props {
  appointmentId: string;
  petId: string;
}

export default function UploadImageDialog({ appointmentId, petId }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false); // ใช้ตอนกด Submit
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]); // เก็บจับคู่ File กับ Preview URL
  const [serverError, setServerError] = useState<string | null>(null);
  const selectedFileCount = previews.length;

  const form = useForm<UploadImageForm>({
    defaultValues: {
      type: "BEFORE",
      imageFiles: [],
    },
    mode: "onBlur",
  });

  const resetState = () => {
    previews.forEach((p) => URL.revokeObjectURL(p.url)); // คืน Memory
    form.reset({ type: "BEFORE", imageFiles: [] });
    setPreviews([]);
    setServerError(null);
  };

  // 2. แค่เก็บไฟล์และสร้าง Preview (ยังไม่อัปโหลด)
  const handleSelectFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newFiles = Array.from(files);
    const newPreviews = newFiles.map((file) => ({
      file,
      url: URL.createObjectURL(file),
    }));

    // เพิ่มไฟล์ใหม่ต่อท้ายไฟล์เดิมใน State
    const currentFiles = form.getValues("imageFiles");
    form.setValue("imageFiles", [...currentFiles, ...newFiles], {
      shouldValidate: true,
    });

    setPreviews((prev) => [...prev, ...newPreviews]);
    e.target.value = ""; // เคลียร์ input เพื่อให้เลือกไฟล์เดิมซ้ำได้
  };

  // 3. ทำการลบไฟล์ออกจาก Preview และ Form State (ถ้าผู้ใช้เปลี่ยนใจไม่อยากอัปรูปนี้)
  const handleRemoveFile = (indexToRemove: number) => {
    const currentFiles = form.getValues("imageFiles");

    // ลบไฟล์ออกจาก Form
    const newFiles = currentFiles.filter((_, i) => i !== indexToRemove);
    form.setValue("imageFiles", newFiles, { shouldValidate: true });

    // ลบ Preview และคืน Memory
    setPreviews((prev) => {
      const newPreviews = [...prev];
      URL.revokeObjectURL(newPreviews[indexToRemove].url);
      newPreviews.splice(indexToRemove, 1);
      return newPreviews;
    });
  };

  // 4. อัปโหลดขึ้น Supabase และบันทึกลง Database ตรงนี้
  const onSubmit = async (data: UploadImageForm) => {
    if (data.imageFiles.length === 0) {
      setServerError("กรุณาอัปโหลดอย่างน้อย 1 รูปภาพ");
      return;
    }

    try {
      setIsUploading(true);
      setServerError(null);

      // CODEMAP: send files to the Server Action
      // input: ไฟล์ที่เลือกจาก react-hook-form พร้อม appointment/pet ids จาก props
      // processing: ใส่ทุกอย่างลง FormData เพื่อให้ server validate, upload ไป Supabase Storage,
      // และบันทึก database ในจุดที่เชื่อถือได้จุดเดียว
      // output: ผลลัพธ์ success/error ที่ dialog เอาไปแสดงให้ผู้ใช้ได้
      const uploadFormData = new FormData();
      uploadFormData.append("type", data.type);
      uploadFormData.append("appointmentId", appointmentId);
      uploadFormData.append("petId", petId);

      for (const imageFile of data.imageFiles) {
        uploadFormData.append("imageFiles", imageFile);
      }

      const result = await uploadServiceImages(uploadFormData);

      if (!result.success) {
        setServerError(result.error || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
        return;
      }

      setOpen(false);
      resetState();
      toast.success("บันทึกรูปภาพสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("Submit Images Error:", error);
      setServerError("เกิดข้อผิดพลาดขณะอัปโหลดไฟล์ไปที่ Server");
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) resetState();
        setOpen(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="upload-image-form">
        <DialogTrigger asChild className="text-sm cursor-pointer">
          <Button type="button" size="sm" variant="outline">
            <PlusIcon className="mr-2 size-3.5" /> เพิ่มรูปภาพ
          </Button>
        </DialogTrigger>

        <DialogContent className="md:max-w-lg">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              อัปโหลดรูปภาพ
            </DialogTitle>
            <DialogDescription>
              เพิ่มรูปภาพก่อนและหลังการให้บริการ (สามารถเลือกได้หลายไฟล์)
            </DialogDescription>
            {serverError && (
              <DialogDescription className="mt-2 font-medium text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <FieldGroup className="gap-4 px-4 pt-2 pb-3">
            <Controller
              name="type"
              control={form.control}
              rules={{ required: "กรุณาเลือกประเภท" }}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>
                    ประเภท
                  </FieldLabel>
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id={field.name}>
                      <SelectValue placeholder="เลือกประเภท" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BEFORE">
                        ก่อนรับบริการ (Before)
                      </SelectItem>
                      <SelectItem value="AFTER">
                        หลังรับบริการ (After)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />

            <Field>
              <FieldLabel htmlFor="service-image-files">
                {selectedFileCount > 0 ? "เลือกรูปภาพเพิ่ม" : "เลือกรูปภาพ"}
              </FieldLabel>
              <label
                htmlFor="service-image-files"
                aria-disabled={isUploading || form.formState.isSubmitting}
                className={cn(
                  buttonVariants({ variant: "outline" }),
                  "w-fit cursor-pointer",
                  (isUploading || form.formState.isSubmitting) &&
                    "pointer-events-none cursor-not-allowed opacity-50",
                )}
              >
                <UploadIcon data-icon="inline-start" />
                อัปโหลด
              </label>
              <Input
                id="service-image-files"
                type="file"
                multiple
                accept="image/png, image/jpeg, image/webp"
                onChange={handleSelectFiles}
                disabled={isUploading || form.formState.isSubmitting}
                className="sr-only"
              />
              <FieldDescription>
                {selectedFileCount > 0
                  ? `เลือกแล้ว ${selectedFileCount} รูป`
                  : "ยังไม่ได้เลือกรูปภาพ"}
              </FieldDescription>
              {selectedFileCount > 0 && (
                <div className="space-y-1 rounded-md border bg-muted/20 p-2">
                  <p className="font-medium text-muted-foreground text-xs">
                    ไฟล์ที่เลือกไว้
                  </p>
                  <ul className="max-h-24 space-y-1 overflow-y-auto text-muted-foreground text-xs">
                    {previews.map((preview, index) => (
                      <li
                        key={`${preview.file.name}-${index}`}
                        className="truncate"
                      >
                        {index + 1}. {preview.file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Field>

            {/* แสดง Preview พร้อมปุ่มกากบาทลบรูป */}
            {previews.length > 0 && (
              <div className="space-y-2 mt-2">
                <FieldLabel>
                  ตัวอย่างรูปภาพที่จะอัปโหลด ({previews.length} รูป)
                </FieldLabel>
                <div className="flex flex-wrap gap-2 bg-muted/30 p-3 border rounded-lg">
                  {previews.map((preview, i) => (
                    <div
                      key={i}
                      className="group relative shadow-sm border rounded-md w-20 h-20 overflow-hidden"
                    >
                      <Image
                        src={preview.url}
                        alt="Preview"
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      {/* ปุ่มกากบาทเพื่อลบรูปที่ไม่ต้องการ */}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(i)}
                        className="top-1 right-1 absolute bg-black/50 hover:bg-destructive opacity-0 group-hover:opacity-100 p-1 rounded-full text-white transition-opacity"
                      >
                        <PlusIcon className="w-3 h-3 rotate-45" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </FieldGroup>

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                  disabled={isUploading}
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <LoadingButton
                type="submit"
                form="upload-image-form"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={isUploading || previews.length === 0}
                isLoading={isUploading}
                loadingText="กำลังอัปโหลด..."
              >
                อัปโหลดและบันทึก
              </LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
