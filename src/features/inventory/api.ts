import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type {
  CreateSupplyInput,
  CreateWarehouseLogInput,
  Supply,
  UpdateSupplyInput,
  WarehouseLog,
  WarehouseLogType,
} from "./types";

export async function getSupplies(
  params: ListParams = {},
): Promise<Paginated<Supply>> {
  const res = await api.get<ApiEnvelope<Paginated<Supply> | Supply[]>>(
    "/supplies",
    { params: listQuery(params) },
  );
  return normalizePaginated(res.data);
}

export async function getSupply(id: string): Promise<Supply | null> {
  const res = await api.get<ApiEnvelope<Supply | null>>(`/supplies/${id}`);
  return res.data.data;
}

export async function createSupply(input: CreateSupplyInput): Promise<Supply> {
  const res = await api.post<ApiEnvelope<Supply>>("/supplies", input);
  return res.data.data;
}

export async function updateSupply(
  id: string,
  input: UpdateSupplyInput,
): Promise<Supply> {
  const res = await api.put<ApiEnvelope<Supply>>(`/supplies/${id}`, input);
  return res.data.data;
}

export async function deleteSupply(id: string): Promise<void> {
  await api.delete(`/supplies/${id}`);
}

export type WarehouseLogParams = ListParams & {
  suppliesId?: string;
  type?: WarehouseLogType;
};

export async function getWarehouseLogs(
  params: WarehouseLogParams = {},
): Promise<Paginated<WarehouseLog>> {
  const query: Record<string, string | number> = { ...listQuery(params) };
  if (params.suppliesId) query.suppliesId = params.suppliesId;
  if (params.type) query.type = params.type;
  const res = await api.get<ApiEnvelope<Paginated<WarehouseLog> | WarehouseLog[]>>(
    "/warehouse-logs",
    { params: query },
  );
  return normalizePaginated(res.data);
}

export async function createWarehouseLog(
  input: CreateWarehouseLogInput,
): Promise<WarehouseLog> {
  const res = await api.post<ApiEnvelope<WarehouseLog>>(
    "/warehouse-logs",
    input,
  );
  return res.data.data;
}
