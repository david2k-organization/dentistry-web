import { useState } from "react";
import { toast } from "sonner";

import { AppointmentDetailDialog } from "./AppointmentDetailDialog";

type ApptStatus = "booked" | "arrived" | "in_progress" | "done" | "cancelled";

const STATUS: Record<
  ApptStatus,
  { label: string; bg: string; fg: string; fgSoft: string; dot: string }
> = {
  booked: { label: "Đã hẹn", bg: "#eef4f4", fg: "#5c7a78", fgSoft: "#7e9997", dot: "#b8cbc9" },
  arrived: { label: "Đã đến", bg: "#e7f1f0", fg: "#0f7a73", fgSoft: "#4a8f89", dot: "#0f7a73" },
  in_progress: { label: "Đang khám", bg: "#fdf3e8", fg: "#9a6524", fgSoft: "#b98a4a", dot: "#d99a3f" },
  done: { label: "Hoàn tất", bg: "#eef6f1", fg: "#3f7a55", fgSoft: "#6b9a7d", dot: "#5da177" },
  cancelled: { label: "Huỷ hẹn", bg: "#fbeeea", fg: "#a4553a", fgSoft: "#c2765b", dot: "#c2765b" },
};

const LEGEND: ApptStatus[] = ["booked", "arrived", "in_progress", "done"];

// Khung giờ làm việc & kích thước lưới
const OPEN_HOUR = 8;
const CLOSE_HOUR = 18;
const SLOT_MIN = 30;
const SLOT_H = 34; // px cho mỗi 30 phút
const HEAD_H = 34;
const SLOT_COUNT = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MIN;
const BODY_H = SLOT_COUNT * SLOT_H;

const days = [
  { name: "T2", date: "27/07" },
  { name: "T3", date: "28/07" },
  { name: "T4", date: "29/07", today: true },
  { name: "T5", date: "30/07" },
  { name: "T6", date: "31/07" },
  { name: "T7", date: "01/08" },
];

type Appt = {
  id: string;
  day: number; // chỉ số cột (0-5)
  start: string; // "HH:MM"
  duration: number; // phút
  patient: string;
  service: string;
  status: ApptStatus;
};

const initialAppts: Appt[] = [
  { id: "a1", day: 0, start: "09:00", duration: 45, patient: "Hoàng Anh Tú", service: "Khám tổng quát", status: "done" },
  { id: "a2", day: 0, start: "14:00", duration: 60, patient: "Ngô Bảo Châu", service: "Điều trị tủy", status: "booked" },
  { id: "a3", day: 1, start: "08:30", duration: 30, patient: "Lý Thu Hằng", service: "Cạo vôi răng", status: "done" },
  { id: "a4", day: 1, start: "10:30", duration: 90, patient: "Trịnh Văn Sơn", service: "Cấy ghép Implant", status: "booked" },
  { id: "a5", day: 2, start: "08:00", duration: 30, patient: "Trần Thu Hà", service: "Cạo vôi răng", status: "done" },
  { id: "a6", day: 2, start: "08:30", duration: 45, patient: "Nguyễn Văn Long", service: "Nhổ răng khôn", status: "in_progress" },
  { id: "a7", day: 2, start: "09:15", duration: 45, patient: "Lê Minh Châu", service: "Trám răng thẩm mỹ", status: "arrived" },
  { id: "a8", day: 2, start: "10:00", duration: 30, patient: "Phạm Quốc Bảo", service: "Niềng răng — tái khám", status: "booked" },
  { id: "a9", day: 2, start: "10:45", duration: 60, patient: "Vũ Thị Mai", service: "Tẩy trắng răng", status: "booked" },
  { id: "a10", day: 2, start: "14:30", duration: 90, patient: "Đỗ Hoàng Nam", service: "Cấy ghép Implant", status: "booked" },
  { id: "a11", day: 3, start: "09:00", duration: 30, patient: "Bùi Khánh Vy", service: "Khám định kỳ", status: "booked" },
  { id: "a12", day: 3, start: "11:00", duration: 45, patient: "Đặng Thu Uyên", service: "Trám răng", status: "cancelled" },
  { id: "a13", day: 4, start: "08:30", duration: 60, patient: "Phan Đức Minh", service: "Bọc răng sứ", status: "booked" },
  { id: "a14", day: 4, start: "15:00", duration: 45, patient: "Hồ Ngọc Lan", service: "Điều trị nha chu", status: "booked" },
  { id: "a15", day: 5, start: "09:30", duration: 60, patient: "Tạ Quang Huy", service: "Nhổ răng khôn", status: "booked" },
];

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - OPEN_HOUR) * 60 + m;
}

function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

const hourLabels = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => OPEN_HOUR + i);

export function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>(initialAppts);
  const [selected, setSelected] = useState<Appt | null>(null);

  const handleCheckIn = () => {
    if (!selected) return;
    setAppts((prev) =>
      prev.map((a) => (a.id === selected.id ? { ...a, status: "arrived" } : a))
    );
    toast.success(`${selected.patient} đã check-in`);
    setSelected(null);
  };

  const handleCancel = () => {
    if (!selected) return;
    setAppts((prev) => prev.filter((a) => a.id !== selected.id));
    toast(`Đã huỷ lịch hẹn của ${selected.patient}`);
    setSelected(null);
  };

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      {/* Header tuần + chú thích */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#e6efee] px-[18px] py-3.5">
        <div className="text-[14.5px] font-semibold text-foreground">Tuần 27/07 – 01/08/2026</div>
        <div className="text-xs text-muted-foreground">Bấm vào lịch hẹn để xem chi tiết</div>
        <div className="flex-1" />
        <div className="flex flex-wrap gap-3.5 text-[11.5px] text-muted-foreground">
          {LEGEND.map((s) => (
            <div key={s} className="flex items-center gap-1.5">
              <span className="size-[9px] rounded-[3px]" style={{ background: STATUS[s].dot }} />
              {STATUS[s].label}
            </div>
          ))}
        </div>
      </div>

      {/* Lưới lịch */}
      <div className="overflow-x-auto">
        <div className="flex min-w-[860px]">
          {/* Cột giờ */}
          <div className="w-[62px] shrink-0 border-r border-[#eaf1f0]">
            <div style={{ height: HEAD_H }} />
            <div className="relative" style={{ height: BODY_H }}>
              {hourLabels.map((h) => (
                <div
                  key={h}
                  className="absolute right-2 -translate-y-1/2 text-[11px] tabular-nums text-[#9fb3b1]"
                  style={{ top: ((h - OPEN_HOUR) * 60 * SLOT_H) / SLOT_MIN }}
                >
                  {String(h).padStart(2, "0")}:00
                </div>
              ))}
            </div>
          </div>

          {/* Cột ngày */}
          {days.map((d, dayIndex) => (
            <div key={d.name} className="min-w-0 flex-1 border-r border-[#eaf1f0] last:border-r-0">
              <div
                className="flex items-center justify-center gap-1.5 border-b border-[#eaf1f0]"
                style={{ height: HEAD_H, background: d.today ? "#e7f1f0" : undefined }}
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
                {/* Đường kẻ theo slot */}
                {Array.from({ length: SLOT_COUNT }).map((_, i) => (
                  <div
                    key={i}
                    className="border-b border-[#eaf1f0] transition-colors hover:bg-[#f4f9f8]"
                    style={{ height: SLOT_H }}
                  />
                ))}

                {/* Khối lịch hẹn */}
                {appts
                  .filter((a) => a.day === dayIndex)
                  .map((a) => {
                    const s = STATUS[a.status];
                    const top = (toMinutes(a.start) * SLOT_H) / SLOT_MIN;
                    const height = (a.duration * SLOT_H) / SLOT_MIN - 3;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(a)}
                        title={`${a.patient} · ${a.service}`}
                        className="absolute right-[3px] left-[3px] cursor-pointer overflow-hidden rounded-lg border px-[7px] py-[5px] text-left leading-tight transition-[filter] hover:brightness-[0.97]"
                        style={{
                          top,
                          height,
                          background: s.bg,
                          borderColor: s.bg,
                          borderLeft: `3px solid ${s.dot}`,
                        }}
                      >
                        <div className="truncate text-[11.5px] font-semibold" style={{ color: s.fg }}>
                          {a.patient}
                        </div>
                        <div className="truncate text-[10.5px]" style={{ color: s.fgSoft }}>
                          {a.start} · {a.service}
                        </div>
                      </button>
                    );
                  })}
              </div>
            </div>
          ))}
        </div>
      </div>

      <AppointmentDetailDialog
        open={selected != null}
        onOpenChange={(open) => !open && setSelected(null)}
        title={selected?.patient ?? ""}
        subtitle={
          selected
            ? `${days[selected.day].name} ${days[selected.day].date} · ${selected.start}–${addMinutes(selected.start, selected.duration)}`
            : ""
        }
        status={selected ? STATUS[selected.status] : STATUS.booked}
        fields={
          selected
            ? [
                { label: "Dịch vụ", value: selected.service },
                { label: "Thời lượng", value: `${selected.duration} phút` },
                { label: "Bác sĩ", value: "BS. Lê Minh Anh" },
                { label: "Ghế", value: "Ghế 1" },
              ]
            : []
        }
        onCheckIn={handleCheckIn}
        onCancel={handleCancel}
      />
    </div>
  );
}
