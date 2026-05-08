import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import type { ActionResponse } from "@/types/action";
import { and, count, desc, eq, isNull } from "drizzle-orm";
import type { AppointmentStatus } from "../types/status";

export const CUSTOMER_APPOINTMENTS_PAGE_SIZE = 5;

export type CustomerAppointmentListItem = {
  id: string;
  status: AppointmentStatus;
  date: string;
  time: string;
  petName: string;
  species: "DOG" | "CAT";
  breed: string;
  services: string;
  price: number;
  review: {
    rating: number;
    comment: string | null;
  } | null;
};

export type CustomerAppointmentsResult = {
  appointments: CustomerAppointmentListItem[];
  hasLineConnection: boolean;
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parseCustomerAppointmentsPage(value: unknown): number {
  const parsedValue =
    typeof value === "string" ? Number.parseInt(value, 10) : Number(value);

  return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 1;
}

function joinUniqueText(values: string[]) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  return uniqueValues.join(", ");
}

function getFirstServiceTime(
  items: { startTime: Date }[],
): string {
  const firstItem = [...items].sort(
    (first, second) => first.startTime.getTime() - second.startTime.getTime(),
  )[0];

  return firstItem ? firstItem.startTime.toISOString() : "";
}

export async function getCustomerAppointments(
  options: { page?: number } = {},
): Promise<
  ActionResponse<CustomerAppointmentsResult>
> {
  const session = await requireCustomer({ redirect: false });

  if (!session) {
    return {
      success: false,
      error: "กรุณาเข้าสู่ระบบก่อนดูประวัติการรับบริการ",
    };
  }

  const profile = await getCustomerProfile(session.user);

  if (!profile.success) {
    return profile;
  }

  if (!profile.data) {
    return {
      success: false,
      error: "ไม่พบโปรไฟล์ลูกค้า",
    };
  }

  try {
    // This customer-facing query must only return appointments owned by the
    // logged-in customer's profile, never by a customerId from the browser.
    const where = and(
      eq(appointments.customerId, profile.data.customerId),
      isNull(appointments.deletedAt),
    );

    const [{ total }] = await db
      .select({ total: count() })
      .from(appointments)
      .where(where);

    const totalPages = Math.ceil(total / CUSTOMER_APPOINTMENTS_PAGE_SIZE);
    const currentPage =
      totalPages > 0 ? Math.min(Math.max(options.page ?? 1, 1), totalPages) : 1;
    const offset = (currentPage - 1) * CUSTOMER_APPOINTMENTS_PAGE_SIZE;

    const customerAppointments = await db.query.appointments.findMany({
      where,
      orderBy: [desc(appointments.appointmentDate), desc(appointments.id)],
      limit: CUSTOMER_APPOINTMENTS_PAGE_SIZE,
      offset,
      with: {
        items: {
          orderBy: (items, { asc }) => [asc(items.startTime)],
          with: {
            pet: {
              with: {
                breed: true,
              },
            },
            serviceVariant: {
              with: {
                service: true,
              },
            },
          },
        },
        review: true,
      },
    });

    const formattedAppointments = customerAppointments.map((appointment) => {
      const firstItem = appointment.items[0];
      // One appointment can contain many pets/services, so the list card shows
      // a compact summary while the detail page keeps the full breakdown.
      const totalPrice = appointment.items.reduce(
        (total, item) => total + Number(item.price),
        0,
      );

      return {
        id: appointment.id,
        status: appointment.status as AppointmentStatus,
        date: appointment.appointmentDate,
        time: getFirstServiceTime(appointment.items),
        petName: joinUniqueText(appointment.items.map((item) => item.pet.name)),
        species: firstItem?.pet.breed.type ?? "DOG",
        breed: joinUniqueText(
          appointment.items.map((item) => item.pet.breed.name),
        ),
        services: joinUniqueText(
          appointment.items.map((item) => item.serviceVariant.service.name),
        ),
        price: totalPrice,
        review: appointment.review
          ? {
              rating: appointment.review.rating,
              comment: appointment.review.comment,
            }
          : null,
      };
    });

    return {
      success: true,
      data: {
        appointments: formattedAppointments,
        hasLineConnection: profile.data.hasLineConnection,
        total,
        page: currentPage,
        pageSize: CUSTOMER_APPOINTMENTS_PAGE_SIZE,
        totalPages,
      },
    };
  } catch (error) {
    console.error("getCustomerAppointments error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงประวัติการรับบริการ",
    };
  }
}
