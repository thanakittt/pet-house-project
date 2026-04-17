export type ServiceForm = {
  name: string;
  serviceType: string;
  description: string;
};

export type Service = {
  id: string;
  name: string;
  serviceType: string;
  description: string;
};

export type ServiceWithVariants = {
  id: string;
  name: string;
  serviceType: "MAIN" | "ADDON";
  variants: {
    id: string;
    size: "S" | "M" | "L" | "ALL";
    minPrice: string;
    maxPrice: string;
    isStartingPriceOnly: boolean;
    petType: "DOG" | "CAT";
    durationMinutes: number;
  }[];
};