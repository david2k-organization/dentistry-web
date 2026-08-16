export type PaymentMethod = "CASH" | "BANK_TRANSFER";

export type Payment = {
  id: string;
  code: string;
  invoiceId: string;
  // Decimal(12,0) ở Prisma → serialize thành chuỗi.
  amount: string;
  method: PaymentMethod;
  paidAt: string;
  isRefund: boolean;
  refundReason: string | null;
  note: string | null;
  receivedById: string;
  voidedAt: string | null;
  voidedById: string | null;
  voidedReason: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreatePaymentInput = {
  invoiceId: string;
  amount: number;
  method: PaymentMethod;
  paidAt?: string;
  note?: string;
};

export type UpdatePaymentInput = Partial<{
  amount: number;
  method: PaymentMethod;
  paidAt: string;
  note: string;
  receivedById: string;
}>;

export type RefundPaymentInput = {
  amount: number;
  refundReason: string;
  note?: string;
  method?: PaymentMethod;
};

export const PAYMENT_METHOD_META: Record<PaymentMethod, { label: string }> = {
  CASH: { label: "Tiền mặt" },
  BANK_TRANSFER: { label: "Chuyển khoản" },
};

export function paymentAmount(p: Payment): number {
  return Number(p.amount) || 0;
}

export function isVoidedPayment(p: Payment): boolean {
  return !!p.voidedAt;
}

/**
 * Tổng thực thu = tổng phiếu thu chưa huỷ − tổng phiếu hoàn tiền chưa huỷ
 * (đúng công thức backend dùng để đồng bộ `Invoice.status`, xem payments-api.md).
 */
export function netPaid(payments: Payment[]): number {
  return payments.reduce((sum, p) => {
    if (isVoidedPayment(p)) return sum;
    const amt = paymentAmount(p);
    return p.isRefund ? sum - amt : sum + amt;
  }, 0);
}

/** Gom `netPaid` theo từng hoá đơn — dùng để hiển thị cột "Đã thanh toán" trên danh sách. */
export function netPaidByInvoice(payments: Payment[]): Record<string, number> {
  const map: Record<string, number> = {};
  for (const p of payments) {
    if (isVoidedPayment(p)) continue;
    const amt = paymentAmount(p);
    map[p.invoiceId] = (map[p.invoiceId] ?? 0) + (p.isRefund ? -amt : amt);
  }
  return map;
}
