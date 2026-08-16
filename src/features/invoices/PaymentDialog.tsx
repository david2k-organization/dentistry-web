import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Wallet } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { errMessage, fmt } from "./format";
import { netPaid, PAYMENT_METHOD_META, type PaymentMethod } from "./payment-types";
import { createPayment, getPayments } from "./payments-api";
import { getOrder } from "./api";
import { orderTotal, type Order } from "./types";

const METHODS = Object.keys(PAYMENT_METHOD_META) as PaymentMethod[];

const paymentFormSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  method: z.enum(["CASH", "BANK_TRANSFER"]),
  note: z.string(),
});

type PaymentFormValues = z.input<typeof paymentFormSchema>;

type PaymentDialogProps = {
  invoice: Order | null;
  onOpenChange: (open: boolean) => void;
  onRecorded: (updatedOrder: Order) => void;
};

export function PaymentDialog({
  invoice,
  onOpenChange,
  onRecorded,
}: PaymentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(paymentFormSchema),
    defaultValues: { amount: 0, method: "CASH", note: "" },
  });

  const total = invoice ? orderTotal(invoice) : 0;
  const remaining = Math.max(total - paid, 0);
  const progressPct = total > 0 ? Math.min((paid / total) * 100, 100) : 0;

  useEffect(() => {
    if (!invoice) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoading(true);
      try {
        const page = await getPayments({ invoiceId: invoice.id, pageSize: 200 });
        if (cancelled) return;
        const alreadyPaid = netPaid(page.data);
        setPaid(alreadyPaid);
        form.reset({
          amount: Math.max(orderTotal(invoice) - alreadyPaid, 0),
          method: "CASH",
          note: "",
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const method = form.watch("method");

  const onSubmit = form.handleSubmit(async (values) => {
    if (!invoice) return;
    const amount = Number(values.amount);
    if (amount > remaining) {
      form.setError("amount", {
        message: `Không vượt quá số còn lại (${fmt(remaining)})`,
      });
      return;
    }

    setSubmitting(true);
    try {
      await createPayment({
        invoiceId: invoice.id,
        amount,
        method: values.method,
        note: values.note.trim() || undefined,
      });

      // Backend tự đồng bộ Invoice.status khi tạo phiếu thu — nạp lại đơn
      // để lấy trạng thái mới nhất thay vì tự suy luận ở FE.
      const updated = (await getOrder(invoice.id)) ?? invoice;
      onRecorded(updated);

      const newRemaining = total - (paid + amount);
      toast.success(
        newRemaining <= 0
          ? `Đã thu ${fmt(amount)} — hoá đơn ${invoice.code} đã thanh toán đủ`
          : `Đã ghi nhận thu ${fmt(amount)} cho hoá đơn ${invoice.code}`,
      );
      onOpenChange(false);
    } catch (err) {
      toast.error(errMessage(err, "Không thể ghi nhận thanh toán."));
    } finally {
      setSubmitting(false);
    }
  });

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <Wallet className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Thanh toán {invoice?.code}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            {invoice?.patient?.fullName ?? "Bệnh nhân"} — có thể ghi nhận nhiều
            lần thu cho đến khi trả đủ.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-6 text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <>
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
              <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-[#f1f4f4]">
                <div
                  className="h-full rounded-full bg-[#3f7a55] transition-[width]"
                  style={{ width: `${progressPct}%` }}
                />
              </div>
            </div>

            <form id="payment-form" onSubmit={onSubmit} className="mt-1">
              <div className="text-[11.5px] text-muted-foreground">
                Số tiền thu lần này
              </div>
              <input
                type="number"
                step="1"
                min="1"
                className="mt-1.5 h-9 w-full rounded-lg border border-[#dde8e7] bg-transparent px-3 text-[13px] outline-none tabular-nums focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                {...form.register("amount")}
              />
              {form.formState.errors.amount && (
                <p className="mt-1 text-[11px] text-[#a4553a]">
                  {form.formState.errors.amount.message}
                </p>
              )}

              <div className="mt-3 text-[11.5px] text-muted-foreground">
                Phương thức
              </div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {METHODS.map((m) => {
                  const active = method === m;
                  return (
                    <button
                      key={m}
                      type="button"
                      onClick={() => form.setValue("method", m)}
                      className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-[filter] hover:brightness-95"
                      style={
                        active
                          ? { background: "#eef6f4", color: "#2f6f66", borderColor: "#cfe0df" }
                          : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                      }
                    >
                      {PAYMENT_METHOD_META[m].label}
                    </button>
                  );
                })}
              </div>

              <div className="mt-3 text-[11.5px] text-muted-foreground">
                Ghi chú (không bắt buộc)
              </div>
              <Textarea
                className="mt-1.5 min-h-[56px]"
                placeholder="Ví dụ: khách hẹn trả nốt vào tuần sau"
                {...form.register("note")}
              />
            </form>
          </>
        )}

        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            form="payment-form"
            disabled={loading || submitting || remaining <= 0}
            className="gap-1.5"
          >
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Ghi nhận thu tiền
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
