# Appointments API

Quản lý lịch hẹn khám: tạo, xem, danh sách, sửa (bao gồm đổi trạng thái) và xóa.

- **Base URL:** `/api/v1`
- **Auth:** Bearer token (header `Authorization: Bearer <access_token>`).
- **Phân quyền:** mỗi endpoint gắn một permission key.

| Method | Path                  | Permission key         | Mô tả                                   |
| ------ | --------------------- | ---------------------- | --------------------------------------- |
| POST   | `/appointments`       | `appointment.create`   | Tạo lịch hẹn (mặc định `SCHEDULED`)     |
| GET    | `/appointments`       | `appointment.list`     | Danh sách lịch hẹn (phân trang + lọc)   |
| GET    | `/appointments/:id`   | `appointment.read`     | Chi tiết một lịch hẹn                   |
| PUT    | `/appointments/:id`   | `appointment.update`   | Sửa thông tin / đổi trạng thái          |
| DELETE | `/appointments/:id`   | `appointment.delete`   | Xóa lịch hẹn (**xóa cứng**)             |

> Mọi response JSON đều được bọc trong envelope chuẩn:
> ```json
> {
>   "success": true,
>   "statusCode": 200,
>   "message": "Success",
>   "data": <payload>,
>   "timestamp": "2026-08-18T03:00:00.000Z",
>   "path": "/api/v1/appointments"
> }
> ```

## Trạng thái lịch hẹn (`AppointmentStatus`)

| Giá trị        | Ý nghĩa                    |
| -------------- | -------------------------- |
| `SCHEDULED`    | Đã đặt, chờ đến khám (mặc định khi tạo) |
| `ARRIVED`      | Bệnh nhân đã đến           |
| `IN_PROGRESS`  | Đang điều trị              |
| `COMPLETED`    | Đã hoàn thành              |
| `CANCELLED`    | Đã hủy                     |

> Lịch hẹn `SCHEDULED` sắp đến giờ sẽ được cron tự gửi thông báo nhắc hẹn (một lần, đánh dấu `reminderSentAt`).

## Đối tượng `Appointment`

```jsonc
{
  "id": "clx_appt_1",
  "patientId": "clx_patient_1",
  "doctorId": "clx_doctor_1",
  "serviceId": "clx_service_1",
  "appointmentAt": "2026-08-20T02:30:00.000Z",
  "duration": 30,                       // phút
  "notes": "Tái khám niềng",
  "status": "SCHEDULED",
  "reminderSentAt": null,
  "createdAt": "2026-08-18T03:00:00.000Z",
  "updatedAt": "2026-08-18T03:00:00.000Z",
  "deletedAt": null,
  "patient": { "fullName": "Nguyễn Văn A" },
  "doctor":  { "fullName": "BS. Trần B" },
  "service": { "name": "Niềng răng", "code": "SV010" }
}
```

Các endpoint create / detail / update / list đều trả kèm quan hệ `patient`, `doctor`, `service` (rút gọn như trên).

---

## 1. Tạo lịch hẹn — `POST /appointments`

Lịch hẹn mới luôn khởi tạo ở trạng thái `SCHEDULED` (không nhận `status` khi tạo).

**Body**

| Trường          | Kiểu             | Bắt buộc | Mô tả                                      |
| --------------- | ---------------- | -------- | ------------------------------------------ |
| `patientId`     | string           | ✅       | ID bệnh nhân                               |
| `doctorId`      | string           | ✅       | ID bác sĩ                                  |
| `serviceId`     | string           | ✅       | ID dịch vụ                                 |
| `appointmentAt` | string (ISO date)| ✅       | Thời điểm hẹn khám                         |
| `duration`      | number           | ✅       | Thời lượng (phút), số nguyên ≥ 1           |
| `notes`         | string           | ❌       | Ghi chú                                    |

```http
POST /api/v1/appointments
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{
  "patientId": "clx_patient_1",
  "doctorId": "clx_doctor_1",
  "serviceId": "clx_service_1",
  "appointmentAt": "2026-08-20T02:30:00.000Z",
  "duration": 30,
  "notes": "Tái khám niềng"
}
```

**Response `201 Created`** — lịch hẹn vừa tạo (kèm `patient`, `doctor`, `service`).

---

## 2. Danh sách — `GET /appointments`

Trả về các lịch hẹn **chưa xóa** (`deletedAt = null`), sắp xếp `updatedAt` giảm dần.

**Query params**

| Param       | Kiểu             | Bắt buộc | Mặc định | Mô tả                                                   |
| ----------- | ---------------- | -------- | -------- | ------------------------------------------------------- |
| `page`      | number           | ❌       | 1        | Trang                                                   |
| `pageSize`  | number           | ❌       | 10       | Số dòng/trang (1–200)                                   |
| `searchKey` | string           | ❌       | —        | Tìm theo **tên bệnh nhân** hoặc **tên dịch vụ** (chứa, không phân biệt hoa thường) |
| `status`    | enum             | ❌       | —        | Lọc theo trạng thái: `SCHEDULED` \| `ARRIVED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |
| `startDate` | date             | ❌       | —        | `createdAt >= startDate`                                |
| `endDate`   | date             | ❌       | —        | `createdAt <= endDate`                                  |

```http
GET /api/v1/appointments?page=1&pageSize=20&searchKey=Nguyễn
Authorization: Bearer <access_token>
```

**Response `200 OK`** — dạng phân trang:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [
    {
      "id": "clx_appt_1",
      "appointmentAt": "2026-08-20T02:30:00.000Z",
      "status": "SCHEDULED",
      "patient": { "fullName": "Nguyễn Văn A" },
      "doctor":  { "fullName": "BS. Trần B" },
      "service": { "name": "Niềng răng", "code": "SV010" }
    }
  ],
  "meta": { "page": 1, "pageSize": 20, "total": 42, "totalPages": 3 },
  "timestamp": "2026-08-18T03:00:00.000Z",
  "path": "/api/v1/appointments"
}
```

---

## 3. Chi tiết — `GET /appointments/:id`

```http
GET /api/v1/appointments/clx_appt_1
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là lịch hẹn (hoặc `null` nếu không tồn tại). Không lọc `deletedAt`, nên có thể trả về cả bản ghi đã đánh dấu xóa mềm.

---

## 4. Sửa / Đổi trạng thái — `PUT /appointments/:id`

Sửa thông tin lịch hẹn và/hoặc đổi `status`. Tất cả trường đều **optional** — chỉ gửi trường cần đổi.

**Body**

| Trường          | Kiểu              | Mô tả                                                        |
| --------------- | ----------------- | ----------------------------------------------------------- |
| `patientId`     | string            | Đổi bệnh nhân                                                |
| `doctorId`      | string            | Đổi bác sĩ                                                   |
| `serviceId`     | string            | Đổi dịch vụ                                                  |
| `appointmentAt` | string (ISO date) | Đổi thời điểm hẹn                                            |
| `duration`      | number            | Đổi thời lượng (phút, ≥ 1)                                   |
| `notes`         | string            | Đổi ghi chú                                                  |
| `status`        | enum              | `SCHEDULED` \| `ARRIVED` \| `IN_PROGRESS` \| `COMPLETED` \| `CANCELLED` |

```http
PUT /api/v1/appointments/clx_appt_1
Authorization: Bearer <access_token>
Content-Type: application/json
```
```json
{ "status": "ARRIVED" }
```

**Response `200 OK`** — lịch hẹn sau khi cập nhật.

---

## 5. Xóa — `DELETE /appointments/:id`

**Xóa cứng** bản ghi khỏi DB (không phải xóa mềm, dù model có cột `deletedAt`).

```http
DELETE /api/v1/appointments/clx_appt_1
Authorization: Bearer <access_token>
```

**Response `200 OK`** — `data` là `null`.

---

## Mã lỗi chung

| HTTP | Trường hợp                                    |
| ---- | --------------------------------------------- |
| 400  | Body/Query sai schema (Zod validation)        |
| 401  | Thiếu / sai token                             |
| 403  | Không có permission key tương ứng             |
| 404  | Không tìm thấy lịch hẹn khi `PUT`/`DELETE` (Prisma `P2025`) |

## Ghi chú tích hợp

- Các permission `appointment.create`, `appointment.list`, `appointment.read`, `appointment.update`, `appointment.delete` được **tự đồng bộ** khi khởi động app (với `SYNC_PERMISSIONS=true`); nhớ **gán quyền cho role** phù hợp.
- `appointmentAt`, `createdAt`, `updatedAt` trả về dạng chuỗi ISO 8601 (UTC).
- `startDate` / `endDate` lọc theo `createdAt` (thời điểm **tạo** lịch), không phải `appointmentAt` (thời điểm hẹn khám).
- `DELETE` là **xóa cứng**; `GET /:id` **không** lọc `deletedAt` nên có thể trả về bản ghi đã xóa mềm (nếu có).
