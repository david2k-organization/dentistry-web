import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Minus, Plus, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import type { Service } from "@/features/services/types";
import type { Invoice, InvoiceLine } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const fmt = (n: number) => `${vnd.format(n)} đ`;

export type InvoiceFormResult = {
  mode: "new" | "edit";
  code: string;
  patient: string;
  lines: InvoiceLine[];
  markPaid: boolean;
};

const invoiceFormSchema = z.object({
  patient: z.string().min(1),
});

type InvoiceFormValues = z.input<typeof invoiceFormSchema>;

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Hóa đơn đang sửa, hoặc null khi tạo mới. */
  invoice: Invoice | null;
  nextCode: string;
  patients: Patient[];
  services: Service[];
  onSave: (result: InvoiceFormResult) => void;
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  nextCode,
  patients,
  services,
  onSave,
}: InvoiceFormDialogProps) {
  const isEditing = !!invoice;
  const [lines, setLines] = useState<InvoiceLine[]>([]);

  // Danh sách bệnh nhân cho ô chọn — khởi tạo từ prop, thay bằng kết quả tìm
  // kiếm phía server khi người dùng gõ.
  const [patientOptions, setPatientOptions] = useState<Patient[]>(patients);
  const [patientLoading, setPatientLoading] = useState(false);
  const searchSeq = useRef(0);

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: { patient: "" },
  });

  const patient = form.watch("patient");

  useEffect(() => {
    if (open) {
      setPatientOptions(patients);
      if (invoice) {
        form.reset({ patient: invoice.patient });
        setLines(invoice.lines.map((l) => ({ ...l })));
      } else {
        form.reset({ patient: patients[0]?.fullName ?? "" });
        setLines([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Tìm bệnh nhân theo tên qua API; bỏ qua phản hồi cũ khi gõ nhanh.
  const handlePatientSearch = useCallback((query: string) => {
    const seq = ++searchSeq.current;
    setPatientLoading(true);
    getPatients({ searchKey: query.trim(), pageSize: 20 })
      .then((res) => {
        if (seq === searchSeq.current) setPatientOptions(res.data);
      })
      .catch(() => {
        if (seq === searchSeq.current) setPatientOptions([]);
      })
      .finally(() => {
        if (seq === searchSeq.current) setPatientLoading(false);
      });
  }, []);

  const total = lines.reduce((sum, l) => sum + l.qty * l.price, 0);
  const code = invoice ? invoice.code : nextCode;

  const addService = (service: Service) => {
    setLines((prev) => {
      const at = prev.findIndex((l) => l.name === service.name);
      if (at >= 0) {
        const next = [...prev];
        next[at] = { ...next[at], qty: next[at].qty + 1 };
        return next;
      }
      return [...prev, { name: service.name, qty: 1, price: Number(service.price) }];
    });
  };

  const changeQty = (idx: number, delta: number) => {
    setLines((prev) => {
      const q = prev[idx].qty + delta;
      if (q < 1) return prev.filter((_, i) => i !== idx);
      const next = [...prev];
      next[idx] = { ...next[idx], qty: q };
      return next;
    });
  };

  const removeLine = (idx: number) => {
    setLines((prev) => prev.filter((_, i) => i !== idx));
  };

  const submit = (markPaid: boolean) =>
    form.handleSubmit((values) => {
      if (lines.length === 0) return;
      onSave({ mode: invoice ? "edit" : "new", code, patient: values.patient, lines, markPaid });
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? `Sửa hoá đơn ${code}` : "Tạo hoá đơn mới"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Chỉ hoá đơn chờ thu mới sửa được." : `Số hoá đơn ${code}.`}
          </DialogDescription>
        </DialogHeader>

        <div>
          <div className="text-[11.5px] text-muted-foreground">Bệnh nhân</div>
          <div className="mt-1.5">
            <SearchableSelect
              options={patientOptions}
              value={patient || null}
              onChange={(v) => form.setValue("patient", v)}
              getOptionValue={(p) => p.fullName}
              getOptionLabel={(p) => p.fullName}
              placeholder="Chọn bệnh nhân"
              searchPlaceholder="Tìm theo tên bệnh nhân"
              emptyMessage="Không tìm thấy bệnh nhân."
              onSearchChange={handlePatientSearch}
              loading={patientLoading}
              selectedLabel={patient || undefined}
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2.5">
            <div className="text-[13.5px] font-semibold text-foreground">Dòng dịch vụ</div>
            <div className="text-xs text-muted-foreground">{lines.length} dòng</div>
          </div>
          <div className="mt-2.5 overflow-hidden rounded-xl border border-[#eef4f3]">
            <div className="grid grid-cols-[2.4fr_0.9fr_1fr_1fr_40px] gap-2.5 bg-[#f7fbfa] px-3.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
              <div>Dịch vụ</div>
              <div>Đơn giá</div>
              <div className="text-center">Số lượng</div>
              <div className="text-right">Thành tiền</div>
              <div />
            </div>
            {lines.length === 0 && (
              <div className="border-t border-[#f2f7f6] px-3.5 py-4 text-[12.5px] text-muted-foreground">
                Chưa có dòng nào — chọn dịch vụ bên dưới.
              </div>
            )}
            {lines.map((l, idx) => (
              <div
                key={`${l.name}-${idx}`}
                className="grid grid-cols-[2.4fr_0.9fr_1fr_1fr_40px] items-center gap-2.5 border-t border-[#f2f7f6] px-3.5 py-2.5 text-[13px]"
              >
                <div className="min-w-0 truncate font-medium text-foreground">{l.name}</div>
                <div className="text-[12.5px] tabular-nums text-muted-foreground">
                  {fmt(l.price)}
                </div>
                <div className="flex justify-center">
                  <div className="flex items-center overflow-hidden rounded-lg border border-border">
                    <button
                      type="button"
                      onClick={() => changeQty(idx, -1)}
                      className="grid size-6 cursor-pointer place-items-center border-r border-[#eaf1f0] bg-card text-[#4a6664] hover:bg-[#f4f9f8]"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <div className="w-8 text-center text-[12.5px] font-semibold tabular-nums">
                      {l.qty}
                    </div>
                    <button
                      type="button"
                      onClick={() => changeQty(idx, 1)}
                      className="grid size-6 cursor-pointer place-items-center border-l border-[#eaf1f0] bg-card text-primary hover:bg-accent"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
                <div className="text-right font-semibold tabular-nums text-foreground">
                  {fmt(l.qty * l.price)}
                </div>
                <div className="flex justify-end">
                  <button
                    type="button"
                    title="Bỏ dòng"
                    onClick={() => removeLine(idx)}
                    className="grid size-7 cursor-pointer place-items-center rounded-lg border border-border bg-card text-muted-foreground hover:border-[#e6cdbf] hover:bg-[#fbeeea] hover:text-[#a4553a]"
                  >
                    <X className="size-4" />
                  </button>
                </div>
              </div>
            ))}
            <div className="flex justify-between border-t border-[#eef4f3] bg-[#f7fbfa] px-3.5 py-3 text-[13.5px]">
              <span className="font-medium">Tổng cộng</span>
              <span className="font-semibold tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-[11.5px] text-muted-foreground">Thêm dịch vụ từ danh mục</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {services.map((sv) => (
              <button
                key={sv.id}
                type="button"
                onClick={() => addService(sv)}
                className="flex cursor-pointer items-center gap-1.5 rounded-full border border-dashed border-[#cfe0df] bg-card px-3 py-1.5 text-xs font-medium text-primary hover:border-solid hover:bg-accent"
              >
                <Plus className="size-3.5" />
                {sv.name}
              </button>
            ))}
          </div>
        </div>

        <DialogFooter className="items-center gap-2.5 sm:justify-start">
          <Button onClick={submit(false)} disabled={lines.length === 0}>
            {isEditing ? "Lưu thay đổi" : "Lưu hoá đơn nháp"}
          </Button>
          {lines.length > 0 && (
            <Button
              variant="outline"
              onClick={submit(true)}
              className="border-[#cfe0df] text-primary hover:bg-accent"
            >
              Lưu và thu ngay
            </Button>
          )}
          <Button variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
