import { useEffect, useMemo, useState } from "react";
import { getRouteApi, useNavigate } from "@tanstack/react-router";
import { vi } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { getPatients } from "@/features/patients/api";
import type { Patient } from "@/features/patients/types";
import { getServices } from "@/features/services/api";
import type { Service } from "@/features/services/types";
import { AppointmentDetailDialog } from "./AppointmentDetailDialog";
import {
  LEGEND,
  OPEN_HOUR,
  STATUS,
  addDays,
  addMinutes,
  buildWeekDays,
  formatDayMonth,
  formatWeekRange,
  parseDateKey,
  startOfWeek,
  type Appt,
} from "./constants";
import {
  NewAppointmentDialog,
  type NewAppointmentInput,
} from "./NewAppointmentDialog";
import { initialAppts } from "./sample-appointments";
import { WeekCalendarGrid } from "./WeekCalendarGrid";

const routeApi = getRouteApi("/_authenticated/appointments/");

export function AppointmentsPage() {
  const [appts, setAppts] = useState<Appt[]>(initialAppts);
  const [selected, setSelected] = useState<Appt | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);

  const [newOpen, setNewOpen] = useState(false);
  const [newPreset, setNewPreset] = useState<{
    day: number;
    start: string;
  } | null>(null);

  const [weekStart, setWeekStart] = useState<Date>(() =>
    startOfWeek(new Date()),
  );
  const [weekPickerOpen, setWeekPickerOpen] = useState(false);
  const weekDays = useMemo(() => buildWeekDays(weekStart), [weekStart]);

  const navigate = useNavigate();
  const { newAppt } = routeApi.useSearch();

  useEffect(() => {
    Promise.all([
      getPatients({ pageSize: 100 }),
      getServices({ pageSize: 100 }),
    ])
      .then(([patientPage, servicePage]) => {
        setPatients(patientPage.data);
        setServices(servicePage.data);
      })
      .catch(() => {
        toast.error("Không thể tải lịch hẹn.");
      });
  }, []);

  const [handledNewAppt, setHandledNewAppt] = useState(false);
  if (newAppt && !handledNewAppt) {
    setHandledNewAppt(true);
    setNewPreset(null);
    setNewOpen(true);
  } else if (!newAppt && handledNewAppt) {
    setHandledNewAppt(false);
  }

  useEffect(() => {
    if (newAppt) {
      navigate({ to: "/appointments", search: {}, replace: true });
    }
  }, [newAppt, navigate]);

  const handleCheckIn = () => {
    if (!selected) return;
    setAppts((prev) =>
      prev.map((a) => (a.id === selected.id ? { ...a, status: "arrived" } : a)),
    );
    toast.success(`${selected.patient} đã check-in`);
    setSelected(null);
  };

  const handleCancel = () => {
    if (!selected) return;
    setAppts((prev) => prev.filter((a) => a.id !== selected.id));
    toast(`Đã huỷ lịch hẹn của ${selected.patient}`);
    setSelected(null);
  };

  const handleCellClick = (dayIndex: number, slotIndex: number) => {
    const start = addMinutes(
      `${String(OPEN_HOUR).padStart(2, "0")}:00`,
      slotIndex * 15,
    );
    setNewPreset({ day: dayIndex, start });
    setNewOpen(true);
  };

  const handleCreateAppt = (input: NewAppointmentInput) => {
    const target = weekDays[input.day];
    setAppts((prev) => [
      ...prev,
      {
        id: `a${Date.now()}`,
        date: target.key,
        start: input.start,
        duration: input.duration,
        patient: input.patient,
        service: input.service,
        status: "booked",
      },
    ]);
    toast.success(
      `Đã đặt hẹn ${input.patient} · ${target.name} ${target.date} ${input.start}`,
    );
  };

  return (
    <div className="flex h-full min-h-0 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="bg-white"
          onClick={() => setWeekStart(startOfWeek(new Date()))}
        >
          Hôm nay
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Tuần trước"
          className="bg-white"
          onClick={() => setWeekStart((prev) => addDays(prev, -7))}
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          aria-label="Tuần sau"
          className="bg-white"
          onClick={() => setWeekStart((prev) => addDays(prev, 7))}
        >
          <ChevronRight className="size-4" />
        </Button>

        <Popover open={weekPickerOpen} onOpenChange={setWeekPickerOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2 bg-white font-normal">
              <CalendarIcon className="size-4 text-muted-foreground" />
              {formatWeekRange(weekStart)}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              locale={vi}
              captionLayout="dropdown"
              selected={weekStart}
              defaultMonth={weekStart}
              onSelect={(date) => {
                if (!date) return;
                setWeekStart(startOfWeek(date));
                setWeekPickerOpen(false);
              }}
            />
          </PopoverContent>
        </Popover>

        <div className="flex-1" />
        <Button
          onClick={() => {
            setNewPreset(null);
            setNewOpen(true);
          }}
        >
          Đặt hẹn mới
        </Button>
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-2 border-b border-[#e6efee] px-4.5 py-3.5">
          <div className="text-[14.5px] font-semibold text-foreground">
            {formatWeekRange(weekStart)}
          </div>
          <div className="text-xs text-muted-foreground">
            Bấm vào ô trống để đặt hẹn, bấm vào lịch hẹn để xem chi tiết
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-3.5 text-[11.5px] text-muted-foreground">
            {LEGEND.map((s) => (
              <div key={s} className="flex items-center gap-1.5">
                <span
                  className="px-4.5 rounded-[3px]"
                  style={{ background: STATUS[s].dot }}
                />
                {STATUS[s].label}
              </div>
            ))}
          </div>
        </div>

        <WeekCalendarGrid
          className="min-h-0 flex-1"
          weekDays={weekDays}
          appts={appts}
          onSlotClick={handleCellClick}
          onApptClick={setSelected}
        />

        <AppointmentDetailDialog
          open={selected != null}
          onOpenChange={(open) => !open && setSelected(null)}
          title={selected?.patient ?? ""}
          subtitle={
            selected
              ? `${formatDayMonth(parseDateKey(selected.date))} · ${selected.start}–${addMinutes(selected.start, selected.duration)}`
              : ""
          }
          status={selected ? STATUS[selected.status] : STATUS.booked}
          fields={
            selected
              ? [
                  { label: "Dịch vụ", value: selected.service },
                  { label: "Thời lượng", value: `${selected.duration} phút` },
                  { label: "Bác sĩ", value: "BS. Lê Minh Anh" },
                  { label: "Ghế", value: "Ghế 1" },
                ]
              : []
          }
          onCheckIn={handleCheckIn}
          onCancel={handleCancel}
        />
      </div>

      <NewAppointmentDialog
        open={newOpen}
        onOpenChange={setNewOpen}
        patients={patients}
        services={services}
        weekDays={weekDays}
        presetDay={newPreset?.day}
        presetStart={newPreset?.start}
        onCreate={handleCreateAppt}
      />
    </div>
  );
}
