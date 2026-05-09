import type { AppointmentStatus } from "@/modules/appointment/types/status";

export const MAX_LINE_TEMPLATE_LENGTH = 5000;

export const LINE_TEMPLATE_PLACEHOLDERS = [
  "statusLabel",
  "appointmentDate",
  "petNames",
  "serviceNames",
] as const;

export type LineTemplatePlaceholder =
  (typeof LINE_TEMPLATE_PLACEHOLDERS)[number];

export type LineNotifiableAppointmentStatus = AppointmentStatus;

export type LineAppointmentStatusTemplateView = {
  id: string | null;
  status: LineNotifiableAppointmentStatus;
  label: string;
  description: string;
  messageTemplate: string;
  defaultMessageTemplate: string;
  isActive: boolean;
  isDefault: boolean;
};

export type LineTemplateRenderData = Record<LineTemplatePlaceholder, string>;

type ValidationResult =
  | {
      success: true;
      messageTemplate: string;
    }
  | {
      success: false;
      error: string;
    };

export const LINE_NOTIFIABLE_APPOINTMENT_STATUSES: LineNotifiableAppointmentStatus[] =
  [
    "PENDING_DEPOSIT",
    "PENDING_APPROVAL",
    "CONFIRMED",
    "CHECKED_IN",
    "IN_PROGRESS",
    "READY_FOR_PICKUP",
    "COMPLETED",
    "CANCELLED",
    "NO_SHOW",
  ];

export const LINE_STATUS_LABELS: Record<
  LineNotifiableAppointmentStatus,
  string
> = {
  PENDING_DEPOSIT: "รอชำระมัดจำ",
  PENDING_APPROVAL: "รอตรวจสอบการจอง",
  CONFIRMED: "ยืนยันการจองแล้ว",
  CHECKED_IN: "รับฝากแล้ว",
  IN_PROGRESS: "กำลังดำเนินการ",
  READY_FOR_PICKUP: "พร้อมรับกลับ",
  COMPLETED: "เสร็จสมบูรณ์",
  CANCELLED: "ยกเลิกการจอง",
  NO_SHOW: "ไม่มาตามนัด",
};

export const LINE_STATUS_DESCRIPTIONS: Record<
  LineNotifiableAppointmentStatus,
  string
> = {
  PENDING_DEPOSIT: "แจ้งลูกค้าเมื่อการจองถูกสร้างและรอชำระเงินมัดจำ",
  PENDING_APPROVAL: "แจ้งลูกค้าเมื่อร้านได้รับข้อมูลและกำลังตรวจสอบการจอง",
  CONFIRMED: "แจ้งลูกค้าเมื่อร้านยืนยันนัดหมายเรียบร้อยแล้ว",
  CHECKED_IN: "แจ้งลูกค้าเมื่อพนักงานรับสัตว์เลี้ยงเข้ารับบริการแล้ว",
  IN_PROGRESS: "แจ้งลูกค้าเมื่อทีมงานเริ่มให้บริการตามรายการนัดหมาย",
  READY_FOR_PICKUP: "แจ้งลูกค้าเมื่อสัตว์เลี้ยงพร้อมให้มารับกลับ",
  COMPLETED: "แจ้งลูกค้าเมื่อรายการนัดหมายจบสมบูรณ์",
  CANCELLED: "แจ้งลูกค้าเมื่อการจองถูกยกเลิก",
  NO_SHOW: "แจ้งลูกค้าเมื่อเลยเวลานัดหมายและไม่ได้เข้ารับบริการ",
};

export const DEFAULT_LINE_STATUS_MESSAGES: Record<
  LineNotifiableAppointmentStatus,
  string
> = {
  PENDING_DEPOSIT:
    "กรุณาชำระเงินมัดจำเพื่อยืนยันคิวนัดหมาย ทีมงานจะตรวจสอบและแจ้งผลให้ทราบอีกครั้ง",
  PENDING_APPROVAL:
    "เราได้รับข้อมูลการจองแล้ว ทีมงานกำลังตรวจสอบรายละเอียดและจะแจ้งผลยืนยันเร็ว ๆ นี้",
  CONFIRMED:
    "นัดหมายของคุณได้รับการยืนยันแล้ว กรุณาพาน้องมาตามวันเวลาที่นัดหมาย ขอบคุณค่ะ",
  CHECKED_IN:
    "เราได้รับน้องเข้ารับบริการเรียบร้อยแล้ว ✅",
  IN_PROGRESS: "ทีมงานกำลังดูแลน้องตามรายการบริการ 📋",
  READY_FOR_PICKUP: "น้องพร้อมให้มารับกลับแล้ว 🚗",
  COMPLETED:
    "🎉 การนัดหมายเสร็จสมบูรณ์ ขอบคุณที่ใช้บริการ Pet House 🙏",
  CANCELLED:
    "การจองนี้ถูกยกเลิกแล้ว หากต้องการนัดหมายใหม่สามารถติดต่อร้านได้ทุกเมื่อ",
  NO_SHOW:
    "ระบบบันทึกว่าคุณไม่ได้เข้ารับบริการตามเวลานัด หากต้องการจองใหม่กรุณาติดต่อร้านอีกครั้ง",
};

export const DEFAULT_LINE_STATUS_ACTIVE: Record<
  LineNotifiableAppointmentStatus,
  boolean
> = {
  PENDING_DEPOSIT: false,
  PENDING_APPROVAL: false,
  CONFIRMED: false,
  CHECKED_IN: true,
  IN_PROGRESS: true,
  READY_FOR_PICKUP: true,
  COMPLETED: true,
  CANCELLED: false,
  NO_SHOW: false,
};

export const DEFAULT_LINE_APPOINTMENT_STATUS_TEMPLATES: Record<
  LineNotifiableAppointmentStatus,
  string
> = {
  PENDING_DEPOSIT: buildDefaultLineTemplate("PENDING_DEPOSIT"),
  PENDING_APPROVAL: buildDefaultLineTemplate("PENDING_APPROVAL"),
  CONFIRMED: buildDefaultLineTemplate("CONFIRMED"),
  CHECKED_IN: buildDefaultLineTemplate("CHECKED_IN"),
  IN_PROGRESS: buildDefaultLineTemplate("IN_PROGRESS"),
  READY_FOR_PICKUP: buildDefaultLineTemplate("READY_FOR_PICKUP"),
  COMPLETED: buildDefaultLineTemplate("COMPLETED"),
  CANCELLED: buildDefaultLineTemplate("CANCELLED"),
  NO_SHOW: buildDefaultLineTemplate("NO_SHOW"),
};

export const LINE_TEMPLATE_SAMPLE_DATA: LineTemplateRenderData = {
  statusLabel: "พร้อมรับกลับ",
  appointmentDate: "9 พ.ค. 2569",
  petNames: "Milo, Lucky",
  serviceNames: "อาบน้ำ, ตัดขน",
};

export function isLineAppointmentStatusTemplateStatus(
  status: AppointmentStatus,
): status is LineNotifiableAppointmentStatus {
  return LINE_NOTIFIABLE_APPOINTMENT_STATUSES.includes(
    status as LineNotifiableAppointmentStatus,
  );
}

export function getDefaultLineTemplateView(
  status: LineNotifiableAppointmentStatus,
): LineAppointmentStatusTemplateView {
  return {
    id: null,
    status,
    label: LINE_STATUS_LABELS[status],
    description: LINE_STATUS_DESCRIPTIONS[status],
    messageTemplate: DEFAULT_LINE_APPOINTMENT_STATUS_TEMPLATES[status],
    defaultMessageTemplate: DEFAULT_LINE_APPOINTMENT_STATUS_TEMPLATES[status],
    isActive: DEFAULT_LINE_STATUS_ACTIVE[status],
    isDefault: true,
  };
}

export function validateLineTemplateInput(
  messageTemplate: string,
): ValidationResult {
  const normalizedTemplate = messageTemplate.trim();

  if (!normalizedTemplate) {
    return {
      success: false,
      error: "กรุณากรอกข้อความ template",
    };
  }

  if (normalizedTemplate.length > MAX_LINE_TEMPLATE_LENGTH) {
    return {
      success: false,
      error: "ข้อความ template ต้องไม่เกิน 5,000 ตัวอักษร",
    };
  }

  const unknownPlaceholders = findUnknownPlaceholders(normalizedTemplate);

  if (unknownPlaceholders.length > 0) {
    return {
      success: false,
      error: `ไม่รองรับ placeholder: ${unknownPlaceholders.join(", ")}`,
    };
  }

  return {
    success: true,
    messageTemplate: normalizedTemplate,
  };
}

export function renderLineAppointmentStatusTemplate(
  messageTemplate: string,
  data: LineTemplateRenderData,
) {
  return LINE_TEMPLATE_PLACEHOLDERS.reduce((message, placeholder) => {
    return message.replaceAll(`{${placeholder}}`, data[placeholder] || "-");
  }, messageTemplate);
}

function buildDefaultLineTemplate(status: LineNotifiableAppointmentStatus) {
  return [
    "📌 สถานะนัดหมาย: {statusLabel}",
    "📅 วันที่: {appointmentDate}",
    "🐾 สัตว์เลี้ยง: {petNames}",
    "🛁 บริการ: {serviceNames}",
    "",
    DEFAULT_LINE_STATUS_MESSAGES[status],
  ].join("\n");
}

function findUnknownPlaceholders(messageTemplate: string) {
  const matches = messageTemplate.matchAll(/\{([a-zA-Z0-9_]+)\}/g);
  const allowedPlaceholders = new Set<string>(LINE_TEMPLATE_PLACEHOLDERS);
  const unknownPlaceholders = new Set<string>();

  for (const match of matches) {
    const placeholder = match[1];

    if (!allowedPlaceholders.has(placeholder)) {
      unknownPlaceholders.add(`{${placeholder}}`);
    }
  }

  return Array.from(unknownPlaceholders);
}
