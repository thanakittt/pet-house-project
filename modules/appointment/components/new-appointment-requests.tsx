"use client";

import AppointmentStatus from "./AppointmentStatus";
import { CalendarDays, ChevronRight, Scissors } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { formatThaiDate } from "@/lib/utils";
import { type ConfirmedAppointmentRequest } from "../queries/get-confirmed-appointment-requests";

interface NewAppointmentRequestsProps {
  appointments: ConfirmedAppointmentRequest[];
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
      <div className="bg-slate-50 p-8 border border-dashed rounded-lg text-muted-foreground text-sm text-center">
        ยังไม่มีคำขอจองคิวใหม่ที่ยืนยันแล้ว
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 min-w-0">
      {appointments.map((appointment) => (
        <Link
          key={appointment.id}
          href={`/back-office/appointments/${appointment.id}`}
          className="group flex md:flex-row flex-col justify-between md:items-center gap-4 bg-white hover:bg-slate-50/50 shadow-sm hover:shadow-md p-4 sm:p-5 border rounded-lg min-w-0 overflow-hidden transition-all cursor-pointer"
        >
          <div className="flex flex-col gap-3 min-w-0">
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 min-w-0">
                <h3 className="min-w-0 font-semibold text-base break-words">
                  {getPetNames(appointment) || "-"}
                </h3>
                <p className="text-muted-foreground text-sm break-words">
                  (คุณ {appointment.customer.nickname})
                </p>
              </div>

              <div className="flex items-start gap-2 min-w-0 text-muted-foreground text-sm">
                <Scissors size={15} className="mt-0.5 shrink-0" />
                <span className="min-w-0 break-words">
                  {getServiceNames(appointment) || "-"}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 min-w-0 text-muted-foreground text-sm">
              <div className="flex items-center gap-1.5 min-w-0">
                <CalendarDays size={15} className="shrink-0" />
                <span className="break-words">
                  {formatThaiDate(appointment.appointmentDate)} เวลา{" "}
                  {formatAppointmentTime(appointment)}
                </span>
              </div>
            </div>
          </div>

          <div className="flex sm:flex-row flex-col md:flex-col items-stretch sm:items-center md:items-end gap-3 md:gap-2">
            <AppointmentStatus status={appointment.status} />

            {/* เปลี่ยนจากปุ่มเป็นข้อความที่มีไอคอน เพื่อหลีกเลี่ยง Nested Interactive Elements (<button> ใน <a>) */}
            <div className="flex justify-center sm:justify-end items-center gap-1 py-1 font-medium text-muted-foreground group-hover:text-primary text-sm transition-colors">
              ดูรายละเอียด
              <ChevronRight
                size={16}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </div>
          </div>
        </Link>
      ))}
    </div>
  );
}
