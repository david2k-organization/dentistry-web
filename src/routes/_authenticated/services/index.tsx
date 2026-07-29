import { createFileRoute } from "@tanstack/react-router";

import { ServicesPage } from "@/features/services/ServicesPage";

export const Route = createFileRoute("/_authenticated/services/")({
  component: ServicesPage,
});
