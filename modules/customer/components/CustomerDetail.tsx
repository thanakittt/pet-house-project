"use client";

import { PetInfoForm } from "@/modules/pet/components/PetInfoForm";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { Pet } from "@/modules/pet/types/pet";
import { AppointmentHistoryList } from "./AppointmentHistoryList";
import { type CustomerAppointmentHistoryResult } from "@/modules/appointment/queries/get-customer-history";
import { type ActionResponse } from "@/types/action";
import BackButton from "@/components/BackButton";

interface CustomerDetailProps {
  appointmentHistory: ActionResponse<CustomerAppointmentHistoryResult>;
  petBreeds: PetBreed[];
  customerId: string;
  pets: Pet[];
}

export default function CustomerDetail({
  appointmentHistory,
  petBreeds,
  customerId,
  pets,
}: CustomerDetailProps) {
  return (
    <>
      <BackButton href="/back-office/customers" />
      <div className="space-y-6">
        <PetInfoForm
          pets={pets}
          petBreeds={petBreeds}
          customerId={customerId}
        />
        <AppointmentHistoryList appointmentHistory={appointmentHistory} />
      </div>
    </>
  );
}
