# Reports API

Các endpoint thống kê / báo cáo phục vụ dashboard phòng khám.

- **Base URL:** `/api/v1`
- **Auth:** Bearer token (header `Authorization: Bearer <access_token>`).
- **Phân quyền:** mỗi endpoint gắn một permission key.

| Method | Path                              | Permission key                  | Mô tả                                        |
| ------ | --------------------------------- | ------------------------------- | -------------------------------------------- |
| GET    | `/reports/overview`               | `report.overview`               | Số liệu tổng quan tháng hiện tại             |
| GET    | `/reports/revenue-last-6-months`  | `report.revenue-last-6-months`  | Doanh thu 6 tháng gần nhất                    |
| GET    | `/reports/revenue-last-7-days`    | `report.revenue-last-7-days`    | Doanh thu 7 ngày gần nhất                     |
| GET    | `/reports/top-5-services`         | `report.top-5-services`         | Top 5 dịch vụ theo tiền đã thu thực tế        |

> Mọi response JSON đều được bọc trong envelope chuẩn:
> ```json
> {
>   "success": true,
>   "statusCode": 200,
>   "message": "Success",
>   "data": <payload>,
>   "timestamp": "2026-08-18T03:00:00.000Z",
>   "path": "/api/v1/reports/overview"
> }
> ```

## Định nghĩa doanh thu

| Endpoint                     | Cách tính doanh thu                                                                     |
| ---------------------------- | -------------------------------------------------------------------------------------- |
| `overview`                   | **Gross đã thu**: tổng `payments` có `isRefund = false`, `voidedAt = null`.             |
| `revenue-last-6-months`      | **Gross đã thu**, tách theo từng tháng.                                                 |
| `revenue-last-7-days`        | **Gross đã thu**, tách theo từng ngày.                                                  |
| `top-5-services`             | **Net đã thu** (đã trừ hoàn, loại phiếu void) rồi **phân bổ theo tỷ lệ** về từng dịch vụ. |

> Nguồn doanh thu luôn là bảng `payments` (tiền thực thu), không phải giá trị hóa đơn.
> Đơn vị tiền: VND, số nguyên (không phần thập phân).

---

## 1. Tổng quan tháng — `GET /reports/overview`

Số liệu của **tháng hiện tại**: từ `00:00` ngày 1 đến trước `00:00` ngày 1 tháng sau (theo giờ server).

```http
GET /api/v1/reports/overview
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data`:

| Trường                       | Kiểu   | Ý nghĩa                                                                 |
| ---------------------------- | ------ | ---------------------------------------------------------------------- |
| `countNewPatients`           | number | Số bệnh nhân tạo mới trong tháng (`Patient.createdAt` trong tháng).     |
| `countCompletedAppointments` | number | Số lịch hẹn `status = COMPLETED` **được tạo** trong tháng (`Appointment.createdAt`). |
| `revenue`                    | number | Tổng tiền đã thu (gross) trong tháng (`Payment.paidAt` trong tháng).    |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": {
    "countNewPatients": 24,
    "countCompletedAppointments": 58,
    "revenue": 45200000
  },
  "timestamp": "2026-08-18T03:00:00.000Z",
  "path": "/api/v1/reports/overview"
}
```

> `countCompletedAppointments` lọc theo `createdAt` (lúc tạo lịch), không phải `appointmentAt` (lúc hẹn khám).

---

## 2. Doanh thu 6 tháng — `GET /reports/revenue-last-6-months`

Doanh thu (gross đã thu) của **6 tháng gần nhất**, mỗi phần tử là một tháng.

```http
GET /api/v1/reports/revenue-last-6-months
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là mảng 6 phần tử, **thứ tự mới → cũ** (tháng hiện tại đứng đầu):

| Trường    | Kiểu                   | Ý nghĩa                              |
| --------- | ---------------------- | ------------------------------------ |
| `month`   | string (ISO datetime)  | Mốc `00:00` ngày đầu của tháng.      |
| `revenue` | number                 | Tổng tiền đã thu trong tháng đó.     |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "month": "2026-08-01T00:00:00.000Z", "revenue": 45200000 },
    { "month": "2026-07-01T00:00:00.000Z", "revenue": 38900000 },
    { "month": "2026-06-01T00:00:00.000Z", "revenue": 51000000 },
    { "month": "2026-05-01T00:00:00.000Z", "revenue": 0 },
    { "month": "2026-04-01T00:00:00.000Z", "revenue": 27500000 },
    { "month": "2026-03-01T00:00:00.000Z", "revenue": 33100000 }
  ],
  "timestamp": "2026-08-18T03:00:00.000Z",
  "path": "/api/v1/reports/revenue-last-6-months"
}
```

> Tháng không có phiếu thu vẫn xuất hiện với `revenue: 0` (mỗi tháng là một truy vấn riêng nên không bị thiếu tháng).

---

## 3. Doanh thu 7 ngày — `GET /reports/revenue-last-7-days`

Doanh thu (gross đã thu) của **7 ngày gần nhất**, mỗi phần tử là một ngày.

```http
GET /api/v1/reports/revenue-last-7-days
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là mảng 7 phần tử, **thứ tự mới → cũ** (hôm nay đứng đầu):

| Trường    | Kiểu                   | Ý nghĩa                              |
| --------- | ---------------------- | ------------------------------------ |
| `day`     | string (ISO datetime)  | Mốc `00:00` đầu ngày.                |
| `revenue` | number                 | Tổng tiền đã thu trong ngày đó.      |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "day": "2026-08-18T00:00:00.000Z", "revenue": 4200000 },
    { "day": "2026-08-17T00:00:00.000Z", "revenue": 3800000 },
    { "day": "2026-08-16T00:00:00.000Z", "revenue": 0 },
    { "day": "2026-08-15T00:00:00.000Z", "revenue": 5100000 },
    { "day": "2026-08-14T00:00:00.000Z", "revenue": 2750000 },
    { "day": "2026-08-13T00:00:00.000Z", "revenue": 3310000 },
    { "day": "2026-08-12T00:00:00.000Z", "revenue": 1900000 }
  ],
  "timestamp": "2026-08-18T03:00:00.000Z",
  "path": "/api/v1/reports/revenue-last-7-days"
}
```

> Ngày không có phiếu thu vẫn xuất hiện với `revenue: 0` (mỗi ngày là một truy vấn riêng nên không bị thiếu ngày).

---

## 4. Top 5 dịch vụ — `GET /reports/top-5-services`

Top 5 dịch vụ theo **tiền đã thu thực tế** (net), phân bổ từ hóa đơn về dịch vụ theo tỷ lệ.

**Cách tính**

Với mỗi hóa đơn: `net = Σ(payment.amount khi không refund) − Σ(payment.amount khi refund)`, loại phiếu `voidedAt != null`.
Phân bổ về mỗi dịch vụ: `revenue = Σ ( InvoiceItem.amount / Invoice.totalAmount × net )`.
Chỉ tính hóa đơn có `totalAmount > 0` **và đã phát sinh phiếu thu**.

```http
GET /api/v1/reports/top-5-services
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là mảng tối đa 5 phần tử, sắp xếp `revenue` giảm dần:

| Trường        | Kiểu   | Ý nghĩa                                    |
| ------------- | ------ | ------------------------------------------ |
| `serviceId`   | string | ID dịch vụ.                                |
| `serviceName` | string | Tên dịch vụ.                               |
| `revenue`     | number | Tiền đã thu thực tế phân bổ cho dịch vụ.   |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    { "serviceId": "clx1a", "serviceName": "Niềng răng mắc cài", "revenue": 120000000 },
    { "serviceId": "clx2b", "serviceName": "Cấy ghép Implant",   "revenue": 98000000 },
    { "serviceId": "clx3c", "serviceName": "Bọc răng sứ",        "revenue": 64500000 },
    { "serviceId": "clx4d", "serviceName": "Nhổ răng khôn",      "revenue": 21000000 },
    { "serviceId": "clx5e", "serviceName": "Lấy cao răng",       "revenue": 8900000 }
  ],
  "timestamp": "2026-08-18T03:00:00.000Z",
  "path": "/api/v1/reports/top-5-services"
}
```

---

## Mã lỗi chung

| HTTP | Trường hợp                          |
| ---- | ----------------------------------- |
| 401  | Thiếu / sai token                   |
| 403  | Không có permission key tương ứng   |
| 500  | Lỗi truy vấn DB                     |

## Ghi chú tích hợp

- Các permission `report.overview`, `report.revenue-last-6-months`, `report.revenue-last-7-days`, `report.top-5-services` được **tự đồng bộ** khi khởi động app (với `SYNC_PERMISSIONS=true`); nhớ **gán quyền cho role** phù hợp.
- Doanh thu ở `overview`/`revenue-last-6-months` là **gross** (chưa trừ hoàn tiền); `top-5-services` là **net** đã phân bổ — hai con số dựa trên hai định nghĩa khác nhau.
- Ranh giới tháng tính theo **giờ server**; nếu server chạy khác múi giờ VN (UTC+7) thì mốc đầu/cuối tháng có thể lệch.
