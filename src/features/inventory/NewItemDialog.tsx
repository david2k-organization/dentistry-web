import { useState } from "react";
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
  const [code, setCode] = useState(suggestedCode);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [quota, setQuota] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [note, setNote] = useState("");
  const [unit, setUnit] = useState<SupplyUnit>(SUPPLY_UNITS[0].value);
  const [submitting, setSubmitting] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setCode(suggestedCode);
      setName("");
      setQuantity("0");
      setQuota("10");
      setSupplier("");
      setNote("");
      setUnit(SUPPLY_UNITS[0].value);
    }
  }

  const unitLabel = SUPPLY_UNITS.find((u) => u.value === unit)?.label ?? "";
  const canSave =
    code.trim() !== "" && name.trim() !== "" && supplier.trim() !== "";

  const handleSave = async () => {
    if (!canSave || submitting) return;
    setSubmitting(true);
    try {
      const supply = await createSupply({
        code: code.trim(),
        name: name.trim(),
        quantity: Math.max(0, Number(quantity) || 0),
        quota: Math.max(0, Number(quota) || 0),
        unit,
        supplier: supplier.trim(),
        note: note.trim() || undefined,
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
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm vật tư mới</DialogTitle>
          <DialogDescription>
            Tồn đầu kỳ &gt; 0 sẽ tự sinh một phiếu nhập kho tương ứng.
          </DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <div className="grid grid-cols-[1fr_2fr] gap-3">
            <Field data-invalid={code.trim() === ""}>
              <FieldLabel htmlFor="item-code">Mã vật tư</FieldLabel>
              <Input
                id="item-code"
                placeholder="VD: VT001"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Field>
            <Field data-invalid={name.trim() === ""}>
              <FieldLabel htmlFor="item-name">Tên vật tư</FieldLabel>
              <Input
                id="item-name"
                placeholder="VD: Composite Filtek Z350 A3"
                value={name}
                onChange={(e) => setName(e.target.value)}
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
                onChange={(e) => setQuantity(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-quota">Định mức tối thiểu</FieldLabel>
              <Input
                id="item-quota"
                inputMode="numeric"
                value={quota}
                onChange={(e) => setQuota(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          <Field data-invalid={supplier.trim() === ""}>
            <FieldLabel htmlFor="item-supplier">Nhà cung cấp</FieldLabel>
            <Input
              id="item-supplier"
              placeholder="VD: 3M Việt Nam"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
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
                    onClick={() => setUnit(u.value)}
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
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </Field>
        </FieldGroup>

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
          <Button onClick={handleSave} disabled={!canSave || submitting}>
            {submitting ? "Đang lưu..." : "Lưu vật tư"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
