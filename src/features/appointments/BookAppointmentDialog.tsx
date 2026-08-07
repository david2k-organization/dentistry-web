import { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/DateTimePicker";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { getUsers } from "@/features/users/api";
import type { User } from "@/features/users/types";
import type { Patient } from "@/features/patients/types";
import { createAppointment } from "./api";
import { durationOptions } from "./constants";
import type { Appointment } from "./types";

const bookAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  when: z.date().optional(),
  duration: z.number(),
  notes: z.string(),
});

type BookAppointmentFormValues = z.input<typeof bookAppointmentSchema>;

const emptyValues: BookAppointmentFormValues = {
  doctorId: "",
  serviceId: "",
  when: undefined,
  duration: 30,
  notes: "",
};

type BookAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patient: Patient;
  patientCode?: string;
  onCreated?: (appointment: Appointment) => void;
};

export function BookAppointmentDialog({
  open,
  onOpenChange,
  patient,
  patientCode,
  onCreated,
}: BookAppointmentDialogProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<User[]>([]);
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);
  const serviceSeq = useRef(0);

  const form = useForm<BookAppointmentFormValues>({
    resolver: zodResolver(bookAppointmentSchema),
    defaultValues: emptyValues,
  });

  const doctorId = form.watch("doctorId");
  const serviceId = form.watch("serviceId");
  const when = form.watch("when");
  const duration = form.watch("duration");

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở.
  useEffect(() => {
    if (open) {
      form.reset(emptyValues);
      setSelectedServiceName("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Nạp bác sĩ + dịch vụ khi mở dialog và đặt lựa chọn mặc định.
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    Promise.all([
      getServices({ pageSize: 100 }),
      getUsers({ roleName: "Bác sĩ", pageSize: 100 }),
    ])
      .then(([servicePage, doctorPage]) => {
        if (cancelled) return;
        setServices(servicePage.data);
        setDoctors(doctorPage.data);
        form.setValue("doctorId", doctorPage.data[0]?.id ?? "");
        form.setValue("serviceId", servicePage.data[0]?.id ?? "");
        setSelectedServiceName(servicePage.data[0]?.name ?? "");
        form.setValue("duration", servicePage.data[0]?.durationMinutes ?? 30);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải dữ liệu đặt hẹn.");
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSelectService = (id: string) => {
    form.setValue("serviceId", id);
    const svc = services.find((s) => s.id === id);
    if (svc) {
      form.setValue("duration", svc.durationMinutes);
      setSelectedServiceName(svc.name);
    }
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

  const canSave =
    doctorId !== "" && serviceId !== "" && when != null && !form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    if (!values.when) return;
    try {
      const created = await createAppointment({
        patientId: patient.id,
        doctorId: values.doctorId,
        serviceId: values.serviceId,
        appointmentAt: values.when.toISOString(),
        duration: values.duration,
        notes: values.notes.trim() || undefined,
      });
      toast.success(
        `Đã đặt hẹn cho ${patient.fullName} lúc ${format(values.when, "HH:mm dd/MM/yyyy")}`,
      );
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể đặt lịch hẹn.")
          : "Không thể đặt lịch hẹn.";
      toast.error(message);
    }
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt hẹn</DialogTitle>
          <DialogDescription>
            Tạo lịch hẹn mới cho bệnh nhân này.
          </DialogDescription>
        </DialogHeader>

        <form id="book-appointment-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Bệnh nhân</FieldLabel>
              <div className="flex h-9 items-center rounded-lg border border-input bg-muted/40 px-3 text-sm text-foreground">
                <span className="truncate">
                  {patient.fullName}
                  {patientCode ? ` · ${patientCode}` : ""}
                </span>
              </div>
            </Field>

            <Field>
              <FieldLabel htmlFor="appt-doctor">Bác sĩ</FieldLabel>
              <Select value={doctorId} onValueChange={(v) => form.setValue("doctorId", v)}>
                <SelectTrigger id="appt-doctor" className="w-full">
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
            </Field>

            <Field>
              <FieldLabel>Dịch vụ</FieldLabel>
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
            </Field>

            <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Field>
                <FieldLabel>Thời gian hẹn</FieldLabel>
                <DateTimePicker
                  value={when}
                  onChange={(d) => form.setValue("when", d)}
                  placeholder="Chọn ngày giờ hẹn"
                  minuteStep={15}
                />
              </Field>

              <Field>
                <FieldLabel htmlFor="appt-duration">Thời lượng</FieldLabel>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => form.setValue("duration", Number(v))}
                >
                  <SelectTrigger id="appt-duration" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {durationOptions.map((d) => (
                      <SelectItem key={d} value={String(d)}>
                        {d} phút
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            </div>

            <Field>
              <FieldLabel htmlFor="appt-notes">Ghi chú</FieldLabel>
              <Textarea
                id="appt-notes"
                placeholder="Ghi chú thêm (tùy chọn)…"
                {...form.register("notes")}
              />
            </Field>
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" form="book-appointment-form" disabled={!canSave}>
            {form.formState.isSubmitting ? "Đang lưu…" : "Lưu lịch hẹn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
