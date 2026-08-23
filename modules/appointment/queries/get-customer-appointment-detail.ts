import { db } from "@/db";
import { appointments } from "@/db/schema";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import type { ActionResponse } from "@/types/action";
import { and, eq, isNull } from "drizzle-orm";
import type { AppointmentStatus } from "../types/status";

export type CustomerAppointmentDetail = {
  id: string;
  status: AppointmentStatus;
  date: string;
  startTime: string;
  endTime: string;
  note: string | null;
  total: number;
  pets: {
    petId: string;
    name: string;
    species: "DOG" | "CAT";
    breed: string;
    services: {
      id: string;
      name: string;
      size: string;
      price: number;
      startTime: string;
      endTime: string;
    }[];
    serviceImages: {
      id: string;
      imageUrl: string;
      type: "BEFORE" | "AFTER" | "ISSUE";
    }[];
    healthReports: {
      id: string;
      topic: string;
      description: string;
    }[];
  }[];
};

function getTimeBoundary(
  items: { startTime: Date; endTime: Date }[],
  boundary: "start" | "end",
) {
  if (items.length === 0) {
    return "";
  }

  const sortedItems = [...items].sort((first, second) => {
    const firstTime =
      boundary === "start" ? first.startTime.getTime() : first.endTime.getTime();
    const secondTime =
      boundary === "start"
        ? second.startTime.getTime()
        : second.endTime.getTime();

    return boundary === "start" ? firstTime - secondTime : secondTime - firstTime;
  });

  const selectedItem = sortedItems[0];

  return boundary === "start"
    ? selectedItem.startTime.toISOString()
    : selectedItem.endTime.toISOString();
}

export async function getCustomerAppointmentDetail(
  appointmentId: string,
): Promise<ActionResponse<CustomerAppointmentDetail | null>> {
  const session = await requireCustomer({ redirect: false });

  if (!session) {
    return {
      success: false,
      error: "กรุณาเข้าสู่ระบบก่อนดูรายละเอียดการนัดหมาย",
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
    // Ownership check lives in the same DB query as the id lookup. If a
    // customer opens someone else's appointment id, this simply returns null.
    const appointment = await db.query.appointments.findFirst({
      where: and(
        eq(appointments.id, appointmentId),
        eq(appointments.customerId, profile.data.customerId),
        isNull(appointments.deletedAt),
      ),
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
            serviceImages: true,
            healthReports: {
              where: (reports, { isNull }) => isNull(reports.deletedAt),
            },
          },
        },
      },
    });

    if (!appointment) {
      return {
        success: true,
        data: null,
      };
    }

    const petsMap = new Map<
      CustomerAppointmentDetail["pets"][number]["petId"],
      CustomerAppointmentDetail["pets"][number]
    >();
    let total = 0;

    for (const item of appointment.items) {
      total += Number(item.price);

      // Group service rows by pet so the UI can show each pet once with all of
      // its services, photos, and health reports underneath.
      if (!petsMap.has(item.petId)) {
        petsMap.set(item.petId, {
          petId: item.pet.id,
          name: item.pet.name,
          species: item.pet.breed.type,
          breed: item.pet.breed.name,
          services: [],
          serviceImages: [],
          healthReports: [],
        });
      }

      const pet = petsMap.get(item.petId);

      if (!pet) {
        continue;
      }

      pet.services.push({
        id: item.id,
        name: item.serviceVariant.service.name,
        size: item.serviceVariant.size,
        price: Number(item.price),
        startTime: item.startTime.toISOString(),
        endTime: item.endTime.toISOString(),
      });

      pet.serviceImages.push(
        ...item.serviceImages.map((image) => ({
          id: image.id,
          imageUrl: image.imageUrl,
          type: image.type,
        })),
      );

      pet.healthReports.push(
        ...item.healthReports.map((report) => ({
          id: report.id,
          topic: report.topic,
          description: report.description,
        })),
      );
    }

    return {
      success: true,
      data: {
        id: appointment.id,
        status: appointment.status as AppointmentStatus,
        date: appointment.appointmentDate,
        startTime: getTimeBoundary(appointment.items, "start"),
        endTime: getTimeBoundary(appointment.items, "end"),
        note: appointment.note,
        total,
        pets: Array.from(petsMap.values()),
      },
    };
  } catch (error) {
    console.error("getCustomerAppointmentDetail error:", error);
    return {
      success: false,
      error: "เกิดข้อผิดพลาดในการดึงรายละเอียดการนัดหมาย",
    };
  }
}
