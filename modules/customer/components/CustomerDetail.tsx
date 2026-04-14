"use client";

import Link from "next/link";
// UserX icon ถูกลบออก — ฟีเจอร์ unlink customer ยังไม่ได้พัฒนา
import { ChevronLeft } from "lucide-react";
import { PetInfoForm } from "@/modules/pet/components/PetInfoForm";
import { PetBreed } from "@/modules/pet-breed/types/pet-breed";
import { Pet } from "@/modules/pet/types/pet";

interface CustomerDetailProps {
  petBreeds: PetBreed[];
  customerId: string;
  pets: Pet[];
}

export default function CustomerDetail({
  petBreeds,
  customerId,
  pets,
}: CustomerDetailProps) {
  return (
    <>
      <header className="flex items-center gap-4 mb-6 hover:text-muted-foreground transition-colors cursor-pointer">
        <Link href="/customers">
          <div className="flex items-center gap-2">
            <ChevronLeft size={20} />
            <div className="flex flex-col">
              <h1 className="font-bold text-xl">รายละเอียดลูกค้า</h1>
              {/* <p className="text-muted-foreground text-sm">
                จัดการข้อมูลของ{" "}
                <span className="font-normal">{customer.name}</span>
              </p> */}
            </div>
          </div>
        </Link>
      </header>

      <div className="space-y-6">
        <PetInfoForm
          pets={pets}
          petBreeds={petBreeds}
          customerId={customerId}
        />
        {/* <AppointmentHistoryForm /> */}
      </div>
    </>
  );
}
