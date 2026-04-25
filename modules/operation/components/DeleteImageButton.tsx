"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog";
import { deleteServiceImage } from "../actions/delete-service-image";

interface Props {
  imageId: string;
  imageUrl: string;
  appointmentId: string;
  petId: string;
}

export default function DeleteImageButton({
  imageId,
  imageUrl,
  appointmentId,
  petId,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    return await deleteServiceImage(imageId, imageUrl, appointmentId, petId);
  };

  return (
    <>
      {/* ปุ่มลบรูปภาพ (ซ่อนอยู่ จะโผล่ตอน Hover Container ด้านนอก) */}
      <button
        type="button"
        aria-label="ลบรูปภาพ"
        onClick={(e) => {
          e.stopPropagation(); // ป้องกันไม่ให้ทะลุไปเปิด Lightbox
          setOpen(true);
        }}
        className="top-1 right-1 z-10 absolute bg-black/60 hover:bg-destructive opacity-0 group-hover:opacity-100 focus-visible:opacity-100 group-focus-within:opacity-100 p-1.5 rounded-full text-white transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive focus-visible:ring-offset-2"
        title="ลบรูปภาพ"
      >
        <Trash2Icon className="w-3.5 h-3.5" />
      </button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ยืนยันการลบรูปภาพ"
        description="คุณแน่ใจหรือไม่ว่าต้องการลบรูปภาพนี้? การกระทำนี้จะลบไฟล์ออกจากระบบถาวร"
        onConfirm={handleDelete}
        successMessage="ลบรูปภาพสำเร็จ"
        errorMessage="เกิดข้อผิดพลาดในการลบรูปภาพ"
      />
    </>
  );
}
