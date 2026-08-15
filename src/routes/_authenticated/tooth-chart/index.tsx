import { createFileRoute } from "@tanstack/react-router";

import { ToothChartPage } from "@/features/tooth-chart/ToothChartPage";

export const Route = createFileRoute("/_authenticated/tooth-chart/")({
  component: ToothChartPage,
});
