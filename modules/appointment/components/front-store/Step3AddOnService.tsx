"use client";

import { cn } from "@/lib/utils";
import type { Pet } from "@/modules/pet/types/pet";
import type { ServiceWithVariants } from "@/modules/service/types/service";
import { Check, Plus } from "lucide-react";
import {
  findMatchingVariant,
  formatDurationMinutes,
  formatPrice,
  getCompatibleServices,
  type FrontStoreFormData,
} from "./booking-utils";

export default function Step3AddOnService({
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
  const addOnServices = getCompatibleServices(services, pet, "ADDON");
  const selectedIds = data.addOnServiceIds || [];

  const selectedTotal = selectedIds.reduce((sum, serviceId) => {
    const service = services.find((item) => item.id === serviceId);
    const variant = findMatchingVariant(service, pet);
    return sum + Number(variant?.minPrice || 0);
  }, 0);

  const toggleService = (serviceId: string) => {
    const nextAddOns = selectedIds.includes(serviceId)
      ? selectedIds.filter((id) => id !== serviceId)
      : [...selectedIds, serviceId];

    update({ ...data, addOnServiceIds: nextAddOns, startTimeIso: "" });
  };

  return (
    <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-4 duration-500">
      <div className="text-left">
        <h3 className="font-bold text-primary text-lg md:text-xl">
          ขั้นตอนที่ 3 : เลือกบริการเสริม
        </h3>
        <p className="text-sm text-muted-foreground">
          สามารถเลือกบริการเสริมได้มากกว่า 1 รายการ หรือกดถัดไปได้เลย
        </p>
      </div>

      {addOnServices.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {addOnServices.map((service) => {
            const variant = findMatchingVariant(service, pet);
            const isSelected = selectedIds.includes(service.id);

            return (
              <button
                key={service.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleService(service.id)}
                className={cn(
                  "group relative flex cursor-pointer flex-col justify-between rounded-xl border p-5 text-left shadow-sm transition-all duration-200",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-md ring-1 ring-primary"
                    : "border-foreground/20 hover:border-primary/40 hover:bg-muted",
                )}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                      isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-foreground/20 text-transparent group-hover:border-primary/50",
                    )}
                  >
                    {isSelected ? (
                      <Check className="size-4" strokeWidth={3} />
                    ) : (
                      <Plus className="size-4 text-foreground/60 group-hover:text-primary" />
                    )}
                  </div>

                  <div className="flex w-full items-center justify-between gap-3">
                    <div>
                      <span
                        className={cn(
                          "text-base font-semibold transition-colors",
                          isSelected ? "text-primary" : "text-foreground",
                        )}
                      >
                        {service.name}
                      </span>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDurationMinutes(variant?.durationMinutes || 0)}
                      </p>
                    </div>
                    <span className="text-lg font-bold tabular-nums text-primary">
                      {formatPrice(Number(variant?.minPrice || 0))}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed bg-muted/40 p-6 text-sm text-muted-foreground">
          ไม่มีบริการเสริมที่รองรับสัตว์เลี้ยงตัวนี้ในตอนนี้
        </div>
      )}

      <div
        className={cn(
          "flex items-center justify-between rounded-xl border p-4 transition-all duration-300",
          selectedIds.length > 0
            ? "translate-y-0 border-primary/50 bg-muted opacity-100"
            : "pointer-events-none border-primary/5 bg-muted/80 opacity-50",
        )}
      >
        <p className="text-sm font-medium text-muted-foreground">
          เลือกไปแล้ว{" "}
          <span className="font-bold text-primary">{selectedIds.length}</span>{" "}
          รายการ
        </p>
        <p className="text-lg font-bold text-primary">
          <span className="mr-2 text-xs font-normal uppercase text-muted-foreground">
            รวม
          </span>
          {formatPrice(selectedTotal)}
        </p>
      </div>
    </div>
  );
}
