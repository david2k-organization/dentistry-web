# Order API

Tài liệu cho module **orders** (`src/modules/orders`).

- **Base URL**: `http://localhost:3000/api/v1` (prefix `api/v1` được set trong `main.ts`; port lấy từ `PORT`, mặc định `3000`).
- **Xác thực**: mọi endpoint đều đi qua global `AuthenticationGuard`. Cần gửi header:

  ```
  Authorization: Bearer <access_token>
  ```

  Ngoài việc token hợp lệ, role của người dùng phải có **permission** khớp `path` + `method` của endpoint, nếu không sẽ trả `401 Unauthorized`.
- **Content-Type**: `application/json`.
- **Số tiền** (`totalAmount`, `unitPrice`, `amount`) là kiểu `Decimal` trong DB → khi trả về JSON sẽ ở dạng **chuỗi** (vd `"1500000"`).

---

## Model

### Order

| Field         | Kiểu                | Ghi chú                                        |
| ------------- | ------------------- | ---------------------------------------------- |
| `id`          | string (cuid)       | Khóa chính                                     |
| `code`        | string              | Mã đơn, duy nhất, dạng `ORD-XXXXXXXX`          |
| `patientId`   | string              | FK → patient                                   |
| `doctorId`    | string              | FK → user (bác sĩ)                             |
| `totalAmount` | Decimal (string)    | Tổng tiền                                       |
| `status`      | enum `OrderStatus`  | `CREATED` \| `PENDING` \| `PAID` \| `CANCELLED` \| `REFUNDED` |
| `note`        | string \| null      | Ghi chú đơn hàng (tùy chọn)                     |
| `cancelReason`| string \| null      | Lý do hủy (tùy chọn, thường set khi hủy đơn)    |
| `createdBy`   | string              | userId lấy từ access token                     |
| `createdAt`   | datetime            |                                                |
| `updatedAt`   | datetime            |                                                |
| `services`    | OrderItem[]         | Danh sách dịch vụ của đơn (quan hệ)            |

### OrderItem

| Field       | Kiểu             | Ghi chú                     |
| ----------- | ---------------- | --------------------------- |
| `id`        | string (cuid)    | Khóa chính                  |
| `orderId`   | string           | FK → order                  |
| `serviceId` | string           | FK → service                |
| `quantity`  | number (int)     | Số lượng                    |
| `unitPrice` | Decimal (string) | Đơn giá                     |
| `amount`    | Decimal (string) | Thành tiền                  |
| `note`      | string \| null   | Ghi chú (tùy chọn)          |

Trong response, mỗi `services[]` được include kèm `patient.fullName`, `doctor.fullName` (ở cấp order) và `service { code, name, unit }` (ở cấp item).

---

## Endpoints

### 1. Tạo đơn hàng

```
POST /api/v1/orders
```

**Body**

| Field         | Kiểu       | Bắt buộc | Ghi chú                                                    |
| ------------- | ---------- | -------- | ---------------------------------------------------------- |
| `patientId`   | string     | ✅       |                                                            |
| `doctorId`    | string     | ✅       |                                                            |
| `totalAmount` | number     | ✅       |                                                            |
| `services`    | OrderItem[]| ✅       | Mỗi phần tử: `serviceId`, `quantity`, `unitPrice`, `amount`, `note?` |
| `note`        | string     | ❌       | Ghi chú đơn hàng                                           |
| `status`      | enum       | ❌       | **Bị bỏ qua** — server luôn set `CREATED`                  |
| `code`        | string     | ❌       | **Bị bỏ qua** — server tự sinh `ORD-XXXXXXXX`              |

> `cancelReason` không nhận ở `POST` — chỉ dùng khi cập nhật/hủy đơn (xem `PUT`).

> `createdBy` được lấy từ access token, không truyền trong body.

**Ví dụ request**

```json
{
  "patientId": "clx_patient_123",
  "doctorId": "clx_doctor_456",
  "totalAmount": 1500000,
  "note": "Khách hẹn tái khám sau 1 tuần",
  "services": [
    {
      "serviceId": "clx_service_789",
      "quantity": 1,
      "unitPrice": 1000000,
      "amount": 1000000,
      "note": "Nhổ răng khôn"
    },
    {
      "serviceId": "clx_service_790",
      "quantity": 2,
      "unitPrice": 250000,
      "amount": 500000
    }
  ]
}
```

**Response `201`**

```json
{
  "id": "clx_order_abc",
  "code": "ORD-7F3K9Q2A",
  "patientId": "clx_patient_123",
  "doctorId": "clx_doctor_456",
  "totalAmount": "1500000",
  "status": "CREATED",
  "note": "Khách hẹn tái khám sau 1 tuần",
  "cancelReason": null,
  "createdBy": "clx_user_current",
  "createdAt": "2026-08-10T09:00:00.000Z",
  "updatedAt": "2026-08-10T09:00:00.000Z",
  "patient": { "fullName": "Nguyễn Văn A" },
  "doctor": { "fullName": "BS. Trần Thị B" },
  "services": []
}
```

> ⚠️ **Lưu ý**: các `services` được ghi vào DB *sau* khi bản ghi order được đọc để trả về, nên mảng `services` trong response của `POST` sẽ **rỗng**. Gọi `GET /api/v1/orders/:id` để lấy đơn kèm danh sách dịch vụ đầy đủ.

---

### 2. Danh sách đơn hàng (có filter + phân trang)

```
GET /api/v1/orders
```

**Query params** (tất cả tùy chọn)

| Param       | Kiểu   | Mặc định | Ghi chú                                                        |
| ----------- | ------ | -------- | -------------------------------------------------------------- |
| `page`      | number | `1`      | ≥ 1                                                            |
| `pageSize`  | number | `10`     | 1–200                                                          |
| `code`      | string | –        | Tìm gần đúng theo mã đơn (`contains`, không phân biệt hoa/thường) |
| `patientId` | string | –        | Khớp chính xác                                                 |
| `doctorId`  | string | –        | Khớp chính xác                                                 |
| `startDate` | date   | –        | Lọc `createdAt >= startDate`                                   |
| `endDate`   | date   | –        | Lọc `createdAt <= endDate`                                     |

`startDate` / `endDate` nhận chuỗi ISO (`2026-08-01` hoặc `2026-08-01T00:00:00.000Z`). Có thể dùng riêng lẻ hoặc kết hợp.

> ⚠️ `endDate=2026-08-31` (không kèm giờ) sẽ được hiểu là `00:00:00` đầu ngày → đơn tạo trong ngày 31 có thể bị bỏ sót. Muốn "đến hết ngày" hãy gửi `endDate=2026-08-31T23:59:59.999Z`.

**Ví dụ**

```
GET /api/v1/orders?page=1&pageSize=20&code=ORD-&doctorId=clx_doctor_456&startDate=2026-08-01&endDate=2026-08-31T23:59:59.999Z
```

**Response `200`**

```json
{
  "data": [
    {
      "id": "clx_order_abc",
      "code": "ORD-7F3K9Q2A",
      "patientId": "clx_patient_123",
      "doctorId": "clx_doctor_456",
      "totalAmount": "1500000",
      "status": "CREATED",
      "note": "Khách hẹn tái khám sau 1 tuần",
      "cancelReason": null,
      "createdBy": "clx_user_current",
      "createdAt": "2026-08-10T09:00:00.000Z",
      "updatedAt": "2026-08-10T09:00:00.000Z",
      "patient": { "fullName": "Nguyễn Văn A" },
      "doctor": { "fullName": "BS. Trần Thị B" },
      "services": [
        {
          "id": "clx_item_1",
          "orderId": "clx_order_abc",
          "serviceId": "clx_service_789",
          "quantity": 1,
          "unitPrice": "1000000",
          "amount": "1000000",
          "note": "Nhổ răng khôn",
          "service": { "code": "SV001", "name": "Nhổ răng khôn", "unit": "SESSION" }
        }
      ]
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

Kết quả sắp xếp theo `createdAt` giảm dần (mới nhất trước).

---

### 3. Chi tiết đơn hàng

```
GET /api/v1/orders/:id
```

**Response `200`**: một object order kèm `patient`, `doctor`, `services[]` (như một phần tử trong `data` ở endpoint danh sách). Nếu không tìm thấy sẽ trả về `null`.

---

### 4. Cập nhật đơn hàng

```
PUT /api/v1/orders/:id
```

**Body**: giống `POST` nhưng các field order (`patientId`, `doctorId`, `totalAmount`, `status`, `note`) đều **tùy chọn**; `services` **bắt buộc**. Riêng `cancelReason` (lý do hủy) chỉ nhận ở endpoint này.

> ⚠️ Nếu `services` được gửi, toàn bộ order item cũ của đơn sẽ bị **xóa và thay thế** bằng danh sách mới (không phải merge). Muốn giữ nguyên item cũ thì hiện tại vẫn phải gửi lại đầy đủ danh sách.

**Ví dụ request** (cập nhật + hủy đơn)

```json
{
  "status": "CANCELLED",
  "cancelReason": "Khách đổi lịch, không thực hiện dịch vụ",
  "note": "Đã hoàn cọc cho khách",
  "services": [
    {
      "serviceId": "clx_service_789",
      "quantity": 1,
      "unitPrice": 1200000,
      "amount": 1200000
    }
  ]
}
```

> ℹ️ Hiện chưa có ràng buộc bắt buộc `cancelReason` khi `status = CANCELLED` — đây là quy ước sử dụng, không phải validate ở server.

**Response `200`**: order sau khi cập nhật, kèm `patient`, `doctor`, và `services[]` mới nhất.

---

## Mã lỗi thường gặp

| Status | Khi nào                                                                    |
| ------ | ------------------------------------------------------------------------- |
| `400`  | Body/query không hợp lệ (Zod validation) — trả về chi tiết field lỗi        |
| `401`  | Thiếu/không hợp lệ access token, hoặc role không có permission cho endpoint |
| `404`  | Không tìm thấy tài nguyên liên quan (vd `PUT` với `id` không tồn tại)        |
