"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  const router = useRouter();

  // log ไว้ debug
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
      <h1 className="text-3xl font-bold">เกิดข้อผิดพลาด</h1>

      <p className="mt-2 text-gray-500">
        ขออภัย มีบางอย่างผิดพลาด กรุณาลองใหม่อีกครั้ง
      </p>

      <div className="mt-6 flex gap-3">
        <Button onClick={() => reset()} size="lg">
          ลองใหม่
        </Button>

        <Button onClick={() => router.push("/")} size="lg">
          กลับหน้าแรก
        </Button>
      </div>
    </div>
  );
}
