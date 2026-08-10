import {
  api,
  normalizePaginated,
  type ApiEnvelope,
  type Paginated,
} from "@/lib/api";
import type { CreateOrderInput, Order, UpdateOrderInput } from "./types";

const BASE = "/orders";

export type OrderListParams = {
  page?: number;
  pageSize?: number;
  /** Tìm gần đúng theo mã đơn (contains, không phân biệt hoa/thường). */
  code?: string;
  patientId?: string;
  doctorId?: string;
  /** ISO date; lọc createdAt >= startDate. */
  startDate?: string;
  /** ISO date; lọc createdAt <= endDate (nhớ kèm giờ để "đến hết ngày"). */
  endDate?: string;
};

/**
 * Danh sách đơn hàng (phân trang, mới nhất trước) kèm `patient`, `doctor` và
 * `services[]`.
 */
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

/** Chi tiết đơn kèm `services[]` đầy đủ. Trả `null` nếu không tìm thấy. */
export async function getOrder(id: string): Promise<Order | null> {
  const res = await api.get<ApiEnvelope<Order | null>>(`${BASE}/${id}`);
  return res.data.data;
}

/**
 * Tạo đơn hàng. ⚠️ Response của POST có `services` **rỗng** (item ghi sau khi
 * đọc order để trả về) — gọi `getOrder(id)` nếu cần danh sách dịch vụ đầy đủ.
 * `status`/`code` trong body bị bỏ qua (server set `CREATED` + tự sinh mã).
 */
export async function createOrder(input: CreateOrderInput): Promise<Order> {
  const res = await api.post<ApiEnvelope<Order>>(BASE, input);
  return res.data.data;
}

/** Cập nhật đơn — trả về order mới kèm `patient`, `doctor`, `services[]` mới. */
export async function updateOrder(
  id: string,
  input: UpdateOrderInput,
): Promise<Order> {
  const res = await api.put<ApiEnvelope<Order>>(`${BASE}/${id}`, input);
  return res.data.data;
}
