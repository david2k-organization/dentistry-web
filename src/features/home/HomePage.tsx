import {
  Armchair,
  CalendarCheck,
  CalendarDays,
  Package,
  TrendingUp,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

type Kpi = { icon: LucideIcon; label: string; value: string; sub: string };

const kpis: Kpi[] = [
  { icon: CalendarDays, label: "Lịch hẹn hôm nay", value: "18", sub: "5 đã hoàn tất · 2 chờ" },
  { icon: Users, label: "Bệnh nhân mới", value: "6", sub: "trong tuần này" },
  { icon: Wallet, label: "Doanh thu hôm nay", value: "12,4 tr", sub: "+8% so với hôm qua" },
  { icon: TrendingUp, label: "Công suất ghế", value: "82%", sub: "1 ghế đang hoạt động" },
];

type ApptStatus = "done" | "waiting" | "upcoming";

type Appt = {
  time: string;
  patient: string;
  service: string;
  phone: string;
  status: string;
  statusKind: ApptStatus;
  dot: string;
};

const today: Appt[] = [
  { time: "08:00", patient: "Trần Thu Hà", service: "Cạo vôi răng", phone: "0912 345 678", status: "Hoàn tất", statusKind: "done", dot: "#3f7a55" },
  { time: "08:30", patient: "Nguyễn Văn Long", service: "Nhổ răng khôn", phone: "0987 654 321", status: "Đang khám", statusKind: "waiting", dot: "#0f7a73" },
  { time: "09:15", patient: "Lê Minh Châu", service: "Trám răng thẩm mỹ", phone: "0903 111 222", status: "Chờ", statusKind: "waiting", dot: "#c98f36" },
  { time: "10:00", patient: "Phạm Quốc Bảo", service: "Niềng răng — tái khám", phone: "0938 222 333", status: "Sắp tới", statusKind: "upcoming", dot: "#9fb3b1" },
  { time: "10:45", patient: "Vũ Thị Mai", service: "Tẩy trắng răng", phone: "0977 888 999", status: "Sắp tới", statusKind: "upcoming", dot: "#9fb3b1" },
  { time: "11:30", patient: "Đỗ Hoàng Nam", service: "Cấy ghép Implant", phone: "0916 444 555", status: "Sắp tới", statusKind: "upcoming", dot: "#9fb3b1" },
];

const statusChip: Record<ApptStatus, string> = {
  done: "bg-[#eef6f1] text-[#3f7a55]",
  waiting: "bg-accent text-primary",
  upcoming: "bg-muted text-muted-foreground",
};

const queue = [
  { n: 1, patient: "Nguyễn Văn Long", service: "Nhổ răng khôn", wait: 8 },
  { n: 2, patient: "Lê Minh Châu", service: "Trám răng thẩm mỹ", wait: 3 },
];

const week7 = [
  { label: "T2", value: 8.2 },
  { label: "T3", value: 10.5 },
  { label: "T4", value: 6.8 },
  { label: "T5", value: 12.1 },
  { label: "T6", value: 9.4 },
  { label: "T7", value: 14.6 },
  { label: "CN", value: 5.1 },
];
const week7Max = Math.max(...week7.map((d) => d.value));
const week7Total = week7.reduce((s, d) => s + d.value, 0);

const lowStock = [
  { name: "Găng tay y tế size M", qty: 2, unit: "hộp" },
  { name: "Kim tiêm nha khoa", qty: 5, unit: "vỉ" },
  { name: "Composite trám răng A2", qty: 1, unit: "tuýp" },
];

export function HomePage() {
  return (
    <div className="flex flex-col gap-[18px]">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="rounded-[14px] border border-border bg-card px-[18px] py-4">
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Icon className="size-[18px] text-primary" />
                {k.label}
              </div>
              <div className="mt-2 text-[27px] font-semibold tracking-tight tabular-nums text-foreground">
                {k.value}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">{k.sub}</div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.65fr_1fr]">
        {/* Lịch hẹn hôm nay */}
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-[18px] py-[15px]">
            <div className="text-[14.5px] font-semibold text-foreground">Lịch hẹn hôm nay</div>
            <div className="text-xs text-muted-foreground">{today.length} lịch hẹn · 1 ghế</div>
            <div className="flex-1" />
            <button className="rounded-[9px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-accent">
              Xem lịch tuần
            </button>
          </div>
          <div>
            {today.map((a) => (
              <div
                key={a.time}
                className="flex items-center gap-3.5 border-b border-[#f0f5f4] px-[18px] py-3 last:border-0"
              >
                <div className="w-[52px] text-[13.5px] font-semibold tabular-nums text-foreground">
                  {a.time}
                </div>
                <div className="h-[34px] w-[3px] rounded-full" style={{ background: a.dot }} />
                <div className="min-w-0 flex-1 leading-snug">
                  <div className="text-[13.5px] font-medium text-foreground">{a.patient}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {a.service} · {a.phone}
                  </div>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-[11.5px] font-medium ${statusChip[a.statusKind]}`}
                >
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Cột phải */}
        <div className="flex flex-col gap-4">
          {/* Đang chờ */}
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <Armchair className="size-[19px] text-primary" />
              Đang chờ tại phòng khám
            </div>
            <div className="mt-3 flex flex-col gap-2">
              {queue.length === 0 ? (
                <div className="px-0.5 py-2 text-[12.5px] text-muted-foreground">
                  Chưa có bệnh nhân check-in.
                </div>
              ) : (
                queue.map((q) => (
                  <div
                    key={q.n}
                    className="flex items-center gap-2.5 rounded-[11px] border border-border bg-[#f4f9f8] px-3 py-2.5"
                  >
                    <div className="flex size-7 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                      {q.n}
                    </div>
                    <div className="flex-1 leading-tight">
                      <div className="text-[13px] font-medium text-foreground">{q.patient}</div>
                      <div className="text-[11.5px] text-muted-foreground">{q.service}</div>
                    </div>
                    <div className="text-[11.5px] tabular-nums text-muted-foreground">
                      chờ {q.wait}′
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Doanh thu 7 ngày */}
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarCheck className="size-[18px] text-primary" />
              Doanh thu 7 ngày
            </div>
            <div className="mt-4 flex h-24 items-end gap-2">
              {week7.map((d, i) => (
                <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                  <div
                    className="w-full rounded-t-md"
                    style={{
                      height: `${Math.round((d.value / week7Max) * 84)}px`,
                      background: i === week7.length - 2 ? "#0f7a73" : "#cfe4e2",
                    }}
                  />
                  <div className="text-[10.5px] text-muted-foreground">{d.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex justify-between border-t border-[#f0f5f4] pt-2.5 text-[12.5px]">
              <span className="text-muted-foreground">Tổng tuần</span>
              <span className="font-semibold tabular-nums text-foreground">
                {week7Total.toFixed(1)} tr
              </span>
            </div>
          </div>

          {/* Vật tư sắp hết */}
          <div className="rounded-[14px] border border-[#f2ded2] bg-[#fdf6f2] px-[18px] py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8a4b32]">
              <Package className="size-[19px]" />
              Vật tư sắp hết
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {lowStock.map((s) => (
                <div key={s.name} className="flex items-center gap-2.5 text-[12.5px]">
                  <span className="flex-1 text-[#6b4536]">{s.name}</span>
                  <span className="font-semibold tabular-nums text-[#a4553a]">
                    {s.qty} {s.unit}
                  </span>
                </div>
              ))}
              <button className="mt-1.5 self-start rounded-[9px] border border-[#e6cdbf] bg-card px-3 py-1.5 text-[12.5px] font-medium text-[#8a4b32] transition-colors hover:bg-[#fbeee7]">
                Mở kho vật tư
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
