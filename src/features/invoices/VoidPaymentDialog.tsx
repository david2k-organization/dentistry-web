import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Ban } from "lucide-react";

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
import { fmt } from "./format";
import { paymentAmount, type Payment } from "./payment-types";

const REASONS = ["Nhập sai số tiền", "Trùng phiếu thu", "Khách yêu cầu huỷ", "Sai phương thức"];

const voidFormSchema = z.object({
  reason: z.string().min(1, "Vui lòng chọn hoặc nhập lý do"),
});

type VoidFormValues = z.input<typeof voidFormSchema>;

const emptyValues: VoidFormValues = { reason: REASONS[0] };

type VoidPaymentDialogProps = {
  payment: Payment | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string) => void;
  voiding?: boolean;
};

export function VoidPaymentDialog({
  payment,
  onOpenChange,
  onConfirm,
  voiding,
}: VoidPaymentDialogProps) {
  const form = useForm<VoidFormValues>({
    resolver: zodResolver(voidFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (payment) form.reset(emptyValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payment]);

  const reason = form.watch("reason");
  const isPreset = REASONS.includes(reason);

  const onSubmit = form.handleSubmit((values) => {
    onConfirm(values.reason.trim());
  });

  return (
    <Dialog open={!!payment} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-[#fbeeea] text-[#a4553a]">
          <Ban className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Huỷ phiếu thu {payment?.code}?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            {payment &&
              `Khoản thu ${fmt(paymentAmount(payment))} sẽ không còn tính vào tổng đã thu của hoá đơn. Phiếu vẫn giữ lại để đối chiếu.`}
          </DialogDescription>
        </DialogHeader>

        <form id="void-payment-form" onSubmit={onSubmit}>
          <div className="text-[11.5px] text-muted-foreground">Lý do huỷ</div>
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
                      ? { background: "#fbeeea", color: "#a4553a", borderColor: "#e6cdbf" }
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
        </form>

        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            form="void-payment-form"
            disabled={voiding}
            className="bg-[#a4553a] text-white hover:bg-[#8a4530]"
          >
            Xác nhận huỷ
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Giữ lại
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
