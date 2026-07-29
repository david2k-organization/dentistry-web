import { createFileRoute } from "@tanstack/react-router";

import { InvoicesPage } from "@/features/invoices/InvoicesPage";

export const Route = createFileRoute("/_authenticated/invoices/")({
  component: InvoicesPage,
});
