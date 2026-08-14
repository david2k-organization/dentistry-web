# Notifications API

Quản lý thông báo (in-app) gửi tới người dùng. Base path: `/notifications`.

## Model

| Field        | Type                   | Mô tả                                          |
| ------------ | ---------------------- | ---------------------------------------------- |
| `id`         | `string` (cuid)        | ID thông báo                                   |
| `userId`     | `string`               | ID người nhận                                  |
| `type`       | `NotificationType`     | Loại thông báo. Mặc định `SYSTEM`              |
| `title`      | `string`               | Tiêu đề                                         |
| `message`    | `string`               | Nội dung                                        |
| `data`       | `object \| null`       | Payload phụ (JSON) tuỳ loại thông báo          |
| `entityType` | `string \| null`       | Loại thực thể liên quan (vd `supply`, `order`) |
| `entityId`   | `string \| null`       | ID thực thể liên quan                          |
| `channel`    | `NotificationChannel`  | Kênh gửi. Mặc định `IN_APP`                    |
| `isRead`     | `boolean`              | Đã đọc hay chưa. Mặc định `false`             |
| `readAt`     | `string(date) \| null` | Thời điểm đọc                                   |
| `createdAt`  | `string(date)`         | Thời điểm tạo                                   |

**Enums**

- `NotificationType`: `SYSTEM` | `APPOINTMENT` | `ORDER` | `TREATMENT` | `INVENTORY` | `PAYMENT`
- `NotificationChannel`: `IN_APP` | `EMAIL` | `SMS` | `PUSH`

---

## POST `/notifications`

Tạo một thông báo.

**Body**

| Field        | Type                  | Bắt buộc | Ghi chú                  |
| ------------ | --------------------- | -------- | ------------------------ |
| `userId`     | `string`              | ✅       | Người nhận               |
| `title`      | `string`              | ✅       |                          |
| `message`    | `string`              | ✅       |                          |
| `type`       | `NotificationType`    | ❌       | Mặc định `SYSTEM`        |
| `channel`    | `NotificationChannel` | ❌       | Mặc định `IN_APP`        |
| `data`       | `object`              | ❌       |                          |
| `entityType` | `string \| null`      | ❌       |                          |
| `entityId`   | `string \| null`      | ❌       |                          |

```json
// Request
{
  "userId": "clx123...",
  "type": "INVENTORY",
  "title": "Cảnh báo tồn kho",
  "message": "Có 3 vật tư dưới định mức tồn kho",
  "entityType": "supply"
}
```

**200** — Trả về notification vừa tạo (đầy đủ field của Model).

---

## GET `/notifications`

Danh sách thông báo, có phân trang + lọc.

**Query params**

| Param       | Type                 | Mặc định | Ghi chú                                    |
| ----------- | -------------------- | -------- | ------------------------------------------ |
| `page`      | `number`             | `1`      | ≥ 1                                        |
| `pageSize`  | `number`             | `10`     | 1–200                                      |
| `searchKey` | `string`             | —        | Tìm theo `title` / `message` (không phân biệt hoa thường) |
| `type`      | `NotificationType`   | —        | Lọc theo loại                              |
| `isRead`    | `boolean`            | —        | Lọc theo trạng thái đã đọc                 |

```
GET /notifications?page=1&pageSize=20&type=INVENTORY&isRead=false
```

**200**

```json
{
  "data": [
    {
      "id": "clx123...",
      "userId": "clx...",
      "type": "INVENTORY",
      "title": "Cảnh báo tồn kho",
      "message": "Có 3 vật tư dưới định mức tồn kho",
      "data": null,
      "entityType": "supply",
      "entityId": null,
      "channel": "IN_APP",
      "isRead": false,
      "readAt": null,
      "createdAt": "2026-08-14T02:00:00.000Z"
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

## PATCH `/notifications/read-all/:userId`

Đánh dấu **đã đọc tất cả** thông báo chưa đọc của một user (`userId`). Chỉ tác động lên các bản ghi đang `isRead = false`, đồng thời set `readAt = now()`.

```
PATCH /notifications/read-all/clx123...
```

**200**

```json
{ "count": 5 }
```

`count` là số thông báo vừa được đánh dấu đã đọc.

---

## GET `/notifications/:id`

Lấy chi tiết một thông báo.

**200** — Notification tương ứng, hoặc `null` nếu không tồn tại.

---

## PUT `/notifications/:id`

Cập nhật thông báo. Tất cả field đều tuỳ chọn (partial). Dùng phổ biến để **đánh dấu đã đọc/chưa đọc**.

**Body** (mọi field optional)

| Field                                                  | Type      | Ghi chú                        |
| ------------------------------------------------------ | --------- | ------------------------------ |
| `isRead`                                               | `boolean` | Đánh dấu đã đọc / chưa đọc     |
| `title`, `message`, `type`, `channel`, `data`, `entityType`, `entityId`, `userId` | —         | Ghi đè nếu truyền              |

```json
// Đánh dấu đã đọc
{ "isRead": true }
```

**200** — Notification sau khi cập nhật.

---

## DELETE `/notifications/:id`

Xoá thông báo.

**200** — Notification vừa xoá.

---

## Realtime (WebSocket)

Server đẩy notification realtime qua **Socket.IO**. Mọi notification tạo qua `NotificationsService.create()` (POST thủ công, cron nhắc lịch, cảnh báo kho...) đều tự động được bắn tới đúng user.

> 📄 Hướng dẫn tích hợp frontend chi tiết: [`notifications-socket.md`](./notifications-socket.md)

- **Namespace:** `/notifications`
- **Xác thực:** gửi access token khi kết nối (`auth.token`, fallback header `Authorization: Bearer <token>`). Token sai/thiếu → server disconnect.
- **Phòng (room):** mỗi user vào room `user:{userId}`; nhiều thiết bị của cùng user đều nhận.
- **Event server → client:** `notification` — payload là object notification đầy đủ (giống response REST).

**Ví dụ client (socket.io-client):**

```ts
import { io } from 'socket.io-client';

const socket = io('http://localhost:3000/notifications', {
  auth: { token: accessToken },
  transports: ['websocket'],
});

socket.on('notification', (n) => {
  console.log('Thông báo mới:', n.title, n.message);
});
```

---

## Background jobs (Cron)

Các job nền tự tạo notification, không có HTTP endpoint (`NotificationCron`).

| Job                          | Lịch chạy      | Mô tả                                                                                                    |
| ---------------------------- | -------------- | ------------------------------------------------------------------------------------------------------- |
| `warningOutOfStock`          | 8:00 mỗi ngày  | Gửi cảnh báo (`type=INVENTORY`) tới tất cả admin khi có vật tư dưới định mức tồn kho.                    |
| `remindUpcomingAppointments` | Mỗi phút       | Nhắc lịch hẹn **trước 10 phút** (`type=APPOINTMENT`) tới **bác sĩ phụ trách + admin**.                   |

**`remindUpcomingAppointments`** — chi tiết:

- Quét lịch `status=SCHEDULED`, chưa xoá, `reminderSentAt IS NULL`, có `appointmentAt` trong khoảng `(now, now + 10 phút]`.
- Mỗi lịch tạo 1 notification cho từng người nhận (bác sĩ + admin, đã khử trùng), gắn `entityType='appointment'`, `entityId=<appointmentId>`.
- Sau khi gửi, set `reminderSentAt` để **không gửi trùng** ở các lần chạy sau.
- Giờ hẹn trong nội dung hiển thị theo múi giờ `Asia/Ho_Chi_Minh` (DB lưu UTC).
