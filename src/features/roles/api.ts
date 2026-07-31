import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type { CreateRoleInput, Role, UpdateRoleInput } from "./types";

export async function getRoles(params: ListParams = {}): Promise<Paginated<Role>> {
  const res = await api.get<ApiEnvelope<Paginated<Role> | Role[]>>("/roles", {
    params: listQuery(params),
  });
  return normalizePaginated(res.data);
}

export async function getRole(id: number): Promise<Role> {
  const res = await api.get<ApiEnvelope<Role>>(`/roles/${id}`);
  return res.data.data;
}

export async function createRole(input: CreateRoleInput): Promise<Role> {
  const res = await api.post<ApiEnvelope<Role>>("/roles", input);
  return res.data.data;
}

export async function updateRole(id: number, input: UpdateRoleInput): Promise<Role> {
  const res = await api.put<ApiEnvelope<Role>>(`/roles/${id}`, input);
  return res.data.data;
}

export async function deleteRole(id: number): Promise<void> {
  await api.delete(`/roles/${id}`);
}
