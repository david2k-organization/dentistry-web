import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

import { ToothChartPage } from "@/features/tooth-chart/ToothChartPage";

const toothChartSearchSchema = z.object({
  patientId: z.string().optional(),
  patientName: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/tooth-chart/")({
  validateSearch: toothChartSearchSchema,
  component: ToothChartPage,
});
