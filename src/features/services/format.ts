import type { ServiceUnit, ToothState } from "./types";

export const unitLabels: Record<ServiceUnit, string> = {
  TOOTH: "Răng",
  SESSION: "Lần",
  CASE: "Ca",
  ARCH: "Cung răng",
  JAW: "Hàm",
  UNIT: "Đơn vị",
};

export const toothStateLabels: Record<ToothState, string> = {
  NORMAL: "Bình thường",
  DECAY: "Sâu răng",
  FILLED: "Đã trám",
  CROWN: "Đã bọc mão sứ",
  ROOT_CANAL: "Đã điều trị tủy",
  EXTRACTED: "Đã nhổ",
  IMPLANT: "Implant",
  MISSING: "Thiếu răng",
  VENEER: "Dán sứ",
};

const vnd = new Intl.NumberFormat("vi-VN");

/** Giá cơ bản, hoặc khoảng giá "min – max" nếu có priceMax lớn hơn. */
export function formatPrice(price: string, priceMax: string | null): string {
  const base = Number(price);
  const max = priceMax != null ? Number(priceMax) : null;
  if (max != null && max > base) {
    return `${vnd.format(base)} – ${vnd.format(max)} đ`;
  }
  return `${vnd.format(base)} đ`;
}

export function formatDuration(minutes: number): string {
  return `${minutes} phút`;
}
