# Appointments API

Quản lý lịch hẹn khám (appointment) của phòng khám: đặt lịch, xem danh sách, xem chi tiết, cập nhật, xoá.

- **Base URL**: `http://localhost:3000/api/v1` (global prefix `api/v1`, cổng mặc định `3000`)
- **Resource path**: `/appointments`
- **Content-Type**: `application/json`
- **Validation**: `nestjs-zod` `ZodValidationPipe` toàn cục — body/query sai schema trả về `400` qua `ZodExceptionFilter`.

## Model

Bảng `appointments` (Prisma model `Appointment`).

| Field           | Kiểu                | Bắt buộc | Ghi chú                                                            |
| --------------- | ------------------- | -------- | ----------------------------------------------------------------- |
| `id`            | `string` (cuid)     | auto     | Khoá chính, sinh tự động.                                         |
| `patientId`     | `string`            | ✅       | FK → `patients.id`.                                               |
| `doctorId`      | `string`            | ✅       | FK → `users.id` (bác sĩ).                                         |
| `serviceId`     | `string`            | ✅       | FK → `services.id`.                                              |
| `appointmentAt` | `Date` (ISO 8601)   | ✅       | Thời điểm hẹn. Được coerce từ chuỗi ISO.                          |
| `duration`      | `int` (phút)        | ✅       | ≥ 1. Mặc định DB là `10`.                                         |
| `notes`         | `string`            | ❌       | Ghi chú.                                                          |
| `status`        | `AppointmentStatus` | auto     | Mặc định `SCHEDULED`. Chỉ đặt được qua **update**, không qua create. |
| `createdAt`     | `Date`              | auto     |                                                                   |
| `updatedAt`     | `Date`              | auto     |                                                                   |
| `deletedAt`     | `Date \| null`      | auto     | Dùng cho lọc `deletedAt: null` khi list.                          |

### Enum `AppointmentStatus`

`SCHEDULED` · `ARRIVED` · `IN_PROGRESS` · `CANCELLED` · `COMPLETED`

Mọi response đều kèm quan hệ rút gọn:

```json
{
  "patient": { "fullName": "..." },
  "doctor":  { "fullName": "..." },
  "service": { "name": "...", "code": "..." }
}
```

---

## Endpoints

### 1. Tạo lịch hẹn

```
POST /api/v1/appointments
```

**Body** (`CreateAppointmentDto`) — chỉ nhận các field sau; `status` **không** được set khi tạo (luôn là `SCHEDULED`):

```json
{
  "patientId": "clv0patient123",
  "doctorId": "clv0doctor456",
  "serviceId": "clv0service789",
  "appointmentAt": "2026-08-10T09:30:00.000Z",
  "duration": 30,
  "notes": "Khám tổng quát lần đầu"
}
```

| Field           | Ràng buộc                         |
| --------------- | --------------------------------- |
| `patientId`     | string, bắt buộc                  |
| `doctorId`      | string, bắt buộc                  |
| `serviceId`     | string, bắt buộc                  |
| `appointmentAt` | date ISO, bắt buộc                |
| `duration`      | integer ≥ 1, bắt buộc             |
| `notes`         | string, tùy chọn                  |

**201 Created**

```json
{
  "id": "clv0appt001",
  "patientId": "clv0patient123",
  "doctorId": "clv0doctor456",
  "serviceId": "clv0service789",
  "appointmentAt": "2026-08-10T09:30:00.000Z",
  "duration": 30,
  "notes": "Khám tổng quát lần đầu",
  "status": "SCHEDULED",
  "createdAt": "2026-08-05T02:10:00.000Z",
  "updatedAt": "2026-08-05T02:10:00.000Z",
  "deletedAt": null,
  "patient": { "fullName": "Nguyễn Văn A" },
  "doctor":  { "fullName": "BS. Trần Thị B" },
  "service": { "name": "Khám tổng quát", "code": "KTQ" }
}
```

---

### 2. Danh sách lịch hẹn (phân trang + lọc)

```
GET /api/v1/appointments
```

**Query** (`QueryAppointmentsDto`):

| Param       | Kiểu   | Mặc định | Ghi chú                                                        |
| ----------- | ------ | -------- | -------------------------------------------------------------- |
| `page`      | number | `1`      | Trang (từ `QueryPaginationSchema`, coerce số).                 |
| `pageSize`  | number | `10`     | Số bản ghi/trang.                                              |
| `searchKey` | string | —        | Tìm theo `name` (`contains`, không phân biệt hoa thường).      |
| `startDate` | date   | —        | Lọc `createdAt >= startDate`.                                  |
| `endDate`   | date   | —        | Lọc `createdAt <= endDate`.                                    |

Ví dụ:

```
GET /api/v1/appointments?page=1&pageSize=20&startDate=2026-08-01&endDate=2026-08-31
```

**200 OK** — trả về mảng, sắp xếp `updatedAt desc`:

```json
[
  {
    "id": "clv0appt001",
    "appointmentAt": "2026-08-10T09:30:00.000Z",
    "duration": 30,
    "status": "SCHEDULED",
    "patient": { "fullName": "Nguyễn Văn A" },
    "doctor":  { "fullName": "BS. Trần Thị B" },
    "service": { "name": "Khám tổng quát", "code": "KTQ" }
  }
]
```

> Lưu ý: `findAll` hiện trả về **mảng** trực tiếp (chưa bọc `{ data, meta }` như một số module CRUD khác).

---

### 3. Chi tiết lịch hẹn

```
GET /api/v1/appointments/:id
```

**200 OK** — object lịch hẹn kèm quan hệ (như phần Model). Không tìm thấy → `null`.

---

### 4. Cập nhật lịch hẹn

```
PUT /api/v1/appointments/:id
```

**Body** (`UpdateAppointmentDto`) — tất cả field của create ở dạng **tùy chọn**, cộng thêm `status`:

```json
{
  "appointmentAt": "2026-08-11T14:00:00.000Z",
  "duration": 45,
  "status": "ARRIVED"
}
```

| Field                                             | Ràng buộc                    |
| ------------------------------------------------- | ---------------------------- |
| `patientId`, `doctorId`, `serviceId`              | string, tùy chọn             |
| `appointmentAt`                                   | date ISO, tùy chọn           |
| `duration`                                        | integer ≥ 1, tùy chọn        |
| `notes`                                           | string, tùy chọn             |
| `status`                                          | `AppointmentStatus`, tùy chọn |

**200 OK** — object đã cập nhật (kèm quan hệ). ID không tồn tại → lỗi Prisma `P2025` được `PrismaExceptionFilter` map sang `404`.

---

### 5. Xoá lịch hẹn

```
DELETE /api/v1/appointments/:id
```

Xoá cứng (hard delete — `prisma.appointment.delete`).

**200 OK** — không có body. ID không tồn tại → `404` (qua `PrismaExceptionFilter`).

---

## Mã lỗi

| HTTP | Khi nào                                                                 |
| ---- | ---------------------------------------------------------------------- |
| 400  | Body/query không hợp lệ theo Zod (`ZodExceptionFilter`).               |
| 404  | Cập nhật/xoá `id` không tồn tại (Prisma `P2025`).                      |
| 500  | Lỗi không xác định khác.                                               |

## Ghi chú triển khai

- Route đăng ký ở `AppointmentsController` (`@Controller('appointments')`), qua tầng service → repository (`appointments.service.ts` → `appointments.repository.ts`).
- Repository dùng `Prisma.AppointmentUncheckedCreateInput/UncheckedUpdateInput` để nhận FK vô hướng (`patientId`, `doctorId`, `serviceId`) trực tiếp.
- Chưa có guard/permission gắn trên controller ở thời điểm hiện tại — mọi endpoint đang mở (cần bổ sung auth guard trước khi lên production).
