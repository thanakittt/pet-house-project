import { transactions, transactionCategories } from "@/db/schema";
import { and, eq, isNull } from "drizzle-orm";

/**
 * ประเภทของ Drizzle Transaction Context ที่ส่งเข้ามาจาก db.transaction()
 * ใช้ generic เพื่อรองรับทั้ง read/write operations ภายใน transaction
 */
type TxContext = Parameters<
  Parameters<typeof import("@/db").db.transaction>[0]
>[0];

/**
 * ข้อมูลที่ต้องใช้ในการบันทึก transaction ทางการเงิน
 */
export interface RecordTransactionInput {
  /** จำนวนเงิน (บวกเสมอ — ทิศทางบวก/ลบขึ้นกับ type ของ category) */
  amount: number;
  /** วันที่เกิดธุรกรรม */
  transactionDate: Date;
  /** ประเภทของ category ที่ต้องการ: "INCOME" หรือ "EXPENSE" */
  categoryType: "INCOME" | "EXPENSE";
  /** ชื่อ category ที่ต้องการ (ใช้ match แบบ exact) */
  categoryName: string;
  /** (Optional) หมายเหตุเพิ่มเติม */
  note?: string;
}

/**
 * บันทึกรายการธุรกรรมทางการเงินลงตาราง `transactions`
 *
 * ฟังก์ชันนี้ออกแบบให้ทำงาน **ภายใน** Drizzle transaction context เท่านั้น
 * เพื่อให้การ rollback ทำงานได้ถูกต้องเมื่อเกิด error ใน transaction หลัก
 *
 * กลยุทธ์การหา category:
 * - ค้นหา category แรกที่ตรงกับ `categoryName` + `categoryType` และยังไม่ถูก soft-delete
 * - ถ้าไม่พบ → throw Error เพื่อให้ transaction หลัก rollback ทันที
 *
 * @param tx  - Drizzle transaction context จาก db.transaction()
 * @param input - ข้อมูล transaction ที่ต้องการบันทึก
 *
 * @throws Error ถ้าไม่พบ category ที่ตรงกัน
 *
 * @example
 * await db.transaction(async (tx) => {
 *   // ... business logic ...
 *   await recordTransaction(tx, {
 *     amount: 500,
 *     transactionDate: new Date(),
 *     categoryType: "INCOME",
 *     categoryName: "รายรับจากการให้บริการ",
 *     note: "ชำระเงินนัดหมาย",
 *   });
 * });
 */
export async function recordTransaction(
  tx: TxContext,
  input: RecordTransactionInput,
): Promise<void> {
  // 1. ค้นหา transaction category ที่ตรงกับชื่อและประเภทที่กำหนด
  const [category] = await tx
    .select({ id: transactionCategories.id })
    .from(transactionCategories)
    .where(
      and(
        eq(transactionCategories.name, input.categoryName),
        eq(transactionCategories.type, input.categoryType),
        isNull(transactionCategories.deletedAt),
      ),
    )
    .limit(1);

  // 2. ถ้าไม่พบ category → throw เพื่อบังคับให้ transaction หลัก rollback
  if (!category) {
    throw new Error(
      `ไม่พบหมวดหมู่ธุรกรรม "${input.categoryName}" (${input.categoryType}) กรุณาสร้างหมวดหมู่นี้ในระบบก่อน`,
    );
  }

  // 3. Insert รายการ transaction (ไม่มี FK ไปยัง appointment/purchase_order แล้ว)
  await tx.insert(transactions).values({
    amount: input.amount.toFixed(2),
    transactionDate: input.transactionDate,
    note: input.note ?? null,
    transactionCategoryId: category.id,
  });
}
