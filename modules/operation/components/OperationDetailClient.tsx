"use client";
import {
  Camera,
  ClipboardList,
  Info,
  AlertCircle,
  StickyNote, // เพิ่ม StickyNote
} from "lucide-react";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import HealthReportModal from "./CreateHealthReportDialog";
import EditHealthReportDialog from "./EditHealthReportDialog";
import { useRouter } from "next/navigation";
import DeleteHealthReportButton from "./DeleteHealthReportButton";
import UploadImageDialog from "./UploadImageDialog";
import ImageLightbox from "./ImageLightbox";
import DeleteImageButton from "./DeleteImageButton";
import Image from "next/image";
import { useTransition } from "react";
import { updateAppointmentStatus } from "@/modules/appointment/actions/update-appointment";
import { toast } from "sonner";
import { cn, formatThaiDate, formatThaiDateTime } from "@/lib/utils";
import { getAppointmentStatusConfig } from "@/lib/constants/appointment-status";

export type AppointmentStatus =
  | "PENDING_DEPOSIT"
  | "PENDING_APPROVAL"
  | "CONFIRMED"
  | "CHECKED_IN"
  | "IN_PROGRESS"
  | "READY_FOR_PICKUP"
  | "COMPLETED"
  | "CANCELLED"
  | "NO_SHOW";

export interface ServiceImage {
  id: string;
  imageUrl: string;
  type: "BEFORE" | "AFTER" | "ISSUE";
  createdAt: string | Date;
}

export interface HealthReport {
  id: string;
  topic: string;
  description: string;
  createdAt: string | Date;
}

export interface OperationData {
  appointmentId: string;
  petId: string;
  appointment: {
    status: AppointmentStatus;
    note: string | null;
    customer: {
      nickname: string;
    };
  };
  pet: {
    name: string;
    breed: {
      name: string;
    };
    medicalNotes: string | null;
  };
  startTime: string | Date;
  services: string[];
  itemIds: string[];
  healthReports: HealthReport[];
  serviceImages: ServiceImage[];
}

interface OperationDetailClientProps {
  initialData: OperationData;
}

export default function OperationDetailClient({
  initialData: operation,
}: OperationDetailClientProps) {
  const router = useRouter();
  const [isPendingStatus, startTransitionStatus] = useTransition();

  const serviceImages = operation?.serviceImages || [];
  const healthReports = operation?.healthReports || [];

  const beforeImages = serviceImages.filter((img) => img.type === "BEFORE");
  const afterImages = serviceImages.filter((img) => img.type === "AFTER");

  const handleUpdateStatus = (newStatus: AppointmentStatus) => {
    startTransitionStatus(async () => {
      const result = await updateAppointmentStatus(
        operation.appointmentId,
        newStatus,
      );

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      toast.success("อัปเดตสถานะคิวงานสำเร็จ");
      router.refresh();
    });
  };

  const currentStatus = operation.appointment.status;

  return (
    <div className="items-start gap-6 grid grid-cols-1 lg:grid-cols-3">
      {/* Sidebar: ข้อมูลสัตว์เลี้ยงและบริการ */}
      <div className="lg:top-6 lg:sticky space-y-6 lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">ข้อมูลบริการ</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">สัตว์เลี้ยง</span>
              <span className="flex items-center gap-2 font-semibold">
                {operation.pet.name}
                <Badge variant="secondary" className="font-normal text-xs">
                  {operation.pet.breed.name}
                </Badge>
              </span>
            </div>

            {/* แสดงผล Medical Notes */}
            {operation.pet.medicalNotes && (
              <div className="bg-red-50 p-3 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 mb-1 font-medium text-red-800 text-sm">
                  <AlertCircle className="w-4 h-4" />
                  ข้อมูลสุขภาพ / ข้อควรระวัง
                </div>
                <p className="text-red-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {operation.pet.medicalNotes}
                </p>
              </div>
            )}

            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เจ้าของ</span>
              <span className="font-medium">
                คุณ{operation.appointment.customer.nickname}
              </span>
            </div>

            {/* [NEW] แสดงผล Appointment Note (หมายเหตุการจอง) */}
            {operation.appointment.note && (
              <div className="bg-yellow-50 mt-2 p-3 border border-yellow-200 rounded-md">
                <div className="flex items-center gap-2 mb-1 font-medium text-yellow-800 text-sm">
                  <StickyNote className="w-4 h-4" />
                  หมายเหตุการจอง
                </div>
                <p className="text-yellow-700 text-sm leading-relaxed whitespace-pre-wrap">
                  {operation.appointment.note}
                </p>
              </div>
            )}

            <Separator />
            <div className="flex justify-between items-start">
              <span className="mt-1 text-muted-foreground">บริการ</span>
              <div className="flex flex-col items-end gap-1">
                {operation.services?.map((serviceName, idx) => (
                  <span key={idx} className="font-medium text-sm text-right">
                    {serviceName}
                  </span>
                ))}
              </div>
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เวลานัดหมาย</span>
              <span className="font-medium text-sm">
                {formatThaiDateTime(operation.startTime)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="space-y-6 lg:col-span-2">
        {/* Section 1: สถานะงาน */}
        <Card className="pt-0">
          <CardHeader className="flex flex-row items-center gap-2 space-y-0 bg-muted/30 py-4 border-b">
            <Info className="w-5 h-5 text-muted-foreground" />
            <CardTitle>การจัดการสถานะ (บิลหลัก)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-6">
            <div className="flex items-center gap-4">
              <span className="font-medium text-muted-foreground">
                สถานะปัจจุบัน:
              </span>
              <AppointmentStatusBadge status={currentStatus} size="lg" />
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {currentStatus === "CONFIRMED" && (
                <LoadingButton
                  onClick={() => handleUpdateStatus("CHECKED_IN")}
                  isLoading={isPendingStatus}
                  className={cn(
                    getAppointmentStatusConfig("CHECKED_IN").colorClass,
                    "hover:opacity-80",
                  )}
                >
                  เช็คอิน (ถึงร้านแล้ว)
                </LoadingButton>
              )}

              {currentStatus === "CHECKED_IN" && (
                <LoadingButton
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  isLoading={isPendingStatus}
                  className={cn(
                    getAppointmentStatusConfig("IN_PROGRESS").colorClass,
                    "hover:opacity-80",
                  )}
                >
                  เริ่มให้บริการ
                </LoadingButton>
              )}

              {currentStatus === "IN_PROGRESS" && (
                <LoadingButton
                  onClick={() => handleUpdateStatus("READY_FOR_PICKUP")}
                  isLoading={isPendingStatus}
                  className={cn(
                    getAppointmentStatusConfig("READY_FOR_PICKUP").colorClass,
                    "hover:opacity-80",
                  )}
                >
                  รอรับกลับ
                </LoadingButton>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 2: รูปภาพ */}
        <Card className="pt-0">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 bg-muted/30 py-4 border-b">
            <div className="flex items-center gap-2">
              <Camera className="w-5 h-5 text-muted-foreground" />
              <CardTitle>รูปภาพก่อน - หลัง ({serviceImages.length})</CardTitle>
            </div>
            <UploadImageDialog
              appointmentId={operation.appointmentId}
              petId={operation.petId}
            />
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            {/* Before Images */}
            <div>
              <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                ก่อนรับบริการ (Before)
              </h3>
              {beforeImages.length > 0 ? (
                <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {beforeImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative bg-muted rounded-md aspect-square overflow-hidden"
                    >
                      <ImageLightbox src={img.imageUrl} alt="Before">
                        <Image
                          src={img.imageUrl}
                          alt="Before"
                          fill
                          className="object-cover"
                        />
                      </ImageLightbox>
                      <DeleteImageButton
                        imageId={img.id}
                        appointmentId={operation.appointmentId}
                        petId={operation.petId}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="bg-muted/20 p-4 border border-dashed rounded text-muted-foreground text-sm text-center">
                  ยังไม่มีรูปภาพ
                </p>
              )}
            </div>

            {/* After Images */}
            <div>
              <h3 className="mb-3 font-medium text-muted-foreground text-sm">
                หลังรับบริการ (After)
              </h3>
              {afterImages.length > 0 ? (
                <div className="gap-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4">
                  {afterImages.map((img) => (
                    <div
                      key={img.id}
                      className="group relative bg-muted rounded-md aspect-square overflow-hidden"
                    >
                      <ImageLightbox src={img.imageUrl} alt="After">
                        <Image
                          src={img.imageUrl}
                          alt="After"
                          fill
                          className="object-cover"
                        />
                      </ImageLightbox>
                      <DeleteImageButton
                        imageId={img.id}
                        appointmentId={operation.appointmentId}
                        petId={operation.petId}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="bg-muted/20 p-4 border border-dashed rounded text-muted-foreground text-sm text-center">
                  ยังไม่มีรูปภาพ
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Section 3: รายงานสุขภาพ */}
        <Card className="pt-0">
          <CardHeader className="flex flex-row justify-between items-center space-y-0 bg-muted/30 py-4 border-b">
            <div className="flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-muted-foreground" />
              <CardTitle>
                รายงานสุขภาพเบื้องต้น ({healthReports.length})
              </CardTitle>
            </div>

            <HealthReportModal
              appointmentId={operation.appointmentId}
              petId={operation.petId}
            />
          </CardHeader>
          <CardContent className="pt-6">
            {healthReports.length > 0 ? (
              <div className="space-y-4">
                {healthReports.map((report) => (
                  <div
                    key={report.id}
                    className="group bg-gray-50/50 p-4 border rounded-lg"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">
                        {report.topic}
                      </h4>
                      <div className="flex items-center gap-1">
                        <span className="mr-2 text-muted-foreground text-xs">
                          {formatThaiDate(report.createdAt)}
                        </span>

                        <EditHealthReportDialog
                          report={report}
                          appointmentId={operation.appointmentId}
                          petId={operation.petId}
                        />

                        <DeleteHealthReportButton
                          reportId={report.id}
                          topic={report.topic}
                          appointmentId={operation.appointmentId}
                          petId={operation.petId}
                        />
                      </div>
                    </div>
                    <p className="text-gray-700 text-sm">
                      {report.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 border-2 border-dashed rounded-lg text-muted-foreground text-sm text-center">
                ยังไม่มีการบันทึกรายงานสุขภาพ
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
