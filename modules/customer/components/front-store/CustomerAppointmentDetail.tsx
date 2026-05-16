"use client";

import BackButton from "@/components/BackButton";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { Button } from "@/components/ui/button";
import { cn, formatThaiDate } from "@/lib/utils";
import type { CustomerAppointmentDetail } from "@/modules/appointment/queries/get-customer-appointment-detail";
import PetTypeBadge from "@/modules/pet/components/PetTypeBadge";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  Circle,
  Clock,
  ExternalLink,
  MapPin,
  Phone,
  Printer,
  Scissors,
  Store,
} from "lucide-react";
import Link from "next/link";

type CustomerAppointmentDetailsProps = {
  appointment: CustomerAppointmentDetail;
};

const STEPS = [
  { key: "booking", label: "จองสำเร็จ" },
  { key: "confirmed", label: "ยืนยันนัด" },
  { key: "processing", label: "กำลังทำ" },
  { key: "completed", label: "เสร็จสิ้น" },
];

function getStepIndex(status: CustomerAppointmentDetail["status"]) {
  if (status === "COMPLETED") {
    return 3;
  }

  if (
    status === "CHECKED_IN" ||
    status === "IN_PROGRESS" ||
    status === "READY_FOR_PICKUP"
  ) {
    return 2;
  }

  if (status === "CONFIRMED") {
    return 1;
  }

  return 0;
}

function isTerminalStatus(status: CustomerAppointmentDetail["status"]) {
  return status === "CANCELLED" || status === "NO_SHOW";
}

function formatDate(date: string) {
  return formatThaiDate(date);
}

function formatTime(time: string) {
  if (!time) {
    return "-";
  }

  return format(parseISO(time), "HH:mm", { locale: th });
}

function getPetTypeForBadge(species: "DOG" | "CAT") {
  return species.toLowerCase();
}

export default function CustomerAppointmentDetails({
  appointment,
}: CustomerAppointmentDetailsProps) {
  const currentStepIndex = getStepIndex(appointment.status);
  const firstPet = appointment.pets[0];
  const receiptItems = appointment.pets.flatMap((pet) =>
    pet.services.map((service) => ({
      ...service,
      petName: pet.name,
    })),
  );

  return (
    <main className="space-y-8 mx-auto max-w-5xl p-6 lg:p-8">
      <BackButton href="/" />
      <div className="animate-in fade-in  bg-white shadow-sm hover:shadow-md p-6 md:p-8 border rounded-2xl h-full text-center transition-all duration-300">
        {isTerminalStatus(appointment.status) ? (
          <div className="relative bg-white shadow-slate-200/30 shadow-xl p-8 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="font-bold text-primary text-lg">
                  สถานะการนัดหมาย
                </h2>
                <p className="mt-1 text-muted-foreground text-sm">
                  รายการนี้ไม่อยู่ในขั้นตอนให้บริการตามปกติ
                </p>
              </div>
              <AppointmentStatusBadge
                status={appointment.status}
                size="md"
                className="w-fit px-4 py-1.5 font-semibold"
              />
            </div>
          </div >
        ) : (
          <div className="relative bg-white shadow-slate-200/30 shadow-xl p-10 border border-slate-100 rounded-2xl overflow-hidden">
            <div className="relative flex justify-between w-full">
              <div className="top-5 left-0 absolute bg-slate-100 w-full h-[2px]" />

              <div
                className="top-5 left-0 absolute bg-primary h-[2px] transition-all duration-1000 ease-in-out"
                style={{
                  width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%`,
                }}
              />

              {STEPS.map((step, index) => {
                const isCompleted = index <= currentStepIndex;
                const isCurrent = index === currentStepIndex;

                return (
                  <div
                    key={step.key}
                    className="group z-10 flex flex-col items-center gap-4 w-16"
                  >
                    <div
                      className={cn(
                        "flex justify-center items-center border-2 rounded-full size-10 transition-all duration-500",
                        isCompleted
                          ? "bg-primary border-primary text-white shadow-lg"
                          : "bg-white border-slate-200 text-muted-foreground",
                        isCurrent && "ring-4 ring-primary/10 scale-110",
                      )}
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="size-5" />
                      ) : (
                        <Circle className="size-4" />
                      )}
                    </div>
                    <span
                      className={cn(
                        "font-bold text-xs md:text-xs tracking-tight transition-colors",
                        isCompleted ? "text-primary" : "text-muted-foreground",
                      )}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div >
        )}

        <div className="gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3 ">
          <div className="space-y-6 lg:col-span-2">
            <div className="bg-white shadow-sm border-0 rounded-2xl overflow-hidden">
              <div className="space-y-6 p-6 md:p-8">
                <div className="flex items-center gap-3">
                  <div className="bg-blue-50 p-2 rounded-lg text-blue-600">
                    <Calendar className="size-5 md:size-6" />
                  </div>
                  <h2 className="font-bold text-primary text-lg md:text-xl">
                    ข้อมูลการนัดหมาย
                  </h2>
                </div>

                <div className="flex gap-4 items-center">
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-1 font-medium text-muted-foreground text-sm">
                      <Calendar className="size-3" />
                      วันที่เข้ารับบริการ
                    </div>
                    <p className="font-bold text-primary text-lg md:text-xl text-start pl-2">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                  <div className="space-y-2 w-full">
                    <div className="flex items-center gap-1 font-medium text-muted-foreground text-sm">
                      <Clock className="size-3" />
                      เวลาเข้าใช้บริการ
                    </div>
                    <p className="font-bold text-primary text-lg md:text-xl text-start pl-2">
                      {formatTime(appointment.startTime)} น.
                    </p>
                  </div>
                </div>

                {firstPet ? (
                  <div className="flex items-center gap-5 shadow-sm p-5 md:p-6 border border-slate-100 rounded-2xl">
                    <div className="shrink-0">
                      <PetTypeBadge
                        type={getPetTypeForBadge(firstPet.species)}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-lg md:text-xl">
                        {firstPet.name}
                      </h3>
                      <p className="font-medium text-muted-foreground text-sm md:text-base">
                        {firstPet.breed}
                      </p>
                    </div>
                    <AppointmentStatusBadge
                      status={appointment.status}
                      size="md"
                      className="hidden px-3 py-1 font-semibold sm:inline-flex"
                    />
                  </div>
                ) : null}

                {appointment.pets.length > 1 ? (
                  <div className="space-y-3">
                    {appointment.pets.slice(1).map((pet) => (
                      <div
                        key={pet.petId}
                        className="flex items-center gap-4 shadow-sm p-4 border border-slate-100 rounded-2xl"
                      >
                        <PetTypeBadge type={getPetTypeForBadge(pet.species)} />
                        <div>
                          <p className="font-bold text-primary">{pet.name}</p>
                          <p className="text-muted-foreground text-sm">
                            {pet.breed}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div >
            <Link href="https://maps.app.goo.gl/4zDGa6djFfVKGq5RA" target="_blank" rel="noopener noreferrer">
              <div className="bg-white shadow-sm p-6 md:p-8 border border-slate-100 rounded-2xl">
                <div className="flex md:flex-row flex-col justify-between gap-6">
                  <div className="space-y-4">
                    <div className="flex flex-col items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="bg-primary p-2 rounded-lg">
                          <Store className="size-4 text-white" />
                        </div>
                        <p className=" font-bold text-lg text-primary uppercase ">
                          Pet House
                        </p>
                      </div >
                      <p className="mt-2 text-primary text-base leading-relaxed text-left">
                        181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เชียงใหม่ จ.เชียงใหม่
                        50300
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="default"
                      className="hidden md:inline-flex hover:bg-muted size-11 active:scale-95 w-full"
                    >
                      <Link
                        href="https://maps.app.goo.gl/4zDGa6djFfVKGq5RA"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="size-5" />
                      </Link>
                    </Button>

                  </div>
                </div>
              </div >
            </Link >
          </div>

          <div className="lg:col-span-1">
            <div className="lg:top-24 relative lg:sticky shadow-2xl shadow-slate-200/50 p-8 border border-slate-100 rounded-2xl overflow-hidden text-primary">
              <div className="-right-10 -bottom-10 absolute opacity-[0.03] rotate-12 pointer-events-none">
                <Scissors className="size-48" />
              </div>

              <h2 className="pb-6 font-bold text-primary text-lg">
                สรุปยอดชำระ
              </h2>

              <div className="space-y-2">
                {receiptItems.map((service) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-start"
                  >
                    <span className="font-medium text-muted-foreground text-sm">
                      {service.name}
                      {appointment.pets.length > 1 ? ` (${service.petName})` : ""}
                    </span>
                    <span className="font-bold text-primary text-base tracking-tighter whitespace-nowrap">
                      ฿{service.price.toLocaleString()}
                    </span>
                  </div>
                ))}

                <div className="space-y-4 mt-6 pt-6 border-muted border-t">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="font-black text-primary text-lg">
                        รวมทั้งหมด
                      </p>
                    </div>
                    <span className="font-black text-primary text-3xl tracking-tighter">
                      ฿{appointment.total.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="z-10 relative space-y-4 mt-10">
                {appointment.status === "COMPLETED" ? (
                  <Button
                    asChild
                    variant="default"
                    size="default"
                    className="hover:bg-primary/90 w-full transition-all"
                  >
                    <Link href={`/receipt/${appointment.id}`}>
                      <Printer className="mr-2 size-4 transition-transform" />
                      พิมพ์ใบเสร็จ
                    </Link>
                  </Button>
                ) : (
                  <Button
                    variant="default"
                    size="default"
                    className="hover:bg-primary/90 w-full transition-all"
                    disabled
                  >
                    <Printer className="mr-2 size-4 transition-transform" />
                    พิมพ์ใบเสร็จ
                  </Button>
                )}
                <p className="px-2 font-medium text-muted-foreground text-xs text-center leading-relaxed">
                  กรุณาแสดงหน้านี้ให้เจ้าหน้าที่สแกนเมื่อเข้ารับบริการตามเวลานัดหมาย
                </p>
              </div>

              <div className="bottom-0 left-0 absolute flex gap-1 opacity-20 w-full h-1.5">
                {[...Array(20)].map((_, index) => (
                  <div
                    key={index}
                    className="flex-1 bg-slate-200 rounded-full translate-y-1/2"
                  />
                ))}
              </div>
            </div >
          </div>
        </div>
      </div>
    </main>
  );
}
