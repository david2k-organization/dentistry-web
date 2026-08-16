import * as XLSX from "xlsx";

import { dateOnlyToIsoWithOffset } from "./format";
import type { CreatePatientInput, Gender, Patient } from "./types";

/**
 * ⚠️ Backend chưa có endpoint import/export riêng cho bệnh nhân — file được
 * sinh/đọc hoàn toàn ở FE (SheetJS), export gọi `getPatients` rồi ghi file,
 * import đọc file rồi gọi lần lượt `createPatient` cho từng dòng hợp lệ.
 */

const HEADERS = [
  "Họ tên",
  "Số điện thoại",
  "Email",
  "Ngày sinh (YYYY-MM-DD)",
  "Giới tính",
  "Ghi chú",
] as const;

const GENDER_LABEL: Record<Gender, string> = {
  MALE: "Nam",
  FEMALE: "Nữ",
  OTHER: "Khác",
};

const GENDER_FROM_LABEL: Record<string, Gender> = {
  nam: "MALE",
  male: "MALE",
  "nữ": "FEMALE",
  nu: "FEMALE",
  female: "FEMALE",
  "khác": "OTHER",
  khac: "OTHER",
  other: "OTHER",
};

function isoToDateOnly(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function exportPatientsToExcel(
  patients: Patient[],
  fileName = "benh-nhan.xlsx",
) {
  const rows = patients.map((p) => ({
    [HEADERS[0]]: p.fullName,
    [HEADERS[1]]: p.phone ?? "",
    [HEADERS[2]]: p.email ?? "",
    [HEADERS[3]]: isoToDateOnly(p.dateOfBirth),
    [HEADERS[4]]: p.gender ? GENDER_LABEL[p.gender] : "",
    [HEADERS[5]]: p.notes ?? "",
  }));
  const sheet = XLSX.utils.json_to_sheet(rows, { header: [...HEADERS] });
  sheet["!cols"] = [
    { wch: 24 },
    { wch: 16 },
    { wch: 24 },
    { wch: 22 },
    { wch: 10 },
    { wch: 32 },
  ];
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Bệnh nhân");
  XLSX.writeFile(workbook, fileName);
}

export type ImportRow = {
  rowNumber: number;
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  notes?: string;
  errors: string[];
};

function parseGender(raw: unknown): { gender?: Gender; error?: string } {
  const text = String(raw ?? "").trim();
  if (!text) return {};
  const gender = GENDER_FROM_LABEL[text.toLowerCase()];
  if (!gender) return { error: `Giới tính không hợp lệ: "${text}"` };
  return { gender };
}

function parseDateOfBirth(raw: unknown): { dateOfBirth?: string; error?: string } {
  if (raw == null || raw === "") return {};
  let dateOnly: string;
  if (raw instanceof Date) {
    const pad = (n: number) => String(n).padStart(2, "0");
    dateOnly = `${raw.getFullYear()}-${pad(raw.getMonth() + 1)}-${pad(raw.getDate())}`;
  } else {
    dateOnly = String(raw).trim();
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOnly)) {
    return { error: `Ngày sinh không đúng định dạng YYYY-MM-DD: "${String(raw)}"` };
  }
  return { dateOfBirth: dateOnlyToIsoWithOffset(dateOnly) };
}

/** Đọc file .xlsx được chọn, trả về danh sách dòng đã parse kèm lỗi validate (nếu có). */
export async function parsePatientsExcel(file: File): Promise<ImportRow[]> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet) return [];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  return raw.map((row, index) => {
    const errors: string[] = [];
    const fullName = String(row[HEADERS[0]] ?? "").trim();
    if (!fullName) errors.push("Thiếu họ tên");

    const phone = String(row[HEADERS[1]] ?? "").trim();
    const email = String(row[HEADERS[2]] ?? "").trim();
    const notes = String(row[HEADERS[5]] ?? "").trim();

    const { dateOfBirth, error: dobError } = parseDateOfBirth(row[HEADERS[3]]);
    if (dobError) errors.push(dobError);

    const { gender, error: genderError } = parseGender(row[HEADERS[4]]);
    if (genderError) errors.push(genderError);

    return {
      // +1 vì header chiếm dòng 1, +1 vì index bắt đầu từ 0.
      rowNumber: index + 2,
      fullName,
      phone: phone || undefined,
      email: email || undefined,
      dateOfBirth,
      gender,
      notes: notes || undefined,
      errors,
    };
  });
}

export function importRowToInput(row: ImportRow): CreatePatientInput {
  return {
    fullName: row.fullName,
    ...(row.phone ? { phone: row.phone } : {}),
    ...(row.email ? { email: row.email } : {}),
    ...(row.dateOfBirth ? { dateOfBirth: row.dateOfBirth } : {}),
    ...(row.gender ? { gender: row.gender } : {}),
    ...(row.notes ? { notes: row.notes } : {}),
  };
}
