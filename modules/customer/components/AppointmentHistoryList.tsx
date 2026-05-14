"use client";

import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { ManagementPagination } from "@/components/shared/ManagementListControls";
import { formatThaiDate } from "@/lib/utils";
import { type CustomerAppointmentHistoryResult } from "@/modules/appointment/queries/get-customer-history";
import { type ActionResponse } from "@/types/action";
import { Calendar, PawPrint, Receipt, Tag } from "lucide-react";
import Link from "next/link";

interface AppointmentHistoryListProps {
  appointmentHistory: ActionResponse<CustomerAppointmentHistoryResult>;
}

export function AppointmentHistoryList({
  appointmentHistory,
}: AppointmentHistoryListProps) {
  if (!appointmentHistory.success) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600 text-sm">
        {appointmentHistory.error}
      </div>
    );
  }

  const { appointments, page, pageSize, total, totalPages } =
    appointmentHistory.data;

  if (appointments.length === 0) {
    return (
      <div className="bg-gray-50 p-8 border-2 border-dashed rounded-xl text-muted-foreground text-center">
        ยังไม่มีประวัติการจองสำหรับลูกค้ารายนี้
      </div>
    );
  }

  return (
    <div className="space-y-4 mt-8">
      <h2 className="flex items-center gap-2 font-bold text-lg">
        <Calendar size={20} />
        ประวัติการรับบริการ
      </h2>

      <div className="gap-3 grid sm:grid-cols-2 lg:grid-cols-1">
        {appointments.map((appointment) => {
          const totalPrice = appointment.items.reduce(
            (sum, item) => sum + Number(item.price),
            0,
          );

          const uniquePets = Array.from(
            new Set(
              appointment.items.map((item) => item.pet?.name || "Unknown"),
            ),
          );
          const petSummary = uniquePets.join(", ");

          const uniqueServices = Array.from(
            new Set(
              appointment.items.map(
                (item) => item.serviceVariant?.service?.name,
              ),
            ),
          );
          const serviceSummary = uniqueServices.join(", ");

          return (
            <Link
              key={appointment.id}
              href={`/back-office/appointments/${appointment.id}`}
              className="group flex md:flex-row flex-col justify-between md:items-center gap-4 bg-white shadow-sm hover:shadow-md p-4 border hover:border-gray-300 rounded-xl transition-all cursor-pointer"
            >
              <div className="flex flex-col gap-1.5 md:w-1/4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 transition-colors">
                    {formatThaiDate(appointment.appointmentDate)}
                  </span>
                </div>
                <div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
              </div>

              <div className="flex flex-col flex-1 gap-2 bg-gray-50 group-hover:bg-blue-50/50 p-3 border border-gray-100 rounded-lg transition-colors">
                <div className="flex items-start gap-2 text-gray-700 text-sm">
                  <PawPrint
                    size={16}
                    className="mt-0.5 text-gray-400 shrink-0"
                  />
                  <span className="line-clamp-1" title={petSummary}>
                    {petSummary || "-"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-gray-600 text-sm">
                  <Tag size={16} className="mt-0.5 text-gray-400 shrink-0" />
                  <span className="line-clamp-1" title={serviceSummary}>
                    {serviceSummary || "-"}
                  </span>
                </div>
              </div>

              <div className="flex md:flex-col justify-between md:justify-end items-center md:items-end gap-1 md:w-1/4">
                <div className="md:hidden flex items-center gap-1.5 text-gray-500 text-xs">
                  <Receipt size={14} />
                  <span>ยอดรวม</span>
                </div>
                <div className="font-bold text-gray-900 text-base">
                  ฿{totalPrice.toLocaleString()}
                </div>
                <div className="hidden md:flex items-center gap-1 text-gray-500 text-xs">
                  <Receipt size={12} /> {appointment.items.length} รายการ
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <ManagementPagination
        page={page}
        pageParamName="historyPage"
        pageSize={pageSize}
        total={total}
        totalPages={totalPages}
      />
    </div>
  );
}
