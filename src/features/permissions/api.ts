import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type { Permission } from "./types";

export async function getPermissions(params: ListParams = {}): Promise<Paginated<Permission>> {
  const res = await api.get<ApiEnvelope<Paginated<Permission> | Permission[]>>("/permission", {
    params: listQuery(params),
  });
  return normalizePaginated(res.data);
}
