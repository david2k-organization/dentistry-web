import { useState } from "react";
import { Wallet } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fmt } from "./format";
import { orderTotal, ORDER_STATUS_META, type Order } from "./types";

type ChooseInvoiceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Danh sách hoá đơn có thể thu tiền (ISSUED / PARTIALLY_PAID). */
  invoices: Order[];
  onPick: (invoice: Order) => void;
};

export function ChooseInvoiceDialog({
  open,
  onOpenChange,
  invoices,
  onPick,
}: ChooseInvoiceDialogProps) {
  const [selectedId, setSelectedId] = useState("");

  // Reset lựa chọn mỗi lần dialog mở lại (setState khi render — tránh effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) setSelectedId("");
  }

  const handleConfirm = () => {
    const invoice = invoices.find((o) => o.id === selectedId);
    if (invoice) onPick(invoice);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <Wallet className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Tạo phiếu thu</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Chọn hoá đơn cần thu tiền (chỉ hiện hoá đơn đã xuất và chưa thu đủ).
          </DialogDescription>
        </DialogHeader>

        {invoices.length === 0 ? (
          <p className="py-2 text-[13px] text-muted-foreground">
            Không có hoá đơn nào đang chờ thu tiền.
          </p>
        ) : (
          <Select value={selectedId} onValueChange={setSelectedId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Chọn hoá đơn" />
            </SelectTrigger>
            <SelectContent>
              {invoices.map((o) => (
                <SelectItem key={o.id} value={o.id}>
                  {o.code}
                  {o.patient?.fullName ? ` · ${o.patient.fullName}` : ""} —{" "}
                  {fmt(orderTotal(o))} · {ORDER_STATUS_META[o.status].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter className="sm:justify-start">
          <Button type="button" disabled={!selectedId} onClick={handleConfirm}>
            Tiếp tục
          </Button>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
