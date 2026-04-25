import { notFound } from "next/navigation";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { getAppointmentDetail } from "@/modules/appointment/queries/get-appointment-detail";
import AppointmentStatusManager from "@/modules/appointment/components/AppointmentStatusManage";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";

import { requireStaff } from "@/lib/session";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";
import Link from "next/link";

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
    notFound(); // หากไม่พบคิวนี้ ให้แสดงหน้า 404
  }

  const appointment = result.data;

  return (
    <div>
      <SiteHeader title="รายละเอียดการจอง" />

      <main className="space-y-6 mx-auto p-6 w-full">
        <Button
          variant="outline"
          asChild
        >
          <Link href="/appointments">
            <ChevronLeft className="mr-2 w-4 h-4" />
            กลับ
          </Link>
        </Button>
        {/* 1. Header & Status Manager */}
        <div className="bg-white shadow-sm p-6 border border-slate-200 rounded-2xl">
          <div className="flex justify-between items-start mb-6 pb-4 border-b">
            <div>
              <h1 className="font-bold text-slate-800 text-2xl">
                รหัสการจอง: {appointment.id.split("-")[0].toUpperCase()}
              </h1>
              <p className="mt-1 text-slate-500">
                วันที่:{" "}
                {format(new Date(appointment.date), "dd MMMM yyyy", {
                  locale: th,
                })}
              </p>
            </div>
            <div className="text-right">
              <p className="text-slate-500 text-sm">ราคารวมโดยประมาณ</p>
              <p className="font-bold text-primary text-2xl">
                ฿{appointment.totalPrice.toLocaleString()}
              </p>
            </div>
          </div>

          {/* เรียกใช้ Client Component สำหรับปุ่มเปลี่ยนสถานะ */}
          <AppointmentStatusManager
            appointmentId={appointment.id}
            currentStatus={appointment.status}
          />
        </div>
        {/* 2. ข้อมูลลูกค้า */}
        <div className="bg-white shadow-sm p-6 border border-slate-200 rounded-2xl">
          <h2 className="mb-4 font-semibold text-slate-800 text-lg">
            ข้อมูลลูกค้า
          </h2>
          <div className="gap-4 grid grid-cols-2">
            <div>
              <p className="mb-1 text-slate-500 text-sm">ชื่อลูกค้า</p>
              <p className="font-medium">{appointment.customer.name}</p>
            </div>
            <div>
              <p className="mb-1 text-slate-500 text-sm">เบอร์โทรศัพท์</p>
              <p className="font-medium">
                {appointment.customer.walkInPhoneNumber || "-"}
              </p>
            </div>
            {appointment.note && (
              <div className="col-span-2 bg-yellow-50 mt-2 p-3 border border-yellow-200 rounded-md text-yellow-800 text-sm">
                <span className="font-semibold">หมายเหตุ: </span>{" "}
                {appointment.note}
              </div>
            )}
          </div>
        </div>
        {/* 3. ข้อมูลสัตว์เลี้ยงและบริการ */}
        <div className="space-y-4">
          <h2 className="px-2 font-semibold text-slate-800 text-lg">
            สัตว์เลี้ยงที่เข้ารับบริการ ({appointment.pets.length} ตัว)
          </h2>

          {appointment.pets.map((pet: PetWithServices, index: number) => (
            <div
              key={pet.petId}
              className="bg-white shadow-sm p-6 border border-slate-200 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-4 pb-4 border-b">
                <div className="flex justify-center items-center bg-primary/10 rounded-full w-10 h-10 font-bold text-primary">
                  {index + 1}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg">
                    {pet.petName}
                  </h3>
                  <p className="text-slate-500 text-sm">
                    {PET_TYPE_LABELS[pet.petType]} - {pet.petBreed}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {pet.services.map((service) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-center bg-slate-50 p-3 border border-slate-100 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-slate-800">
                        {service.name}{" "}
                        <span className="font-normal text-slate-500 text-sm">
                          ({PET_SIZE_LABELS[service.size]})
                        </span>
                      </p>
                      <p className="mt-1 text-slate-500 text-xs">
                        เวลา: {format(parseISO(service.startTime), "HH:mm")} -{" "}
                        {format(parseISO(service.endTime), "HH:mm")}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-800">
                      ฿{service.price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
