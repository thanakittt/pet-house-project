"use client";

import { useRouter } from "next/navigation";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { WaitingPaymentAppointment } from "@/modules/pos/queries/get-waiting-payments";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  User,
  Phone,
  ArrowRight,
  Receipt,
  CheckCircle2,
  PawPrint,
} from "lucide-react";
import { formatPhoneNumber, formatThaiDate } from "@/lib/utils";

interface WaitingPaymentListProps {
  appointments: WaitingPaymentAppointment[];
}

export function WaitingPaymentList({ appointments }: WaitingPaymentListProps) {
  const router = useRouter();

  // 1. Empty State Design: ทำให้ดูนุ่มนวลและสื่อสารเชิงบวก (Positive Feedback)
  if (appointments.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center bg-muted/20 mx-auto mt-8 p-12 sm:p-16 border-2 border-muted-foreground/20 border-dashed rounded-2xl max-w-2xl text-center">
        <div className="flex justify-center items-center bg-primary/10 mb-6 rounded-full w-20 h-20 text-primary">
          <CheckCircle2 size={40} strokeWidth={2.5} />
        </div>
        <h3 className="mb-2 font-bold text-foreground text-xl tracking-tight">
          ไม่มีรายการรอชำระเงิน
        </h3>
        <p className="max-w-sm text-muted-foreground text-sm">
          ยอดเยี่ยม!
          ลูกค้าทุกท่านได้รับการบริการและชำระเงินเรียบร้อยแล้วในขณะนี้
        </p>
      </div>
    );
  }

  return (
    <div className="gap-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
      {appointments.map((apt) => {
        const totalAmount = apt.items.reduce(
          (sum, item) => sum + Number(item.price),
          0,
        );
        const uniquePets = Array.from(
          new Set(apt.items.map((item) => item.pet.name)),
        );

        return (
          // 2. Card Design: เพิ่ม Interactive Hover State และ Top Accent Line
          <Card
            key={apt.id}
            className="group relative flex flex-col shadow-sm hover:shadow-lg p-0 border-border/60 hover:border-primary/40 overflow-hidden transition-all duration-300"
          >
            <CardContent className="flex-1 p-6">
              {/* Header: Status & Time */}
              <div className="flex justify-between items-center mb-5">
                <AppointmentStatusBadge
                  status="READY_FOR_PICKUP"
                  withIcon
                  className="hover:bg-muted"
                />
                <span className="font-medium text-[13px] text-muted-foreground">
                  {formatThaiDate(apt.appointmentDate)}
                </span>
              </div>

              {/* Body: Customer & Pet Info */}
              <div className="space-y-4">
                {/* Customer */}
                <div className="flex items-start gap-3.5">
                  <div className="flex justify-center items-center bg-primary/10 rounded-full w-9 h-9 text-primary shrink-0">
                    <User size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="font-semibold text-foreground text-sm truncate">
                      {apt.customer.nickname}
                    </p>
                    {apt.customer.walkInPhoneNumber ? (
                      <p className="flex items-center mt-1 font-medium text-muted-foreground text-xs truncate">
                        <Phone size={12} className="mr-1.5 shrink-0" />
                        {formatPhoneNumber(apt.customer.walkInPhoneNumber)}
                      </p>
                    ) : (
                      <p className="mt-1 text-muted-foreground/50 text-xs italic">
                        ไม่มีเบอร์โทรศัพท์
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="bg-border/60" />

                {/* Pets */}
                <div className="flex items-start gap-3.5">
                  <div className="flex justify-center items-center bg-secondary rounded-full w-9 h-9 text-secondary-foreground shrink-0">
                    <PawPrint size={18} />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <p className="font-medium text-foreground text-sm truncate">
                      น้อง {uniquePets.join(", ")}
                    </p>
                    <p className="flex items-center mt-1 text-muted-foreground text-xs">
                      <Receipt size={12} className="mr-1.5" />{" "}
                      {apt.items.length} รายการบริการ
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>

            {/* 3. Footer Design: เน้นตัวเลขราคาให้ชัดเจน และปุ่มมี Affordance */}
            <CardFooter className="flex justify-between items-end bg-muted/40 p-6 pt-5 border-border/50 border-t">
              <div>
                <p className="mb-1 font-medium text-[11px] text-muted-foreground uppercase tracking-wider">
                  ยอดรวมเบื้องต้น
                </p>
                <p className="font-bold text-primary text-2xl leading-none tracking-tight">
                  ฿{totalAmount.toLocaleString()}
                </p>
              </div>
              <Button
                onClick={() => router.push(`/back-office/pos/${apt.id}`)}
                className="max-lg:hidden shadow-sm group-hover:shadow-md transition-all"
              >
                ทำรายการ
                <ArrowRight
                  size={16}
                  className="ml-2 transition-transform group-hover:translate-x-1 duration-200"
                />
              </Button>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
