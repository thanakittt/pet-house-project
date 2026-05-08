"use client";

import { Button } from "@/components/ui/button";
import AppointmentStatus from "./AppointmentStatus";
import { CalendarDays, ChevronRight, PawPrint, Scissors } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { type ConfirmedAppointmentRequest } from "../queries/get-confirmed-appointment-requests";

interface NewAppointmentRequestsProps {
  appointments: ConfirmedAppointmentRequest[];
}

function formatThaiDate(dateString: string) {
  const date = new Date(dateString);
  const dayAndMonth = format(date, "d MMM", { locale: th });
  const buddhistYear = date.getFullYear() + 543;

  return `${dayAndMonth} ${buddhistYear}`;
}

function formatAppointmentTime(appointment: ConfirmedAppointmentRequest) {
  const firstItem = appointment.items[0];

  if (!firstItem) {
    return "-";
  }

  return format(firstItem.startTime, "HH:mm", { locale: th });
}

function getPetNames(appointment: ConfirmedAppointmentRequest) {
  // รวมชื่อสัตว์เลี้ยงแบบไม่ซ้ำ เพราะ 1 ตัวอาจมีหลาย service item
  const petNames = appointment.items.map((item) => item.pet.name);
  const uniquePetNames = Array.from(new Set(petNames));

  return uniquePetNames.join(", ");
}

function getServiceNames(appointment: ConfirmedAppointmentRequest) {
  // รวมชื่อบริการแบบไม่ซ้ำ เพื่อให้การ์ดอ่านง่ายแม้มีหลายรายการในนัดเดียว
  const serviceNames = appointment.items.map(
    (item) => item.serviceVariant.service.name,
  );
  const uniqueServiceNames = Array.from(new Set(serviceNames));

  return uniqueServiceNames.join(", ");
}

export default function NewAppointmentRequests({
  appointments,
}: NewAppointmentRequestsProps) {
  if (appointments.length === 0) {
    return (
      <div className="rounded-lg border border-dashed bg-slate-50 p-8 text-center text-sm text-muted-foreground">
        ยังไม่มีคำขอจองคิวใหม่ที่ยืนยันแล้ว
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {appointments.map((appointment) => (
        <div
          key={appointment.id}
          className="flex flex-col justify-between gap-4 overflow-hidden rounded-lg border border-slate-200 p-5 shadow-sm transition-shadow hover:shadow-md md:flex-row md:items-center"
        >
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-base font-semibold">
                  {getPetNames(appointment) || "-"}
                </h3>
                <p className="text-sm text-muted-foreground">
                  (คุณ {appointment.customer.nickname})
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Scissors size={15} className="shrink-0" />
                <span>{getServiceNames(appointment) || "-"}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={15} />
                <span>
                  {formatThaiDate(appointment.appointmentDate)} เวลา{" "}
                  {formatAppointmentTime(appointment)}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <PawPrint size={15} />
                <span>{appointment.items.length} รายการบริการ</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <AppointmentStatus status={appointment.status} />
            {/* ปุ่มกดดูรายละเอียด */}
            <Link href={`/back-office/appointments/${appointment.id}`}>
              <Button variant="ghost" size="default">
                ดูรายละเอียด
                <ChevronRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
