"use client";

import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { ShieldCheck, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import CustomerCancelAppointmentButton from "./CustomerCancelAppointmentButton";
import DepositSlipUpload from "./DepositSlipUpload";

export default function PendingDepositPaymentScreen({
  appointmentId,
  appointmentCreatedAt,
  depositAmount,
}: {
  appointmentId: string;
  appointmentCreatedAt: string;
  depositAmount: number;
}) {
  const router = useRouter();
  // เมื่อ verify slip ผ่านแล้ว DepositSlipUpload จะส่ง transRef กลับมา
  // component นี้ใช้ state นี้เพื่อสลับจากหน้ารอจ่ายเงินเป็นหน้าสถานะยืนยันคิวแล้วทันที
  const [verifiedSlipTransRef, setVerifiedSlipTransRef] = useState("");

  // แสดงเฉพาะส่วนหน้าของ UUID เพื่อให้ลูกค้าจำรหัสการจองได้ง่ายขึ้น
  // appointmentId เต็มยังถูกส่งไป server action ผ่าน DepositSlipUpload
  const shortAppointmentId = appointmentId.split("-")[0].toUpperCase();

  return (
    <div className="mx-auto my-4 flex h-auto w-full max-w-5xl flex-col items-center gap-6 bg-card text-center text-card-foreground md:rounded-2xl md:border md:p-8 md:shadow-sm">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-50 text-amber-400 shadow-sm dark:bg-amber-950/40 dark:text-amber-300">
        {verifiedSlipTransRef ? (
          <ShieldCheck className="size-8" />
        ) : (
          <Wallet className="size-8" />
        )}
      </div>

      <div>
        <h1 className="mb-2 text-2xl font-black text-primary">
          {verifiedSlipTransRef ? "ยืนยันคิวแล้ว" : "ชำระมัดจำเพื่อยืนยันคิว"}
        </h1>
        <p className="text-sm text-muted-foreground">
          รหัสการจอง #{shortAppointmentId}
        </p>
      </div>

      {verifiedSlipTransRef ? (
        // เมื่อ verify ผ่าน ไม่ต้องแสดง upload form ซ้ำ เพราะ appointment ถูกเปลี่ยนเป็น CONFIRMED แล้ว
        <div className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-left text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
          <div className="flex flex-wrap items-center gap-2 font-semibold">
            <span>สถานะปัจจุบัน:</span>
            <AppointmentStatusBadge status="CONFIRMED" />
          </div>
          <p className="mt-1">
            ระบบตรวจสอบสลิปและบันทึกค่ามัดจำ {depositAmount}{" "}
            บาทเรียบร้อยแล้ว
          </p>
          <p className="mt-2 text-xs text-emerald-800 dark:text-emerald-300">
            เลขอ้างอิงสลิป: {verifiedSlipTransRef}
          </p>
        </div>
      ) : (
        <>
          {/* หน้านี้ตั้งใจแสดงเฉพาะการจ่ายมัดจำ เพื่อกันลูกค้าจองคิวใหม่ซ้อนก่อนจ่ายคิวเดิม */}
          <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span>สถานะปัจจุบัน:</span>
              <AppointmentStatusBadge status="PENDING_DEPOSIT" />
            </div>
            <p className="mt-1">
              คุณมีคิวที่รอชำระมัดจำอยู่ กรุณาชำระและอัปโหลดสลิปก่อนจองคิวใหม่
            </p>
          </div>

          {/* Reuse component เดิม เพื่อให้ logic เลือกไฟล์, เรียก Thunder และ toast อยู่จุดเดียว */}
          <DepositSlipUpload
            appointmentId={appointmentId}
            appointmentCreatedAt={appointmentCreatedAt}
            depositAmount={depositAmount}
            onVerified={(transRef) => {
              setVerifiedSlipTransRef(transRef || "-");
              router.push("/appointments");
            }}
          />
          <CustomerCancelAppointmentButton
            appointmentId={appointmentId}
            size="lg"
            className="w-full rounded-xl"
          />
        </>
      )}
    </div>
  );
}
