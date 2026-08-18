import { createFileRoute } from "@tanstack/react-router";

import { PaymentsPage } from "@/features/invoices/PaymentsPage";

export const Route = createFileRoute("/_authenticated/payments/")({
  component: PaymentsPage,
});
