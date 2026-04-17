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
