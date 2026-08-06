import { useEffect, useRef, useState, type ReactNode } from "react";
import { Boxes, ChevronDown, Plus, X } from "lucide-react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createWarehouseLog, getSupplies } from "@/features/inventory/api";
import { SUPPLY_UNIT_LABELS } from "@/features/inventory/format";
import type { Supply } from "@/features/inventory/types";
import { addPatientTreatment, DOCTORS, type PatientHistoryEntry } from "./mock";
import type { Patient } from "./types";

type MaterialLine = { key: number; suppliesId: string; qty: number };

type TreatmentRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  patientCode: string;
  onSaved: () => void;
};

function todayLabel(): string {
  const now = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(now.getDate())}/${pad(now.getMonth() + 1)}/${now.getFullYear()}`;
}

function Labeled({
  label,
  className,
  children,
}: {
  label: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <div className="text-[12.5px] text-muted-foreground">{label}</div>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function TreatmentRecordDialog({
  open,
  onOpenChange,
  patient,
  patientCode,
  onSaved,
}: TreatmentRecordDialogProps) {
  const [doctor, setDoctor] = useState(DOCTORS[0]);
  const [content, setContent] = useState("");
  const [tooth, setTooth] = useState("");
  const [cost, setCost] = useState("");
  const [notes, setNotes] = useState("");
  const [followUp, setFollowUp] = useState<Date | undefined>(undefined);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [submitting, setSubmitting] = useState(false);
  // Bộ đếm khóa dòng vật tư — chỉ tăng trong handler (không đụng lúc render).
  const nextKey = useRef(1);

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setDoctor(DOCTORS[0]);
      setContent("");
      setTooth("");
      setCost("");
      setNotes("");
      setFollowUp(undefined);
      setLines([{ key: 0, suppliesId: "", qty: 1 }]);
      setSubmitting(false);
    }
  }

  // Nạp danh sách vật tư trong kho khi mở dialog.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    getSupplies({ pageSize: 100 })
      .then((res) => {
        if (!cancelled) setSupplies(res.data);
      })
      .catch(() => {
        if (!cancelled) setSupplies([]);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const supplyOf = (id: string) => supplies.find((s) => s.id === id);

  const addLine = () =>
    setLines((prev) => [...prev, { key: nextKey.current++, suppliesId: "", qty: 1 }]);
  const removeLine = (key: number) =>
    setLines((prev) => prev.filter((l) => l.key !== key));
  const updateLine = (key: number, patch: Partial<MaterialLine>) =>
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));

  const exportLines = lines.filter((l) => l.suppliesId && l.qty > 0);
  const insufficient = exportLines.some((l) => {
    const s = supplyOf(l.suppliesId);
    return s ? l.qty > s.quantity : false;
  });
  const canSave = content.trim() !== "" && !insufficient && !submitting;

  const handleSave = async () => {
    if (!canSave) return;
    setSubmitting(true);
    try {
      // Xuất kho từng vật tư đã chọn (mỗi phiếu là 1 warehouse log EXPORT).
      await Promise.all(
        exportLines.map((l) =>
          createWarehouseLog({
            suppliesId: l.suppliesId,
            type: "EXPORT",
            quantity: l.qty,
            note: `Xuất cho ca điều trị: ${content.trim()}`,
          }),
        ),
      );

      const materialsCount = exportLines.reduce((sum, l) => sum + l.qty, 0);
      const materialsList = exportLines.map((l) => {
        const s = supplyOf(l.suppliesId)!;
        return {
          name: s.name,
          code: s.code,
          qty: l.qty,
          unit: SUPPLY_UNIT_LABELS[s.unit],
        };
      });
      const entry: PatientHistoryEntry = {
        date: todayLabel(),
        name: content.trim(),
        note: notes.trim() || "—",
        amount: Number(cost) || 0,
        region: tooth.trim() || "Toàn hàm",
        doctor,
        materials: materialsCount,
        status: "Hoàn tất",
        followUp: followUp ? format(followUp, "dd/MM/yyyy HH:mm") : null,
        materialsList,
      };
      addPatientTreatment(patient.id, entry);

      toast.success(
        materialsCount > 0
          ? `Đã lưu hồ sơ và xuất ${exportLines.length} vật tư khỏi kho`
          : "Đã lưu hồ sơ điều trị",
      );
      onSaved();
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể lưu hồ sơ.")
          : "Không thể lưu hồ sơ.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const footerHint =
    exportLines.length > 0
      ? `Khi lưu sẽ ghi hồ sơ vào bệnh án và xuất ${exportLines.length} vật tư khỏi kho.`
      : "Khi lưu sẽ ghi hồ sơ vào bệnh án.";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Ghi hồ sơ điều trị</DialogTitle>
          <DialogDescription>
            Vật tư khai báo ở đây sẽ được xuất khỏi kho ngay khi lưu hồ sơ.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3.5">
          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            <Labeled label="Bệnh nhân">
              <div className="flex h-9 items-center justify-between rounded-lg border border-input bg-muted/40 px-3 text-sm">
                <span className="truncate text-foreground">
                  {patient.fullName} · {patientCode}
                </span>
                <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
              </div>
            </Labeled>

            <Labeled label="Bác sĩ thực hiện">
              <Select value={doctor} onValueChange={setDoctor}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DOCTORS.map((d) => (
                    <SelectItem key={d} value={d}>
                      {d}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Labeled>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-[2fr_1fr_1fr]">
            <Labeled label="Nội dung điều trị">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="VD: Trám composite"
              />
            </Labeled>
            <Labeled label="Răng">
              <Input
                value={tooth}
                onChange={(e) => setTooth(e.target.value)}
                placeholder="R16"
              />
            </Labeled>
            <Labeled label="Chi phí (đ)">
              <Input
                inputMode="numeric"
                value={cost}
                onChange={(e) => setCost(e.target.value.replace(/\D/g, ""))}
                placeholder="400000"
              />
            </Labeled>
          </div>

          <Labeled label="Diễn biến & dặn dò">
            <Textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Chẩn đoán, thao tác đã làm, dặn dò sau điều trị"
            />
          </Labeled>

          <Labeled label="Hẹn tái khám (tuỳ chọn)">
            <DateTimePicker
              value={followUp}
              onChange={setFollowUp}
              placeholder="Chọn ngày giờ tái khám"
              className="max-w-xs"
            />
          </Labeled>

          <div className="rounded-xl border border-[#e6efee] bg-[#f7fbfa] p-3.5">
            <div className="flex items-center gap-2.5">
              <Boxes className="size-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1 leading-tight">
                <div className="text-[13.5px] font-semibold text-foreground">
                  Vật tư sử dụng
                </div>
                <div className="text-[12px] text-muted-foreground">
                  Chọn vật tư và số lượng cấp cho ca điều trị
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={addLine}
              >
                <Plus className="size-4" />
                Thêm vật tư
              </Button>
            </div>

            <div className="mt-3 flex flex-col gap-3">
              {lines.length === 0 && (
                <div className="text-[12.5px] text-muted-foreground">
                  Chưa chọn vật tư nào.
                </div>
              )}
              {lines.map((line) => {
                const supply = supplyOf(line.suppliesId);
                const unit = supply ? SUPPLY_UNIT_LABELS[supply.unit] : "";
                const remaining = supply ? supply.quantity - line.qty : null;
                const over = remaining != null && remaining < 0;
                return (
                  <div key={line.key}>
                    <div className="flex items-center gap-2.5">
                      <Select
                        value={line.suppliesId || undefined}
                        onValueChange={(v) => updateLine(line.key, { suppliesId: v })}
                      >
                        <SelectTrigger className="h-9 min-w-0 flex-1">
                          <SelectValue placeholder="Chọn vật tư trong kho" />
                        </SelectTrigger>
                        <SelectContent>
                          {supplies.length === 0 && (
                            <div className="px-2 py-3 text-center text-[12.5px] text-muted-foreground">
                              Kho chưa có vật tư.
                            </div>
                          )}
                          {supplies.map((s) => (
                            <SelectItem key={s.id} value={s.id}>
                              {s.name} (còn {s.quantity} {SUPPLY_UNIT_LABELS[s.unit]})
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Input
                        inputMode="numeric"
                        aria-label="Số lượng"
                        value={line.qty}
                        onChange={(e) =>
                          updateLine(line.key, {
                            qty: Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0),
                          })
                        }
                        className="h-9 w-[68px] text-center tabular-nums"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        aria-label="Bỏ vật tư"
                        className="size-9 text-[#4a6664] hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                        onClick={() => removeLine(line.key)}
                      >
                        <X className="size-4" />
                      </Button>
                    </div>
                    {supply && (
                      <div
                        className="mt-1 text-[11.5px]"
                        style={{ color: over ? "#a4553a" : "#5c7a78" }}
                      >
                        {over
                          ? `Không đủ tồn — chỉ còn ${supply.quantity} ${unit}`
                          : `Tồn sau khi xuất: ${remaining} ${unit}`}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter className="items-center gap-2.5 sm:justify-between">
          <div className="text-[12px] text-muted-foreground">{footerHint}</div>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button onClick={handleSave} disabled={!canSave}>
              {submitting ? "Đang lưu..." : "Lưu hồ sơ & xuất vật tư"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
