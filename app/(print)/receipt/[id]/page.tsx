import { notFound } from "next/navigation";
import { getReceiptData } from "@/modules/pos/queries/get-receipt-data";
import { ReceiptPrintView } from "@/modules/pos/components/ReceiptPrintView";

interface ReceiptPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function ReceiptPage({ params }: ReceiptPageProps) {
  const { id } = await params;
  const receiptData = await getReceiptData(id);

  if (!receiptData.success || !receiptData.data) {
    return notFound();
  }

  return <ReceiptPrintView data={receiptData.data} />;
}