import AppointmentStepper from "@/modules/appointment/components/front-store/AppointmentStepper";
import { requireCustomer } from "@/lib/session";
import { getCustomerProfile } from "@/modules/customer/queries/get-profile";
import { listPets } from "@/modules/pet/queries/list-pets";
import { listServicesWithVariants } from "@/modules/service/queries/list-services";
import { redirect } from "next/navigation";

export default async function Page() {
  const session = await requireCustomer();

  if (!session) {
    redirect("/sign-in");
  }

  const [profile, services] = await Promise.all([
    getCustomerProfile(session.user),
    listServicesWithVariants(),
  ]);

  if (!profile.success) {
    throw new Error(profile.error);
  }

  if (!profile.data) {
    redirect("/setup-profile");
  }

  if (!services.success) {
    throw new Error(services.error);
  }

  const pets = await listPets(profile.data.customerId);

  if (!pets.success) {
    throw new Error(pets.error);
  }

  return (
    <AppointmentStepper
      pets={pets.data}
      services={services.data}
    />
  );
}
