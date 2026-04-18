"use client";

import { useEffect, useState, useMemo } from "react";
import { useForm, Controller, useFieldArray, useWatch } from "react-hook-form";
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
import { PET_SIZE_LABELS } from "@/lib/constants/service-type";
import { createAppointment } from "../actions/create-appointment";

// ----------------------------------------------------------------------
// AvailableSlots Component
// ----------------------------------------------------------------------
interface AvailableSlotsProps {
  durationMinutes: number;
  selectedTime: string | null;
  onSelectSlot: (startTime: string) => void;
  error?: string;
}

/**
 * แปลงระยะเวลาจากนาทีให้อยู่ในรูปแบบข้อความ (เช่น "1 ชั่วโมง 30 นาที")
 * @param duration ระยะเวลาเป็นนาที
 * @returns ข้อความแสดงระยะเวลา
 */
export function formatDurationMinutes(duration: number): string {
  // 1. ตรวจสอบ Edge Cases: หากค่าน้อยกว่าหรือเท่ากับ 0 หรือไม่ใช่ตัวเลข ให้คืนค่าเริ่มต้น
  if (!Number.isFinite(duration) || duration <= 0) {
    return "0 นาที";
  }

  // 2. คำนวณชั่วโมงและนาทีโดยปัดเศษทิ้งป้องกันค่าทศนิยม
  const hours = Math.floor(duration / 60);
  const minutes = Math.floor(duration % 60);

  // 3. ใช้ Early Return เพื่อให้อ่านตรรกะได้ง่ายขึ้น
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
  const [selectedDate, setSelectedDate] = useState<string>(
    format(new Date(), "yyyy-MM-dd"),
  );
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || durationMinutes <= 0) return;
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
            onChange={(e) => setSelectedDate(e.target.value)}
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

// ----------------------------------------------------------------------
// Main Form Component
// ----------------------------------------------------------------------

type PetBooking = {
  petId: string;
  mainServiceId: string;
  mainVariantId: string;
  addOnVariantIds: string[];
};

type AppointmentFormValues = {
  searchQuery: string;
  customerId: string;
  petBookings: PetBooking[];
  startTime: string;
};

interface CreateAppointmentFormProps {
  services: ServiceWithVariants[];
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
    },
    mode: "onSubmit",
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "petBookings",
  });

  // 1. [FIXED] ใช้ useWatch แทน watch เพื่อติดตามการเปลี่ยนแปลงลึกๆ ใน Array แบบ Real-time
  const watchedPetBookings = useWatch({ control, name: "petBookings" }) || [];

  const searchQuery = watch("searchQuery");
  const selectedCustomerId = watch("customerId");
  const selectedCustomer = searchResults.find(
    (c) => c.id === selectedCustomerId,
  );

  // Auto-select สัตว์เลี้ยงตัวแรกให้อัตโนมัติเมื่อเปลี่ยนลูกค้า
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
        mainVariantId: "",
        addOnVariantIds: [],
      });
    }
  }, [selectedCustomerId, selectedCustomer, setValue, append]);

  // 2. [FIXED] คำนวณ duration จาก watchedPetBookings (ดักจับการเปลี่ยนแปลงทุกฝีก้าว)
  const maxDuration = useMemo(() => {
    let total = 0;
    if (!watchedPetBookings || watchedPetBookings.length === 0) return total;

    watchedPetBookings.forEach((booking) => {
      const mainService = services.find((s) => s.id === booking.mainServiceId);
      const mainVariant = mainService?.variants.find(
        (v) => v.id === booking.mainVariantId,
      );

      if (mainVariant) {
        total += Number(mainVariant.durationMinutes) || 0;
      }

      if (booking.addOnVariantIds && booking.addOnVariantIds.length > 0) {
        booking.addOnVariantIds.forEach((addOnId) => {
          services.forEach((s) => {
            const addOnVar = s.variants.find((v) => v.id === addOnId);
            if (addOnVar) {
              total += Number(addOnVar.durationMinutes) || 0;
            }
          });
        });
      }
    });

    return total;
  }, [watchedPetBookings, services]);

  // ล้างเวลาคิวทิ้ง หากเวลาบริการรวมเปลี่ยน
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
    try {
      const result = await createAppointment({
        customerId: data.customerId,
        startTimeIso: data.startTime,
        petBookings: data.petBookings.map((b) => ({
          petId: b.petId,
          mainVariantId: b.mainVariantId,
          addOnVariantIds: b.addOnVariantIds || [],
        })),
      });
      if (!result.success) {
        toast.error(result.error);
        return;
      }
      toast.success("บันทึกการจองสำเร็จ");
      router.push(`/appointments/${result.data.appointmentId}`);
    } catch (error) {
      toast.error("ไม่สามารถบันทึกการจองได้");
    }
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="space-y-6 w-full"
    >
      {/* 1. ค้นหาลูกค้า */}
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

      {/* 2. แสดงผลลูกค้า */}
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
                  {...register("customerId", { required: "กรุณาเลือกลูกค้า" })}
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

      {/* 3. [FIXED] ส่วนเลือกสัตว์เลี้ยง (ติ๊ก Checkbox) แยกต่างหาก */}
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
                      if (e.target.checked)
                        append({
                          petId: pet.id,
                          mainServiceId: "",
                          mainVariantId: "",
                          addOnVariantIds: [],
                        });
                      else remove(fieldIndex);
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

      {/* 4. [FIXED] ตั้งค่าบริการ (แสดงการ์ดตาม fields ที่ถูกเพิ่มเข้ามา) */}
      {fields.length > 0 && (
        <div className="space-y-6">
          <Separator />
          <h3 className="font-semibold text-lg">2. กำหนดรายละเอียดบริการ</h3>

          {fields.map((field, index) => {
            const petInfo = selectedCustomer?.pets.find(
              (p) => p.id === field.petId,
            );
            if (!petInfo) return null;

            // ดึงค่าปัจจุบันของแถวนี้มาเพื่อใช้โชว์ Variant ที่เกี่ยวข้อง
            const currentMainServiceId =
              watchedPetBookings[index]?.mainServiceId;
            const selectedMainService = services.find(
              (s) => s.id === currentMainServiceId,
            );

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
                          setValue(`petBookings.${index}.mainVariantId`, "");
                          setValue("startTime", "");
                        },
                      })}
                    >
                      <option value="">-- เลือกบริการหลัก --</option>
                      {services
                        .filter((s) => s.serviceType === "MAIN")
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
                  </FieldGroup>

                  {selectedMainService && (
                    <FieldGroup>
                      <FieldLabel>รูปแบบบริการ (Size/Type)</FieldLabel>
                      <select
                        className="flex bg-background px-3 py-2 border border-input rounded-md w-full h-10 text-sm"
                        {...register(`petBookings.${index}.mainVariantId`, {
                          required: "กรุณาเลือกรูปแบบบริการ",
                          onChange: () => setValue("startTime", ""),
                        })}
                      >
                        <option value="">-- เลือกรูปแบบ --</option>
                        {selectedMainService.variants
                          .filter((v) => v.petType === petInfo.breed.type)
                          .map((variant) => (
                            <option key={variant.id} value={variant.id}>
                              {PET_SIZE_LABELS[variant.size] || variant.size}
                            </option>
                          ))}
                      </select>
                      {errors.petBookings?.[index]?.mainVariantId && (
                        <p className="text-red-500 text-sm">
                          {errors.petBookings[index]?.mainVariantId?.message}
                        </p>
                      )}
                    </FieldGroup>
                  )}
                </div>

                <FieldGroup>
                  <FieldLabel>บริการเสริม (Add-ons)</FieldLabel>
                  <Controller
                    name={`petBookings.${index}.addOnVariantIds`}
                    control={control}
                    render={({ field }) => (
                      <div className="space-y-2 mt-2">
                        {services
                          .filter((s) => s.serviceType === "ADDON")
                          .map((service) => {
                            const compatibleVariants = service.variants.filter(
                              (v) => v.petType === petInfo.breed.type,
                            );
                            if (compatibleVariants.length === 0) return null;

                            return (
                              <div
                                key={service.id}
                                className="bg-white p-3 border rounded-md"
                              >
                                <p className="mb-2 font-medium text-sm">
                                  {service.name}
                                </p>
                                <div className="flex flex-col gap-2">
                                  {compatibleVariants.map((variant) => {
                                    const isChecked =
                                      field.value?.includes(variant.id) ||
                                      false;
                                    return (
                                      <label
                                        key={variant.id}
                                        className="flex items-center gap-2 text-sm cursor-pointer"
                                      >
                                        <input
                                          type="checkbox"
                                          className="border-gray-300 rounded focus:ring-primary text-primary"
                                          checked={isChecked}
                                          onChange={(e) => {
                                            const newValues = e.target.checked
                                              ? [
                                                  ...(field.value || []),
                                                  variant.id,
                                                ]
                                              : (field.value || []).filter(
                                                  (id) => id !== variant.id,
                                                );
                                            field.onChange(newValues);
                                            setValue("startTime", "");
                                          }}
                                        />
                                        <span>
                                          {PET_SIZE_LABELS[variant.size] ||
                                            variant.size}{" "}
                                          (+{variant.minPrice} บาท /{" "}
                                          {variant.durationMinutes} นาที)
                                        </span>
                                      </label>
                                    );
                                  })}
                                </div>
                              </div>
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

      {/* 5. ระบบเลือกเวลาว่าง (แสดงเฉพาะเมื่อตั้งค่าครบและระยะเวลา > 0) */}
      {fields.length > 0 && maxDuration > 0 ? (
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

          <div className="flex justify-end pt-4">
            <Button type="submit" size="lg" disabled={isSubmitting}>
              {isSubmitting ? "กำลังบันทึก..." : "ยืนยันการจองทั้งหมด"}
            </Button>
          </div>
        </>
      ) : null}
    </form>
  );
}
