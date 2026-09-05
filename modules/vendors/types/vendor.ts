import { z } from "zod";

export type Vendor = {
  id: string;
  name: string;
  contactName: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  taxId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export const vendorFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "กรุณาระบุชื่อผู้จำหน่าย")
    .max(150, "ชื่อผู้จำหน่ายต้องไม่เกิน 150 ตัวอักษร"),
  contactName: z
    .string()
    .trim()
    .max(100, "ชื่อผู้ติดต่อต้องไม่เกิน 100 ตัวอักษร")
    .optional()
    .nullable(),
  phone: z
    .string()
    .trim()
    .max(50, "เบอร์โทรศัพท์ต้องไม่เกิน 50 ตัวอักษร")
    .optional()
    .nullable(),
  email: z
    .string()
    .trim()
    .max(100, "อีเมลต้องไม่เกิน 100 ตัวอักษร")
    .email("รูปแบบอีเมลไม่ถูกต้อง")
    .optional()
    .nullable()
    .or(z.literal("")),
  address: z
    .string()
    .trim()
    .max(500, "ที่อยู่ต้องไม่เกิน 500 ตัวอักษร")
    .optional()
    .nullable(),
  taxId: z
    .string()
    .trim()
    .max(20, "เลขประจำตัวผู้เสียภาษีต้องไม่เกิน 20 ตัวอักษร")
    .optional()
    .nullable(),
  isActive: z.boolean().default(true),
});

export type VendorFormValues = z.input<typeof vendorFormSchema>;
export type VendorFormOutput = z.output<typeof vendorFormSchema>;
