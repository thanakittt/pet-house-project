"use client";

import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useState } from "react";
import DepositSlipUpload from "./DepositSlipUpload";

export default function PendingDepositPaymentScreen({
  appointmentId,
}: {
  appointmentId: string;
}) {
  // เมื่อ verify slip ผ่านแล้ว DepositSlipUpload จะส่ง transRef กลับมา
  // component นี้ใช้ state นี้เพื่อสลับจากหน้ารอจ่ายเงินเป็นหน้าสถานะยืนยันคิวแล้วทันที
  const [verifiedSlipTransRef, setVerifiedSlipTransRef] = useState("");

  // แสดงเฉพาะส่วนหน้าของ UUID เพื่อให้ลูกค้าจำรหัสการจองได้ง่ายขึ้น
  // appointmentId เต็มยังถูกส่งไป server action ผ่าน DepositSlipUpload
  const shortAppointmentId = appointmentId.split("-")[0].toUpperCase();

  return (
    <div className="mx-auto my-4 flex h-auto w-full max-w-5xl flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
      <div className="flex size-16 items-center justify-center rounded-full bg-amber-100 text-amber-700">
        {verifiedSlipTransRef ? (
          <ShieldCheck className="size-8" />
        ) : (
          <CheckCircle2 className="size-8" />
        )}
      </div>

      <div>
        <h1 className="mb-2 text-2xl font-bold text-slate-900">
          {verifiedSlipTransRef ? "ยืนยันคิวแล้ว" : "ชำระมัดจำเพื่อยืนยันคิว"}
        </h1>
        <p className="text-sm text-muted-foreground">
          รหัสการจอง #{shortAppointmentId}
        </p>
      </div>

      {verifiedSlipTransRef ? (
        // เมื่อ verify ผ่าน ไม่ต้องแสดง upload form ซ้ำ เพราะ appointment ถูกเปลี่ยนเป็น CONFIRMED แล้ว
        <div className="w-full max-w-xl rounded-2xl border border-green-200 bg-green-50 p-5 text-left text-sm text-green-900">
          <p className="font-semibold">สถานะปัจจุบัน: ยืนยันคิวแล้ว</p>
          <p className="mt-1">
            ระบบตรวจสอบสลิปและบันทึกค่ามัดจำ {APPOINTMENT_DEPOSIT_AMOUNT}{" "}
            บาทเรียบร้อยแล้ว
          </p>
          <p className="mt-2 text-xs text-green-800">
            เลขอ้างอิงสลิป: {verifiedSlipTransRef}
          </p>
        </div>
      ) : (
        <>
          {/* หน้านี้ตั้งใจแสดงเฉพาะการจ่ายมัดจำ เพื่อกันลูกค้าจองคิวใหม่ซ้อนก่อนจ่ายคิวเดิม */}
          <div className="w-full max-w-xl rounded-2xl border border-amber-200 bg-amber-50 p-5 text-left text-sm text-amber-950">
            <p className="font-semibold">สถานะปัจจุบัน: รอชำระมัดจำ</p>
            <p className="mt-1">
              คุณมีคิวที่รอชำระมัดจำอยู่ กรุณาชำระและอัปโหลดสลิปก่อนจองคิวใหม่
            </p>
          </div>

          {/* Reuse component เดิม เพื่อให้ logic เลือกไฟล์, เรียก Thunder และ toast อยู่จุดเดียว */}
          <DepositSlipUpload
            appointmentId={appointmentId}
            onVerified={(transRef) => setVerifiedSlipTransRef(transRef || "-")}
          />
        </>
      )}
    </div>
  );
}
