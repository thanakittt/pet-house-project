import type { Metadata } from "next";
import { ForgotPasswordForm } from "@/modules/auth/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "ลืมรหัสผ่าน",
  description: "ขอลิงก์สำหรับตั้งรหัสผ่านใหม่ของบัญชี Pet House",
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
