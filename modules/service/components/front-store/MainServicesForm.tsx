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
    <Card className="shadow-sm border-slate-100">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{service.name}</CardTitle>
        {service.description && (
          <CardDescription>{service.description}</CardDescription>
        )}
      </CardHeader>
      <CardContent>
        {hasMultipleVariants ? (
          <div className="space-y-3">
            <p className="font-bold text-[10px] text-muted-foreground md:text-xs uppercase tracking-wider">
              ราคาเริ่มต้นตามขนาด (บาท)
            </p>
            <div className="gap-2 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {service.variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex flex-col justify-center items-center gap-1 bg-slate-50/50 p-2 border border-slate-100 rounded-lg min-h-24 text-center"
                >
                  <p className="text-muted-foreground md:text-md text-base">
                    {PET_SIZE_LABELS[variant.size] || variant.size}
                  </p>
                  <p className="font-medium text-primary md:text-md text-base">
                    {formatVariantPrice(variant)}
                  </p>
                  <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="size-3" />
                    ~{variant.durationMinutes} นาที
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          service.variants.map((variant) => (
            <div
              key={variant.id}
              className="flex justify-between items-center gap-3 bg-slate-50/50 p-3 border border-slate-100 rounded-lg"
            >
              <div className="space-y-1">
                <p className="text-muted-foreground text-base">
                  ราคาเริ่มต้น
                </p>
                <p className="flex items-center gap-1 text-[11px] text-muted-foreground">
                  <Clock className="size-3" />
                  ~{variant.durationMinutes} นาที
                </p>
              </div>
              <p className="font-bold text-primary text-sm text-right">
                {formatVariantPrice(variant)}
              </p>
            </div>
          ))
        )}
      </CardContent>
    </Card>
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
    <section className="font-noto-thai">
      <div
        className={
          filteredGroups.length > 1
            ? "grid grid-cols-1 md:grid-cols-2 gap-6"
            : "w-full"
        }
      >
        {filteredGroups.map((group) => {
          const groupServices = getServicesForPet(services, group.petType);

          return (
            <div key={group.type} className="space-y-4">
              {type === "all" && (
                <div
                  className={`flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-lg ${group.styles}`}
                >
                  {group.icon}
                  {group.label}
                </div>
              )}

              <div className="space-y-4">
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
    </section>
  );
}
