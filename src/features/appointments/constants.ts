export type ApptStatus = "booked" | "arrived" | "in_progress" | "done" | "cancelled";

export const STATUS: Record<
  ApptStatus,
  { label: string; bg: string; fg: string; fgSoft: string; dot: string }
> = {
  booked: { label: "Đã hẹn", bg: "#eef4f4", fg: "#5c7a78", fgSoft: "#7e9997", dot: "#b8cbc9" },
  arrived: { label: "Đã đến", bg: "#e7f1f0", fg: "#0f7a73", fgSoft: "#4a8f89", dot: "#0f7a73" },
  in_progress: { label: "Đang khám", bg: "#fdf3e8", fg: "#9a6524", fgSoft: "#b98a4a", dot: "#d99a3f" },
  done: { label: "Hoàn tất", bg: "#eef6f1", fg: "#3f7a55", fgSoft: "#6b9a7d", dot: "#5da177" },
  cancelled: { label: "Huỷ hẹn", bg: "#fbeeea", fg: "#a4553a", fgSoft: "#c2765b", dot: "#c2765b" },
};

export const LEGEND: ApptStatus[] = ["booked", "arrived", "in_progress", "done"];

// Khung giờ làm việc & kích thước lưới
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 18;
export const SLOT_MIN = 15;
export const SLOT_H = 20; // px cho mỗi SLOT_MIN phút
export const HEAD_H = 34;
export const SLOT_COUNT = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MIN;
export const BODY_H = SLOT_COUNT * SLOT_H;

export const days = [
  { name: "T2", date: "27/07" },
  { name: "T3", date: "28/07" },
  { name: "T4", date: "29/07", today: true },
  { name: "T5", date: "30/07" },
  { name: "T6", date: "31/07" },
  { name: "T7", date: "01/08" },
];

export type Appt = {
  id: string;
  day: number; // chỉ số cột (0-5)
  start: string; // "HH:MM"
  duration: number; // phút
  patient: string;
  service: string;
  status: ApptStatus;
};

export function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return (h - OPEN_HOUR) * 60 + m;
}

export function addMinutes(time: string, mins: number): string {
  const [h, m] = time.split(":").map(Number);
  const total = h * 60 + m + mins;
  return `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
}

export const hourLabels = Array.from({ length: CLOSE_HOUR - OPEN_HOUR + 1 }, (_, i) => OPEN_HOUR + i);

/** Danh sách mốc giờ cách nhau SLOT_MIN phút trong khung giờ làm việc, dùng cho <select> chọn giờ. */
export const timeSlotOptions = Array.from(
  { length: SLOT_COUNT },
  (_, i) => addMinutes(`${String(OPEN_HOUR).padStart(2, "0")}:00`, i * SLOT_MIN)
);

export const durationOptions = [15, 30, 45, 60, 90, 120];
