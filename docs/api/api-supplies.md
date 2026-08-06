# API: Supplies (Vật tư)

Quản lý vật tư của phòng khám: CRUD và đồng bộ tồn kho qua nhật ký kho.

- **Base URL**: `http://localhost:3000/api/v1` (prefix toàn cục `api/v1` đặt trong `main.ts`).
- **Content-Type**: `application/json`.
- **Validation**: dùng `nestjs-zod` (`ZodValidationPipe` toàn cục). Sai schema → trả `400` với danh sách lỗi từ Zod.
- **Response list**: trả về `{ data, meta }` với `meta = { page, pageSize, total, totalPages }`.

> Liên quan: nhật ký kho xem tại [api-warehouse-logs.md](./api-warehouse-logs.md).

---

## Kiểu dữ liệu

### Enum `SupplyUnit` (đơn vị vật tư)
| Giá trị | Ý nghĩa |
|---|---|
| `BOX` | hộp |
| `TUBE` | tuýp |
| `BLISTER` | vỉ |
| `AMPOULE` | ống |
| `PACK` | gói |
| `PIECE` | cái |

### Đối tượng `Supply`
| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | string (cuid) | khóa chính |
| `code` | string | mã vật tư, **duy nhất**, 1–50 ký tự |
| `name` | string | tên, 1–255 ký tự |
| `quantity` | int | tồn kho hiện tại (≥ 0) |
| `quota` | int | định mức tồn tối thiểu (≥ 0) |
| `unit` | `SupplyUnit` | đơn vị |
| `supplier` | string | nhà cung cấp, 1–255 ký tự |
| `note` | string? | ghi chú, tối đa 500 ký tự |
| `createdAt` | datetime | |
| `updatedAt` | datetime | |

### Phân trang (dùng cho endpoint danh sách)
| Tham số | Kiểu | Mặc định | Ràng buộc |
|---|---|---|---|
| `page` | number | `1` | số nguyên ≥ 1 |
| `pageSize` | number | `10` | số nguyên 1–200 |

---

## 1. Tạo vật tư — `POST /supplies`

Body:
| Trường | Bắt buộc | Kiểu | Ràng buộc |
|---|---|---|---|
| `code` | ✅ | string | 1–50 ký tự, không trùng |
| `name` | ✅ | string | 1–255 ký tự |
| `quantity` | ✅ | int | ≥ 0 (tồn kho ban đầu) |
| `quota` | ✅ | int | ≥ 0 |
| `unit` | ✅ | `SupplyUnit` | 1 trong các giá trị enum |
| `supplier` | ✅ | string | 1–255 ký tự |
| `note` | ❌ | string | ≤ 500 ký tự |

> **Luồng xử lý:** vật tư được tạo với tồn = 0, sau đó nếu `quantity > 0` hệ thống tự sinh 1 warehouse log `IMPORT` để đưa tồn về đúng `quantity`. Nhờ vậy nhật ký kho luôn khớp với tồn thực tế.

**Request**
```http
POST /api/v1/supplies
Content-Type: application/json

{
  "code": "VT001",
  "name": "Găng tay y tế",
  "quantity": 100,
  "quota": 20,
  "unit": "BOX",
  "supplier": "Công ty ABC",
  "note": "Size M"
}
```

**Response `201`**
```json
{
  "id": "clx123abc...",
  "code": "VT001",
  "name": "Găng tay y tế",
  "quantity": 100,
  "quota": 20,
  "unit": "BOX",
  "supplier": "Công ty ABC",
  "note": "Size M",
  "createdAt": "2026-08-06T10:00:00.000Z",
  "updatedAt": "2026-08-06T10:00:00.000Z"
}
```

**Lỗi**
- `400` — sai/thiếu trường (Zod).
- `409` — `code` đã tồn tại (Prisma unique constraint).

---

## 2. Danh sách vật tư — `GET /supplies`

Query: `page`, `pageSize`, và:
| Tham số | Kiểu | Ghi chú |
|---|---|---|
| `searchKey` | string? | tìm gần đúng (không phân biệt hoa/thường) trên `name`, `code`, `supplier` |

**Request**
```http
GET /api/v1/supplies?page=1&pageSize=10&searchKey=găng
```

**Response `200`**
```json
{
  "data": [
    { "id": "clx123...", "code": "VT001", "name": "Găng tay y tế", "quantity": 100, "...": "..." }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

---

## 3. Chi tiết vật tư — `GET /supplies/:id`

**Response `200`**: đối tượng `Supply`.
**Lỗi**: `404` — `Không tìm thấy vật tư`.

---

## 4. Cập nhật vật tư — `PUT /supplies/:id`

Body: mọi trường của phần tạo, **đều optional** (chỉ gửi trường muốn đổi).

> **Lưu ý về tồn kho:** nếu body có `quantity` khác tồn hiện tại, hệ thống tự ghi 1 warehouse log cho phần chênh lệch (`IMPORT` nếu tăng, `EXPORT` nếu giảm) trong cùng transaction. Gửi `quantity < 0` → `400`.

**Request**
```http
PUT /api/v1/supplies/clx123abc...
Content-Type: application/json

{ "quantity": 80, "note": "Điều chỉnh kiểm kê" }
```

**Response `200`**: đối tượng `Supply` sau cập nhật.
**Lỗi**: `404` không tìm thấy; `400` `quantity < 0`.

---

## 5. Xóa vật tư — `DELETE /supplies/:id`

**Response `200`**
```json
"Đã xóa thành công vật tư #clx123abc..."
```
**Lỗi**: `404` — không tìm thấy.

---

## Ghi chú về đồng bộ tồn kho

Tồn kho (`Supplies.quantity`) chỉ nên thay đổi qua 3 đường, tất cả đều ghi warehouse log:
1. `POST /supplies` với `quantity > 0` → sinh log `IMPORT` khởi tạo.
2. `PUT /supplies/:id` đổi `quantity` → sinh log chênh lệch (`IMPORT`/`EXPORT`).
3. `POST /warehouse-logs` → cập nhật tồn theo `type` (xem [api-warehouse-logs.md](./api-warehouse-logs.md)).

Mọi thao tác cập nhật tồn + ghi log đều chạy trong **transaction**, đảm bảo tồn kho và nhật ký luôn nhất quán.
