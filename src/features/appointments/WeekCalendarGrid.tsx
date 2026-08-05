import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  BODY_H,
  HEAD_H,
  OPEN_HOUR,
  SLOT_COUNT,
  SLOT_H,
  STATUS,
  hourLabels,
  toMinutes,
  type Appt,
  type WeekDay,
} from "./constants";

type WeekCalendarGridProps = {
  weekDays: WeekDay[];
  appts: Appt[];
  onSlotClick: (dayIndex: number, slotIndex: number) => void;
  onApptClick: (appt: Appt) => void;
  className?: string;
};

export function WeekCalendarGrid({
  weekDays,
  appts,
  onSlotClick,
  onApptClick,
  className,
}: WeekCalendarGridProps) {
  // Cập nhật vị trí đường "thời gian hiện tại" mỗi 3 phút.
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 180_000);
    return () => clearInterval(id);
  }, []);

  // Khi mở màn: cuộn tới đường thời gian hiện tại (nếu có) — chỉ chạy một lần.
  const nowLineRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    nowLineRef.current?.scrollIntoView({ block: "center" });
  }, []);

  const nowTop = (((now.getHours() - OPEN_HOUR) * 60 + now.getMinutes()) * SLOT_H) / 15;
  const nowWithinHours = nowTop >= 0 && nowTop <= BODY_H;
  // Chỉ hiển thị mốc thời gian khi tuần đang xem có chứa hôm nay.
  const showNow = nowWithinHours && weekDays.some((d) => d.today);
  const nowLabel = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  return (
    <div className={cn("overflow-auto", className)}>
      <div className="flex min-w-215">
        {/* Cột giờ */}
        <div className="w-15.5 shrink-0 border-r border-[#eaf1f0]">
          <div
            className="sticky top-0 z-30 bg-card"
            style={{ height: HEAD_H }}
          />
          <div className="relative" style={{ height: BODY_H }}>
            {hourLabels.map((h) => (
              <div
                key={h}
                className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-[#9fb3b1]"
                style={{ top: ((h - OPEN_HOUR) * 60 * SLOT_H) / 15 }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}

            {/* Nhãn + đường nét đứt gióng theo thời gian hiện tại */}
            {showNow && (
              <>
                <div
                  className="pointer-events-none absolute right-0 left-0 border-t border-dashed border-red-500"
                  style={{ top: nowTop }}
                />
                <div
                  className="absolute right-2 -translate-y-1/2 rounded bg-red-500 px-1 text-[10px] font-semibold tabular-nums text-white"
                  style={{ top: nowTop }}
                >
                  {nowLabel}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Cột ngày */}
        {weekDays.map((d, dayIndex) => (
          <div
            key={d.key}
            className="min-w-0 flex-1 border-r border-[#eaf1f0] last:border-r-0"
          >
            <div
              className="sticky top-0 z-30 flex items-center justify-center gap-1.5 border-b border-[#eaf1f0] bg-card"
              style={{
                height: HEAD_H,
                background: d.today ? "#e7f1f0" : undefined,
              }}
            >
              <span
                className="text-[12.5px] font-semibold"
                style={{ color: d.today ? "#0f7a73" : "#16302e" }}
              >
                {d.name}
              </span>
              <span className="text-[11.5px] text-[#8aa3a1]">{d.date}</span>
            </div>

            <div className="relative" style={{ height: BODY_H }}>
              {/* Đường kẻ theo slot — bấm để đặt hẹn mới */}
              {Array.from({ length: SLOT_COUNT }).map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => onSlotClick(dayIndex, i)}
                  title="Đặt hẹn mới"
                  className="block w-full cursor-cell border-b border-[#eaf1f0] transition-colors hover:bg-[#f4f9f8]"
                  style={{ height: SLOT_H }}
                />
              ))}

              {/* Khối lịch hẹn */}
              {appts
                .filter((a) => a.date === d.key)
                .map((a) => {
                  const s = STATUS[a.status];
                  const top = (toMinutes(a.start) * SLOT_H) / 15;
                  const height = (a.duration * SLOT_H) / 15 - 3;
                  return (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => onApptClick(a)}
                      title={`${a.patient} · ${a.service}`}
                      className="absolute right-0.75 left-0.75 cursor-pointer overflow-hidden rounded-lg border px-1.75 py-1.25 text-left leading-tight transition-[filter] hover:brightness-[0.97]"
                      style={{
                        top,
                        height,
                        background: s.bg,
                        borderColor: s.bg,
                        borderLeft: `3px solid ${s.dot}`,
                      }}
                    >
                      <div
                        className="truncate text-[11.5px] font-semibold"
                        style={{ color: s.fg }}
                      >
                        {a.patient}
                      </div>
                      <div
                        className="truncate text-[10.5px]"
                        style={{ color: s.fgSoft }}
                      >
                        {a.start} · {a.service}
                      </div>
                    </button>
                  );
                })}

              {/* Đường thời gian hiện tại — chỉ hiển thị ở cột hôm nay */}
              {d.today && nowWithinHours && (
                <div
                  ref={nowLineRef}
                  className="pointer-events-none absolute right-0 left-0 z-20 border-t-2 border-red-500"
                  style={{ top: nowTop }}
                >
                  <span className="absolute -top-[5px] -left-[3px] size-2 rounded-full bg-red-500" />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
