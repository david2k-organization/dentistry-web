# Auth API

Tài liệu các endpoint xác thực của module `auth` (`src/modules/auth`).

- **Base URL**: `http://localhost:3000/api/v1` (global prefix `api/v1`, port lấy từ `PORT`, mặc định `3000`).
- **Định dạng**: request/response đều là JSON (`Content-Type: application/json`).
- **Xác thực**: các endpoint được bảo vệ dùng header `Authorization: Bearer <accessToken>`.
- **Validation**: toàn bộ body được validate bằng Zod (`nestjs-zod`). Sai schema → `422 Unprocessable Entity`.

## Tổng quan endpoint

| Method | Path                     | Auth      | Mô tả                                     |
| ------ | ------------------------ | --------- | ----------------------------------------- |
| POST   | `/auth/send-otp`         | Public    | Gửi mã OTP về email (đăng ký / quên MK)   |
| POST   | `/auth/register`         | Public    | Đăng ký tài khoản (cần OTP `REGISTER`)    |
| POST   | `/auth/login`            | Public    | Đăng nhập, trả về access + refresh token  |
| POST   | `/auth/refresh-token`    | Bearer    | Cấp lại cặp token mới từ refresh token     |
| POST   | `/auth/logout`           | Bearer    | Đăng xuất, thu hồi refresh token           |
| PUT    | `/auth/forget-password`  | Public    | Đặt lại mật khẩu (cần OTP `FORGOT_PASSWORD`) |

---

## 1. Gửi OTP

Gửi mã OTP 6 số về email. Dùng cho cả luồng đăng ký và quên mật khẩu, phân biệt qua trường `type`.

```
POST /api/v1/auth/send-otp
```

**Body**

| Trường  | Kiểu   | Bắt buộc | Ràng buộc                              |
| ------- | ------ | -------- | -------------------------------------- |
| `email` | string | ✓        |                                        |
| `type`  | enum   | ✓        | `REGISTER` \| `FORGOT_PASSWORD`        |

> Body dùng `.strict()` — gửi thừa trường sẽ bị từ chối.

```json
{
  "email": "user@example.com",
  "type": "REGISTER"
}
```

**Response `201`**

```json
{ "message": "Gửi mã OTP thành công" }
```

**Lỗi**

| Mã    | Trường hợp                                                        |
| ----- | ---------------------------------------------------------------- |
| `422` | `type = REGISTER` nhưng email đã tồn tại (`Email đã tồn tại`)     |
| `422` | Gửi email thất bại (`Gửi mã OTP thất bại`)                        |

> OTP hết hạn sau khoảng thời gian cấu hình ở `OTP_EXPIRES_IN` (ví dụ `5m`).

---

## 2. Đăng ký

Tạo tài khoản mới. Yêu cầu OTP hợp lệ (loại `REGISTER`) đã gửi trước đó qua `/auth/send-otp`.

```
POST /api/v1/auth/register
```

**Body**

| Trường            | Kiểu    | Bắt buộc | Ràng buộc                            |
| ----------------- | ------- | -------- | ------------------------------------ |
| `userName`        | string  | ✓        | tối thiểu 4 ký tự                    |
| `fullName`        | string  | ✓        | tối thiểu 4 ký tự                    |
| `password`        | string  | ✓        | tối thiểu 8 ký tự                    |
| `confirmPassword` | string  | ✓        | tối thiểu 8 ký tự, phải khớp `password` |
| `email`           | string  | ✓        |                                      |
| `code`            | string  | ✓        | đúng 6 ký tự (mã OTP)               |
| `phone`           | string  | ✗        | 10–11 ký tự                          |
| `roleId`          | number  | ✗        | mặc định gán role `STAFF` nếu bỏ trống |

```json
{
  "userName": "nguyenvana",
  "fullName": "Nguyen Van A",
  "password": "matkhau123",
  "confirmPassword": "matkhau123",
  "email": "user@example.com",
  "phone": "0900000000",
  "code": "123456"
}
```

**Response `201`** — thông tin user (không có mật khẩu)

```json
{
  "id": "clx...",
  "userName": "nguyenvana",
  "fullName": "Nguyen Van A",
  "roleId": 3,
  "phone": "0900000000",
  "email": "user@example.com",
  "avatar": null,
  "createdAt": "2026-08-04T10:00:00.000Z"
}
```

**Lỗi**

| Mã    | Trường hợp                                                    |
| ----- | ------------------------------------------------------------ |
| `422` | `confirmPassword` không khớp `password`                      |
| `422` | OTP không đúng (`Mã OTP không hợp lệ`) hoặc hết hạn (`Mã OTP đã hết hạn`) |

---

## 3. Đăng nhập

```
POST /api/v1/auth/login
```

**Body**

| Trường     | Kiểu   | Bắt buộc | Ràng buộc         |
| ---------- | ------ | -------- | ----------------- |
| `userName` | string | ✓        | tối thiểu 4 ký tự |
| `password` | string | ✓        | tối thiểu 8 ký tự |

```json
{ "userName": "nguyenvana", "password": "matkhau123" }
```

**Response `201`**

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Lỗi**

| Mã    | Trường hợp                                                       |
| ----- | --------------------------------------------------------------- |
| `401` | Sai tài khoản hoặc mật khẩu (`Tên đăng nhập hoặc mật khẩu không đúng`) |

> Mỗi lần đăng nhập thành công, refresh token cũ của user sẽ bị xoá và thay bằng token mới (chỉ giữ một phiên).

---

## 4. Làm mới token

Cấp lại cặp access + refresh token mới từ một refresh token còn hiệu lực.

```
POST /api/v1/auth/refresh-token
Authorization: Bearer <accessToken>
```

**Body**

| Trường         | Kiểu   | Bắt buộc |
| -------------- | ------ | -------- |
| `refreshToken` | string | ✓        |

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response `201`**

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

**Lỗi**

| Mã    | Trường hợp                                                     |
| ----- | ------------------------------------------------------------- |
| `401` | Refresh token sai/hết hạn, hoặc user không tồn tại            |
| `403` | Refresh token không có trong DB (đã bị thu hồi)              |

---

## 5. Đăng xuất

Thu hồi refresh token (xoá khỏi DB).

```
POST /api/v1/auth/logout
Authorization: Bearer <accessToken>
```

**Body**

| Trường         | Kiểu   | Bắt buộc |
| -------------- | ------ | -------- |
| `refreshToken` | string | ✓        |

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response `201`** — kết quả xoá của Prisma

```json
{ "count": 1 }
```

---

## 6. Quên / đặt lại mật khẩu

Đặt lại mật khẩu bằng OTP loại `FORGOT_PASSWORD`. Cần gọi `/auth/send-otp` với `type = FORGOT_PASSWORD` trước.

```
PUT /api/v1/auth/forget-password
```

**Body**

| Trường               | Kiểu   | Bắt buộc | Ràng buộc                                  |
| -------------------- | ------ | -------- | ------------------------------------------ |
| `email`              | string | ✓        |                                            |
| `code`               | string | ✓        | đúng 6 ký tự (OTP)                        |
| `newPassword`        | string | ✓        | 8–100 ký tự                                |
| `confirmNewPassword` | string | ✓        | 8–100 ký tự, phải khớp `newPassword`       |

> Body dùng `.strict()` — gửi thừa trường sẽ bị từ chối.

```json
{
  "email": "user@example.com",
  "code": "123456",
  "newPassword": "matkhaumoi123",
  "confirmNewPassword": "matkhaumoi123"
}
```

**Response `200`**

```json
"Đổi mật khẩu thành công"
```

**Lỗi**

| Mã    | Trường hợp                                                  |
| ----- | ---------------------------------------------------------- |
| `422` | Email không tồn tại (`Email không tồn tại`)               |
| `422` | `confirmNewPassword` không khớp `newPassword`             |
| `422` | OTP không đúng hoặc đã hết hạn                             |

---

## Ghi chú về token

- **Access token** (JWT HS256): payload `{ userId, roleId, roleName }`, hết hạn theo `JWT_ACCESS_TOKEN_EXPIRES_IN`.
- **Refresh token** (JWT HS256): payload `{ userId }`, hết hạn theo `JWT_REFRESH_TOKEN_EXPIRES_IN`, được lưu trong bảng `RefreshToken`.
- `AccessTokenGuard` không chỉ kiểm tra token hợp lệ mà còn kiểm tra **permission** của role (khớp `path` + `method` trong bảng `Permission`). Thiếu quyền → `401 Người dùng không có quyền truy cập`.
- Các endpoint gắn decorator `@IsPublic()` (`register`, `login`, `send-otp`, `forget-password`) bỏ qua guard.

## Biến môi trường liên quan

| Biến                            | Ý nghĩa                          |
| ------------------------------- | -------------------------------- |
| `JWT_ACCESS_TOKEN_SECRET`       | Secret ký access token           |
| `JWT_ACCESS_TOKEN_EXPIRES_IN`   | Thời hạn access token (vd `15m`) |
| `JWT_REFRESH_TOKEN_SECRET`      | Secret ký refresh token          |
| `JWT_REFRESH_TOKEN_EXPIRES_IN`  | Thời hạn refresh token (vd `7d`) |
| `OTP_EXPIRES_IN`                | Thời hạn OTP (vd `5m`)           |
