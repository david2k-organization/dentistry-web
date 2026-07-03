import { api, type ApiEnvelope } from "@/lib/api";
import type { CreatePatientInput, Patient } from "./types";

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
