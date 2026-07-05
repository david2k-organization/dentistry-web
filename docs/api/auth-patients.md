# API Documentation — Auth & Patient

Base URL: `http://localhost:{PORT}/api/v1` (global prefix set in `main.ts`)

## 1. Quy ước chung

### 1.1. Envelope response

Mọi response thành công được `TransformInterceptor` (global) bọc theo dạng:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* payload thực tế */ },
  "timestamp": "2026-07-03T10:00:00.000Z",
  "path": "/api/v1/patient"
}
```

Response lỗi (từ `HttpExceptionFilter` / `ZodExceptionFilter` / `PrismaExceptionFilter`):

```json
{
  "success": false,
  "statusCode": 401,
  "message": "Không có quyền truy cập",
  "data": null
}
```

Riêng lỗi validate DTO (Zod) trả `422 Unprocessable Entity` kèm chi tiết field:

```json
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [
    { "field": "fullName", "message": "Required" }
  ],
  "data": null
}
```

### 1.2. Xác thực

Có 2 kiểu auth, khai báo qua decorator `@Auth([...])` trên controller/route (`src/common/decorators/auth.decorator.ts`). Nếu route không gắn `@Auth`, mặc định là public (`AUTH_TYPE.NONE`).

| Kiểu | Header | Guard |
|---|---|---|
| `bearer` | `Authorization: Bearer <accessToken>` | `AccessTokenGuard` (verify JWT access token) |
| `api-key` | `x-api-key: <SECRET_API_KEY>` | `APIKeyGuard` (so khớp với env `SECRET_API_KEY`) |

Khi route khai báo nhiều kiểu với `condition: 'or'`, chỉ cần thỏa 1 trong các kiểu là được phép; mặc định (`condition: 'and'`) phải thỏa tất cả.

---

## 2. Auth API (`/api/v1/auth`)

Không yêu cầu token cho `register`/`login`. `refresh-token` và `logout` yêu cầu access token hợp lệ (`AccessTokenGuard` qua `@UseGuards`).

### 2.1. Đăng ký — `POST /auth/register`

Public.

**Body** (`RegisterDto`):

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| `userName` | string | ✔ | |
| `fullName` | string | ✔ | min 1 |
| `password` | string | ✔ | min 8 |
| `confirmPassword` | string | ✔ | min 8, phải khớp `password` |
| `phone` | string | ✗ | 10–11 ký tự |
| `email` | string (email) | ✗ | |
| `role` | enum `Role` | ✗ | `ADMIN` \| `ACCOUNTANT` \| `STAFF` |

```json
{
  "userName": "bs.linh",
  "fullName": "Nguyễn Thùy Linh",
  "password": "matkhau123",
  "confirmPassword": "matkhau123",
  "phone": "0901234567",
  "email": "linh@clinic.vn",
  "role": "STAFF"
}
```

**Response** `201` (`RegisterResponseDto`) — `data`:

```json
{
  "id": "cktz8x...",
  "userName": "bs.linh",
  "fullName": "Nguyễn Thùy Linh",
  "role": "STAFF",
  "phone": "0901234567",
  "email": "linh@clinic.vn",
  "avatar": null,
  "createdAt": "2026-07-03T10:00:00.000Z"
}
```

**Lỗi:**
- `422` — validation fail (thiếu field, password/confirmPassword không khớp).
- `409`/`400` — `userName`, `phone`, `email` đã tồn tại (unique constraint, qua `PrismaExceptionFilter`).

### 2.2. Đăng nhập — `POST /auth/login`

Public.

**Body** (`LoginDto`):

| Field | Type | Bắt buộc |
|---|---|---|
| `userName` | string | ✔ |
| `password` | string (min 8) | ✔ |

```json
{ "userName": "bs.linh", "password": "matkhau123" }
```

**Response** `201` (`LoginResponseDto`) — `data`:

```json
{
  "accessToken": "eyJhbGciOi...",
  "refreshToken": "eyJhbGciOi..."
}
```

Login cũng xóa các refresh token cũ của user trong DB và lưu refresh token mới (`AuthService.generateToken`).

**Lỗi:**
- `401` — sai `userName` hoặc `password` ("Tên đăng nhập hoặc mật khẩu không đúng").

### 2.3. Làm mới token — `POST /auth/refresh-token`

Yêu cầu `Authorization: Bearer <accessToken>` (access token còn hạn — dùng `AccessTokenGuard` trực tiếp, không qua `@Auth`).

**Body** (`RefreshTokenDto`):

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response** `201` (`RefreshTokenResponseDto`) — `data`: cùng shape với login (`accessToken`, `refreshToken` mới).

**Lỗi:**
- `401` — access token thiếu/hết hạn/không hợp lệ.
- `403` — refresh token không tồn tại trong DB.

### 2.4. Đăng xuất — `POST /auth/logout`

Yêu cầu `Authorization: Bearer <accessToken>`.

**Body** (`LogoutDto`, giống `RefreshTokenDto`):

```json
{ "refreshToken": "eyJhbGciOi..." }
```

**Response** `201` — `data`: kết quả xóa refresh token khỏi DB (`Prisma.BatchPayload`, ví dụ `{ "count": 1 }`).

---

## 3. Patient API (`/api/v1/patient`)

Toàn bộ controller gắn `@Auth([bearer])` ở class level ⇒ mọi route mặc định yêu cầu `Authorization: Bearer <accessToken>`, trừ khi override.

### 3.1. Tạo bệnh nhân — `POST /patient`

Auth: `bearer`.

**Body** (`CreatePatientDto` — từ `PatientSchema`):

| Field | Type | Bắt buộc | Ghi chú |
|---|---|---|---|
| `fullName` | string | ✔ | trim, 1–255 ký tự |
| `phone` | string | ✗ | trim, tối đa 20 ký tự, unique |
| `email` | string (email) | ✗ | tối đa 255 ký tự, unique |
| `dateOfBirth` | string (ISO datetime, có offset) | ✗ | vd `1990-05-20T00:00:00+07:00` |
| `gender` | enum `Gender` | ✗ | `MALE` \| `FEMALE` \| `OTHER` |
| `notes` | string | ✗ | trim, tối đa 2000 ký tự |

```json
{
  "fullName": "Trần Văn A",
  "phone": "0912345678",
  "email": "vana@example.com",
  "dateOfBirth": "1990-05-20T00:00:00+07:00",
  "gender": "MALE",
  "notes": "Dị ứng thuốc tê"
}
```

**Response** `201` — `data`: bản ghi `Patient` vừa tạo (`id`, `fullName`, `phone`, `email`, `avatar`, `dateOfBirth`, `gender`, `notes`, `createdAt`, `updatedAt`, `deletedAt`).

**Lỗi:** `422` validation; lỗi unique `phone`/`email` trùng.

### 3.2. Lấy danh sách bệnh nhân — `GET /patient`

Auth: `bearer` **hoặc** `api-key` (override ở route: `@Auth([bearer, api-key], { condition: 'or' })`) — dùng `Authorization: Bearer ...` **hoặc** header `x-api-key: <SECRET_API_KEY>`.

**Response** `200` — `data`: mảng toàn bộ `Patient` (chưa phân trang, chưa lọc `deletedAt`).

### 3.3. Lấy chi tiết bệnh nhân — `GET /patient/:id`

Auth: `bearer`.

**Response** `200` — `data`: `Patient` theo `id`, hoặc `null` nếu không tìm thấy (hiện chưa ném `NotFoundException` ở route này).

### 3.4. Cập nhật bệnh nhân — `PUT /patient/:id`

Auth: `bearer`.

**Body** (`UpdatePatientDto` — `PatientSchema.partial()`, tất cả field optional, cùng rule như tạo mới).

⚠️ **Chưa nối DB**: `PatientsService.update()` hiện chỉ trả chuỗi placeholder `` "This action updates a #<id> patient" `` — chưa thực sự cập nhật bản ghi.

### 3.5. Xóa bệnh nhân (soft delete) — `DELETE /patient/:id`

Auth: `bearer`.

Kiểm tra tồn tại, sau đó set `deletedAt = now()` (soft delete, không xóa cứng).

**Response** `200` — `data`: chuỗi `` "Đã xóa thành công bệnh nhân #<id>" ``.

**Lỗi:** `404` — "Bệnh nhân không tồn tại" nếu `id` không có trong DB.

---

## 4. Ghi chú triển khai / hạn chế hiện tại

- `PatientsService.update()` chưa nối Prisma — cần cập nhật để thực sự ghi DB.
- `GET /patient` và `GET /patient/:id` chưa lọc các bản ghi đã soft-delete (`deletedAt != null`).
- `GET /patient` chưa phân trang dù `ApiResponse`/`PaginationMeta` đã hỗ trợ `meta`.
- Các module `users`, `services`, `invoices`, `appointments` vẫn là scaffold, chưa có API thực — chưa đưa vào tài liệu này.
