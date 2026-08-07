import type { SupplyUnit } from "@/features/inventory/types";

/** Ảnh đính kèm hồ sơ (quan hệ nested trả về từ backend). */
export type TreatmentImage = {
  id: string;
  url: string;
  caption?: string | null;
  displayOrder?: number;
};

/** Vật tư đã dùng trong 1 hồ sơ (item của `treatmentSupplies`). */
export type TreatmentSupply = {
  id?: string;
  suppliesId: string;
  quantity: number;
  unit: SupplyUnit;
  note?: string | null;
};

export type TreatmentRecord = {
  id: string;
  patientId: string;
  doctorId: string;
  serviceId: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  images?: TreatmentImage[];
  treatmentSupplies?: TreatmentSupply[];
};

/** Item vật tư khi tạo hồ sơ (sẽ bị xuất kho). */
export type TreatmentSupplyInput = {
  suppliesId: string;
  quantity: number;
  unit: SupplyUnit;
  note?: string;
};

export type CreateTreatmentRecordInput = {
  patientId: string;
  doctorId: string;
  serviceId: string;
  notes?: string;
  /** Mảng URL ảnh (hoặc data URL nếu chưa có endpoint upload). */
  images?: string[];
  treatmentSupplies?: TreatmentSupplyInput[];
};

export type UpdateTreatmentRecordInput = Partial<CreateTreatmentRecordInput>;

/** Lấy danh sách URL ảnh từ hồ sơ, chấp nhận cả object `{url}` lẫn chuỗi thuần. */
export function treatmentImageUrls(record: TreatmentRecord): string[] {
  const images = record.images ?? [];
  return images
    .map((img) => (typeof img === "string" ? img : img?.url))
    .filter((url): url is string => typeof url === "string" && url.length > 0);
}
