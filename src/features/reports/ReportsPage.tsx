import { useEffect, useState } from "react";

import { getReportOverview, getRevenueLast6Months, getTop5Services } from "./api";
import { formatVnd } from "./format";
import type { MonthlyRevenue, ReportOverview, TopService } from "./types";

const CHART_H = 200;
const numberVN = new Intl.NumberFormat("vi-VN");

type Kpi = { label: string; value: string; delta?: string; up?: boolean };

function monthShort(iso: string): string {
  return `Th${new Date(iso).getUTCMonth() + 1}`;
}

function revenueDelta(months: MonthlyRevenue[]): { delta?: string; up?: boolean } {
  if (months.length < 2 || months[1].revenue === 0) return {};
  const pct = ((months[0].revenue - months[1].revenue) / months[1].revenue) * 100;
  const up = pct >= 0;
  return {
    delta: `${up ? "▲" : "▼"} ${Math.abs(Math.round(pct))}% so với tháng trước`,
    up,
  };
}

export function ReportsPage() {
  const [overview, setOverview] = useState<ReportOverview | null>(null);
  const [months, setMonths] = useState<MonthlyRevenue[]>([]);
  const [topServices, setTopServices] = useState<TopService[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        const [ov, rev, top] = await Promise.all([
          getReportOverview(),
          getRevenueLast6Months(),
          getTop5Services(),
        ]);
        if (!active) return;
        setOverview(ov);
        setMonths(rev);
        setTopServices(top);
      } catch {
        if (active) setError("Không thể tải số liệu báo cáo.");
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="rounded-[14px] border border-border bg-card px-[18px] py-10 text-center text-[13px] text-muted-foreground">
        Đang tải số liệu báo cáo…
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-[14px] border border-[#f2ded2] bg-[#fdf6f2] px-[18px] py-10 text-center text-[13px] text-[#a4553a]">
        {error}
      </div>
    );
  }

  const revDelta = revenueDelta(months);
  const kpis: Kpi[] = [
    {
      label: "Doanh thu tháng này",
      value: overview ? formatVnd(overview.revenue) : "—",
      delta: revDelta.delta,
      up: revDelta.up,
    },
    {
      label: "Bệnh nhân mới",
      value: overview ? numberVN.format(overview.countNewPatients) : "—",
    },
    {
      label: "Lịch hẹn hoàn tất",
      value: overview ? numberVN.format(overview.countCompletedAppointments) : "—",
    },
  ];

  const chartMonths = [...months].reverse();
  const monthMax = Math.max(1, ...chartMonths.map((m) => m.revenue));
  const serviceMax = Math.max(1, ...topServices.map((s) => s.revenue));

  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="text-[12.5px] text-muted-foreground">{k.label}</div>
            <div className="mt-1.5 text-[25px] font-semibold tracking-tight tabular-nums text-foreground">
              {k.value}
            </div>
            {k.delta && (
              <div
                className="mt-0.5 text-[11.5px]"
                style={{ color: k.up ? "#3f7a55" : "#a4553a" }}
              >
                {k.delta}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Doanh thu 6 tháng */}
        <div className="rounded-[14px] border border-border bg-card p-[18px]">
          <div className="text-[14.5px] font-semibold text-foreground">Doanh thu 6 tháng</div>
          {chartMonths.length === 0 ? (
            <div className="mt-4 text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</div>
          ) : (
            <div className="mt-5 flex items-end gap-4" style={{ height: CHART_H + 40 }}>
              {chartMonths.map((m, i) => (
                <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
                  <div className="text-[11px] tabular-nums text-muted-foreground">
                    {formatVnd(m.revenue)}
                  </div>
                  <div
                    className="w-full rounded-t-lg"
                    style={{
                      height: Math.round((m.revenue / monthMax) * CHART_H),
                      background: i === chartMonths.length - 1 ? "#0f7a73" : "#cfe4e2",
                    }}
                  />
                  <div className="text-xs text-[#4a6664]">{monthShort(m.month)}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dịch vụ theo doanh thu */}
        <div className="rounded-[14px] border border-border bg-card p-[18px]">
          <div className="text-[14.5px] font-semibold text-foreground">Dịch vụ theo doanh thu</div>
          {topServices.length === 0 ? (
            <div className="mt-4 text-[12.5px] text-muted-foreground">Chưa có dữ liệu.</div>
          ) : (
            <div className="mt-4 flex flex-col gap-3.5">
              {topServices.map((s) => (
                <div key={s.serviceId}>
                  <div className="mb-1.5 flex justify-between text-[12.5px]">
                    <span className="text-foreground">{s.serviceName}</span>
                    <span className="font-semibold tabular-nums text-foreground">
                      {formatVnd(s.revenue)}
                    </span>
                  </div>
                  <div className="h-[7px] rounded-[4px] bg-[#eef4f3]">
                    <div
                      className="h-full rounded-[4px] bg-primary"
                      style={{ width: `${Math.round((s.revenue / serviceMax) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
