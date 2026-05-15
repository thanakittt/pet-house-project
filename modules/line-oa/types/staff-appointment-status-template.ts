import type { AppointmentStatus } from "@/modules/appointment/types/status";

export const STAFF_LINE_TEMPLATE_STATUS = "CONFIRMED" satisfies AppointmentStatus;

export const STAFF_LINE_TEMPLATE_PLACEHOLDERS = [
  "appointmentDate",
  "customerName",
  "customerPhone",
  "petNames",
  "serviceNames",
] as const;

export type StaffLineTemplatePlaceholder =
  (typeof STAFF_LINE_TEMPLATE_PLACEHOLDERS)[number];

export type StaffLineTemplateRenderData = Record<
  StaffLineTemplatePlaceholder,
  string
>;

export type StaffLineAppointmentStatusTemplateView = {
  id: string | null;
  status: typeof STAFF_LINE_TEMPLATE_STATUS;
  label: string;
  description: string;
  messageTemplate: string;
  defaultMessageTemplate: string;
  isActive: boolean;
  isDefault: boolean;
};

type ValidationResult =
  | {
      success: true;
      messageTemplate: string;
    }
  | {
      success: false;
      error: string;
    };

export const DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE = true;

export const STAFF_LINE_TEMPLATE_LABEL = "แจ้งพนักงานเมื่อนัดหมายยืนยันแล้ว";

export const STAFF_LINE_TEMPLATE_DESCRIPTION =
  "ส่งให้ staff ทุกคนที่เชื่อมต่อ LINE เมื่อ appointment เปลี่ยนเป็น CONFIRMED";

export const STAFF_LINE_TEMPLATE_SAMPLE_DATA: StaffLineTemplateRenderData = {
  appointmentDate: "9 พ.ค. 2569",
  customerName: "คุณมะลิ",
  customerPhone: "0812345678",
  petNames: "Milo, Lucky",
  serviceNames: "อาบน้ำ, ตัดขน",
};

export const DEFAULT_STAFF_LINE_CONFIRMED_TEMPLATE = [
  "มีนัดหมายใหม่ที่ยืนยันแล้ว",
  "วันที่: {appointmentDate}",
  "ลูกค้า: {customerName}",
  "เบอร์โทร: {customerPhone}",
  "สัตว์เลี้ยง: {petNames}",
  "บริการ: {serviceNames}",
  "",
  "กรุณาเตรียมความพร้อมสำหรับการให้บริการ",
].join("\n");

export function getDefaultStaffLineTemplateView(): StaffLineAppointmentStatusTemplateView {
  return {
    id: null,
    status: STAFF_LINE_TEMPLATE_STATUS,
    label: STAFF_LINE_TEMPLATE_LABEL,
    description: STAFF_LINE_TEMPLATE_DESCRIPTION,
    messageTemplate: DEFAULT_STAFF_LINE_CONFIRMED_TEMPLATE,
    defaultMessageTemplate: DEFAULT_STAFF_LINE_CONFIRMED_TEMPLATE,
    isActive: DEFAULT_STAFF_LINE_TEMPLATE_ACTIVE,
    isDefault: true,
  };
}

export function validateStaffLineTemplateInput(
  messageTemplate: string,
): ValidationResult {
  const normalizedTemplate = messageTemplate.trim();

  if (!normalizedTemplate) {
    return {
      success: false,
      error: "กรุณากรอกข้อความ template",
    };
  }

  if (normalizedTemplate.length > 5000) {
    return {
      success: false,
      error: "ข้อความ template ต้องไม่เกิน 5,000 ตัวอักษร",
    };
  }

  const unknownPlaceholders = findUnknownStaffLinePlaceholders(
    normalizedTemplate,
  );

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

export function renderStaffLineAppointmentStatusTemplate(
  messageTemplate: string,
  data: StaffLineTemplateRenderData,
) {
  return STAFF_LINE_TEMPLATE_PLACEHOLDERS.reduce((message, placeholder) => {
    return message.replaceAll(`{${placeholder}}`, data[placeholder] || "-");
  }, messageTemplate);
}

function findUnknownStaffLinePlaceholders(messageTemplate: string) {
  const matches = messageTemplate.matchAll(/\{([a-zA-Z0-9_]+)\}/g);
  const allowedPlaceholders = new Set<string>(
    STAFF_LINE_TEMPLATE_PLACEHOLDERS,
  );
  const unknownPlaceholders = new Set<string>();

  for (const match of matches) {
    const placeholder = match[1];

    if (!allowedPlaceholders.has(placeholder)) {
      unknownPlaceholders.add(`{${placeholder}}`);
    }
  }

  return Array.from(unknownPlaceholders);
}
