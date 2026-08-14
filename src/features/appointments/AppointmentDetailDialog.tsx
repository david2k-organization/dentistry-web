import { Pencil } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Field = { label: string; value: string };

export type AppointmentAction = {
  label: string;
  onClick: () => void;
  /** Kiểu nút phụ (viền) thay vì nút chính đặc. */
  outline?: boolean;
  /** Tô màu cảnh báo (dùng cho Huỷ hẹn). */
  danger?: boolean;
};

type AppointmentDetailDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  subtitle: string;
  status: { label: string; bg: string; fg: string };
  fields: Field[];
  actions: AppointmentAction[];
  /** Mở form sửa cuộc hẹn; ẩn nút Sửa nếu không truyền. */
  onEdit?: () => void;
  saving?: boolean;
};

export function AppointmentDetailDialog({
  open,
  onOpenChange,
  title,
  subtitle,
  status,
  fields,
  actions,
  onEdit,
  saving = false,
}: AppointmentDetailDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="gap-0 rounded-[18px] p-0 sm:max-w-[560px]">
        <DialogHeader className="flex-row items-start gap-3 border-b border-[#eef4f3] px-6 py-5 pr-14">
          <div className="flex-1">
            <DialogTitle className="text-[17px] font-semibold tracking-tight text-foreground">
              {title}
            </DialogTitle>
            <DialogDescription className="mt-0.5 text-[12.5px]">{subtitle}</DialogDescription>
          </div>
          <span
            className="shrink-0 rounded-full px-2.5 py-1 text-[11.5px] font-medium"
            style={{ background: status.bg, color: status.fg }}
          >
            {status.label}
          </span>
        </DialogHeader>

        <div className="px-6 py-5">
          <div className="grid grid-cols-2 gap-3.5">
            {fields.map((f) => (
              <div
                key={f.label}
                className="rounded-[11px] border border-[#eef4f3] bg-[#f8fbfb] px-3.5 py-3"
              >
                <div className="text-[11.5px] text-muted-foreground">{f.label}</div>
                <div className="mt-1 text-[13.5px] font-medium text-foreground">{f.value}</div>
              </div>
            ))}
          </div>

          {(actions.length > 0 || onEdit) && (
            <div className="mt-5 flex items-center gap-2.5">
              {actions.map((action) => (
                <Button
                  key={action.label}
                  variant={action.outline || action.danger ? "outline" : "default"}
                  disabled={saving}
                  onClick={action.onClick}
                  className={
                    action.danger
                      ? "border-[#e6cdbf] text-[#a4553a] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                      : undefined
                  }
                >
                  {action.label}
                </Button>
              ))}
              {onEdit && (
                <Button
                  variant="outline"
                  disabled={saving}
                  onClick={onEdit}
                  className="ml-auto gap-1.5"
                >
                  <Pencil className="size-4" />
                  Sửa
                </Button>
              )}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
