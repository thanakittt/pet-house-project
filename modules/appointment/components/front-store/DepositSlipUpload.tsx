"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { verifyCustomerDepositSlip } from "@/modules/appointment/actions/verify-customer-deposit-slip";
import {
  CheckCircle2,
  Clock3,
  ImageIcon,
  RefreshCw,
  UploadCloud,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChangeEvent,
  CSSProperties,
  FormEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { toast } from "sonner";

const DEPOSIT_QR_IMAGE_SRC = "/images/qr-code.jpg";
// ปรับขนาด QR ได้จากตัวแปรนี้จุดเดียว ทั้ง layout desktop และขนาดรูปด้านในจะตามค่านี้
const DEPOSIT_QR_IMAGE_SIZE_PX = 350;
const MAX_SLIP_SIZE_BYTES = 4 * 1024 * 1024;
const ACCEPTED_SLIP_TYPES = "image/jpeg,image/png,image/gif,image/webp";
const DEPOSIT_TIMEOUT_MINUTES = 15;
const SECONDS_IN_MINUTE = 60;

function formatFileSize(size: number) {
  if (size >= 1024 * 1024) {
    return `${(size / 1024 / 1024).toFixed(1)} MB`;
  }

  return `${Math.max(1, Math.round(size / 1024))} KB`;
}

function getRemainingDepositSeconds(appointmentCreatedAt: string) {
  const createdAtTime = new Date(appointmentCreatedAt).getTime();

  if (Number.isNaN(createdAtTime)) {
    return null;
  }

  // ใช้เวลาสร้างจากฐานข้อมูลเป็นจุดเริ่มต้นจริง เพื่อไม่ให้ refresh แล้วเวลาเริ่มใหม่
  const expiredAtTime =
    createdAtTime + DEPOSIT_TIMEOUT_MINUTES * SECONDS_IN_MINUTE * 1000;
  const remainingMilliseconds = expiredAtTime - Date.now();

  return Math.max(0, Math.ceil(remainingMilliseconds / 1000));
}

function formatCountdownTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / SECONDS_IN_MINUTE);
  const seconds = totalSeconds % SECONDS_IN_MINUTE;

  return `${minutes.toString().padStart(2, "0")}:${seconds
    .toString()
    .padStart(2, "0")}`;
}

export default function DepositSlipUpload({
  appointmentId,
  appointmentCreatedAt,
  depositAmount,
  onVerified,
}: {
  appointmentId: string;
  appointmentCreatedAt: string;
  depositAmount: number;
  onVerified: (transRef?: string) => void;
}) {
  const router = useRouter();
  const hasShownExpiredToastRef = useRef(false);
  const [remainingSeconds, setRemainingSeconds] = useState<number | null>(null);

  // เก็บไฟล์ที่ user เลือกไว้ก่อน submit เพื่อ validate ขนาดและส่งเข้า Server Action
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState("");

  // ถ้า asset QR หายหรือโหลดไม่ได้ UI ยังต้องใช้งาน upload slip ต่อได้
  const [isQrImageError, setIsQrImageError] = useState(false);

  // useTransition ช่วยให้ปุ่มแสดง loading state ตอนเรียก Server Action โดย UI ไม่ค้าง
  const [isPending, startTransition] = useTransition();
  const isDepositExpired = remainingSeconds === 0;
  const countdownText =
    remainingSeconds === null ? "--:--" : formatCountdownTime(remainingSeconds);
  const previewUrl = useMemo(() => {
    if (!selectedFile) {
      return null;
    }

    // สร้าง URL ชั่วคราวจากไฟล์ในเครื่อง เพื่อ preview ก่อนอัปโหลดจริง
    return URL.createObjectURL(selectedFile);
  }, [selectedFile]);

  useEffect(() => {
    function updateRemainingTime() {
      const nextRemainingSeconds =
        getRemainingDepositSeconds(appointmentCreatedAt);

      if (nextRemainingSeconds === null) {
        setRemainingSeconds(null);
        return;
      }

      setRemainingSeconds(nextRemainingSeconds);

      if (nextRemainingSeconds === 0 && !hasShownExpiredToastRef.current) {
        hasShownExpiredToastRef.current = true;
        toast.error(
          "หมดเวลาอัปโหลดสลิปแล้ว กรุณารีเฟรชหน้าและจองคิวใหม่อีกครั้ง",
        );
      }
    }

    updateRemainingTime();
    const intervalId = window.setInterval(updateRemainingTime, 1000);

    return () => window.clearInterval(intervalId);
  }, [appointmentCreatedAt]);

  useEffect(() => {
    if (!previewUrl) {
      return;
    }

    return () => {
      // คืนหน่วยความจำให้ browser เมื่อเปลี่ยนไฟล์หรือ component ถูกปิด
      URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      event.target.value = "";
      return;
    }

    // เช็กขนาดทันทีหลังเลือกรูป เพื่อให้ลูกค้ารู้ปัญหาก่อนกดส่ง
    if (file.size > MAX_SLIP_SIZE_BYTES) {
      const errorMessage = "ขนาดรูปสลิปต้องไม่เกิน 4MB";
      setSelectedFile(null);
      setFileError(errorMessage);
      toast.error(errorMessage);
      event.target.value = "";
      return;
    }

    setSelectedFile(file);
    event.target.value = "";
  };

  const handleClearFile = () => {
    setSelectedFile(null);
    setFileError("");
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isDepositExpired) {
      toast.error("หมดเวลาอัปโหลดสลิปแล้ว กรุณาจองคิวใหม่อีกครั้ง");
      return;
    }

    // Validate ฝั่ง client เพื่อให้ user ได้ feedback ทันที
    // ฝั่ง server ยัง validate ซ้ำอีกครั้งเพราะ client validation เชื่อถือไม่ได้ 100%
    if (!selectedFile) {
      const errorMessage = "กรุณาเลือกรูปสลิป";
      setFileError(errorMessage);
      toast.error(errorMessage);
      return;
    }

    if (selectedFile.size > MAX_SLIP_SIZE_BYTES) {
      const errorMessage = "ขนาดรูปสลิปต้องไม่เกิน 4MB";
      setFileError(errorMessage);
      toast.error(errorMessage);
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
      className="flex w-full flex-col gap-5 rounded-2xl border border-amber-200 bg-card p-5 text-left text-card-foreground dark:border-amber-800"
    >
      <div className="flex flex-col">
        <>
          <div className="flex flex-row justify-between">
            <h2 className="font-bold text-primary text-base md:text-xl">
              ชำระมัดจำเพื่อยืนยันคิว
            </h2>
            <Badge variant="outline" className="border-primary text-primary p-3">
              {depositAmount} บาท
            </Badge>
          </div>
          <p className="mt-1 text-muted-foreground text-xs md:text-sm w-70 md:w-full">
            สแกน QR Code เพื่อชำระเงิน แล้วอัปโหลดสลิปให้ระบบตรวจสอบอัตโนมัติ
          </p>
        </>

      </div>

      <div
        className={
          isDepositExpired
            ? "flex flex-col gap-3 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-destructive sm:flex-row sm:items-center sm:justify-between"
            : "flex flex-col gap-3 rounded-2xl border border-primary bg-primary/5 p-4 text-primary sm:flex-row sm:items-center sm:justify-between"
        }
      >
        <div className="flex items-start gap-3">
          <Clock3 className="mt-0.5 size-5 shrink-0" />
          <div>
            <p className="font-semibold text-sm">
              {isDepositExpired
                ? "หมดเวลาอัปโหลดสลิปแล้ว"
                : `เหลือเวลา ${countdownText}`}
            </p>
            <p className="mt-1 text-xs">
              {isDepositExpired
                ? "ระบบจะยกเลิกคิวนี้อัตโนมัติ กรุณารีเฟรชหน้าเพื่อเริ่มจองคิวใหม่"
                : `กรุณาอัปโหลดสลิปภายใน ${DEPOSIT_TIMEOUT_MINUTES} นาทีหลังจองคิว`}
            </p>
          </div>
        </div>

        {isDepositExpired ? (
          <Button
            type="button"
            size="lg"
            variant="outline"
            className="border-destructive/30 bg-background text-destructive hover:bg-destructive/10 hover:text-destructive"
            onClick={() => router.refresh()}
          >
            <RefreshCw data-icon="inline-start" />
            รีเฟรชหน้า
          </Button>
        ) : null}
      </div>

      <div
        className="md:items-start gap-5 grid md:grid-cols-[minmax(var(--deposit-qr-size),var(--deposit-qr-size))_minmax(0,1fr)]"
        style={{
          // ส่งค่าจากตัวแปร TS เข้า CSS variable เพื่อให้ Tailwind arbitrary grid ใช้ขนาดเดียวกันได้
          "--deposit-qr-size": `${DEPOSIT_QR_IMAGE_SIZE_PX}px`,
        } as CSSProperties}
      >
        <div className="flex flex-col gap-4 rounded-2xl border bg-card/90 p-4 text-center shadow-sm">
          <div
            className="relative mx-auto aspect-square w-full overflow-hidden rounded-xl bg-background"
            style={{ maxWidth: DEPOSIT_QR_IMAGE_SIZE_PX }}
          >
            {isQrImageError ? (
              // fallback นี้ทำให้ flow ไม่พังแม้รูป QR ใน public/images หายหรือโหลดไม่ได้
              <div className="flex h-full items-center justify-center p-6 text-sm font-medium text-amber-900 dark:text-amber-200">
                ไม่สามารถแสดง QR Code ได้
              </div>
            ) : (
              <Image
                src={DEPOSIT_QR_IMAGE_SRC}
                alt={`QR Code สำหรับชำระค่ามัดจำ ${depositAmount} บาท`}
                fill
                sizes={`(min-width: 768px) ${DEPOSIT_QR_IMAGE_SIZE_PX}px, 80vw`}
                className="p-2 object-contain"
                onError={() => setIsQrImageError(true)}
              />
            )}
          </div>
          <div>
            <p className="text-sm font-semibold text-amber-950 dark:text-amber-200">
              Scan เพื่อชำระมัดจำ
            </p>
            <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
              ชำระ {depositAmount} บาท ก่อนอัปโหลดสลิป
            </p>
          </div>
          <div className="px-3 text-left text-xs text-primary">
            <p className="font-medium">ขั้นตอนสั้น ๆ</p>
            <p className="mt-1">
              1. สแกน QR Code 2. บันทึกรูปสลิป 3. เลือกรูปแล้วกดตรวจสอบ
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-4 rounded-2xl border bg-card p-6 text-card-foreground shadow-sm">
          <FieldGroup>
            <Field>
              <div className="flex items-start justify-between  gap-3">
                <div>
                  <FieldLabel htmlFor="deposit-slip" className="text-base md:text-xl font-bold">
                    รูปสลิปโอนเงิน
                  </FieldLabel>
                  <FieldDescription className="text-xs md:text-sm text-muted-foreground">
                    รองรับ JPG, PNG, GIF, WebP ขนาดไม่เกิน 4MB
                  </FieldDescription>
                </div>
                {selectedFile ? (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    disabled={isPending || isDepositExpired}
                    onClick={handleClearFile}
                  >
                    <XIcon data-icon="inline-start" />
                    ล้างรูป
                  </Button>
                ) : null}
              </div>

              <FieldDescription className="text-primary text-sm md:text-base">
                *เลือกรูปให้ชัด เห็นยอดเงิน วันที่ เวลา และเลขอ้างอิงครบถ้วน*
              </FieldDescription>

              <Input
                id="deposit-slip"
                type="file"
                accept={ACCEPTED_SLIP_TYPES}
                disabled={isPending || isDepositExpired}
                onChange={handleFileChange}
                className="sr-only"
              />
            </Field>
          </FieldGroup>

          <label
            htmlFor="deposit-slip"
            aria-disabled={isPending || isDepositExpired}
            className={
              isPending || isDepositExpired
                ? "flex min-h-72 cursor-not-allowed flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-200 bg-amber-50/60 p-4 text-center opacity-70 dark:border-amber-800 dark:bg-amber-950/20"
                : "flex min-h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-amber-300 bg-amber-50/60 p-4 text-center transition-colors hover:border-amber-400 hover:bg-amber-100/60 dark:border-amber-800 dark:bg-amber-950/20 dark:hover:bg-amber-950/30"
            }
          >
            {previewUrl ? (
              <>
                <div className="flex w-full justify-between gap-3 rounded-lg border border-amber-200 bg-background px-3 py-2 text-left text-sm dark:border-amber-800">
                  <span className="min-w-0 truncate font-medium text-amber-950 dark:text-amber-200">
                    {selectedFile?.name}
                  </span>
                  <span className="shrink-0 text-amber-800 dark:text-amber-300">
                    {selectedFile ? formatFileSize(selectedFile.size) : ""}
                  </span>
                </div>
                <div className="flex max-h-80 w-full items-center justify-center overflow-hidden rounded-lg border border-amber-100 bg-background dark:border-amber-800">
                  {/* ใช้ img ธรรมดาเพราะ previewUrl เป็น blob URL จากเครื่องลูกค้า ไม่ใช่รูป static ของ Next.js */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={`ตัวอย่างรูปสลิป ${selectedFile?.name ?? ""}`}
                    className="w-full max-h-80 object-contain"
                  />
                </div>
                <span className="inline-flex items-center gap-1.5 text-xs text-amber-900 dark:text-amber-200">
                  <UploadCloud className="size-3.5" />
                  คลิกเพื่อเปลี่ยนรูปสลิป
                </span>
              </>
            ) : (
              <>
                <div className="flex size-14 items-center justify-center rounded-full bg-background text-amber-700 ring-1 ring-amber-200 dark:text-amber-300 dark:ring-amber-800">
                  <ImageIcon className="size-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-amber-950 dark:text-amber-200">
                    เลือกรูปสลิปเพื่อแสดงตัวอย่าง
                  </p>
                  <p className="mt-1 text-xs text-amber-800 dark:text-amber-300">
                    แตะที่กล่องนี้เพื่อเลือกรูปจากเครื่องของคุณ
                  </p>
                </div>
                <span className="inline-flex min-h-8 items-center justify-center rounded-lg bg-background px-3 text-xs font-medium text-amber-900 ring-1 ring-amber-200 dark:text-amber-200 dark:ring-amber-800">
                  เลือกรูปสลิป
                </span>
              </>
            )}
          </label>

          {fileError ? (
            <p aria-live="polite" className="text-sm text-destructive">
              {fileError}
            </p>
          ) : null}

          <LoadingButton
            type="submit"
            disabled={
              !selectedFile ||
              Boolean(fileError) ||
              isDepositExpired
            }
            isLoading={isPending}
            loadingText="กำลังตรวจสอบสลิป..."
            className="w-full bg-emerald-600 shadow-none hover:bg-emerald-700 dark:bg-emerald-500 dark:text-emerald-950 dark:hover:bg-emerald-400"
          >
            <UploadCloud data-icon="inline-start" />
            {isDepositExpired
              ? "หมดเวลาอัปโหลดสลิป"
              : "อัปโหลดและตรวจสอบสลิป"}
          </LoadingButton>

          <div className="flex items-start gap-2 text-xs text-amber-900 dark:text-amber-200">
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
