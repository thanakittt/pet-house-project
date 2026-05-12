"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateAnnouncement } from "../actions/update-announcement";
import {
  announcementFormToFormData,
  toDateTimeLocalValue,
  type Announcement,
  type AnnouncementForm,
} from "../types/announcement";
import { AnnouncementFormFields } from "./AnnouncementFormFields";

type UpdateAnnouncementDialogProps = {
  announcement: Announcement;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function getDefaultValues(announcement: Announcement): AnnouncementForm {
  return {
    title: announcement.title,
    content: announcement.content,
    type: announcement.type,
    startDisplayAt: toDateTimeLocalValue(announcement.startDisplayAt),
    endDisplayAt: toDateTimeLocalValue(announcement.endDisplayAt),
    isActive: announcement.isActive,
  };
}

export function UpdateAnnouncementDialog({
  announcement,
  open,
  onOpenChange,
}: UpdateAnnouncementDialogProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [removeImage, setRemoveImage] = useState(false);

  const form = useForm<AnnouncementForm>({
    defaultValues: getDefaultValues(announcement),
    mode: "onBlur",
  });

  const resetForm = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    form.reset(getDefaultValues(announcement));
    setImageFile(null);
    setImagePreviewUrl(null);
    setRemoveImage(false);
    setServerError(null);
  };

  useEffect(() => {
    resetForm();
    // resetForm ใช้ announcement ล่าสุดเพื่อให้ฟอร์มเปลี่ยนตามแถวที่ผู้ใช้เลือกแก้ไข
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement]);

  const handleImageFileChange = (file: File | null) => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(file);
    setImagePreviewUrl(file ? URL.createObjectURL(file) : null);
    setRemoveImage(false);
  };

  const handleRemoveImage = () => {
    if (imagePreviewUrl) {
      URL.revokeObjectURL(imagePreviewUrl);
    }

    setImageFile(null);
    setImagePreviewUrl(null);
    setRemoveImage(true);
  };

  const onSubmit = async (data: AnnouncementForm) => {
    try {
      setServerError(null);

      const formData = announcementFormToFormData(data);

      if (imageFile) {
        formData.set("imageFile", imageFile);
      }

      if (removeImage) {
        formData.set("removeImage", "true");
      }

      const result = await updateAnnouncement({
        id: announcement.id,
        formData,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

      resetForm();
      onOpenChange(false);
      toast.success("แก้ไขประกาศสำเร็จ");
      router.refresh();
    } catch (error) {
      console.error("UpdateAnnouncement Error:", error);
      setServerError("เกิดข้อผิดพลาดในการแก้ไขประกาศ");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (!value) {
          resetForm();
        }
        onOpenChange(value);
      }}
    >
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        id={`update-announcement-${announcement.id}`}
      >
        <DialogContent className="md:max-w-2xl">
          <DialogHeader className="px-4 pt-4">
            <DialogTitle className="font-bold text-lg">
              แก้ไขประกาศ
            </DialogTitle>
            <DialogDescription>
              แก้ไขข้อมูลประกาศที่เลือก
            </DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>

          <AnnouncementFormFields
            control={form.control}
            idPrefix={`update-announcement-${announcement.id}`}
            currentImageUrl={announcement.imageUrl}
            imagePreviewUrl={imagePreviewUrl}
            isImageMarkedForRemoval={removeImage}
            selectedImageName={imageFile?.name ?? null}
            onImageFileChange={handleImageFileChange}
            onRemoveImage={handleRemoveImage}
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
              <LoadingButton
                type="submit"
                form={`update-announcement-${announcement.id}`}
                className="px-6 py-5 text-sm cursor-pointer"

               isLoading={form.formState.isSubmitting} loadingText="กำลังบันทึก...">บันทึก</LoadingButton>
            </div>
          </DialogFooter>
        </DialogContent>
      </form>
    </Dialog>
  );
}
