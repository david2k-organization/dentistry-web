import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type { CreatePatientInput, Patient, UpdatePatientInput } from "./types";

export async function getPatients(
  params: ListParams = {},
): Promise<Paginated<Patient>> {
  const res = await api.get<ApiEnvelope<Paginated<Patient> | Patient[]>>(
    "/patient",
    {
      params: listQuery(params),
    },
  );
  return normalizePaginated(res.data);
}

export async function getPatient(id: string): Promise<Patient | null> {
  const res = await api.get<ApiEnvelope<Patient | null>>(`/patient/${id}`);
  return res.data.data;
}

export async function createPatient(
  input: CreatePatientInput,
): Promise<Patient> {
  const res = await api.post<ApiEnvelope<Patient>>("/patient", input);
  return res.data.data;
}

export async function deletePatient(id: string): Promise<void> {
  await api.delete(`/patient/${id}`);
}

export async function updatePatient(
  id: string,
  input: UpdatePatientInput,
): Promise<void> {
  await api.put(`/patient/${id}`, input);
}

/** Báo cáo import: validate từng dòng độc lập, dòng lỗi không chặn dòng khác. */
export type ImportPatientsResult = {
  total: number;
  success: number;
  failed: number;
  errors: {
    row: number;
    errors: string[];
    data: Record<string, unknown>;
  }[];
};

/**
 * Lấy tên file từ header Content-Disposition, fallback nếu không đọc được.
 * Ưu tiên `filename*=UTF-8''...` (RFC 5987, đúng với tên có dấu) rồi mới tới
 * `filename="..."`. Lưu ý: header này bị CORS ẩn nếu backend không set
 * `Access-Control-Expose-Headers: Content-Disposition`.
 */
function fileNameFromDisposition(header: unknown, fallback: string): string {
  if (typeof header !== "string") return fallback;
  const extended = /filename\*=(?:UTF-8'')?([^;]+)/i.exec(header);
  if (extended) return decodeURIComponent(extended[1].trim());
  const plain = /filename="?([^";]+)"?/i.exec(header);
  return plain ? plain[1].trim() : fallback;
}

/** Kích hoạt trình duyệt tải một Blob về máy dưới tên file cho trước. */
function triggerBlobDownload(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/** Tải file Excel mẫu để nhập bệnh nhân (`GET /patient/import/template`). */
export async function downloadPatientImportTemplate(): Promise<void> {
  const res = await api.get("/patient/import/template", { responseType: "blob" });
  triggerBlobDownload(
    res.data,
    fileNameFromDisposition(
      res.headers["content-disposition"],
      "patient-import-template.xlsx",
    ),
  );
}

/** Import bệnh nhân từ file Excel (`POST /patient/import`, multipart). */
export async function importPatients(file: File): Promise<ImportPatientsResult> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await api.post<ApiEnvelope<ImportPatientsResult>>(
    "/patient/import",
    formData,
  );
  return res.data.data;
}

/** Xuất danh sách bệnh nhân ra Excel (`GET /patient/export`). */
export async function exportPatients(searchKey?: string): Promise<void> {
  const res = await api.get("/patient/export", {
    params: searchKey?.trim() ? { searchKey: searchKey.trim() } : undefined,
    responseType: "blob",
  });
  triggerBlobDownload(
    res.data,
    fileNameFromDisposition(res.headers["content-disposition"], "patients.xlsx"),
  );
}
