import type { Pet } from "@/modules/pet/types/pet";
import type { ServiceWithVariants } from "@/modules/service/types/service";

export type FrontStoreBooking = {
  petId: string;
  mainServiceId: string;
  addOnServiceIds: string[];
};

export type FrontStoreFormData = FrontStoreBooking & {
  startTimeIso: string;
  note: string;
};

export type ServiceVariant = ServiceWithVariants["variants"][number];

export function findMatchingVariant(
  service: ServiceWithVariants | undefined,
  pet: Pet | undefined,
): ServiceVariant | undefined {
  if (!service || !pet) return undefined;

  const variantsForPetType = service.variants.filter(
    (variant) => variant.petType === pet.breed.type,
  );

  return (
    variantsForPetType.find((variant) => variant.size === pet.breed.size) ??
    variantsForPetType.find((variant) => variant.size === "ALL")
  );
}

export function getCompatibleServices(
  services: ServiceWithVariants[],
  pet: Pet | undefined,
  serviceType: "MAIN" | "ADDON",
) {
  return services.filter(
    (service) =>
      service.serviceType === serviceType && Boolean(findMatchingVariant(service, pet)),
  );
}

export function getBookingDetails(
  booking: FrontStoreBooking,
  pets: Pet[],
  services: ServiceWithVariants[],
) {
  const pet = pets.find((item) => item.id === booking.petId);
  const mainService = services.find(
    (service) => service.id === booking.mainServiceId,
  );
  const mainVariant = findMatchingVariant(mainService, pet);
  const addOns = (booking.addOnServiceIds || [])
    .map((serviceId) => {
      const service = services.find((item) => item.id === serviceId);
      const variant = findMatchingVariant(service, pet);

      if (!service || !variant) return null;

      return { service, variant };
    })
    .filter((item): item is { service: ServiceWithVariants; variant: ServiceVariant } =>
      Boolean(item),
    );

  const mainPrice = Number(mainVariant?.minPrice || 0);
  const addOnPrice = addOns.reduce(
    (sum, item) => sum + Number(item.variant.minPrice || 0),
    0,
  );
  const mainDuration = Number(mainVariant?.durationMinutes || 0);
  const addOnDuration = addOns.reduce(
    (sum, item) => sum + Number(item.variant.durationMinutes || 0),
    0,
  );

  return {
    pet,
    mainService,
    mainVariant,
    addOns,
    subtotal: mainPrice + addOnPrice,
    durationMinutes: mainDuration + addOnDuration,
  };
}

export function getTotalDurationMinutes(
  bookings: FrontStoreBooking[],
  pets: Pet[],
  services: ServiceWithVariants[],
) {
  return bookings.reduce((sum, booking) => {
    return sum + getBookingDetails(booking, pets, services).durationMinutes;
  }, 0);
}

export function formatPrice(value: number) {
  return `฿${value.toLocaleString("th-TH")}`;
}

export function formatDurationMinutes(duration: number) {
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;

  if (hours <= 0) return `${minutes} นาที`;
  if (minutes <= 0) return `${hours} ชั่วโมง`;

  return `${hours} ชั่วโมง ${minutes} นาที`;
}
