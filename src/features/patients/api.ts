import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "./types";

export async function getPatients(
  params: ListParams = {},
): Promise<Paginated<Patient>> {
  const res = await api.get<ApiEnvelope<Paginated<Patient> | Patient[]>>(
    "/patient",
    {
      params: listQuery(params),
    },
  );
  return normalizePaginated(res.data);
}

export async function getPatient(id: string): Promise<Patient | null> {
  const res = await api.get<ApiEnvelope<Patient | null>>(`/patient/${id}`);
  return res.data.data;
}

export async function createPatient(
  input: CreatePatientInput,
): Promise<Patient> {
  const res = await api.post<ApiEnvelope<Patient>>("/patient", input);
  return res.data.data;
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patient/${id}`);
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput,
): Promise<void> {
  await api.put(`/patient/${id}`, input);
}
