import {
  api,
  normalizePaginated,
  type ApiEnvelope,
  type Paginated,
} from "@/lib/api";
import type { PatientTooth, ToothStateHistory, UpdateToothInput } from "./types";

const BASE = "/odontogram";

// Đánh số răng theo hệ FDI (ISO 3950): 32 răng vĩnh viễn.
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

/**
 * Lấy toàn bộ răng (trạng thái hiện tại) của một bệnh nhân để render sơ đồ răng.
 * Không phân trang — backend trả về mảng `PatientTooth[]`.
 */
export async function getOdontogram(patientId: string): Promise<PatientTooth[]> {
  const res = await api.get<ApiEnvelope<PatientTooth[]>>(BASE, {
    params: { patientId },
  });
  return res.data.data;
}

/**
 * Khởi tạo sơ đồ răng mặc định (32 răng FDI, state = NORMAL) cho một bệnh nhân.
 * Thường backend tự gọi khi tạo bệnh nhân; ta gọi dự phòng khi GET trả mảng rỗng.
 */
export async function createOdontogram(patientId: string): Promise<void> {
  await api.post(BASE, { patientId });
}

/**
 * Lịch sử thay đổi trạng thái của một chiếc răng (theo `patientId` + `toothNumber`),
 * có phân trang, sắp xếp mới nhất trước.
 */
export async function getToothHistory(
  patientId: string,
  toothNumber: number,
  page = 1,
  pageSize = 20,
): Promise<Paginated<ToothStateHistory>> {
  const res = await api.get<
    ApiEnvelope<Paginated<ToothStateHistory> | ToothStateHistory[]>
  >(`${BASE}/history`, {
    params: { patientId, toothNumber, page, pageSize },
  });
  return normalizePaginated(res.data);
}

/**
 * Cập nhật trạng thái/ghi chú một chiếc răng. Mỗi lần gọi backend sinh thêm một
 * bản ghi lịch sử (người thực hiện lấy từ access token). Trả về răng sau cập nhật.
 */
export async function updateTooth(
  id: string,
  input: UpdateToothInput,
): Promise<PatientTooth> {
  const res = await api.put<ApiEnvelope<PatientTooth>>(`${BASE}/${id}`, input);
  return res.data.data;
}
