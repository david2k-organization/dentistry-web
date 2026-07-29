import { useState } from "react";
import { Package } from "lucide-react";

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
import type { InventoryItem } from "./types";

const UNITS = ["hộp", "tuýp", "vỉ", "ống", "gói", "cái"];

export type NewItemResult = Omit<InventoryItem, "log">;

type NewItemDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  nextSku: string;
  onSave: (result: NewItemResult) => void;
};

export function NewItemDialog({ open, onOpenChange, nextSku, onSave }: NewItemDialogProps) {
  const [name, setName] = useState("");
  const [qty, setQty] = useState("0");
  const [min, setMin] = useState("10");
  const [supplier, setSupplier] = useState("");
  const [unit, setUnit] = useState(UNITS[0]);

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở (thay vì dùng effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName("");
      setQty("0");
      setMin("10");
      setSupplier("");
      setUnit(UNITS[0]);
    }
  }

  const canSave = name.trim() !== "";

  const handleSave = () => {
    if (!canSave) return;
    onSave({
      sku: nextSku,
      name: name.trim(),
      qty: Math.max(0, Number(qty) || 0),
      min: Math.max(0, Number(min) || 0),
      unit,
      supplier: supplier.trim() || "Chưa rõ",
      updated: "29/07",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Thêm vật tư mới</DialogTitle>
          <DialogDescription>Mã tự sinh: {nextSku}</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field data-invalid={name.trim() === ""}>
            <FieldLabel htmlFor="item-name">Tên vật tư</FieldLabel>
            <Input
              id="item-name"
              placeholder="VD: Composite Filtek Z350 A3"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field>
              <FieldLabel htmlFor="item-qty">Tồn đầu kỳ</FieldLabel>
              <Input
                id="item-qty"
                inputMode="numeric"
                value={qty}
                onChange={(e) => setQty(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="item-min">Định mức tối thiểu</FieldLabel>
              <Input
                id="item-min"
                inputMode="numeric"
                value={min}
                onChange={(e) => setMin(e.target.value.replace(/\D/g, ""))}
              />
            </Field>
          </div>

          <Field>
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
              {UNITS.map((u) => {
                const active = unit === u;
                return (
                  <button
                    key={u}
                    type="button"
                    onClick={() => setUnit(u)}
                    className="cursor-pointer rounded-full border px-3.5 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                    style={
                      active
                        ? { background: "#0f7a73", color: "#ffffff", borderColor: "#0f7a73" }
                        : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                    }
                  >
                    {u}
                  </button>
                );
              })}
            </div>
          </Field>
        </FieldGroup>

        <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#eef4f3] bg-[#f8fbfb] p-3.5">
          <Package className="size-5 shrink-0 text-primary" />
          <div className="text-[12.5px] leading-relaxed text-[#4a6664]">
            {(name.trim() || "Vật tư chưa đặt tên")} — tồn đầu {Number(qty) || 0} {unit}, cảnh báo khi dưới{" "}
            {Number(min) || 0} {unit}.
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Lưu vật tư
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
