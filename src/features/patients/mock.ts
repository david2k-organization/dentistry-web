// Dữ liệu mô phỏng (mock) cho các trường chưa có trong API bệnh nhân thật:
// mã hồ sơ, địa chỉ, tiền sử dị ứng, trạng thái điều trị, công nợ, lịch sử khám, hoá đơn.
// Sinh ổn định theo patient.id (cùng 1 bệnh nhân luôn ra cùng dữ liệu trong phiên làm việc),
// lưu tạm trong bộ nhớ — không gửi lên backend.

export type PatientTag = "Mới" | "Đang điều trị" | "Theo dõi" | "Hoàn tất";

export type TreatmentStatus = "Hoàn tất" | "Đang xử lý";

export type TreatmentMaterial = { name: string; code: string; qty: number; unit: string };

export type PatientHistoryEntry = {
  date: string;
  name: string;
  note: string;
  amount: number;
  region: string;
  doctor: string;
  materials: number;
  status: TreatmentStatus;
  followUp: string | null;
  materialsList: TreatmentMaterial[];
  // Ảnh đính kèm (data URL).
  images?: string[];
};

export type PatientInvoiceSummary = {
  code: string;
  date: string;
  total: number;
  status: "Đã thu" | "Chờ thu";
  summary: string;
};

export type PatientMock = {
  code: string;
  address: string;
  allergy: string;
  tag: PatientTag;
  doctor: string;
  visits: number;
  debt: number;
  history: PatientHistoryEntry[];
  invoices: PatientInvoiceSummary[];
  // Ảnh đại diện (data URL) — backend chưa có endpoint upload, lưu tạm trong bộ nhớ.
  avatar: string | null;
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

const ADDRESSES = [
  "12 Phan Xích Long, Q. Phú Nhuận, TP.HCM",
  "88 Cách Mạng Tháng 8, Q.3, TP.HCM",
  "128 Nguyễn Trãi, Q.1, TP.HCM",
  "45/7 Lê Lợi, Q. Gò Vấp, TP.HCM",
  "201 Trần Hưng Đạo, Q.5, TP.HCM",
  "9 Hoàng Diệu, Q.4, TP.HCM",
  "316 Nguyễn Thị Minh Khai, Q.3, TP.HCM",
  "77 Bà Hạt, Q.10, TP.HCM",
];

const ALLERGIES = [
  "Không ghi nhận",
  "Không ghi nhận",
  "Không ghi nhận",
  "Dị ứng Penicillin",
  "Dị ứng Latex",
  "Dị ứng thuốc tê nhóm Lidocaine",
];

const TAGS: PatientTag[] = ["Mới", "Đang điều trị", "Đang điều trị", "Theo dõi", "Hoàn tất"];

export const DOCTORS = [
  "BS. Lê Minh Anh",
  "BS. Trần Quốc Bảo",
  "BS. Nguyễn Thu Hà",
  "BS. Phạm Gia Huy",
  "BS. Đỗ Khánh Vy",
];

const REGIONS = [
  "Toàn hàm",
  "Hàm trên",
  "Hàm dưới",
  "Nhóm răng cửa",
  "R16",
  "R26",
  "R36",
];

const MATERIALS: { name: string; code: string; unit: string }[] = [
  { name: "Găng tay latex size M", code: "VT-072", unit: "hộp" },
  { name: "Kim tiêm nha khoa 27G", code: "VT-018", unit: "vỉ" },
  { name: "Composite Filtek Z350 A2", code: "VT-045", unit: "tuýp" },
  { name: "Thuốc tê Lidocaine 2%", code: "VT-030", unit: "ống" },
  { name: "Bông gòn cuộn tiệt trùng", code: "VT-051", unit: "gói" },
  { name: "Mũi khoan kim cương", code: "VT-063", unit: "cái" },
];

const TREATMENTS: { name: string; note: string; amount: number }[] = [
  { name: "Khám và tư vấn", note: "BS. Lê Minh Anh", amount: 100_000 },
  { name: "Lấy cao răng, đánh bóng", note: "Viêm nướu nhẹ", amount: 300_000 },
  { name: "Trám răng composite", note: "Sâu men ngà", amount: 400_000 },
  { name: "Chụp phim X-quang quanh chóp", note: "1 phim", amount: 80_000 },
  { name: "Điều trị tuỷ răng hàm", note: "Buổi 1/3", amount: 2_200_000 },
  { name: "Nhổ răng khôn mọc lệch", note: "Cần theo dõi hậu phẫu", amount: 2_500_000 },
  { name: "Bọc răng sứ Cercon", note: "Đã lấy dấu", amount: 4_500_000 },
  { name: "Tẩy trắng răng tại phòng", note: "Kết quả tốt", amount: 1_800_000 },
];

const store = new Map<string, PatientMock>();

function generate(id: string): PatientMock {
  const rng = mulberry32(hashString(id));
  const codeNum = 100 + Math.floor(rng() * 900);
  const visits = 1 + Math.floor(rng() * 12);
  const hasDebt = rng() < 0.35;
  const historyCount = Math.min(visits, 1 + Math.floor(rng() * 4));

  let day = 2 + Math.floor(rng() * 8);
  const history: PatientHistoryEntry[] = Array.from({ length: historyCount }, () => {
    const t = pick(rng, TREATMENTS);
    const materialCount = Math.floor(rng() * 3);
    const materialsList: TreatmentMaterial[] = Array.from({ length: materialCount }, () => {
      const m = pick(rng, MATERIALS);
      return { name: m.name, code: m.code, unit: m.unit, qty: 1 + Math.floor(rng() * 2) };
    });
    const entry: PatientHistoryEntry = {
      date: `${String(day).padStart(2, "0")}/07/2026`,
      name: t.name,
      note: t.note,
      amount: t.amount,
      region: pick(rng, REGIONS),
      doctor: pick(rng, DOCTORS),
      materials: materialsList.reduce((sum, m) => sum + m.qty, 0),
      status: rng() < 0.75 ? "Hoàn tất" : "Đang xử lý",
      followUp:
        rng() < 0.5
          ? `${String(1 + Math.floor(rng() * 28)).padStart(2, "0")}/${String(
              1 + Math.floor(rng() * 12),
            ).padStart(2, "0")}/2027`
          : null,
      materialsList,
    };
    day = Math.max(1, day - (2 + Math.floor(rng() * 10)));
    return entry;
  });

  const invoiceCount = Math.floor(rng() * 3);
  const invoices: PatientInvoiceSummary[] = Array.from({ length: invoiceCount }, (_, i) => ({
    code: `HD-${String(1000 + codeNum + i).padStart(4, "0")}`,
    date: history[i]?.date ?? "29/07/2026",
    total: history[i]?.amount ?? pick(rng, TREATMENTS).amount,
    status: rng() < 0.7 ? "Đã thu" : "Chờ thu",
    summary: [history[i]?.name, "Khám và tư vấn"].filter(Boolean).join(", "),
  }));

  return {
    code: `BN-${String(codeNum).padStart(4, "0")}`,
    address: pick(rng, ADDRESSES),
    allergy: pick(rng, ALLERGIES),
    tag: pick(rng, TAGS),
    doctor: pick(rng, DOCTORS),
    visits,
    debt: hasDebt ? (1 + Math.floor(rng() * 20)) * 100_000 : 0,
    history,
    invoices,
    avatar: null,
  };
}

/** Lấy dữ liệu mock của 1 bệnh nhân (sinh và lưu lại lần đầu, sau đó luôn trả về cùng giá trị). */
export function getPatientMock(id: string): PatientMock {
  let mock = store.get(id);
  if (!mock) {
    mock = generate(id);
    store.set(id, mock);
  }
  return mock;
}

/** Cập nhật các trường mock (địa chỉ, dị ứng, trạng thái, ảnh đại diện) khi sửa hồ sơ. */
export function setPatientMock(
  id: string,
  patch: Partial<Pick<PatientMock, "address" | "allergy" | "tag" | "avatar">>,
): void {
  store.set(id, { ...getPatientMock(id), ...patch });
}

export const TAG_OPTIONS: PatientTag[] = ["Mới", "Đang điều trị", "Theo dõi", "Hoàn tất"];

export function tagBg(tag: PatientTag): string {
  if (tag === "Đang điều trị") return "#fdf3e8";
  if (tag === "Mới") return "#e7f1f0";
  if (tag === "Hoàn tất") return "#eef6f1";
  return "#f1f5f5";
}

export function tagFg(tag: PatientTag): string {
  if (tag === "Đang điều trị") return "#9a6524";
  if (tag === "Mới") return "#0a5c57";
  if (tag === "Hoàn tất") return "#3f7a55";
  return "#5c7a78";
}
