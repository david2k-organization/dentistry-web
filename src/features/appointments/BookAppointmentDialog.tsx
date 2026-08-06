import { useEffect, useRef, useState } from "react";
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
  const [doctorId, setDoctorId] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [selectedServiceName, setSelectedServiceName] = useState("");
  const [serviceLoading, setServiceLoading] = useState(false);
  const [when, setWhen] = useState<Date | undefined>(undefined);
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const serviceSeq = useRef(0);

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở.
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setWhen(undefined);
      setNotes("");
      setSubmitting(false);
    }
  }

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
        setDoctorId(doctorPage.data[0]?.id ?? "");
        setServiceId(servicePage.data[0]?.id ?? "");
        setSelectedServiceName(servicePage.data[0]?.name ?? "");
        setDuration(servicePage.data[0]?.durationMinutes ?? 30);
      })
      .catch(() => {
        if (!cancelled) toast.error("Không thể tải dữ liệu đặt hẹn.");
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const handleSelectService = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) {
      setDuration(svc.durationMinutes);
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
    doctorId !== "" && serviceId !== "" && when != null && !submitting;

  const handleSave = async () => {
    if (!canSave || !when) return;
    setSubmitting(true);
    try {
      const created = await createAppointment({
        patientId: patient.id,
        doctorId,
        serviceId,
        appointmentAt: when.toISOString(),
        duration,
        notes: notes.trim() || undefined,
      });
      toast.success(
        `Đã đặt hẹn cho ${patient.fullName} lúc ${format(when, "HH:mm dd/MM/yyyy")}`,
      );
      onCreated?.(created);
      onOpenChange(false);
    } catch (err) {
      const message =
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể đặt lịch hẹn.")
          : "Không thể đặt lịch hẹn.";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt hẹn</DialogTitle>
          <DialogDescription>
            Tạo lịch hẹn mới cho bệnh nhân này.
          </DialogDescription>
        </DialogHeader>

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
            <Select value={doctorId} onValueChange={setDoctorId}>
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
                onChange={setWhen}
                placeholder="Chọn ngày giờ hẹn"
                minuteStep={15}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="appt-duration">Thời lượng</FieldLabel>
              <Select
                value={String(duration)}
                onValueChange={(v) => setDuration(Number(v))}
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
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </Field>
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {submitting ? "Đang lưu…" : "Lưu lịch hẹn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
