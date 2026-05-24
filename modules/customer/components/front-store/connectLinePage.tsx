"use client";

import { useEffect, useState, useTransition } from "react";
import liff from "@line/liff";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  BellRing,
  CheckCircle2,
  LinkIcon,
  LogOut,
  ShieldCheck,
  Unlink,
} from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { authClient } from "@/lib/auth-client";
import {
  connectLine,
  disconnectLine,
} from "@/modules/line/actions/connect-line";

interface ConnectLinePageProps {
  isConnected: boolean;
}

const benefits = [
  {
    title: "แจ้งเตือนสถานะบริการ",
    description: "รับอัปเดตเมื่อนัดหมายหรือบริการมีความคืบหน้า",
    icon: BellRing,
  },
  {
    title: "เชื่อมบัญชีอย่างปลอดภัย",
    description: "ระบบผูก LINE กับบัญชี Pet House ที่เข้าสู่ระบบอยู่เท่านั้น",
    icon: ShieldCheck,
  },
];

export default function Page({ isConnected }: ConnectLinePageProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lineUserId, setLineUserId] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

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
        toast.error("ไม่สามารถเปิด LINE LIFF ได้ กรุณาลองใหม่อีกครั้ง");
      }
    };
    initLiff();
  }, []);

  const handleConnect = async () => {
    startTransition(async () => {
      try {
        const result = await connectLine(lineUserId!);

        if (!result.success) {
          toast.error(
            result.error ||
              "เกิดข้อผิดพลาดในการเชื่อมต่อบัญชีกับ LINE",
          );
          return;
        }
        toast.success("เชื่อมต่อบัญชีกับ LINE สำเร็จ");
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อบัญชีกับ LINE");
      }
    });
  };

  const handleDisconnect = async () => {
    startTransition(async () => {
      try {
        const result = await disconnectLine();

        if (!result.success) {
          toast.error(
            result.error ||
              "เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อบัญชีกับ LINE",
          );
          return;
        }

        toast.success("ยกเลิกการเชื่อมต่อบัญชีกับ LINE สำเร็จ");
        router.refresh();
      } catch {
        toast.error("เกิดข้อผิดพลาดในการยกเลิกการเชื่อมต่อบัญชีกับ LINE");
      }
    });
  };

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);

      const result = await authClient.signOut();

      if (result.error) {
        toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
        return;
      }

      router.refresh();
    } catch (error) {
      console.error("Connect LINE sign out error:", error);
      toast.error("ออกจากระบบไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setIsSigningOut(false);
    }
  };

  if (lineUserId === null) {
    return (
      <main className="flex justify-center items-center bg-background px-4 py-10 min-h-dvh text-foreground">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col justify-center items-center gap-4 px-6 py-10 min-h-72 text-center">
            <div className="flex justify-center items-center bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl ring-1 ring-emerald-100 dark:ring-emerald-900/60 size-16 text-emerald-600 dark:text-emerald-300">
              <Spinner className="size-6" />
            </div>
            <div className="space-y-2">
              <h1 className="font-semibold text-xl">กำลังเปิด LINE</h1>
              <p className="text-muted-foreground text-sm leading-6">
                ระบบกำลังตรวจสอบบัญชี LINE ของคุณเพื่อเตรียมเชื่อมต่อกับ Pet House
              </p>
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  const statusBadge = isConnected ? (
    <Badge className="bg-emerald-600 hover:bg-emerald-600 dark:bg-emerald-500 text-white dark:text-emerald-950">
      <CheckCircle2 data-icon="inline-start" />
      เชื่อมต่อแล้ว
    </Badge>
  ) : (
    <Badge variant="outline" className="border-amber-300 dark:border-amber-800 text-amber-700 dark:text-amber-300">
      <Unlink data-icon="inline-start" />
      ยังไม่เชื่อมต่อ
    </Badge>
  );

  return (
    <main className="flex justify-center items-center bg-background px-4 py-10 min-h-dvh text-foreground">
      <Card className="w-full max-w-md">
        <CardHeader className="gap-4 px-6 pt-6 text-center">
          <div className="flex justify-center">
            <Image
              src="/icons/line.svg"
              alt="LINE"
              width={50}
              height={50}
              priority
            />
          </div>
          <div className="space-y-3">
            <div className="flex justify-center">{statusBadge}</div>
            <CardTitle className="font-semibold text-2xl">
              เชื่อมต่อ LINE กับ Pet House
            </CardTitle>
            <CardDescription className="mx-auto max-w-sm leading-6">
              ใช้ LINE เพื่อรับแจ้งเตือนสถานะนัดหมายและบริการจาก Pet House ได้ทันที
            </CardDescription>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-5 px-6 pb-6">
          <div className="gap-3 grid">
            {benefits.map((benefit) => {
              const Icon = benefit.icon;

              return (
                <div
                  key={benefit.title}
                  className="flex gap-3 bg-muted/30 p-3 border border-border rounded-lg text-left"
                >
                  <div className="flex justify-center items-center bg-background ring-border rounded-lg ring-1 size-9 text-emerald-600 dark:text-emerald-300 shrink-0">
                    <Icon className="size-4" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium leading-6">{benefit.title}</p>
                    <p className="text-muted-foreground text-sm leading-6">
                      {benefit.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex flex-col gap-3">
            {isConnected ? (
              <>
                <Button className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 h-11 text-white dark:text-emerald-950">
                  <CheckCircle2 data-icon="inline-start" />
                  บัญชีนี้พร้อมรับแจ้งเตือนผ่าน LINE
                </Button>
                <LoadingButton
                  variant="outline"
                  className="hover:bg-destructive/10 border-destructive/30 h-11 text-destructive"
                  onClick={handleDisconnect}
                  disabled={isSigningOut}
                  isLoading={isPending}
                  loadingText="กำลังยกเลิกการเชื่อมต่อ..."
                >
                  <Unlink data-icon="inline-start" />
                  ยกเลิกการเชื่อมต่อ
                </LoadingButton>
              </>
            ) : (
              <LoadingButton
                className="bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-400 h-11 text-white dark:text-emerald-950"
                onClick={handleConnect}
                disabled={isSigningOut}
                isLoading={isPending}
                loadingText="กำลังเชื่อมต่อ..."
              >
                <LinkIcon data-icon="inline-start" />
                เชื่อมต่อ LINE
              </LoadingButton>
            )}

            <LoadingButton
              variant="ghost"
              className="hover:bg-destructive/10 h-11 text-destructive hover:text-destructive"
              onClick={handleSignOut}
              disabled={isPending}
              isLoading={isSigningOut}
              loadingText="กำลังออกจากระบบ..."
            >
              <LogOut data-icon="inline-start" />
              ออกจากระบบ
            </LoadingButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
