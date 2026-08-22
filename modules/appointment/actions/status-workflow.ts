import { db } from "@/db";
import {
  appointments,
  lineAppointmentStatusTemplates,
  staffs,
} from "@/db/schema";
import { formatThaiDate } from "@/lib/utils";
import { pushLineTextMessage } from "@/lib/line/messaging";
import {
  DEFAULT_LINE_APPOINTMENT_STATUS_TEMPLATES,
  DEFAULT_LINE_STATUS_ACTIVE,
  LINE_STATUS_LABELS,
  isLineAppointmentStatusTemplateStatus,
  renderLineAppointmentStatusTemplate,
  type LineNotifiableAppointmentStatus,
} from "@/modules/line-oa/types/appointment-status-template";
import {
  DEFAULT_STAFF_LINE_CONFIRMED_TEMPLATE,
  DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE,
  STAFF_LINE_TEMPLATE_STATUS,
  renderStaffLineAppointmentStatusTemplate,
} from "@/modules/line-oa/types/staff-appointment-status-template";
import { and, eq, isNotNull } from "drizzle-orm";
import type { AppointmentStatus } from "../types/status";

export const APPOINTMENT_NOT_FOUND_ERROR = "ไม่พบข้อมูลการจอง";

type AppointmentStatusTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

export type AppointmentStatusUpdateResult = {
  statusChanged: boolean;
  previousStatus: AppointmentStatus;
};

type NotificationTemplateResult = {
  messageTemplate: string;
  isActive: boolean;
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
    if (
      !input.statusChanged ||
      !isLineAppointmentStatusTemplateStatus(input.newStatus)
    ) {
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

    const notificationTemplate = await getNotificationTemplate(input.newStatus);

    if (!notificationTemplate.isActive) {
      return;
    }

    const message = renderLineAppointmentStatusTemplate(
      notificationTemplate.messageTemplate,
      {
        appointmentDate: formatThaiAppointmentDate(
          appointment.appointmentDate,
        ),
        petNames:
          summarizeUniqueValues(appointment.items.map((item) => item.pet.name)) ||
          "-",
        serviceNames:
          summarizeUniqueValues(
            appointment.items.map((item) => item.serviceVariant.service.name),
          ) || "-",
        statusLabel: LINE_STATUS_LABELS[input.newStatus],
      },
    );

    await pushLineTextMessage(lineUserId, message);
  } catch (error) {
    console.error("send appointment LINE notification failed:", error);
  }
}

export async function notifyStaffConfirmedAppointment(input: {
  appointmentId: string;
  newStatus: AppointmentStatus;
  statusChanged: boolean;
}) {
  try {
    if (
      !input.statusChanged ||
      input.newStatus !== STAFF_LINE_TEMPLATE_STATUS
    ) {
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
            nickname: true,
            walkInPhoneNumber: true,
          },
          with: {
            user: {
              columns: {
                phoneNumber: true,
              },
            },
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

    if (!appointment) {
      return;
    }

    const staffRecipients = await db
      .select({
        lineUserId: staffs.lineUserId,
      })
      .from(staffs)
      .where(isNotNull(staffs.lineUserId));

    const lineUserIds = staffRecipients
      .map((staffRecipient) => staffRecipient.lineUserId)
      .filter((lineUserId): lineUserId is string => Boolean(lineUserId));

    if (lineUserIds.length === 0) {
      return;
    }

    const notificationTemplate =
      await getStaffConfirmedNotificationTemplate();

    if (!notificationTemplate.isActive) {
      return;
    }

    const message = renderStaffLineAppointmentStatusTemplate(
      notificationTemplate.messageTemplate,
      {
        appointmentDate: formatThaiAppointmentDate(
          appointment.appointmentDate,
        ),
        customerName: appointment.customer.nickname || "-",
        customerPhone:
          appointment.customer.walkInPhoneNumber ??
          appointment.customer.user?.phoneNumber ??
          "-",
        petNames:
          summarizeUniqueValues(appointment.items.map((item) => item.pet.name)) ||
          "-",
        serviceNames:
          summarizeUniqueValues(
            appointment.items.map((item) => item.serviceVariant.service.name),
          ) || "-",
      },
    );

    const results = await Promise.allSettled(
      lineUserIds.map((lineUserId) => pushLineTextMessage(lineUserId, message)),
    );

    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error("send staff confirmed LINE notification failed:", {
          lineUserId: lineUserIds[index],
          error: result.reason,
        });
      }
    });
  } catch (error) {
    console.error("send staff confirmed LINE notification failed:", error);
  }
}

async function getNotificationTemplate(
  status: LineNotifiableAppointmentStatus,
): Promise<NotificationTemplateResult> {
  const defaultTemplate: NotificationTemplateResult = {
    messageTemplate: DEFAULT_LINE_APPOINTMENT_STATUS_TEMPLATES[status],
    isActive: DEFAULT_LINE_STATUS_ACTIVE[status],
  };

  try {
    const [storedTemplate] = await db
      .select({
        messageTemplate: lineAppointmentStatusTemplates.messageTemplate,
        isActive: lineAppointmentStatusTemplates.isActive,
      })
      .from(lineAppointmentStatusTemplates)
      .where(
        and(
          eq(lineAppointmentStatusTemplates.type, "customer"),
          eq(lineAppointmentStatusTemplates.status, status),
        ),
      )
      .limit(1);

    if (!storedTemplate) {
      return defaultTemplate;
    }

    return storedTemplate;
  } catch (error) {
    console.error("getNotificationTemplate error:", error);

    // ถ้ายังไม่ได้ migrate ตาราง template ให้ยังส่งข้อความ default เดิมได้
    return defaultTemplate;
  }
}

async function getStaffConfirmedNotificationTemplate(): Promise<NotificationTemplateResult> {
  const defaultTemplate: NotificationTemplateResult = {
    messageTemplate: DEFAULT_STAFF_LINE_CONFIRMED_TEMPLATE,
    isActive: DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE,
  };

  try {
    const [storedTemplate] = await db
      .select({
        messageTemplate: lineAppointmentStatusTemplates.messageTemplate,
        isActive: lineAppointmentStatusTemplates.isActive,
      })
      .from(lineAppointmentStatusTemplates)
      .where(
        and(
          eq(lineAppointmentStatusTemplates.type, "staff"),
          eq(
            lineAppointmentStatusTemplates.status,
            STAFF_LINE_TEMPLATE_STATUS,
          ),
        ),
      )
      .limit(1);

    if (!storedTemplate) {
      return defaultTemplate;
    }

    return storedTemplate;
  } catch (error) {
    console.error("getStaffConfirmedNotificationTemplate error:", error);

    return defaultTemplate;
  }
}

function summarizeUniqueValues(values: string[]) {
  const uniqueValues = Array.from(new Set(values.filter(Boolean)));

  return uniqueValues.join(", ");
}

function formatThaiAppointmentDate(appointmentDate: string) {
  return formatThaiDate(appointmentDate);
}
