import { useState } from "react";
import { CalendarClock, Clock, X } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

import { cn } from "@/lib/utils";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const pad = (n: number) => String(n).padStart(2, "0");

/** Gộp ngày/giờ/phút vào 1 Date. Khi chưa có giá trị nền thì lấy hôm nay 00:00. */
function combine(
  base: Date | undefined,
  opts: { date?: Date; hour?: number; minute?: number },
): Date {
  const d = base ? new Date(base) : new Date();
  if (!base) d.setHours(0, 0, 0, 0);
  if (opts.date) {
    d.setFullYear(
      opts.date.getFullYear(),
      opts.date.getMonth(),
      opts.date.getDate(),
    );
  }
  if (opts.hour != null) d.setHours(opts.hour);
  if (opts.minute != null) d.setMinutes(opts.minute);
  d.setSeconds(0, 0);
  return d;
}

/** Danh sách phút theo bước nhảy, đảm bảo luôn chứa phút hiện tại. */
function buildMinuteOptions(step: number, current: number): number[] {
  const set = new Set<number>();
  for (let m = 0; m < 60; m += Math.max(1, step)) set.add(m);
  set.add(current);
  return [...set].sort((a, b) => a - b);
}

const timeSelectClass =
  "h-8 cursor-pointer rounded-md border border-input bg-transparent px-1.5 text-sm tabular-nums outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export type DateTimePickerProps = {
  value: Date | undefined;
  onChange: (value: Date | undefined) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Class cho khối bọc (VD: chỉnh chiều rộng). */
  className?: string;
  /** Bước nhảy phút trong danh sách chọn (mặc định 5). */
  minuteStep?: number;
  /** Hiện nút xoá giá trị (mặc định có). */
  clearable?: boolean;
  align?: "start" | "center" | "end";
};

export function DateTimePicker({
  value,
  onChange,
  placeholder = "Chọn ngày giờ",
  disabled,
  className,
  minuteStep = 5,
  clearable = true,
  align = "start",
}: DateTimePickerProps) {
  const [open, setOpen] = useState(false);

  const hour = value ? value.getHours() : 0;
  const minute = value ? value.getMinutes() : 0;
  const minutes = buildMinuteOptions(minuteStep, minute);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type="button"
            disabled={disabled}
            className="flex h-9 flex-1 items-center gap-2 rounded-lg border border-input bg-transparent px-3 text-left text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CalendarClock className="size-4 shrink-0 text-muted-foreground" />
            {value ? (
              <span className="text-foreground">
                {format(value, "dd/MM/yyyy HH:mm", { locale: vi })}
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent align={align} className="w-auto p-0">
          <Calendar
            mode="single"
            locale={vi}
            captionLayout="dropdown"
            selected={value}
            onSelect={(date) => {
              if (date) onChange(combine(value, { date, hour, minute }));
            }}
          />
          <div className="flex items-center gap-2 border-t border-border px-3 py-2.5">
            <Clock className="size-4 shrink-0 text-muted-foreground" />
            <span className="text-[12.5px] text-muted-foreground">Giờ</span>
            <select
              aria-label="Giờ"
              value={hour}
              onChange={(e) =>
                onChange(combine(value, { hour: Number(e.target.value) }))
              }
              className={timeSelectClass}
            >
              {Array.from({ length: 24 }, (_, h) => (
                <option key={h} value={h}>
                  {pad(h)}
                </option>
              ))}
            </select>
            <span className="text-muted-foreground">:</span>
            <select
              aria-label="Phút"
              value={minute}
              onChange={(e) =>
                onChange(combine(value, { minute: Number(e.target.value) }))
              }
              className={timeSelectClass}
            >
              {minutes.map((m) => (
                <option key={m} value={m}>
                  {pad(m)}
                </option>
              ))}
            </select>
          </div>
        </PopoverContent>
      </Popover>
      {clearable && value && !disabled && (
        <button
          type="button"
          aria-label="Xoá ngày giờ"
          onClick={() => onChange(undefined)}
          className="grid size-9 shrink-0 place-items-center rounded-lg border border-input text-muted-foreground hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
