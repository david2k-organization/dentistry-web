import { Button } from "@/components/ui/button";

type Item = {
  name: string;
  sku: string;
  qty: number;
  min: number;
  unit: string;
  supplier: string;
};

const inventory: Item[] = [
  { name: "Găng tay y tế size M", sku: "GT-M-100", qty: 2, min: 10, unit: "hộp", supplier: "Nam Khoa" },
  { name: "Kim tiêm nha khoa 27G", sku: "KT-27G", qty: 5, min: 12, unit: "vỉ", supplier: "Dentsply" },
  { name: "Composite trám răng A2", sku: "CP-A2", qty: 1, min: 6, unit: "tuýp", supplier: "3M ESPE" },
  { name: "Thuốc tê Lidocaine 2%", sku: "TT-LID2", qty: 14, min: 10, unit: "ống", supplier: "Septodont" },
  { name: "Bông gòn cuộn tiệt trùng", sku: "BG-500", qty: 24, min: 8, unit: "gói", supplier: "Bảo Thạch" },
  { name: "Mũi khoan kim cương", sku: "MK-DIA", qty: 7, min: 15, unit: "cái", supplier: "Mani" },
  { name: "Nước súc miệng sát khuẩn", sku: "NSM-500", qty: 18, min: 10, unit: "chai", supplier: "Nam Khoa" },
];

function stockLevel(qty: number, min: number) {
  const ratio = min === 0 ? 1 : qty / min;
  const pct = Math.min(Math.round(ratio * 100), 100);
  if (ratio < 0.5) return { pct, bar: "#c2765b", text: "text-[#bd6446]" };
  if (ratio < 1) return { pct, bar: "#d99a3f", text: "text-[#9a6524]" };
  return { pct, bar: "#5da177", text: "text-[#3f7a55]" };
}

const COLS = "grid grid-cols-[2fr_1fr_1.4fr_1.2fr_1fr] gap-3";

export function InventoryPage() {
  const lowStockCount = inventory.filter((s) => s.qty < s.min).length;

  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">
      <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
        <div className="text-[14.5px] font-semibold text-foreground">Kho vật tư</div>
        <div className="text-xs text-muted-foreground">
          {lowStockCount} mặt hàng dưới định mức
        </div>
      </div>

      <div
        className={`${COLS} border-b border-[#e6efee] bg-[#f7fbfa] px-[18px] py-3 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase`}
      >
        <div>Vật tư</div>
        <div>Tồn / Định mức</div>
        <div>Mức tồn</div>
        <div>Nhà cung cấp</div>
        <div className="text-right">Nhập kho</div>
      </div>

      {inventory.map((s) => {
        const level = stockLevel(s.qty, s.min);
        return (
          <div
            key={s.sku}
            className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0`}
          >
            <div className="leading-tight">
              <div className="font-medium text-foreground">{s.name}</div>
              <div className="text-[11.5px] text-muted-foreground">{s.sku}</div>
            </div>
            <div className={`font-medium tabular-nums ${level.text}`}>
              {s.qty} / {s.min} {s.unit}
            </div>
            <div>
              <div className="h-[7px] overflow-hidden rounded-[4px] bg-[#eef4f3]">
                <div
                  className="h-full rounded-[4px]"
                  style={{ width: `${level.pct}%`, background: level.bar }}
                />
              </div>
            </div>
            <div className="text-[12.5px] text-[#4a6664]">{s.supplier}</div>
            <div className="text-right">
              <Button variant="outline" size="sm" className="text-primary">
                + Nhập 20
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
