"use client";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { BellRingIcon, ExternalLinkIcon } from "lucide-react";

const LINE_ADD_FRIEND_URL = "https://lin.ee/y7JwFdI";

export default function LineNotificationAlert() {
  return (
    <Alert className="flex flex-col gap-3 border-emerald-200 bg-emerald-50 p-4 text-emerald-900 sm:flex-row sm:items-center sm:justify-between dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-200">
      <div className="flex min-w-0 items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-300">
          <BellRingIcon className="size-4" aria-hidden="true" />
        </div>

        <div className="flex min-w-0 flex-col gap-1">
          <AlertTitle className="font-semibold leading-snug">
            อย่าพลาดการแจ้งเตือนบริการ
          </AlertTitle>
          <AlertDescription className="text-sm leading-relaxed text-emerald-800/90 dark:text-emerald-200/90">
            เชื่อมต่อ LINE เพื่อรับแจ้งเตือนสถานะบริการ เช่น
            กำลังดูแลน้อง หรือเมื่อน้องพร้อมรับกลับ
          </AlertDescription>
        </div>
      </div>

      <div className="w-full shrink-0 sm:w-auto">
        <Button
          asChild
          size="sm"
          className="h-10 w-full gap-2 border-none bg-[#06C755] text-white hover:bg-[#05b34c] sm:w-auto"
        >
          <a href={LINE_ADD_FRIEND_URL} target="_blank" rel="noreferrer">
            เชื่อมต่อ LINE
            <ExternalLinkIcon className="size-4" aria-hidden="true" />
          </a>
        </Button>
      </div>
    </Alert>
  );
}
