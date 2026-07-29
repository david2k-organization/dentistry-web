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
import { createServiceCategory, updateServiceCategory } from "./api";
import type { ServiceCategory } from "./types";

const emptyToUndefined = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value;

const serviceCategoryFormSchema = z.object({
  code: z.string().trim().min(1, "Vui lòng nhập mã danh mục").max(100),
  name: z.string().trim().min(1, "Vui lòng nhập tên danh mục").max(255),
  description: z
    .string()
    .trim()
    .max(2000, "Tối đa 2000 ký tự")
    .optional()
    .transform(emptyToUndefined),
  displayOrder: z.coerce
    .number()
    .int("Thứ tự phải là số nguyên")
    .min(0, "Thứ tự không được âm"),
  isActive: z.enum(["true", "false"]),
});

type ServiceCategoryFormValues = z.input<typeof serviceCategoryFormSchema>;

type ServiceCategoryFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Khi có giá trị: dialog chạy ở chế độ sửa danh mục này thay vì tạo mới. */
  category?: ServiceCategory | null;
  onSaved: (category: ServiceCategory) => void;
};

const emptyValues: ServiceCategoryFormValues = {
  code: "",
  name: "",
  description: "",
  displayOrder: 0,
  isActive: "true",
};

function valuesFromCategory(category: ServiceCategory): ServiceCategoryFormValues {
  return {
    code: category.code,
    name: category.name,
    description: category.description ?? "",
    displayOrder: category.displayOrder,
    isActive: category.isActive ? "true" : "false",
  };
}

export function ServiceCategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSaved,
}: ServiceCategoryFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const isEditing = !!category;

  const form = useForm<ServiceCategoryFormValues>({
    resolver: zodResolver(serviceCategoryFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(category ? valuesFromCategory(category) : emptyValues);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, category]);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      code: values.code,
      name: values.name,
      description: values.description,
      displayOrder: Number(values.displayOrder),
      isActive: values.isActive === "true",
    };
    try {
      if (category) {
        const updated = await updateServiceCategory(category.id, payload);
        onSaved(updated);
      } else {
        const created = await createServiceCategory(payload);
        onSaved(created);
      }
      onOpenChange(false);
    } catch (error) {
      const fallback = isEditing
        ? "Không thể cập nhật danh mục dịch vụ."
        : "Không thể tạo danh mục dịch vụ.";
      if (error instanceof AxiosError) {
        setSubmitError(error.response?.data?.message ?? fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Sửa danh mục dịch vụ" : "Thêm danh mục dịch vụ"}
          </DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin danh mục dịch vụ."
              : "Nhập thông tin danh mục dịch vụ mới."}
          </DialogDescription>
        </DialogHeader>

        <form id="service-category-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.code}>
              <FieldLabel htmlFor="code">Mã danh mục</FieldLabel>
              <Input
                id="code"
                placeholder="VD: ortho, implant"
                aria-invalid={!!form.formState.errors.code}
                {...form.register("code")}
              />
              <FieldError errors={[form.formState.errors.code]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.name}>
              <FieldLabel htmlFor="name">Tên danh mục</FieldLabel>
              <Input
                id="name"
                placeholder="VD: Chỉnh nha"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              <FieldError errors={[form.formState.errors.name]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.description}>
              <FieldLabel htmlFor="description">Mô tả</FieldLabel>
              <Textarea id="description" rows={3} {...form.register("description")} />
              <FieldError errors={[form.formState.errors.description]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.displayOrder}>
              <FieldLabel htmlFor="displayOrder">Thứ tự hiển thị</FieldLabel>
              <Input
                id="displayOrder"
                type="number"
                min={0}
                aria-invalid={!!form.formState.errors.displayOrder}
                {...form.register("displayOrder")}
              />
              <FieldError errors={[form.formState.errors.displayOrder]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="isActive">Trạng thái</FieldLabel>
              <Select
                value={form.watch("isActive")}
                onValueChange={(value) =>
                  form.setValue("isActive", value as ServiceCategoryFormValues["isActive"])
                }
              >
                <SelectTrigger id="isActive" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">Đang hoạt động</SelectItem>
                  <SelectItem value="false">Đã vô hiệu hóa</SelectItem>
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
          <Button
            type="submit"
            form="service-category-form"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
