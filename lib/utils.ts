import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format } from "date-fns";
import { th } from "date-fns/locale";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function requiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`ไม่ได้ตั้งค่าตัวแปรสภาพแวดล้อม: ${key}`);
  }
  return value;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatPhoneNumber(
  value: string | null | undefined,
  fallback: string = "-",
): string {
  const phoneNumber = value?.trim();

  if (!phoneNumber) {
    return fallback;
  }

  if (!/^0[0-9]{9}$/.test(phoneNumber)) {
    return phoneNumber;
  }

  return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6)}`;
}

export function formatThaiDate(date: Date, formatStr: string = "d MMM yy"): string {
  return format(date, formatStr, { locale: th });
}
