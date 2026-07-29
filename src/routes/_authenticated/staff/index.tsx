import { createFileRoute } from "@tanstack/react-router";

import { StaffPage } from "@/features/staff/StaffPage";

export const Route = createFileRoute("/_authenticated/staff/")({
  component: StaffPage,
});
