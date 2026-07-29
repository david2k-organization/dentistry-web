import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { ServiceCategory } from "@/features/service-categories/types";
import { createService, updateService } from "./api";
import { toothStateLabels, unitLabels } from "./format";
import type { Service, ServiceUnit, ToothState } from "./types";

const UNIT_VALUES = ["TOOTH", "SESSION", "CASE", "ARCH", "JAW", "UNIT"] as const;
const TOOTH_STATE_VALUES: ToothState[] = [
  "NORMAL",
  "DECAY",
  "FILLED",
  "CROWN",
  "ROOT_CANAL",
  "EXTRACTED",
  "IMPLANT",
  "MISSING",
  "VENEER",
];

const emptyToUndefined = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value;

const isNonNegNumber = (v: string) =>
  v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0);
const isPosInt = (v: string) =>
  v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) > 0);
const isNonNegInt = (v: string) =>
  v.trim() === "" || (Number.isInteger(Number(v)) && Number(v) >= 0);

const serviceFormSchema = z.object({
  code: z.string().trim().min(1, "Vui lòng nhập mã dịch vụ").max(100),
  name: z.string().trim().min(1, "Vui lòng nhập tên dịch vụ").max(255),
  categoryId: z.string().min(1, "Vui lòng chọn nhóm dịch vụ"),
  description: z
    .string()
    .trim()
    .max(2000, "Tối đa 2000 ký tự")
    .optional()
    .transform(emptyToUndefined),
  price: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập giá")
    .refine((v) => !Number.isNaN(Number(v)) && Number(v) >= 0, "Giá phải là số ≥ 0"),
  priceMax: z.string().trim().refine(isNonNegNumber, "Giá phải là số ≥ 0"),
  unit: z.enum(UNIT_VALUES),
  durationMinutes: z
    .string()
    .trim()
    .refine(isPosInt, "Thời lượng phải là số nguyên > 0"),
  requiresTooth: z.enum(["true", "false"]),
  toothStateAfter: z.string(),
  color: z.string().trim().optional().transform(emptyToUndefined),
  displayOrder: z.string().trim().refine(isNonNegInt, "Thứ tự phải là số nguyên ≥ 0"),
  commissionRate: z
    .string()
    .trim()
    .refine(
      (v) => v.trim() === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0 && Number(v) <= 100),
      "Hoa hồng trong khoảng 0–100"
    ),
  isActive: z.enum(["true", "false"]),
});

type ServiceFormValues = z.input<typeof serviceFormSchema>;

type ServiceFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Khi có giá trị: dialog chạy ở chế độ sửa dịch vụ này thay vì tạo mới. */
  service?: Service | null;
  categories: ServiceCategory[];
  onSaved: (service: Service) => void;
};

const emptyValues: ServiceFormValues = {
  code: "",
  name: "",
  categoryId: "",
  description: "",
  price: "",
  priceMax: "",
  unit: "SESSION",
  durationMinutes: "30",
  requiresTooth: "false",
  toothStateAfter: "",
  color: "",
  displayOrder: "0",
  commissionRate: "",
  isActive: "true",
};

function valuesFromService(service: Service): ServiceFormValues {
  return {
    code: service.code,
    name: service.name,
    categoryId: service.categoryId,
    description: service.description ?? "",
    price: service.price ?? "",
    priceMax: service.priceMax ?? "",
    unit: service.unit,
    durationMinutes: String(service.durationMinutes),
    requiresTooth: service.requiresTooth ? "true" : "false",
    toothStateAfter: service.toothStateAfter ?? "",
    color: service.color ?? "",
    displayOrder: String(service.displayOrder),
    commissionRate: service.commissionRate ?? "",
    isActive: service.isActive ? "true" : "false",
  };
}

export function ServiceFormDialog({
  open,
  onOpenChange,
  service,
  categories,
  onSaved,
}: ServiceFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = !!service;

  const form = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(service ? valuesFromService(service) : emptyValues);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, service]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      code: values.code,
      name: values.name,
      categoryId: values.categoryId,
      description: values.description,
      price: Number(values.price),
      priceMax: values.priceMax ? Number(values.priceMax) : undefined,
      unit: values.unit as ServiceUnit,
      durationMinutes: values.durationMinutes ? Number(values.durationMinutes) : undefined,
      requiresTooth: values.requiresTooth === "true",
      toothStateAfter: values.toothStateAfter
        ? (values.toothStateAfter as ToothState)
        : undefined,
      color: values.color,
      displayOrder: values.displayOrder ? Number(values.displayOrder) : undefined,
      commissionRate: values.commissionRate ? Number(values.commissionRate) : undefined,
      isActive: values.isActive === "true",
    };
    try {
      if (service) {
        const updated = await updateService(service.id, payload);
        onSaved(updated);
      } else {
        const created = await createService(payload);
        onSaved(created);
      }
      onOpenChange(false);
    } catch (error) {
      const fallback = isEditing ? "Không thể cập nhật dịch vụ." : "Không thể tạo dịch vụ.";
      if (error instanceof AxiosError) {
        setSubmitError(error.response?.data?.message ?? fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa dịch vụ" : "Thêm dịch vụ"}</DialogTitle>
          <DialogDescription>
            {isEditing ? "Cập nhật thông tin dịch vụ." : "Nhập thông tin dịch vụ mới."}
          </DialogDescription>
        </DialogHeader>

        <form id="service-form" onSubmit={onSubmit}>
          <FieldGroup>
            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.code}>
                <FieldLabel htmlFor="code">Mã dịch vụ</FieldLabel>
                <Input
                  id="code"
                  placeholder="VD: NT001"
                  aria-invalid={!!form.formState.errors.code}
                  {...form.register("code")}
                />
                <FieldError errors={[form.formState.errors.code]} />
              </Field>

              <Field>
                <FieldLabel htmlFor="categoryId">Nhóm dịch vụ</FieldLabel>
                <Select
                  value={form.watch("categoryId")}
                  onValueChange={(value) =>
                    form.setValue("categoryId", value, { shouldValidate: true })
                  }
                >
                  <SelectTrigger id="categoryId" className="w-full">
                    <SelectValue placeholder="Chọn nhóm" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FieldError errors={[form.formState.errors.categoryId]} />
              </Field>
            </div>

            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="name">Tên dịch vụ</FieldLabel>
              <Input
                id="name"
                placeholder="VD: Trám răng thẩm mỹ Composite"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.description}>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Textarea id="description" rows={2} {...form.register("description")} />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field data-invalid={!!form.formState.errors.price}>
                <FieldLabel htmlFor="price">Giá (VND)</FieldLabel>
                <Input
                  id="price"
                  type="number"
                  min={0}
                  aria-invalid={!!form.formState.errors.price}
                  {...form.register("price")}
                />
                <FieldError errors={[form.formState.errors.price]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.priceMax}>
                <FieldLabel htmlFor="priceMax">Giá tối đa (tùy chọn)</FieldLabel>
                <Input
                  id="priceMax"
                  type="number"
                  min={0}
                  aria-invalid={!!form.formState.errors.priceMax}
                  {...form.register("priceMax")}
                />
                <FieldError errors={[form.formState.errors.priceMax]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="unit">Đơn vị tính</FieldLabel>
                <Select
                  value={form.watch("unit")}
                  onValueChange={(value) =>
                    form.setValue("unit", value as ServiceFormValues["unit"])
                  }
                >
                  <SelectTrigger id="unit" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNIT_VALUES.map((u) => (
                      <SelectItem key={u} value={u}>
                        {unitLabels[u]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field data-invalid={!!form.formState.errors.durationMinutes}>
                <FieldLabel htmlFor="durationMinutes">Thời lượng (phút)</FieldLabel>
                <Input
                  id="durationMinutes"
                  type="number"
                  min={1}
                  aria-invalid={!!form.formState.errors.durationMinutes}
                  {...form.register("durationMinutes")}
                />
                <FieldError errors={[form.formState.errors.durationMinutes]} />
              </Field>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="requiresTooth">Cần chọn răng</FieldLabel>
                <Select
                  value={form.watch("requiresTooth")}
                  onValueChange={(value) =>
                    form.setValue("requiresTooth", value as ServiceFormValues["requiresTooth"])
                  }
                >
                  <SelectTrigger id="requiresTooth" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="false">Không</SelectItem>
                    <SelectItem value="true">Có</SelectItem>
                  </SelectContent>
                </Select>
              </Field>

              <Field>
                <FieldLabel htmlFor="toothStateAfter">Trạng thái răng sau khi làm</FieldLabel>
                <Select
                  value={form.watch("toothStateAfter") || "none"}
                  onValueChange={(value) =>
                    form.setValue("toothStateAfter", value === "none" ? "" : value)
                  }
                >
                  <SelectTrigger id="toothStateAfter" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— Không đổi —</SelectItem>
                    {TOOTH_STATE_VALUES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {toothStateLabels[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field>
                <FieldLabel htmlFor="color">Màu</FieldLabel>
                <Input id="color" type="color" className="h-9 p-1" {...form.register("color")} />
              </Field>

              <Field data-invalid={!!form.formState.errors.displayOrder}>
                <FieldLabel htmlFor="displayOrder">Thứ tự</FieldLabel>
                <Input
                  id="displayOrder"
                  type="number"
                  min={0}
                  aria-invalid={!!form.formState.errors.displayOrder}
                  {...form.register("displayOrder")}
                />
                <FieldError errors={[form.formState.errors.displayOrder]} />
              </Field>

              <Field data-invalid={!!form.formState.errors.commissionRate}>
                <FieldLabel htmlFor="commissionRate">Hoa hồng (%)</FieldLabel>
                <Input
                  id="commissionRate"
                  type="number"
                  min={0}
                  max={100}
                  aria-invalid={!!form.formState.errors.commissionRate}
                  {...form.register("commissionRate")}
                />
                <FieldError errors={[form.formState.errors.commissionRate]} />
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="isActive">Trạng thái</FieldLabel>
              <Select
                value={form.watch("isActive")}
                onValueChange={(value) =>
                  form.setValue("isActive", value as ServiceFormValues["isActive"])
                }
              >
                <SelectTrigger id="isActive" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Đã ẩn</SelectItem>
                </SelectContent>
              </Select>
            </Field>
          </FieldGroup>

          {submitError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {submitError}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" form="service-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
