# Payments API

Quản lý phiếu thu tiền cho hóa đơn: tạo phiếu thu, danh sách, sửa, **hủy (void)** và **hoàn tiền (refund)**.

- **Base URL:** `/api/v1`
- **Auth:** Bearer token (header `Authorization: Bearer <access_token>`) — bắt buộc cho mọi endpoint (global `AuthenticationGuard`).
- **Phân quyền:** module này **chưa gắn permission key** riêng; chỉ cần token hợp lệ là gọi được.

| Method | Path                    | Mô tả                                              |
| ------ | ----------------------- | -------------------------------------------------- |
| POST   | `/payments`             | Tạo phiếu thu cho một hóa đơn                       |
| GET    | `/payments`             | Danh sách phiếu thu (phân trang + lọc theo hóa đơn) |
| PUT    | `/payments/:id`         | Sửa thông tin phiếu thu (chưa hủy)                 |
| POST   | `/payments/:id/void`    | Hủy một phiếu thu                                  |
| POST   | `/payments/:id/refund`  | Tạo phiếu hoàn tiền từ một phiếu thu               |

> Mọi response JSON đều được bọc trong envelope chuẩn:
> ```json
> {
>   "success": true,
>   "statusCode": 200,
>   "message": "Success",
>   "data": <payload>,
>   "timestamp": "2026-08-18T03:00:00.000Z",
>   "path": "/api/v1/payments"
> }
> ```

## Phương thức thanh toán (`PaymentMethod`)

| Giá trị         | Ý nghĩa          |
| --------------- | ---------------- |
| `CASH`          | Tiền mặt         |
| `BANK_TRANSFER` | Chuyển khoản     |

## Đối tượng `Payment`

```jsonc
{
  "id": "clx_pay_1",
  "code": "PAY-7K3M9Q2X",
  "invoiceId": "clx_inv_1",
  "amount": 500000,                     // VND, số nguyên (Decimal(12,0))
  "method": "CASH",
  "paidAt": "2026-08-18T03:00:00.000Z",
  "isRefund": false,                    // true nếu là phiếu hoàn tiền
  "refundReason": null,                 // lý do hoàn (chỉ phiếu refund)
  "note": "Thu đợt 1",
  "receivedById": "clx_user_1",         // người lập phiếu (lấy từ token)
  "voidedAt": null,                     // != null nếu đã hủy
  "voidedById": null,
  "voidedReason": null,
  "createdAt": "2026-08-18T03:00:00.000Z",
  "updatedAt": "2026-08-18T03:00:00.000Z"
}
```

> `code` được sinh tự động: phiếu thu `PAY-<8 ký tự>`. `receivedById` luôn lấy từ người dùng trong token, không nhận từ body.

## Quan hệ với trạng thái hóa đơn

Mỗi lần **tạo / sửa / hủy / hoàn** phiếu thu, hệ thống phát sự kiện `payment.mutated` và tự tính lại trạng thái hóa đơn theo **net đã thu** = `Σ(phiếu thu) − Σ(phiếu hoàn)` (loại phiếu đã void):

| Điều kiện                         | Trạng thái hóa đơn |
| --------------------------------- | ------------------ |
| `netPaid >= totalAmount`          | `PAID`             |
| `0 < netPaid < totalAmount`       | `PARTIALLY_PAID`   |
| `netPaid == 0`                    | `ISSUED`           |

> Chỉ đồng bộ với hóa đơn đang ở `ISSUED` / `PARTIALLY_PAID` / `PAID`. Hóa đơn `DRAFT` hoặc `VOIDED` không đổi trạng thái.

---

## 1. Tạo phiếu thu — `POST /payments`

Thu tiền cho một hóa đơn. Người lập lấy từ token (`receivedById`).

**Body**

| Trường      | Kiểu                     | Bắt buộc | Ghi chú                                        |
| ----------- | ------------------------ | -------- | ---------------------------------------------- |
| `invoiceId` | string                   | ✅       | Hóa đơn cần thu tiền.                          |
| `amount`    | number (> 0)             | ✅       | Số tiền thu, phải dương.                        |
| `method`    | `CASH` \| `BANK_TRANSFER`| ✅       | Phương thức thanh toán.                        |
| `paidAt`    | string (ISO datetime)    | ❌       | Mặc định thời điểm hiện tại.                    |
| `note`      | string                   | ❌       | Ghi chú.                                       |

```http
POST /api/v1/payments
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "invoiceId": "clx_inv_1",
  "amount": 500000,
  "method": "CASH",
  "note": "Thu đợt 1"
}
```

**Response `201 Created`** — `data` là đối tượng `Payment` vừa tạo.

**Quy tắc nghiệp vụ**

- Hóa đơn phải tồn tại → nếu không: `404`.
- Hóa đơn không được ở trạng thái `DRAFT` hoặc `VOIDED` → nếu không: `400`.
- `amount` không vượt quá **số tiền còn lại** (`totalAmount − netPaid`) → nếu không: `400` kèm số tiền còn lại.

---

## 2. Danh sách phiếu thu — `GET /payments`

**Query params**

| Trường      | Kiểu   | Mặc định | Ghi chú                          |
| ----------- | ------ | -------- | -------------------------------- |
| `page`      | number | 1        | Trang.                           |
| `pageSize`  | number | 10       | Số phần tử mỗi trang.            |
| `invoiceId` | string | —        | Lọc phiếu thu theo một hóa đơn.  |

```http
GET /api/v1/payments?invoiceId=clx_inv_1&page=1&pageSize=10
Authorization: Bearer <access_token>
```

**Response `200 OK`** — danh sách sắp xếp theo `createdAt` giảm dần:

```json
{
  "data": [
    { "id": "clx_pay_2", "code": "PAY-A1B2C3D4", "invoiceId": "clx_inv_1", "amount": 500000, "method": "CASH", "isRefund": false, "voidedAt": null }
  ],
  "meta": { "page": 1, "pageSize": 10, "total": 1, "totalPages": 1 }
}
```

> `data` và `meta` nằm trong `data` của envelope chuẩn.

---

## 3. Sửa phiếu thu — `PUT /payments/:id`

Cập nhật thông tin phiếu thu. Tất cả trường đều tùy chọn (partial).

**Body** (các trường có thể sửa): `amount`, `method`, `paidAt`, `note`, `receivedById`.

```http
PUT /api/v1/payments/clx_pay_1
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 600000,
  "note": "Điều chỉnh số tiền"
}
```

**Response `200 OK`** — `data` là `Payment` sau khi cập nhật.

**Quy tắc nghiệp vụ**

- Phiếu thu phải tồn tại → nếu không: `404`.
- Phiếu thu **đã hủy** (`voidedAt != null`) không sửa được → `409`.

---

## 4. Hủy phiếu thu — `POST /payments/:id/void`

Đánh dấu phiếu thu là đã hủy (không xóa cứng); ghi lại người hủy và lý do.

**Body**

| Trường         | Kiểu   | Bắt buộc | Ghi chú                    |
| -------------- | ------ | -------- | -------------------------- |
| `voidedReason` | string | ✅       | Lý do hủy, không rỗng.     |

```http
POST /api/v1/payments/clx_pay_1/void
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "voidedReason": "Thu nhầm hóa đơn"
}
```

**Response `200 OK`** — `data` là `Payment` với `voidedAt`, `voidedById`, `voidedReason` đã được set.

**Quy tắc nghiệp vụ**

- Phiếu thu phải tồn tại → nếu không: `404`.
- Phiếu thu đã hủy trước đó → `409`.
- Sau khi hủy, phiếu bị loại khỏi `netPaid` nên trạng thái hóa đơn được tính lại.

---

## 5. Hoàn tiền — `POST /payments/:id/refund`

Tạo một **phiếu hoàn tiền** (`isRefund = true`) tham chiếu cùng hóa đơn với phiếu thu gốc. Đây là một bản ghi `Payment` mới, không sửa phiếu gốc.

**Body**

| Trường         | Kiểu                      | Bắt buộc | Ghi chú                                          |
| -------------- | ------------------------- | -------- | ------------------------------------------------ |
| `amount`       | number (> 0)              | ✅       | Số tiền hoàn, phải dương.                         |
| `refundReason` | string                    | ✅       | Lý do hoàn, không rỗng.                          |
| `method`       | `CASH` \| `BANK_TRANSFER` | ❌       | Mặc định lấy theo phương thức của phiếu gốc.      |
| `note`         | string                    | ❌       | Ghi chú.                                         |

```http
POST /api/v1/payments/clx_pay_1/refund
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "amount": 200000,
  "refundReason": "Bệnh nhân hủy dịch vụ"
}
```

**Response `201 Created`** — `data` là phiếu hoàn tiền mới (`isRefund: true`, `refundReason` đã set, `code` dạng `PAY-...`).

**Quy tắc nghiệp vụ**

- Phiếu thu gốc phải tồn tại → nếu không: `404`.
- Phiếu gốc **đã hủy** → `409`.
- Không hoàn tiền cho một **phiếu hoàn tiền** (`isRefund = true`) → `400`.
- `amount` không vượt quá **net đã thu** của hóa đơn → nếu không: `400`.
- Phiếu hoàn làm giảm `netPaid` nên trạng thái hóa đơn được tính lại (ví dụ từ `PAID` về `PARTIALLY_PAID`).

---

## Mã lỗi chung

| HTTP | Trường hợp                                                                 |
| ---- | -------------------------------------------------------------------------- |
| 400  | Body không hợp lệ; số tiền vượt quá còn lại / net đã thu; hóa đơn `DRAFT`/`VOIDED`; hoàn tiền cho phiếu hoàn |
| 401  | Thiếu / sai token                                                          |
| 404  | Không tìm thấy phiếu thu / hóa đơn                                          |
| 409  | Thao tác trên phiếu thu đã hủy (sửa / hủy lại)                             |
| 500  | Lỗi truy vấn DB                                                            |

## Ghi chú tích hợp

- Nguồn doanh thu trong module `reports` chính là bảng `payments` (tiền thực thu), lọc `isRefund = false` và `voidedAt = null`.
- Đơn vị tiền: VND, số nguyên (không phần thập phân — `Decimal(12,0)`).
- Không có endpoint xóa cứng phiếu thu; muốn “gỡ” một phiếu thì dùng **void**.
