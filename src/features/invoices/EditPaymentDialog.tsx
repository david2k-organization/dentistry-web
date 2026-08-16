import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Pencil } from "lucide-react";

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
import { PAYMENT_METHOD_META, type Payment, type PaymentMethod } from "./payment-types";

const METHODS = Object.keys(PAYMENT_METHOD_META) as PaymentMethod[];

const editPaymentFormSchema = z.object({
  amount: z.coerce.number().min(1, "Số tiền phải lớn hơn 0"),
  method: z.enum(["CASH", "BANK_TRANSFER"]),
  note: z.string(),
});

type EditPaymentFormValues = z.input<typeof editPaymentFormSchema>;

export type EditPaymentResult = {
  amount: number;
  method: PaymentMethod;
  note?: string;
};

type EditPaymentDialogProps = {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onSave: (result: EditPaymentResult) => void;
  saving?: boolean;
};

export function EditPaymentDialog({
  payment,
  onOpenChange,
  onSave,
  saving,
}: EditPaymentDialogProps) {
  const form = useForm<EditPaymentFormValues>({
    resolver: zodResolver(editPaymentFormSchema),
    defaultValues: { amount: 0, method: "CASH", note: "" },
  });

  useEffect(() => {
    if (payment) {
      form.reset({
        amount: Number(payment.amount) || 0,
        method: payment.method,
        note: payment.note ?? "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const method = form.watch("method");

  const onSubmit = form.handleSubmit((values) => {
    onSave({
      amount: Number(values.amount),
      method: values.method,
      note: values.note.trim() || undefined,
    });
  });

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <Pencil className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Sửa phiếu thu {payment?.code}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Chỉ sửa được phiếu chưa huỷ.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-payment-form" onSubmit={onSubmit}>
          <div className="text-[11.5px] text-muted-foreground">Số tiền</div>
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
            {...form.register("note")}
          />
        </form>

        <DialogFooter className="sm:justify-start">
          <Button type="submit" form="edit-payment-form" disabled={saving}>
            Lưu thay đổi
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
