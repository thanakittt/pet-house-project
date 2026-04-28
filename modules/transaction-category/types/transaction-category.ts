// ประเภทข้อมูลฟอร์มสำหรับสร้าง/แก้ไขหมวดหมู่ธุรกรรม
export type TransactionCategoryForm = {
  name: string;
  type: "EXPENSE" | "INCOME";
};

// ประเภทข้อมูลหมวดหมู่ธุรกรรมที่ใช้แสดงผล
export type TransactionCategory = {
  id: string;
  name: string;
  type: "EXPENSE" | "INCOME";
};

// Map ค่า enum ไปยังข้อความภาษาไทยสำหรับแสดงผล
export const TRANSACTION_TYPE_LABELS: Record<
  TransactionCategory["type"],
  string
> = {
  EXPENSE: "รายจ่าย",
  INCOME: "รายรับ",
};
