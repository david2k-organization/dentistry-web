import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package } from "lucide-react";
import { AxiosError } from "axios";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { createSupply } from "./api";
import { SUPPLY_UNITS } from "./format";
import type { Supply, SupplyUnit } from "./types";

const unitValues = SUPPLY_UNITS.map((u) => u.value) as [SupplyUnit, ...SupplyUnit[]];

const newItemSchema = z.object({
  code: z.string().trim().min(1, "Vui lòng nhập mã vật tư"),
  name: z.string().trim().min(1, "Vui lòng nhập tên vật tư"),
  quantity: z.string(),
  quota: z.string(),
  supplier: z.string().trim().min(1, "Vui lòng nhập nhà cung cấp"),
  note: z.string(),
  unit: z.enum(unitValues),
});

type NewItemFormValues = z.input<typeof newItemSchema>;

type NewItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  suggestedCode: string;
  onSaved: (supply: Supply) => void;
};

export function NewItemDialog({
  open,
  onOpenChange,
  suggestedCode,
  onSaved,
}: NewItemDialogProps) {
  const form = useForm<NewItemFormValues>({
    resolver: zodResolver(newItemSchema),
    defaultValues: {
      code: suggestedCode,
      name: "",
      quantity: "0",
      quota: "10",
      supplier: "",
      note: "",
      unit: SUPPLY_UNITS[0].value,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        code: suggestedCode,
        name: "",
        quantity: "0",
        quota: "10",
        supplier: "",
        note: "",
        unit: SUPPLY_UNITS[0].value,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, suggestedCode]);

  const errors = form.formState.errors;
  const name = form.watch("name");
  const quantity = form.watch("quantity");
  const quota = form.watch("quota");
  const unit = form.watch("unit");
  const unitLabel = SUPPLY_UNITS.find((u) => u.value === unit)?.label ?? "";

  const onSubmit = form.handleSubmit(async (values) => {
    try {
      const supply = await createSupply({
        code: values.code.trim(),
        name: values.name.trim(),
        quantity: Math.max(0, Number(values.quantity) || 0),
        quota: Math.max(0, Number(values.quota) || 0),
        unit: values.unit,
        supplier: values.supplier.trim(),
        note: values.note.trim() || undefined,
      });
      toast.success(`Đã thêm "${supply.name}" vào kho`);
      onSaved(supply);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể thêm vật tư.")
          : "Không thể thêm vật tư.";
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm vật tư mới</DialogTitle>
          <DialogDescription>
            Tồn đầu kỳ &gt; 0 sẽ tự sinh một phiếu nhập kho tương ứng.
          </DialogDescription>
        </DialogHeader>

        <form id="new-item-form" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-[1fr_2fr] gap-3">
              <Field data-invalid={!!errors.code}>
                <FieldLabel htmlFor="item-code">Mã vật tư</FieldLabel>
                <Input
                  id="item-code"
                  placeholder="VD: VT001"
                  aria-invalid={!!errors.code}
                  {...form.register("code")}
                />
              </Field>
              <Field data-invalid={!!errors.name}>
                <FieldLabel htmlFor="item-name">Tên vật tư</FieldLabel>
                <Input
                  id="item-name"
                  placeholder="VD: Composite Filtek Z350 A3"
                  aria-invalid={!!errors.name}
                  {...form.register("name")}
                />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="item-qty">Tồn đầu kỳ</FieldLabel>
                <Input
                  id="item-qty"
                  inputMode="numeric"
                  value={quantity}
                  onChange={(e) =>
                    form.setValue("quantity", e.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
              <Field>
                <FieldLabel htmlFor="item-quota">Định mức tối thiểu</FieldLabel>
                <Input
                  id="item-quota"
                  inputMode="numeric"
                  value={quota}
                  onChange={(e) =>
                    form.setValue("quota", e.target.value.replace(/\D/g, ""))
                  }
                />
              </Field>
            </div>

            <Field data-invalid={!!errors.supplier}>
              <FieldLabel htmlFor="item-supplier">Nhà cung cấp</FieldLabel>
              <Input
                id="item-supplier"
                placeholder="VD: 3M Việt Nam"
                aria-invalid={!!errors.supplier}
                {...form.register("supplier")}
              />
            </Field>

            <Field>
              <FieldLabel>Đơn vị tính</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {SUPPLY_UNITS.map((u) => {
                  const active = unit === u.value;
                  return (
                    <button
                      key={u.value}
                      type="button"
                      onClick={() => form.setValue("unit", u.value)}
                      className="cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                      style={
                        active
                          ? { background: "#0f7a73", color: "#ffffff", borderColor: "#0f7a73" }
                          : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                      }
                    >
                      {u.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="item-note">Ghi chú</FieldLabel>
              <Input
                id="item-note"
                placeholder="VD: Size M, HSD 06/2027"
                {...form.register("note")}
              />
            </Field>
          </FieldGroup>
        </form>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#eef4f3] bg-[#f8fbfb] p-3.5">
          <Package className="size-5 shrink-0 text-primary" />
          <div className="text-[12.5px] leading-relaxed text-[#4a6664]">
            {(name.trim() || "Vật tư chưa đặt tên")} — tồn đầu {Number(quantity) || 0}{" "}
            {unitLabel}, cảnh báo khi dưới {Number(quota) || 0} {unitLabel}.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" form="new-item-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu vật tư"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
