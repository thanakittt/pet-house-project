-- Migration: 0016_redact_pii_slip_verifications
--
-- เปลี่ยนแปลง payment_slip_verifications:
--   - ลบคอลัมน์ jsonb ที่เก็บ payload เต็มจาก provider (matched_account, raw_slip, provider_response)
--     เหตุผล: เก็บ PII เกินความจำเป็น ขัดกับหลัก data minimization
--   - เพิ่มคอลัมน์ audit ขั้น minimal แทน:
--       payer_name_redacted  text  — ชื่อแรกผู้โอน + *** (เช่น "สมชาย ***")
--       payer_account_last4  text  — 4 หลักท้ายบัญชีผู้โอน
--       provider_reference   text  — transaction reference จาก provider
--       redacted_at          timestamptz — เวลาที่ลบ PII ออก (null = ยังไม่ลบ)
--
-- Retention Plan:
--   - ข้อมูลในคอลัมน์ minimal ให้เก็บ 90 วัน
--   - หลังครบกำหนด: เรียก redactPaymentData(id) เพื่อ null out payer_name_redacted, payer_account_last4
--   - ดู lib/finance/redact-payment-data.ts สำหรับ implementation

-- 1. ลบคอลัมน์ jsonb ที่มี PII
ALTER TABLE "payment_slip_verifications"
  DROP COLUMN IF EXISTS "matched_account",
  DROP COLUMN IF EXISTS "raw_slip",
  DROP COLUMN IF EXISTS "provider_response";
--> statement-breakpoint

-- 2. เพิ่มคอลัมน์ audit minimal แทน
ALTER TABLE "payment_slip_verifications"
  ADD COLUMN IF NOT EXISTS "payer_name_redacted" text,
  ADD COLUMN IF NOT EXISTS "payer_account_last4" text,
  ADD COLUMN IF NOT EXISTS "provider_reference"  text,
  ADD COLUMN IF NOT EXISTS "redacted_at"         timestamp with time zone;
--> statement-breakpoint

-- หมายเหตุ: provider_reference เก็บค่าเดียวกับ trans_ref
-- ใช้ยืนยันกับ Thunder support กรณีมีข้อพิพาทภายหลัง
