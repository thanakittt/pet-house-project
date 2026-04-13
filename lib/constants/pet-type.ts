export const PET_TYPE_OPTIONS = [
  { value: "DOG", label: "หมา" },
  { value: "CAT", label: "แมว" },
] as const;

export const PET_TYPE_LABELS: Record<string, string> = {
  DOG: "หมา",
  CAT: "แมว",
};
