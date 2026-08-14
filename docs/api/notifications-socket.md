# Notifications — WebSocket (hướng dẫn tích hợp Frontend)

Server đẩy notification **realtime** qua **Socket.IO**. Tài liệu này mô tả cách frontend kết nối, xác thực và lắng nghe sự kiện.

> Mọi notification tạo ở backend (POST thủ công, cron nhắc lịch hẹn, cảnh báo tồn kho…) đều được bắn tự động tới đúng user đang online.

---

## 1. Thông tin kết nối

| Mục            | Giá trị                                                             |
| -------------- | ------------------------------------------------------------------ |
| Thư viện       | `socket.io-client` v4 (khớp server Socket.IO v4)                    |
| URL            | `<HOST>/notifications` — ví dụ `http://localhost:3000/notifications`|
| Namespace      | `/notifications`                                                   |
| Path mặc định  | `/socket.io` (không đổi)                                            |
| Transport      | Nên ép `['websocket']`                                             |
| Xác thực       | Access token (JWT) — **bắt buộc**, nếu không sẽ bị disconnect       |

> ⚠️ URL kết nối là `HOST + /notifications` (namespace), **không** kèm prefix `api/v1`. Prefix `api/v1` chỉ áp dụng cho REST.

---

## 2. Xác thực

Gửi **access token** (chính là token dùng cho REST — header `Authorization: Bearer <token>`) theo 1 trong 2 cách:

1. **`auth.token`** (khuyến nghị):
   ```ts
   io(url, { auth: { token: accessToken } });
   ```
2. **Header `Authorization`** (fallback):
   ```ts
   io(url, { extraHeaders: { Authorization: `Bearer ${accessToken}` } });
   ```

Xử lý phía server khi kết nối:
- Token hợp lệ → socket được thêm vào room riêng `user:{userId}` và bắt đầu nhận notification.
- Token thiếu / sai / hết hạn → server emit event `error` với payload `"Unauthorized"` rồi **ngắt kết nối**.

> Token **hết hạn** cũng bị từ chối. Khi access token được refresh, hãy tạo kết nối lại với token mới (xem mục 6).

---

## 3. Sự kiện

### Server → Client

| Event          | Payload                | Khi nào                                              |
| -------------- | ---------------------- | ---------------------------------------------------- |
| `notification` | `Notification` (mục 4) | Có notification mới dành cho user đang kết nối        |
| `error`        | `"Unauthorized"`       | Xác thực thất bại (ngay trước khi bị disconnect)      |

### Client → Server

Hiện không cần gửi event nào để nhận notification. Các thao tác như đánh dấu đã đọc vẫn dùng **REST API** (xem `notifications.md`).

---

## 4. Payload sự kiện `notification`

Object notification đầy đủ (giống response REST):

```json
{
  "id": "clx123...",
  "userId": "clx...",
  "type": "APPOINTMENT",
  "title": "Sắp đến hẹn: Nguyễn Văn A lúc 14:30 14/08",
  "message": "Lịch hẹn dịch vụ \"Khám tổng quát\" với BN Nguyễn Văn A lúc 14:30 14/08 (BS Trần B).",
  "data": null,
  "entityType": "appointment",
  "entityId": "clxappt...",
  "channel": "IN_APP",
  "isRead": false,
  "readAt": null,
  "createdAt": "2026-08-14T07:20:00.000Z"
}
```

| Field        | Type                   | Ghi chú                                                       |
| ------------ | ---------------------- | ------------------------------------------------------------ |
| `id`         | `string`               | ID thông báo                                                 |
| `userId`     | `string`               | Người nhận (luôn là user đang kết nối)                       |
| `type`       | `NotificationType`     | `SYSTEM` \| `APPOINTMENT` \| `ORDER` \| `TREATMENT` \| `INVENTORY` \| `PAYMENT` |
| `title`      | `string`               | Tiêu đề hiển thị                                             |
| `message`    | `string`               | Nội dung                                                     |
| `data`       | `object \| null`       | Payload phụ tuỳ loại                                         |
| `entityType` | `string \| null`       | Loại thực thể liên quan (vd `appointment`, `supply`)         |
| `entityId`   | `string \| null`       | ID thực thể liên quan — dùng để điều hướng khi click         |
| `channel`    | `NotificationChannel`  | `IN_APP` \| `EMAIL` \| `SMS` \| `PUSH`                       |
| `isRead`     | `boolean`              | Trạng thái đã đọc (mới nhận luôn `false`)                    |
| `readAt`     | `string(date) \| null` | Thời điểm đọc                                                |
| `createdAt`  | `string(date)`         | Thời điểm tạo (ISO, UTC)                                     |

---

## 5. Ví dụ tích hợp

### 5.1. JavaScript / TypeScript thuần

```ts
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000/notifications', {
  transports: ['websocket'],
  auth: { token: accessToken }, // access token từ luồng login
});

socket.on('connect', () => {
  console.log('Đã kết nối notification socket:', socket.id);
});

socket.on('notification', (n) => {
  // Hiển thị toast, tăng badge số chưa đọc, prepend vào danh sách...
  console.log('Thông báo mới:', n.title);
});

socket.on('error', (msg) => {
  console.warn('Socket error:', msg); // "Unauthorized"
});

socket.on('disconnect', (reason) => {
  console.log('Ngắt kết nối:', reason);
});

// Khi logout:
socket.disconnect();
```

### 5.2. React (hook)

```tsx
import { useEffect } from 'react';
import { io } from 'socket.io-client';

export function useNotificationSocket(accessToken: string, onNew: (n: any) => void) {
  useEffect(() => {
    if (!accessToken) return;

    const socket = io('http://localhost:3000/notifications', {
      transports: ['websocket'],
      auth: { token: accessToken },
    });

    socket.on('notification', onNew);

    return () => {
      socket.off('notification', onNew);
      socket.disconnect();
    };
  }, [accessToken, onNew]);
}
```

---

## 6. Lưu ý quan trọng cho frontend

- **Đa thiết bị:** cùng một user mở nhiều tab/thiết bị đều nhận cùng notification (mỗi kết nối vào chung room `user:{userId}`).
- **Refresh token:** access token hết hạn sẽ bị server từ chối kết nối. Sau khi refresh token, hãy **disconnect socket cũ và kết nối lại** với token mới:
  ```ts
  socket.auth = { token: newAccessToken };
  socket.disconnect().connect();
  ```
- **Không phụ thuộc socket để đảm bảo dữ liệu:** socket chỉ là realtime. Khi vào màn hình danh sách, vẫn gọi REST `GET /notifications` để lấy dữ liệu đầy đủ + phân trang; socket dùng để cập nhật tức thời.
- **Đánh dấu đã đọc:** dùng REST (`PUT /notifications/:id` với `{ "isRead": true }` hoặc `PATCH /notifications/read-all/:userId`), không qua socket.
- **CORS:** origin của frontend phải nằm trong biến môi trường `CORS_ORIGIN` của backend (nhiều origin ngăn cách bằng dấu phẩy). Nếu chưa cấu hình, kết nối cross-origin có thể bị chặn ở production.
- **Reconnect:** `socket.io-client` tự động reconnect khi rớt mạng; token vẫn giữ trong `auth` nên kết nối lại tự xác thực (miễn là token còn hạn).
```
