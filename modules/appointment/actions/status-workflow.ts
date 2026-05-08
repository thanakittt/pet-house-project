import { db } from "@/db";
import { appointments } from "@/db/schema";
import { pushLineTextMessage } from "@/lib/line/messaging";
import { eq } from "drizzle-orm";
import type { AppointmentStatus } from "../types/status";

export const APPOINTMENT_NOT_FOUND_ERROR = "ไม่พบข้อมูลการจอง";

type AppointmentStatusTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

type LineNotifiableAppointmentStatus = Extract<
  AppointmentStatus,
  "CHECKED_IN" | "IN_PROGRESS" | "READY_FOR_PICKUP" | "COMPLETED"
>;

const LINE_NOTIFIABLE_APPOINTMENT_STATUSES: LineNotifiableAppointmentStatus[] = [
  "CHECKED_IN",
  "IN_PROGRESS",
  "READY_FOR_PICKUP",
  "COMPLETED",
];

const LINE_STATUS_LABELS: Record<LineNotifiableAppointmentStatus, string> = {
  CHECKED_IN: "รับฝากแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  READY_FOR_PICKUP: "พร้อมรับกลับ",
  COMPLETED: "เสร็จสมบูรณ์",
};

const LINE_STATUS_MESSAGES: Record<LineNotifiableAppointmentStatus, string> = {
  CHECKED_IN: "เราได้รับน้องเข้ารับบริการเรียบร้อยแล้ว ✅",
  IN_PROGRESS: "ทีมงานกำลังดูแลน้องตามรายการบริการ 📋",
  READY_FOR_PICKUP: "น้องพร้อมให้มารับกลับแล้ว 🚗",
  COMPLETED: "🎉 การนัดหมายเสร็จสมบูรณ์ ขอบคุณที่ใช้บริการ Pet House 🙏",
};

export type AppointmentStatusUpdateResult = {
  statusChanged: boolean;
  previousStatus: AppointmentStatus;
};

export async function updateAppointmentStatusInTransaction(
  tx: AppointmentStatusTransaction,
  appointmentId: string,
  newStatus: AppointmentStatus,
): Promise<AppointmentStatusUpdateResult> {
  const appointment = await tx.query.appointments.findFirst({
    columns: {
      id: true,
      status: true,
    },
    where: eq(appointments.id, appointmentId),
  });

  if (!appointment) {
    throw new Error(APPOINTMENT_NOT_FOUND_ERROR);
  }

  const previousStatus = appointment.status as AppointmentStatus;

  if (previousStatus === newStatus) {
    return {
      statusChanged: false,
      previousStatus,
    };
  }

  await tx
    .update(appointments)
    .set({ status: newStatus })
    .where(eq(appointments.id, appointmentId));

  return {
    statusChanged: true,
    previousStatus,
  };
}

export async function notifyCustomerAppointmentStatusChange(input: {
  appointmentId: string;
  newStatus: AppointmentStatus;
  statusChanged: boolean;
}) {
  try {
    if (!input.statusChanged || !isLineNotifiableStatus(input.newStatus)) {
      return;
    }

    const appointment = await db.query.appointments.findFirst({
      columns: {
        id: true,
        appointmentDate: true,
      },
      where: eq(appointments.id, input.appointmentId),
      with: {
        customer: {
          columns: {
            lineUserId: true,
          },
        },
        items: {
          with: {
            pet: {
              columns: {
                name: true,
              },
            },
            serviceVariant: {
              with: {
                service: {
                  columns: {
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const lineUserId = appointment?.customer.lineUserId;

    if (!appointment || !lineUserId) {
      return;
    }

    const message = buildAppointmentStatusLineMessage({
      appointmentDate: appointment.appointmentDate,
      petNames: appointment.items.map((item) => item.pet.name),
      serviceNames: appointment.items.map(
        (item) => item.serviceVariant.service.name,
      ),
      status: input.newStatus,
    });

    await pushLineTextMessage(lineUserId, message);
  } catch (error) {
    console.error("send appointment LINE notification failed:", error);
  }
}

function isLineNotifiableStatus(
  status: AppointmentStatus,
): status is LineNotifiableAppointmentStatus {
  return LINE_NOTIFIABLE_APPOINTMENT_STATUSES.includes(
    status as LineNotifiableAppointmentStatus,
  );
}

function buildAppointmentStatusLineMessage(input: {
  appointmentDate: string;
  petNames: string[];
  serviceNames: string[];
  status: LineNotifiableAppointmentStatus;
}) {
  const petSummary = summarizeUniqueValues(input.petNames);
  const serviceSummary = summarizeUniqueValues(input.serviceNames);

  return [
    `📌 สถานะนัดหมาย: ${LINE_STATUS_LABELS[input.status]}`,
    `📅 วันที่: ${formatThaiAppointmentDate(input.appointmentDate)}`,
    `🐾 สัตว์เลี้ยง: ${petSummary || "-"}`,
    `🛁 บริการ: ${serviceSummary || "-"}`,
    "",
    LINE_STATUS_MESSAGES[input.status],
  ].join("\n");
}

function summarizeUniqueValues(values: string[]) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  return uniqueValues.join(", ");
}

function formatThaiAppointmentDate(appointmentDate: string) {
  const date = new Date(`${appointmentDate}T00:00:00`);

  return new Intl.DateTimeFormat("th-TH", {
    dateStyle: "medium",
  }).format(date);
}
