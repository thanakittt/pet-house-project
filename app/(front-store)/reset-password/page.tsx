import type { Metadata } from "next";
import { ResetPassword } from "@/modules/auth/components/ResetPassword";

export const metadata: Metadata = {
  title: "รีเซ็ตรหัสผ่าน",
  description: "ตั้งรหัสผ่านใหม่สำหรับบัญชี Pet House",
};

type ResetPasswordPageProps = {
  searchParams: Promise<{
    token?: string | string[];
    error?: string | string[];
  }>;
};

function firstParam(value?: string | string[]) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function ResetPasswordPage({
  searchParams,
}: ResetPasswordPageProps) {
  const params = await searchParams;

  return (
    <ResetPassword
      token={firstParam(params.token)}
      error={firstParam(params.error)}
    />
  );
}
