"use client";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { SERVICE_RULE_SECTIONS } from "@/lib/constants/service-rules";
import { cn } from "@/lib/utils";
import { ChevronDown, ShieldCheck, XCircle } from "lucide-react";

export default function ServiceRulesConsent({
  accepted,
  rejected,
  disabled,
  onAcceptedChange,
  onReject,
}: {
  accepted: boolean;
  rejected: boolean;
  disabled?: boolean;
  onAcceptedChange: (accepted: boolean) => void;
  onReject: () => void;
}) {
  return (
    <div className="mx-auto mt-6 md:px-6 max-w-4xl">
      <div className="rounded-lg border bg-muted/30 p-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <ShieldCheck className="size-5" />
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="font-semibold text-primary text-base">
              กฎก่อนเข้ารับบริการ
            </h3>
            <p className="mt-1 text-muted-foreground text-sm">
              กรุณาอ่านและยอมรับกฎการจอง การมารับบริการ
              สุขภาพและพฤติกรรมสัตว์เลี้ยง รวมถึงเงื่อนไขค่าใช้จ่าย
              ก่อนยืนยันการจองคิว
            </p>
          </div>
        </div>

        <details className="group mt-4 rounded-lg border bg-background">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 font-medium text-sm text-foreground">
            อ่านกฎการเข้ารับบริการฉบับเต็ม
            <ChevronDown className="size-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
          </summary>

          <div className="max-h-72 overflow-y-auto border-t px-4 py-3">
            <div className="space-y-4">
              {SERVICE_RULE_SECTIONS.map((section) => (
                <section key={section.title}>
                  <h4 className="font-semibold text-primary text-sm">
                    {section.title}
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-muted-foreground text-sm">
                    {section.rules.map((rule) => (
                      <li key={rule}>{rule}</li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          </div>
        </details>

        {rejected ? (
          <Alert variant="destructive" className="mt-4">
            <XCircle className="size-4" />
            <AlertTitle>ยังไม่สามารถยืนยันการจองได้</AlertTitle>
            <AlertDescription>
              ลูกค้าต้องยอมรับกฎการเข้ารับบริการก่อน
              จึงจะสามารถจองคิวและเข้ารับบริการได้
            </AlertDescription>
          </Alert>
        ) : null}

        <div
          className={cn(
            "mt-4 flex flex-col gap-3 rounded-lg border bg-background p-4 sm:flex-row sm:items-center sm:justify-between",
            accepted && "border-primary/40 bg-primary/5",
          )}
        >
          <Label
            htmlFor="accept-service-rules"
            className="items-start gap-3 text-sm leading-relaxed"
          >
            <Checkbox
              id="accept-service-rules"
              checked={accepted}
              disabled={disabled}
              onCheckedChange={(checked: boolean) =>
                onAcceptedChange(checked === true)
              }
              className="mt-0.5"
            />
            <span>ข้าพเจ้าได้อ่านและยอมรับกฎการเข้ารับบริการ</span>
          </Label>

          <Button
            type="button"
            variant="destructive"
            disabled={disabled}
            onClick={onReject}
            className="w-full sm:w-auto"
          >
            ปฏิเสธ
          </Button>
        </div>
      </div>
    </div>
  );
}
