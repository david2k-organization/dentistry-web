import { api, type ApiEnvelope } from "@/lib/api";
import type { CreateServiceInput, Service, UpdateServiceInput } from "./types";

export async function getServices(): Promise<Service[]> {
  const res = await api.get<ApiEnvelope<Service[]>>("/services");
  return res.data.data;
}

export async function getService(id: string): Promise<Service | null> {
  const res = await api.get<ApiEnvelope<Service | null>>(`/services/${id}`);
  return res.data.data;
}

export async function createService(input: CreateServiceInput): Promise<Service> {
  const res = await api.post<ApiEnvelope<Service>>("/services", input);
  return res.data.data;
}

export async function updateService(
  id: string,
  input: UpdateServiceInput
): Promise<Service> {
  const res = await api.put<ApiEnvelope<Service>>(`/services/${id}`, input);
  return res.data.data;
}

// DELETE là xoá mềm (soft delete) — backend set deletedAt, không xoá bản ghi thật.
export async function deleteService(id: string): Promise<void> {
  await api.delete(`/services/${id}`);
}
