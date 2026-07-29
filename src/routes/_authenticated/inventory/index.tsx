import { createFileRoute } from "@tanstack/react-router";

import { InventoryPage } from "@/features/inventory/InventoryPage";

export const Route = createFileRoute("/_authenticated/inventory/")({
  component: InventoryPage,
});
