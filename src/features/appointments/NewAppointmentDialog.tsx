import { useState } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Patient } from "@/features/patients/types";
import type { Service } from "@/features/services/types";
import { durationOptions, timeSlotOptions, type WeekDay } from "./constants";

export type NewAppointmentInput = {
  day: number;
  start: string;
  duration: number;
  patient: string;
  service: string;
};

type NewAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  services: Service[];
  /** Các ngày (T2–T7) của tuần đang hiển thị — lịch hẹn mới thuộc tuần này. */
  weekDays: WeekDay[];
  presetDay?: number;
  presetStart?: string;
  onCreate: (input: NewAppointmentInput) => void;
};

export function NewAppointmentDialog({
  open,
  onOpenChange,
  patients,
  services,
  weekDays,
  presetDay,
  presetStart,
  onCreate,
}: NewAppointmentDialogProps) {
  const [patientQuery, setPatientQuery] = useState("");
  const [patientName, setPatientName] = useState("");
  const [serviceId, setServiceId] = useState("");
  const [day, setDay] = useState(0);
  const [start, setStart] = useState(timeSlotOptions[0]);
  const [duration, setDuration] = useState(30);

  // Đặt lại form mỗi khi dialog chuyển từ đóng sang mở (thay vì dùng effect).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setPatientQuery("");
      setPatientName(patients[0]?.fullName ?? "");
      setServiceId(services[0]?.id ?? "");
      setDay(presetDay ?? 0);
      setStart(presetStart ?? timeSlotOptions[0]);
      setDuration(services[0] ? services[0].durationMinutes : 30);
    }
  }

  const q = patientQuery.trim().toLowerCase();
  const filteredPatients = q
    ? patients.filter(
        (p) => p.fullName.toLowerCase().includes(q) || (p.phone ?? "").includes(q)
      )
    : patients;

  const handleSelectService = (id: string) => {
    setServiceId(id);
    const svc = services.find((s) => s.id === id);
    if (svc) setDuration(svc.durationMinutes);
  };

  const selectedService = services.find((s) => s.id === serviceId);
  const canSave = patientName.trim() !== "" && !!selectedService;

  const handleSave = () => {
    if (!canSave || !selectedService) return;
    onCreate({ day, start, duration, patient: patientName, service: selectedService.name });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt hẹn mới</DialogTitle>
          <DialogDescription>Chọn bệnh nhân, dịch vụ và giờ hẹn.</DialogDescription>
        </DialogHeader>

        <FieldGroup>
          <Field>
            <FieldLabel htmlFor="appt-patient-query">Bệnh nhân</FieldLabel>
            <Input
              id="appt-patient-query"
              placeholder="Tìm theo tên hoặc số điện thoại…"
              value={patientQuery}
              onChange={(e) => setPatientQuery(e.target.value)}
            />
            <div className="mt-2 flex max-h-[132px] flex-wrap gap-1.5 overflow-y-auto">
              {filteredPatients.length === 0 && (
                <span className="px-0.5 py-1 text-[12.5px] text-muted-foreground">
                  Không có bệnh nhân khớp "{patientQuery}".
                </span>
              )}
              {filteredPatients.slice(0, 24).map((p) => {
                const active = p.fullName === patientName;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPatientName(p.fullName)}
                    className="cursor-pointer rounded-full border px-3 py-1.5 text-[12.5px] font-medium whitespace-nowrap transition-[filter] hover:brightness-95"
                    style={
                      active
                        ? { background: "#0f7a73", color: "#ffffff", borderColor: "#0f7a73" }
                        : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                    }
                  >
                    {p.fullName}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field>
            <FieldLabel htmlFor="appt-service">Dịch vụ</FieldLabel>
            <Select value={serviceId} onValueChange={handleSelectService}>
              <SelectTrigger id="appt-service" className="w-full">
                <SelectValue placeholder="Chọn dịch vụ" />
              </SelectTrigger>
              <SelectContent>
                {services.map((s) => (
                  <SelectItem key={s.id} value={s.id}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <div className="grid grid-cols-3 gap-3">
            <Field>
              <FieldLabel htmlFor="appt-day">Ngày</FieldLabel>
              <Select value={String(day)} onValueChange={(v) => setDay(Number(v))}>
                <SelectTrigger id="appt-day" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {weekDays.map((d, idx) => (
                    <SelectItem key={d.key} value={String(idx)}>
                      {d.name} {d.date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="appt-start">Giờ bắt đầu</FieldLabel>
              <Select value={start} onValueChange={setStart}>
                <SelectTrigger id="appt-start" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="max-h-64">
                  {timeSlotOptions.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field>
              <FieldLabel htmlFor="appt-duration">Thời lượng</FieldLabel>
              <Select value={String(duration)} onValueChange={(v) => setDuration(Number(v))}>
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
        </FieldGroup>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            Lưu lịch hẹn
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
