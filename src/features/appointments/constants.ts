export type ApptStatus =
  | "SCHEDULED"
  | "ARRIVED"
  | "IN_PROGRESS"
  | "COMPLETED"
  | "CANCELLED";

export const STATUS: Record<
  ApptStatus,
  { label: string; bg: string; fg: string; fgSoft: string; dot: string }
> = {
  SCHEDULED: {
    label: "Đã hẹn",
    bg: "#eef4f4",
    fg: "#5c7a78",
    fgSoft: "#7e9997",
    dot: "#b8cbc9",
  },
  ARRIVED: {
    label: "Đã đến",
    bg: "#fdf0e6",
    fg: "#b5611f",
    fgSoft: "#cc8a55",
    dot: "#e0803c",
  },
  IN_PROGRESS: {
    label: "Đang khám",
    bg: "#eaf1fb",
    fg: "#2c5aa0",
    fgSoft: "#5f82bd",
    dot: "#3b7dd8",
  },
  COMPLETED: {
    label: "Hoàn tất",
    bg: "#eef6f1",
    fg: "#3f7a55",
    fgSoft: "#6b9a7d",
    dot: "#5da177",
  },
  CANCELLED: {
    label: "Huỷ hẹn",
    bg: "#fdeaea",
    fg: "#c0392b",
    fgSoft: "#d9736a",
    dot: "#dc3545",
  },
};

export const LEGEND: ApptStatus[] = [
  "SCHEDULED",
  "ARRIVED",
  "IN_PROGRESS",
  "COMPLETED",
  "CANCELLED",
];

// Khung giờ làm việc & kích thước lưới
export const OPEN_HOUR = 8;
export const CLOSE_HOUR = 22;
export const SLOT_MIN = 15;
export const SLOT_H = 20; // px cho mỗi SLOT_MIN phút
export const HEAD_H = 34;
export const SLOT_COUNT = ((CLOSE_HOUR - OPEN_HOUR) * 60) / SLOT_MIN;
export const BODY_H = SLOT_COUNT * SLOT_H;

export const DAY_NAMES = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
export const WEEK_DAY_COUNT = DAY_NAMES.length;

export function atMidnight(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function startOfWeek(date: Date): Date {
  const d = atMidnight(date);
  const dow = d.getDay();
  const diffToMonday = dow === 0 ? -6 : 1 - dow;
  d.setDate(d.getDate() + diffToMonday);
  return d;
}

export function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

/** Khoá ngày dạng `yyyy-mm-dd` theo giờ địa phương (dùng để so khớp lịch hẹn). */
export function toDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(
    date.getDate(),
  ).padStart(2, "0")}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Định dạng `DD/MM`. */
export function formatDayMonth(date: Date): string {
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
}

export type WeekDay = {
  name: string; // T2…T7
  date: string; // DD/MM
  key: string; // yyyy-mm-dd
  today: boolean;
};

export function buildWeekDays(
  weekStart: Date,
  today: Date = new Date(),
): WeekDay[] {
  return DAY_NAMES.map((name, i) => {
    const d = addDays(weekStart, i);
    return {
      name,
      date: formatDayMonth(d),
      key: toDateKey(d),
      today: isSameDay(d, today),
    };
  });
}

/** Nhãn khoảng tuần, vd `Tuần 27/07 – 01/08/2026`. */
export function formatWeekRange(weekStart: Date): string {
  const end = addDays(weekStart, WEEK_DAY_COUNT - 1);
  return `Tuần ${formatDayMonth(weekStart)} – ${formatDayMonth(end)}/${end.getFullYear()}`;
}

export type Appt = {
  id: string;
  date: string;
  start: string;
  duration: number;
  patient: string;
  service: string;
  doctor: string;
  serviceId: string;
  doctorId: string;
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

export const hourLabels = Array.from(
  { length: CLOSE_HOUR - OPEN_HOUR + 1 },
  (_, i) => OPEN_HOUR + i,
);

/** Danh sách mốc giờ cách nhau SLOT_MIN phút trong khung giờ làm việc, dùng cho <select> chọn giờ. */
export const timeSlotOptions = Array.from({ length: SLOT_COUNT }, (_, i) =>
  addMinutes(`${String(OPEN_HOUR).padStart(2, "0")}:00`, i * SLOT_MIN),
);

export const durationOptions = [15, 30, 45, 60, 90, 120];
