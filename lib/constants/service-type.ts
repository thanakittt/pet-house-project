export const SERVICE_TYPE_OPTIONS = [
  { value: "MAIN", label: "บริการหลัก" },
  { value: "ADDON", label: "บริการเสริม" },
] as const;

export const SERVICE_TYPE_LABELS: Record<string, string> = {
  MAIN: "หลัก",
  ADDON: "เสริม",
};

export const PET_SIZE_OPTIONS = [
  { value: "S", label: "เล็ก (S)" },
  { value: "M", label: "กลาง (M)" },
  { value: "L", label: "ใหญ่ (L)" },
  { value: "ALL", label: "ทุกขนาด" },
] as const;

export const PET_SIZE_LABELS: Record<string, string> = {
  S: "เล็ก",
  M: "กลาง",
  L: "ใหญ่",
  ALL: "ทุกขนาด",
};
