import { useEffect, useRef, useState, type ReactNode } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Boxes, ChevronDown, Plus, X } from "lucide-react";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import { ImageUpload } from "@/components/ui/ImageUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getSupplies } from "@/features/inventory/api";
import { SUPPLY_UNIT_LABELS } from "@/features/inventory/format";
import type { Supply } from "@/features/inventory/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";
import { createTreatmentRecord } from "@/features/treatment-records/api";
import type { TreatmentSupplyInput } from "@/features/treatment-records/types";
import type { Patient } from "./types";

type MaterialLine = { key: number; suppliesId: string; qty: number };

const treatmentFormSchema = z.object({
  doctorId: z.string().min(1, "Vui lòng chọn bác sĩ"),
  serviceId: z.string().min(1, "Vui lòng chọn dịch vụ"),
  notes: z.string().trim().max(500, "Tối đa 500 ký tự").optional(),
  followUp: z.date().optional(),
  images: z.array(z.string()),
});

type TreatmentFormValues = z.input<typeof treatmentFormSchema>;

const emptyValues: TreatmentFormValues = {
  doctorId: "",
  serviceId: "",
  notes: "",
  followUp: undefined,
  images: [],
};

type TreatmentRecordDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  patientCode: string;
  onSaved: () => void;
};

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
  const [supplies, setSupplies] = useState<Supply[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [lines, setLines] = useState<MaterialLine[]>([]);
  const serviceSeq = useRef(0);
  // Bộ đếm khóa dòng vật tư — chỉ tăng trong handler (không đụng lúc render).
  const nextKey = useRef(1);

  const form = useForm<TreatmentFormValues>({
    resolver: zodResolver(treatmentFormSchema),
    defaultValues: emptyValues,
  });

  // Đặt lại form + danh sách vật tư mỗi khi dialog mở.
  useEffect(() => {
    if (open) {
      form.reset(emptyValues);
      setSelectedServiceName("");
      setLines([{ key: 0, suppliesId: "", qty: 1 }]);
      nextKey.current = 1;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nạp bác sĩ, dịch vụ và vật tư trong kho khi mở dialog.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      getUsers({ roleName: "Bác sĩ", pageSize: 100 }),
      getServices({ pageSize: 100 }),
      getSupplies({ pageSize: 100 }),
    ])
      .then(([doctorPage, servicePage, supplyPage]) => {
        if (cancelled) return;
        setDoctors(doctorPage.data);
        setServices(servicePage.data);
        setSupplies(supplyPage.data);
        form.setValue("doctorId", doctorPage.data[0]?.id ?? "");
        form.setValue("serviceId", servicePage.data[0]?.id ?? "");
        setSelectedServiceName(servicePage.data[0]?.name ?? "");
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải dữ liệu ghi hồ sơ.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const supplyOf = (id: string) => supplies.find((s) => s.id === id);

  const doctorId = form.watch("doctorId");
  const serviceId = form.watch("serviceId");
  const followUp = form.watch("followUp");
  const images = form.watch("images");

  const handleSelectService = (id: string) => {
    form.setValue("serviceId", id);
    const svc = services.find((s) => s.id === id);
    if (svc) setSelectedServiceName(svc.name);
  };

  // Tìm dịch vụ theo tên qua API; bỏ qua phản hồi cũ khi gõ nhanh.
  const handleServiceSearch = (query: string) => {
    const seq = ++serviceSeq.current;
    setServiceLoading(true);
    getServices({ searchKey: query.trim(), pageSize: 20 })
      .then((res) => {
        if (seq === serviceSeq.current) setServices(res.data);
      })
      .catch(() => {
        if (seq === serviceSeq.current) setServices([]);
      })
      .finally(() => {
        if (seq === serviceSeq.current) setServiceLoading(false);
      });
  };

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

  const onSubmit = form.handleSubmit(async (values) => {
    if (insufficient) return;

    // API không có field "hẹn tái khám" → gộp vào notes để vẫn lưu được.
    let notes = values.notes?.trim() ?? "";
    if (values.followUp) {
      const line = `Hẹn tái khám: ${format(values.followUp, "dd/MM/yyyy HH:mm")}`;
      notes = notes ? `${notes}\n${line}` : line;
    }
    notes = notes.slice(0, 500);

    const treatmentSupplies: TreatmentSupplyInput[] = exportLines.map((l) => {
      const s = supplyOf(l.suppliesId)!;
      return { suppliesId: l.suppliesId, quantity: l.qty, unit: s.unit, note: s.name };
    });

    try {
      await createTreatmentRecord({
        patientId: patient.id,
        doctorId: values.doctorId,
        serviceId: values.serviceId,
        notes: notes || undefined,
        images: values.images.length ? values.images : undefined,
        treatmentSupplies: treatmentSupplies.length ? treatmentSupplies : undefined,
      });

      const materialsCount = exportLines.reduce((sum, l) => sum + l.qty, 0);
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
    }
  });

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

        <form
          id="treatment-record-form"
          onSubmit={onSubmit}
          className="flex flex-col gap-3.5"
        >
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
              <Select value={doctorId} onValueChange={(v) => form.setValue("doctorId", v)}>
                <SelectTrigger className="h-9 w-full">
                  <SelectValue placeholder="Chọn bác sĩ" />
                </SelectTrigger>
                <SelectContent>
                  {doctors.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.doctorId && (
                <p className="mt-1 text-[11px] text-[#a4553a]">
                  {form.formState.errors.doctorId.message}
                </p>
              )}
            </Labeled>
          </div>

          <Labeled label="Dịch vụ điều trị">
            <SearchableSelect
              options={services}
              value={serviceId || null}
              onChange={handleSelectService}
              getOptionValue={(s) => s.id}
              getOptionLabel={(s) => s.name}
              placeholder="Chọn dịch vụ"
              searchPlaceholder="Tìm theo tên dịch vụ"
              emptyMessage="Không tìm thấy dịch vụ."
              onSearchChange={handleServiceSearch}
              loading={serviceLoading}
              selectedLabel={selectedServiceName || undefined}
            />
            {form.formState.errors.serviceId && (
              <p className="mt-1 text-[11px] text-[#a4553a]">
                {form.formState.errors.serviceId.message}
              </p>
            )}
          </Labeled>

          <Labeled label="Diễn biến & dặn dò">
            <Textarea
              rows={3}
              placeholder="Chẩn đoán, thao tác đã làm, dặn dò sau điều trị"
              aria-invalid={!!form.formState.errors.notes}
              {...form.register("notes")}
            />
            {form.formState.errors.notes && (
              <p className="mt-1 text-[11px] text-[#a4553a]">
                {form.formState.errors.notes.message}
              </p>
            )}
          </Labeled>

          <Labeled label="Hẹn tái khám (tuỳ chọn)">
            <DateTimePicker
              value={followUp}
              onChange={(d) => form.setValue("followUp", d)}
              placeholder="Chọn ngày giờ tái khám"
              className="max-w-xs"
            />
          </Labeled>

          <Labeled label="Ảnh đính kèm (tối đa 10 ảnh)">
            <ImageUpload
              value={images}
              onChange={(imgs) => form.setValue("images", imgs)}
              max={10}
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
        </form>

        <DialogFooter className="items-center gap-2.5 sm:justify-between">
          <div className="text-[12px] text-muted-foreground">{footerHint}</div>
          <div className="flex gap-2.5">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Huỷ
            </Button>
            <Button
              type="submit"
              form="treatment-record-form"
              disabled={insufficient || form.formState.isSubmitting}
            >
              {form.formState.isSubmitting ? "Đang lưu..." : "Lưu hồ sơ & xuất vật tư"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
