import { useCallback, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { SearchableSelect } from "@/components/ui/SearchableSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import type { Service } from "@/features/services/types";
import type { User } from "@/features/users/types";
import { durationOptions, timeSlotOptions, type WeekDay } from "./constants";

export type NewAppointmentInput = {
  patientId: string;
  doctorId: string;
  serviceId: string;
  day: number;
  start: string;
  duration: number;
  notes?: string;
};

const newAppointmentSchema = z.object({
  patientId: z.string().min(1),
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  day: z.number(),
  start: z.string(),
  duration: z.number(),
  notes: z.string(),
});

type NewAppointmentFormValues = z.input<typeof newAppointmentSchema>;

type NewAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  patients: Patient[];
  services: Service[];
  doctors: User[];
  /** Các ngày (T2–T7) của tuần đang hiển thị — lịch hẹn mới thuộc tuần này. */
  weekDays: WeekDay[];
  presetDay?: number;
  presetStart?: string;
  onCreate: (input: NewAppointmentInput) => void;
  /** Đang gọi API tạo lịch hẹn — khoá nút lưu. */
  saving?: boolean;
};

export function NewAppointmentDialog({
  open,
  onOpenChange,
  patients,
  services,
  doctors,
  weekDays,
  presetDay,
  presetStart,
  onCreate,
  saving = false,
}: NewAppointmentDialogProps) {
  // Danh sách bệnh nhân cho ô chọn — khởi tạo từ prop, thay bằng kết quả tìm
  // kiếm phía server khi người dùng gõ.
  const [patientOptions, setPatientOptions] = useState<Patient[]>(patients);
  const [patientLoading, setPatientLoading] = useState(false);
  const [selectedPatientName, setSelectedPatientName] = useState("");
  const searchSeq = useRef(0);

  const form = useForm<NewAppointmentFormValues>({
    resolver: zodResolver(newAppointmentSchema),
    defaultValues: {
      patientId: "",
      doctorId: "",
      serviceId: "",
      day: 0,
      start: timeSlotOptions[0],
      duration: 30,
      notes: "",
    },
  });

  useEffect(() => {
    if (open) {
      setPatientOptions(patients);
      setSelectedPatientName(patients[0]?.fullName ?? "");
      form.reset({
        patientId: patients[0]?.id ?? "",
        doctorId: doctors[0]?.id ?? "",
        serviceId: services[0]?.id ?? "",
        day: presetDay ?? 0,
        start: presetStart ?? timeSlotOptions[0],
        duration: services[0] ? services[0].durationMinutes : 30,
        notes: "",
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const patientId = form.watch("patientId");
  const doctorId = form.watch("doctorId");
  const serviceId = form.watch("serviceId");
  const day = form.watch("day");
  const start = form.watch("start");
  const duration = form.watch("duration");

  // Tìm bệnh nhân theo tên/SĐT qua API; bỏ qua phản hồi cũ khi gõ nhanh.
  const handlePatientSearch = useCallback((query: string) => {
    const seq = ++searchSeq.current;
    setPatientLoading(true);
    getPatients({ searchKey: query.trim(), pageSize: 20 })
      .then((res) => {
        if (seq === searchSeq.current) setPatientOptions(res.data);
      })
      .catch(() => {
        if (seq === searchSeq.current) setPatientOptions([]);
      })
      .finally(() => {
        if (seq === searchSeq.current) setPatientLoading(false);
      });
  }, []);

  const handleSelectPatient = (id: string) => {
    form.setValue("patientId", id);
    const p = patientOptions.find((x) => x.id === id);
    if (p) setSelectedPatientName(p.fullName);
  };

  const handleSelectService = (id: string) => {
    form.setValue("serviceId", id);
    const svc = services.find((s) => s.id === id);
    if (svc) form.setValue("duration", svc.durationMinutes);
  };

  const canSave =
    patientId !== "" && doctorId !== "" && serviceId !== "" && !saving;

  const onSubmit = form.handleSubmit((values) => {
    if (saving) return;
    onCreate({
      patientId: values.patientId,
      doctorId: values.doctorId,
      serviceId: values.serviceId,
      day: values.day,
      start: values.start,
      duration: values.duration,
      notes: values.notes.trim() || undefined,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Đặt hẹn mới</DialogTitle>
          <DialogDescription>Chọn bệnh nhân, bác sĩ, dịch vụ và giờ hẹn.</DialogDescription>
        </DialogHeader>

        <form id="new-appointment-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel>Bệnh nhân</FieldLabel>
              <SearchableSelect
                options={patientOptions}
                value={patientId || null}
                onChange={handleSelectPatient}
                getOptionValue={(p) => p.id}
                getOptionLabel={(p) => p.fullName}
                placeholder="Chọn bệnh nhân"
                searchPlaceholder="Tìm theo tên bệnh nhân"
                emptyMessage="Không tìm thấy bệnh nhân."
                onSearchChange={handlePatientSearch}
                loading={patientLoading}
                selectedLabel={selectedPatientName || undefined}
              />
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
                <Select value={String(day)} onValueChange={(v) => form.setValue("day", Number(v))}>
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
                <Select value={start} onValueChange={(v) => form.setValue("start", v)}>
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
          <Button type="submit" form="new-appointment-form" disabled={!canSave}>
            {saving ? "Đang lưu…" : "Lưu lịch hẹn"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
