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
    <main>
      <div className="mx-auto w-full md:w-6xl">
        {/* form card */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="mb-5 w-full"
        >
          <TabsList className="py-5 w-full md:w-1/2">
            <TabsTrigger
              value="new-appointment-requests"
              className="gap-2"
            >
              จองคิวใหม่
              {newAppointmentCount > 0 && (
                <Badge className="px-1.5 rounded-full min-w-5 h-5">
                  {newAppointmentCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="appointment-schedule">ตารางนัดหมาย</TabsTrigger>
          </TabsList>
          <TabsContent value="new-appointment-requests" className="pt-5">
            <NewAppointmentRequests appointments={newAppointmentRequests} />
          </TabsContent>
          <TabsContent value="appointment-schedule">
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
