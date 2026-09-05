import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { requireStaff } from "@/lib/session";
import { getPurchaseOrder } from "@/modules/inventories/queries/get-purchase-order";
import { PurchaseOrderPrintView } from "@/modules/inventories/components/PurchaseOrderPrintView";
import { isPrintablePurchaseOrderStatus } from "@/modules/inventories/constants/purchase-order-status";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const shortId = id.replace(/-/g, "").toUpperCase().slice(-8);
  return {
    title: `พิมพ์ใบสั่งซื้อ #PO-${shortId} | Pet House`,
    description: "แบบพิมพ์ใบสั่งซื้อสินค้ามาตรฐาน A4",
  };
}

export default async function PurchaseOrderPrintPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();

  const { id } = await params;
  const result = await getPurchaseOrder(id);

  if (!result.success || !result.data) {
    notFound();
  }

  if (!isPrintablePurchaseOrderStatus(result.data.status)) {
    redirect(`/back-office/inventories/purchase-orders/${id}`);
  }

  return <PurchaseOrderPrintView order={result.data} />;
}

