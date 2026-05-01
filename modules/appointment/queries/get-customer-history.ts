import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireStaff } from "@/lib/session";
import { type ActionResponse } from "@/types/action";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import { type AppointmentStatus } from "../types/status";

export const CUSTOMER_APPOINTMENT_HISTORY_PAGE_SIZE = 10;

export type CustomerAppointmentHistory = {
  id: string;
  appointmentDate: Date;
  status: AppointmentStatus;
  items: {
    price: string;
    startTime: string;
    endTime: string;
    pet: {
      name: string;
    } | null;
    serviceVariant: {
      service: {
        name: string;
      };
    };
  }[];
};

export type CustomerAppointmentHistoryResult = {
  appointments: CustomerAppointmentHistory[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseCustomerAppointmentHistoryPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

export async function getCustomerAppointmentHistory(
  customerId: string,
  options: { page?: number } = {},
): Promise<ActionResponse<CustomerAppointmentHistoryResult>> {
  const session = await requireStaff({ redirect: false });

  if (!session) {
    return {
      success: false,
      error: "คุณไม่มีสิทธิ์เข้าถึงข้อมูลนี้",
    };
  }

  try {
    const where = and(
      eq(appointments.customerId, customerId),
      isNull(appointments.deletedAt),
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(appointments)
      .where(where);

    const totalPages = Math.ceil(
      total / CUSTOMER_APPOINTMENT_HISTORY_PAGE_SIZE,
    );
    const currentPage =
      totalPages > 0
        ? Math.min(Math.max(options.page ?? 1, 1), totalPages)
        : 1;
    const offset =
      (currentPage - 1) * CUSTOMER_APPOINTMENT_HISTORY_PAGE_SIZE;

    const history = await db.query.appointments.findMany({
      where,
      orderBy: [desc(appointments.appointmentDate)],
      limit: CUSTOMER_APPOINTMENT_HISTORY_PAGE_SIZE,
      offset,
      with: {
        items: {
          with: {
            pet: true,
            serviceVariant: {
              with: {
                service: true,
              },
            },
          },
        },
      },
    });

    const formattedHistory: CustomerAppointmentHistory[] = history.map((appointment) => ({
      ...appointment,
      items: appointment.items.map((item) => ({
        ...item,
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      })),
    }));

    return {
      success: true,
      data: {
        appointments: formattedHistory,
        total,
        page: currentPage,
        pageSize: CUSTOMER_APPOINTMENT_HISTORY_PAGE_SIZE,
        totalPages,
      },
    };
  } catch (error) {
    console.error("Error fetching appointment history:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงข้อมูลประวัติการจอง",
    };
  }
}
