"use client";

import { Button } from "@/components/ui/button";
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
import { Separator } from "@/components/ui/separator";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { createAnnouncement } from "../actions/create-announcement";
import {
  announcementFormToFormData,
  toDateTimeLocalValue,
  type AnnouncementForm,
} from "../types/announcement";
import { AnnouncementFormFields } from "./AnnouncementFormFields";

function getDefaultValues(): AnnouncementForm {
  return {
    title: "",
    content: "",
    type: "NEWS",
    startDisplayAt: toDateTimeLocalValue(new Date()),
    endDisplayAt: "",
    isActive: true,
  };
}

export function CreateAnnouncementDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const form = useForm<AnnouncementForm>({
    defaultValues: getDefaultValues(),
    mode: "onBlur",
  });

  const resetForm = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    form.reset(getDefaultValues());
    setImageFile(null);
    setImagePreviewUrl(null);
    setServerError(null);
  };

  const handleImageFileChange = (file: File | null) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
  };

  const onSubmit = async (data: AnnouncementForm) => {
    try {
      setServerError(null);

      const formData = announcementFormToFormData(data);

      if (imageFile) {
        formData.set("imageFile", imageFile);
      }

      const result = await createAnnouncement(formData);

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      setOpen(false);
      resetForm();
      toast.success("สร้างประกาศสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("CreateAnnouncement Error:", error);
      setServerError("เกิดข้อผิดพลาดในการสร้างประกาศ");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetForm();
        }
        setOpen(value);
      }}
    >
      <form onSubmit={form.handleSubmit(onSubmit)} id="create-announcement">
        <DialogTrigger asChild className="px-6 py-5 text-sm cursor-pointer">
          <Button type="button">
            <PlusIcon data-icon="inline-start" /> เพิ่มประกาศ
          </Button>
        </DialogTrigger>
        <DialogContent className="md:max-w-2xl">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">เพิ่มประกาศ</DialogTitle>
            <DialogDescription>กรุณากรอกข้อมูลประกาศ</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <AnnouncementFormFields
            control={form.control}
            idPrefix="create-announcement"
            imagePreviewUrl={imagePreviewUrl}
            selectedImageName={imageFile?.name ?? null}
            onImageFileChange={handleImageFileChange}
            onRemoveImage={() => handleImageFileChange(null)}
          />

          <DialogFooter>
            <div className="flex justify-end gap-2">
              <DialogClose asChild>
                <Button
                  variant="outline"
                  className="px-6 py-5 text-sm cursor-pointer"
                >
                  ยกเลิก
                </Button>
              </DialogClose>
              <Button
                type="submit"
                form="create-announcement"
                className="px-6 py-5 text-sm cursor-pointer"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? "กำลังบันทึก..." : "บันทึก"}
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
