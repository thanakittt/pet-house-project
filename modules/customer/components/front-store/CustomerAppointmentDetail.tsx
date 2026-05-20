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
    <main className="flex flex-col gap-8 mx-auto p-6 lg:p-8 max-w-5xl">
      <BackButton />
      <div className="animate-in fade-in">
        <div className="gap-6 md:gap-8 grid grid-cols-1 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="bg-card shadow-sm border rounded-2xl overflow-hidden text-card-foreground transition-all duration-300">
              <div className="flex flex-col gap-6 p-6">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-indigo-50 dark:bg-indigo-950/40 p-2 rounded-lg text-indigo-500 dark:text-indigo-300">
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

                <div className="flex items-center gap-2 px-4">
                    <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-1 font-medium text-muted-foreground text-sm">
                      <Calendar className="size-3" />
                      วันที่เข้ารับบริการ
                    </div>
                    <p className="pl-2 font-bold text-primary text-lg md:text-xl text-start">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                  <div className="flex flex-col gap-2 w-full">
                    <div className="flex items-center gap-1 font-medium text-muted-foreground text-sm">
                      <Clock className="size-3" />
                      เวลาเข้าใช้บริการ
                    </div>
                    <p className="pl-2 font-bold text-primary text-lg md:text-xl text-start">
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
                  <div className="flex flex-col gap-3">
                    {appointment.pets.slice(1).map((pet) => (
                      <div
                        key={pet.petId}
                        className="flex items-center gap-4 bg-muted/80 p-4 rounded-xl"
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
              className="group block bg-card hover:bg-muted/30 shadow-sm hover:shadow-md p-6 border rounded-2xl overflow-hidden text-card-foreground transition-all duration-300"
            >
              <div className="flex md:flex-row flex-col justify-between gap-6">
                <div className="flex flex-col gap-4">
                  <div className="flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2">
                      <div className="bg-fuchsia-50 dark:bg-fuchsia-950/40 p-2 rounded-lg text-fuchsia-500 dark:text-fuchsia-300">
                        <Store className="size-5" />
                      </div>
                      <p className="font-bold text-primary text-lg uppercase">
                        Pet House
                      </p>
                    </div >
                    <p className="mt-2 px-4 text-primary text-base text-left leading-relaxed">
                        181/262 ม.3 ถ.โพธาราม ต.ช้างเผือก อ.เชียงใหม่ จ.เชียงใหม่
                        50300
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="inline-flex justify-center items-center bg-background group-hover:bg-muted border rounded-md size-11 transition-colors">
                    <ExternalLink className="size-5" />
                  </span>
                </div>
              </div>
            </Link >
          </div>

          <div className="lg:col-span-1">
            <div className="lg:top-24 relative lg:sticky bg-card shadow-sm hover:shadow-md p-6 border rounded-2xl overflow-hidden text-card-foreground transition-all duration-300">
              <div className="-bottom-10 -left-10 absolute opacity-5 rotate-12 pointer-events-none">
                <Scissors className="size-44" />
              </div>

              <h2 className="pb-6 font-bold text-primary text-lg md:text-xl">
                สรุปยอดชำระ
              </h2>

              <div className="flex flex-col gap-2">
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

                <div className="flex flex-col gap-4 mt-6 pt-6 border-muted border-t">
                  <div className="flex justify-between items-end">
                    <div className="flex flex-col gap-1">
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

              <div className="z-10 relative flex flex-col gap-4 mt-10">
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
                    className="flex-1 bg-muted rounded-full translate-y-1/2"
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
