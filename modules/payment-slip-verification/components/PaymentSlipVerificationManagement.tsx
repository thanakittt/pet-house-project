"use client";

import Link from "next/link";
import {
  ManagementListControls,
  ManagementPagination,
  type ManagementFilterOption,
} from "@/components/shared/ManagementListControls";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatThaiDate } from "@/lib/utils";
import type { ListPaymentSlipVerificationsResult } from "../queries/list-payment-slip-verifications";
import {
  SLIP_VERIFICATION_STATUS_LABELS,
  type PaymentSlipVerification,
  type SlipVerificationStatus,
} from "../types/payment-slip-verification";

const statusOptions: ManagementFilterOption[] = [
  { value: "ALL", label: "ทุกสถานะ" },
  { value: "VERIFIED", label: SLIP_VERIFICATION_STATUS_LABELS.VERIFIED },
  { value: "REJECTED", label: SLIP_VERIFICATION_STATUS_LABELS.REJECTED },
  { value: "ERROR", label: SLIP_VERIFICATION_STATUS_LABELS.ERROR },
];

const statusBadgeVariants: Record<
  SlipVerificationStatus,
  "default" | "destructive" | "secondary"
> = {
  VERIFIED: "default",
  REJECTED: "destructive",
  ERROR: "secondary",
};

export function PaymentSlipVerificationManagement({
  verifications,
  total,
  page,
  pageSize,
  totalPages,
  q,
  status,
}: ListPaymentSlipVerificationsResult) {
  return (
    <>
      <ManagementListControls
        search={{
          ariaLabel: "ค้นหาประวัติการตรวจสลิป",
          placeholder: "ค้นหาเลขอ้างอิง ผู้โอน หรือลูกค้า",
          value: q,
        }}
        selectFilters={[
          {
            ariaLabel: "กรองสถานะการตรวจสลิป",
            name: "status",
            options: statusOptions,
            placeholder: "สถานะ",
            value: status,
          },
        ]}
      />

      <div className="bg-white border rounded-md overflow-x-auto">
        <Table>
          <TableHeader className="bg-muted">
            <TableRow>
              <TableHead>วันที่ตรวจ</TableHead>
              <TableHead>ลูกค้า / นัดหมาย</TableHead>
              <TableHead>สถานะ</TableHead>
              <TableHead className="text-right">ยอดเงิน</TableHead>
              <TableHead>เลขอ้างอิง</TableHead>
              <TableHead>หมายเหตุ</TableHead>
              <TableHead className="text-right">จัดการ</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {verifications.length > 0 ? (
              verifications.map((verification) => (
                <VerificationRow
                  key={verification.id}
                  verification={verification}
                />
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="py-10 text-center">
                  ไม่พบประวัติการตรวจสลิป
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <ManagementPagination
        page={page}
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </>
  );
}

function VerificationRow({
  verification,
}: {
  verification: PaymentSlipVerification;
}) {
  // Processing: เตรียมข้อความ fallback ไว้ก่อน render เพื่อให้ JSX อ่านง่ายและแก้ต่อได้ง่าย
  const amountText = buildAmountText(verification);
  const referenceText =
    verification.transRef ?? verification.providerReference ?? "-";
  const remarkText =
    verification.remark ??
    verification.providerErrorMessage ??
    verification.providerErrorCode ??
    "-";

  return (
    <TableRow>
      <TableCell className="min-w-[130px]">
        <div className="flex flex-col gap-1">
          <span>{formatThaiDate(verification.createdAt, "dd MMM yy")}</span>
          <span className="text-muted-foreground text-xs">
            {verification.provider}
          </span>
        </div>
      </TableCell>
      <TableCell className="min-w-[180px]">
        <div className="flex flex-col gap-1">
          <span className="font-medium">{verification.customerName}</span>
          <Link
            href={`/back-office/appointments/${verification.appointmentId}`}
            className="text-muted-foreground text-xs hover:underline underline-offset-4"
          >
            นัดหมาย {formatThaiDate(verification.appointmentDate, "dd MMM yy")}
          </Link>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex flex-col items-start gap-1">
          <Badge variant={statusBadgeVariants[verification.status]}>
            {SLIP_VERIFICATION_STATUS_LABELS[verification.status]}
          </Badge>
          {verification.isDuplicate && (
            <Badge variant="secondary">สลิปซ้ำ</Badge>
          )}
          {verification.redactedAt && (
            <span className="text-muted-foreground text-xs">
              ลบข้อมูล PII แล้ว
            </span>
          )}
        </div>
      </TableCell>
      <TableCell className="min-w-[140px] text-right">
        <div className="flex flex-col gap-1">
          <span>{amountText}</span>
          <span className="text-muted-foreground text-xs">
            {verification.isAmountMatched === null
              ? "ยังไม่มีผลเทียบยอด"
              : verification.isAmountMatched
                ? "ยอดตรง"
                : "ยอดไม่ตรง"}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[220px]">
        <div className="flex flex-col gap-1">
          <span className="truncate">{referenceText}</span>
          <span className="text-muted-foreground text-xs">
            {verification.payerNameRedacted ?? "ไม่ระบุผู้โอน"}
            {verification.payerAccountLast4
              ? ` • ****${verification.payerAccountLast4}`
              : ""}
          </span>
        </div>
      </TableCell>
      <TableCell className="max-w-[240px]">
        <span className="text-sm line-clamp-2">{remarkText}</span>
      </TableCell>
      <TableCell className="text-right">
        <Button asChild variant="outline" size="sm">
          <a
            href={verification.slipImageUrl}
            target="_blank"
            rel="noreferrer"
          >
            ดูสลิป
          </a>
        </Button>
      </TableCell>
    </TableRow>
  );
}

function buildAmountText(verification: PaymentSlipVerification): string {
  const amountInSlip =
    verification.amountInSlip === null
      ? "-"
      : formatCurrency(verification.amountInSlip);
  const amountInOrder =
    verification.amountInOrder === null
      ? "-"
      : formatCurrency(verification.amountInOrder);

  return `${amountInSlip} / ${amountInOrder}`;
}
