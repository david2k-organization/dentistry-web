import { api, type ApiEnvelope } from "@/lib/api";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "./types";

export async function getPatients(): Promise<Patient[]> {
  const res = await api.get<ApiEnvelope<Patient[]>>("/patient");
  return res.data.data;
}

export async function getPatient(id: string): Promise<Patient | null> {
  const res = await api.get<ApiEnvelope<Patient | null>>(`/patient/${id}`);
  return res.data.data;
}

export async function createPatient(input: CreatePatientInput): Promise<Patient> {
  const res = await api.post<ApiEnvelope<Patient>>("/patient", input);
  return res.data.data;
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patient/${id}`);
}

// Lưu ý: backend PUT /patient/:id hiện chưa ghi Prisma, chỉ trả về chuỗi
// placeholder (xem docs/api/patients.md#known-limitations) — không dùng response
// này để cập nhật UI, phía gọi phải tự merge dữ liệu đã gửi vào state cục bộ.
export async function updatePatient(id: string, input: UpdatePatientInput): Promise<void> {
  await api.put(`/patient/${id}`, input);
}
