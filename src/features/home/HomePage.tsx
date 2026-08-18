import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import {
  CalendarCheck,
  CalendarDays,
  Package,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";

import { getAppointments } from "@/features/appointments/api";
import { STATUS } from "@/features/appointments/constants";
import type { Appointment } from "@/features/appointments/types";
import { getRevenueLast7Days } from "@/features/reports/api";
import { formatVnd } from "@/features/reports/format";
import type { DailyRevenue } from "@/features/reports/types";
import { getSupplies } from "@/features/inventory/api";
import { SUPPLY_UNIT_LABELS } from "@/features/inventory/format";
import type { Supply } from "@/features/inventory/types";

type Kpi = { icon: LucideIcon; label: string; value: string; sub: string };

const timeFmt = new Intl.DateTimeFormat("vi-VN", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

// Trạng thái coi là "đang chờ khám" (chưa hoàn tất, chưa huỷ) để đếm cho KPI.
const PENDING_STATUSES = new Set(["SCHEDULED", "ARRIVED"]);

const byAppointmentAtAsc = (a: Appointment, b: Appointment) =>
  new Date(a.appointmentAt).getTime() - new Date(b.appointmentAt).getTime();

// Nhãn thứ theo getUTCDay (mốc `day` trả về là 00:00 UTC): 0 = CN … 6 = T7.
const VN_WEEKDAY = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];
function weekdayShort(iso: string): string {
  return VN_WEEKDAY[new Date(iso).getUTCDay()];
}

/** Số tiền rút gọn cho nhãn cột hẹp: `4,2tr` / `850k` / `0`. */
function formatVndShort(amount: number): string {
  if (amount >= 1_000_000) {
    return `${(amount / 1_000_000).toLocaleString("vi-VN", { maximumFractionDigits: 1 })}tr`;
  }
  if (amount >= 1_000) {
    return `${Math.round(amount / 1_000)}k`;
  }
  return String(amount);
}

// Số vật tư sắp hết hiển thị tối đa trên thẻ tổng quan.
const LOW_STOCK_LIMIT = 8;

export function HomePage() {
  const [todayAppts, setTodayAppts] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);
  const [revenue7, setRevenue7] = useState<DailyRevenue[]>([]);
  const [loadingRevenue, setLoadingRevenue] = useState(true);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [loadingSupplies, setLoadingSupplies] = useState(true);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoadingAppts(true);
      try {
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const end = new Date();
        end.setHours(23, 59, 59, 999);
        const todayPage = await getAppointments({
          pageSize: 200,
          startDate: start.toISOString(),
          endDate: end.toISOString(),
        });
        if (!active) return;
        setTodayAppts([...todayPage.data].sort(byAppointmentAtAsc));
      } catch {
        if (active) toast.error("Không tải được lịch hẹn hôm nay");
      } finally {
        if (active) setLoadingAppts(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoadingRevenue(true);
      try {
        const data = await getRevenueLast7Days();
        if (active) setRevenue7(data);
      } catch {
        if (active) toast.error("Không tải được doanh thu 7 ngày");
      } finally {
        if (active) setLoadingRevenue(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      setLoadingSupplies(true);
      try {
        const { data } = await getSupplies({ pageSize: 200 });
        if (active) setSupplies(data);
      } catch {
        if (active) toast.error("Không tải được kho vật tư");
      } finally {
        if (active) setLoadingSupplies(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // API trả mới → cũ; đảo lại để biểu đồ chạy từ ngày cũ đến hôm nay (đứng cuối).
  const chartDays = [...revenue7].reverse();
  const revenueMax = Math.max(1, ...chartDays.map((d) => d.revenue));
  const revenueTotal = chartDays.reduce((sum, d) => sum + d.revenue, 0);

  // Vật tư dưới định mức, thiếu hụt nặng nhất (tỷ lệ tồn/định mức thấp) lên đầu.
  const lowStock = supplies
    .filter((s) => s.quantity < s.quota)
    .sort((a, b) => a.quantity / a.quota - b.quantity / b.quota)
    .slice(0, LOW_STOCK_LIMIT);

  const completedCount = todayAppts.filter(
    (a) => a.status === "COMPLETED",
  ).length;
  const pendingCount = todayAppts.filter((a) =>
    PENDING_STATUSES.has(a.status),
  ).length;

  const kpis: Kpi[] = [
    {
      icon: CalendarDays,
      label: "Lịch hẹn hôm nay",
      value: loadingAppts ? "…" : String(todayAppts.length),
      sub: `${completedCount} đã hoàn tất · ${pendingCount} chờ`,
    },
    { icon: Users, label: "Bệnh nhân mới", value: "6", sub: "trong tuần này" },
    {
      icon: Wallet,
      label: "Doanh thu hôm nay",
      value: "12,4 tr",
      sub: "+8% so với hôm qua",
    },
  ];

  return (
    <div className="flex flex-col gap-[18px]">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div
              key={k.label}
              className="rounded-[14px] border border-border bg-card px-[18px] py-4"
            >
              <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                <Icon className="size-[18px] text-primary" />
                {k.label}
              </div>
              <div className="mt-2 text-[27px] font-semibold tracking-tight tabular-nums text-foreground">
                {k.value}
              </div>
              <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                {k.sub}
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.65fr_1fr]">
        {/* Lịch hẹn hôm nay */}
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="flex items-center gap-2.5 border-b border-border px-[18px] py-[15px]">
            <div className="text-[14.5px] font-semibold text-foreground">
              Lịch hẹn hôm nay
            </div>
            <div className="text-xs text-muted-foreground">
              {todayAppts.length} lịch hẹn
            </div>
            <div className="flex-1" />
            <Link
              to="/appointments"
              className="rounded-[9px] border border-border bg-card px-3 py-1.5 text-[12.5px] font-medium text-primary transition-colors hover:bg-accent"
            >
              Xem lịch tuần
            </Link>
          </div>
          <div>
            {loadingAppts ? (
              <div className="px-[18px] py-8 text-center text-[12.5px] text-muted-foreground">
                Đang tải lịch hẹn…
              </div>
            ) : todayAppts.length === 0 ? (
              <div className="px-[18px] py-8 text-center text-[12.5px] text-muted-foreground">
                Không có lịch hẹn nào hôm nay.
              </div>
            ) : (
              todayAppts.map((a) => {
                const s = STATUS[a.status];
                return (
                  <div
                    key={a.id}
                    className="flex items-center gap-3.5 border-b border-[#f0f5f4] px-[18px] py-3 last:border-0"
                  >
                    <div className="w-[52px] text-[13.5px] font-semibold tabular-nums text-foreground">
                      {timeFmt.format(new Date(a.appointmentAt))}
                    </div>
                    <div
                      className="h-[34px] w-[3px] rounded-full"
                      style={{ background: s.dot }}
                    />
                    <div className="min-w-0 flex-1 leading-snug">
                      <div className="text-[13.5px] font-medium text-foreground">
                        {a.patient.fullName}
                      </div>
                      <div className="truncate text-xs text-muted-foreground">
                        {a.service.name} · {a.doctor.fullName}
                      </div>
                    </div>
                    <span
                      className="rounded-full px-2.5 py-1 text-[11.5px] font-medium"
                      style={{ background: s.bg, color: s.fg }}
                    >
                      {s.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Cột phải */}
        <div className="flex flex-col gap-4">
          {/* Doanh thu 7 ngày */}
          <div className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
              <CalendarCheck className="size-[18px] text-primary" />
              Doanh thu 7 ngày
            </div>
            {loadingRevenue ? (
              <div className="mt-4 py-8 text-center text-[12.5px] text-muted-foreground">
                Đang tải…
              </div>
            ) : (
              <>
                <div className="mt-4 flex items-end gap-2" style={{ height: 116 }}>
                  {chartDays.map((d, i) => (
                    <div
                      key={d.day}
                      className="flex flex-1 flex-col items-center gap-1"
                    >
                      <div className="text-[9.5px] tabular-nums text-muted-foreground">
                        {formatVndShort(d.revenue)}
                      </div>
                      <div
                        className="w-full rounded-t-md"
                        style={{
                          height: `${Math.round((d.revenue / revenueMax) * 72)}px`,
                          background:
                            i === chartDays.length - 1 ? "#0f7a73" : "#cfe4e2",
                        }}
                      />
                      <div className="text-[10.5px] text-muted-foreground">
                        {weekdayShort(d.day)}
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-between border-t border-[#f0f5f4] pt-2.5 text-[12.5px]">
                  <span className="text-muted-foreground">Tổng tuần</span>
                  <span className="font-semibold tabular-nums text-foreground">
                    {formatVnd(revenueTotal)}
                  </span>
                </div>
              </>
            )}
          </div>

          {/* Vật tư sắp hết */}
          <div className="rounded-[14px] border border-[#f2ded2] bg-[#fdf6f2] px-[18px] py-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#8a4b32]">
              <Package className="size-[19px]" />
              Vật tư sắp hết
            </div>
            <div className="mt-3 flex flex-col gap-1.5">
              {loadingSupplies ? (
                <div className="py-1 text-[12.5px] text-[#8a6b5c]">Đang tải…</div>
              ) : lowStock.length === 0 ? (
                <div className="py-1 text-[12.5px] text-[#8a6b5c]">
                  Không có vật tư nào dưới định mức.
                </div>
              ) : (
                lowStock.map((s) => (
                  <div
                    key={s.id}
                    className="flex items-center gap-2.5 text-[12.5px]"
                  >
                    <span className="min-w-0 flex-1 truncate text-[#6b4536]">
                      {s.name}
                    </span>
                    <span className="shrink-0 font-semibold tabular-nums text-[#a4553a]">
                      {s.quantity} / {s.quota} {SUPPLY_UNIT_LABELS[s.unit]}
                    </span>
                  </div>
                ))
              )}
              <Link
                to="/inventory"
                className="mt-1.5 self-start rounded-[9px] border border-[#e6cdbf] bg-card px-3 py-1.5 text-[12.5px] font-medium text-[#8a4b32] transition-colors hover:bg-[#fbeee7]"
              >
                Mở kho vật tư
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
