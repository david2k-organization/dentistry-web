import { api, type ApiEnvelope } from "@/lib/api";
import type {
  DailyRevenue,
  MonthlyRevenue,
  ReportOverview,
  TopService,
} from "./types";

export async function getReportOverview(): Promise<ReportOverview> {
  const res = await api.get<ApiEnvelope<ReportOverview>>("/reports/overview");
  return res.data.data;
}

export async function getRevenueLast6Months(): Promise<MonthlyRevenue[]> {
  const res = await api.get<ApiEnvelope<MonthlyRevenue[]>>(
    "/reports/revenue-last-6-months",
  );
  return res.data.data;
}

/** Doanh thu 7 ngày gần nhất, thứ tự mới → cũ (`GET /reports/revenue-last-7-days`). */
export async function getRevenueLast7Days(): Promise<DailyRevenue[]> {
  const res = await api.get<ApiEnvelope<DailyRevenue[]>>(
    "/reports/revenue-last-7-days",
  );
  return res.data.data;
}

export async function getTop5Services(): Promise<TopService[]> {
  const res = await api.get<ApiEnvelope<TopService[]>>("/reports/top-5-services");
  return res.data.data;
}
