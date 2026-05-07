import CustomerAppointmentDetails from "@/modules/customer/components/front-store/CustomerAppointmentDetail";
import { getCustomerAppointmentDetail } from "@/modules/appointment/queries/get-customer-appointment-detail";
import { notFound, redirect } from "next/navigation";
import React from "react";

export default async function CustomerAppointmentDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  if (!id) {
    notFound();
  }

  const appointment = await getCustomerAppointmentDetail(id);

  if (!appointment.success) {
    if (appointment.error.includes("เข้าสู่ระบบ")) {
      redirect("/sign-in");
    }

    if (appointment.error.includes("โปรไฟล์")) {
      redirect("/setup-profile");
    }

    throw new Error(appointment.error);
  }

  if (!appointment.data) {
    notFound();
  }

  return <CustomerAppointmentDetails appointment={appointment.data} />;
}
