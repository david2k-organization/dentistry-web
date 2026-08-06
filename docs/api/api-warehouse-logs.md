# API: Warehouse Logs (Nhật ký kho)

Ghi nhận mỗi lần nhập/xuất kho. Mỗi log đều **tự động cập nhật tồn kho** của vật tư tương ứng trong cùng transaction.

- **Base URL**: `http://localhost:3000/api/v1` (prefix toàn cục `api/v1` đặt trong `main.ts`).
- **Content-Type**: `application/json`.
- **Validation**: dùng `nestjs-zod` (`ZodValidationPipe` toàn cục). Sai schema → trả `400` với danh sách lỗi từ Zod.
- **Response list**: trả về `{ data, meta }` với `meta = { page, pageSize, total, totalPages }`.

> Liên quan: quản lý vật tư xem tại [api-supplies.md](./api-supplies.md).

---

## Kiểu dữ liệu

### Enum `WarehouseLogType` (loại giao dịch kho)
| Giá trị | Ý nghĩa |
|---|---|
| `IMPORT` | nhập kho (tăng tồn) |
| `EXPORT` | xuất kho (giảm tồn) |

### Đối tượng `WarehouseLog`
| Trường | Kiểu | Ghi chú |
|---|---|---|
| `id` | int | tự tăng |
| `suppliesId` | string | id vật tư liên quan |
| `type` | `WarehouseLogType` | `IMPORT` / `EXPORT` |
| `quantity` | int | số lượng của giao dịch (> 0) |
| `note` | string? | ghi chú, ≤ 500 ký tự |
| `createdAt` | datetime | |
| `supplies` | object | thông tin rút gọn của vật tư: `{ code, name, unit }` |

### Phân trang (dùng cho endpoint danh sách)
| Tham số | Kiểu | Mặc định | Ràng buộc |
|---|---|---|---|
| `page` | number | `1` | số nguyên ≥ 1 |
| `pageSize` | number | `10` | số nguyên 1–200 |

---

## 1. Tạo giao dịch kho — `POST /warehouse-logs`

Body:
| Trường | Bắt buộc | Kiểu | Ràng buộc |
|---|---|---|---|
| `suppliesId` | ✅ | string | id vật tư đang tồn tại |
| `type` | ✅ | `WarehouseLogType` | `IMPORT` hoặc `EXPORT` |
| `quantity` | ✅ | int | **> 0** (độ lớn giao dịch) |
| `note` | ❌ | string | ≤ 500 ký tự |

Tác động tồn kho:
- `IMPORT`: `tồn mới = tồn cũ + quantity`
- `EXPORT`: `tồn mới = tồn cũ − quantity`

**Request**
```http
POST /api/v1/warehouse-logs
Content-Type: application/json

{
  "suppliesId": "clx123abc...",
  "type": "EXPORT",
  "quantity": 10,
  "note": "Xuất dùng cho phòng khám 1"
}
```

**Response `201`**
```json
{
  "id": 5,
  "suppliesId": "clx123abc...",
  "type": "EXPORT",
  "quantity": 10,
  "note": "Xuất dùng cho phòng khám 1",
  "createdAt": "2026-08-06T11:00:00.000Z",
  "supplies": { "code": "VT001", "name": "Găng tay y tế", "unit": "BOX" }
}
```

**Lỗi**
- `400` — sai/thiếu trường (Zod); hoặc **`EXPORT` vượt quá tồn** → `Không đủ tồn kho để xuất. Tồn hiện tại: <n>`.
- `404` — `Không tìm thấy vật tư` (`suppliesId` không tồn tại).

---

## 2. Danh sách giao dịch kho — `GET /warehouse-logs`

Query: `page`, `pageSize`, và:
| Tham số | Kiểu | Ghi chú |
|---|---|---|
| `suppliesId` | string? | lọc theo vật tư |
| `type` | `WarehouseLogType`? | lọc `IMPORT` / `EXPORT` |
| `searchKey` | string? | tìm gần đúng trên `note` (không phân biệt hoa/thường) |

Kết quả sắp xếp theo `createdAt` giảm dần (mới nhất trước).

**Request**
```http
GET /api/v1/warehouse-logs?page=1&pageSize=10&suppliesId=clx123abc...&type=EXPORT
```

**Response `200`**
```json
{
  "data": [
    {
      "id": 5,
      "suppliesId": "clx123abc...",
      "type": "EXPORT",
      "quantity": 10,
      "note": "Xuất dùng cho phòng khám 1",
      "createdAt": "2026-08-06T11:00:00.000Z",
      "supplies": { "code": "VT001", "name": "Găng tay y tế", "unit": "BOX" }
    }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

---

## Ghi chú

- Đây là module chỉ hỗ trợ **tạo** và **liệt kê** (không có sửa/xóa log — nhật ký kho là bất biến).
- Tồn kho của vật tư còn được thay đổi gián tiếp khi tạo/cập nhật vật tư; xem phần "Đồng bộ tồn kho" trong [api-supplies.md](./api-supplies.md).
