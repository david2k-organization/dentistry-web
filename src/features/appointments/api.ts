import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type {
  Appointment,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./types";

// findAll trả về mảng thuần (chưa bọc { data, meta }); normalizePaginated lo cả hai kiểu.
export async function getAppointments(
  params: ListParams = {},
): Promise<Paginated<Appointment>> {
  const res = await api.get<ApiEnvelope<Paginated<Appointment> | Appointment[]>>(
    "/appointments",
    { params: listQuery(params) },
  );
  return normalizePaginated(res.data);
}

export async function getAppointment(id: string): Promise<Appointment | null> {
  const res = await api.get<ApiEnvelope<Appointment | null>>(
    `/appointments/${id}`,
  );
  return res.data.data;
}

export async function createAppointment(
  input: CreateAppointmentInput,
): Promise<Appointment> {
  const res = await api.post<ApiEnvelope<Appointment>>("/appointments", input);
  return res.data.data;
}

export async function updateAppointment(
  id: string,
  input: UpdateAppointmentInput,
): Promise<Appointment> {
  const res = await api.put<ApiEnvelope<Appointment>>(
    `/appointments/${id}`,
    input,
  );
  return res.data.data;
}

// DELETE là xoá cứng (hard delete) phía backend.
export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
