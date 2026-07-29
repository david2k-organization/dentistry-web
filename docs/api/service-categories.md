# Service Categories API

Quản lý danh mục dịch vụ nha khoa (VD: Nha tổng quát, Chỉnh nha, Cấy ghép Implant). Controller: `src/modules/service-categories/service-categories.controller.ts`
Base path: `/api/v1/service-categories` (global prefix `api/v1` được set trong `src/main.ts`).

## Xác thực

> ⚠️ Controller **chưa gắn** `@Auth(...)` ở class hay method nào — toàn bộ endpoint hiện đang **public**, không yêu cầu Bearer token hay API Key. Cần bổ sung guard trước khi lên production (xem [Known limitations](#known-limitations-cần-fix-trước-khi-lên-production)).

## Envelope response

Response thành công được `TransformInterceptor` bọc lại:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* payload thực tế */ },
  "timestamp": "2026-07-29T00:00:00.000Z",
  "path": "/api/v1/service-categories"
}
```

Response lỗi (từ `HttpExceptionFilter` / `ZodExceptionFilter` / `PrismaExceptionFilter`):

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "code", "message": "String must contain at least 1 character(s)" }],
  "data": null
}
```

## Model `ServiceCategory`

Nguồn: `prisma/schema.prisma`.

| Field | Type | Ghi chú |
|---|---|---|
| `id` | `string` (cuid) | PK |
| `code` | `string` | unique, slug nội bộ (VD: `"general"`, `"ortho"`, `"implant"`) |
| `name` | `string` | bắt buộc (VD: `"Nha tổng quát"`) |
| `description` | `string \| null` | |
| `displayOrder` | `number` | mặc định `0`, dùng để sắp xếp thứ tự hiển thị |
| `isActive` | `boolean` | mặc định `true` |
| `createdAt` | `string (ISO datetime)` | |
| `updatedAt` | `string (ISO datetime)` | |
| `services` | `Service[]` | quan hệ 1-n, không trả kèm trong các endpoint hiện tại (không có `include`) |

## DTO validate (Zod)

`CreateServiceCategoryDto` (`src/modules/service-categories/dto/create-service-category.dto.ts`):

```ts
{
  code: string (>= 1 ký tự, bắt buộc),
  name: string (>= 1 ký tự, bắt buộc),
  description?: string,
  displayOrder?: number (int),
  isActive?: boolean,
}
```

`UpdateServiceCategoryDto` = `CreateServiceCategorySchema.partial()` (mọi field đều optional).

---

## `POST /service-categories` — Tạo danh mục dịch vụ

**Auth**: không (public)

**Body**: `CreateServiceCategoryDto`

```json
{
  "code": "ortho",
  "name": "Chỉnh nha",
  "description": "Niềng răng, chỉnh nha thẩm mỹ",
  "displayOrder": 2,
  "isActive": true
}
```

**Response 201**: object `ServiceCategory` vừa tạo.

**Lỗi**:
- `422 Unprocessable Entity` — sai định dạng field (validate Zod).
- `409 Conflict` — `code` đã tồn tại (unique constraint, xử lý bởi `PrismaExceptionFilter`).

---

## `GET /service-categories` — Lấy danh sách danh mục

**Auth**: không (public)

**Query params**: không có (chưa hỗ trợ phân trang/filter theo `isActive`).

**Response 200**: mảng `ServiceCategory[]`, sắp xếp theo `displayOrder` tăng dần (`orderBy: { displayOrder: 'asc' }`).

> ⚠️ **Lưu ý**: không lọc theo `isActive` — danh mục đã bị vô hiệu hoá (`isActive: false`) vẫn được trả về.

---

## `GET /service-categories/:id` — Lấy chi tiết 1 danh mục

**Auth**: không (public)

**Path param**: `id` (string, cuid)

**Response 200**: object `ServiceCategory`.

**Lỗi**:
- `404 Not Found` — không tìm thấy danh mục (`NotFoundException('Không tìm thấy danh mục dịch vụ #<id>')`).

---

## `PUT /service-categories/:id` — Cập nhật danh mục

**Auth**: không (public)

**Path param**: `id` (string, cuid)

**Body**: `UpdateServiceCategoryDto` (partial của `CreateServiceCategoryDto`)

**Hành vi**: kiểm tra danh mục tồn tại (`findOne`, throw `404` nếu không có) rồi `prisma.serviceCategory.update()`.

**Response 200**: object `ServiceCategory` sau khi cập nhật.

**Lỗi**:
- `404 Not Found` — không tìm thấy danh mục.
- `422 Unprocessable Entity` — sai định dạng field.
- `409 Conflict` — đổi `code` trùng với danh mục khác.

---

## `DELETE /service-categories/:id` — Xoá danh mục

**Auth**: không (public)

**Path param**: `id` (string, cuid)

**Hành vi**: kiểm tra tồn tại (`404` nếu không có) rồi **xoá cứng** (`prisma.serviceCategory.delete()`) — không phải soft delete.

**Response 200**: object `ServiceCategory` vừa bị xoá.

**Lỗi**:
- `404 Not Found` — không tìm thấy danh mục.
- `409 Conflict` — danh mục đang được `Service` khác tham chiếu (foreign key constraint), nếu quan hệ không có `onDelete: Cascade`.

---

## Known limitations (cần fix trước khi lên production)

1. Toàn bộ endpoint **không có xác thực** — bất kỳ ai cũng tạo/sửa/xoá được danh mục dịch vụ.
2. `GET /service-categories` không hỗ trợ phân trang, tìm kiếm theo `name`/`code`, hay filter theo `isActive`.
3. `DELETE /service-categories/:id` xoá cứng, không soft delete như `Patient` — cần cân nhắc vì `ServiceCategory` có quan hệ `services: Service[]`.
4. Response của `GET :id` không kèm danh sách `services` liên quan (không có `include`).
