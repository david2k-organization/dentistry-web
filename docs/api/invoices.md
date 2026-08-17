# Invoices API

Quản lý hóa đơn: tạo, xem, sửa thông tin, và đổi trạng thái (bao gồm hủy).

- **Base URL:** `/api/v1`
- **Auth:** Bearer token (header `Authorization: Bearer <access_token>`).
- **Phân quyền:** mỗi endpoint gắn một permission key.

| Method | Path                     | Permission key         | Mô tả                                    |
| ------ | ------------------------ | ---------------------- | ---------------------------------------- |
| POST   | `/invoices`              | `invoice.create`       | Tạo hóa đơn (luôn ở trạng thái `DRAFT`)  |
| GET    | `/invoices`              | `invoice.list`         | Danh sách hóa đơn (phân trang + lọc)     |
| GET    | `/invoices/:id`          | `invoice.read`         | Chi tiết một hóa đơn                     |
| PUT    | `/invoices/:id`          | `invoice.update`       | Sửa thông tin hóa đơn (**không** đổi status) |
| PATCH  | `/invoices/:id/status`   | `invoice.updateStatus` | Đổi trạng thái, **gộp cả hủy (void)**    |

> Mọi response JSON đều được bọc trong envelope chuẩn:
> ```json
> {
>   "success": true,
>   "statusCode": 200,
>   "message": "Success",
>   "data": <payload>,
>   "timestamp": "2026-08-17T09:00:00.000Z",
>   "path": "/api/v1/invoices"
> }
> ```

## Trạng thái hóa đơn (`InvoiceStatus`)

| Giá trị          | Ý nghĩa                        | Ai đặt                                            |
| ---------------- | ------------------------------ | ------------------------------------------------ |
| `DRAFT`          | Nháp, mới tạo                  | Tự động khi tạo                                   |
| `ISSUED`         | Đã phát hành, chờ thu tiền     | Thủ công qua `PATCH /:id/status`                 |
| `PARTIALLY_PAID` | Đã thu một phần                | **Tự động** theo phiếu thu (không set thủ công)  |
| `PAID`           | Đã thu đủ                      | **Tự động** theo phiếu thu                        |
| `VOIDED`         | Đã hủy                         | Thủ công qua `PATCH /:id/status` (kèm lý do)      |

> `PARTIALLY_PAID` và `PAID` được hệ thống tự đồng bộ mỗi khi phát sinh/hủy/hoàn phiếu thu — không đặt trực tiếp.

---

## 1. Tạo hóa đơn — `POST /invoices`

Tạo hóa đơn kèm danh sách dịch vụ. Hóa đơn mới **luôn** ở trạng thái `DRAFT` (giá trị `status` nếu gửi lên sẽ bị bỏ qua). `code` tự sinh dạng `INV-XXXXXXXX`.

**Body**

| Trường        | Kiểu   | Bắt buộc | Mô tả                                          |
| ------------- | ------ | -------- | ---------------------------------------------- |
| `patientId`   | string | ✅       | ID bệnh nhân                                   |
| `doctorId`    | string | ✅       | ID bác sĩ                                      |
| `totalAmount` | number | ✅       | Tổng tiền (số nguyên VND)                      |
| `note`        | string | ❌       | Ghi chú                                        |
| `services`    | array  | ✅       | Danh sách dịch vụ (xem bên dưới)               |

`services[]`:

| Trường      | Kiểu   | Bắt buộc | Mô tả                       |
| ----------- | ------ | -------- | --------------------------- |
| `serviceId` | string | ✅       | ID dịch vụ                  |
| `quantity`  | number | ✅       | Số lượng                    |
| `unitPrice` | number | ✅       | Đơn giá                     |
| `amount`    | number | ✅       | Thành tiền dòng             |
| `note`      | string | ❌       | Ghi chú dòng                |

```http
POST /api/v1/invoices
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "patientId": "clx_patient_1",
  "doctorId": "clx_doctor_1",
  "totalAmount": 1500000,
  "note": "Điều trị tủy răng 36",
  "services": [
    {
      "serviceId": "clx_service_1",
      "quantity": 1,
      "unitPrice": 1500000,
      "amount": 1500000,
      "note": ""
    }
  ]
}
```

**Response `201 Created`** — trả về hóa đơn vừa tạo (kèm `patient`, `doctor`, `services`).

---

## 2. Danh sách — `GET /invoices`

**Query params**

| Param       | Kiểu   | Bắt buộc | Mặc định | Mô tả                                    |
| ----------- | ------ | -------- | -------- | ---------------------------------------- |
| `page`      | number | ❌       | 1        | Trang                                    |
| `pageSize`  | number | ❌       | 10       | Số dòng/trang (1–200)                    |
| `code`      | string | ❌       | —        | Lọc theo mã hóa đơn (chứa, không phân biệt hoa thường) |
| `patientId` | string | ❌       | —        | Lọc theo bệnh nhân                       |
| `doctorId`  | string | ❌       | —        | Lọc theo bác sĩ                          |
| `startDate` | date   | ❌       | —        | `createdAt >= startDate`                 |
| `endDate`   | date   | ❌       | —        | `createdAt <= endDate`                   |

```http
GET /api/v1/invoices?page=1&pageSize=20&patientId=clx_patient_1
Authorization: Bearer <access_token>
```

**Response `200 OK`** — dạng phân trang:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ { "id": "…", "code": "INV-AB12CD34", "status": "ISSUED", "…": "…" } ],
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 },
  "timestamp": "2026-08-17T09:00:00.000Z",
  "path": "/api/v1/invoices"
}
```

---

## 3. Chi tiết — `GET /invoices/:id`

```http
GET /api/v1/invoices/clx_invoice_1
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là hóa đơn (hoặc `null` nếu không tồn tại), kèm quan hệ:

```json
{
  "id": "clx_invoice_1",
  "code": "INV-AB12CD34",
  "patientId": "clx_patient_1",
  "doctorId": "clx_doctor_1",
  "totalAmount": "1500000",
  "status": "ISSUED",
  "note": "Điều trị tủy răng 36",
  "createdAt": "2026-08-15T03:00:00.000Z",
  "updatedAt": "2026-08-15T03:00:00.000Z",
  "createdBy": "clx_user_1",
  "voidedAt": null,
  "voidedById": null,
  "voidedReason": null,
  "patient": { "fullName": "Nguyễn Văn A" },
  "doctor": { "fullName": "BS. Trần B" },
  "services": [
    {
      "id": "clx_item_1",
      "serviceId": "clx_service_1",
      "quantity": 1,
      "unitPrice": "1500000",
      "amount": "1500000",
      "note": "",
      "service": { "code": "SV001", "name": "Điều trị tủy", "unit": "răng" }
    }
  ]
}
```

---

## 4. Sửa thông tin — `PUT /invoices/:id`

Sửa các thông tin của hóa đơn. **Không** đổi được `status` qua endpoint này (dùng `PATCH /:id/status`). Nếu gửi `services`, danh sách dịch vụ cũ sẽ bị **thay thế toàn bộ** bằng danh sách mới.

**Body** — tất cả optional (trừ `services` nếu muốn cập nhật dòng dịch vụ):

| Trường        | Kiểu   | Mô tả                                    |
| ------------- | ------ | ---------------------------------------- |
| `patientId`   | string | Đổi bệnh nhân                            |
| `doctorId`    | string | Đổi bác sĩ                              |
| `totalAmount` | number | Đổi tổng tiền                           |
| `note`        | string | Đổi ghi chú                             |
| `services`    | array  | Thay toàn bộ dòng dịch vụ (xem mục Tạo)  |

```http
PUT /api/v1/invoices/clx_invoice_1
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "note": "Cập nhật ghi chú",
  "totalAmount": 1600000,
  "services": [
    { "serviceId": "clx_service_1", "quantity": 1, "unitPrice": 1600000, "amount": 1600000 }
  ]
}
```

**Response `200 OK`** — hóa đơn sau khi cập nhật.

> Gửi `status` trong body này sẽ bị bỏ qua (schema không nhận trường `status`).

---

## 5. Đổi trạng thái / Hủy — `PATCH /invoices/:id/status`

Đổi trạng thái hóa đơn. Khi chuyển sang `VOIDED` (hủy), hệ thống ghi lại `voidedAt`, `voidedById` (lấy từ token), `voidedReason`.

**Body**

| Trường         | Kiểu   | Bắt buộc                     | Mô tả                                          |
| -------------- | ------ | ---------------------------- | ---------------------------------------------- |
| `status`       | enum   | ✅                           | `DRAFT` \| `ISSUED` \| `PARTIALLY_PAID` \| `PAID` \| `VOIDED` |
| `voidedReason` | string | ✅ **khi** `status=VOIDED`   | Lý do hủy (không rỗng); bỏ qua với trạng thái khác |

**Đổi trạng thái thường**

```http
PATCH /api/v1/invoices/clx_invoice_1/status
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{ "status": "ISSUED" }
```

**Hủy hóa đơn**

```json
{ "status": "VOIDED", "voidedReason": "Nhập sai dịch vụ" }
```

**Response `200 OK`** — hóa đơn sau khi đổi trạng thái (khi hủy sẽ có `voidedAt`/`voidedById`/`voidedReason`).

### Quy tắc & lỗi

| HTTP | Trường hợp                                                            | Message                                                                         |
| ---- | -------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 404  | Không tìm thấy hóa đơn                                                | `Không tìm thấy hóa đơn`                                                         |
| 409  | Hóa đơn đã ở trạng thái `VOIDED` (không đổi được nữa)                 | `Hóa đơn đã hủy, không thể đổi trạng thái`                                       |
| 422  | `status=VOIDED` nhưng thiếu/rỗng `voidedReason`                       | `Lý do hủy là bắt buộc khi hủy hóa đơn`                                          |
| 400  | `status=VOIDED` nhưng còn tiền đã thu chưa hoàn (`netPaid > 0`)       | `Hóa đơn đang có thanh toán, hãy hủy/hoàn các phiếu thu trước khi hủy hóa đơn`   |
| 400  | Đổi về `DRAFT`/`ISSUED` khi hóa đơn đã phát sinh thanh toán            | `Hóa đơn đã có thanh toán không thể đổi về trạng thái này`                       |
| 401  | Thiếu / sai token                                                     | —                                                                               |
| 403  | Không có quyền `invoice.updateStatus`                                 | —                                                                               |

> **Luồng hủy hóa đơn đã có thanh toán:** hủy/hoàn các phiếu thu trước (`POST /payments/:id/void` hoặc `/refund`) để `netPaid` về 0, sau đó mới `PATCH /:id/status` với `VOIDED`.

---

## Ghi chú tích hợp

- Các permission `invoice.create`, `invoice.list`, `invoice.read`, `invoice.update`, `invoice.updateStatus` được **tự đồng bộ** khi khởi động app (với `SYNC_PERMISSIONS=true`); nhớ **gán quyền cho role** phù hợp.
- Trường tiền (`totalAmount`, `unitPrice`, `amount`) lưu kiểu `Decimal` nên trong JSON trả về là **chuỗi số** (vd `"1500000"`).
- `status` `PAID`/`PARTIALLY_PAID` do module payments tự cập nhật qua event — hạn chế set tay hai giá trị này.
