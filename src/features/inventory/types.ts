export type SupplyUnit = "BOX" | "TUBE" | "BLISTER" | "AMPOULE" | "PACK" | "PIECE";

export type WarehouseLogType = "IMPORT" | "EXPORT";

export type Supply = {
  id: string;
  code: string;
  name: string;
  quantity: number;
  quota: number;
  unit: SupplyUnit;
  supplier: string;
  note: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateSupplyInput = {
  code: string;
  name: string;
  quantity: number;
  quota: number;
  unit: SupplyUnit;
  supplier: string;
  note?: string;
};

export type UpdateSupplyInput = Partial<CreateSupplyInput>;

export type WarehouseLog = {
  id: number;
  suppliesId: string;
  type: WarehouseLogType;
  quantity: number;
  note: string | null;
  createdAt: string;
  supplies: { code: string; name: string; unit: SupplyUnit };
};

export type CreateWarehouseLogInput = {
  suppliesId: string;
  type: WarehouseLogType;
  quantity: number;
  note?: string;
};
