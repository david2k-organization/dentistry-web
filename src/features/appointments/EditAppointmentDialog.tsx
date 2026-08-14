import { useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Service } from "@/features/services/types";
import type { User } from "@/features/users/types";
import { durationOptions, type Appt } from "./constants";

export type EditAppointmentInput = {
  doctorId: string;
  serviceId: string;
  duration: number;
};

const editAppointmentSchema = z.object({
  doctorId: z.string().min(1),
  serviceId: z.string().min(1),
  duration: z.number(),
});

type EditAppointmentFormValues = z.input<typeof editAppointmentSchema>;

type EditAppointmentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Lịch hẹn đang sửa — dùng để đổ giá trị ban đầu. */
  appointment: Appt | null;
  services: Service[];
  doctors: User[];
  onSave: (input: EditAppointmentInput) => void;
  /** Đang gọi API cập nhật — khoá nút lưu. */
  saving?: boolean;
};

export function EditAppointmentDialog({
  open,
  onOpenChange,
  appointment,
  services,
  doctors,
  onSave,
  saving = false,
}: EditAppointmentDialogProps) {
  const form = useForm<EditAppointmentFormValues>({
    resolver: zodResolver(editAppointmentSchema),
    defaultValues: { doctorId: "", serviceId: "", duration: 30 },
  });

  useEffect(() => {
    if (open && appointment) {
      form.reset({
        doctorId: appointment.doctorId,
        serviceId: appointment.serviceId,
        duration: appointment.duration,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, appointment]);

  const doctorId = form.watch("doctorId");
  const serviceId = form.watch("serviceId");
  const duration = form.watch("duration");

  // Đổi dịch vụ thì gợi ý lại thời lượng mặc định của dịch vụ đó.
  const handleSelectService = (id: string) => {
    form.setValue("serviceId", id);
    const svc = services.find((s) => s.id === id);
    if (svc) form.setValue("duration", svc.durationMinutes);
  };

  const canSave = doctorId !== "" && serviceId !== "" && !saving;

  const onSubmit = form.handleSubmit((values) => {
    if (saving) return;
    onSave({
      doctorId: values.doctorId,
      serviceId: values.serviceId,
      duration: values.duration,
    });
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Sửa cuộc hẹn</DialogTitle>
          <DialogDescription>
            Cập nhật dịch vụ, thời lượng và bác sĩ phụ trách.
          </DialogDescription>
        </DialogHeader>

        <form id="edit-appointment-form" onSubmit={onSubmit}>
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="edit-appt-service">Dịch vụ</FieldLabel>
              <Select value={serviceId} onValueChange={handleSelectService}>
                <SelectTrigger id="edit-appt-service" className="w-full">
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

            <div className="grid grid-cols-2 gap-3">
              <Field>
                <FieldLabel htmlFor="edit-appt-doctor">Bác sĩ</FieldLabel>
                <Select
                  value={doctorId}
                  onValueChange={(v) => form.setValue("doctorId", v)}
                >
                  <SelectTrigger id="edit-appt-doctor" className="w-full">
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
                <FieldLabel htmlFor="edit-appt-duration">Thời lượng</FieldLabel>
                <Select
                  value={String(duration)}
                  onValueChange={(v) => form.setValue("duration", Number(v))}
                >
                  <SelectTrigger id="edit-appt-duration" className="w-full">
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
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button type="submit" form="edit-appointment-form" disabled={!canSave}>
            {saving ? "Đang lưu…" : "Lưu thay đổi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
