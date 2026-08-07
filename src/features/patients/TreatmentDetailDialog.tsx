import { Boxes } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SUPPLY_UNIT_LABELS } from "@/features/inventory/format";
import type { Supply } from "@/features/inventory/types";
import {
  treatmentImageUrls,
  type TreatmentRecord,
} from "@/features/treatment-records/types";
import { format } from "date-fns";

const vnd = new Intl.NumberFormat("vi-VN");
const dong = (amount: number) => `${vnd.format(amount)}đ`;

type TreatmentDetailDialogProps = {
  record: TreatmentRecord | null;
  onOpenChange: (open: boolean) => void;
  patientName: string;
  patientCode: string;
  serviceName: string;
  doctorName: string;
  price: number;
  supplyMap: Record<string, Supply>;
};

export function TreatmentDetailDialog({
  record,
  onOpenChange,
  patientName,
  patientCode,
  serviceName,
  doctorName,
  price,
  supplyMap,
}: TreatmentDetailDialogProps) {
  // Danh sách đã trả kèm images + treatmentSupplies nên dùng trực tiếp record.
  const shown = record;
  const images = shown ? treatmentImageUrls(shown) : [];
  const supplies = shown?.treatmentSupplies ?? [];

  return (
    <Dialog open={!!record} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        {shown && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2.5">
                <span className="text-[17px] font-semibold text-foreground">
                  {serviceName}
                </span>
              </DialogTitle>
              <div className="text-[12.5px] text-muted-foreground">
                {format(new Date(shown.createdAt), "dd/MM/yyyy HH:mm")} · {patientName} ·{" "}
                {patientCode} · {doctorName}
              </div>
            </DialogHeader>

            <div className="flex flex-col gap-3.5">
              <div>
                <div className="text-[12.5px] text-muted-foreground">
                  Diễn biến &amp; dặn dò
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed whitespace-pre-wrap text-foreground">
                  {shown.notes?.trim() || "—"}
                </p>
              </div>

              {images.length > 0 && (
                <div>
                  <div className="text-[12.5px] text-muted-foreground">
                    Ảnh đính kèm
                  </div>
                  <div className="mt-1.5">
                    <ImageUpload value={images} onChange={() => {}} disabled />
                  </div>
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
                    {supplies.length} loại
                  </div>
                </div>
                {supplies.length === 0 && (
                  <div className="border-t border-[#f2f7f6] px-3.5 py-3 text-[12.5px] text-muted-foreground">
                    Không xuất vật tư nào.
                  </div>
                )}
                {supplies.map((s, idx) => {
                  const supply = supplyMap[s.suppliesId];
                  const name = supply?.name ?? s.note ?? s.suppliesId;
                  const unit = SUPPLY_UNIT_LABELS[s.unit] ?? "";
                  return (
                    <div
                      key={s.id ?? idx}
                      className="flex items-center gap-3 border-t border-[#f2f7f6] px-3.5 py-2.5"
                    >
                      <div className="min-w-0 flex-1 leading-tight">
                        <div className="text-[13px] font-medium text-foreground">
                          {name}
                        </div>
                        {supply?.code && (
                          <div className="text-[11.5px] tabular-nums text-muted-foreground">
                            {supply.code}
                          </div>
                        )}
                      </div>
                      <div className="shrink-0 text-[13px] font-medium tabular-nums text-[#a4553a]">
                        −{s.quantity} {unit}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <DialogFooter className="items-end sm:justify-between">
              <div className="leading-tight">
                <div className="text-[12px] text-muted-foreground">
                  Chi phí dịch vụ
                </div>
                <div className="mt-0.5 text-xl font-semibold tabular-nums text-foreground">
                  {dong(price)}
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
