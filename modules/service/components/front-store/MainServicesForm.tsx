"use client";

import type { ServiceWithVariants } from "@/modules/service/types/service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { CatIcon, Clock, DogIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dog, Cat, ChevronRight } from "lucide-react";

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
    label: "บริการหลักสำหรับสุนัข",
    icon: <DogIcon className="size-5" />,
    styles: "bg-blue-50 text-blue-600",
  },
  {
    type: "cat",
    petType: "CAT",
    label: "บริการหลักสำหรับแมว",
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
    return formatPrice(variant.minPrice);
  }

  if (Number(variant.minPrice) === Number(variant.maxPrice)) {
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

function EmptyServices() {
  return (
    <Card className="shadow-sm border-slate-200 border-dashed">
      <CardContent className="p-6 text-muted-foreground text-sm text-center">
        ยังไม่มีข้อมูลบริการสำหรับหมวดนี้
      </CardContent>
    </Card>
  );
}
function ServiceCard({ service }: { service: DisplayService }) {
  const hasMultipleVariants = service.variants.length > 1;

  return (
    <div className="group relative bg-white rounded-2xl p-2 border border-slate-100 shadow-sm transition-all duration-500">
      <div className="p-4">
        <header className="mb-6">
          <div className="flex justify-between items-start">
            <div>
              <h3 className="text-xl font-bold text-primary tracking-tight mb-2 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-full">
                  {service.description}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-3">
          {service.variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-4 px-6 md:p-5 rounded-2xl bg-muted/80 border border-transparent transition-all duration-300 group/item"
            >
              <div className="flex items-center gap-4">
                {/* Size Indicator */}
                <div className="flex flex-col">
                  <span className="text-primary font-semibold text-base md:text-lg">
                    {PET_SIZE_LABELS[variant.size] || variant.size}
                  </span>
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Clock className="size-3.5" />
                    <span className="text-xs font-medium">~{variant.durationMinutes} นาที</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider mb-0.5">เริ่มต้น</span>
                  <span className="text-lg md:text-xl font-bold text-primary group-hover/item:text-primary transition-colors">
                    {formatVariantPrice(variant)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function MainServicesForm({
  services,
  type = "all",
}: {
  services: ServiceWithVariants[];
  type?: PetViewType;
}) {
  const filteredGroups =
    type === "all"
      ? petGroups
      : petGroups.filter((group) => group.type === type);

  return (
    <section className="w-full font-noto-thai antialiased pb-12">
      <div className={cn(
        "grid grid-cols-1 gap-6",
        filteredGroups.length > 1 && "lg:grid-cols-2"
      )}>
        {filteredGroups.map((group) => {
          const groupServices = getServicesForPet(services, group.petType);

          return (
            <div key={group.type} className="flex flex-col">
              {/* Modern Section Header - ปรับสีตามประเภทสัตว์ */}
              {type === "all" && (
                <div
                  className={cn(
                    "flex items-center justify-center gap-3 mb-6 rounded-xl w-full mx-auto py-3 transition-all border",
                    group.type === 'dog'
                      ? "bg-blue-50/50 border-blue-100/50 text-blue-700"
                      : "bg-orange-50/50 border-orange-100/50 text-orange-600"
                  )}
                >
                  <div className={cn(
                    group.type === 'dog' ? "text-blue-600" : "text-orange-500"
                  )}>
                    {group.type === 'dog' ? (
                      <Dog className="size-6" />
                    ) : (
                      <Cat className="size-6" />
                    )}
                  </div>

                  <div>
                    <h2 className="text-lg md:text-xl font-bold">
                      {group.label}
                    </h2>
                  </div>
                </div>
              )}

              {/* รายการบริการ (Service Cards) */}
              <div className="grid gap-6">
                {groupServices.length > 0 ? (
                  groupServices.map((service) => (
                    <ServiceCard key={service.id} service={service} />
                  ))
                ) : (
                  <EmptyServices />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section >
  );
}
