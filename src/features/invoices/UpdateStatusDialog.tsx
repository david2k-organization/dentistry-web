import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { RefreshCw } from "lucide-react";

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
import { ORDER_STATUS_META, type Order, type OrderStatus } from "./types";

/** Các trạng thái người dùng có thể chuyển sang từ dialog này. */
const SELECTABLE: OrderStatus[] = [
  "CREATED",
  "PENDING",
  "PAID",
  "CANCELLED",
  "REFUNDED",
];

/** Trạng thái cần kèm lý do (map sang `cancelReason`). */
const NEEDS_REASON: OrderStatus[] = ["CANCELLED", "REFUNDED"];

const statusFormSchema = z.object({
  status: z.enum(["CREATED", "PENDING", "PAID", "CANCELLED", "REFUNDED"]),
  reason: z.string(),
});

type StatusFormValues = z.input<typeof statusFormSchema>;

type UpdateStatusDialogProps = {
  invoice: Order | null;
  onOpenChange: (open: boolean) => void;
  onConfirm: (status: OrderStatus, reason: string) => void;
};

export function UpdateStatusDialog({
  invoice,
  onOpenChange,
  onConfirm,
}: UpdateStatusDialogProps) {
  const form = useForm<StatusFormValues>({
    resolver: zodResolver(statusFormSchema),
    defaultValues: { status: "CREATED", reason: "" },
  });

  useEffect(() => {
    if (invoice) form.reset({ status: invoice.status, reason: "" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [invoice]);

  const status = form.watch("status");
  const needsReason = NEEDS_REASON.includes(status);
  const unchanged = !!invoice && status === invoice.status;

  const onSubmit = form.handleSubmit((values) => {
    onConfirm(values.status, values.reason.trim());
  });

  return (
    <Dialog open={!!invoice} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <RefreshCw className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Đổi trạng thái {invoice?.code}</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Trạng thái hiện tại:{" "}
            <span className="font-medium text-foreground">
              {invoice ? ORDER_STATUS_META[invoice.status].label : ""}
            </span>
            . Chọn trạng thái mới cho hoá đơn.
          </DialogDescription>
        </DialogHeader>

        <form id="update-status-form" onSubmit={onSubmit}>
          <div className="text-[11.5px] text-muted-foreground">Trạng thái mới</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {SELECTABLE.map((s) => {
              const active = status === s;
              const meta = ORDER_STATUS_META[s];
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => form.setValue("status", s)}
                  title={meta.description}
                  className="cursor-pointer rounded-full border px-3 py-1.5 text-xs font-medium transition-[filter] hover:brightness-95"
                  style={
                    active
                      ? { background: "#eef6f4", color: "#2f6f66", borderColor: "#cfe0df" }
                      : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                  }
                >
                  {meta.label}
                </button>
              );
            })}
          </div>

          {needsReason && (
            <div className="mt-3">
              <div className="text-[11.5px] text-muted-foreground">
                Lý do {status === "REFUNDED" ? "hoàn tiền" : "huỷ"} (không bắt buộc)
              </div>
              <Textarea
                className="mt-1.5 min-h-[56px]"
                placeholder="Ghi rõ lý do để đối chiếu sau này"
                {...form.register("reason")}
              />
            </div>
          )}
        </form>

        <DialogFooter className="sm:justify-start">
          <Button type="submit" form="update-status-form" disabled={unchanged}>
            Cập nhật trạng thái
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
