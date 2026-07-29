import { useEffect, useState } from "react";
import { Ban, Pencil, Receipt } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { InvoiceFormDialog, type InvoiceFormResult } from "./InvoiceFormDialog";
import { invoiceTotal, type Invoice } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const fmt = (n: number) => `${vnd.format(n)} đ`;

const initialInvoices: Invoice[] = [
  { code: "HD-0231", patient: "Trần Thu Hà", date: "29/07/2026", paid: true, voided: false, lines: [{ name: "Cạo vôi răng + Trám 2 răng", qty: 1, price: 1_200_000 }] },
  { code: "HD-0230", patient: "Nguyễn Văn Long", date: "29/07/2026", paid: false, voided: false, lines: [{ name: "Nhổ răng khôn hàm dưới", qty: 1, price: 2_500_000 }] },
  { code: "HD-0229", patient: "Lê Minh Châu", date: "28/07/2026", paid: true, voided: false, lines: [{ name: "Trám răng thẩm mỹ Composite", qty: 1, price: 800_000 }] },
  { code: "HD-0228", patient: "Phạm Quốc Bảo", date: "28/07/2026", paid: false, voided: false, lines: [{ name: "Niềng răng — đợt 3/12", qty: 1, price: 6_000_000 }] },
  { code: "HD-0227", patient: "Vũ Thị Mai", date: "27/07/2026", paid: true, voided: false, lines: [{ name: "Tẩy trắng răng tại phòng", qty: 1, price: 1_800_000 }] },
  { code: "HD-0226", patient: "Đỗ Hoàng Nam", date: "27/07/2026", paid: false, voided: false, lines: [{ name: "Cấy ghép Implant — cọc trụ", qty: 1, price: 18_000_000 }] },
];

function summaryOf(invoice: Invoice): string {
  if (invoice.voided) return `Đã huỷ${invoice.reason ? " · " + invoice.reason : ""}`;
  return invoice.lines.map((l) => l.name).join(", ");
}

function statusOf(invoice: Invoice): { label: string; className: string } {
  if (invoice.voided) return { label: "Đã huỷ", className: "bg-[#f1f4f4] text-[#7e8f8e]" };
  if (invoice.paid) return { label: "Đã thu", className: "bg-[#eef6f1] text-[#3f7a55]" };
  return { label: "Chờ thu", className: "bg-[#fdf3e8] text-[#9a6524]" };
}

function nextCodeFrom(invoices: Invoice[]): string {
  const nums = invoices.map((i) => Number(i.code.replace(/\D/g, "")) || 0);
  return "HD-" + String(Math.max(0, ...nums) + 1).padStart(4, "0");
}

const COLS = "grid grid-cols-[1fr_1.5fr_1.8fr_1fr_1fr_0.9fr_88px] gap-3";

export function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>(initialInvoices);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [formOpen, setFormOpen] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [cancellingInvoice, setCancellingInvoice] = useState<Invoice | null>(null);

  useEffect(() => {
    Promise.all([getPatients(), getServices()])
      .then(([patientList, serviceList]) => {
        setPatients(patientList);
        setServices(serviceList);
      })
      .catch(() => {
        toast.error("Không thể tải danh sách bệnh nhân / dịch vụ.");
      });
  }, []);

  const live = invoices.filter((i) => !i.voided);
  const unpaid = live.filter((i) => !i.paid).reduce((t, i) => t + invoiceTotal(i), 0);
  const paidTotal = live.filter((i) => i.paid).reduce((t, i) => t + invoiceTotal(i), 0);

  const kpis = [
    { label: "Chờ thu", value: fmt(unpaid), color: "#a4553a" },
    { label: "Đã thu tháng 07", value: fmt(paidTotal), color: undefined },
    { label: "Hoá đơn hiệu lực", value: String(live.length), color: undefined },
  ];

  const openEdit = (invoice: Invoice) => {
    if (invoice.paid) {
      toast.error("Hoá đơn đã thu — không sửa được");
      return;
    }
    if (invoice.voided) {
      toast.error("Hoá đơn đã huỷ — không sửa được");
      return;
    }
    setEditingInvoice(invoice);
    setFormOpen(true);
  };

  const openCreate = () => {
    setEditingInvoice(null);
    setFormOpen(true);
  };

  const requestCancel = (invoice: Invoice) => {
    if (invoice.paid) {
      toast.error("Hoá đơn đã thu — cần hoàn tiền thay vì huỷ");
      return;
    }
    if (invoice.voided) {
      toast.error("Hoá đơn đã huỷ");
      return;
    }
    setCancellingInvoice(invoice);
  };

  const handleSave = (result: InvoiceFormResult) => {
    if (result.mode === "edit") {
      setInvoices((prev) =>
        prev.map((i) =>
          i.code === result.code
            ? { ...i, patient: result.patient, lines: result.lines, paid: result.markPaid ? true : i.paid }
            : i
        )
      );
      toast.success(
        result.markPaid
          ? `Đã cập nhật và thu ${fmt(result.lines.reduce((t, l) => t + l.qty * l.price, 0))}`
          : `Đã cập nhật hoá đơn ${result.code}`
      );
    } else {
      const invoice: Invoice = {
        code: result.code,
        patient: result.patient,
        date: "29/07/2026",
        paid: result.markPaid,
        voided: false,
        lines: result.lines,
      };
      setInvoices((prev) => [invoice, ...prev]);
      const total = fmt(result.lines.reduce((t, l) => t + l.qty * l.price, 0));
      toast.success(
        result.markPaid
          ? `Đã tạo và thu ${total} — ${result.patient}`
          : `Đã tạo hoá đơn ${result.code} · ${total}`
      );
    }
  };

  const handleConfirmCancel = (reason: string, note: string) => {
    if (!cancellingInvoice) return;
    const fullReason = [reason, note.trim()].filter(Boolean).join(" — ");
    setInvoices((prev) =>
      prev.map((i) =>
        i.code === cancellingInvoice.code ? { ...i, voided: true, paid: false, reason: fullReason } : i
      )
    );
    toast.success(`Đã huỷ hoá đơn ${cancellingInvoice.code}`);
    setCancellingInvoice(null);
  };

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
        <div className="flex items-center gap-3 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">Hoá đơn tháng 07/2026</div>
          <div className="text-xs text-muted-foreground">
            {live.length} hoá đơn hiệu lực · {invoices.filter((i) => i.voided).length} đã huỷ
          </div>
          <div className="flex-1" />
          <Button onClick={openCreate} className="gap-1.5">
            <Receipt className="size-[17px]" />
            Tạo hoá đơn
          </Button>
        </div>

        <div
          className={`${COLS} border-b border-[#e6efee] bg-[#f7fbfa] px-[18px] py-3 text-[11.5px] font-medium tracking-[0.04em] text-muted-foreground uppercase`}
        >
          <div>Số HĐ</div>
          <div>Bệnh nhân</div>
          <div>Nội dung</div>
          <div>Ngày</div>
          <div className="text-right">Số tiền</div>
          <div className="text-right">Trạng thái</div>
          <div className="text-right">Thao tác</div>
        </div>

        {invoices.map((i) => {
          const status = statusOf(i);
          const locked = i.paid || i.voided;
          return (
            <div
              key={i.code}
              className={`${COLS} items-center border-b border-[#f0f5f4] px-[18px] py-[13px] text-[13px] last:border-0 hover:bg-[#f7fbfa]`}
              style={{ opacity: i.voided ? 0.72 : 1 }}
            >
              <div
                className="cursor-pointer tabular-nums text-[#4a6664]"
                style={{ textDecoration: i.voided ? "line-through" : "none" }}
                onClick={() => openEdit(i)}
              >
                {i.code}
              </div>
              <div className="cursor-pointer font-medium text-foreground" onClick={() => openEdit(i)}>
                {i.patient}
              </div>
              <div className="truncate text-[#4a6664]">{summaryOf(i)}</div>
              <div className="tabular-nums text-[#4a6664]">{i.date}</div>
              <div
                className="text-right font-semibold tabular-nums text-foreground"
                style={{ textDecoration: i.voided ? "line-through" : "none" }}
              >
                {fmt(invoiceTotal(i))}
              </div>
              <div className="text-right">
                <span className={`inline-block rounded-full px-2.5 py-1 text-[11.5px] font-medium ${status.className}`}>
                  {status.label}
                </span>
              </div>
              <div className="flex justify-end gap-1.5">
                <button
                  type="button"
                  title={locked ? "Không thể sửa" : "Sửa hoá đơn"}
                  onClick={() => openEdit(i)}
                  className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-border bg-card text-[#4a6664] hover:border-[#cfe0df] hover:bg-accent hover:text-primary disabled:cursor-not-allowed"
                >
                  <Pencil className="size-[17px]" />
                </button>
                <button
                  type="button"
                  title={locked ? "Không thể huỷ" : "Huỷ hoá đơn"}
                  onClick={() => requestCancel(i)}
                  className="grid size-[30px] cursor-pointer place-items-center rounded-[9px] border border-border bg-card text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                >
                  <Ban className="size-[17px]" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={editingInvoice}
        nextCode={nextCodeFrom(invoices)}
        patients={patients}
        services={services}
        onSave={handleSave}
      />

      <CancelInvoiceDialog
        invoice={cancellingInvoice}
        onOpenChange={(open) => !open && setCancellingInvoice(null)}
        onConfirm={handleConfirmCancel}
      />
    </div>
  );
}
