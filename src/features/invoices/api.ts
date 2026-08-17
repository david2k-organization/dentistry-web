import {
  api,
  normalizePaginated,
  type ApiEnvelope,
  type Paginated,
} from "@/lib/api";
import type {
  CreateOrderInput,
  Order,
  UpdateOrderInput,
  UpdateOrderStatusInput,
} from "./types";

const BASE = "/invoices";

export type OrderListParams = {
  page?: number;
  pageSize?: number;
  code?: string;
  patientId?: string;
  doctorId?: string;
  startDate?: string;
  endDate?: string;
};

export async function getOrders(
  params: OrderListParams = {},
): Promise<Paginated<Order>> {
  const query: Record<string, string | number> = {};
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;
  if (params.code?.trim()) query.code = params.code.trim();
  if (params.patientId) query.patientId = params.patientId;
  if (params.doctorId) query.doctorId = params.doctorId;
  if (params.startDate) query.startDate = params.startDate;
  if (params.endDate) query.endDate = params.endDate;
  const res = await api.get<ApiEnvelope<Paginated<Order> | Order[]>>(BASE, {
    params: query,
  });
  return normalizePaginated(res.data);
}

export async function getOrder(id: string): Promise<Order | null> {
  const res = await api.get<ApiEnvelope<Order | null>>(`${BASE}/${id}`);
  return res.data.data;
}

export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await api.post<ApiEnvelope<Order>>(BASE, input);
  return res.data.data;
}

export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const res = await api.put<ApiEnvelope<Order>>(`${BASE}/${id}`, input);
  return res.data.data;
}

export async function updateOrderStatus(
  id: string,
  input: UpdateOrderStatusInput,
): Promise<Order> {
  const res = await api.patch<ApiEnvelope<Order>>(
    `${BASE}/${id}/status`,
    input,
  );
  return res.data.data;
}
