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
      <div className="rounded-lg bg-red-50 p-4 text-sm text-red-600">
        {appointmentHistory.error}
      </div>
    );
  }

  const { appointments, page, pageSize, total, totalPages } =
    appointmentHistory.data;

  if (appointments.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed bg-gray-50 p-8 text-center text-muted-foreground">
        ยังไม่มีประวัติการจองสำหรับลูกค้ารายนี้
      </div>
    );
  }

  return (
    <div className="mt-8 space-y-4">
      <h2 className="flex items-center gap-2 text-lg font-bold">
        <Calendar size={20} />
        ประวัติการรับบริการ
      </h2>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
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
              className="group flex cursor-pointer flex-col justify-between gap-4 rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-gray-300 hover:shadow-md md:flex-row md:items-center"
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
                <span className="mt-1 font-mono text-xs text-gray-400">
                  Ref: {appointment.id.split("-")[0]}
                </span>
              </div>

              <div className="flex flex-1 flex-col gap-2 rounded-lg border border-gray-100 bg-gray-50 p-3 transition-colors group-hover:bg-blue-50/50">
                <div className="flex items-start gap-2 text-sm text-gray-700">
                  <PawPrint
                    size={16}
                    className="mt-0.5 shrink-0 text-gray-400"
                  />
                  <span className="line-clamp-1" title={petSummary}>
                    {petSummary || "-"}
                  </span>
                </div>
                <div className="flex items-start gap-2 text-sm text-gray-600">
                  <Tag size={16} className="mt-0.5 shrink-0 text-gray-400" />
                  <span className="line-clamp-1" title={serviceSummary}>
                    {serviceSummary || "-"}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between gap-1 md:w-1/4 md:flex-col md:items-end md:justify-end">
                <div className="flex items-center gap-1.5 text-xs text-gray-500 md:hidden">
                  <Receipt size={14} />
                  <span>ยอดรวม</span>
                </div>
                <div className="text-base font-bold text-gray-900">
                  ฿{totalPrice.toLocaleString()}
                </div>
                <div className="hidden items-center gap-1 text-xs text-gray-500 md:flex">
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
