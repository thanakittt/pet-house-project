"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import PetTypeBadge from "@/modules/pet/components/PetTypeBadge";
import type { Pet } from "@/modules/pet/types/pet";
import type { ServiceWithVariants } from "@/modules/service/types/service";
import { Edit2, PlusCircle, Trash2 } from "lucide-react";
import {
  formatDurationMinutes,
  formatPrice,
  getBookingDetails,
  type FrontStoreBooking,
  type FrontStoreFormData,
} from "./booking-utils";

export default function Step4Summary({
  data,
  bookings = [],
  pets = [],
  services = [],
  canAddMorePet = true,
  onAddMore,
  onEditPet,
  onRemovePet,
}: {
  data: FrontStoreFormData;
  bookings: FrontStoreBooking[];
  pets: Pet[];
  services: ServiceWithVariants[];
  canAddMorePet?: boolean;
  onAddMore: () => void;
  onEditPet: (index: number, isCurrentFormData: boolean) => void;
  onRemovePet: (index: number, isCurrentFormData: boolean) => void;
}) {
  const allBookings = [
    ...bookings.map((booking, index) => ({
      booking,
      index,
      isCurrentFormData: false,
    })),
    ...(data.petId
      ? [
        {
          booking: data,
          index: bookings.length,
          isCurrentFormData: true,
        },
      ]
      : []),
  ];

  const grandTotal = allBookings.reduce(
    (sum, item) =>
      sum + getBookingDetails(item.booking, pets, services).subtotal,
    0,
  );

  const totalDuration = allBookings.reduce(
    (sum, item) =>
      sum + getBookingDetails(item.booking, pets, services).durationMinutes,
    0,
  );

  const handleRemove = (index: number) => {
    const item = allBookings[index];
    onRemovePet(item.index, item.isCurrentFormData);
  };

  const handleEdit = (index: number) => {
    const item = allBookings[index];
    onEditPet(item.index, item.isCurrentFormData);
  };

  return (
    <div className="flex flex-col gap-4 mx-auto max-w-4xl animate-in duration-500 fade-in">
      <div className="text-left">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 4 : สรุปรายการจอง
        </h3>
        <p className="text-muted-foreground text-sm">
          ตรวจสอบรายการจองก่อนเลือกวันและเวลา
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {allBookings.map(({ booking }, index) => {
          const details = getBookingDetails(booking, pets, services);
          const pet = details.pet;

          if (!pet || !details.mainService || !details.mainVariant) {
            return null;
          }

          return (
            <div
              key={`${booking.petId}-${index}`}
              className="relative bg-card shadow-sm px-6 pt-6 pb-4 border border-primary/40 hover:border-primary rounded-2xl text-card-foreground transition-all"
            >
              <div className="top-4 right-4 absolute flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  className="bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 hover:text-blue-600 dark:hover:text-blue-200 dark:text-blue-300 transition-all"
                  onClick={() => handleEdit(index)}
                  title={`แก้ไขรายการของ ${pet.name}`}
                >
                  <Edit2 className="size-3.5" />
                </Button>
                <Button
                  variant="destructive"
                  size="icon"
                  onClick={() => handleRemove(index)}
                  title={`ลบรายการของ ${pet.name}`}
                >
                  <Trash2 className="size-3.5" />
                </Button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <PetTypeBadge
                  type={pet.breed.type.toLowerCase()}
                  className="px-3 py-6 rounded-xl"
                />
                <div>
                  <span className="block font-bold text-primary text-lg">
                    {pet.name}
                  </span>
                  <span className="text-muted-foreground text-xs uppercase tracking-wider">
                    {pet.breed.name}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-primary">
                  <div>
                    <span className="font-semibold text-base">
                      {details.mainService.name}
                    </span>
                    <p className="text-muted-foreground text-xs">
                      {formatDurationMinutes(
                        details.mainVariant.durationMinutes,
                      )}
                    </p>
                  </div>
                  <span className="font-semibold">
                    {formatPrice(Number(details.mainVariant.minPrice || 0))}
                  </span>
                </div>

                {details.addOns.map(({ service, variant }) => (
                  <div
                    key={service.id}
                    className="flex justify-between items-center pl-4 border-primary/15 border-l-2 text-muted-foreground text-sm"
                  >
                    <span className="font-normal text-sm">
                      {service.name} ·{" "}
                      {formatDurationMinutes(variant.durationMinutes)}
                    </span>
                    <span>{formatPrice(Number(variant.minPrice || 0))}</span>
                  </div>
                ))}

                <Separator className="bg-transparent my-3 border-primary/15 border-t border-dashed" />

                <div className="flex justify-between items-center font-bold text-primary text-xl">
                  <span className="text-base">ยอดรวม {pet.name}</span>
                  <span>{formatPrice(details.subtotal)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={onAddMore}
        disabled={!canAddMorePet}
        className={cn(
          "group flex justify-center items-center gap-2 py-5 border-2 border-muted-foreground/30 border-dashed rounded-2xl w-full font-bold text-muted-foreground/80 transition-all",
          canAddMorePet
            ? "hover:bg-muted hover:border-primary hover:text-primary"
            : "cursor-not-allowed opacity-50",
        )}
      >
        <PlusCircle className="size-4 md:size-5" />
        <span className="text-sm md:text-base">เพิ่มสัตว์เลี้ยงอีกตัว</span>
      </button>

      <div className="flex justify-between items-center bg-card shadow-lg p-6 border border-primary/20 rounded-2xl text-primary">
        <div>
          <p className="font-medium text-primary text-sm">
            ยอดชำระสุทธิ ({allBookings.length} รายการ)
          </p>
          <p className="mt-1 text-muted-foreground text-xs">
            ใช้เวลารวมประมาณ {formatDurationMinutes(totalDuration)}
          </p>
        </div>
        <div className="text-right">
          <span className="font-black text-2xl md:text-3xl tracking-tight">
            {formatPrice(grandTotal)}
          </span>
        </div>
      </div>
    </div>
  );
}
