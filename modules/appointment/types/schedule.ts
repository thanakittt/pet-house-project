import { AppointmentStatus } from "./status";

export interface ScheduleRecord {
  id: string; // appointmentId
  petId: string;
  petName: string;
  customerName: string;
  serviceNames: string;
  startTimeIso: string;
  endTimeIso: string;
  status: AppointmentStatus;
}