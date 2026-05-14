"use client";

import type { ServiceWithVariants } from "@/modules/service/types/service";
import { Card, CardContent } from "@/components/ui/card";
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { Cat, Clock, Dog, DogIcon, CatIcon, Sparkles, ShieldCheck, Bug, Stethoscope, Wind, Scissors, LineSquiggle } from "lucide-react";
import { cn } from "@/lib/utils";

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
    icon: <DogIcon className="size-6" />,
    styles: "bg-blue-50/50 border-blue-100/50 text-blue-500",
  },
  {
    type: "cat",
    petType: "CAT",
    label: "บริการเสริมสำหรับแมว",
    icon: <CatIcon className="size-6" />,
    styles: "bg-orange-50/50 border-orange-100/50 text-orange-500",
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

function EmptyAddOns() {
  return (
    <Card className="shadow-sm border-slate-200 border-dashed">
      <CardContent className="p-12 text-muted-foreground text-sm text-center">
        ยังไม่มีข้อมูลบริการเสริมสำหรับหมวดนี้
      </CardContent>
    </Card>
  );
}

function AddOnCard({ service }: { service: DisplayService }) {
  // ฟังก์ชันเลือกไอคอนตามชื่อบริการเสริม
  const getAddOnIcon = (name: string) => {
    if (name.includes("แปรงฟัน")) return <Sparkles size={18} />;
    if (name.includes("เชื้อรา")) return <ShieldCheck size={18} />;
    if (name.includes("เห็บหมัด")) return <Bug size={18} />;
    if (name.includes("ทรีทเม้นท์")) return <Stethoscope size={18} />;
    if (name.includes("ตู้อบ")) return <Wind size={18} />;
    if (name.includes("ไถ")) return <Scissors size={18} />;
    if (name.includes("สางสังกะตัง")) return <LineSquiggle size={18} />;
    return null;
  };

  // กำหนดสีตาม petType ของ variant แรก (ว่าเป็นหมาหรือแมว)
  const isCat = service.variants[0]?.petType === "CAT";
  const iconBgColor = isCat ? "bg-pink-50 text-pink-500" : "bg-blue-50 text-blue-500";
  return (
    <div className="group relative bg-white rounded-2xl p-2 border border-slate-100 shadow-sm transition-all duration-500">
      <div className="p-4">
        <header className="mb-4">
          <div className="flex flex-row items-center gap-3">
            <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconBgColor)}>
              {getAddOnIcon(service.name)}
            </div>
            <div>
              <h3 className="text-lg font-bold text-primary tracking-tight mb-1 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              {service.description && (
                <p className="text-muted-foreground text-sm leading-relaxed max-w-full">
                  {service.description}
                </p>
              )}
            </div>
          </div>
        </header>

        <div className="space-y-2">
          {service.variants.map((variant) => (
            <div
              key={variant.id}
              className="flex items-center justify-between p-3 px-5 rounded-xl bg-muted/50 transition-all duration-300"
            >
              <div className="flex flex-col">
                <span className="text-primary font-semibold text-base">
                  {variant.size === "ALL" ? "ทุกขนาด" : PET_SIZE_LABELS[variant.size] || variant.size}
                </span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <Clock className="size-3" />
                  <span className="text-xs">~{variant.durationMinutes} นาที</span>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-muted-foreground block uppercase tracking-wider text-[10px]">
                  ราคา
                </span>
                <span className="text-lg md:text-xl font-bold text-primary">
                  {formatVariantPrice(variant)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AddOnServicesForm({ services, type = "all" }: { services: ServiceWithVariants[], type?: PetViewType }) {
  const filteredGroups =
    type === "all" ? petGroups : petGroups.filter((group) => group.type === type);

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
              {/* Section Header - ปรับตามดีไซน์หลัก */}
              {type === "all" && (
                <div className={cn(
                  "flex items-center justify-center gap-3 mb-6 rounded-xl w-full mx-auto py-3 border transition-all",
                  group.styles
                )}>
                  {group.type === 'dog' ? <Dog className="size-6" /> : <Cat className="size-6" />}
                  <h2 className="text-lg md:text-xl font-bold">
                    {group.label}
                  </h2>
                </div>
              )}

              {/* Add-on Cards List */}
              <div className="grid gap-4">
                {groupServices.length > 0 ? (
                  groupServices.map((service) => (
                    <AddOnCard key={service.id} service={service} />
                  ))
                ) : (
                  <EmptyAddOns />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}