# Services API

Tài liệu cho `ServicesController` / `ServicesService` — quản lý **dịch vụ nha khoa** (CRUD, có soft-delete và kiểm tra nhóm dịch vụ).

> Module này đã được wire vào database (Prisma). Mỗi service thuộc về một `ServiceCategory` (xem thêm module `service-categories`).

## Thông tin chung

| | |
|---|---|
| Base URL | `http://localhost:{PORT}/api/v1` (mặc định `PORT=3000`) |
| Nhóm route | `/services` |
| Auth | Hiện **không** có guard nào áp lên controller — các endpoint đang mở (chưa yêu cầu token) |
| Validation | `nestjs-zod` (`ZodValidationPipe` toàn cục) |
| Content-Type | `application/json` |

### Envelope response (toàn cục)

Mọi response thành công đều được `TransformInterceptor` bọc lại:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* dữ liệu thật của endpoint */ },
  "timestamp": "2026-07-29T00:00:00.000Z",
  "path": "/api/v1/services"
}
```

- Nếu controller trả về chuỗi (vd khi xoá), chuỗi đó nằm ở `data`, còn `message` vẫn là `"Success"`.
- Các ví dụ response bên dưới chỉ ghi phần **`data`** cho gọn.

---

## Endpoints

| Method | Path | Mô tả |
|---|---|---|
| POST | `/services` | Tạo dịch vụ mới |
| GET | `/services` | Danh sách dịch vụ (chưa bị xoá) |
| GET | `/services/:id` | Chi tiết một dịch vụ |
| PUT | `/services/:id` | Cập nhật dịch vụ |
| DELETE | `/services/:id` | Xoá mềm (soft delete) dịch vụ |

---

### POST `/services`

Tạo dịch vụ mới. Trước khi tạo sẽ kiểm tra `categoryId` có tồn tại không.

**Request body**

```json
{
  "code": "NT001",
  "name": "Trám răng thẩm mỹ Composite",
  "description": "Trám răng bằng vật liệu composite",
  "categoryId": "clx...",
  "price": 300000,
  "priceMax": 500000,
  "unit": "TOOTH",
  "durationMinutes": 30,
  "requiresTooth": true,
  "toothStateAfter": "FILLED",
  "color": "#3B82F6",
  "displayOrder": 1,
  "isActive": true,
  "commissionRate": 10
}
```

| Field | Kiểu | Bắt buộc | Ràng buộc / Ghi chú |
|---|---|:---:|---|
| `code` | string | ✅ | tối thiểu 1 ký tự; mã nội bộ, **unique** |
| `name` | string | ✅ | tối thiểu 1 ký tự |
| `description` | string | ❌ | |
| `categoryId` | string | ✅ | id của `ServiceCategory`, phải tồn tại |
| `price` | number | ✅ | ≥ 0 — giá cơ bản (VND) |
| `priceMax` | number | ❌ | ≥ 0 — giá cao nhất nếu là khoảng giá |
| `unit` | enum | ❌ | `ServiceUnit`, mặc định DB `SESSION` |
| `durationMinutes` | number | ❌ | số nguyên > 0; mặc định DB `30` |
| `requiresTooth` | boolean | ❌ | mặc định DB `false` |
| `toothStateAfter` | enum | ❌ | `ToothState` — trạng thái răng sau khi làm |
| `color` | string | ❌ | mã màu hex hiển thị trên lịch |
| `displayOrder` | number | ❌ | số nguyên; mặc định DB `0` |
| `isActive` | boolean | ❌ | mặc định DB `true` |
| `commissionRate` | number | ❌ | 0–100 (% hoa hồng, phase 2) |

**Response** `201` — object `Service` vừa tạo.

**Lỗi**

| Trường hợp | HTTP | Message |
|---|---|---|
| `categoryId` không tồn tại | 404 | `Nhóm dịch vụ #<id> không tồn tại` |
| Body sai schema | 422 | lỗi Zod |
| `code` trùng | 409/500 | vi phạm unique (qua `PrismaExceptionFilter`) |

---

### GET `/services`

Lấy danh sách dịch vụ **chưa bị xoá mềm** (`deletedAt = null`), kèm thông tin `category`. Sắp xếp theo `displayOrder` tăng dần, rồi `name`.

**Response** `200`

```json
[
  {
    "id": "clx...",
    "code": "NT001",
    "name": "Trám răng thẩm mỹ Composite",
    "categoryId": "clc...",
    "price": "300000",
    "priceMax": "500000",
    "unit": "TOOTH",
    "durationMinutes": 30,
    "requiresTooth": true,
    "toothStateAfter": "FILLED",
    "color": "#3B82F6",
    "displayOrder": 1,
    "isActive": true,
    "commissionRate": "10.00",
    "createdAt": "2026-07-29T00:00:00.000Z",
    "updatedAt": "2026-07-29T00:00:00.000Z",
    "deletedAt": null,
    "category": {
      "id": "clc...",
      "code": "general",
      "name": "Nha tổng quát",
      "displayOrder": 0,
      "isActive": true
    }
  }
]
```

> Các field `price`, `priceMax`, `commissionRate` là kiểu `Decimal` trong Prisma nên serialize thành **chuỗi**.

---

### GET `/services/:id`

Chi tiết một dịch vụ (chưa bị xoá), kèm `category`.

**Response** `200` — object `Service` (như phần tử ở `GET /services`).

**Lỗi**

| Trường hợp | HTTP | Message |
|---|---|---|
| Không tìm thấy / đã bị xoá | 404 | `Dịch vụ #<id> không tồn tại` |

---

### PUT `/services/:id`

Cập nhật dịch vụ. Kiểm tra dịch vụ tồn tại; nếu body có `categoryId` thì kiểm tra nhóm dịch vụ tồn tại.

**Request body** — mọi field của `POST` nhưng **tất cả đều optional** (partial). Ví dụ:

```json
{
  "price": 350000,
  "isActive": false
}
```

**Response** `200` — object `Service` sau khi cập nhật.

**Lỗi**

| Trường hợp | HTTP | Message |
|---|---|---|
| Dịch vụ không tồn tại | 404 | `Dịch vụ #<id> không tồn tại` |
| `categoryId` mới không tồn tại | 404 | `Nhóm dịch vụ #<id> không tồn tại` |

---

### DELETE `/services/:id`

**Xoá mềm** — set `deletedAt = now()`, không xoá bản ghi thật. Dịch vụ đã xoá sẽ không còn xuất hiện ở `GET /services` và `GET /services/:id`.

**Response** `200`

```json
"Đã xóa thành công dịch vụ #<id>"
```

**Lỗi**

| Trường hợp | HTTP | Message |
|---|---|---|
| Dịch vụ không tồn tại | 404 | `Dịch vụ #<id> không tồn tại` |

---

## Enum tham chiếu

### `ServiceUnit` — đơn vị tính

| Giá trị | Ý nghĩa |
|---|---|
| `TOOTH` | /răng — trám, nhổ, bọc mão đơn lẻ |
| `SESSION` | /lần — khám, cạo vôi, tẩy trắng 1 buổi (mặc định) |
| `CASE` | /ca — niềng răng, implant (trọn gói) |
| `ARCH` | /cung răng — niềng nửa hàm |
| `JAW` | /hàm — hàm giả tháo lắp |
| `UNIT` | /đơn vị — mặc định chung |

### `ToothState` — trạng thái răng

| Giá trị | Ý nghĩa |
|---|---|
| `NORMAL` | Bình thường |
| `DECAY` | Sâu răng |
| `FILLED` | Đã trám |
| `CROWN` | Đã bọc mão sứ |
| `ROOT_CANAL` | Đã điều trị tủy |
| `EXTRACTED` | Đã nhổ |
| `IMPLANT` | Implant |
| `MISSING` | Thiếu răng (chưa có implant) |
| `VENEER` | Dán sứ |

## Model `Service` (Prisma)

Bảng `services`. Các cột chính: `id` (cuid), `code` (unique), `name`, `description?`, `categoryId` → `ServiceCategory`, `price`/`priceMax` (`Decimal(12,0)`), `unit`, `durationMinutes`, `requiresTooth`, `toothStateAfter?`, `color?`, `displayOrder`, `isActive`, `commissionRate?` (`Decimal(5,2)`), `createdAt`, `updatedAt`, `deletedAt?` (soft delete). Index trên `categoryId`, `(isActive, displayOrder)`, `code`.
