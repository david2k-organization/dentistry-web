import { useState } from "react";

type ToothState = "NORMAL" | "DECAY" | "FILLED" | "ROOT_CANAL" | "EXTRACTED";

const TOOTH_STATE: Record<
  ToothState,
  { label: string; bg: string; border: string; fg: string }
> = {
  NORMAL: { label: "Bình thường", bg: "#ffffff", border: "#cfe0df", fg: "#4a6664" },
  DECAY: { label: "Sâu răng", bg: "#fdf3e8", border: "#e9c893", fg: "#9a6524" },
  FILLED: { label: "Đã trám", bg: "#e7f1f0", border: "#8fc4be", fg: "#0f7a73" },
  ROOT_CANAL: { label: "Điều trị tủy", bg: "#ece9f5", border: "#c3bce0", fg: "#5468a8" },
  EXTRACTED: { label: "Đã nhổ", bg: "#fbeeea", border: "#e6cdbf", fg: "#a4553a" },
};

const STATE_ORDER: ToothState[] = ["NORMAL", "DECAY", "FILLED", "ROOT_CANAL", "EXTRACTED"];

// Đánh số răng theo hệ FDI
const upperRight = [18, 17, 16, 15, 14, 13, 12, 11];
const upperLeft = [21, 22, 23, 24, 25, 26, 27, 28];
const lowerRight = [48, 47, 46, 45, 44, 43, 42, 41];
const lowerLeft = [31, 32, 33, 34, 35, 36, 37, 38];

const initialStates: Record<number, ToothState> = {
  11: "FILLED",
  16: "FILLED",
  24: "DECAY",
  26: "DECAY",
  36: "ROOT_CANAL",
  47: "EXTRACTED",
};

const toothNames: Record<number, string> = {
  1: "Răng cửa giữa",
  2: "Răng cửa bên",
  3: "Răng nanh",
  4: "Răng cối nhỏ thứ nhất",
  5: "Răng cối nhỏ thứ hai",
  6: "Răng cối lớn thứ nhất",
  7: "Răng cối lớn thứ hai",
  8: "Răng khôn",
};
const toothName = (num: number) => toothNames[num % 10] ?? "Răng";

type PlanItem = {
  tooth: string;
  name: string;
  note: string;
  price: number;
  done: boolean;
};

const initialPlan: PlanItem[] = [
  { tooth: "26", name: "Trám răng sâu Composite", note: "Mặt nhai", price: 400_000, done: false },
  { tooth: "36", name: "Điều trị tủy + trám bít", note: "Răng 3 chân", price: 2_500_000, done: true },
  { tooth: "47", name: "Cấy ghép Implant", note: "Trụ Hàn Quốc", price: 18_000_000, done: false },
  { tooth: "16", name: "Bọc mão sứ Titan", note: "Sau điều trị tủy", price: 3_000_000, done: false },
];

const vnd = new Intl.NumberFormat("vi-VN");
const formatVnd = (n: number) => `${vnd.format(n)} đ`;

function ToothButton({
  num,
  state,
  selected,
  lower,
  onClick,
}: {
  num: number;
  state: ToothState;
  selected: boolean;
  lower: boolean;
  onClick: () => void;
}) {
  const s = TOOTH_STATE[state];
  return (
    <button
      type="button"
      onClick={onClick}
      title={`Răng ${num}`}
      className="h-[38px] w-[30px] cursor-pointer text-[10.5px] font-semibold tabular-nums transition-[filter] hover:brightness-95"
      style={{
        background: s.bg,
        color: s.fg,
        border: `1.5px solid ${selected ? "#0f7a73" : s.border}`,
        borderRadius: lower ? "10px 10px 6px 6px" : "6px 6px 10px 10px",
        boxShadow: selected ? "0 0 0 2px #cfe4e2" : undefined,
      }}
    >
      {num}
    </button>
  );
}

export function TreatmentPage() {
  const [states, setStates] = useState<Record<number, ToothState>>(initialStates);
  const [selected, setSelected] = useState<number | null>(26);
  const [plan, setPlan] = useState<PlanItem[]>(initialPlan);

  const stateOf = (num: number): ToothState => states[num] ?? "NORMAL";
  const setToothState = (num: number, state: ToothState) =>
    setStates((prev) => ({ ...prev, [num]: state }));

  const planTotal = plan.reduce((sum, p) => sum + p.price, 0);

  const renderRow = (nums: number[], lower: boolean) =>
    nums.map((num) => (
      <ToothButton
        key={num}
        num={num}
        lower={lower}
        state={stateOf(num)}
        selected={selected === num}
        onClick={() => setSelected(num)}
      />
    ));

  return (
    <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[1.35fr_1fr]">
      {/* Sơ đồ răng */}
      <div className="rounded-[14px] border border-border bg-card p-[18px]">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-2">
          <div className="text-[14.5px] font-semibold text-foreground">
            Sơ đồ răng — Nguyễn Văn Long
          </div>
          <div className="flex-1" />
          <div className="flex flex-wrap gap-3 text-[11.5px] text-muted-foreground">
            {STATE_ORDER.map((st) => (
              <div key={st} className="flex items-center gap-1.5">
                <span
                  className="size-[9px] rounded-[3px]"
                  style={{
                    background: TOOTH_STATE[st].bg,
                    border: `1px solid ${TOOTH_STATE[st].border}`,
                  }}
                />
                {TOOTH_STATE[st].label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-5 flex flex-col gap-2.5 rounded-xl border border-[#eaf3f2] bg-[#f7fbfa] px-1.5 py-[18px]">
          <div className="text-center text-[11px] tracking-[0.08em] text-[#9fb3b1]">HÀM TRÊN</div>
          <div className="flex justify-center gap-4">
            <div className="flex gap-1">{renderRow(upperRight, false)}</div>
            <div className="flex gap-1">{renderRow(upperLeft, false)}</div>
          </div>
          <div className="mx-10 my-1.5 h-px bg-[#dfeceb]" />
          <div className="flex justify-center gap-4">
            <div className="flex gap-1">{renderRow(lowerRight, true)}</div>
            <div className="flex gap-1">{renderRow(lowerLeft, true)}</div>
          </div>
          <div className="text-center text-[11px] tracking-[0.08em] text-[#9fb3b1]">HÀM DƯỚI</div>
        </div>

        {/* Panel răng đang chọn */}
        <div className="mt-[18px] border-t border-[#f0f5f4] pt-4">
          {selected == null ? (
            <div className="text-[12.5px] text-muted-foreground">
              Chọn một răng trên sơ đồ để ghi nhận hiện trạng và thêm vào kế hoạch điều trị.
            </div>
          ) : (
            <div>
              <div className="flex items-baseline gap-2.5">
                <div className="text-sm font-semibold text-foreground">Răng {selected}</div>
                <div className="text-[12.5px] text-muted-foreground">
                  {toothName(selected)} · hiện trạng: {TOOTH_STATE[stateOf(selected)].label}
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {STATE_ORDER.map((st) => {
                  const active = stateOf(selected) === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => setToothState(selected, st)}
                      className="cursor-pointer rounded-[9px] border px-[13px] py-[7px] text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                      style={{
                        background: active ? TOOTH_STATE[st].bg : "#ffffff",
                        color: active ? TOOTH_STATE[st].fg : "#4a6664",
                        borderColor: active ? TOOTH_STATE[st].border : "#dde8e7",
                      }}
                    >
                      {TOOTH_STATE[st].label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Kế hoạch điều trị */}
      <div className="overflow-hidden rounded-[14px] border border-border bg-card">
        <div className="flex items-center gap-2.5 border-b border-[#e6efee] px-[18px] py-[15px]">
          <div className="text-[14.5px] font-semibold text-foreground">Kế hoạch điều trị</div>
          <div className="flex-1" />
          <div className="text-[12.5px] text-muted-foreground tabular-nums">
            Tổng {formatVnd(planTotal)}
          </div>
        </div>

        {plan.map((p, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 border-b border-[#f0f5f4] px-[18px] py-[13px]"
          >
            <div className="grid size-[34px] shrink-0 place-items-center rounded-[9px] border border-[#e2eeed] bg-[#f2f8f7] text-[11.5px] font-semibold tabular-nums text-primary">
              {p.tooth}
            </div>
            <div className="min-w-0 flex-1 leading-snug">
              <div className="text-[13px] font-medium text-foreground">{p.name}</div>
              <div className="text-[11.5px] text-muted-foreground">{p.note}</div>
            </div>
            <div className="text-[12.5px] font-medium tabular-nums text-foreground">
              {formatVnd(p.price)}
            </div>
            <button
              type="button"
              onClick={() =>
                setPlan((prev) => prev.map((it, i) => (i === idx ? { ...it, done: !it.done } : it)))
              }
              className="min-w-[84px] cursor-pointer rounded-full border px-2.5 py-1.5 text-[11.5px] font-medium transition-[filter] hover:brightness-95"
              style={
                p.done
                  ? { background: "#eef6f1", borderColor: "#cfe7d9", color: "#3f7a55" }
                  : { background: "#ffffff", borderColor: "#dde8e7", color: "#7e9997" }
              }
            >
              {p.done ? "Hoàn tất" : "Chờ làm"}
            </button>
          </div>
        ))}

        <div className="flex gap-2.5 px-[18px] py-3.5">
          <button
            type="button"
            className="cursor-pointer rounded-[10px] bg-primary px-[15px] py-2.5 text-[13px] font-medium text-primary-foreground transition-colors hover:bg-[color-mix(in_oklch,var(--primary),black_18%)]"
          >
            Xuất hoá đơn từ kế hoạch
          </button>
        </div>
      </div>
    </div>
  );
}
