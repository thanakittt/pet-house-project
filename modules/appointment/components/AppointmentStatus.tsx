"use client";

import { AppointmentStatusBadge } from "@/components/shared/AppointmentStatusBadge";
import type { AppointmentStatus as AppointmentStatusValue } from "@/modules/appointment/types/status";

interface Props {
  status: AppointmentStatusValue;
}

export default function AppointmentStatus({ status }: Props) {
  return <AppointmentStatusBadge status={status} size="lg" withIcon />;
}
