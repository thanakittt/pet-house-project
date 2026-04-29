"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, PawPrint, Tag, Receipt } from "lucide-react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import {
  getCustomerAppointmentHistory,
  CustomerAppointmentHistory,
} from "@/modules/appointment/queries/get-customer-history";
import { AppointmentStatusBadge } from "@/components/StatusBadge";

interface AppointmentHistoryListProps {
  customerId: string;
}

export function AppointmentHistoryList({
  customerId,
}: AppointmentHistoryListProps) {
  const [history, setHistory] = useState<CustomerAppointmentHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchHistory() {
      setIsLoading(true);
      setError(null);

      const result = await getCustomerAppointmentHistory(customerId);

      if (result.success && result.data) {
        setHistory(result.data);
      } else {
        setError(result.error || "เกิดข้อผิดพลาดในการดึงข้อมูล");
      }

      setIsLoading(false);
    }

    fetchHistory();
  }, [customerId]);

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      CONFIRMED: "bg-blue-100 text-blue-800",
      IN_PROGRESS: "bg-purple-100 text-purple-800",
      COMPLETED: "bg-green-100 text-green-800",
      CANCELLED: "bg-red-100 text-red-800",
    };
    return statusConfig[status] || "bg-gray-100 text-gray-800";
  };

  const formatThaiDate = (dateString: string | Date) => {
    const date = new Date(dateString);
    const dayAndMonth = format(date, "d MMM", { locale: th });
    const buddhistYear = date.getFullYear() + 543;
    return `${dayAndMonth} ${buddhistYear}`;
  };

  if (isLoading) {
    return (
      <div className="p-8 text-muted-foreground text-center animate-pulse">
        กำลังโหลดประวัติการจอง...
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-600 text-sm">
        {error}
      </div>
    );
  }

  if (history.length === 0) {
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
        {history.map((appointment) => {
          // คำนวณข้อมูลสรุป (Summary Data) สำหรับแต่ละการจอง
          const totalPrice = appointment.items.reduce(
            (sum, item) => sum + Number(item.price),
            0,
          );

          // ดึงรายชื่อสัตว์เลี้ยงแบบไม่ซ้ำกัน
          const uniquePets = Array.from(
            new Set(
              appointment.items.map((item) => item.pet?.name || "Unknown"),
            ),
          );
          const petSummary = uniquePets.join(", ");

          // ดึงชื่อบริการหลักแบบไม่ซ้ำกัน
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
              {/* ส่วนซ้าย: วันที่และสถานะ */}
              <div className="flex flex-col gap-1.5 md:w-1/4">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-gray-900 transition-colors">
                    {formatThaiDate(appointment.appointmentDate)}
                  </span>
                </div>
                <div>
                  <AppointmentStatusBadge status={appointment.status} />
                </div>
                <span className="mt-1 font-mono text-gray-400 text-xs">
                  Ref: {appointment.id.split("-")[0]}
                </span>
              </div>

              {/* ส่วนกลาง: สรุปข้อมูลสัตว์เลี้ยงและบริการ */}
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

              {/* ส่วนขวา: ยอดรวม */}
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
    </div>
  );
}
