type Kpi = { label: string; value: string; delta: string; up: boolean };

const kpis: Kpi[] = [
  { label: "Doanh thu 6 tháng", value: "1,42 tỷ", delta: "▲ 12% so với kỳ trước", up: true },
  { label: "Bệnh nhân mới", value: "312", delta: "▲ 8% so với kỳ trước", up: true },
  { label: "Lịch hẹn hoàn tất", value: "1.847", delta: "▲ 5% so với kỳ trước", up: true },
  { label: "Tỷ lệ tái khám", value: "68%", delta: "▼ 3% so với kỳ trước", up: false },
];

type Month = { short: string; label: string; value: number };

const months: Month[] = [
  { short: "Th2", label: "198 tr", value: 198 },
  { short: "Th3", label: "224 tr", value: 224 },
  { short: "Th4", label: "212 tr", value: 212 },
  { short: "Th5", label: "256 tr", value: 256 },
  { short: "Th6", label: "283 tr", value: 283 },
  { short: "Th7", label: "249 tr", value: 249 },
];
const monthMax = Math.max(...months.map((m) => m.value));
const CHART_H = 200;

type TopService = { name: string; value: string; pct: number };

const topServices: TopService[] = [
  { name: "Cấy ghép Implant", value: "486 tr", pct: 100 },
  { name: "Niềng răng", value: "352 tr", pct: 72 },
  { name: "Bọc răng sứ", value: "268 tr", pct: 55 },
  { name: "Điều trị tủy", value: "154 tr", pct: 32 },
  { name: "Trám răng thẩm mỹ", value: "98 tr", pct: 20 },
];

export function ReportsPage() {
  return (
    <div className="flex flex-col gap-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="text-[12.5px] text-muted-foreground">{k.label}</div>
            <div className="mt-1.5 text-[25px] font-semibold tracking-tight tabular-nums text-foreground">
              {k.value}
            </div>
            <div
              className="mt-0.5 text-[11.5px]"
              style={{ color: k.up ? "#3f7a55" : "#a4553a" }}
            >
              {k.delta}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.6fr_1fr]">
        {/* Doanh thu 6 tháng */}
        <div className="rounded-[14px] border border-border bg-card p-[18px]">
          <div className="text-[14.5px] font-semibold text-foreground">Doanh thu 6 tháng</div>
          <div className="mt-5 flex items-end gap-4" style={{ height: CHART_H + 40 }}>
            {months.map((m, i) => (
              <div key={m.short} className="flex flex-1 flex-col items-center gap-2">
                <div className="text-[11.5px] tabular-nums text-muted-foreground">{m.label}</div>
                <div
                  className="w-full rounded-t-lg"
                  style={{
                    height: Math.round((m.value / monthMax) * CHART_H),
                    background: i === months.length - 1 ? "#0f7a73" : "#cfe4e2",
                  }}
                />
                <div className="text-xs text-[#4a6664]">{m.short}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Dịch vụ theo doanh thu */}
        <div className="rounded-[14px] border border-border bg-card p-[18px]">
          <div className="text-[14.5px] font-semibold text-foreground">Dịch vụ theo doanh thu</div>
          <div className="mt-4 flex flex-col gap-3.5">
            {topServices.map((s) => (
              <div key={s.name}>
                <div className="mb-1.5 flex justify-between text-[12.5px]">
                  <span className="text-foreground">{s.name}</span>
                  <span className="font-semibold tabular-nums text-foreground">{s.value}</span>
                </div>
                <div className="h-[7px] rounded-[4px] bg-[#eef4f3]">
                  <div
                    className="h-full rounded-[4px] bg-primary"
                    style={{ width: `${s.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
