import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fmt } from "./format";
import {
  paymentAmount,
  PAYMENT_METHOD_META,
  type Payment,
  type PaymentMethod,
  type RefundPaymentInput,
} from "./payment-types";

const METHODS = Object.keys(PAYMENT_METHOD_META) as PaymentMethod[];
const REASONS = ["Khách huỷ dịch vụ", "Thu thừa", "Sai số tiền", "Khách yêu cầu"];

const refundFormSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  method: z.enum(["CASH", "BANK_TRANSFER"]),
  reason: z.string().min(1, "Vui lòng chọn hoặc nhập lý do"),
  note: z.string(),
});

type RefundFormValues = z.input<typeof refundFormSchema>;

type RefundPaymentDialogProps = {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (input: RefundPaymentInput) => void;
  refunding?: boolean;
};

export function RefundPaymentDialog({
  payment,
  onOpenChange,
  onConfirm,
  refunding,
}: RefundPaymentDialogProps) {
  const form = useForm<RefundFormValues>({
    resolver: zodResolver(refundFormSchema),
    defaultValues: { amount: 0, method: "CASH", reason: REASONS[0], note: "" },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        amount: paymentAmount(payment),
        method: payment.method,
        reason: REASONS[0],
        note: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const method = form.watch("method");
  const reason = form.watch("reason");
  const isPreset = REASONS.includes(reason);

  const onSubmit = form.handleSubmit((values) => {
    if (!payment) return;
    const amount = Number(values.amount);
    const original = paymentAmount(payment);
    if (amount > original) {
      form.setError("amount", {
        message: `Không vượt quá số tiền phiếu gốc (${fmt(original)})`,
      });
      return;
    }
    onConfirm({
      amount,
      refundReason: values.reason.trim(),
      method: values.method,
      note: values.note.trim() || undefined,
    });
  });

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-[#fdf3e8] text-[#9a6524]">
          <RotateCcw className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Hoàn tiền phiếu {payment?.code}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            {payment &&
              `Tạo phiếu hoàn tiền tham chiếu phiếu thu ${fmt(paymentAmount(payment))}. Số tiền hoàn sẽ trừ vào tổng đã thu của hoá đơn.`}
          </DialogDescription>
        </DialogHeader>

        <form id="refund-payment-form" onSubmit={onSubmit}>
          <div className="text-[11.5px] text-muted-foreground">Số tiền hoàn</div>
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
            Lý do hoàn
          </div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {REASONS.map((r) => {
              const active = reason === r;
              return (
                <button
                  key={r}
                  type="button"
                  onClick={() => form.setValue("reason", r)}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-[filter] hover:brightness-95"
                  style={
                    active
                      ? { background: "#fdf3e8", color: "#9a6524", borderColor: "#e6d3b8" }
                      : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                  }
                >
                  {r}
                </button>
              );
            })}
          </div>
          <Input
            className="mt-2.5"
            placeholder="Hoặc nhập lý do khác"
            value={isPreset ? "" : reason}
            onChange={(e) => form.setValue("reason", e.target.value)}
          />
          {form.formState.errors.reason && (
            <p className="mt-1 text-[11px] text-[#a4553a]">
              {form.formState.errors.reason.message}
            </p>
          )}

          <div className="mt-3 text-[11.5px] text-muted-foreground">
            Ghi chú (không bắt buộc)
          </div>
          <Textarea className="mt-1.5 min-h-[56px]" {...form.register("note")} />
        </form>

        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            form="refund-payment-form"
            disabled={refunding}
            className="bg-[#9a6524] text-white hover:bg-[#824f16]"
          >
            Xác nhận hoàn tiền
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
