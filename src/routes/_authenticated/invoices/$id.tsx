import { createFileRoute } from "@tanstack/react-router";

import { InvoiceDetailPage } from "@/features/invoices/InvoiceDetailPage";

export const Route = createFileRoute("/_authenticated/invoices/$id")({
  component: InvoiceDetailPage,
});
