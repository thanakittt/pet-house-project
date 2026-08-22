"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewAppointmentRequests from "./new-appointment-requests";
import { ScheduleRecord } from "../types/schedule";
import ScheduleCanvas from "./ScheduleCanvas";
import { type ConfirmedAppointmentRequest } from "../queries/get-confirmed-appointment-requests";

interface AppointmentManagementProps {
  initialDate: string;
  appointments: ScheduleRecord[];
  newAppointmentRequests: ConfirmedAppointmentRequest[];
}

export default function AppointmentManagement({
  initialDate,
  appointments,
  newAppointmentRequests,
}: AppointmentManagementProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("appointment-schedule");
  const newAppointmentCount = newAppointmentRequests.length;

  useEffect(() => {
    // Refresh ทุก 30 วินาที เพื่อให้ staff เห็นคำขอที่เพิ่งยืนยันจากลูกค้า
    const intervalId = window.setInterval(() => {
      router.refresh();
    }, 30_000);

    return () => window.clearInterval(intervalId);
  }, [router]);

  return (
    <main className="w-full min-w-0">
      <div className="mx-auto w-full min-w-0 max-w-6xl">
        {/* form card */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-5 w-full min-w-0"
        >
          <TabsList width="half" size="lg" className="mb-4">
            <TabsTrigger
              value="new-appointment-requests"
              className="gap-2 min-w-0"
            >
              <span className="truncate">จองคิวใหม่</span>
              {newAppointmentCount > 0 && (
                <Badge>{newAppointmentCount}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointment-schedule" className="min-w-0">
              <span className="truncate">ตารางนัดหมาย</span>
            </TabsTrigger>
          </TabsList>
          <TabsContent
            value="new-appointment-requests"
            className="min-w-0"
          >
            <NewAppointmentRequests appointments={newAppointmentRequests} />
          </TabsContent>
          <TabsContent value="appointment-schedule" className="min-w-0">
            <ScheduleCanvas
              initialDate={initialDate}
              appointments={appointments}
            />
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
