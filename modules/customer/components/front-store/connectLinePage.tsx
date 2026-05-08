"use client";

import { useEffect, useTransition, useState } from "react";
import liff from "@line/liff";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  connectLine,
  disconnectLine,
} from "@/modules/customer/actions/connect-line";
import { useRouter } from "next/navigation";

interface ConnectLinePageProps {
  isConnected: boolean;
}

export default function Page({ isConnected }: ConnectLinePageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lineUserId, setLineUserId] = useState<string | null>(null);

  useEffect(() => {
    const initLiff = async () => {
      try {
        await liff.init({ liffId: process.env.NEXT_PUBLIC_LIFF_ID! });
        if (liff.isLoggedIn()) {
          const profile = await liff.getProfile();
          setLineUserId(profile.userId);
        } else {
          liff.login();
        }
      } catch (error) {
        console.error(
          "LIFF init failed",
          error instanceof Error ? error.message : "An unknown error occurred",
        );
      }
    };
    initLiff();
  }, []);

  const handleConnect = async () => {
    startTransition(async () => {
      try {
        const result = await connectLine(lineUserId!);

        if (!result.success) {
          toast.error(result.error || "เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE");
          return;
        }
        toast.success("เชื่อมต่อกับ LINE สำเร็จ");
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อกับ LINE");
      }
    });
  };

  const handleDisconnect = async () => {
    startTransition(async () => {
      try {
        const result = await disconnectLine();

        if (!result.success) {
          toast.error(
            result.error || "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อกับ LINE",
          );
          return;
        }

        toast.success("ยกเลิกการเชื่อมต่อกับ LINE สำเร็จ");
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อกับ LINE");
      }
    });
  };

  if (lineUserId === null) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-center">
          <p className="mb-4 text-gray-600">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <div className="text-center">
        <h1 className="mb-4 font-bold text-green-600 text-2xl">
          เชื่อมต่อกับ LINE
        </h1>
        {isConnected ? (
          <div>
            <p className="mb-4 text-gray-600">คุณได้เชื่อมต่อกับ LINE แล้ว</p>
            <Button size="lg" onClick={handleDisconnect} disabled={isPending}>
              {isPending ? "กำลังยกเลิก..." : "ยกเลิกการเชื่อมต่อ"}
            </Button>
          </div>
        ) : (
          <div>
            <p className="mb-4 text-gray-600">
              กรุณาคลิกที่ปุ่มด้านล่างเพื่อเชื่อมต่อกับ LINE
            </p>
            <Button size="lg" onClick={handleConnect} disabled={isPending}>
              {isPending ? "กำลังเชื่อมต่อ..." : "เชื่อมต่อ"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
