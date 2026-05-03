"use client";
import { Scissors, Star } from "lucide-react";
import { ServiceCategorySection } from "@/modules/service/components/front-store/ServiceCategorySection";
import { MainServicesForm } from "@/modules/service/components/front-store/MainServicesForm";
import { AddOnServicesForm } from "@/modules/service/components/front-store/AddOnServicesForm";
import type { ServiceWithVariants } from "@/modules/service/types/service";

type ServiceClientProps = {
  services: ServiceWithVariants[];
};

export function ServiceClient({ services }: ServiceClientProps) {
  const mainServices = services.filter(
    (service) => service.serviceType === "MAIN",
  );
  const addonServices = services.filter(
    (service) => service.serviceType === "ADDON",
  );

  return (
    <main className="space-y-8 mx-auto p-4 md:p-8 pb-20 max-w-5xl min-h-screen overflow-x-hidden font-noto-thai">
      <div className="space-y-6">
        {/* --- หมวดหมู่บริการหลัก --- */}
        <ServiceCategorySection
          title="บริการหลัก"
          icon={Scissors}
          iconBgColor="bg-blue-500"
          defaultTabValue="main-dog"
          activeTabColor="data-[state=active]:text-blue-500"
          dogContent={<MainServicesForm services={mainServices} type="dog" />}
          catContent={<MainServicesForm services={mainServices} type="cat" />}
          desktopContent={<MainServicesForm services={mainServices} type="all" />}
        />

        {/* --- หมวดหมู่บริการเสริม --- */}
        <ServiceCategorySection
          title="บริการเสริม"
          icon={Star}
          iconBgColor="bg-amber-500"
          defaultTabValue="addon-dog"
          activeTabColor="data-[state=active]:text-orange-500"
          dogContent={<AddOnServicesForm services={addonServices} type="dog" />}
          catContent={<AddOnServicesForm services={addonServices} type="cat" />}
          desktopContent={<AddOnServicesForm services={addonServices} type="all" />}
        />
      </div>
    </main>
  );
}
