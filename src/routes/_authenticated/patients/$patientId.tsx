import { createFileRoute } from "@tanstack/react-router";

import { PatientDetailPage } from "@/features/patients/patient-detail-page";

export const Route = createFileRoute("/_authenticated/patients/$patientId")({
  component: PatientDetailPage,
});
