"use client";

import BackButton from "@/components/BackButton";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { Button } from "@/components/ui/button";
import { formatThaiDate } from "@/lib/utils";
import type { CustomerAppointmentDetail } from "@/modules/appointment/queries/get-customer-appointment-detail";
import PetTypeBadge from "@/modules/pet/components/PetTypeBadge";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import {
  Calendar,
  CalendarCheck,
  Clock,
  ExternalLink,
  Printer,
  Scissors,
  Store,
} from "lucide-react";
import Link from "next/link";

type CustomerAppointmentDetailsProps = {
  appointment: CustomerAppointmentDetail;
};

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
      <div className="animate-in fade-in">
        <div className="gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3 ">
          <div className="space-y-6 lg:col-span-2">
            <div className="overflow-hidden bg-white shadow-sm border rounded-2xl transition-all duration-300">
              <div className="space-y-6 p-6">
                <div className="flex items-start gap-3 justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 p-2 rounded-lg text-indigo-500">
                      <CalendarCheck className="size-5" />
                    </div>
                    <h2 className="font-bold text-primary text-lg md:text-xl">
                      ข้อมูลการนัดหมาย
                    </h2>
                  </div>
                  <AppointmentStatusBadge
                    status={appointment.status}
                    size="md"
                  />
                </div>

                <div className="flex gap-2 items-center px-4">
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
                  <div className="flex items-center gap-5 bg-muted/80 p-4 rounded-xl">
                    <div className="shrink-0">
                      <PetTypeBadge
                        type={getPetTypeForBadge(firstPet.species)}
                      />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-primary text-lg md:text-xl">
                        {firstPet.name}
                      </h3>
                      <p className="text-muted-foreground text-sm md:text-base">
                        {firstPet.breed}
                      </p>
                    </div>
                  </div>
                ) : null}

                {appointment.pets.length > 1 ? (
                  <div className="space-y-3">
                    {appointment.pets.slice(1).map((pet) => (
                      <div
                        key={pet.petId}
                        className="flex items-center gap-4 p-4 bg-muted/80 rounded-xl"
                      >
                        <PetTypeBadge type={getPetTypeForBadge(pet.species)} />
                        <div>
                          <p className="font-bold text-primary text-lg md:text-xl">{pet.name}</p>
                          <p className="text-muted-foreground text-sm md:text-base">
                            {pet.breed}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}

              </div>
            </div >
            <Link
              href="https://maps.app.goo.gl/4zDGa6djFfVKGq5RA"
              target="_blank"
              rel="noopener noreferrer"
              className="group block overflow-hidden bg-white p-6 shadow-sm border rounded-2xl transition-all duration-300 hover:shadow-md"
            >
              <div className="flex md:flex-row flex-col justify-between gap-6">
                <div className="space-y-4">
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-fuchsia-50 p-2 rounded-lg  text-fuchsia-500">
                        <Store className="size-5" />
                      </div>
                      <p className=" font-bold text-lg text-primary uppercase ">
                        Pet House
                      </p>
                    </div >
                    <p className="mt-2  px-4 text-primary text-base leading-relaxed text-left">
                        181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เชียงใหม่ จ.เชียงใหม่
                        50300
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex size-11 items-center justify-center rounded-md border bg-background transition-colors group-hover:bg-muted">
                    <ExternalLink className="size-5" />
                  </span>
                </div>
              </div>
            </Link >
          </div>

          <div className="lg:col-span-1">
            <div className="lg:top-24 relative lg:sticky overflow-hidden bg-white p-6 shadow-sm border rounded-2xl transition-all duration-300 hover:shadow-md">
              <div className="-left-10 -bottom-10 absolute opacity-5 rotate-12 pointer-events-none">
                <Scissors className="size-44" />
              </div>

              <h2 className="pb-6 font-bold text-primary text-lg md:text-xl">
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
                      <p className="font-bold text-primary text-lg">
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
