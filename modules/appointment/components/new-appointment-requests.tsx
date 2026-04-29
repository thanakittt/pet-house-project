"use client";
import { Button } from "@/components/ui/button";
import AppointmentStatus from "./AppointmentStatus";
import { ChevronRight } from "lucide-react";
import Link from "next/link";
const mockData = [
  {
    id: 1,
    name: "John Doe",
    phone: "1234567890",
    service: "อาบน้ำ",
    petType: "cat",
    petName: "ทองม้วน",
    date: "2022-01-01/10:00 AM",
    status: "PENDING_APPROVAL",
  },
  {
    id: 2,
    name: "Jane Doe",
    phone: "1234567890",
    service: "อาบน้ำตัดขน",
    petType: "dog",
    petName: "ทองดี",
    date: "2022-01-01/10:00 AM",
    status: "PENDING_APPROVAL",
  },
  {
    id: 3,
    name: "Jane Doe",
    phone: "1234567890",
    service: "อาบน้ำตัดขน",
    petType: "dog",
    petName: "ทองหยิบ",
    date: "2022-01-01/10:00 AM",
    status: "PENDING_DEPOSIT",
  },
] as const;

export default function NewAppointmentRequests() {
  return (
    <div className="flex flex-col gap-4">
      {mockData.map((item) => (
        <div
          key={item.id}
          className="flex flex-row justify-between items-center gap-4 shadow-sm hover:shadow-md p-6 border border-slate-200 rounded-2xl overflow-hidden transition-shadow"
        >
          <div className="flex-row justify-between items-start space-y-0">
            <div className="flex flex-col gap-1">
              <div className="flex flex-row items-center gap-1">
                <h3 className="font-semibold text-base">{item.petName}</h3>
                <p className="ml-2 text-muted-foreground text-sm">
                  (คุณ {item.name}){" "}
                </p>
              </div>
              <p>{item.service}</p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2">
            <AppointmentStatus status={item.status} />
            {/* ปุ่มกดดูรายละเอียด */}
            <Link href={`/back-office/appointments/${item.id}`}>
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
