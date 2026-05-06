"use server";

import { db } from "@/db";
import {
  appointments,
  customers,
  payments,
  paymentSlipVerifications,
} from "@/db/schema";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { formatDateOnly } from "@/lib/finance/date";
import { recordTransaction } from "@/lib/finance/record-transaction";
import { requireCustomer } from "@/lib/session";
import { supabaseServer } from "@/lib/supabase-server";
import type { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";

const THUNDER_VERIFY_BANK_URL = "https://api.thunder.in.th/v2/verify/bank";
const SLIP_STORAGE_BUCKET = "images";
const SLIP_STORAGE_FOLDER = "deposit-slips";
const MAX_SLIP_SIZE_BYTES = 4 * 1024 * 1024;

// MIME type ที่ Thunder รองรับตามเอกสาร และใช้ซ้ำทั้ง validation กับการเลือกนามสกุลไฟล์
const ALLOWED_SLIP_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
] as const;

type AllowedSlipImageType = (typeof ALLOWED_SLIP_IMAGE_TYPES)[number];

type ThunderVerifyBankSuccess = {
  success: true;
  data: {
    remark?: string;
    isDuplicate: boolean;
    matchedAccount: unknown | null;
    amountInOrder?: number;
    amountInSlip: number;
    isAmountMatched?: boolean;
    rawSlip: {
      transRef?: string;
      date?: string;
      amount?: {
        amount?: number;
      };
      [key: string]: unknown;
    };
  };
  message: string;
};

type ThunderVerifyBankError = {
  success: false;
  error?: {
    code?: string;
    message?: string;
  };
  message?: string;
};

type ThunderVerifyBankResponse =
  | ThunderVerifyBankSuccess
  | ThunderVerifyBankError;

// ใช้ infer type จาก Drizzle เพื่อให้ object ที่ insert เข้า payment_slip_verifications ตรง schema เสมอ
type SlipVerificationInsert = typeof paymentSlipVerifications.$inferInsert;

const extensionByMimeType: Record<AllowedSlipImageType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/gif": "gif",
  "image/webp": "webp",
};

function isAllowedSlipImageType(value: string): value is AllowedSlipImageType {
  return ALLOWED_SLIP_IMAGE_TYPES.includes(value as AllowedSlipImageType);
}

// แปลง error code จาก Thunder เป็นข้อความที่ลูกค้าอ่านเข้าใจ
// ถ้า provider ส่ง code ใหม่ที่เราไม่รู้จัก จะ fallback เป็น message จาก provider หรือข้อความกลาง
function getProviderErrorMessage(errorCode?: string, fallback?: string) {
  switch (errorCode) {
    case "IMAGE_SIZE_TOO_LARGE":
      return "ขนาดรูปสลิปต้องไม่เกิน 4MB";
    case "INVALID_IMAGE_FORMAT":
      return "ไฟล์นี้ไม่ใช่รูปภาพสลิปที่รองรับ";
    case "SLIP_NOT_FOUND":
      return "ไม่พบ QR code ในรูปสลิป กรุณาอัปโหลดรูปที่ QR ชัดเจน";
    case "SLIP_PENDING":
      return "สลิปธนาคารกรุงเทพอาจยังตรวจไม่ได้ กรุณารอสักครู่แล้วลองใหม่";
    default:
      return fallback || "ตรวจสอบสลิปไม่สำเร็จ กรุณาลองใหม่อีกครั้ง";
  }
}

async function uploadDepositSlip({
  appointmentId,
  imageFile,
}: {
  appointmentId: string;
  imageFile: File;
}) {
  // แยก path ตาม appointmentId เพื่อให้ trace ย้อนหลังง่าย และใช้ randomUUID กันชื่อไฟล์ชนกัน
  const extension = extensionByMimeType[imageFile.type as AllowedSlipImageType];
  const storageKey = `${SLIP_STORAGE_FOLDER}/${appointmentId}/${crypto.randomUUID()}.${extension}`;

  const { error } = await supabaseServer.storage
    .from(SLIP_STORAGE_BUCKET)
    .upload(storageKey, imageFile, {
      contentType: imageFile.type,
      upsert: false,
    });

  if (error) {
    console.error("uploadDepositSlip error:", error);
    throw new Error("อัปโหลดรูปสลิปไม่สำเร็จ");
  }

  const { data } = supabaseServer.storage
    .from(SLIP_STORAGE_BUCKET)
    .getPublicUrl(storageKey);

  return data.publicUrl;
}

async function verifySlipWithThunder({
  imageFile,
  remark,
}: {
  imageFile: File;
  remark: string;
}) {
  // API key อยู่ใน .env เท่านั้น ห้ามส่งลง client เพราะเป็น secret สำหรับเรียก Thunder
  const apiKey = process.env.THUNDER_API_KEY;

  if (!apiKey) {
    throw new Error("ยังไม่ได้ตั้งค่า THUNDER_API_KEY");
  }

  const formData = new FormData();
  formData.append("image", imageFile);
  formData.append("remark", remark);
  // ให้ Thunder ตรวจทั้งบัญชีปลายทาง, จำนวนเงิน และสลิปซ้ำ
  // ฝั่งเรายังตรวจซ้ำอีกรอบด้านล่างเพื่อกัน response ผิดรูปหรือ edge case
  formData.append("matchAccount", "true");
  formData.append("matchAmount", APPOINTMENT_DEPOSIT_AMOUNT.toString());
  formData.append("checkDuplicate", "true");

  const response = await fetch(THUNDER_VERIFY_BANK_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
    },
    body: formData,
  });

  const responseText = await response.text();
  let payload: ThunderVerifyBankResponse;

  try {
    payload = JSON.parse(responseText) as ThunderVerifyBankResponse;
  } catch {
    throw new Error("ไม่สามารถอ่านผลตรวจสลิปจาก provider ได้");
  }

  return payload;
}

async function recordSlipVerificationAttempt(
  status: "REJECTED" | "ERROR",
  values: Omit<SlipVerificationInsert, "status" | "provider">,
) {
  // บันทึก attempt ที่ไม่ผ่านด้วย เพื่อให้ staff/dev ตรวจย้อนหลังได้ว่า reject เพราะอะไร
  await db.insert(paymentSlipVerifications).values({
    ...values,
    provider: "THUNDER",
    status,
  });
}

function buildBaseVerificationValues({
  appointmentId,
  slipImageUrl,
  remark,
  payload,
}: {
  appointmentId: string;
  slipImageUrl: string;
  remark: string;
  payload: ThunderVerifyBankResponse;
}): Omit<SlipVerificationInsert, "status" | "provider"> {
  // function นี้ normalize response จาก Thunder ให้เป็น shape ของตารางเรา
  // ใช้ทั้งเคสสำเร็จและไม่สำเร็จ เพื่อลดการ map field ซ้ำหลายจุด
  if (!payload.success) {
    return {
      appointmentId,
      slipImageUrl,
      remark,
      providerResponse: payload,
      providerErrorCode: payload.error?.code ?? null,
      providerErrorMessage: payload.error?.message ?? payload.message ?? null,
    };
  }

  return {
    appointmentId,
    slipImageUrl,
    remark: payload.data.remark ?? remark,
    transRef: payload.data.rawSlip.transRef ?? null,
    amountInSlip: payload.data.amountInSlip.toFixed(2),
    amountInOrder:
      typeof payload.data.amountInOrder === "number"
        ? payload.data.amountInOrder.toFixed(2)
        : APPOINTMENT_DEPOSIT_AMOUNT.toFixed(2),
    isAmountMatched: payload.data.isAmountMatched ?? null,
    isDuplicate: payload.data.isDuplicate,
    matchedAccount: payload.data.matchedAccount,
    rawSlip: payload.data.rawSlip,
    providerResponse: payload,
  };
}

async function finalizeVerifiedDeposit({
  appointmentId,
  slipImageUrl,
  remark,
  payload,
}: {
  appointmentId: string;
  slipImageUrl: string;
  remark: string;
  payload: ThunderVerifyBankSuccess;
}) {
  return await db.transaction(async (tx) => {
    // lock แถว appointment ก่อนเปลี่ยนสถานะ เพื่อกัน race condition จากการ upload slip พร้อมกันหลาย browser/tab
    const [appointment] = await tx
      .select({
        id: appointments.id,
        status: appointments.status,
      })
      .from(appointments)
      .where(and(eq(appointments.id, appointmentId), isNull(appointments.deletedAt)))
      .for("update")
      .limit(1);

    if (!appointment) {
      throw new Error("ไม่พบข้อมูลการจอง");
    }

    if (appointment.status !== "PENDING_DEPOSIT") {
      throw new Error("การจองนี้ไม่อยู่ในสถานะรอชำระมัดจำ");
    }

    const existingDeposit = await tx.query.payments.findFirst({
      where: (payment, { and, eq }) =>
        and(
          eq(payment.appointmentId, appointmentId),
          eq(payment.paymentType, "DEPOSIT"),
          eq(payment.status, "PAID"),
        ),
    });

    if (existingDeposit) {
      // ถ้ามี payment มัดจำที่จ่ายแล้วอยู่ก่อน แปลว่าเคย finalize สำเร็จไปแล้ว
      // จึงแค่ยืนยันสถานะ appointment ให้ตรง แล้ว return payment เดิมแบบ idempotent
      await tx
        .update(appointments)
        .set({ status: "CONFIRMED" })
        .where(eq(appointments.id, appointmentId));

      return existingDeposit.id;
    }

    const today = new Date();

    // เมื่อ Thunder ผ่านครบทุกเงื่อนไข จึงสร้าง payment จริงในระบบการเงิน
    const [payment] = await tx
      .insert(payments)
      .values({
        appointmentId,
        amount: APPOINTMENT_DEPOSIT_AMOUNT.toFixed(2),
        paymentMethod: "TRANSFER",
        paymentDate: formatDateOnly(today),
        status: "PAID",
        paymentType: "DEPOSIT",
      })
      .returning({ id: payments.id });

    // เก็บ response ดิบและข้อมูลที่ extract ได้จาก Thunder เพื่อใช้ audit / debug ภายหลัง
    await tx.insert(paymentSlipVerifications).values({
      ...buildBaseVerificationValues({
        appointmentId,
        slipImageUrl,
        remark,
        payload,
      }),
      paymentId: payment.id,
      provider: "THUNDER",
      status: "VERIFIED",
    });

    // จุดนี้คือผลลัพธ์สำคัญของ flow: คิวจาก PENDING_DEPOSIT กลายเป็น CONFIRMED
    await tx
      .update(appointments)
      .set({ status: "CONFIRMED" })
      .where(eq(appointments.id, appointmentId));

    // บันทึก transaction รายรับ เพื่อให้หน้าการเงินเห็นค่ามัดจำนี้ด้วย
    await recordTransaction(tx, {
      amount: APPOINTMENT_DEPOSIT_AMOUNT,
      transactionDate: today,
      categoryType: "INCOME",
      categoryName: "รายรับมัดจำการนัดหมาย",
      note: `มัดจำนัดหมาย #${appointmentId}`,
    });

    return payment.id;
  });
}

export async function verifyCustomerDepositSlip(
  formData: FormData,
): Promise<
  ActionResponse<{
    appointmentId: string;
    paymentId: string;
    status: "CONFIRMED";
    transRef?: string;
  }>
> {
  try {
    // Server Action นี้เรียกจาก client ได้ จึงต้องตรวจ session ใหม่เสมอ
    // ห้ามเชื่อ appointmentId ที่ส่งมาจาก browser ว่าเป็นของลูกค้าคนนี้จริง
    const session = await requireCustomer({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "กรุณาเข้าสู่ระบบก่อนอัปโหลดสลิป",
      };
    }

    const appointmentId = formData.get("appointmentId");
    const imageFile = formData.get("slipImage");

    // validate input พื้นฐานก่อนเริ่มงานหนัก เช่น upload storage หรือเรียก provider
    if (typeof appointmentId !== "string" || !appointmentId) {
      return {
        success: false,
        error: "ไม่พบรหัสการจอง",
      };
    }

    if (!(imageFile instanceof File) || imageFile.size === 0) {
      return {
        success: false,
        error: "กรุณาเลือกรูปสลิป",
      };
    }

    if (!isAllowedSlipImageType(imageFile.type)) {
      return {
        success: false,
        error: "รองรับเฉพาะไฟล์ JPG, PNG, GIF หรือ WebP",
      };
    }

    if (imageFile.size > MAX_SLIP_SIZE_BYTES) {
      return {
        success: false,
        error: "ขนาดรูปสลิปต้องไม่เกิน 4MB",
      };
    }

    const customer = await db.query.customers.findFirst({
      columns: { id: true },
      where: and(eq(customers.userId, session.user.id), isNull(customers.deletedAt)),
    });

    if (!customer) {
      return {
        success: false,
        error: "ไม่พบโปรไฟล์ลูกค้า",
      };
    }

    const appointment = await db.query.appointments.findFirst({
      columns: {
        id: true,
        status: true,
      },
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.customerId, customer.id),
        isNull(appointments.deletedAt),
      ),
    });

    // owner check: appointmentId ต้องเป็นของ customer ที่ login อยู่เท่านั้น
    if (!appointment) {
      return {
        success: false,
        error: "ไม่พบการจองของบัญชีนี้",
      };
    }

    if (appointment.status === "CANCELLED") {
      return {
        success: false,
        error:
          "การจองนี้ถูกยกเลิกแล้ว เพราะไม่ได้อัปโหลดสลิปภายใน 15 นาที กรุณาจองคิวใหม่อีกครั้ง",
      };
    }

    if (appointment.status !== "PENDING_DEPOSIT") {
      return {
        success: false,
        error: "การจองนี้ไม่อยู่ในสถานะรอชำระมัดจำ",
      };
    }

    const remark = `appointment:${appointmentId}`;

    // อัปโหลดรูปก่อนเรียก Thunder เพื่อให้เรามีหลักฐานของ attempt ทุกครั้ง
    // แม้ Thunder reject เราก็ยังเก็บ URL และผล reject ลง payment_slip_verifications ได้
    const slipImageUrl = await uploadDepositSlip({ appointmentId, imageFile });
    let payload: ThunderVerifyBankResponse;

    try {
      payload = await verifySlipWithThunder({ imageFile, remark });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "ไม่สามารถเชื่อมต่อ provider ตรวจสลิปได้";

      await recordSlipVerificationAttempt("ERROR", {
        appointmentId,
        slipImageUrl,
        remark,
        providerErrorMessage: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    const baseVerificationValues = buildBaseVerificationValues({
      appointmentId,
      slipImageUrl,
      remark,
      payload,
    });

    // Thunder ตอบ success=false เช่น ไม่พบ QR, รูปไม่ถูกต้อง หรือ slip pending
    if (!payload.success) {
      await recordSlipVerificationAttempt("REJECTED", baseVerificationValues);

      return {
        success: false,
        error: getProviderErrorMessage(
          payload.error?.code,
          payload.error?.message ?? payload.message,
        ),
      };
    }

    // กันการนำสลิปเดิมมาใช้ซ้ำ
    if (payload.data.isDuplicate) {
      await recordSlipVerificationAttempt("REJECTED", baseVerificationValues);

      return {
        success: false,
        error: "สลิปนี้ถูกใช้งานแล้ว กรุณาใช้สลิปใหม่",
      };
    }

    // matchAccount=true แล้ว Thunder จะพยายามเทียบบัญชีผู้รับกับบัญชีร้านที่ลงทะเบียนไว้
    if (payload.data.matchedAccount === null) {
      await recordSlipVerificationAttempt("REJECTED", baseVerificationValues);

      return {
        success: false,
        error: "บัญชีผู้รับเงินในสลิปไม่ตรงกับบัญชีร้าน",
      };
    }

    // ตรวจยอดเงินจาก provider และตรวจซ้ำเองด้วย tolerance 0.01 เผื่อ decimal precision
    if (
      payload.data.isAmountMatched === false ||
      Math.abs(payload.data.amountInSlip - APPOINTMENT_DEPOSIT_AMOUNT) > 0.01
    ) {
      await recordSlipVerificationAttempt("REJECTED", baseVerificationValues);

      return {
        success: false,
        error: `ยอดเงินในสลิปต้องตรงกับค่ามัดจำ ${APPOINTMENT_DEPOSIT_AMOUNT} บาท`,
      };
    }

    let paymentId: string;

    try {
      // finalize ทุกอย่างใน transaction เดียว: payment, verification, appointment status, transaction รายรับ
      paymentId = await finalizeVerifiedDeposit({
        appointmentId,
        slipImageUrl,
        remark,
        payload,
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "บันทึกผลตรวจสลิปไม่สำเร็จ";

      await recordSlipVerificationAttempt("ERROR", {
        ...baseVerificationValues,
        providerErrorMessage: errorMessage,
      });

      return {
        success: false,
        error: errorMessage,
      };
    }

    // revalidate หน้าเกี่ยวข้อง เพื่อให้หลัง verify แล้ว reload หน้าเห็นสถานะล่าสุด
    revalidatePath("/appointments/new");
    revalidatePath("/back-office/appointments");
    revalidatePath(`/back-office/appointments/${appointmentId}`);

    return {
      success: true,
      data: {
        appointmentId,
        paymentId,
        status: "CONFIRMED",
        transRef: payload.data.rawSlip.transRef,
      },
    };
  } catch (error) {
    console.error("verifyCustomerDepositSlip error:", error);

    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "ไม่สามารถตรวจสอบสลิปได้ กรุณาลองใหม่อีกครั้ง",
    };
  }
}
