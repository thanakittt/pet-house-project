"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { verifyCustomerDepositSlip } from "@/modules/appointment/actions/verify-customer-deposit-slip";
import { CheckCircle2, Loader2, UploadCloud } from "lucide-react";
import Image from "next/image";
import { CSSProperties, FormEvent, useState, useTransition } from "react";
import { toast } from "sonner";

const DEPOSIT_QR_IMAGE_SRC = "/images/qr-code.jpg";
// ปรับขนาด QR ได้จากตัวแปรนี้จุดเดียว ทั้ง layout desktop และขนาดรูปด้านในจะตามค่านี้
const DEPOSIT_QR_IMAGE_SIZE_PX = 350;
const MAX_SLIP_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_SLIP_TYPES = "image/jpeg,image/png,image/gif,image/webp";

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

export default function DepositSlipUpload({
  appointmentId,
  onVerified,
}: {
  appointmentId: string;
  onVerified: (transRef?: string) => void;
}) {
  // เก็บไฟล์ที่ user เลือกไว้ก่อน submit เพื่อ validate ขนาดและส่งเข้า Server Action
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // ถ้า asset QR หายหรือโหลดไม่ได้ UI ยังต้องใช้งาน upload slip ต่อได้
  const [isQrImageError, setIsQrImageError] = useState(false);

  // useTransition ช่วยให้ปุ่มแสดง loading state ตอนเรียก Server Action โดย UI ไม่ค้าง
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Validate ฝั่ง client เพื่อให้ user ได้ feedback ทันที
    // ฝั่ง server ยัง validate ซ้ำอีกครั้งเพราะ client validation เชื่อถือไม่ได้ 100%
    if (!selectedFile) {
      toast.error("กรุณาเลือกรูปสลิป");
      return;
    }

    if (selectedFile.size > MAX_SLIP_SIZE_BYTES) {
      toast.error("ขนาดรูปสลิปต้องไม่เกิน 4MB");
      return;
    }

    const formData = new FormData();
    formData.append("appointmentId", appointmentId);
    formData.append("slipImage", selectedFile);

    // Server Action จะอัปโหลดรูป, เรียก Thunder, บันทึกผล และเปลี่ยน appointment เป็น CONFIRMED เมื่อผ่าน
    startTransition(async () => {
      const result = await verifyCustomerDepositSlip(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("ตรวจสอบสลิปสำเร็จและยืนยันคิวแล้ว");
      onVerified(result.data.transRef);
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-5 bg-amber-50 p-5 border border-amber-200 rounded-2xl w-full max-w-3xl text-left"
    >
      <div className="flex sm:flex-row flex-col sm:justify-between sm:items-start gap-2">
        <div>
          <h2 className="font-semibold text-amber-950 text-base">
            ชำระมัดจำเพื่อยืนยันคิว
          </h2>
          <p className="mt-1 text-amber-900 text-sm">
            สแกน QR Code เพื่อชำระเงิน แล้วอัปโหลดสลิปให้ระบบตรวจสอบอัตโนมัติ
          </p>
        </div>
        <Badge variant="outline" className="border-amber-300 text-amber-950">
          {APPOINTMENT_DEPOSIT_AMOUNT} บาท
        </Badge>
      </div>

      <div
        className="md:items-start gap-5 grid md:grid-cols-[minmax(var(--deposit-qr-size),var(--deposit-qr-size))_minmax(0,1fr)]"
        style={{
          // ส่งค่าจากตัวแปร TS เข้า CSS variable เพื่อให้ Tailwind arbitrary grid ใช้ขนาดเดียวกันได้
          "--deposit-qr-size": `${DEPOSIT_QR_IMAGE_SIZE_PX}px`,
        } as CSSProperties}
      >
        <div className="flex flex-col gap-3 bg-white/80 p-3 border border-amber-200 rounded-xl text-center">
          <div
            className="relative bg-white mx-auto border border-amber-100 rounded-lg w-full aspect-square overflow-hidden"
            style={{ maxWidth: DEPOSIT_QR_IMAGE_SIZE_PX }}
          >
            {isQrImageError ? (
              // fallback นี้ทำให้ flow ไม่พังแม้รูป QR ใน public/images หายหรือโหลดไม่ได้
              <div className="flex justify-center items-center p-4 h-full font-medium text-amber-900 text-sm">
                ไม่สามารถแสดง QR Code ได้
              </div>
            ) : (
              <Image
                src={DEPOSIT_QR_IMAGE_SRC}
                alt={`QR Code สำหรับชำระค่ามัดจำ ${APPOINTMENT_DEPOSIT_AMOUNT} บาท`}
                fill
                sizes={`(min-width: 768px) ${DEPOSIT_QR_IMAGE_SIZE_PX}px, 80vw`}
                className="p-2 object-contain"
                onError={() => setIsQrImageError(true)}
              />
            )}
          </div>
          <div>
            <p className="font-semibold text-amber-950 text-sm">
              Scan เพื่อชำระมัดจำ
            </p>
            <p className="mt-1 text-amber-800 text-xs">
              ชำระ {APPOINTMENT_DEPOSIT_AMOUNT} บาท ก่อนอัปโหลดสลิป
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="deposit-slip">
                รูปสลิปโอนเงิน
              </FieldLabel>
              <Input
                id="deposit-slip"
                type="file"
                accept={ACCEPTED_SLIP_TYPES}
                disabled={isPending}
                onChange={(event) => {
                  const file = event.target.files?.[0] ?? null;
                  setSelectedFile(file);
                }}
              />
              <FieldDescription>
                รองรับ JPG, PNG, GIF, WebP ขนาดไม่เกิน 4MB
              </FieldDescription>
            </Field>
          </FieldGroup>

          {selectedFile ? (
            <div className="flex justify-between items-center gap-3 bg-white/80 px-3 py-2 border border-amber-200 rounded-lg text-sm">
              <span className="text-amber-950 truncate">
                {selectedFile.name}
              </span>
              <span className="text-amber-800 shrink-0">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={!selectedFile || isPending}
            className="bg-green-600 hover:bg-green-700 shadow-none w-full"
          >
            {isPending ? (
              <Loader2 data-icon="inline-start" className="animate-spin" />
            ) : (
              <UploadCloud data-icon="inline-start" />
            )}
            {isPending ? "กำลังตรวจสอบสลิป..." : "อัปโหลดและตรวจสอบสลิป"}
          </Button>

          <div className="flex items-start gap-2 text-amber-900 text-xs">
            <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
            <span>
              เมื่อสลิปผ่าน ระบบจะเปลี่ยนสถานะเป็นยืนยันคิวให้อัตโนมัติ
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
