import type { Metadata } from "next";
import { getPetOperationDetail } from "@/modules/operation/queries/get-pet-operation-detail";
import OperationDetailClient from "@/modules/operation/components/OperationDetailClient";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import BackButton from "@/components/BackButton";
import { requireStaff } from "@/lib/session";

export const metadata: Metadata = {
  title: "รายละเอียดคิวงาน",
  description: "ดูรายละเอียดการให้บริการและรายงานสุขภาพของสัตว์เลี้ยง",
};

interface PageProps {
  params: Promise<{
    appointmentId: string;
    petId: string;
  }>;
}

export default async function OperationDetailPage({ params }: PageProps) {
  await requireStaff();

  const { appointmentId, petId } = await params;
  const result = await getPetOperationDetail(appointmentId, petId);

  if (!result.success || !result.data) {
    notFound();
  }

  return (
    <>
      <SiteHeader title="รายละเอียดคิวงาน" />
      <BackOfficeContainer>
        <BackButton className="mb-4" />
        {/* โยนข้อมูลที่ Merge แล้วไปยัง Client Component */}
        <OperationDetailClient initialData={result.data} />
      </BackOfficeContainer>
    </>
  );
}
