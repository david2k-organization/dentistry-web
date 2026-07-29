export type StockLogEntry = { date: string; delta: number; note: string };

export type InventoryItem = {
  sku: string;
  name: string;
  qty: number;
  min: number;
  unit: string;
  supplier: string;
  updated: string;
  log: StockLogEntry[];
};
