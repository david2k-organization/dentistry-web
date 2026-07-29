import { createFileRoute } from "@tanstack/react-router";

import { PatientsPage } from "@/features/patients/PatientPage";

export const Route = createFileRoute("/_authenticated/patients/")({
  component: PatientsPage,
});
