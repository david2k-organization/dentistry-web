export type ServiceUnit = "TOOTH" | "SESSION" | "CASE" | "ARCH" | "JAW" | "UNIT";

export type ToothState =
  | "NORMAL"
  | "DECAY"
  | "FILLED"
  | "CROWN"
  | "ROOT_CANAL"
  | "EXTRACTED"
  | "IMPLANT"
  | "MISSING"
  | "VENEER";

/** Nhóm dịch vụ được trả kèm (rút gọn) trong response của Service. */
export type ServiceCategoryRef = {
  id: string;
  code: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
};

export type Service = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  categoryId: string;
  // price/priceMax/commissionRate là Decimal ở Prisma nên serialize thành chuỗi.
  price: string;
  priceMax: string | null;
  unit: ServiceUnit;
  durationMinutes: number;
  requiresTooth: boolean;
  toothStateAfter: ToothState | null;
  color: string | null;
  displayOrder: number;
  isActive: boolean;
  commissionRate: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  category: ServiceCategoryRef | null;
};

export type CreateServiceInput = {
  code: string;
  name: string;
  description?: string;
  categoryId: string;
  price: number;
  priceMax?: number;
  unit?: ServiceUnit;
  durationMinutes?: number;
  requiresTooth?: boolean;
  toothStateAfter?: ToothState;
  color?: string;
  displayOrder?: number;
  isActive?: boolean;
  commissionRate?: number;
};

export type UpdateServiceInput = Partial<CreateServiceInput>;
