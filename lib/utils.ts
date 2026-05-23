import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, isValid, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { formatInTimeZone } from "date-fns-tz";
import { APP_TIME_ZONE } from "./finance/date";

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

type ThaiDateInput = Date | string | null | undefined;

/**
 * ใช้สำหรับ format วันที่เป็นรูปแบบภาษาไทย
 *
 * รองรับค่า:
 * - Date
 * - string
 * - null
 * - undefined
 *
 * ฟังก์ชันนี้จะ:
 * - parse วันที่ให้ปลอดภัย
 * - รองรับวันที่จาก database แบบ `YYYY-MM-DD`
 * - ป้องกันปัญหา timezone ของ JavaScript
 * - คืนค่า fallback หากวันที่ไม่ถูกต้อง
 *
 * ตัวอย่าง:
 * formatThaiDate("2026-05-14")
 * // "14 พ.ค. 2026"
 *
 * formatThaiDate(new Date())
 * // "14 พ.ค. 2026"
 *
 * formatThaiDate(null)
 * // "-"
 *
 * @param value วันที่ที่ต้องการ format
 * @param fallback ข้อความที่จะแสดงเมื่อวันที่ไม่ถูกต้อง
 * @returns วันที่ในรูปแบบภาษาไทย
 */
export function formatThaiDate(
  value: ThaiDateInput,
  fallback: string = "-",
): string {
  return formatThaiDateValue(value, "d MMM yyyy", fallback);
}

/**
 * ใช้สำหรับ format วันที่ + เวลา เป็นรูปแบบภาษาไทย
 *
 * เหมาะกับ:
 * - วันนัดหมาย
 * - เวลาสร้างข้อมูล
 * - เวลาชำระเงิน
 * - activity log
 *
 * รูปแบบผลลัพธ์:
 * "14 พ.ค. 2026 18:30"
 *
 * ตัวอย่าง:
 * formatThaiDateTime("2026-05-14T18:30:00")
 * // "14 พ.ค. 2026 18:30"
 *
 * formatThaiDateTime(undefined)
 * // "-"
 *
 * @param value วันที่/เวลาที่ต้องการ format
 * @param fallback ข้อความ fallback เมื่อ parse ไม่สำเร็จ
 * @returns วันที่และเวลาในรูปแบบภาษาไทย
 */
export function formatThaiDateTime(
  value: ThaiDateInput,
  fallback: string = "-",
): string {
  return formatThaiDateValue(value, "d MMM yyyy HH:mm", fallback);
}

/**
 * ใช้สำหรับแสดงวันที่แบบสั้น
 *
 * เหมาะกับ:
 * - card
 * - table
 * - mobile UI
 * - dashboard
 *
 * รูปแบบผลลัพธ์:
 * "14 พ.ค."
 *
 * ตัวอย่าง:
 * formatThaiCompactDate("2026-05-14")
 * // "14 พ.ค."
 *
 * @param value วันที่ที่ต้องการ format
 * @param fallback ข้อความ fallback เมื่อวันที่ไม่ถูกต้อง
 * @returns วันที่แบบย่อภาษาไทย
 */
export function formatThaiCompactDate(
  value: ThaiDateInput,
  fallback: string = "-",
): string {
  return formatThaiDateValue(value, "d MMM", fallback);
}

function formatThaiDateValue(
  value: ThaiDateInput,
  pattern: string,
  fallback: string,
): string {
  const date = getDisplayDate(value);

  if (!date) {
    return fallback;
  }

  if (typeof value === "string" && isDateOnlyString(value.trim())) {
    return format(date, pattern, { locale: th });
  }

  return formatInTimeZone(date, APP_TIME_ZONE, pattern, { locale: th });
}

/**
 * ใช้ parse วันที่ให้ปลอดภัยก่อนนำไปแสดงผล
 *
 * จุดเด่น:
 * - รองรับทั้ง Date และ string
 * - รองรับค่า null/undefined
 * - ป้องกัน invalid date
 * - รองรับวันที่จาก database แบบ `YYYY-MM-DD`
 * - ลดปัญหา timezone shift ของ JavaScript
 *
 * ตัวอย่างปัญหา:
 * JavaScript อาจตีความ:
 * "2026-05-14"
 * เป็น UTC ทำให้วันแสดงผลคลาดเคลื่อน
 *
 * ฟังก์ชันนี้จึงแปลงเป็น:
 * "2026-05-14T00:00:00"
 * ก่อน parse
 *
 * @param value วันที่ที่ต้องการ parse
 * @returns Date object หรือ null หาก parse ไม่สำเร็จ
 */
function getDisplayDate(value: ThaiDateInput): Date | null {
  if (!value) {
    return null;
  }

  if (value instanceof Date) {
    return isValid(value) ? value : null;
  }

  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return null;
  }

  // วันที่แบบไม่มีเวลาจากฐานข้อมูลควรถูกอ่านเป็นวันที่ตามปฏิทินของร้าน
  // เพื่อไม่ให้วันแสดงผลคลาดเคลื่อนจาก timezone ของ JavaScript
  const valueToParse = isDateOnlyString(trimmedValue)
    ? `${trimmedValue}T00:00:00`
    : trimmedValue;

  const parsedDate = parseISO(valueToParse);

  if (isValid(parsedDate)) {
    return parsedDate;
  }

  const fallbackDate = new Date(trimmedValue);

  return isValid(fallbackDate) ? fallbackDate : null;
}

function isDateOnlyString(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}
