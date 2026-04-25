"use client";

import { useState } from "react";
import { Trash2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/shared/ConfirmDialog"; // ปรับ path ให้ตรงกับที่เก็บ ConfirmDialog ของคุณ
import { deleteHealthReport } from "@/modules/operation/actions/delete-health-report";

interface Props {
  reportId: string;
  topic: string;
  appointmentId: string;
  petId: string;
}

export default function DeleteHealthReportButton({
  reportId,
  topic,
  appointmentId,
  petId,
}: Props) {
  const [open, setOpen] = useState(false);

  const handleDelete = async () => {
    return await deleteHealthReport(reportId, appointmentId, petId);
  };

  return (
    <>
      <Button
        type="button"
        aria-label={`ลบรายงานสุขภาพ: ${topic}`}
        variant="ghost"
        size="icon"
        className="hover:bg-destructive/10 w-8 h-8 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2Icon className="w-4 h-4" />
      </Button>

      <ConfirmDialog
        open={open}
        onOpenChange={setOpen}
        title="ยืนยันการลบรายงานสุขภาพ"
        description={`คุณแน่ใจหรือไม่ว่าต้องการลบรายงาน "${topic}"? การกระทำนี้ไม่สามารถย้อนกลับได้`}
        onConfirm={handleDelete}
        successMessage="ลบรายงานสุขภาพสำเร็จ"
        errorMessage="เกิดข้อผิดพลาดในการลบรายงานสุขภาพ"
      />
    </>
  );
}
