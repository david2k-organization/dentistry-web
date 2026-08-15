import type { ToothState } from "@/features/services/types";

/** Trạng thái hiện tại của một chiếc răng (một bản ghi `PatientTooth` phía backend). */
export type PatientTooth = {
  id: string;
  patientId: string;
  /** Số hiệu răng theo chuẩn FDI (ISO 3950). */
  toothNumber: number;
  state: ToothState;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Thông tin rút gọn của người thực hiện thay đổi trạng thái răng. */
export type ToothChangedBy = {
  id: string;
  fullName: string;
  avatar: string | null;
};

/** Một mốc trong lịch sử thay đổi trạng thái của một chiếc răng. */
export type ToothStateHistory = {
  id: string;
  patientToothId: string;
  state: ToothState;
  changedById: string | null;
  createdAt: string;
  changedBy: ToothChangedBy | null;
};

/** Body cho PUT /odontogram/:id — tất cả optional. */
export type UpdateToothInput = {
  state?: ToothState;
  note?: string;
};
