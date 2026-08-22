export const INVENTORY_UNITS = [
  { label: "ชิ้น", value: "PIECE" },
  { label: "กล่อง", value: "BOX" },
  { label: "แพ็ค", value: "PACK" },
  { label: "แกลลอน", value: "GALLON" },
  { label: "ขวด", value: "BOTTLE" },
] as const;

export const UNIT_LABEL_MAP: Record<string, string> = INVENTORY_UNITS.reduce(
  (acc, unit) => {
    acc[unit.value] = unit.label;
    return acc;
  },
  {} as Record<string, string>
);
