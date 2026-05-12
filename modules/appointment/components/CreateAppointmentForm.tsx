"use client";

import { useEffect, useMemo, useState } from "react";
import { Controller, useFieldArray, useForm, useWatch } from "react-hook-form";
import { format, parseISO } from "date-fns";
import { th } from "date-fns/locale";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

import { searchCustomer } from "@/modules/customer/actions/search-customer";
import { CustomerSearchResult } from "@/modules/customer/types/customer";
import { ServiceWithVariants } from "@/modules/service/types/service";
import { getAvailableSlots } from "../queries/get-available-slots";
import { PET_TYPE_LABELS } from "@/lib/constants/pet-type";
import { createAppointment } from "../actions/create-appointment";
import { SHOP_CLOSED_DAY } from "@/lib/constants/appointment";

interface AvailableSlotsProps {
  durationMinutes: number;
  selectedTime: string | null;
  onSelectSlot: (startTime: string) => void;
  error?: string;
}

export function formatDurationMinutes(duration: number): string {
  if (!Number.isFinite(duration) || duration <= 0) {
    return "0 นาที";
  }

  const hours = Math.floor(duration / 60);
  const minutes = Math.floor(duration % 60);

  if (hours === 0) return `${minutes} นาที`;
  if (minutes === 0) return `${hours} ชั่วโมง`;

  return `${hours} ชั่วโมง ${minutes} นาที`;
}

export function AvailableSlots({
  durationMinutes,
  selectedTime,
  onSelectSlot,
  error,
}: AvailableSlotsProps) {
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const date = new Date();
    while (date.getDay() === SHOP_CLOSED_DAY) {
      date.setDate(date.getDate() + 1);
    }
    return format(date, "yyyy-MM-dd");
  });
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || durationMinutes <= 0) return;

      const dayOfWeek = new Date(selectedDate).getDay();
      if (dayOfWeek === SHOP_CLOSED_DAY) {
        setAvailableSlots([]);
        return;
      }

      setIsLoading(true);
      onSelectSlot("");

      const result = await getAvailableSlots({
        date: selectedDate,
        durationMinutes,
      });

      if (result.success && result.data) {
        setAvailableSlots(result.data);
      } else {
        setAvailableSlots([]);
      }
      setIsLoading(false);
    };

    fetchSlots();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, durationMinutes]);

  if (durationMinutes <= 0) return null;

  return (
    <div
      className={`space-y-4 bg-white p-4 border rounded-lg ${error ? "border-red-500" : "border-gray-200"}`}
    >
      <div className="flex sm:flex-row flex-col sm:items-end gap-4">
        <div>
          <label
            htmlFor="date-picker"
            className="block mb-1 font-medium text-sm"
          >
            เลือกวันที่
          </label>
          <Input
            id="date-picker"
            type="date"
            value={selectedDate}
            min={format(new Date(), "yyyy-MM-dd")}
            onChange={(e) => {
              const val = e.target.value;
              if (val) {
                const day = new Date(val).getDay();
                if (day === SHOP_CLOSED_DAY) {
                  toast.error("ไม่สามารถจองคิวในวันหยุดของร้านได้");
                  return;
                }
              }
              setSelectedDate(val);
            }}
            className="w-full sm:w-auto"
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
      </div>

      <div>
        <h3 className="mb-2 font-medium text-sm">
          เวลาที่สามารถจองได้ (ใช้เวลารวม{" "}
          {formatDurationMinutes(durationMinutes)})
        </h3>
        {isLoading ? (
          <p className="text-gray-500 text-sm animate-pulse">
            กำลังตรวจสอบคิวว่าง...
          </p>
        ) : availableSlots.length > 0 ? (
          <div className="gap-2 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5">
            {availableSlots.map((slotIso) => {
              const isSelected = selectedTime === slotIso;
              return (
                <Button
                  key={slotIso}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  onClick={() => onSelectSlot(slotIso)}
                  className="w-full text-sm"
                >
                  {format(parseISO(slotIso), "HH:mm", { locale: th })}
                </Button>
              );
            })}
          </div>
        ) : (
          <p className="bg-red-50 p-3 rounded-md text-red-500 text-sm">
            ขออภัย ไม่มีคิวว่างสำหรับวันนี้ กรุณาเลือกวันอื่น
          </p>
        )}
      </div>
    </div>
  );
}

type PetBooking = {
  petId: string;
  mainServiceId: string;
  addOnServiceIds: string[];
};

type AppointmentFormValues = {
  searchQuery: string;
  customerId: string;
  petBookings: PetBooking[];
  startTime: string;
  note: string;
};

type PetBreedForVariant = CustomerSearchResult["pets"][number]["breed"];
type ServiceVariant = ServiceWithVariants["variants"][number];

interface CreateAppointmentFormProps {
  services: ServiceWithVariants[];
}

function findMatchingVariant(
  service: ServiceWithVariants | undefined,
  breed: PetBreedForVariant,
): ServiceVariant | undefined {
  if (!service) return undefined;

  const variantsForPetType = service.variants.filter(
    (variant) => variant.petType === breed.type,
  );

  // Match the breed's real size first. A variant with ALL is the fallback for S/M/L.
  return (
    variantsForPetType.find((variant) => variant.size === breed.size) ??
    variantsForPetType.find((variant) => variant.size === "ALL")
  );
}

export default function CreateAppointmentForm({
  services,
}: CreateAppointmentFormProps) {
  const router = useRouter();
  const [searchResults, setSearchResults] = useState<CustomerSearchResult[]>(
    [],
  );
  const [isSearching, setIsSearching] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<AppointmentFormValues>({
    defaultValues: {
      searchQuery: "",
      customerId: "",
      petBookings: [],
      startTime: "",
      note: "",
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "petBookings",
  });

  const watchedPetBookingsValue = useWatch({ control, name: "petBookings" });
  const watchedPetBookings = useMemo(
    () => watchedPetBookingsValue || [],
    [watchedPetBookingsValue],
  );

  const searchQuery = watch("searchQuery");
  const selectedCustomerId = watch("customerId");
  const selectedCustomer = searchResults.find(
    (c) => c.id === selectedCustomerId,
  );

  useEffect(() => {
    setValue("petBookings", []);
    setValue("startTime", "");
    if (
      selectedCustomerId &&
      selectedCustomer &&
      selectedCustomer.pets.length > 0
    ) {
      append({
        petId: selectedCustomer.pets[0].id,
        mainServiceId: "",
        addOnServiceIds: [],
      });
    }
  }, [selectedCustomerId, selectedCustomer, setValue, append]);

  const hasUnmatchedSelectedService = useMemo(() => {
    if (!selectedCustomer) return false;

    return watchedPetBookings.some((booking) => {
      const petInfo = selectedCustomer.pets.find((p) => p.id === booking.petId);
      if (!petInfo) return false;

      const mainService = services.find((s) => s.id === booking.mainServiceId);
      const isMainServiceMissingVariant =
        Boolean(mainService) && !findMatchingVariant(mainService, petInfo.breed);

      const isAddOnServiceMissingVariant = (
        booking.addOnServiceIds || []
      ).some((serviceId) => {
        const addOnService = services.find((s) => s.id === serviceId);
        return (
          Boolean(addOnService) &&
          !findMatchingVariant(addOnService, petInfo.breed)
        );
      });

      return isMainServiceMissingVariant || isAddOnServiceMissingVariant;
    });
  }, [watchedPetBookings, selectedCustomer, services]);

  const maxDuration = useMemo(() => {
    let total = 0;
    if (
      !selectedCustomer ||
      !watchedPetBookings ||
      watchedPetBookings.length === 0
    ) {
      return total;
    }

    watchedPetBookings.forEach((booking) => {
      const petInfo = selectedCustomer.pets.find((p) => p.id === booking.petId);
      if (!petInfo) return;

      const mainService = services.find((s) => s.id === booking.mainServiceId);
      const mainVariant = findMatchingVariant(mainService, petInfo.breed);

      if (mainVariant) {
        total += Number(mainVariant.durationMinutes) || 0;
      }

      // The form stores service ids; duration must be derived from the matched variant.
      (booking.addOnServiceIds || []).forEach((addOnServiceId) => {
        const addOnService = services.find((s) => s.id === addOnServiceId);
        const addOnVariant = findMatchingVariant(addOnService, petInfo.breed);
        if (addOnVariant) {
          total += Number(addOnVariant.durationMinutes) || 0;
        }
      });
    });

    return total;
  }, [watchedPetBookings, selectedCustomer, services]);

  useEffect(() => {
    setValue("startTime", "", { shouldValidate: false });
  }, [maxDuration, setValue]);

  const handleSearch = async () => {
    if (!searchQuery) return;
    setIsSearching(true);
    try {
      const result = await searchCustomer(searchQuery);
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      if (!result.data || result.data.length === 0) {
        toast.error("ไม่พบลูกค้า");
        setSearchResults([]);
        return;
      }
      setSearchResults(result.data);
      toast.success("ค้นหาสำเร็จ");
    } catch (error) {
      console.error("searchCustomer error:", error);
      toast.error("เกิดข้อผิดพลาดในการค้นหา");
    } finally {
      setIsSearching(false);
    }
  };

  const onSubmit = async (data: AppointmentFormValues) => {
    if (!data.petBookings || data.petBookings.length === 0) {
      toast.error("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว");
      return;
    }

    if (hasUnmatchedSelectedService) {
      toast.error("บริการที่เลือกบางรายการไม่รองรับขนาดของสัตว์เลี้ยง");
      return;
    }

    try {
      const result = await createAppointment({
        customerId: data.customerId,
        startTimeIso: data.startTime,
        note: data.note.trim() || undefined,
        petBookings: data.petBookings.map((booking) => ({
          petId: booking.petId,
          mainServiceId: booking.mainServiceId,
          addOnServiceIds: booking.addOnServiceIds || [],
        })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("บันทึกการจองสำเร็จ");
      router.push(`/back-office/appointments/${result.data.appointmentId}`);
    } catch (error) {
      console.error("createAppointment error:", error);
      toast.error("ไม่สามารถบันทึกการจองได้");
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 w-full">
      <FieldGroup>
        <div className="flex items-end gap-2">
          <Controller
            name="searchQuery"
            control={control}
            render={({ field }) => (
              <Field className="flex-1">
                <FieldLabel htmlFor="searchQuery">
                  ค้นหาลูกค้า (ชื่อ/เบอร์โทร)
                </FieldLabel>
                <Input
                  {...field}
                  id="searchQuery"
                  placeholder="ระบุคำค้นหา..."
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleSearch();
                    }
                  }}
                />
              </Field>
            )}
          />
          <Button
            type="button"
            onClick={handleSearch}
            disabled={isSearching || !searchQuery}
          >
            {isSearching ? "กำลังค้นหา..." : "ค้นหา"}
          </Button>
        </div>
      </FieldGroup>

      {searchResults.length > 0 && (
        <div className="space-y-2">
          <FieldLabel>เลือกลูกค้า</FieldLabel>
          <div className="gap-2 grid grid-cols-1 sm:grid-cols-2">
            {searchResults.map((customer) => (
              <label
                key={customer.id}
                className={`flex items-center p-3 border rounded-md cursor-pointer transition-colors ${selectedCustomerId === customer.id ? "border-primary bg-primary/5" : "hover:bg-gray-50"}`}
              >
                <input
                  type="radio"
                  className="hidden"
                  value={customer.id}
                  {...register("customerId", {
                    required: "กรุณาเลือกลูกค้า",
                  })}
                />
                <span className="font-medium">{customer.nickname}</span>
                <span className="ml-auto text-gray-500 text-sm">
                  {customer.pets.length} สัตว์เลี้ยง
                </span>
              </label>
            ))}
          </div>
          {errors.customerId && (
            <p className="text-red-500 text-sm">{errors.customerId.message}</p>
          )}
        </div>
      )}

      {selectedCustomer && selectedCustomer.pets.length > 0 && (
        <div className="space-y-4">
          <Separator />
          <div>
            <h3 className="font-semibold text-lg">1. เลือกสัตว์เลี้ยง</h3>
            <p className="text-gray-500 text-sm">
              ติ๊กเลือกสัตว์เลี้ยงที่ต้องการนำมารับบริการ
            </p>
          </div>
          <div className="gap-4 grid grid-cols-1 sm:grid-cols-2">
            {selectedCustomer.pets.map((pet) => {
              const fieldIndex = fields.findIndex((f) => f.petId === pet.id);
              const isSelected = fieldIndex !== -1;

              return (
                <label
                  key={pet.id}
                  className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${isSelected ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "bg-white hover:border-gray-300"}`}
                >
                  <input
                    type="checkbox"
                    className="border-gray-300 rounded focus:ring-primary w-5 h-5 text-primary"
                    checked={isSelected}
                    onChange={(e) => {
                      if (e.target.checked) {
                        append({
                          petId: pet.id,
                          mainServiceId: "",
                          addOnServiceIds: [],
                        });
                      } else {
                        remove(fieldIndex);
                      }
                    }}
                  />
                  <div>
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-gray-500 text-sm">
                      {PET_TYPE_LABELS[pet.breed.type] || pet.breed.type} -{" "}
                      {pet.breed.name}
                    </p>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {fields.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <h3 className="font-semibold text-lg">2. กำหนดรายละเอียดบริการ</h3>

          {fields.map((field, index) => {
            const petInfo = selectedCustomer?.pets.find(
              (p) => p.id === field.petId,
            );
            if (!petInfo) return null;

            const currentMainServiceId =
              watchedPetBookings[index]?.mainServiceId;
            const selectedMainService = services.find(
              (service) => service.id === currentMainServiceId,
            );
            const selectedMainVariant = findMatchingVariant(
              selectedMainService,
              petInfo.breed,
            );
            const shouldShowMainVariantError =
              Boolean(selectedMainService) && !selectedMainVariant;

            return (
              <div
                key={field.id}
                className="relative space-y-4 bg-gray-50/50 p-5 border border-gray-200 rounded-lg"
              >
                <h4 className="font-medium text-primary">
                  ตั้งค่าบริการสำหรับ: {petInfo.name}
                </h4>

                <div className="gap-4 grid grid-cols-1 md:grid-cols-2">
                  <FieldGroup>
                    <FieldLabel>บริการหลัก</FieldLabel>
                    <select
                      className="flex bg-background px-3 py-2 border border-input rounded-md w-full h-10 text-sm"
                      {...register(`petBookings.${index}.mainServiceId`, {
                        required: "กรุณาเลือกบริการหลัก",
                        onChange: () => {
                          setValue("startTime", "");
                        },
                      })}
                    >
                      <option value="">-- เลือกบริการหลัก --</option>
                      {services
                        .filter((service) => service.serviceType === "MAIN")
                        .map((service) => (
                          <option key={service.id} value={service.id}>
                            {service.name}
                          </option>
                        ))}
                    </select>
                    {errors.petBookings?.[index]?.mainServiceId && (
                      <p className="text-red-500 text-sm">
                        {errors.petBookings[index]?.mainServiceId?.message}
                      </p>
                    )}
                    {shouldShowMainVariantError && (
                      <p className="text-red-500 text-sm">
                        บริการนี้ไม่รองรับขนาดของสัตว์เลี้ยงตัวนี้
                      </p>
                    )}
                  </FieldGroup>
                </div>

                <FieldGroup>
                  <FieldLabel>บริการเสริม</FieldLabel>
                  <Controller
                    name={`petBookings.${index}.addOnServiceIds`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2 mt-2">
                        {services
                          .filter((service) => service.serviceType === "ADDON")
                          .map((service) => {
                            const compatibleVariant = findMatchingVariant(
                              service,
                              petInfo.breed,
                            );
                            if (!compatibleVariant) return null;

                            return (
                              <label
                                key={service.id}
                                className="flex items-center gap-2 bg-white p-3 border rounded-md text-sm cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="border-gray-300 rounded focus:ring-primary text-primary"
                                  checked={
                                    field.value?.includes(service.id) || false
                                  }
                                  onChange={(e) => {
                                    const newValues = e.target.checked
                                      ? [...(field.value || []), service.id]
                                      : (field.value || []).filter(
                                          (id) => id !== service.id,
                                        );
                                    field.onChange(newValues);
                                    setValue("startTime", "");
                                  }}
                                />
                                <span>
                                  {service.name} (+{compatibleVariant.minPrice}{" "}
                                  บาท / {compatibleVariant.durationMinutes}{" "}
                                  นาที)
                                </span>
                              </label>
                            );
                          })}
                      </div>
                    )}
                  />
                </FieldGroup>
              </div>
            );
          })}
        </div>
      )}

      {fields.length > 0 && maxDuration > 0 && !hasUnmatchedSelectedService ? (
        <>
          <Separator />
          <Controller
            name="startTime"
            control={control}
            rules={{ required: "กรุณาเลือกเวลาที่ต้องการจอง" }}
            render={({ field }) => (
              <AvailableSlots
                durationMinutes={maxDuration}
                selectedTime={field.value}
                error={errors.startTime?.message}
                onSelectSlot={(startTime) => field.onChange(startTime)}
              />
            )}
          />

          <FieldGroup className="pt-4">
            <FieldLabel htmlFor="note">หมายเหตุเพิ่มเติม (ถ้ามี)</FieldLabel>
            <textarea
              {...register("note")}
              id="note"
              rows={3}
              placeholder="เช่น ฝากรับกลับเลท, สุนัขมีอาการหวาดกลัวง่าย, ต้องการช่างคนไหนเป็นพิเศษ..."
              className="flex bg-background px-3 py-2 border border-input focus-visible:border-transparent rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full text-sm resize-y"
            />
          </FieldGroup>

          <div className="flex justify-end pt-4">
            <Button
              type="submit"
              size="lg"
              disabled={isSubmitting || hasUnmatchedSelectedService}
            >
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการจองทั้งหมด"}
            </Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
