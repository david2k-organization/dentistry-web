type Staff = { initials: string; name: string; role: string; shifts: number };

const staff: Staff[] = [
  { initials: "MA", name: "BS. Lê Minh Anh", role: "Chủ phòng khám", shifts: 6 },
  { initials: "VH", name: "BS. Nguyễn Văn Hùng", role: "Bác sĩ điều trị", shifts: 5 },
  { initials: "TL", name: "ĐD. Trần Thị Lan", role: "Điều dưỡng", shifts: 6 },
  { initials: "TT", name: "Phạm Thu Trang", role: "Lễ tân", shifts: 5 },
];

const dayCols = ["T2", "T3", "T4", "T5", "T6", "T7"];

type ShiftKind = "full" | "morning" | "afternoon" | "off";

const shiftStyle: Record<ShiftKind, string> = {
  full: "bg-[#e7f1f0] text-primary",
  morning: "bg-[#f4f9f8] text-[#4a6664]",
  afternoon: "bg-[#f4f9f8] text-[#4a6664]",
  off: "bg-card text-[#9fb3b1]",
};
const shiftLabel: Record<ShiftKind, string> = {
  full: "Cả ngày",
  morning: "Sáng",
  afternoon: "Chiều",
  off: "Nghỉ",
};

const shiftRows: { name: string; cells: ShiftKind[] }[] = [
  { name: "BS. Lê Minh Anh", cells: ["full", "full", "morning", "full", "full", "morning"] },
  { name: "BS. Nguyễn Văn Hùng", cells: ["afternoon", "full", "full", "off", "full", "full"] },
  { name: "ĐD. Trần Thị Lan", cells: ["full", "full", "full", "full", "morning", "full"] },
  { name: "Phạm Thu Trang", cells: ["morning", "afternoon", "full", "full", "off", "full"] },
];

const ROW = "grid grid-cols-[1.4fr_repeat(6,1fr)] gap-px";

export function StaffPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
        {staff.map((s) => (
          <div key={s.name} className="rounded-[14px] border border-border bg-card p-[18px]">
            <div className="flex items-center gap-3">
              <div className="flex size-[42px] shrink-0 items-center justify-center rounded-full bg-accent text-sm font-semibold text-primary">
                {s.initials}
              </div>
              <div className="min-w-0 leading-tight">
                <div className="truncate text-[13.5px] font-semibold text-foreground">
                  {s.name}
                </div>
                <div className="text-[11.5px] text-muted-foreground">{s.role}</div>
              </div>
            </div>
            <div className="mt-3.5 flex justify-between border-t border-[#f0f5f4] pt-3 text-xs text-muted-foreground">
              <span>Ca tuần này</span>
              <span className="font-semibold tabular-nums text-foreground">{s.shifts}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="border-b border-[#e6efee] px-[18px] py-[15px] text-[14.5px] font-semibold text-foreground">
          Lịch làm việc trong tuần
        </div>
        <div className="flex flex-col gap-px overflow-x-auto bg-[#eaf1f0]">
          <div className={`${ROW} min-w-[640px]`}>
            <div className="bg-[#f7fbfa] px-3.5 py-2.5 text-[11.5px] font-medium text-muted-foreground">
              Nhân sự
            </div>
            {dayCols.map((d) => (
              <div
                key={d}
                className="bg-[#f7fbfa] py-2.5 text-center text-[11.5px] font-medium text-muted-foreground"
              >
                {d}
              </div>
            ))}
          </div>
          {shiftRows.map((r) => (
            <div key={r.name} className={`${ROW} min-w-[640px]`}>
              <div className="bg-card px-3.5 py-[13px] text-[13px] font-medium text-foreground">
                {r.name}
              </div>
              {r.cells.map((c, idx) => (
                <div
                  key={idx}
                  className={`py-[11px] text-center text-[11.5px] font-medium ${shiftStyle[c]}`}
                >
                  {shiftLabel[c]}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
