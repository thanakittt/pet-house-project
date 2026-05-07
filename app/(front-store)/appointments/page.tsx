import CustomerAppointment from "@/modules/customer/components/front-store/CustomerAppointment";
import {
  getCustomerAppointments,
  parseCustomerAppointmentsPage,
} from "@/modules/appointment/queries/get-customer-appointments";
import React from "react";
import { redirect } from "next/navigation";

export default async function CustomerAppointmentPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string | string[] }>;
}) {
  const query = await searchParams;
  const page = parseCustomerAppointmentsPage(query.page);
  const appointments = await getCustomerAppointments({ page });

  if (!appointments.success) {
    if (appointments.error.includes("เข้าสู่ระบบ")) {
      redirect("/sign-in");
    }

    if (appointments.error.includes("โปรไฟล์")) {
      redirect("/setup-profile");
    }

    throw new Error(appointments.error);
  }

  return <CustomerAppointment appointmentData={appointments.data} />;
}
