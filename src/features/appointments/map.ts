import { toDateKey, type Appt, type ApptStatus } from "./constants";
import type { Appointment, AppointmentStatus } from "./types";

/** Enum trạng thái của backend → trạng thái hiển thị trên lịch. */
export const API_TO_UI_STATUS: Record<AppointmentStatus, ApptStatus> = {
  SCHEDULED: "booked",
  ARRIVED: "arrived",
  IN_PROGRESS: "in_progress",
  COMPLETED: "done",
  CANCELLED: "cancelled",
};

/** Trạng thái hiển thị → enum của backend (dùng khi cập nhật). */
export const UI_TO_API_STATUS: Record<ApptStatus, AppointmentStatus> = {
  booked: "SCHEDULED",
  arrived: "ARRIVED",
  in_progress: "IN_PROGRESS",
  done: "COMPLETED",
  cancelled: "CANCELLED",
};

function toTimeLabel(date: Date): string {
  return `${String(date.getHours()).padStart(2, "0")}:${String(
    date.getMinutes(),
  ).padStart(2, "0")}`;
}

/** Chuyển lịch hẹn từ API sang view model dùng cho lưới tuần. */
export function toAppt(a: Appointment): Appt {
  const at = new Date(a.appointmentAt);
  return {
    id: a.id,
    date: toDateKey(at),
    start: toTimeLabel(at),
    duration: a.duration,
    patient: a.patient?.fullName ?? "—",
    service: a.service?.name ?? "—",
    doctor: a.doctor?.fullName ?? "—",
    status: API_TO_UI_STATUS[a.status],
  };
}

/** Ghép khoá ngày `yyyy-mm-dd` + giờ `HH:MM` (giờ địa phương) thành ISO 8601. */
export function toAppointmentAt(dateKey: string, start: string): string {
  const [y, m, d] = dateKey.split("-").map(Number);
  const [hh, mm] = start.split(":").map(Number);
  return new Date(y, m - 1, d, hh, mm).toISOString();
}
