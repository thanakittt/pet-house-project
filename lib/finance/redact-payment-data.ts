/**
 * lib/finance/redact-payment-data.ts
 *
 * Retention & Redaction Plan สำหรับ payment_slip_verifications
 * ──────────────────────────────────────────────────────────────
 * Schema ใหม่ไม่เก็บ JSON เต็มจาก provider อีกต่อไป
 * แต่ยังมีฟิลด์ minimal ที่อาจต้องลบออกหลังพ้นช่วง retention:
 *   - payerNameRedacted  (ชื่อแรก + ***)
 *   - payerAccountLast4  (4 หลักท้ายของบัญชีผู้โอน)
 *   - providerReference  (trans_ref จาก provider)
 *
 * Policy:
 *   - เก็บ 90 วันหลังจากวันชำระ (สอดคล้อง PDPA แนวปฏิบัติ)
 *   - หลังครบกำหนด: ลบข้อมูล audit ออก แต่คง row ไว้ (status/amount/transRef)
 *   - redactedAt ≠ null = ลบเรียบร้อยแล้ว ไม่ต้องลบซ้ำ
 *
 * วิธีใช้:
 *   import { redactPaymentData } from "@/lib/finance/redact-payment-data";
 *   await redactPaymentData(verificationId);
 *
 * Purge Job (ตัวอย่าง — ให้ Cron/pg_cron เรียกทุกวัน):
 *   const ids = await db.select({ id: paymentSlipVerifications.id })
 *     .from(paymentSlipVerifications)
 *     .where(
 *       and(
 *         isNull(paymentSlipVerifications.redactedAt),
 *         lt(paymentSlipVerifications.createdAt, subDays(new Date(), 90)),
 *       ),
 *     );
 *   await Promise.all(ids.map(({ id }) => redactPaymentData(id)));
 */

import { db } from "@/db";
import { paymentSlipVerifications } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * redactPaymentData
 *
 * ลบ (null out) ข้อมูล PII minimal ออกจาก payment_slip_verifications row
 * แล้วบันทึก redactedAt เพื่อ mark ว่า row นี้ถูก redact แล้ว
 *
 * @param verificationId  - UUID ของ payment_slip_verifications row
 * @returns true ถ้าลบสำเร็จ, false ถ้า row ไม่พบหรือถูก redact แล้ว
 */
export async function redactPaymentData(verificationId: string): Promise<boolean> {
  // อัปเดตเฉพาะ row ที่ยังไม่ได้ลบ (redactedAt IS NULL)
  // เพื่อป้องกันการ redact ซ้ำโดยไม่จำเป็น
  const result = await db
    .update(paymentSlipVerifications)
    .set({
      // ลบฟิลด์ PII minimal ออก
      payerNameRedacted: null,
      payerAccountLast4: null,
      // providerReference (trans_ref) ยังคงอยู่เพราะใช้ยืนยันกับ provider
      // ถ้าต้องการลบด้วย ให้เพิ่ม: providerReference: null,

      // บันทึกเวลาที่ redact เพื่อ audit trail
      redactedAt: new Date(),
    })
    .where(
      and(
        // ตรง row ที่ระบุ
        eq(paymentSlipVerifications.id, verificationId),
        // ยังไม่เคย redact
        isNull(paymentSlipVerifications.redactedAt),
      ),
    )
    .returning({ id: paymentSlipVerifications.id });

  // ถ้า result ว่าง = ไม่พบ row หรือถูก redact แล้ว
  return result.length > 0;
}
