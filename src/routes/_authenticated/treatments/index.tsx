import { createFileRoute } from "@tanstack/react-router";

import { TreatmentPage } from "@/features/treatment/TreatmentPage";

export const Route = createFileRoute("/_authenticated/treatments/")({
  component: TreatmentPage,
});
