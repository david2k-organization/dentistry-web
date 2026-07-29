# Patients API

Quản lý hồ sơ bệnh nhân. Controller: `src/modules/patients/patients.controller.ts`
Base path: `/api/v1/patient` (global prefix `api/v1` được set trong `src/main.ts`).

## Xác thực

Toàn bộ controller gắn `@Auth([AUTH_TYPE.BEARER])` ở class level, trừ khi override ở method:

| Endpoint | Auth |
|---|---|
| `POST /patient` | Bearer token (bắt buộc) |
| `GET /patient` | Bearer **hoặc** API Key (`condition: OR`) |
| `GET /patient/:id` | Bearer token (kế thừa từ class) |
| `PUT /patient/:id` | Bearer token (kế thừa từ class) |
| `DELETE /patient/:id` | Bearer token (kế thừa từ class) |

Bearer token gửi qua header `Authorization: Bearer <access_token>`.

## Envelope response

Response thành công được `TransformInterceptor` bọc lại:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* payload thực tế */ },
  "timestamp": "2026-07-29T00:00:00.000Z",
  "path": "/api/v1/patient"
}
```

Response lỗi (từ `HttpExceptionFilter` / `ZodExceptionFilter` / `PrismaExceptionFilter`):

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email" }],
  "data": null
}
```

## Model `Patient`

Nguồn: `prisma/schema.prisma`.

| Field | Type | Ghi chú |
|---|---|---|
| `id` | `string` (cuid) | PK |
| `fullName` | `string` | bắt buộc |
| `phone` | `string \| null` | unique |
| `email` | `string \| null` | unique |
| `avatar` | `string \| null` | chưa có endpoint upload |
| `dateOfBirth` | `string (ISO datetime) \| null` | |
| `gender` | `"MALE" \| "FEMALE" \| "OTHER" \| null` | |
| `notes` | `string \| null` | |
| `createdAt` | `string (ISO datetime)` | |
| `updatedAt` | `string (ISO datetime)` | |
| `deletedAt` | `string (ISO datetime) \| null` | dùng cho soft delete |

## DTO validate (Zod)

`CreatePatientDto` (`src/modules/patients/dto/create-patient.dto.ts`):

```ts
{
  fullName: string (1–255 ký tự, bắt buộc),
  phone?: string (1–20 ký tự),
  email?: string (email hợp lệ, tối đa 255 ký tự),
  dateOfBirth?: string (ISO datetime, có offset),
  gender?: "MALE" | "FEMALE" | "OTHER",
  notes?: string (tối đa 2000 ký tự),
}
```

`UpdatePatientDto` = `CreatePatientDto.partial()` (mọi field đều optional).

---

## `POST /patient` — Tạo bệnh nhân

**Auth**: Bearer

**Body**: `CreatePatientDto`

```json
{
  "fullName": "Nguyễn Văn A",
  "phone": "0901234567",
  "email": "a@example.com",
  "dateOfBirth": "1990-01-01T00:00:00Z",
  "gender": "MALE",
  "notes": "Dị ứng thuốc tê"
}
```

**Response 201**: object `Patient` vừa tạo.

**Lỗi**:
- `422 Unprocessable Entity` — sai định dạng field (validate Zod).
- `409 Conflict` — `phone` hoặc `email` đã tồn tại (unique constraint).

---

## `GET /patient` — Lấy danh sách bệnh nhân

**Auth**: Bearer hoặc API Key

**Query params**: không có (chưa hỗ trợ phân trang/filter).

**Response 200**: mảng `Patient[]`.

> ⚠️ **Lưu ý**: `findAll()` gọi `prisma.patient.findMany()` không có điều kiện lọc — bệnh nhân đã soft-delete (`deletedAt` khác null) vẫn được trả về.

---

## `GET /patient/:id` — Lấy chi tiết 1 bệnh nhân

**Auth**: Bearer

**Path param**: `id` (string, cuid)

**Response 200**: object `Patient`, hoặc `null` nếu không tìm thấy (endpoint hiện **không** throw `404` — service dùng `findFirst`, trả `null` thẳng vào `data`).

---

## `PUT /patient/:id` — Cập nhật bệnh nhân

**Auth**: Bearer

**Path param**: `id` (string, cuid)

**Body**: `UpdatePatientDto` (partial của `CreatePatientDto`)

> ⚠️ **Chưa wire database**: `PatientsService.update()` hiện chỉ `console.log` và trả về chuỗi `` `This action updates a #${id} patient` ``, **không** ghi xuống DB. Cần cập nhật service này trước khi dùng endpoint trong thực tế.

**Response hiện tại (200)**:
```json
{ "data": "This action updates a #<id> patient" }
```

---

## `DELETE /patient/:id` — Xoá bệnh nhân (soft delete)

**Auth**: Bearer

**Path param**: `id` (string, cuid)

**Hành vi**: kiểm tra bệnh nhân tồn tại, sau đó set `deletedAt = now()` (không xoá cứng bản ghi).

**Response 200**:
```json
{ "data": "Đã xóa thành công bệnh nhân #<id>" }
```

**Lỗi**:
- `404 Not Found` — không tìm thấy bệnh nhân (`NotFoundException('Bệnh nhân không tồn tại')`).

---

## Known limitations (cần fix trước khi lên production)

1. `update()` chưa gọi Prisma — mọi request `PUT` đều "thành công giả".
2. `findAll()` / `findOne()` không loại trừ bản ghi đã soft-delete (`deletedAt`).
3. `findOne()` không throw `404` khi không tìm thấy, trả `null`.
4. `GET /patient` chưa có phân trang, tìm kiếm theo tên/sđt, hay filter theo `gender`.
