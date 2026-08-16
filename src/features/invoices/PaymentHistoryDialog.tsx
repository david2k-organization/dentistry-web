import { useEffect, useState } from "react";
import { Ban, History, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { User } from "@/features/users/types";
import { EditPaymentDialog, type EditPaymentResult } from "./EditPaymentDialog";
import { errMessage, fmt, formatDateTime } from "./format";
import {
  isVoidedPayment,
  netPaid,
  paymentAmount,
  PAYMENT_METHOD_META,
  type Payment,
} from "./payment-types";
import { getPayments, updatePayment, voidPayment } from "./payments-api";
import { VoidPaymentDialog } from "./VoidPaymentDialog";
import { getOrder } from "./api";
import { orderTotal, type Order } from "./types";

type PaymentHistoryDialogProps = {
  invoice: Order | null;
  staffMap: Record<string, User>;
  onOpenChange: (open: boolean) => void;
  /** Gọi lại khi trạng thái/đã-thu của hoá đơn có thể đã đổi (sau sửa/huỷ phiếu thu). */
  onChanged: (updatedOrder: Order) => void;
};

export function PaymentHistoryDialog({
  invoice,
  staffMap,
  onOpenChange,
  onChanged,
}: PaymentHistoryDialogProps) {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [reload, setReload] = useState(0);

  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [voidingPayment, setVoidingPayment] = useState<Payment | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!invoice) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const page = await getPayments({ invoiceId: invoice.id, pageSize: 200 });
        if (!cancelled) setPayments(page.data);
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice, reload]);

  const total = invoice ? orderTotal(invoice) : 0;
  const paid = netPaid(payments);
  const remaining = Math.max(total - paid, 0);

  const refreshInvoice = async () => {
    if (!invoice) return;
    const updated = await getOrder(invoice.id);
    if (updated) onChanged(updated);
  };

  const handleSaveEdit = async (result: EditPaymentResult) => {
    if (!editingPayment) return;
    setBusy(true);
    try {
      await updatePayment(editingPayment.id, result);
      toast.success(`Đã cập nhật phiếu thu ${editingPayment.code}`);
      setEditingPayment(null);
      setReload((n) => n + 1);
      await refreshInvoice();
    } catch (err) {
      toast.error(errMessage(err, "Không thể cập nhật phiếu thu."));
    } finally {
      setBusy(false);
    }
  };

  const handleConfirmVoid = async (reason: string) => {
    if (!voidingPayment) return;
    setBusy(true);
    try {
      await voidPayment(voidingPayment.id, reason);
      toast.success(`Đã huỷ phiếu thu ${voidingPayment.code}`);
      setVoidingPayment(null);
      setReload((n) => n + 1);
      await refreshInvoice();
    } catch (err) {
      toast.error(errMessage(err, "Không thể huỷ phiếu thu."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <Dialog open={!!invoice} onOpenChange={onOpenChange}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
          <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
            <History className="size-5" />
          </div>
          <DialogHeader className="items-start text-left">
            <DialogTitle>Lịch sử thanh toán {invoice?.code}</DialogTitle>
            <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
              {invoice?.patient?.fullName ?? "Bệnh nhân"}
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-xl border border-[#eef4f3] p-3.5">
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
          </div>

          <div className="flex flex-col gap-2.5">
            {loading && (
              <div className="flex items-center justify-center py-6 text-muted-foreground">
                <Loader2 className="size-5 animate-spin" />
              </div>
            )}
            {!loading && payments.length === 0 && (
              <div className="py-4 text-center text-[12.5px] text-muted-foreground">
                Chưa có lần thu nào.
              </div>
            )}
            {!loading &&
              payments.map((p) => {
                const voided = isVoidedPayment(p);
                const editable = !voided;
                return (
                  <div
                    key={p.id}
                    className="rounded-xl border border-[#eef4f3] p-3"
                    style={{ opacity: voided ? 0.6 : 1 }}
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div>
                        <div
                          className="text-[13px] font-semibold tabular-nums text-foreground"
                          style={{
                            textDecoration: voided ? "line-through" : "none",
                            color: p.isRefund ? "#a4553a" : undefined,
                          }}
                        >
                          {p.isRefund ? "− " : ""}
                          {fmt(paymentAmount(p))}
                        </div>
                        <div className="mt-0.5 text-[12px] text-muted-foreground">
                          {p.code} · {PAYMENT_METHOD_META[p.method].label} ·{" "}
                          {staffMap[p.receivedById]?.fullName ?? "—"}
                        </div>
                      </div>
                      <div className="flex shrink-0 items-start gap-1.5">
                        <div className="pt-0.5 text-[11.5px] whitespace-nowrap text-muted-foreground">
                          {formatDateTime(p.paidAt)}
                        </div>
                        {editable && (
                          <div className="flex gap-1">
                            <button
                              type="button"
                              title="Sửa phiếu thu"
                              onClick={() => setEditingPayment(p)}
                              className="grid size-[26px] cursor-pointer place-items-center rounded-[8px] border border-border bg-card text-[#4a6664] hover:border-[#cfe0df] hover:bg-accent hover:text-primary"
                            >
                              <Pencil className="size-[14px]" />
                            </button>
                            <button
                              type="button"
                              title="Huỷ phiếu thu"
                              onClick={() => setVoidingPayment(p)}
                              className="grid size-[26px] cursor-pointer place-items-center rounded-[8px] border border-border bg-card text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                            >
                              <Ban className="size-[14px]" />
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    {p.note && (
                      <div className="mt-1 text-[12px] text-muted-foreground">
                        {p.note}
                      </div>
                    )}
                    {p.isRefund && p.refundReason && (
                      <div className="mt-1 text-[11.5px] text-[#a4553a]">
                        Hoàn tiền: {p.refundReason}
                      </div>
                    )}
                    {voided && (
                      <div className="mt-1 text-[11.5px] text-[#a4553a]">
                        Đã huỷ{p.voidedReason ? ` — ${p.voidedReason}` : ""}
                      </div>
                    )}
                  </div>
                );
              })}
          </div>
        </DialogContent>
      </Dialog>

      <EditPaymentDialog
        payment={editingPayment}
        onOpenChange={(open) => !open && setEditingPayment(null)}
        onSave={handleSaveEdit}
        saving={busy}
      />

      <VoidPaymentDialog
        payment={voidingPayment}
        onOpenChange={(open) => !open && setVoidingPayment(null)}
        onConfirm={handleConfirmVoid}
        voiding={busy}
      />
    </>
  );
}
