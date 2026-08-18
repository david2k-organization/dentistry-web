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
  AppointmentStatus,
  CreateAppointmentInput,
  UpdateAppointmentInput,
} from "./types";

/** Query cho danh sách lịch hẹn: kế thừa ListParams + lọc theo trạng thái. */
export type AppointmentListParams = ListParams & {
  status?: AppointmentStatus;
};

export async function getAppointments(
  params: AppointmentListParams = {},
): Promise<Paginated<Appointment>> {
  const { status, ...listParams } = params;
  const query = listQuery(listParams);
  if (status) query.status = status;
  const res = await api.get<
    ApiEnvelope<Paginated<Appointment> | Appointment[]>
  >("/appointments", { params: query });
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

export async function deleteAppointment(id: string): Promise<void> {
  await api.delete(`/appointments/${id}`);
}
