export type OrderStatus =
  | "CREATED"
  | "PENDING"
  | "PAID"
  | "CANCELLED"
  | "REFUNDED";

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
  /** Lý do hủy — thường chỉ set khi status = CANCELLED. */
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
  CREATED: {
    label: "Chờ thu",
    className: "bg-[#fdf3e8] text-[#9a6524]",
    description: "Đơn mới tạo, chưa thu tiền",
  },
  PENDING: {
    label: "Chờ xử lý",
    className: "bg-[#fdf3e8] text-[#9a6524]",
    description: "Đang chờ xử lý / thanh toán",
  },
  PAID: {
    label: "Đã thu",
    className: "bg-[#eef6f1] text-[#3f7a55]",
    description: "Đã thu đủ tiền",
  },
  CANCELLED: {
    label: "Đã huỷ",
    className: "bg-[#f1f4f4] text-[#7e8f8e]",
    description: "Đơn đã huỷ, không tính doanh thu",
  },
  REFUNDED: {
    label: "Đã hoàn tiền",
    className: "bg-[#f4eef1] text-[#8a4a63]",
    description: "Đã hoàn tiền cho khách",
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

/** Đơn còn hiệu lực (chưa huỷ / hoàn tiền). */
export function isVoided(order: Order): boolean {
  return order.status === "CANCELLED" || order.status === "REFUNDED";
}

export function isPaid(order: Order): boolean {
  return order.status === "PAID";
}
