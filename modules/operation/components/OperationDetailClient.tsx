"use client";

import { format } from "date-fns"; // เอา useState ออก
import { th } from "date-fns/locale";
import { Camera, ClipboardList, Info, Loader2 } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AppointmentStatusBadge } from "@/components/StatusBadge";
import HealthReportModal from "./CreateHealthReportDialog";
import EditHealthReportDialog from "./EditHealthReportDialog";
import { useRouter } from "next/navigation";
import DeleteHealthReportButton from "./DeleteHealthReportButton";
import UploadImageDialog from "./UploadImageDialog";
import ImageLightbox from "./ImageLightbox";
import DeleteImageButton from "./DeleteImageButton";
import { useTransition } from "react";
import { updateAppointmentStatus } from "@/modules/appointment/actions/update-appointment";
import { toast } from "sonner";

// 1. สร้าง Type สำหรับสถานะและข้อมูลย่อย
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

// 2. สร้าง Interface หลักสำหรับ initialData
export interface OperationData {
  appointmentId: string;
  petId: string;
  appointment: {
    status: AppointmentStatus;
    customer: {
      nickname: string;
    };
  };
  pet: {
    name: string;
    breed: {
      name: string;
    };
  };
  startTime: string | Date;
  services: string[];
  itemIds: string[]; // เก็บ ID ของ appointmentItems ไว้ใช้อ้างอิง
  healthReports: HealthReport[];
  serviceImages: ServiceImage[];
}

interface OperationDetailClientProps {
  initialData: OperationData;
}

export default function OperationDetailClient({
  initialData: operation, // Destructure และเปลี่ยนชื่อเป็น operation เพื่อให้ไม่ต้องแก้โค้ดด้านล่าง
}: OperationDetailClientProps) {
  const router = useRouter();

  // 1. เพิ่ม useTransition สำหรับจัดการ Loading State ของปุ่มเปลี่ยนสถานะ
  const [isPendingStatus, startTransitionStatus] = useTransition();

  // ไม่ต้องใช้ useState แล้ว
  // const [operation] = useState<OperationData>(initialData);

  const serviceImages = operation?.serviceImages || [];
  const healthReports = operation?.healthReports || [];

  const beforeImages = serviceImages.filter((img) => img.type === "BEFORE");
  const afterImages = serviceImages.filter((img) => img.type === "AFTER");

  // 2. ฟังก์ชันจัดการการคลิกเปลี่ยนสถานะ
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
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">เจ้าของ</span>
              <span className="font-medium">
                คุณ{operation.appointment.customer.nickname}
              </span>
            </div>
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
                {format(
                  new Date(operation.startTime),
                  "dd MMM yyyy, HH:mm น.",
                  { locale: th },
                )}
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
              <AppointmentStatusBadge status={currentStatus} />
            </div>

            <div className="flex flex-wrap gap-2 pt-4 border-t">
              {/* 3. แสดงปุ่มแบบไดนามิก ตามสถานะปัจจุบัน */}

              {currentStatus === "CONFIRMED" && (
                <Button
                  onClick={() => handleUpdateStatus("CHECKED_IN")}
                  disabled={isPendingStatus}
                  variant="outline"
                  className="hover:bg-orange-50 border-orange-200 text-orange-700"
                >
                  {isPendingStatus ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : null}
                  เช็คอิน (ถึงร้านแล้ว)
                </Button>
              )}

              {currentStatus === "CHECKED_IN" && (
                <Button
                  onClick={() => handleUpdateStatus("IN_PROGRESS")}
                  disabled={isPendingStatus}
                  variant="outline"
                  className="hover:bg-blue-50 border-blue-200 text-blue-700"
                >
                  {isPendingStatus ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : null}
                  เริ่มให้บริการ
                </Button>
              )}

              {currentStatus === "IN_PROGRESS" && (
                <Button
                  onClick={() => handleUpdateStatus("READY_FOR_PICKUP")}
                  disabled={isPendingStatus}
                  variant="outline"
                  className="hover:bg-teal-50 border-teal-200 text-teal-700"
                >
                  {isPendingStatus ? (
                    <Loader2 className="mr-2 w-4 h-4 animate-spin" />
                  ) : null}
                  รอรับกลับ
                </Button>
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
            {/* เรียกใช้งาน UploadImageDialog */}
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
                    // เพิ่มคลาส group ตรงนี้
                    <div
                      key={img.id}
                      className="group relative bg-muted rounded-md aspect-square overflow-hidden"
                    >
                      <ImageLightbox src={img.imageUrl} alt="Before">
                        <img
                          src={img.imageUrl}
                          alt="Before"
                          className="w-full h-full object-cover"
                        />
                      </ImageLightbox>

                      {/* วางปุ่มลบรูปภาพ ตรงนี้ */}
                      <DeleteImageButton
                        imageId={img.id}
                        imageUrl={img.imageUrl}
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
                    // เพิ่มคลาส group ตรงนี้
                    <div
                      key={img.id}
                      className="group relative bg-muted rounded-md aspect-square overflow-hidden"
                    >
                      <ImageLightbox src={img.imageUrl} alt="After">
                        <img
                          src={img.imageUrl}
                          alt="After"
                          className="w-full h-full object-cover"
                        />
                      </ImageLightbox>

                      {/* วางปุ่มลบรูปภาพ ตรงนี้ */}
                      <DeleteImageButton
                        imageId={img.id}
                        imageUrl={img.imageUrl}
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
                          {format(new Date(report.createdAt), "dd MMM yyyy", {
                            locale: th,
                          })}
                        </span>

                        <EditHealthReportDialog
                          report={report}
                          appointmentId={operation.appointmentId}
                          petId={operation.petId}
                        />

                        {/* เพิ่มปุ่มลบ ตรงนี้ */}
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
