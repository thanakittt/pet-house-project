export const MAX_LINE_TEXT_LENGTH = 5000;

export function sanitizeMulticastUserIds(
  targetUserIds: (string | null | undefined)[],
): string[] {
  return Array.from(
    new Set(
      targetUserIds
        .map((id) => id?.trim())
        .filter((id): id is string => Boolean(id)),
    ),
  );
}

export type MulticastValidationResult = {
  isValid: boolean;
  error?: string;
  sanitizedUserIds: string[];
};

export function validateMulticastInput(input: {
  text: string;
  targetUserIds: (string | null | undefined)[];
}): MulticastValidationResult {
  const text = input.text.trim();

  if (!text) {
    return {
      isValid: false,
      error: "กรุณากรอกข้อความที่ต้องการส่ง",
      sanitizedUserIds: [],
    };
  }

  if (text.length > MAX_LINE_TEXT_LENGTH) {
    return {
      isValid: false,
      error: "ข้อความต้องไม่เกิน 5,000 ตัวอักษร",
      sanitizedUserIds: [],
    };
  }

  const sanitizedUserIds = sanitizeMulticastUserIds(input.targetUserIds);

  if (sanitizedUserIds.length === 0) {
    return {
      isValid: false,
      error: "กรุณาเลือกลูกค้าอย่างน้อย 1 คนสำหรับส่งข้อความ Multicast",
      sanitizedUserIds: [],
    };
  }

  return {
    isValid: true,
    sanitizedUserIds,
  };
}

export function toggleItemInSet<T>(set: Set<T>, item: T): Set<T> {
  const next = new Set(set);
  if (next.has(item)) {
    next.delete(item);
  } else {
    next.add(item);
  }
  return next;
}

export function addItemsToSet<T>(set: Set<T>, items: T[]): Set<T> {
  const next = new Set(set);
  for (const item of items) {
    next.add(item);
  }
  return next;
}

export function removeItemsFromSet<T>(set: Set<T>, items: T[]): Set<T> {
  const next = new Set(set);
  for (const item of items) {
    next.delete(item);
  }
  return next;
}

