import { createFileRoute } from "@tanstack/react-router";

import { PatientsPage } from "@/features/patients/patients-page";

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsPage,
});
