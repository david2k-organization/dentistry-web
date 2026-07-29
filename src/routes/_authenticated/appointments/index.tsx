import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { AppointmentsPage } from "@/features/appointments/AppointmentsPage";

const appointmentsSearchSchema = z.object({
  newAppt: z.boolean().optional(),
});

export const Route = createFileRoute("/_authenticated/appointments/")({
  validateSearch: appointmentsSearchSchema,
  component: AppointmentsPage,
});
