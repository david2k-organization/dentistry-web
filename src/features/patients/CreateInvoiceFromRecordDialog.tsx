import { Receipt } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const vnd = new Intl.NumberFormat("vi-VN");
const dong = (amount: number) => `${vnd.format(amount)}đ`;

type CreateInvoiceFromRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  serviceName: string;
  doctorName: string;
  patientName: string;
  amount: number;
  creating?: boolean;
  onConfirm: () => void;
};

/** Popup xác nhận tạo hóa đơn từ một ca điều trị. */
export function CreateInvoiceFromRecordDialog({
  open,
  onOpenChange,
  serviceName,
  doctorName,
  patientName,
  amount,
  creating,
  onConfirm,
}: CreateInvoiceFromRecordDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <div className="grid size-[42px] place-items-center rounded-xl bg-accent text-primary">
          <Receipt className="size-5" />
        </div>
        <DialogHeader className="items-start text-left">
          <DialogTitle>Tạo hóa đơn từ ca điều trị?</DialogTitle>
          <DialogDescription className="text-[13px] leading-relaxed text-[#5c7a78]">
            Hóa đơn cho{" "}
            <span className="font-medium text-foreground">{serviceName}</span> —{" "}
            {doctorName} · {patientName}. Tổng tiền{" "}
            <span className="font-medium text-foreground">{dong(amount)}</span>.
          </DialogDescription>
        </DialogHeader>

        <DialogFooter className="sm:justify-start">
          <Button disabled={creating} onClick={onConfirm} className="gap-1.5">
            <Receipt className="size-4" />
            {creating ? "Đang tạo..." : "Tạo hóa đơn"}
          </Button>
          <Button
            variant="outline"
            disabled={creating}
            onClick={() => onOpenChange(false)}
          >
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
