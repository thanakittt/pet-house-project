"use client";

import type { ServiceWithVariants } from "@/modules/service/types/service";
import { Card, CardContent } from "@/components/ui/card";
import { CatIcon, Clock, DogIcon } from "lucide-react";

type PetViewType = "dog" | "cat" | "all";
type PetType = "DOG" | "CAT";
type ServiceVariant = ServiceWithVariants["variants"][number];
type DisplayService = Omit<ServiceWithVariants, "variants"> & {
  variants: ServiceVariant[];
};

const priceFormatter = new Intl.NumberFormat("th-TH", {
  style: "currency",
  currency: "THB",
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

const sizeOrder: Record<ServiceVariant["size"], number> = {
  S: 1,
  M: 2,
  L: 3,
  ALL: 4,
};

const petGroups = [
  {
    type: "dog",
    petType: "DOG",
    label: "บริการเสริมสำหรับสุนัข",
    icon: <DogIcon className="size-5" />,
    styles: "bg-blue-50 text-blue-600",
  },
  {
    type: "cat",
    petType: "CAT",
    label: "บริการเสริมสำหรับแมว",
    icon: <CatIcon className="size-5" />,
    styles: "bg-orange-50 text-orange-600",
  },
] as const;

function formatPrice(value: string) {
  const amount = Number(value);
  return Number.isFinite(amount) ? priceFormatter.format(amount) : value;
}

function formatVariantPrice(variant: ServiceVariant) {
  if (variant.isStartingPriceOnly) {
    return `${formatPrice(variant.minPrice)}`;
  }

  if (variant.minPrice === variant.maxPrice) {
    return formatPrice(variant.minPrice);
  }

  return `${formatPrice(variant.minPrice)} - ${formatPrice(variant.maxPrice)}`;
}

function getServicesForPet(
  services: ServiceWithVariants[],
  petType: PetType,
): DisplayService[] {
  return services
    .map((service) => ({
      ...service,
      variants: service.variants
        .filter((variant) => variant.petType === petType)
        .sort((a, b) => sizeOrder[a.size] - sizeOrder[b.size]),
    }))
    .filter((service) => service.variants.length > 0);
}

function EmptyAddOns() {
  return (
    <Card className="shadow-sm border-slate-200 border-dashed">
      <CardContent className="p-6 text-muted-foreground text-sm text-center">
        ยังไม่มีข้อมูลบริการเสริมสำหรับหมวดนี้
      </CardContent>
    </Card>
  );
}

function AddOnCard({ service }: { service: DisplayService }) {
  return (
    <Card className="shadow-sm border-slate-100 hover:border-primary/20 overflow-hidden transition-colors">
      <CardContent className="space-y-3 p-4">
        <div className="space-y-1">
          <p className="font-semibold text-primary text-sm md:text-base">
            {service.name}
          </p>
          {service.description && (
            <p className="text-muted-foreground text-xs">
              {service.description}
            </p>
          )}
        </div>

        <div className="space-y-2">
          {service.variants.map((variant) => (
            <div
              key={variant.id}
              className="flex justify-between items-center gap-3 bg-slate-50/70 px-3 py-2 rounded-lg"
            >
              <div className="space-y-0.5">
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  ~{variant.durationMinutes} นาที
                </p>
              </div>
              <p className="font-medium text-primary text-sm text-right">
                {formatVariantPrice(variant)}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface AddOnProps {
  services: ServiceWithVariants[];
  type?: PetViewType;
}

export function AddOnServicesForm({ services, type = "all" }: AddOnProps) {
  const filteredGroups =
    type === "all" ? petGroups : petGroups.filter((group) => group.type === type);

  return (
    <section className="font-noto-thai">
      <div
        className={
          filteredGroups.length > 1
            ? "grid grid-cols-1 xl:grid-cols-2 gap-6"
            : "w-full"
        }
      >
        {filteredGroups.map((group) => {
          const groupServices = getServicesForPet(services, group.petType);

          return (
            <div key={group.type} className="flex flex-col space-y-4 h-full">
              {type === "all" && (
                <div
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg ${group.styles}`}
                >
                  {group.icon}
                  {group.label}
                </div>
              )}

              <div className="flex-1 space-y-3">
                {groupServices.length > 0 ? (
                  groupServices.map((service) => (
                    <AddOnCard key={service.id} service={service} />
                  ))
                ) : (
                  <EmptyAddOns />
                )}
              </div>

              <div className="bg-slate-50 mt-4 p-4 border border-slate-200 border-dashed rounded-xl text-center">
                <p className="text-muted-foreground text-xs italic">
                  * บริการเสริมจะถูกนำไปรวมกับราคาบริการหลักในขั้นตอนการจองคิว
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
