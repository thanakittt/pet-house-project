// ===================================================
// dashboard.ts — Type Definitions สำหรับ Dashboard
// ===================================================

// ช่วงเวลาที่ใช้ filter ข้อมูล Dashboard
export type DashboardPeriod = "DAILY" | "MONTHLY" | "YEARLY";

// ===================================================
// 💰 ยอดขาย (Sales)
// ===================================================

// สรุปยอดขายจาก payments ที่มีสถานะ PAID
export type SalesSummary = {
  /** ยอดขายรวมใน period ปัจจุบัน (บาท) */
  totalRevenue: number;
  /** จำนวนรายการชำระเงิน */
  transactionCount: number;
  /** ยอดขายรวมใน period ก่อนหน้า (สำหรับคำนวณ % เปลี่ยนแปลง) */
  previousRevenue: number;
  /** % เปลี่ยนแปลงจาก period ก่อน (บวก = เพิ่ม, ลบ = ลด) */
  changePercent: number;
};

// ===================================================
// 📅 การจองคิว (Appointments)
// ===================================================

// สรุปจำนวนการจองคิวแยกตาม status
export type AppointmentSummary = {
  /** จำนวนทั้งหมด */
  total: number;
  /** กำลังดำเนินการ/ยืนยันแล้ว */
  active: number;
  /** เสร็จสิ้นแล้ว */
  completed: number;
  /** ยกเลิก + ไม่มาตามนัด */
  cancelled: number;
};

// ===================================================
// 🏆 บริการยอดนิยม (Popular Services)
// ===================================================

// ข้อมูลบริการแต่ละรายการในอันดับ
export type PopularService = {
  /** ชื่อบริการหลัก */
  serviceName: string;
  /** จำนวนครั้งที่ถูกใช้งาน */
  count: number;
  /** รายได้รวมจากบริการนี้ (บาท) */
  revenue: number;
};

// ===================================================
// ⭐ รีวิวลูกค้า (Reviews)
// ===================================================

// สรุปรีวิวทั้งหมด
export type ReviewSummary = {
  /** คะแนนเฉลี่ย (1.0 - 5.0) */
  averageRating: number;
  /** จำนวนรีวิวทั้งหมด */
  totalReviews: number;
  /** การกระจายตัวของคะแนน (key = 1-5) */
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
  /** รีวิวล่าสุด 5 รายการ */
  recentReviews: RecentReview[];
};

// ข้อมูลรีวิวแต่ละรายการสำหรับแสดงในหน้า Dashboard
export type RecentReview = {
  id: string;
  rating: number;
  comment: string | null;
  /** ชื่อลูกค้า */
  customerName: string;
  /** วันที่เขียนรีวิว (จาก reviews.createdAt) */
  reviewedAt: Date;
};

// ===================================================
// 📊 Chart รายรับ-รายจ่าย (Finance Chart)
// ===================================================

// จุดข้อมูลใน chart แต่ละจุด
export type FinanceChartPoint = {
  /** label แกน X (เช่น "08:00", "01 เม.ย.", "ม.ค.") */
  label: string;
  /** รายรับรวม (บาท) */
  income: number;
  /** รายจ่ายรวม (บาท) */
  expense: number;
};

// ข้อมูล chart พร้อม summary
export type FinanceChartData = {
  /** จุดข้อมูลทั้งหมด */
  points: FinanceChartPoint[];
  /** ยอดรายรับรวมทั้ง period */
  totalIncome: number;
  /** ยอดรายจ่ายรวมทั้ง period */
  totalExpense: number;
  /** กำไร/ขาดทุน (income - expense) */
  netProfit: number;
};
