export type ServiceVariantForm = {
  petType: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  isStartingPriceOnly: string;
  durationMinutes: string;
  serviceId: string;
};

export type ServiceVariant = {
  id: string;
  petType: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  isStartingPriceOnly: boolean;
  durationMinutes: number;
};

export type UpdateServiceVariantForm = {
  petType: string;
  size: string;
  minPrice: string;
  maxPrice: string;
  isStartingPriceOnly: string;
  durationMinutes: string;
};