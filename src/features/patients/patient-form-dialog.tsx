import { useState } from "react";
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
import { createPatient } from "./api";
import { dateOnlyToIsoWithOffset } from "./format";
import type { Patient } from "./types";

const emptyToUndefined = (value: string | undefined) =>
  !value || value.trim() === "" ? undefined : value;

const patientFormSchema = z.object({
  fullName: z.string().trim().min(1, "Vui lòng nhập họ và tên").max(255),
  phone: z
    .string()
    .trim()
    .max(20, "Tối đa 20 ký tự")
    .optional()
    .transform(emptyToUndefined),
  email: z
    .string()
    .trim()
    .max(255)
    .optional()
    .transform(emptyToUndefined)
    .pipe(z.string().email("Email không hợp lệ").optional()),
  dateOfBirth: z.string().optional().transform(emptyToUndefined),
  gender: z.enum(["MALE", "FEMALE", "OTHER"]).optional(),
  notes: z
    .string()
    .trim()
    .max(2000, "Tối đa 2000 ký tự")
    .optional()
    .transform(emptyToUndefined),
});

type PatientFormValues = z.input<typeof patientFormSchema>;

type PatientFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (patient: Patient) => void;
};

export function PatientFormDialog({ open, onOpenChange, onCreated }: PatientFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      fullName: "",
      phone: "",
      email: "",
      dateOfBirth: "",
      gender: undefined,
      notes: "",
    },
  });

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      form.reset();
      setSubmitError(null);
    }
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    try {
      const patient = await createPatient({
        fullName: values.fullName,
        phone: values.phone,
        email: values.email,
        gender: values.gender,
        notes: values.notes,
        dateOfBirth: values.dateOfBirth
          ? dateOnlyToIsoWithOffset(values.dateOfBirth)
          : undefined,
      });
      onCreated(patient);
      handleOpenChange(false);
    } catch (error) {
      if (error instanceof AxiosError) {
        setSubmitError(error.response?.data?.message ?? "Không thể tạo bệnh nhân.");
      } else {
        setSubmitError("Không thể tạo bệnh nhân.");
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Thêm bệnh nhân</DialogTitle>
          <DialogDescription>Nhập thông tin bệnh nhân mới.</DialogDescription>
        </DialogHeader>

        <form id="patient-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field data-invalid={!!form.formState.errors.fullName}>
              <FieldLabel htmlFor="fullName">Họ và tên</FieldLabel>
              <Input
                id="fullName"
                aria-invalid={!!form.formState.errors.fullName}
                {...form.register("fullName")}
              />
              <FieldError errors={[form.formState.errors.fullName]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.phone}>
              <FieldLabel htmlFor="phone">Số điện thoại</FieldLabel>
              <Input
                id="phone"
                aria-invalid={!!form.formState.errors.phone}
                {...form.register("phone")}
              />
              <FieldError errors={[form.formState.errors.phone]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.email}>
              <FieldLabel htmlFor="email">Email</FieldLabel>
              <Input
                id="email"
                type="email"
                aria-invalid={!!form.formState.errors.email}
                {...form.register("email")}
              />
              <FieldError errors={[form.formState.errors.email]} />
            </Field>

            <Field data-invalid={!!form.formState.errors.dateOfBirth}>
              <FieldLabel htmlFor="dateOfBirth">Ngày sinh</FieldLabel>
              <Input
                id="dateOfBirth"
                type="date"
                aria-invalid={!!form.formState.errors.dateOfBirth}
                {...form.register("dateOfBirth")}
              />
              <FieldError errors={[form.formState.errors.dateOfBirth]} />
            </Field>

            <Field>
              <FieldLabel htmlFor="gender">Giới tính</FieldLabel>
              <Select
                value={form.watch("gender") ?? ""}
                onValueChange={(value) =>
                  form.setValue("gender", value as PatientFormValues["gender"])
                }
              >
                <SelectTrigger id="gender" className="w-full">
                  <SelectValue placeholder="Chọn giới tính" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MALE">Nam</SelectItem>
                  <SelectItem value="FEMALE">Nữ</SelectItem>
                  <SelectItem value="OTHER">Khác</SelectItem>
                </SelectContent>
              </Select>
            </Field>

            <Field data-invalid={!!form.formState.errors.notes}>
              <FieldLabel htmlFor="notes">Ghi chú</FieldLabel>
              <Textarea id="notes" rows={3} {...form.register("notes")} />
              <FieldError errors={[form.formState.errors.notes]} />
            </Field>
          </FieldGroup>

          {submitError && (
            <p role="alert" className="mt-3 text-sm text-destructive">
              {submitError}
            </p>
          )}
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)}>
            Hủy
          </Button>
          <Button type="submit" form="patient-form" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
