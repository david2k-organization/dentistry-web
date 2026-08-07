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
import type { Invoice } from "./types";
import { invoiceTotal } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const fmt = (n: number) => `${vnd.format(n)} đ`;

const REASONS = ["Bệnh nhân đổi ý", "Lập sai dịch vụ", "Trùng hoá đơn", "Chuyển sang buổi khác"];

const cancelFormSchema = z.object({
  reason: z.string().min(1, "Vui lòng chọn lý do"),
  note: z.string(),
});

type CancelFormValues = z.input<typeof cancelFormSchema>;

const emptyValues: CancelFormValues = { reason: REASONS[0], note: "" };

type CancelInvoiceDialogProps = {
  invoice: Invoice | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string, note: string) => void;
};

export function CancelInvoiceDialog({
  invoice,
  onOpenChange,
  onConfirm,
}: CancelInvoiceDialogProps) {
  const form = useForm<CancelFormValues>({
    resolver: zodResolver(cancelFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (invoice) form.reset(emptyValues);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const reason = form.watch("reason");

  const onSubmit = form.handleSubmit((values) => {
    onConfirm(values.reason, values.note);
  });

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-[#fbeeea] text-[#a4553a]">
          <Ban className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Huỷ hoá đơn {invoice?.code}?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            {invoice &&
              `Hoá đơn ${fmt(invoiceTotal(invoice))} của ${invoice.patient} sẽ chuyển sang trạng thái Đã huỷ và không còn tính vào doanh thu. Hồ sơ vẫn giữ lại để đối chiếu.`}
          </DialogDescription>
        </DialogHeader>

        <form id="cancel-invoice-form" onSubmit={onSubmit}>
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
            placeholder="Ghi chú thêm (không bắt buộc)"
            {...form.register("note")}
          />
        </form>

        <DialogFooter className="sm:justify-start">
          <Button
            type="submit"
            form="cancel-invoice-form"
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
