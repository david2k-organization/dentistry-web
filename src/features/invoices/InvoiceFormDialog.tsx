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
import { Textarea } from "@/components/ui/textarea";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import type { Service } from "@/features/services/types";
import type { User } from "@/features/users/types";
import type { Order } from "./types";

const vnd = new Intl.NumberFormat("vi-VN");
const fmt = (n: number) => `${vnd.format(n)} đ`;

export type InvoiceFormLine = {
  serviceId: string;
  name: string;
  qty: number;
  price: number;
  note?: string;
};

export type InvoiceFormResult = {
  mode: "new" | "edit";
  patientId: string;
  patientName: string;
  doctorId: string;
  note: string;
  lines: InvoiceFormLine[];
  markIssued: boolean;
};

const invoiceFormSchema = z.object({
  patientId: z.string().min(1, "Vui lòng chọn bệnh nhân"),
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  note: z.string(),
});

type InvoiceFormValues = z.input<typeof invoiceFormSchema>;

type InvoiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  invoice: Order | null;
  patients: Patient[];
  services: Service[];
  doctors: User[];
  onSave: (result: InvoiceFormResult) => void;
};

export function InvoiceFormDialog({
  open,
  onOpenChange,
  invoice,
  patients,
  services,
  doctors,
  onSave,
}: InvoiceFormDialogProps) {
  const isEditing = !!invoice;
  const [lines, setLines] = useState<InvoiceFormLine[]>([]);
  const [patientOptions, setPatientOptions] = useState<Patient[]>(patients);
  const [patientLoading, setPatientLoading] = useState(false);
  const searchSeq = useRef(0);

  const [patientName, setPatientName] = useState("");

  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    defaultValues: { patientId: "", doctorId: "", note: "" },
  });

  const patientId = form.watch("patientId");
  const doctorId = form.watch("doctorId");

  useEffect(() => {
    if (open) {
      console.log("invoice", invoice);
      setPatientOptions(patients);
      if (invoice) {
        form.reset({
          patientId: invoice.patientId,
          doctorId: invoice.doctorId,
          note: invoice.note ?? "",
        });
        setPatientName(invoice.patient?.fullName ?? "");
        setLines(
          invoice.services.map((s) => ({
            serviceId: s.serviceId,
            name: s.service?.name ?? "Dịch vụ",
            qty: s.quantity,
            price: Number(s.unitPrice) || 0,
            note: s.note ?? undefined,
          })),
        );
      } else {
        form.reset({ patientId: "", doctorId: doctors[0]?.id ?? "", note: "" });
        setPatientName("");
        setLines([]);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

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

  const toggleService = (service: Service) => {
    setLines((prev) => {
      const at = prev.findIndex((l) => l.serviceId === service.id);
      if (at >= 0) return prev.filter((_, i) => i !== at);
      return [
        ...prev,
        {
          serviceId: service.id,
          name: service.name,
          qty: 1,
          price: Number(service.price) || 0,
        },
      ];
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

  const changeNote = (idx: number, note: string) => {
    setLines((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], note };
      return next;
    });
  };

  const submit = (markIssued: boolean) =>
    form.handleSubmit((values) => {
      if (lines.length === 0) return;
      onSave({
        mode: invoice ? "edit" : "new",
        patientId: values.patientId,
        patientName:
          patientOptions.find((p) => p.id === values.patientId)?.fullName ??
          patientName,
        doctorId: values.doctorId,
        note: values.note,
        lines,
        markIssued,
      });
      onOpenChange(false);
    });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? `Sửa hoá đơn ${invoice.code}` : "Tạo hoá đơn mới"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Chỉ hoá đơn chờ thu mới sửa được."
              : "Mã hoá đơn sẽ được tạo tự động khi lưu."}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
          <div>
            <div className="text-[11.5px] text-muted-foreground">Bệnh nhân</div>
            <div className="mt-1.5">
              <SearchableSelect
                options={patientOptions}
                value={patientId || null}
                onChange={(v) => form.setValue("patientId", v)}
                getOptionValue={(p) => p.id}
                getOptionLabel={(p) => p.fullName}
                placeholder="Chọn bệnh nhân"
                searchPlaceholder="Tìm theo tên bệnh nhân"
                emptyMessage="Không tìm thấy bệnh nhân."
                onSearchChange={handlePatientSearch}
                loading={patientLoading}
                selectedLabel={patientName || undefined}
              />
            </div>
            {form.formState.errors.patientId && (
              <p className="mt-1 text-[11px] text-[#a4553a]">
                {form.formState.errors.patientId.message}
              </p>
            )}
          </div>

          <div>
            <div className="text-[11.5px] text-muted-foreground">Bác sĩ</div>
            <div className="mt-1.5">
              <SearchableSelect
                options={doctors}
                value={doctorId || null}
                onChange={(v) => form.setValue("doctorId", v)}
                getOptionValue={(d) => d.id}
                getOptionLabel={(d) => d.fullName}
                placeholder="Chọn bác sĩ"
                searchPlaceholder="Tìm theo tên bác sĩ"
                emptyMessage="Không tìm thấy bác sĩ."
              />
            </div>
            {form.formState.errors.doctorId && (
              <p className="mt-1 text-[11px] text-[#a4553a]">
                {form.formState.errors.doctorId.message}
              </p>
            )}
          </div>
        </div>

        <div className="mt-2">
          <div className="flex items-center gap-2.5">
            <div className="text-[13.5px] font-semibold text-foreground">
              Dòng dịch vụ
            </div>
            <div className="text-xs text-muted-foreground">
              {lines.length} dòng
            </div>
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
                key={`${l.serviceId}-${idx}`}
                className="border-t border-[#f2f7f6] px-3.5 py-2.5"
              >
                <div className="grid grid-cols-[2.4fr_0.9fr_1fr_1fr_40px] items-center gap-2.5 text-[13px]">
                  <div className="min-w-0 truncate font-medium text-foreground">
                    {l.name}
                  </div>
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
                <input
                  value={l.note ?? ""}
                  onChange={(e) => changeNote(idx, e.target.value)}
                  placeholder="Ghi chú dòng (tùy chọn)"
                  className="mt-2 h-8 w-full rounded-lg border border-[#eef4f3] bg-transparent px-2.5 text-[12.5px] outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                />
              </div>
            ))}
            <div className="flex justify-between border-t border-[#eef4f3] bg-[#f7fbfa] px-3.5 py-3 text-[13.5px]">
              <span className="font-medium">Tổng cộng</span>
              <span className="font-semibold tabular-nums">{fmt(total)}</span>
            </div>
          </div>
        </div>

        <div className="mt-2">
          <div className="text-[11.5px] text-muted-foreground">
            Thêm dịch vụ từ danh mục
          </div>
          <div className="mt-1.5">
            <SearchableSelect
              multiple
              options={services}
              value={null}
              selectedValues={lines.map((l) => l.serviceId)}
              onChange={(v) => {
                const sv = services.find((s) => s.id === v);
                if (sv) toggleService(sv);
              }}
              getOptionValue={(sv) => sv.id}
              getOptionLabel={(sv) => sv.name}
              placeholder="Chọn dịch vụ"
              searchPlaceholder="Tìm dịch vụ"
              emptyMessage="Không tìm thấy dịch vụ."
            />
          </div>
        </div>

        <div className="mt-2">
          <div className="text-[11.5px] text-muted-foreground">
            Ghi chú đơn hàng
          </div>
          <Textarea
            className="mt-1.5 min-h-[60px]"
            placeholder="Ghi chú cho hoá đơn (không bắt buộc)"
            {...form.register("note")}
          />
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
              Lưu và xuất ngay
            </Button>
          )}
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground"
          >
            Huỷ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
