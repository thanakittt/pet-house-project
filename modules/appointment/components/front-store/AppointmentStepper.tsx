"use client";

import { LoadingButton } from "@/components/shared/LoadingButton";
import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import { Button } from "@/components/ui/button";
import { APPOINTMENT_DEPOSIT_AMOUNT } from "@/lib/constants/appointment";
import { cn } from "@/lib/utils";
import { createCustomerAppointment } from "@/modules/appointment/actions/create-customer-appointment";
import type { Pet } from "@/modules/pet/types/pet";
import type { ServiceWithVariants } from "@/modules/service/types/service";
import { CheckCircle2, ShieldCheck } from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import {
  getBookingDetails,
  getTotalDurationMinutes,
  type FrontStoreBooking,
  type FrontStoreFormData,
} from "./booking-utils";
import DepositSlipUpload from "./DepositSlipUpload";
import Step1PetSelection from "./Step1PetSelection";
import Step2MainService from "./Step2MainService";
import Step3AddOnService from "./Step3AddOnService";
import Step4Summary from "./Step4Summary";
import Step5DateTime from "./Step5DateTime";

const initialFormData: FrontStoreFormData = {
  petId: "",
  mainServiceId: "",
  addOnServiceIds: [],
  startTimeIso: "",
  note: "",
};

export default function AppointmentStepper({
  pets,
  services,
}: {
  pets: Pet[];
  services: ServiceWithVariants[];
}) {
  const [step, setStep] = useState(1);
  const [bookings, setBookings] = useState<FrontStoreBooking[]>([]);
  const [formData, setFormData] = useState<FrontStoreFormData>(initialFormData);
  const [createdAppointmentId, setCreatedAppointmentId] = useState("");
  const [createdAppointmentTime, setCreatedAppointmentTime] = useState("");
  // หลังลูกค้าจองสำเร็จแล้ว component เดิมจะเปลี่ยนเป็นหน้าจ่ายมัดจำ
  // state นี้ใช้จำเลขอ้างอิงสลิปเมื่อ Thunder verify ผ่าน เพื่อสลับเป็นหน้าสถานะยืนยันคิวแล้ว
  const [verifiedSlipTransRef, setVerifiedSlipTransRef] = useState("");
  const [isPending, startTransition] = useTransition();

  const totalSteps = 5;

  const selectedPet = pets.find((pet) => pet.id === formData.petId);

  const allBookings = useMemo(() => {
    const currentBooking =
      formData.petId && formData.mainServiceId
        ? [
            {
              petId: formData.petId,
              mainServiceId: formData.mainServiceId,
              addOnServiceIds: formData.addOnServiceIds,
            },
          ]
        : [];

    return [...bookings, ...currentBooking];
  }, [bookings, formData]);

  const totalDurationMinutes = useMemo(
    () => getTotalDurationMinutes(allBookings, pets, services),
    [allBookings, pets, services],
  );

  const updateFormData = (newData: FrontStoreFormData) => {
    setFormData(newData);
  };

  const nextStep = () => {
    if (step === totalSteps) {
      handleSubmit();
      return;
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => setStep((prev) => Math.max(prev - 1, 1));

  const handleAddMorePet = () => {
    if (!formData.petId || !formData.mainServiceId) return;

    setBookings((prev) => [
      ...prev,
      {
        petId: formData.petId,
        mainServiceId: formData.mainServiceId,
        addOnServiceIds: formData.addOnServiceIds,
      },
    ]);
    setFormData((prev) => ({
      ...prev,
      petId: "",
      mainServiceId: "",
      addOnServiceIds: [],
      startTimeIso: "",
    }));
    setStep(1);
  };

  const handleRemovePet = (index: number, isCurrentFormData: boolean) => {
    if (isCurrentFormData) {
      setFormData((prev) => ({
        ...prev,
        petId: "",
        mainServiceId: "",
        addOnServiceIds: [],
        startTimeIso: "",
      }));
      if (bookings.length === 0) setStep(1);
      return;
    }

    const newBookings = bookings.filter((_, itemIndex) => itemIndex !== index);
    setBookings(newBookings);
    setFormData((prev) => ({ ...prev, startTimeIso: "" }));

    if (newBookings.length === 0 && !formData.petId) {
      setStep(1);
    }
  };

  const handleSubmit = () => {
    if (allBookings.length === 0) {
      toast.error("กรุณาเลือกสัตว์เลี้ยงอย่างน้อย 1 ตัว");
      return;
    }

    if (!formData.startTimeIso) {
      toast.error("กรุณาเลือกวันและเวลาที่ต้องการจอง");
      return;
    }

    const hasInvalidBooking = allBookings.some((booking) => {
      const details = getBookingDetails(booking, pets, services);
      return !details.pet || !details.mainService || !details.mainVariant;
    });

    if (hasInvalidBooking) {
      toast.error("บริการที่เลือกบางรายการไม่รองรับสัตว์เลี้ยง");
      return;
    }

    startTransition(async () => {
      const result = await createCustomerAppointment({
        startTimeIso: formData.startTimeIso,
        note: formData.note,
        petBookings: allBookings,
      });

      if (!result.success) {
        toast.error(result.error || "ไม่สามารถบันทึกการจองได้");
        return;
      }

      setCreatedAppointmentId(result.data.appointmentId);
      setCreatedAppointmentTime(result.data.appointmentCreatedAt);
      toast.success("จองคิวสำเร็จ");
    });
  };

  const renderStepperHeader = () => {
    const stepNames = [
      "สัตว์เลี้ยง",
      "บริการหลัก",
      "บริการเสริม",
      "สรุป",
      "วันเวลา",
    ];

    return (
      <div className="relative flex justify-between items-start mx-auto mb-10 max-w-4xl">
        <div className="top-6 left-0 -z-10 absolute bg-muted w-full h-1" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex flex-col items-center gap-3 w-full">
            <div
              className={cn(
                "flex justify-center items-center rounded-full size-10 md:size-12 font-bold transition-all",
                step === item
                  ? "border-4 border-background bg-primary text-primary-foreground ring-2 text-xs md:text-base ring-primary"
                  : step > item
                    ? "border-4 border-background bg-primary text-primary-foreground ring-2 text-xs md:text-base ring-emerald-400/60"
                    : "border-background bg-muted text-xs md:text-base text-muted-foreground",
              )}
            >
              {item}
            </div>
            <span
              className={cn(
                "font-medium text-[10px] md:text-xs text-center",
                step >= item ? "text-primary" : "text-primary/40",
              )}
            >
              {stepNames[item - 1]}
            </span>
          </div>
        ))}
      </div>
    );
  };

  if (createdAppointmentId) {
    // เมื่อสร้าง appointment แล้ว ไม่กลับไปแสดง stepper อีกใน session นี้
    // ลูกค้าจะเห็น QR/upload slip ต่อทันที เพราะ appointment อยู่สถานะ PENDING_DEPOSIT
    return (
      <div className="flex flex-col items-center gap-6 bg-card shadow-sm mx-auto my-4 p-8 border rounded-2xl w-full max-w-5xl h-auto text-card-foreground text-center">
        <div className="flex justify-center items-center bg-emerald-100 dark:bg-emerald-950/40 rounded-full size-16 text-emerald-700 dark:text-emerald-300">
          {verifiedSlipTransRef ? (
            <ShieldCheck className="size-8" />
          ) : (
            <CheckCircle2 className="size-8" />
          )}
        </div>
        <div>
          <h1 className="mb-2 font-bold text-foreground text-2xl">
            {verifiedSlipTransRef ? "ยืนยันคิวแล้ว" : "จองคิวสำเร็จ"}
          </h1>
          <p className="text-muted-foreground text-sm">
            รหัสการจอง #{createdAppointmentId.split("-")[0].toUpperCase()}
          </p>
        </div>
        {verifiedSlipTransRef ? (
          // verify ผ่านแล้ว appointment ถูกเปลี่ยนเป็น CONFIRMED ฝั่ง server
          <div className="bg-emerald-50 dark:bg-emerald-950/30 p-5 border border-emerald-200 dark:border-emerald-800 rounded-2xl w-full max-w-xl text-emerald-900 dark:text-emerald-200 text-sm text-left">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span>สถานะปัจจุบัน:</span>
              <AppointmentStatusBadge status="CONFIRMED" />
            </div>
            <p className="mt-1">
              ระบบตรวจสอบสลิปและบันทึกค่ามัดจำ {APPOINTMENT_DEPOSIT_AMOUNT}{" "}
              บาทเรียบร้อยแล้ว
            </p>
            <p className="mt-2 text-emerald-800 dark:text-emerald-300 text-xs">
              เลขอ้างอิงสลิป: {verifiedSlipTransRef}
            </p>
          </div>
        ) : (
          // ใช้ component เดียวกับหน้าค้างมัดจำ เพื่อให้ flow upload และ Thunder verification อยู่จุดเดียว
          <DepositSlipUpload
            appointmentId={createdAppointmentId}
            appointmentCreatedAt={createdAppointmentTime}
            onVerified={(transRef) => setVerifiedSlipTransRef(transRef || "-")}
          />
        )}
      </div>
    );
  }

  return (
    <div className="bg-card shadow-sm mx-auto my-4 p-8 border rounded-2xl w-full max-w-5xl h-auto text-card-foreground">
      <h1 className="mb-8 font-bold text-xl md:text-2xl text-pretty">
        จองคิวรับบริการ
      </h1>

      {renderStepperHeader()}

      <div className="md:mx-10 h-auto">
        {step === 1 && (
          <Step1PetSelection
            data={formData}
            update={updateFormData}
            pets={pets}
          />
        )}
        {step === 2 && (
          <Step2MainService
            data={formData}
            update={updateFormData}
            pet={selectedPet}
            services={services}
          />
        )}
        {step === 3 && (
          <Step3AddOnService
            data={formData}
            update={updateFormData}
            pet={selectedPet}
            services={services}
          />
        )}
        {step === 4 && (
          <Step4Summary
            data={formData}
            bookings={bookings}
            update={updateFormData}
            pets={pets}
            services={services}
            setStep={setStep}
            onAddMore={handleAddMorePet}
            onRemovePet={handleRemovePet}
          />
        )}
        {step === 5 && (
          <Step5DateTime
            data={formData}
            update={updateFormData}
            durationMinutes={totalDurationMinutes}
          />
        )}
      </div>

      {step === 5 ? (
        <div className="mx-auto mt-6 md:px-6 max-w-4xl">
          <label
            htmlFor="appointment-note"
            className="block mb-2 font-medium text-primary text-sm"
          >
            หมายเหตุเพิ่มเติม (ถ้ามี)
          </label>
          <textarea
            id="appointment-note"
            value={formData.note}
            onChange={(event) =>
              setFormData((prev) => ({ ...prev, note: event.target.value }))
            }
            rows={3}
            className="flex bg-background px-3 py-2 border border-input rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary w-full text-sm resize-y"
            placeholder="เช่น ฝากรับกลับเลท, สัตว์เลี้ยงกลัวง่าย, ต้องการแจ้งข้อมูลเพิ่มเติม..."
          />
        </div>
      ) : null}

      <div className="flex justify-between items-center mt-6 pt-6 border-muted-foreground/20 border-t">
        <Button
          variant="link"
          onClick={prevStep}
          disabled={step === 1 || isPending}
          className="px-0 text-muted-foreground hover:text-primary no-underline"
        >
          {step > 1 && "ย้อนกลับ"}
        </Button>

        <LoadingButton
          onClick={nextStep}
          disabled={
            (step === 1 && (!formData.petId || pets.length === 0)) ||
            (step === 2 && !formData.mainServiceId) ||
            (step === 4 && allBookings.length === 0) ||
            (step === 5 && !formData.startTimeIso)
          }
          isLoading={isPending}
          loadingText="กำลังบันทึก..."
          className={cn(
            "shadow-none px-8 transition-colors",
            step === totalSteps
              ? "bg-green-600 hover:bg-green-700"
              : "bg-primary hover:bg-primary/80",
          )}
        >
          {step === totalSteps ? "ยืนยันการจอง" : "ถัดไป"}
        </LoadingButton>
      </div>
    </div>
  );
}
