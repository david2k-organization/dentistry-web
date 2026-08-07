import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type {
  CreateTreatmentRecordInput,
  TreatmentRecord,
  UpdateTreatmentRecordInput,
} from "./types";

const BASE = "/treatment-record";

export type TreatmentRecordParams = ListParams & {
  patientId?: string;
  doctorId?: string;
  serviceId?: string;
};

/**
 * Danh sách hồ sơ điều trị (phân trang, sắp xếp mới nhất trước), kèm `images` và
 * `treatmentSupplies`. Hỗ trợ lọc theo `patientId` / `doctorId` / `serviceId`.
 */
export async function getTreatmentRecords(
  params: TreatmentRecordParams = {},
): Promise<Paginated<TreatmentRecord>> {
  const query: Record<string, string | number> = { ...listQuery(params) };
  if (params.patientId) query.patientId = params.patientId;
  if (params.doctorId) query.doctorId = params.doctorId;
  if (params.serviceId) query.serviceId = params.serviceId;
  const res = await api.get<ApiEnvelope<Paginated<TreatmentRecord> | TreatmentRecord[]>>(
    BASE,
    { params: query },
  );
  return normalizePaginated(res.data);
}

export async function getTreatmentRecord(id: string): Promise<TreatmentRecord | null> {
  const res = await api.get<ApiEnvelope<TreatmentRecord | null>>(`${BASE}/${id}`);
  return res.data.data;
}

/**
 * Tạo hồ sơ điều trị. Backend tự **xuất kho** các vật tư trong cùng transaction
 * (không cần gọi warehouse-log thủ công). Nếu thiếu tồn kho → rollback toàn bộ.
 */
export async function createTreatmentRecord(
  input: CreateTreatmentRecordInput,
): Promise<TreatmentRecord> {
  const res = await api.post<ApiEnvelope<TreatmentRecord>>(BASE, input);
  return res.data.data;
}

export async function updateTreatmentRecord(
  id: string,
  input: UpdateTreatmentRecordInput,
): Promise<TreatmentRecord> {
  const res = await api.patch<ApiEnvelope<TreatmentRecord>>(`${BASE}/${id}`, input);
  return res.data.data;
}
