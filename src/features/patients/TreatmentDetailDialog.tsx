import { Boxes, CalendarClock } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PatientHistoryEntry } from "./mock";

const vnd = new Intl.NumberFormat("vi-VN");
const dong = (amount: number) => `${vnd.format(amount)}đ`;

type TreatmentDetailDialogProps = {
  entry: PatientHistoryEntry | null;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientCode: string;
};

export function TreatmentDetailDialog({
  entry,
  onOpenChange,
  patientName,
  patientCode,
}: TreatmentDetailDialogProps) {
  return (
    <Dialog open={!!entry} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {entry && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2.5">
                <span className="text-[17px] font-semibold text-foreground">
                  {entry.name}
                </span>
                <span className="rounded-md bg-[#e7f1f0] px-2 py-0.5 text-[11px] font-medium text-[#0a5c57]">
                  {entry.region}
                </span>
                <span
                  className="rounded-full px-2.5 py-0.5 text-[11px] font-medium"
                  style={{
                    background: entry.status === "Hoàn tất" ? "#eef6f1" : "#fdf3e8",
                    color: entry.status === "Hoàn tất" ? "#3f7a55" : "#9a6524",
                  }}
                >
                  {entry.status}
                </span>
              </DialogTitle>
              <div className="text-[12.5px] text-muted-foreground">
                {entry.date} · {patientName} · {patientCode} · {entry.doctor}
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3.5">
              <div>
                <div className="text-[12.5px] text-muted-foreground">
                  Diễn biến &amp; dặn dò
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-foreground">
                  {entry.note}
                </p>
              </div>

              {entry.followUp && (
                <div className="flex items-center gap-2.5 rounded-xl border border-[#eef4f3] bg-[#f8fbfb] px-3.5 py-3 text-[13px] text-foreground">
                  <CalendarClock className="size-[18px] shrink-0 text-primary" />
                  Hẹn tái khám {entry.followUp}
                </div>
              )}

              <div className="overflow-hidden rounded-xl border border-[#eef4f3]">
                <div className="flex items-center gap-2.5 bg-[#f7fbfa] px-3.5 py-2.5">
                  <Boxes className="size-[18px] shrink-0 text-primary" />
                  <div className="text-[13px] font-semibold text-foreground">
                    Vật tư đã xuất
                  </div>
                  <div className="flex-1" />
                  <div className="text-[12px] text-muted-foreground">
                    {entry.materialsList.length} loại
                  </div>
                </div>
                {entry.materialsList.length === 0 && (
                  <div className="border-t border-[#f2f7f6] px-3.5 py-3 text-[12.5px] text-muted-foreground">
                    Không xuất vật tư nào.
                  </div>
                )}
                {entry.materialsList.map((m, idx) => (
                  <div
                    key={idx}
                    className="flex items-center gap-3 border-t border-[#f2f7f6] px-3.5 py-2.5"
                  >
                    <div className="min-w-0 flex-1 leading-tight">
                      <div className="text-[13px] font-medium text-foreground">
                        {m.name}
                      </div>
                      <div className="text-[11.5px] tabular-nums text-muted-foreground">
                        {m.code}
                      </div>
                    </div>
                    <div className="shrink-0 text-[13px] font-medium tabular-nums text-[#a4553a]">
                      −{m.qty} {m.unit}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DialogFooter className="items-end sm:justify-between">
              <div className="leading-tight">
                <div className="text-[12px] text-muted-foreground">
                  Chi phí điều trị
                </div>
                <div className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {dong(entry.amount)}
                </div>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
