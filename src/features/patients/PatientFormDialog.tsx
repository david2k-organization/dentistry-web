import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { createPatient, updatePatient } from "./api";
import {
  dateOnlyStringToDate,
  dateOnlyToIsoWithOffset,
  dateToDateOnlyString,
  isoToDateInputValue,
} from "./format";
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
  /** Khi có giá trị: dialog chạy ở chế độ sửa bệnh nhân này thay vì tạo mới. */
  patient?: Patient | null;
  onSaved: (patient: Patient) => void;
};

const emptyValues: PatientFormValues = {
  fullName: "",
  phone: "",
  email: "",
  dateOfBirth: "",
  gender: undefined,
  notes: "",
};

function valuesFromPatient(patient: Patient): PatientFormValues {
  return {
    fullName: patient.fullName,
    phone: patient.phone ?? "",
    email: patient.email ?? "",
    dateOfBirth: isoToDateInputValue(patient.dateOfBirth),
    gender: patient.gender ?? undefined,
    notes: patient.notes ?? "",
  };
}

export function PatientFormDialog({
  open,
  onOpenChange,
  patient,
  onSaved,
}: PatientFormDialogProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [dobOpen, setDobOpen] = useState(false);
  const isEditing = !!patient;

  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: emptyValues,
  });

  useEffect(() => {
    if (open) {
      form.reset(patient ? valuesFromPatient(patient) : emptyValues);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, patient]);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
  };

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    const payload = {
      fullName: values.fullName,
      phone: values.phone,
      email: values.email,
      gender: values.gender,
      notes: values.notes,
      dateOfBirth: values.dateOfBirth
        ? dateOnlyToIsoWithOffset(values.dateOfBirth)
        : undefined,
    };
    try {
      if (patient) {
        await updatePatient(patient.id, payload);
        onSaved({
          ...patient,
          fullName: payload.fullName,
          phone: payload.phone ?? null,
          email: payload.email ?? null,
          gender: payload.gender ?? null,
          notes: payload.notes ?? null,
          dateOfBirth: payload.dateOfBirth ?? null,
        });
      } else {
        const created = await createPatient(payload);
        onSaved(created);
      }
      handleOpenChange(false);
    } catch (error) {
      const fallback = isEditing ? "Không thể cập nhật bệnh nhân." : "Không thể tạo bệnh nhân.";
      if (error instanceof AxiosError) {
        setSubmitError(error.response?.data?.message ?? fallback);
      } else {
        setSubmitError(fallback);
      }
    }
  });

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa thông tin bệnh nhân" : "Thêm bệnh nhân"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật thông tin bệnh nhân."
              : "Nhập thông tin bệnh nhân mới."}
          </DialogDescription>
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
              <Popover open={dobOpen} onOpenChange={setDobOpen}>
                <PopoverTrigger asChild>
                  <Button
                    id="dateOfBirth"
                    type="button"
                    variant="outline"
                    aria-invalid={!!form.formState.errors.dateOfBirth}
                    className="w-full justify-start font-normal"
                  >
                    <CalendarIcon className="text-muted-foreground" />
                    {form.watch("dateOfBirth") ? (
                      format(dateOnlyStringToDate(form.watch("dateOfBirth")!), "dd/MM/yyyy", {
                        locale: vi,
                      })
                    ) : (
                      <span className="text-muted-foreground">Chọn ngày sinh</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    locale={vi}
                    captionLayout="dropdown"
                    selected={
                      form.watch("dateOfBirth")
                        ? dateOnlyStringToDate(form.watch("dateOfBirth")!)
                        : undefined
                    }
                    onSelect={(date) => {
                      form.setValue("dateOfBirth", date ? dateToDateOnlyString(date) : "");
                      setDobOpen(false);
                    }}
                  />
                </PopoverContent>
              </Popover>
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
