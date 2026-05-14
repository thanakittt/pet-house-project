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
  const [formData, setFormData] =
    useState<FrontStoreFormData>(initialFormData);
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
      "เลือกสัตว์เลี้ยง",
      "บริการหลัก",
      "บริการเสริม",
      "สรุปรายการ",
      "นัดหมายวันเวลา",
    ];

    return (
      <div className="relative mx-auto mb-12 flex max-w-4xl items-start justify-between">
        <div className="absolute left-0 top-6 -z-10 h-1 w-full bg-slate-100" />
        {[1, 2, 3, 4, 5].map((item) => (
          <div key={item} className="flex w-full flex-col items-center gap-3">
            <div
              className={cn(
                "flex size-12 items-center justify-center rounded-full border-4 font-bold transition-all",
                step === item
                  ? "border-white bg-primary text-white ring-2 ring-primary"
                  : step > item
                    ? "border-white bg-primary text-white ring-2 ring-green-400/60"
                    : "border-white bg-muted text-primary/40",
              )}
            >
              {item}
            </div>
            <span
              className={cn(
                "text-center text-[10px] font-medium md:text-xs",
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
      <div className="mx-auto my-4 flex h-auto w-full max-w-5xl flex-col items-center gap-6 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <div className="flex size-16 items-center justify-center rounded-full bg-green-100 text-green-700">
          {verifiedSlipTransRef ? (
            <ShieldCheck className="size-8" />
          ) : (
            <CheckCircle2 className="size-8" />
          )}
        </div>
        <div>
          <h1 className="mb-2 text-2xl font-bold text-slate-900">
            {verifiedSlipTransRef ? "ยืนยันคิวแล้ว" : "จองคิวสำเร็จ"}
          </h1>
          <p className="text-sm text-muted-foreground">
            รหัสการจอง #{createdAppointmentId.split("-")[0].toUpperCase()}
          </p>
        </div>
        {verifiedSlipTransRef ? (
          // verify ผ่านแล้ว appointment ถูกเปลี่ยนเป็น CONFIRMED ฝั่ง server
          <div className="w-full max-w-xl rounded-2xl border border-green-200 bg-green-50 p-5 text-left text-sm text-green-900">
            <div className="flex flex-wrap items-center gap-2 font-semibold">
              <span>สถานะปัจจุบัน:</span>
              <AppointmentStatusBadge status="CONFIRMED" />
            </div>
            <p className="mt-1">
              ระบบตรวจสอบสลิปและบันทึกค่ามัดจำ {APPOINTMENT_DEPOSIT_AMOUNT} บาทเรียบร้อยแล้ว
            </p>
            <p className="mt-2 text-xs text-green-800">
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
    <div className="mx-auto my-4 h-auto w-full max-w-5xl rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
      <h1 className="mb-10 text-2xl font-bold text-slate-900">
        จองคิวรับบริการ
      </h1>

      {renderStepperHeader()}

      <div className="h-auto md:mx-10">
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
        <div className="mx-auto mt-6 max-w-4xl">
          <label
            htmlFor="appointment-note"
            className="mb-2 block text-sm font-medium text-primary"
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
            className="flex w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            placeholder="เช่น ฝากรับกลับเลท, สัตว์เลี้ยงกลัวง่าย, ต้องการแจ้งข้อมูลเพิ่มเติม..."
          />
        </div>
      ) : null}

      <div className="mt-6 flex items-center justify-between border-t border-muted-foreground/20 pt-6">
        <Button
          variant="link"
          onClick={prevStep}
          disabled={step === 1 || isPending}
          className="px-0 text-muted-foreground no-underline hover:text-primary"
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
            "px-8 shadow-none transition-colors",
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
