import { useEffect, useState } from "react";
import { getRouteApi, Link } from "@tanstack/react-router";
import { ArrowLeft, Ban, History, Pencil, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";
import { CancelInvoiceDialog } from "./CancelInvoiceDialog";
import { errMessage, fmt, formatDate, formatDateTime } from "./format";
import { InvoiceFormDialog, type InvoiceFormResult } from "./InvoiceFormDialog";
import { PaymentDialog } from "./PaymentDialog";
import { PaymentHistoryDialog } from "./PaymentHistoryDialog";
import { UpdateStatusDialog } from "./UpdateStatusDialog";
import { getOrder, updateOrder, updateOrderStatus } from "./api";
import {
  isVoidedPayment,
  netPaid,
  paymentAmount,
  PAYMENT_METHOD_META,
  type Payment,
} from "./payment-types";
import { getPayments } from "./payments-api";
import {
  isEditable,
  isPayable,
  isVoidable,
  isVoided,
  ORDER_STATUS_META,
  orderTotal,
  type Order,
  type OrderItemInput,
  type OrderStatus,
} from "./types";

const routeApi = getRouteApi("/_authenticated/invoices/$id");

function linesToServices(lines: InvoiceFormResult["lines"]): OrderItemInput[] {
  return lines.map((l) => ({
    serviceId: l.serviceId,
    quantity: l.qty,
    unitPrice: l.price,
    amount: l.qty * l.price,
    ...(l.note?.trim() ? { note: l.note.trim() } : {}),
  }));
}

export function InvoiceDetailPage() {
  const { id } = routeApi.useParams();

  const [invoice, setInvoice] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentsLoading, setPaymentsLoading] = useState(true);
  const [paymentsReload, setPaymentsReload] = useState(0);

  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [staffMap, setStaffMap] = useState<Record<string, User>>({});

  const [formOpen, setFormOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const [paying, setPaying] = useState(false);
  const [viewingHistory, setViewingHistory] = useState(false);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getOrder(id);
        if (cancelled) return;
        if (!data) {
          setError("Không tìm thấy hoá đơn.");
          return;
        }
        setInvoice(data);
      } catch (err) {
        if (!cancelled) setError(errMessage(err, "Không thể tải hoá đơn."));
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    Promise.all([
      getPatients({ pageSize: 100 }),
      getServices({ pageSize: 100 }),
      getUsers({ roleName: "Bác sĩ", pageSize: 100 }),
      getUsers({ pageSize: 200 }),
    ]).then(([patientPage, servicePage, doctorPage, staffPage]) => {
      setPatients(patientPage.data);
      setServices(servicePage.data);
      setDoctors(doctorPage.data);
      setStaffMap(Object.fromEntries(staffPage.data.map((u) => [u.id, u])));
    });
  }, []);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve().then(async () => {
      setPaymentsLoading(true);
      try {
        const page = await getPayments({ invoiceId: id, pageSize: 200 });
        if (!cancelled) setPayments(page.data);
      } finally {
        if (!cancelled) setPaymentsLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [id, paymentsReload]);

  const paid = netPaid(payments);
  const total = invoice ? orderTotal(invoice) : 0;
  const remaining = Math.max(total - paid, 0);
  const progressPct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  const handleSave = async (result: InvoiceFormResult) => {
    if (!invoice) return;
    const servicesPayload = linesToServices(result.lines);
    const totalAmount = servicesPayload.reduce((t, s) => t + s.amount, 0);
    const note = result.note.trim();
    try {
      const updated = await updateOrder(invoice.id, {
        patientId: result.patientId,
        doctorId: result.doctorId,
        totalAmount,
        note,
        services: servicesPayload,
      });
      // Xuất hoá đơn là một lần đổi trạng thái riêng (PATCH /:id/status). Giữ
      // `services` đầy đủ từ PUT, chỉ lấy trạng thái mới từ PATCH.
      let final = updated;
      if (result.markIssued) {
        const issued = await updateOrderStatus(updated.id, {
          status: "ISSUED",
        });
        final = {
          ...updated,
          status: issued.status,
          updatedAt: issued.updatedAt,
        };
      }
      setInvoice(final);
      toast.success(`Đã cập nhật hoá đơn ${final.code}`);
    } catch (err) {
      toast.error(errMessage(err, "Không thể lưu hoá đơn."));
    }
  };

  const handleConfirmCancel = async (reason: string, note: string) => {
    if (!invoice) return;
    const voidedReason = [reason, note.trim()].filter(Boolean).join(" — ");
    try {
      const updated = await updateOrderStatus(invoice.id, {
        status: "VOIDED",
        voidedReason,
      });
      setInvoice(updated);
      toast.success(`Đã huỷ hoá đơn ${updated.code}`);
      setCancelling(false);
    } catch (err) {
      toast.error(errMessage(err, "Không thể huỷ hoá đơn."));
    }
  };

  const handleConfirmStatus = async (status: OrderStatus, reason: string) => {
    if (!invoice) return;
    try {
      const updated = await updateOrderStatus(invoice.id, {
        status,
        ...(status === "VOIDED" && reason ? { voidedReason: reason } : {}),
      });
      setInvoice(updated);
      toast.success(
        `Đã chuyển ${updated.code} sang "${ORDER_STATUS_META[status].label}"`,
      );
      setChangingStatus(false);
    } catch (err) {
      toast.error(errMessage(err, "Không thể cập nhật trạng thái."));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-muted-foreground">Đang tải hoá đơn...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="flex flex-col gap-4">
        <BackLink />
        <p className="text-sm text-destructive">
          {error ?? "Không tìm thấy hoá đơn."}
        </p>
      </div>
    );
  }

  const status = ORDER_STATUS_META[invoice.status];
  const voided = isVoided(invoice);

  return (
    <div className="flex flex-col gap-4">
      <BackLink />

      <div className="flex flex-wrap items-center gap-4 rounded-[14px] border border-border bg-card p-[22px]">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="text-[22px] font-semibold tracking-tight text-foreground">
              {invoice.code}
            </div>
            <button
              type="button"
              title="Đổi trạng thái"
              onClick={() => setChangingStatus(true)}
              className={`inline-block cursor-pointer rounded-full px-2.5 py-1 text-[11.5px] font-medium transition-[filter] hover:brightness-95 ${status.className}`}
            >
              {status.label}
            </button>
          </div>
          <div className="mt-1 text-[13px] text-muted-foreground">
            {invoice.patient?.fullName ?? "—"} · BS.{" "}
            {invoice.doctor?.fullName ?? "—"} · {formatDate(invoice.createdAt)}
          </div>
          {invoice.voidedReason && (
            <div className="mt-1 text-[12.5px] text-[#a4553a]">
              Lý do huỷ: {invoice.voidedReason}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-wrap gap-2.5">
          {isEditable(invoice) && (
            <Button
              variant="outline"
              className="gap-1.5"
              onClick={() => setFormOpen(true)}
            >
              <Pencil className="size-4" />
              Sửa
            </Button>
          )}
          {isVoidable(invoice) && (
            <Button
              variant="outline"
              size="icon"
              aria-label="Huỷ hoá đơn"
              className="border-border text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
              onClick={() => setCancelling(true)}
            >
              <Ban />
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-2">
        <div className="overflow-hidden rounded-[14px] border border-border bg-card">
          <div className="border-b border-[#e6efee] px-4.5 py-3.75 text-[14.5px] font-semibold text-foreground">
            Dịch vụ
          </div>
          <div className="grid grid-cols-[2fr_1fr_0.8fr_1fr] gap-2.5 bg-[#f7fbfa] px-4.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
            <div>Dịch vụ</div>
            <div className="text-right">Đơn giá</div>
            <div className="text-center">SL</div>
            <div className="text-right">Thành tiền</div>
          </div>
          {invoice.services.length === 0 && (
            <div className="px-4.5 py-4 text-[12.5px] text-muted-foreground">
              Chưa có dòng dịch vụ nào.
            </div>
          )}
          {invoice.services.map((s) => (
            <div
              key={s.id}
              className="grid grid-cols-[2fr_1fr_0.8fr_1fr] items-center gap-2.5 border-t border-[#f2f7f6] px-4.5 py-2.75 text-[13px]"
            >
              <div className="min-w-0 truncate font-medium text-foreground">
                {s.service?.name ?? "Dịch vụ"}
              </div>
              <div className="text-right tabular-nums text-muted-foreground">
                {fmt(Number(s.unitPrice) || 0)}
              </div>
              <div className="text-center tabular-nums">{s.quantity}</div>
              <div className="text-right font-semibold tabular-nums text-foreground">
                {fmt(Number(s.amount) || 0)}
              </div>
            </div>
          ))}
          <div className="flex justify-between border-t border-[#eef4f3] bg-[#f7fbfa] px-4.5 py-3 text-[13.5px]">
            <span className="font-medium">Tổng cộng</span>
            <span className="font-semibold tabular-nums">{fmt(total)}</span>
          </div>
          {invoice.note && (
            <div className="border-t border-[#f2f7f6] px-4.5 py-3 text-[12.5px] text-muted-foreground whitespace-pre-wrap">
              Ghi chú: {invoice.note}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <div className="overflow-hidden rounded-[14px] border border-border bg-card">
            <div className="flex items-center gap-2.5 border-b border-[#e6efee] px-[18px] py-[15px]">
              <div className="text-[14.5px] font-semibold text-foreground">
                Thanh toán
              </div>
              <div className="flex-1" />
              {isPayable(invoice) && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => setViewingHistory(true)}
                >
                  <History className="size-4" />
                  Quản lý phiếu thu
                </Button>
              )}
              {isPayable(invoice) && (
                // <Button
                //   variant="outline"
                //   size="sm"
                //   className="gap-1.5"
                //   onClick={() => setPaying(true)}
                // >
                //   <Wallet className="size-4" />
                //   Thêm thanh toán
                // </Button>
                <Button className="gap-1.5" onClick={() => setPaying(true)}>
                  <Wallet className="size-4" />
                  Thêm thanh toán
                </Button>
              )}
            </div>

            <div className="px-[18px] pt-3.5">
              <div className="flex justify-between text-[13px]">
                <span className="text-muted-foreground">Tổng tiền</span>
                <span className="font-medium tabular-nums">{fmt(total)}</span>
              </div>
              <div className="mt-1 flex justify-between text-[13px]">
                <span className="text-muted-foreground">Đã thu</span>
                <span className="font-medium tabular-nums text-[#3f7a55]">
                  {fmt(paid)}
                </span>
              </div>
              <div className="mt-1 flex justify-between text-[13px]">
                <span className="text-muted-foreground">Còn lại</span>
                <span className="font-semibold tabular-nums text-[#a4553a]">
                  {fmt(remaining)}
                </span>
              </div>
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1f4f4]">
                <div
                  className="h-full rounded-full bg-[#3f7a55] transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <div className="mt-3.5 flex flex-col gap-2.5 px-[18px] pb-3.5">
              <div className="text-[12px] font-medium text-muted-foreground">
                Lịch sử thu tiền
              </div>
              {paymentsLoading && (
                <div className="text-[12.5px] text-muted-foreground">
                  Đang tải...
                </div>
              )}
              {!paymentsLoading && payments.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">
                  {voided ? "Hoá đơn đã huỷ." : "Chưa có lần thu nào."}
                </div>
              )}
              {payments.map((p) => {
                const voidedPayment = isVoidedPayment(p);
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#eef4f3] p-3"
                    style={{ opacity: voidedPayment ? 0.6 : 1 }}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div
                        className="text-[13px] font-semibold tabular-nums text-foreground"
                        style={{
                          textDecoration: voidedPayment
                            ? "line-through"
                            : "none",
                          color: p.isRefund ? "#a4553a" : undefined,
                        }}
                      >
                        {p.isRefund ? "− " : ""}
                        {fmt(paymentAmount(p))}
                      </div>
                      <div className="text-[11.5px] text-muted-foreground">
                        {formatDateTime(p.paidAt)}
                      </div>
                    </div>
                    <div className="mt-1 text-[12px] text-muted-foreground">
                      {p.code} · {PAYMENT_METHOD_META[p.method].label} ·{" "}
                      {staffMap[p.receivedById]?.fullName ?? "—"}
                      {p.note ? ` · ${p.note}` : ""}
                    </div>
                    {p.isRefund && p.refundReason && (
                      <div className="mt-1 text-[11.5px] text-[#a4553a]">
                        Hoàn tiền: {p.refundReason}
                      </div>
                    )}
                    {voidedPayment && (
                      <div className="mt-1 text-[11.5px] text-[#a4553a]">
                        Đã huỷ{p.voidedReason ? ` — ${p.voidedReason}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <InvoiceFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        invoice={invoice}
        patients={patients}
        services={services}
        doctors={doctors}
        onSave={handleSave}
      />

      <CancelInvoiceDialog
        invoice={cancelling ? invoice : null}
        onOpenChange={(open) => !open && setCancelling(false)}
        onConfirm={handleConfirmCancel}
      />

      <UpdateStatusDialog
        invoice={changingStatus ? invoice : null}
        onOpenChange={(open) => !open && setChangingStatus(false)}
        onConfirm={handleConfirmStatus}
      />

      <PaymentDialog
        invoice={paying ? invoice : null}
        onOpenChange={(open) => {
          if (!open) setPaying(false);
        }}
        onRecorded={(updated) => {
          setInvoice(updated);
          setPaymentsReload((n) => n + 1);
        }}
      />

      <PaymentHistoryDialog
        invoice={viewingHistory ? invoice : null}
        staffMap={staffMap}
        onOpenChange={(open) => {
          if (!open) setViewingHistory(false);
        }}
        onChanged={(updated) => {
          setInvoice(updated);
          setPaymentsReload((n) => n + 1);
        }}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="w-fit gap-1.5 text-muted-foreground"
      asChild
    >
      <Link to="/invoices">
        <ArrowLeft className="size-4" />
        Danh sách hoá đơn
      </Link>
    </Button>
  );
}
