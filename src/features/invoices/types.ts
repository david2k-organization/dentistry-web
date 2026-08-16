export type OrderStatus =
  | "DRAFT"
  | "ISSUED"
  | "PARTIALLY_PAID"
  | "PAID"
  | "VOIDED";

/** Dịch vụ (rút gọn) được include trong mỗi order item. */
export type OrderItemService = {
  code: string;
  name: string;
  unit: string;
};

/** Một dòng dịch vụ trong đơn (quan hệ `services[]` của order). */
export type OrderItem = {
  id: string;
  orderId: string;
  serviceId: string;
  quantity: number;
  // unitPrice/amount là Decimal ở Prisma nên serialize thành chuỗi.
  unitPrice: string;
  amount: string;
  note: string | null;
  service?: OrderItemService;
};

export type Order = {
  id: string;
  code: string;
  patientId: string;
  doctorId: string;
  // totalAmount là Decimal → chuỗi.
  totalAmount: string;
  status: OrderStatus;
  note: string | null;
  /** Lý do hủy — thường chỉ set khi status = VOIDED. */
  cancelReason: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  patient?: { fullName: string } | null;
  doctor?: { fullName: string } | null;
  services: OrderItem[];
};

/** Item khi tạo/cập nhật đơn (số tiền gửi dạng number). */
export type OrderItemInput = {
  serviceId: string;
  quantity: number;
  unitPrice: number;
  amount: number;
  note?: string;
};

export type CreateOrderInput = {
  patientId: string;
  doctorId: string;
  totalAmount: number;
  /** Ghi chú đơn hàng (tùy chọn). */
  note?: string;
  services: OrderItemInput[];
};

/**
 * Cập nhật đơn — các field order tùy chọn, `services` **bắt buộc** (backend xóa
 * và thay toàn bộ item cũ bằng danh sách mới, không merge). `cancelReason` chỉ
 * nhận ở endpoint này (dùng khi hủy đơn).
 */
export type UpdateOrderInput = {
  patientId?: string;
  doctorId?: string;
  totalAmount?: number;
  status?: OrderStatus;
  note?: string;
  cancelReason?: string;
  services: OrderItemInput[];
};

export function orderTotal(order: Order): number {
  return Number(order.totalAmount) || 0;
}

/** Nhãn + màu badge cho từng trạng thái đơn (dùng cho bảng & dialog). */
export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; className: string; description: string }
> = {
  DRAFT: {
    label: "Nháp",
    className: "bg-[#f1f4f4] text-[#7e8f8e]",
    description: "Hoá đơn nháp, chưa xuất — có thể sửa tự do",
  },
  ISSUED: {
    label: "Đã xuất",
    className: "bg-[#fdf3e8] text-[#9a6524]",
    description: "Đã xuất hoá đơn, chờ thanh toán — không thể sửa",
  },
  PARTIALLY_PAID: {
    label: "Thu 1 phần",
    className: "bg-[#eef3fb] text-[#3f5f9a]",
    description: "Đã thanh toán một phần",
  },
  PAID: {
    label: "Đã thu",
    className: "bg-[#eef6f1] text-[#3f7a55]",
    description: "Đã thanh toán đủ",
  },
  VOIDED: {
    label: "Đã huỷ",
    className: "bg-[#faeceb] text-[#a4553a]",
    description: "Hoá đơn đã huỷ, không tính doanh thu",
  },
};

/** Chuyển `services[]` của đơn về payload item (để gửi lại khi PUT). */
export function orderItemsToInput(order: Order): OrderItemInput[] {
  return order.services.map((s) => ({
    serviceId: s.serviceId,
    quantity: s.quantity,
    unitPrice: Number(s.unitPrice) || 0,
    amount: Number(s.amount) || 0,
    ...(s.note ? { note: s.note } : {}),
  }));
}

/** Đơn còn hiệu lực (chưa huỷ). */
export function isVoided(order: Order): boolean {
  return order.status === "VOIDED";
}

export function isPaid(order: Order): boolean {
  return order.status === "PAID";
}

/** Chỉ hoá đơn nháp mới được sửa tự do. */
export function isEditable(order: Order): boolean {
  return order.status === "DRAFT";
}

/** Có thể huỷ khi chưa thanh toán (một phần hay toàn bộ) và chưa huỷ. */
export function isVoidable(order: Order): boolean {
  return order.status === "DRAFT" || order.status === "ISSUED";
}

/** Có thể ghi nhận thanh toán — đã xuất hoá đơn và chưa trả đủ. */
export function isPayable(order: Order): boolean {
  return order.status === "ISSUED" || order.status === "PARTIALLY_PAID";
}
