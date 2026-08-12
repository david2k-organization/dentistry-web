# Media API

Base URL: `http://localhost:{PORT}/api/v1` (global prefix `api/v1`).

Mọi response đều được bọc bởi `TransformInterceptor` theo dạng:

```jsonc
{
  "success": true,
  "statusCode": 201,
  "message": "Success",
  "data": /* payload thực tế */,
  "timestamp": "2026-08-12T00:00:00.000Z",
  "path": "/api/v1/media/images/upload"
}
```

Phần mô tả `data` bên dưới chỉ nói về `data` (đã nằm trong envelope này).

---

## 1. Upload ảnh trực tiếp

Server nhận file, đẩy thẳng lên S3.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/media/images/upload` |
| **Auth** | Bắt buộc — access token có permission `media.create` |
| **Content-Type** | `multipart/form-data` |

### Request (form-data)

| Field | Type | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `files` | File[] | ✓ | Tối đa **2** file; mỗi file phải là ảnh (`image/*`); mỗi file **≤ 5MB** |

Nếu file sai định dạng hoặc vượt dung lượng → **422 Unprocessable Entity**.

### Response `data`

Mảng, mỗi phần tử ứng với 1 file đã upload:

```jsonc
[
  {
    "url": "https://<bucket>.s3.<region>.amazonaws.com/images/1699999999999-xxxx.png",
    "fileName": "1699999999999-xxxx.png",
    "contentType": "image/png"
  }
]
```

### Ví dụ curl

```bash
curl -X POST "http://localhost:3000/api/v1/media/images/upload" \
  -H "Authorization: Bearer <ACCESS_TOKEN>" \
  -F "files=@./photo1.png" \
  -F "files=@./photo2.jpg"
```

---

## 2. Lấy presigned URL (upload trực tiếp lên S3 từ client)

Trả về URL đã ký để client tự `PUT` file lên S3, không đi qua server. Đồng thời tạo sẵn 1 bản ghi `Media` với trạng thái `PENDING`.

| | |
|---|---|
| **Method** | `POST` |
| **Path** | `/media/images/presign-url` |
| **Auth** | Public (không cần token) |
| **Content-Type** | `application/json` |

### Request body

| Field | Type | Bắt buộc | Mô tả |
|---|---|---|---|
| `fileName` | string | ✓ | Tên file gốc (dùng để lấy phần đuôi `.png/.jpg...` và suy ra content-type) |

```json
{ "fileName": "photo.png" }
```

### Response `data`

```jsonc
{
  "presignedUrl": "https://<bucket>.s3.<region>.amazonaws.com/images/1699999999999-xxxx.png?X-Amz-Algorithm=...&X-Amz-Signature=...",
  "url": "https://<bucket>.s3.<region>.amazonaws.com/images/1699999999999-xxxx.png"
}
```

- `presignedUrl`: URL đã ký, dùng để `PUT` file. **Hết hạn sau 1 giờ (3600s).**
- `url`: URL public cuối cùng của ảnh sau khi upload xong (phần trước dấu `?`).

### Luồng sử dụng (2 bước)

**Bước 1 — Lấy presigned URL**

```bash
curl -X POST "http://localhost:3000/api/v1/media/images/presign-url" \
  -H "Content-Type: application/json" \
  -d '{ "fileName": "photo.png" }'
```

**Bước 2 — Client PUT file lên S3**

`Content-Type` khi PUT **phải trùng** với content-type đã ký (suy ra từ đuôi `fileName`), nếu không S3 sẽ trả `SignatureDoesNotMatch`.

```bash
curl -X PUT "<presignedUrl>" \
  -H "Content-Type: image/png" \
  --data-binary "@./photo.png"
```

Sau khi PUT thành công, ảnh truy cập được tại `url`.

> **Ghi chú:** Bản ghi `Media` được tạo với status `PENDING`. Các bản ghi `PENDING` cũ hơn 24h sẽ bị cron dọn tự động (chạy mỗi ngày lúc nửa đêm). Nếu có bước xác nhận upload xong, hãy cập nhật status sang `READY` để bản ghi không bị xóa.
