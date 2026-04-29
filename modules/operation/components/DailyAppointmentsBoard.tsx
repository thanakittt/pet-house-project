"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import { th } from "date-fns/locale";
import { Clock, Scissors, User, ChevronRight } from "lucide-react";
import Link from "next/link";

// shadcn/ui components
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppointmentStatusBadge } from "@/components/StatusBadge"; // สมมติว่าคุณมี Component นี้แล้ว
import { type TodayAppointmentsResult } from "../queries/get-today-appointments";

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

// กำหนด Type ใหม่สำหรับข้อมูลที่ถูกจัดกลุ่มแล้ว
type GroupedAppointmentItem = {
  id: string; // ใช้ ID ของ item แรกสำหรับเป็น Link อ้างอิง
  appointmentId: string;
  petId: string;
  status: AppointmentStatus;
  startTime: Date;
  customerName: string;
  pet: { id: string; name: string; breed: { name: string } };
  services: string[]; // เก็บรายการบริการทั้งหมดของสัตว์เลี้ยงตัวนี้ในบิลนี้
};

interface Props {
  initialAppointments: TodayAppointmentsResult;
}

export default function DailyAppointmentsBoard({ initialAppointments }: Props) {
  // จัดกลุ่มข้อมูลด้วย appointmentId และ petId
  const groupedItems: GroupedAppointmentItem[] = useMemo(() => {
    const groups = new Map<string, GroupedAppointmentItem>();

    initialAppointments.forEach((app) => {
      app.items.forEach((item) => {
        // สร้าง Composite Key เพื่อใช้จัดกลุ่ม
        const key = `${app.id}-${item.pet.id}`;
        const serviceName = item.serviceVariant.service.name;

        if (!groups.has(key)) {
          groups.set(key, {
            id: item.id,
            appointmentId: app.id,
            petId: item.pet.id,
            status: app.status as AppointmentStatus,
            startTime: new Date(item.startTime),
            customerName: app.customer.nickname,
            pet: item.pet,
            services: [serviceName], // เริ่มต้น Array บริการ
          });
        } else {
          const existingGroup = groups.get(key)!;
          // เพิ่มบริการเข้าไปใน Array ถ้ายังไม่มี
          if (!existingGroup.services.includes(serviceName)) {
            existingGroup.services.push(serviceName);
          }
          // อัปเดต startTime ให้เป็นเวลาที่เช้าที่สุดของกลุ่ม
          const itemStartTime = new Date(item.startTime);
          if (itemStartTime < existingGroup.startTime) {
            existingGroup.startTime = itemStartTime;
          }
        }
      });
    });

    return Array.from(groups.values());
  }, [initialAppointments]);

  // กรองตามหมวดหมู่คอลัมน์
  const pendingItems = groupedItems.filter((i) =>
    ["PENDING_DEPOSIT", "PENDING_APPROVAL", "CONFIRMED", "CHECKED_IN"].includes(
      i.status,
    ),
  );
  const inProgressItems = groupedItems.filter(
    (i) => i.status === "IN_PROGRESS",
  );
  const completedItems = groupedItems.filter((i) =>
    ["READY_FOR_PICKUP", "COMPLETED"].includes(i.status),
  );

  return (
    <div className="flex flex-col gap-6">
      {/* Summary Header Cards */}
      <div className="gap-4 grid grid-cols-1 md:grid-cols-3">
        <SummaryCard
          title="รอดำเนินการ"
          count={pendingItems.length}
          colorText="text-yellow-600"
        />
        <SummaryCard
          title="กำลังทำ"
          count={inProgressItems.length}
          colorText="text-blue-600"
        />
        <SummaryCard
          title="เสร็จสิ้น / รอรับกลับ"
          count={completedItems.length}
          colorText="text-green-600"
        />
      </div>

      {/* Kanban Board Columns */}
      <div className="items-start gap-6 grid grid-cols-1 md:grid-cols-3">
        <Column
          title="รอดำเนินการ"
          items={pendingItems}
          borderColor="border-l-yellow-400"
        />
        <Column
          title="กำลังทำ"
          items={inProgressItems}
          borderColor="border-l-blue-500"
        />
        <Column
          title="เสร็จสิ้น"
          items={completedItems}
          borderColor="border-l-green-500"
        />
      </div>
    </div>
  );
}

// --- Sub Components ---

function SummaryCard({
  title,
  count,
  colorText,
}: {
  title: string;
  count: number;
  colorText: string;
}) {
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="font-medium text-muted-foreground text-sm">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`text-3xl font-bold ${colorText}`}>{count}</div>
      </CardContent>
    </Card>
  );
}

function Column({
  title,
  items,
  borderColor,
}: {
  title: string;
  items: GroupedAppointmentItem[];
  borderColor: string;
}) {
  return (
    <div className="flex flex-col gap-4">
      {items.map((item) => (
        <Card
          key={`${item.appointmentId}-${item.petId}`}
          className={`shadow-sm border-l-4 ${borderColor}`}
        >
          <CardHeader className="p-4 pb-2">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-lg">
                  {item.pet.name}
                  <Badge variant="secondary" className="font-normal text-xs">
                    {item.pet.breed.name}
                  </Badge>
                </CardTitle>
              </div>
              <AppointmentStatusBadge status={item.status} />
            </div>
          </CardHeader>

          <CardContent className="space-y-2 p-4 py-2 text-muted-foreground text-sm">
            <div className="flex items-center gap-2">
              <Clock className="w-4 min-w-4 h-4 text-muted-foreground/70" />
              {format(item.startTime, "HH:mm น.", { locale: th })}
            </div>
            <div className="flex items-start gap-2">
              <Scissors className="mt-0.5 w-4 min-w-4 h-4 text-muted-foreground/70" />
              {/* Join ชื่อบริการทั้งหมดด้วยเครื่องหมายลูกน้ำ */}
              <span className="leading-snug">{item.services.join(" + ")}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="w-4 min-w-4 h-4 text-muted-foreground/70" />
              คุณ{item.customerName}
            </div>
          </CardContent>

          <CardFooter className="flex justify-between items-center mt-2 p-4 pt-3 border-t text-muted-foreground text-xs">
            <span>ID: {item.appointmentId.slice(0, 8).toUpperCase()}</span>
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hover:bg-blue-50 h-8 text-blue-600 hover:text-blue-700"
            >
              <Link href={`/back-office/operations/${item.appointmentId}/${item.petId}`}>
                ดูรายละเอียด
                <ChevronRight className="ml-1 w-4 h-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      ))}

      {items.length === 0 && (
        <div className="bg-muted/20 p-6 border-2 border-dashed rounded-xl text-muted-foreground text-center">
          ไม่มีรายการ
        </div>
      )}
    </div>
  );
}
