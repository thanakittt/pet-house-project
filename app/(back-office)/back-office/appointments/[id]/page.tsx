import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getAppointmentDetail } from "@/modules/appointment/queries/get-appointment-detail";
import AppointmentStatusManager from "@/modules/appointment/components/AppointmentStatusManage";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { formatPhoneNumber, formatThaiDate, formatThaiTime } from "@/lib/utils";

import { requireStaff } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { BackOfficeContainer } from "@/components/shared/BackOfficeContainer";
import { Camera, AlertTriangle, ClipboardList, Phone, User } from "lucide-react"; // [NEW] นำเข้า ClipboardList
import BackButton from "@/components/BackButton";
import ImageLightbox from "@/modules/operation/components/ImageLightbox";
import Image from "next/image";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";

export const metadata: Metadata = {
  title: "รายละเอียดการจอง",
  description: "ดูรายละเอียดนัดหมาย สัตว์เลี้ยง และสถานะการจอง",
};

// [NEW] เพิ่ม Type สำหรับรายงานสุขภาพ
type HealthReport = {
  id: string;
  topic: string;
  description: string;
  createdAt?: string | Date;
};

type ServiceImage = {
  id: string;
  imageUrl: string;
  type: "BEFORE" | "AFTER" | "ISSUE";
  createdAt?: string | Date;
};

type PetWithServices = {
  petId: string;
  petName: string;
  petBreed: string;
  petType: string;
  services: {
    id: string;
    name: string;
    size: string;
    price: number;
    startTime: string;
    endTime: string;
  }[];
  serviceImages: ServiceImage[];
  healthReports: HealthReport[]; // [NEW]
};

export default async function AppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireStaff();

  const { id } = await params;
  const result = await getAppointmentDetail(id);

  if (!result.success || !result.data) {
    notFound();
  }

  const appointment = result.data;

  return (
    <div>
      <SiteHeader title="รายละเอียดการจอง" />

      <BackOfficeContainer>
        <BackButton />
        <div className="space-y-6">
          {/* 1. Header & Status Manager */}
          <div className="bg-card shadow-sm p-6 border rounded-2xl">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-bold text-foreground text-xl">
                    รหัสการจอง: {appointment.id.split("-")[0].toUpperCase()}
                  </h1>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
                <p className="mt-1 text-muted-foreground">
                  วันที่: {formatThaiDate(appointment.date)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground text-sm">ราคารวมโดยประมาณ</p>
                <p className="font-bold text-primary text-2xl">
                  ฿{appointment.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>

            <AppointmentStatusManager
              appointmentId={appointment.id}
              currentStatus={appointment.status}
              depositPayment={appointment.depositPayment}
            />
          </div>

          {/* 2. ข้อมูลลูกค้า */}
          <div className="bg-card shadow-sm p-6 border rounded-2xl">
            <h2 className="mb-4 font-semibold text-primary text-lg">
              ข้อมูลลูกค้า
            </h2>
            <div className="gap-4 grid grid-cols-2 items-center">
              <div className="flex items-center pl-2">
                <div className="bg-primary/10 p-2 rounded-full">
                  <User className="text-primary" size={16} />
                </div>

                <p className="pl-2 font-medium text-primary text-base md:text-lg">{appointment.customer.name}</p>

              </div>
              <div className="flex items-center">
                <div className="bg-primary/10 p-2 rounded-full">
                  <Phone className="text-primary" size={16} />
                </div>

                <p className="pl-2 font-medium text-primary text-base md:text-lg">
                  {formatPhoneNumber(appointment.customer.walkInPhoneNumber)}
                </p>
              </div>
              <div className="col-span-2">
                {appointment.note && (
                  <div className="bg-muted/50 p-3 border rounded-md text-foreground text-sm">
                    <span className="font-semibold">หมายเหตุ: </span>{" "}
                    {appointment.note}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. ข้อมูลสัตว์เลี้ยงและบริการ */}
          <div className="space-y-4">
            <h2 className="px-2 font-semibold text-primary text-lg">
              สัตว์เลี้ยงที่เข้ารับบริการ ({appointment.pets.length} ตัว)
            </h2>

            {appointment.pets.map((pet: PetWithServices, index: number) => {
              const beforeImages =
                pet.serviceImages?.filter((img) => img.type === "BEFORE") || [];
              const afterImages =
                pet.serviceImages?.filter((img) => img.type === "AFTER") || [];
              const issueImages =
                pet.serviceImages?.filter((img) => img.type === "ISSUE") || [];

              return (
                <div
                  key={pet.petId}
                  className="bg-card shadow-sm p-6 border rounded-2xl"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="flex justify-center items-center bg-primary rounded-full w-10 h-10 font-bold text-primary-foreground">
                      {index + 1}
                    </div>
                    <div>
                      <h3 className="font-bold text-primary text-lg">
                        {pet.petName}
                      </h3>
                      <p className="text-muted-foreground text-sm">
                        {PET_TYPE_LABELS[pet.petType]} - {pet.petBreed}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {pet.services.map((service) => (
                      <div
                        key={service.id}
                        className="flex justify-between items-center bg-muted/50 p-3 rounded-lg"
                      >
                        <div>
                          <p className="font-medium text-primary">
                            {service.name}
                          </p>
                          <p className="mt-1 text-muted-foreground text-xs">
                            เวลา: {formatThaiTime(service.startTime)}{" "}
                            - {formatThaiTime(service.endTime)}
                          </p>
                        </div>
                        <p className="font-semibold text-primary">
                          ฿{service.price}
                        </p>
                      </div>
                    ))}
                  </div>

                  {/* แสดงผลรายงานสุขภาพ (Health Reports) */}
                  {pet.healthReports?.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="flex items-center gap-2 mb-4 font-semibold text-md text-primary">
                        <ClipboardList className="w-4 h-4" />{" "}
                        รายงานสุขภาพเบื้องต้น
                      </h4>
                      <div className="space-y-3">
                        {pet.healthReports.map((report) => (
                          <div
                            key={report.id}
                            className="bg-muted/50 p-4 border rounded-lg"
                          >
                            <h5 className="mb-1 font-semibold text-primary text-sm">
                              {report.topic}
                            </h5>
                            <p className="text-muted-foreground text-sm leading-relaxed whitespace-pre-wrap">
                              {report.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* แสดงผลรูปภาพด้วย ImageLightbox */}
                  {pet.serviceImages?.length > 0 && (
                    <div className="mt-6 pt-4 border-t">
                      <h4 className="flex items-center gap-2 mb-4 font-semibold text-md text-primary">
                        <Camera className="w-4 h-4" /> ภาพประกอบการให้บริการ
                      </h4>

                      <div className="space-y-4">
                        {beforeImages.length > 0 && (
                          <div>
                            <p className="mb-2 font-medium text-muted-foreground text-sm">
                              ก่อนรับบริการ (Before)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {beforeImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative border rounded-md w-24 h-24 overflow-hidden"
                                >
                                  <ImageLightbox
                                    src={img.imageUrl}
                                    alt="Before"
                                  >
                                    <Image
                                      src={img.imageUrl}
                                      alt="Before"
                                      fill
                                      sizes="96px"
                                      className="object-cover"
                                    />
                                  </ImageLightbox>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {afterImages.length > 0 && (
                          <div>
                            <p className="mb-2 font-medium text-muted-foreground text-sm">
                              หลังรับบริการ (After)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {afterImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative border border-muted rounded-md w-24 h-24 overflow-hidden"
                                >
                                  <ImageLightbox src={img.imageUrl} alt="After">
                                    <Image
                                      src={img.imageUrl}
                                      alt="After"
                                      fill
                                      sizes="96px"
                                      className="object-cover"
                                    />
                                  </ImageLightbox>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {issueImages.length > 0 && (
                          <div>
                            <p className="flex items-center gap-1 mb-2 font-medium text-destructive text-sm">
                              <AlertTriangle className="w-3 h-3" /> แจ้งปัญหา
                              (Issue)
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {issueImages.map((img) => (
                                <div
                                  key={img.id}
                                  className="relative border border-destructive/30 rounded-md w-24 h-24 overflow-hidden"
                                >
                                  <ImageLightbox src={img.imageUrl} alt="Issue">
                                    <Image
                                      src={img.imageUrl}
                                      alt="Issue"
                                      fill
                                      sizes="96px"
                                      className="object-cover"
                                    />
                                  </ImageLightbox>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </BackOfficeContainer >
    </div >
  );
}
