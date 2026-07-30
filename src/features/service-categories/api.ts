import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type {
  CreateServiceCategoryInput,
  ServiceCategory,
  UpdateServiceCategoryInput,
} from "./types";

export async function getServiceCategories(
  params: ListParams = {}
): Promise<Paginated<ServiceCategory>> {
  const res = await api.get<ApiEnvelope<Paginated<ServiceCategory> | ServiceCategory[]>>(
    "/service-categories",
    { params: listQuery(params) }
  );
  return normalizePaginated(res.data);
}

export async function getServiceCategory(id: string): Promise<ServiceCategory | null> {
  const res = await api.get<ApiEnvelope<ServiceCategory | null>>(`/service-categories/${id}`);
  return res.data.data;
}

export async function createServiceCategory(
  input: CreateServiceCategoryInput
): Promise<ServiceCategory> {
  const res = await api.post<ApiEnvelope<ServiceCategory>>("/service-categories", input);
  return res.data.data;
}

export async function updateServiceCategory(
  id: string,
  input: UpdateServiceCategoryInput
): Promise<ServiceCategory> {
  const res = await api.put<ApiEnvelope<ServiceCategory>>(`/service-categories/${id}`, input);
  return res.data.data;
}

export async function deleteServiceCategory(id: string): Promise<void> {
  await api.delete(`/service-categories/${id}`);
}
