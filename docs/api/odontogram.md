# Odontogram API

API quản lý **sơ đồ răng (odontogram)** của bệnh nhân: khởi tạo bộ răng mặc định, xem trạng thái từng răng, cập nhật trạng thái (có ghi lịch sử), và tra cứu lịch sử thay đổi trạng thái của một chiếc răng.

- **Base URL**: `/api/v1`
- **Authentication**: tất cả endpoint đều đi qua global `AuthenticationGuard` → cần gửi **access token**:
  ```
  Authorization: Bearer <access_token>
  ```
  (Module hiện chưa gắn `@PermissionKey` nên chỉ cần đăng nhập hợp lệ, không yêu cầu quyền riêng.)

## Mô hình dữ liệu

### `ToothState` (enum trạng thái răng)
`NORMAL` · `DECAY` (sâu) · `FILLED` (trám) · `CROWN` (bọc mão) · `ROOT_CANAL` (lấy tủy) · `EXTRACTED` (đã nhổ) · `IMPLANT` · `MISSING` (mất) · `VENEER`.

### `PatientTooth` (trạng thái hiện tại của một răng)
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `id` | string (cuid) | ID răng |
| `patientId` | string | Bệnh nhân sở hữu |
| `toothNumber` | number | Số hiệu răng theo chuẩn FDI |
| `state` | `ToothState` | Trạng thái hiện tại (mặc định `NORMAL`) |
| `note` | string \| null | Ghi chú |
| `createdAt` | string (ISO date) | |
| `updatedAt` | string (ISO date) | |

### `ToothStateHistory` (lịch sử thay đổi trạng thái)
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `id` | string (cuid) | |
| `patientToothId` | string | Trỏ tới `PatientTooth` |
| `state` | `ToothState` | Trạng thái tại thời điểm thay đổi |
| `changedById` | string \| null | ID người thực hiện |
| `createdAt` | string (ISO date) | Thời điểm thay đổi |
| `changedBy` | object \| null | Thông tin người thay đổi: `{ id, fullName, avatar }` |

> Số hiệu răng dùng chuẩn **FDI (ISO 3950)**: 32 răng vĩnh viễn `11–18, 21–28, 31–38, 41–48`.

---

## POST `/api/v1/odontogram`

Khởi tạo sơ đồ răng mặc định cho một bệnh nhân: tạo **32 răng vĩnh viễn** (FDI) với `state = NORMAL`. Thường được gọi tự động khi tạo bệnh nhân mới.

**Request body**
| Field | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `patientId` | string | ✅ | ID bệnh nhân cần khởi tạo sơ đồ răng |

```json
{
  "patientId": "clx123abc456"
}
```

**Response** `201 Created`
```json
"This action adds a new odontogram"
```

> Ghi chú: 32 bản ghi `PatientTooth` được tạo bằng `createMany`. Nếu bệnh nhân đã có răng trùng `toothNumber` sẽ vi phạm ràng buộc unique `(patientId, toothNumber)`.

---

## GET `/api/v1/odontogram`

Lấy **toàn bộ răng** (trạng thái hiện tại) của một bệnh nhân — dùng để render sơ đồ răng. Không phân trang.

**Query params**
| Param | Kiểu | Bắt buộc | Mô tả |
|-------|------|----------|-------|
| `patientId` | string | ✅ | Lọc theo bệnh nhân |

**Ví dụ**
```
GET /api/v1/odontogram?patientId=clx123abc456
```

**Response** `200 OK` — mảng `PatientTooth[]`
```json
[
  {
    "id": "clt001",
    "patientId": "clx123abc456",
    "toothNumber": 11,
    "state": "NORMAL",
    "note": null,
    "createdAt": "2026-08-15T03:00:00.000Z",
    "updatedAt": "2026-08-15T03:00:00.000Z"
  }
]
```

---

## GET `/api/v1/odontogram/history`

Lấy **lịch sử thay đổi trạng thái** của một chiếc răng cụ thể (theo `patientId` + `toothNumber`), có phân trang, sắp xếp mới nhất trước.

**Query params**
| Param | Kiểu | Bắt buộc | Mặc định | Mô tả |
|-------|------|----------|----------|-------|
| `patientId` | string | ✅ | — | Bệnh nhân |
| `toothNumber` | number | ✅ | — | Số hiệu răng (FDI) |
| `page` | number | ❌ | `1` | Trang (≥ 1) |
| `pageSize` | number | ❌ | `10` | Số bản ghi/trang (1–200) |

**Ví dụ**
```
GET /api/v1/odontogram/history?patientId=clx123abc456&toothNumber=11&page=1&pageSize=20
```

**Response** `200 OK`
```json
{
  "data": [
    {
      "id": "clh900",
      "patientToothId": "clt001",
      "state": "FILLED",
      "changedById": "clu777",
      "createdAt": "2026-08-15T04:30:00.000Z",
      "changedBy": {
        "id": "clu777",
        "fullName": "BS. Nguyễn Văn A",
        "avatar": null
      }
    }
  ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

## PUT `/api/v1/odontogram/:id`

Cập nhật trạng thái/ghi chú của **một chiếc răng**. Thao tác chạy trong một transaction: cập nhật `PatientTooth` rồi tạo một bản ghi `ToothStateHistory` ghi nhận trạng thái mới cùng người thực hiện (lấy từ access token).

**Path params**
| Param | Kiểu | Mô tả |
|-------|------|-------|
| `id` | string | ID của `PatientTooth` cần cập nhật |

**Request body** (tất cả optional)
| Field | Kiểu | Mô tả |
|-------|------|-------|
| `state` | `ToothState` | Trạng thái mới |
| `note` | string | Ghi chú |

```json
{
  "state": "FILLED",
  "note": "Trám composite mặt nhai"
}
```

**Response** `200 OK` — bản ghi `PatientTooth` sau cập nhật
```json
{
  "id": "clt001",
  "patientId": "clx123abc456",
  "toothNumber": 11,
  "state": "FILLED",
  "note": "Trám composite mặt nhai",
  "createdAt": "2026-08-15T03:00:00.000Z",
  "updatedAt": "2026-08-15T04:30:00.000Z"
}
```

> `changedById` của lịch sử được lấy từ `userId` trong access token, không truyền qua body. Mỗi lần gọi PUT đều sinh một bản ghi lịch sử (kể cả khi chỉ đổi `note`).
