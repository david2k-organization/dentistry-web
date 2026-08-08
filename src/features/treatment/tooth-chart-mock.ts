import { format } from "date-fns";

import type { ToothState } from "@/features/services/types";

// Backend chưa có API sơ đồ răng (không có bảng lưu trạng thái / lịch sử thay đổi từng răng
// theo bệnh nhân), nên sinh dữ liệu mô phỏng ổn định theo patientId (cùng 1 bệnh nhân luôn ra
// cùng sơ đồ trong phiên làm việc), lưu tạm trong bộ nhớ — không gửi lên backend.

export type ToothHistoryEntry = {
  state: ToothState;
  date: string;
};

export type PatientChart = {
  states: Record<number, ToothState>;
  /** Lịch sử thay đổi trạng thái của từng răng, cũ → mới. */
  history: Record<number, ToothHistoryEntry[]>;
};

function hashString(value: string): number {
  let h = 0;
  for (let i = 0; i < value.length; i++) {
    h = (h * 31 + value.charCodeAt(i)) >>> 0;
  }
  return h;
}

function mulberry32(seed: number) {
  let state = seed;
  return function random() {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(rng: () => number, items: readonly T[]): T {
  return items[Math.floor(rng() * items.length)];
}

function randomPastDate(rng: () => number): string {
  const day = 1 + Math.floor(rng() * 28);
  const month = 1 + Math.floor(rng() * 8); // trước tháng hiện tại
  return `${String(day).padStart(2, "0")}/${String(month).padStart(2, "0")}/2026`;
}

// Đánh số răng theo hệ FDI
export const UPPER_RIGHT = [18, 17, 16, 15, 14, 13, 12, 11];
export const UPPER_LEFT = [21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_RIGHT = [48, 47, 46, 45, 44, 43, 42, 41];
export const LOWER_LEFT = [31, 32, 33, 34, 35, 36, 37, 38];

const ALL_TEETH = [...UPPER_RIGHT, ...UPPER_LEFT, ...LOWER_RIGHT, ...LOWER_LEFT];

const SAMPLE_STATES: ToothState[] = [
  "DECAY",
  "FILLED",
  "CROWN",
  "ROOT_CANAL",
  "EXTRACTED",
  "IMPLANT",
  "MISSING",
  "VENEER",
];

function generateChart(patientId: string): PatientChart {
  const rng = mulberry32(hashString(patientId));
  const states: Record<number, ToothState> = {};
  const history: Record<number, ToothHistoryEntry[]> = {};
  const count = 1 + Math.floor(rng() * 5);
  const used = new Set<number>();
  for (let i = 0; i < count; i++) {
    const tooth = pick(rng, ALL_TEETH);
    if (used.has(tooth)) continue;
    used.add(tooth);
    const state = pick(rng, SAMPLE_STATES);
    states[tooth] = state;
    history[tooth] = [{ state, date: randomPastDate(rng) }];
  }
  return { states, history };
}

const store = new Map<string, PatientChart>();

/** Lấy sơ đồ răng của 1 bệnh nhân (sinh và lưu lại lần đầu, sau đó luôn trả về cùng giá trị). */
export function getPatientChart(patientId: string): PatientChart {
  let chart = store.get(patientId);
  if (!chart) {
    chart = generateChart(patientId);
    store.set(patientId, chart);
  }
  return chart;
}

/** Đổi trạng thái 1 răng và ghi thêm 1 mốc vào lịch sử thay đổi của răng đó. */
export function setToothState(patientId: string, tooth: number, state: ToothState): PatientChart {
  const chart = getPatientChart(patientId);
  const entry: ToothHistoryEntry = { state, date: format(new Date(), "dd/MM/yyyy HH:mm") };
  const next: PatientChart = {
    states: { ...chart.states, [tooth]: state },
    history: {
      ...chart.history,
      [tooth]: [...(chart.history[tooth] ?? []), entry],
    },
  };
  store.set(patientId, next);
  return next;
}
