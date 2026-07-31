# Permission API

Quản lý quyền (Permission) — mỗi Permission đại diện cho 1 route (`path` + `method`) trong hệ thống, được gán vào `Role` qua quan hệ nhiều-nhiều (`Role.permissions`). Module tại `src/modules/permission/`.

Base path: **`/api/v1/permission`** (số ít — khác với `/api/v1/roles` số nhiều, lưu ý khi gọi API).

> **Auth**: `PermissionController` **chưa gắn guard nào**, endpoint đang mở. `create`/`update` đọc `userId` qua `@ActiveUser('userId')` để set `createdById`/`updatedById`.

## Response envelope

Dùng chung `TransformInterceptor` + các filter global — xem chi tiết ở [`docs/api/roles.md`](./roles.md#response-envelope). Tóm tắt:

```jsonc
// success
{ "success": true, "statusCode": 200, "message": "Success", "data": { ... }, "timestamp": "...", "path": "..." }
// error
{ "success": false, "statusCode": 409, "message": "...", "data": null }
```

## Data model

`PermissionSchema` (`src/modules/permission/entities/permission.entity.ts`):

| Field         | Type       | Ghi chú |
| ------------- | ---------- | ------- |
| `id`          | `number`   | PK, auto increment. ⚠️ `PermissionSchema` khai `id: z.string()` — sai kiểu so với DB (`Int`), nhưng `id` không nằm trong `create/update` DTO nên chưa gây lỗi runtime; chỉ là landmine nếu sau này có code pick field này. |
| `name`        | `string`   | **Unique khi `deletedAt IS NULL`** — ràng buộc partial unique thật ở DB (`Permission_name_unique`, xem `prisma/schema.prisma`), không phải check ở tầng service. |
| `description` | `string` (optional) | |
| `path`        | `string`   | Đường dẫn route, ví dụ `/patient/:id` |
| `method`      | `enum`     | Chỉ nhận **`GET \| POST \| PUT \| DELETE`** (`HTTPMethod` trong `src/common/constants/role.constant.ts`) — **không có `PATCH`**, dù `invoices`/`appointments` dùng `PATCH` cho update. Tạo permission cho các route đó qua API này sẽ bị Zod từ chối 422. |
| `isActive`    | `boolean` (optional, default `true`) | |
| `createdById` / `updatedById` | `string` | Set tự động từ `@ActiveUser('userId')` (DB thực tế là `String @default("")`; `PermissionSchema` khai `z.number().nullable()` — cũng sai kiểu như `id`, cùng lý do không bị lộ vì các DTO không pick 2 field này). |
| `createdAt` / `updatedAt` | `date` | |

`CreatePermissionDto`/`UpdatePermissionDto` chỉ pick `name`, `description`, `path`, `method`, `isActive` từ schema trên.

## Endpoints

### `POST /api/v1/permission` — Tạo permission

```jsonc
{
  "name": "GET /patient",
  "description": "Xem danh sách bệnh nhân",
  "path": "/patient",
  "method": "GET",
  "isActive": true
}
```

- **Không có check trùng ở tầng service** (khác với Roles) — insert thẳng xuống DB. Nếu `name` trùng với một permission đang active (`deletedAt IS NULL`), Postgres ném lỗi unique (`P2002`), `PrismaExceptionFilter` bắt và trả `409`: `Giá trị đã tồn tại: name`.
- `method` sai enum (vd `"PATCH"`) → `422` từ `ZodExceptionFilter`.
- Response `201`: object `Permission` vừa tạo.

### `GET /api/v1/permission` — Danh sách (phân trang + tìm kiếm)

Query giống `roles`: `page`, `pageSize` (`QueryPaginationSchema`), `searchKey` (tìm gần đúng theo `name`, `insensitive`). Luôn lọc `deletedAt: null`.

⚠️ **Khác với `roles.findAll`: response không có `meta` phân trang.** `PermissionRepository.findAll` chỉ `findMany` (không kèm `count`/`$transaction`), và `PermissionService.findAll` trả thẳng mảng đó — không bọc `{ data, meta }` như convention mô tả trong `CLAUDE.md`. Vì `TransformInterceptor` chỉ gắn `meta` khi controller trả `{data, meta}`, response thực tế là:

```jsonc
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ { "id": 1, "name": "GET /patient", ... }, ... ],
  "timestamp": "...",
  "path": "/api/v1/permission"
  // không có "meta" — client không biết total/totalPages
}
```

`page`/`pageSize` vẫn có tác dụng `skip`/`take`, chỉ là không biết được tổng số bản ghi để dựng UI phân trang.

### `GET /api/v1/permission/:id` — Chi tiết permission

⚠️ **`findById` không lọc `deletedAt: null`** (khác `findAll` và khác `RolesRepository.findById`) — permission đã bị xóa mềm (`DELETE`) vẫn lấy được qua endpoint này, chỉ ẩn khỏi danh sách.

- Không tìm thấy `id` → `findById` trả `null`, controller trả thẳng `null` (không có `NotFoundException`/404 — khác hẳn `roles.findOne`). Response vẫn `200` với `"data": null`.

### `PUT /api/v1/permission/:id` — Cập nhật permission

- Có check tồn tại trước khi update: nếu không thấy (`findById`, cũng không lọc `deletedAt`) → `404`: `Quyền #<id> không tồn tại`.
- Đổi `name` trùng với permission active khác → `409` (P2002, message generic `Giá trị đã tồn tại: name`, không phải message thân thiện như Roles).
- Body: mọi field optional (`UpdatePermissionDto` = `CreatePermissionSchema.partial()`).
- Response `200`: object `Permission` đã cập nhật.

### `DELETE /api/v1/permission/:id` — Xóa mềm permission

- **Không check tồn tại trước** (khác `update`) — gọi thẳng `prisma.permission.update({ where: { id }, data: { isActive: false, deletedAt: now() } })`. Nếu `id` không tồn tại, Prisma ném `P2025` → `PrismaExceptionFilter` trả `404` với message generic `Không tìm thấy bản ghi` (không phải `Quyền #<id> không tồn tại` như ở `update`).
- Response thành công `200`, `data`: chuỗi `"This action removes a #<id> permission"` — **text scaffold còn sót lại** (tiếng Anh, không đồng bộ với message tiếng Việt `"Đã xóa vai trò #<id>"` của Roles).
- Không gỡ permission khỏi các `Role` đang gán (quan hệ nhiều-nhiều vẫn giữ nguyên).

## Gotchas khi tích hợp

- `method` không hỗ trợ `PATCH` — nếu seed/tạo permission theo route thực tế của `invoices`/`appointments`, cần map `PATCH` sang giá trị khác hoặc bổ sung enum trước.
- `GET /api/v1/permission` **không trả `meta`** — đừng dựa vào `meta.total` để dựng phân trang như đã làm với `roles`.
- `GET /api/v1/permission/:id` trả cả bản ghi đã xóa mềm, và trả `data: null` (không phải lỗi 404) khi không tìm thấy — khác hành vi `roles.findOne`.
- Trùng `name` khi tạo/sửa trả lỗi generic từ `PrismaExceptionFilter` (không có message rõ ràng như `ConflictException` ở Roles).
- Không có guard/RBAC trên controller này (giống Roles).
