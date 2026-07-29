import { createFileRoute } from "@tanstack/react-router";

import { PatientDetailPage } from "@/features/patients/PatientDetailPage";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  component: PatientDetailPage,
});
