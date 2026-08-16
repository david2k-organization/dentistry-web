import {
  api,
  normalizePaginated,
  type ApiEnvelope,
  type Paginated,
} from "@/lib/api";
import type {
  CreatePaymentInput,
  Payment,
  RefundPaymentInput,
  UpdatePaymentInput,
} from "./payment-types";

const BASE = "/payments";

export type PaymentListParams = {
  invoiceId?: string;
  page?: number;
  pageSize?: number;
};

/** Danh sách phiếu thu (phân trang, mới nhất trước). */
export async function getPayments(
  params: PaymentListParams = {},
): Promise<Paginated<Payment>> {
  const query: Record<string, string | number> = {};
  if (params.invoiceId) query.invoiceId = params.invoiceId;
  if (params.page) query.page = params.page;
  if (params.pageSize) query.pageSize = params.pageSize;
  const res = await api.get<ApiEnvelope<Paginated<Payment> | Payment[]>>(
    BASE,
    { params: query },
  );
  return normalizePaginated(res.data);
}

/**
 * Ghi nhận một lần thu. Backend tự đồng bộ `Invoice.status` sau khi tạo —
 * gọi lại `getOrder`/`getOrders` để lấy trạng thái mới nhất.
 */
export async function createPayment(
  input: CreatePaymentInput,
): Promise<Payment> {
  const res = await api.post<ApiEnvelope<Payment>>(BASE, input);
  return res.data.data;
}

/** Sửa phiếu thu chưa huỷ (số tiền, phương thức, ngày, ghi chú...). */
export async function updatePayment(
  id: string,
  input: UpdatePaymentInput,
): Promise<Payment> {
  const res = await api.put<ApiEnvelope<Payment>>(`${BASE}/${id}`, input);
  return res.data.data;
}

/** Huỷ phiếu thu — không còn tính vào tổng đã thu của hoá đơn. */
export async function voidPayment(
  id: string,
  voidedReason: string,
): Promise<Payment> {
  const res = await api.post<ApiEnvelope<Payment>>(`${BASE}/${id}/void`, {
    voidedReason,
  });
  return res.data.data;
}

/** Hoàn tiền — tạo phiếu mới `isRefund: true` trên cùng hoá đơn. */
export async function refundPayment(
  id: string,
  input: RefundPaymentInput,
): Promise<Payment> {
  const res = await api.post<ApiEnvelope<Payment>>(
    `${BASE}/${id}/refund`,
    input,
  );
  return res.data.data;
}
