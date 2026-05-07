export const SLIP_VERIFICATION_STATUS_LABELS = {
  VERIFIED: "ผ่านการตรวจสอบ",
  REJECTED: "ไม่ผ่านการตรวจสอบ",
  ERROR: "ตรวจสอบไม่สำเร็จ",
} as const;

export type SlipVerificationStatus =
  keyof typeof SLIP_VERIFICATION_STATUS_LABELS;

export type PaymentSlipVerification = {
  id: string;
  appointmentId: string;
  appointmentDate: Date;
  paymentId: string | null;
  provider: string;
  status: SlipVerificationStatus;
  slipImageUrl: string;
  remark: string | null;
  transRef: string | null;
  amountInSlip: number | null;
  amountInOrder: number | null;
  isAmountMatched: boolean | null;
  isDuplicate: boolean;
  payerNameRedacted: string | null;
  payerAccountLast4: string | null;
  providerReference: string | null;
  providerErrorCode: string | null;
  providerErrorMessage: string | null;
  redactedAt: Date | null;
  createdAt: Date;
  customerName: string;
  paymentStatus: string | null;
  paymentType: string | null;
};
