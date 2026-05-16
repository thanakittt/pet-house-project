"use client";

import { cn } from "@/lib/utils";
import type { Pet } from "@/modules/pet/types/pet";
import type { ServiceWithVariants } from "@/modules/service/types/service";
import { Bath, Scissors } from "lucide-react";
import {
  findMatchingVariant,
  formatDurationMinutes,
  formatPrice,
  getCompatibleServices,
  type FrontStoreFormData,
} from "./booking-utils";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";

export default function Step2MainService({
  data,
  update,
  pet,
  services,
}: {
  data: FrontStoreFormData;
  update: (data: FrontStoreFormData) => void;
  pet?: Pet;
  services: ServiceWithVariants[];
}) {
  const mainServices = getCompatibleServices(services, pet, "MAIN");

  return (
    <div className="slide-in-from-right-4 flex flex-col gap-6 animate-in duration-500 fade-in">
      <div className="text-left">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 2 : เลือกบริการหลัก
        </h3>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <p className="text-muted-foreground text-sm">กรุณาเลือกบริการพื้นฐานที่ต้องการ</p>
          {pet ? (
            <span className="bg-primary/10 px-2 py-0.5 rounded-full font-medium text-xs md:text-sm text-primary">
              {pet.name} | {PET_TYPE_LABELS[pet.breed.type]} | ขนาด
              {PET_SIZE_LABELS[pet.breed.size]}
            </span>
          ) : null}
        </div>
      </div>

      {mainServices.length > 0 ? (
        <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
          {mainServices.map((service) => {
            const variant = findMatchingVariant(service, pet);
            const isSelected = data.mainServiceId === service.id;
            const Icon = service.name.includes("อาบ") ? Bath : Scissors;

            return (
              <button
                key={service.id}
                type="button"
                onClick={() =>
                  update({
                    ...data,
                    mainServiceId: service.id,
                    addOnServiceIds: [],
                    startTimeIso: "",
                  })
                }
                className={cn(
                  "group relative shadow-sm p-5 border rounded-xl overflow-hidden text-left transition-all cursor-pointer",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                    : "hover:bg-muted hover:border-primary/40",
                )}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={cn(
                      "p-3 rounded-xl transition-colors shrink-0",
                      isSelected
                        ? "bg-primary text-white"
                        : "bg-muted text-primary group-hover:bg-primary/10",
                    )}
                  >
                    <Icon className="size-6" />
                  </div>

                  <div className="flex flex-col justify-center w-full min-h-[48px]">
                    <div className="flex flex-row justify-between items-start gap-3 w-full">
                      <div>
                        <p className="font-bold text-primary text-lg leading-tight">
                          {service.name}
                        </p>
                        {service.description ? (
                          <p className="mt-1 text-muted-foreground text-sm line-clamp-2">
                            {service.description}
                          </p>
                        ) : null}
                      </div>
                      <p
                        className={cn(
                          "font-bold text-lg text-nowrap shrink-0",
                          isSelected ? "text-primary" : "text-foreground/80",
                        )}
                      >
                        {formatPrice(Number(variant?.minPrice || 0))}
                      </p>
                    </div>
                    <p className="mt-3 font-medium text-muted-foreground text-xs">
                      ใช้เวลา{" "}
                      {formatDurationMinutes(variant?.durationMinutes || 0)}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="bg-muted/40 p-6 border border-dashed rounded-xl text-muted-foreground text-sm">
          ยังไม่มีบริการหลักที่รองรับสัตว์เลี้ยงตัวนี้
        </div>
      )}
    </div>
  );
}
