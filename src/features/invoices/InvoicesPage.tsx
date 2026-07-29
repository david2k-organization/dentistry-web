type InvoiceStatus = "paid" | "partial" | "unpaid";

type Invoice = {
  code: string;
  patient: string;
  summary: string;
  date: string;
  total: string;
  status: string;
  kind: InvoiceStatus;
};

const kpis: { label: string; value: string; color?: string }[] = [
  { label: "Doanh thu tháng 07", value: "248,6 tr" },
  { label: "Đã thu", value: "225,4 tr", color: "#3f7a55" },
  { label: "Còn nợ", value: "23,2 tr", color: "#a4553a" },
];

const invoices: Invoice[] = [
  { code: "HD-0231", patient: "Trần Thu Hà", summary: "Cạo vôi răng + Trám 2 răng", date: "29/07/2026", total: "1.200.000 đ", status: "Đã thu", kind: "paid" },
  { code: "HD-0230", patient: "Nguyễn Văn Long", summary: "Nhổ răng khôn hàm dưới", date: "29/07/2026", total: "2.500.000 đ", status: "Còn nợ", kind: "unpaid" },
  { code: "HD-0229", patient: "Lê Minh Châu", summary: "Trám răng thẩm mỹ Composite", date: "28/07/2026", total: "800.000 đ", status: "Đã thu", kind: "paid" },
  { code: "HD-0228", patient: "Phạm Quốc Bảo", summary: "Niềng răng — đợt 3/12", date: "28/07/2026", total: "6.000.000 đ", status: "Thu một phần", kind: "partial" },
  { code: "HD-0227", patient: "Vũ Thị Mai", summary: "Tẩy trắng răng tại phòng", date: "27/07/2026", total: "1.800.000 đ", status: "Đã thu", kind: "paid" },
  { code: "HD-0226", patient: "Đỗ Hoàng Nam", summary: "Cấy ghép Implant — cọc trụ", date: "27/07/2026", total: "18.000.000 đ", status: "Thu một phần", kind: "partial" },
];

const statusChip: Record<InvoiceStatus, string> = {
  paid: "bg-[#eef6f1] text-[#3f7a55]",
  partial: "bg-[#fdf3e8] text-[#9a6524]",
  unpaid: "bg-[#fbeeea] text-[#a4553a]",
};

const COLS = "grid grid-cols-[1fr_1.6fr_1.9fr_1.1fr_1fr_1fr] gap-3";

export function InvoicesPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-3">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-[14px] border border-border bg-card px-[18px] py-4">
            <div className="text-[12.5px] text-muted-foreground">{k.label}</div>
            <div
              className="mt-1.5 text-2xl font-semibold tracking-tight tabular-nums"
              style={{ color: k.color }}
            >
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div
          className={`${COLS} border-b border-[#e6efee] bg-[#f7fbfa] px-[18px] py-3 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase`}
        >
          <div>Số HĐ</div>
          <div>Bệnh nhân</div>
          <div>Nội dung</div>
          <div>Ngày</div>
          <div className="text-right">Số tiền</div>
          <div className="text-right">Trạng thái</div>
        </div>
        {invoices.map((i) => (
          <div
            key={i.code}
            className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0 hover:bg-[#f7fbfa]`}
          >
            <div className="tabular-nums text-[#4a6664]">{i.code}</div>
            <div className="font-medium text-foreground">{i.patient}</div>
            <div className="truncate text-[#4a6664]">{i.summary}</div>
            <div className="tabular-nums text-[#4a6664]">{i.date}</div>
            <div className="text-right font-semibold tabular-nums text-foreground">{i.total}</div>
            <div className="text-right">
              <span
                className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-medium ${statusChip[i.kind]}`}
              >
                {i.status}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
