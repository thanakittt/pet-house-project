import { format, isAfter, isBefore, isValid, parseISO } from "date-fns";

export const ANNOUNCEMENT_TYPES = ["NEWS", "PROMOTION", "ALERT"] as const;

export type AnnouncementType = (typeof ANNOUNCEMENT_TYPES)[number];

export type AnnouncementForm = {
  title: string;
  content: string;
  type: AnnouncementType;
  startDisplayAt: string;
  endDisplayAt: string;
  isActive: boolean;
};

export type Announcement = {
  id: string;
  title: string;
  content: string;
  imageUrl: string | null;
  type: AnnouncementType;
  startDisplayAt: Date;
  endDisplayAt: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type AnnouncementStatus =
  | "ACTIVE"
  | "SCHEDULED"
  | "EXPIRED"
  | "INACTIVE";

type NormalizedAnnouncementInput =
  | {
      success: true;
      data: {
        title: string;
        content: string;
        type: AnnouncementType;
        startDisplayAt: Date;
        endDisplayAt: Date | null;
        isActive: boolean;
      };
    }
  | {
      success: false;
      error: string;
    };

export const ANNOUNCEMENT_TYPE_LABELS: Record<AnnouncementType, string> = {
  NEWS: "ข่าวสาร",
  PROMOTION: "โปรโมชัน",
  ALERT: "แจ้งเตือน",
};

export const ANNOUNCEMENT_STATUS_LABELS: Record<AnnouncementStatus, string> = {
  ACTIVE: "กำลังแสดง",
  SCHEDULED: "รอแสดง",
  EXPIRED: "หมดเวลา",
  INACTIVE: "ปิดใช้งาน",
};

export function getAnnouncementStatus(
  announcement: Pick<
    Announcement,
    "endDisplayAt" | "isActive" | "startDisplayAt"
  >,
): AnnouncementStatus {
  const now = new Date();

  // สถานะของประกาศไม่ได้เก็บเป็น column แยก แต่คำนวณจาก isActive และช่วงเวลาแสดงผล
  if (!announcement.isActive) {
    return "INACTIVE";
  }

  if (isAfter(announcement.startDisplayAt, now)) {
    return "SCHEDULED";
  }

  if (announcement.endDisplayAt && isBefore(announcement.endDisplayAt, now)) {
    return "EXPIRED";
  }

  return "ACTIVE";
}

export function normalizeAnnouncementInput(
  data: AnnouncementForm,
): NormalizedAnnouncementInput {
  const title = data.title.trim();
  const content = data.content.trim();
  const startDisplayAt = parseISO(data.startDisplayAt);
  const endDisplayAt = data.endDisplayAt ? parseISO(data.endDisplayAt) : null;

  if (!title) {
    return { success: false, error: "กรุณาระบุหัวข้อประกาศ" };
  }

  if (!content) {
    return { success: false, error: "กรุณาระบุเนื้อหาประกาศ" };
  }

  if (!ANNOUNCEMENT_TYPES.includes(data.type)) {
    return { success: false, error: "ประเภทประกาศไม่ถูกต้อง" };
  }

  // input type datetime-local จะส่ง string กลับมา จึงต้องแปลงและเช็กว่าเป็นวันที่จริงก่อนบันทึก
  if (!isValid(startDisplayAt)) {
    return { success: false, error: "วันเริ่มแสดงประกาศไม่ถูกต้อง" };
  }

  if (endDisplayAt && !isValid(endDisplayAt)) {
    return { success: false, error: "วันสิ้นสุดประกาศไม่ถูกต้อง" };
  }

  if (endDisplayAt && !isAfter(endDisplayAt, startDisplayAt)) {
    return {
      success: false,
      error: "วันสิ้นสุดประกาศต้องมากกว่าวันเริ่มแสดง",
    };
  }

  return {
    success: true,
    data: {
      title,
      content,
      type: data.type,
      startDisplayAt,
      endDisplayAt,
      isActive: data.isActive,
    },
  };
}

export function toDateTimeLocalValue(date: Date | null): string {
  if (!date) {
    return "";
  }

  return format(date, "yyyy-MM-dd'T'HH:mm");
}

export function announcementFormFromFormData(
  formData: FormData,
): AnnouncementForm {
  return {
    title: String(formData.get("title") ?? ""),
    content: String(formData.get("content") ?? ""),
    type: String(formData.get("type") ?? "") as AnnouncementType,
    startDisplayAt: String(formData.get("startDisplayAt") ?? ""),
    endDisplayAt: String(formData.get("endDisplayAt") ?? ""),
    isActive: formData.get("isActive") === "true",
  };
}

export function announcementFormToFormData(data: AnnouncementForm): FormData {
  const formData = new FormData();

  formData.set("title", data.title);
  formData.set("content", data.content);
  formData.set("type", data.type);
  formData.set("startDisplayAt", data.startDisplayAt);
  formData.set("endDisplayAt", data.endDisplayAt);
  formData.set("isActive", String(data.isActive));

  return formData;
}
