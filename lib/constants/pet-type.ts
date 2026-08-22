export const PET_TYPE_OPTIONS = [
  { value: "DOG", label: "สุนัข" },
  { value: "CAT", label: "แมว" },
] as const;

export const PET_TYPE_LABELS: Record<string, string> = {
  DOG: "สุนัข",
  CAT: "แมว",
};
