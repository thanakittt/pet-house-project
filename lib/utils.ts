import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const requiredEnv = (key: string) => {
  const value = process.env[key];
  if (!value) throw new Error(`ไม่ได้ตั้งค่า env: ${key}`);
  return value;
};
