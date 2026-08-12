import axios from "axios";
import { api, type ApiEnvelope } from "@/lib/api";

// Content-type suy ra từ đuôi file, phải trùng với content-type server đã ký
// khi tạo presigned URL — nếu lệch, S3 trả `SignatureDoesNotMatch` lúc PUT.
const CONTENT_TYPE_BY_EXT: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

function contentTypeFromFileName(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  return CONTENT_TYPE_BY_EXT[ext] ?? "application/octet-stream";
}

type PresignResponse = {
  // URL đã ký để client tự PUT file lên S3 (hết hạn sau 1 giờ).
  presignedUrl: string;
  // URL public cuối cùng của ảnh sau khi upload xong.
  url: string;
};

/**
 * Upload 1 ảnh theo luồng presigned URL (docs/api/media-api.md #2):
 *  1. Xin presigned URL từ backend (public, chỉ cần `fileName`).
 *  2. Client tự PUT file thẳng lên S3 bằng URL đã ký — không đi qua backend.
 * Trả về `url` public để lưu/hiển thị.
 *
 * PUT dùng axios mặc định (không phải instance `api`) để tránh gắn header
 * Authorization / cookie vào request S3.
 */
export async function uploadImageViaPresign(file: File): Promise<string> {
  const { data: envelope } = await api.post<ApiEnvelope<PresignResponse>>(
    "/media/images/presign-url",
    { fileName: file.name },
  );
  const { presignedUrl, url } = envelope.data;

  await axios.put(presignedUrl, file, {
    headers: { "Content-Type": contentTypeFromFileName(file.name) },
  });

  return url;
}
