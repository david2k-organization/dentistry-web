import type { SupplyUnit } from "./types";

export const SUPPLY_UNIT_LABELS: Record<SupplyUnit, string> = {
  BOX: "hộp",
  TUBE: "tuýp",
  BLISTER: "vỉ",
  AMPOULE: "ống",
  PACK: "gói",
  PIECE: "cái",
};

export const SUPPLY_UNITS = (
  Object.keys(SUPPLY_UNIT_LABELS) as SupplyUnit[]
).map((value) => ({ value, label: SUPPLY_UNIT_LABELS[value] }));

export function formatShortDate(iso: string | null): string {
  if (!iso) return "—";
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(iso));
}
