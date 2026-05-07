import { db } from "@/db";
import {
  appointments,
  customers,
  payments,
  paymentSlipVerifications,
} from "@/db/schema";
import { requireOwner } from "@/lib/session";
import { ActionResponse } from "@/types/action";
import {
  and,
  count,
  desc,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
} from "drizzle-orm";
import type {
  PaymentSlipVerification,
  SlipVerificationStatus,
} from "../types/payment-slip-verification";

export const PAYMENT_SLIP_VERIFICATION_PAGE_SIZE = 10;

export const PAYMENT_SLIP_VERIFICATION_STATUS_FILTERS = [
  "ALL",
  "VERIFIED",
  "REJECTED",
  "ERROR",
] as const;

export type PaymentSlipVerificationStatusFilter =
  (typeof PAYMENT_SLIP_VERIFICATION_STATUS_FILTERS)[number];

export type ListPaymentSlipVerificationsParams = {
  page?: number;
  q?: string;
  status?: PaymentSlipVerificationStatusFilter;
};

export type ListPaymentSlipVerificationsResult = {
  verifications: PaymentSlipVerification[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  q: string;
  status: PaymentSlipVerificationStatusFilter;
};

export function parsePaymentSlipVerificationPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export function parsePaymentSlipVerificationStatusFilter(
  value: unknown,
): PaymentSlipVerificationStatusFilter {
  return typeof value === "string" &&
    PAYMENT_SLIP_VERIFICATION_STATUS_FILTERS.includes(
      value as PaymentSlipVerificationStatusFilter,
    )
    ? (value as PaymentSlipVerificationStatusFilter)
    : "ALL";
}

export async function listPaymentSlipVerifications({
  page = 1,
  q = "",
  status = "ALL",
}: ListPaymentSlipVerificationsParams = {}): Promise<
  ActionResponse<ListPaymentSlipVerificationsResult>
> {
  try {
    const session = await requireOwner({ redirect: false });

    if (!session) {
      return {
        success: false,
        error: "คุณไม่ได้รับอนุญาตให้ดูประวัติการตรวจสลิป",
      };
    }

    const search = q.trim();
    // Input: รับค่าจาก query string แล้วค่อย ๆ ประกอบ SQL filters ตามที่ผู้ใช้เลือก
    // Output ของ block นี้คือ where condition เดียวที่นำไปใช้ทั้ง count และ list query
    const filters: SQL[] = [isNull(paymentSlipVerifications.deletedAt)];

    if (status !== "ALL") {
      filters.push(eq(paymentSlipVerifications.status, status));
    }

    if (search) {
      filters.push(
        or(
          ilike(paymentSlipVerifications.transRef, `%${search}%`),
          ilike(paymentSlipVerifications.providerReference, `%${search}%`),
          ilike(paymentSlipVerifications.payerNameRedacted, `%${search}%`),
          ilike(customers.nickname, `%${search}%`),
        )!,
      );
    }

    const where = and(...filters);

    // นับจำนวนทั้งหมดก่อน เพื่อให้ pagination รู้ว่ามีกี่หน้า
    const [{ total }] = await db
      .select({ total: count() })
      .from(paymentSlipVerifications)
      .innerJoin(
        appointments,
        eq(paymentSlipVerifications.appointmentId, appointments.id),
      )
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(payments, eq(paymentSlipVerifications.paymentId, payments.id))
      .where(where);

    const totalPages = Math.ceil(total / PAYMENT_SLIP_VERIFICATION_PAGE_SIZE);
    // Clamp page ให้อยู่ในช่วงที่มีจริง ป้องกัน URL page เกินแล้วตารางว่างแบบสับสน
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(page, 1), totalPages) : 1;
    const offset =
      (currentPage - 1) * PAYMENT_SLIP_VERIFICATION_PAGE_SIZE;

    // Processing: join appointment/customer/payment เพื่อให้หน้า back-office เห็นข้อมูลที่อ่านง่าย
    const rows = await db
      .select({
        id: paymentSlipVerifications.id,
        appointmentId: paymentSlipVerifications.appointmentId,
        appointmentDate: appointments.appointmentDate,
        paymentId: paymentSlipVerifications.paymentId,
        provider: paymentSlipVerifications.provider,
        status: paymentSlipVerifications.status,
        slipImageUrl: paymentSlipVerifications.slipImageUrl,
        remark: paymentSlipVerifications.remark,
        transRef: paymentSlipVerifications.transRef,
        amountInSlip: paymentSlipVerifications.amountInSlip,
        amountInOrder: paymentSlipVerifications.amountInOrder,
        isAmountMatched: paymentSlipVerifications.isAmountMatched,
        isDuplicate: paymentSlipVerifications.isDuplicate,
        payerNameRedacted: paymentSlipVerifications.payerNameRedacted,
        payerAccountLast4: paymentSlipVerifications.payerAccountLast4,
        providerReference: paymentSlipVerifications.providerReference,
        providerErrorCode: paymentSlipVerifications.providerErrorCode,
        providerErrorMessage: paymentSlipVerifications.providerErrorMessage,
        redactedAt: paymentSlipVerifications.redactedAt,
        createdAt: paymentSlipVerifications.createdAt,
        customerName: customers.nickname,
        paymentStatus: payments.status,
        paymentType: payments.paymentType,
      })
      .from(paymentSlipVerifications)
      .innerJoin(
        appointments,
        eq(paymentSlipVerifications.appointmentId, appointments.id),
      )
      .innerJoin(customers, eq(appointments.customerId, customers.id))
      .leftJoin(payments, eq(paymentSlipVerifications.paymentId, payments.id))
      .where(where)
      .orderBy(desc(paymentSlipVerifications.createdAt))
      .limit(PAYMENT_SLIP_VERIFICATION_PAGE_SIZE)
      .offset(offset);

    return {
      success: true,
      data: {
        // Output: แปลง numeric/date string จากฐานข้อมูลให้เป็น number/Date สำหรับ component
        verifications: rows.map((row) => ({
          ...row,
          appointmentDate: new Date(row.appointmentDate),
          amountInSlip:
            row.amountInSlip === null ? null : Number(row.amountInSlip),
          amountInOrder:
            row.amountInOrder === null ? null : Number(row.amountInOrder),
          status: row.status as SlipVerificationStatus,
        })),
        total,
        page: currentPage,
        pageSize: PAYMENT_SLIP_VERIFICATION_PAGE_SIZE,
        totalPages,
        q: search,
        status,
      },
    };
  } catch (error) {
    console.error("listPaymentSlipVerifications error:", error);

    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงประวัติการตรวจสลิป",
    };
  }
}
