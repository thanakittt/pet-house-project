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
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { updateAnnouncement } from "../actions/update-announcement";
import {
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
    imageUrl: announcement.imageUrl ?? "",
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

  const form = useForm<AnnouncementForm>({
    defaultValues: getDefaultValues(announcement),
    mode: "onBlur",
  });

  const resetForm = () => {
    form.reset(getDefaultValues(announcement));
    setServerError(null);
  };

  useEffect(() => {
    resetForm();
    // resetForm ใช้ announcement ล่าสุดเพื่อให้ฟอร์มเปลี่ยนตามแถวที่ผู้ใช้เลือกแก้ไข
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [announcement]);

  const onSubmit = async (data: AnnouncementForm) => {
    try {
      setServerError(null);

      const result = await updateAnnouncement({
        id: announcement.id,
        data,
      });

      if (!result.success) {
        setServerError(result.error);
        return;
      }

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
            <DialogTitle className="font-bold text-lg">แก้ไขประกาศ</DialogTitle>
            <DialogDescription>แก้ไขข้อมูลประกาศที่เลือก</DialogDescription>
            {serverError && (
              <DialogDescription className="text-destructive">
                {serverError}
              </DialogDescription>
            )}
          </DialogHeader>
          <Separator />

          <AnnouncementFormFields
            control={form.control}
            idPrefix={`update-announcement-${announcement.id}`}
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
                form={`update-announcement-${announcement.id}`}
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
