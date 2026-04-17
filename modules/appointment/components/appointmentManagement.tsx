import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewAppointmentRequests from "./new-appointment-requests";
import { ScheduleRecord } from "../types/schedule";
import ScheduleCanvas from "./ScheduleCanvas";

interface AppointmentManagementProps {
  initialDate: string;
  appointments: ScheduleRecord[];
}

export default function AppointmentManagement({
  initialDate,
  appointments,
}: AppointmentManagementProps) {
  return (
    <main className="p-5">
      <div className="mx-auto w-full md:w-6xl">
        {/* form card */}
        <Tabs defaultValue="appointment-schedule" className="mb-5 w-full">
          <TabsList className="py-5 w-full md:w-1/2">
            <TabsTrigger value="new-appointment-requests" disabled>
              คำขอจองคิวใหม่
            </TabsTrigger>
            <TabsTrigger value="appointment-schedule">ตารางนัดหมาย</TabsTrigger>
          </TabsList>
          <TabsContent value="new-appointment-requests" className="pt-5">
            <NewAppointmentRequests />
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
