# Roles API

Quản lý vai trò (Role) trong hệ thống RBAC — mỗi Role gắn với 0..n `Permission` và được gán cho `User` qua `User.roleId`. Module tại `src/roles/` (controller → service → repository), chưa nằm trong `src/modules/`.

Base path: `/api/v1/roles` (global prefix `api/v1` cấu hình ở `src/main.ts`).

> **Auth**: `RolesController` hiện **chưa gắn guard nào** (không có `@UseGuards`), nghĩa là các endpoint dưới đây đang mở, chưa bắt buộc JWT. `create`/`update` vẫn đọc `userId` qua `@ActiveUser('userId')` để set `createdById`/`updatedById` — nếu gọi không kèm access token hợp lệ, giá trị này sẽ là `undefined`.

## Response envelope

Mọi response đi qua `TransformInterceptor` (`src/common/interceptors/transform.interceptor.ts`):

```jsonc
// Thành công
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": { /* ... */ },
  "meta": { /* chỉ có ở findAll */ },
  "timestamp": "2026-07-31T10:00:00.000Z",
  "path": "/api/v1/roles"
}
```

Lỗi đi qua các filter global (`src/common/filters/*`), cùng envelope `success:false`:

```jsonc
// 422 – lỗi validate Zod (ZodExceptionFilter)
{
  "success": false,
  "statusCode": 422,
  "message": "Validation failed",
  "errors": [{ "field": "name", "message": "..." }],
  "data": null
}

// 404 / 409 / ... – NotFoundException, ConflictException (HttpExceptionFilter)
{
  "success": false,
  "statusCode": 404,
  "message": "Vai trò #99 không tồn tại",
  "data": null
}
```

## Data model

`RoleSchema` (`src/roles/entities/role.entity.ts`):

| Field           | Type                  | Ghi chú                                              |
| --------------- | --------------------- | ----------------------------------------------------- |
| `id`             | `number`               | PK, auto increment                                     |
| `name`           | `string` (1–500 ký tự) | **Không unique** ở DB lẫn schema — trùng tên vẫn insert được ở tầng Postgres, nhưng service tự chặn trùng qua `ensureNameAvailable` (xem bên dưới) |
| `description`    | `string` (≤1000, optional) |                                                    |
| `isActive`       | `boolean` (optional, default `true`) |                                          |
| `permissionIds`  | `number[]` (optional) | Chỉ dùng ở request (create/update) để `connect`/`set` quan hệ `permissions`; không có trong response thô — response trả field `permissions` (mảng `Permission` đầy đủ) vì repository luôn `include: { permissions: true }` |
| `createdById` / `updatedById` | `string \| null` | Set tự động từ `@ActiveUser('userId')`, không nhận từ body |
| `createdAt` / `updatedAt` | `date`         |                                                         |

Response của mọi endpoint (trừ `findAll`/`remove`) trả về **Role kèm mảng `permissions`** (Prisma model gốc, không qua Zod serialize), tức có thêm các field thô như `deletedAt`, `path`, `method`,... trên từng permission.

## Endpoints

### `POST /api/v1/roles` — Tạo role

Body (`CreateRoleDto`, validate bởi Zod, picked từ `RoleSchema`):

```jsonc
{
  "name": "RECEPTIONIST",
  "description": "Nhân viên lễ tân",
  "isActive": true,
  "permissionIds": [1, 2, 3] // optional
}
```

- `name` bắt buộc, 1–500 ký tự.
- Service kiểm tra trùng tên qua `RolesRepository.findByName` (`findFirst({ name, deletedAt: null })`) **trước khi insert**; nếu đã tồn tại role active cùng tên → `409 Conflict`: `Vai trò "<name>" đã tồn tại`. Đây là ràng buộc ở tầng ứng dụng, **không phải unique constraint ở DB** — vẫn có race condition nhỏ nếu 2 request tạo cùng tên đồng thời.
- Nếu có `permissionIds`, các permission tương ứng được `connect` vào role (permission phải tồn tại, nếu không Prisma sẽ ném lỗi P2025 → `404` qua `PrismaExceptionFilter`).

Response `201`: object `Role` (kèm `permissions`).

### `GET /api/v1/roles` — Danh sách role (phân trang + tìm kiếm)

Query (`QueryRolesDto`, kế thừa `QueryPaginationSchema`):

| Param       | Type      | Default | Ghi chú                                  |
| ----------- | --------- | ------- | ----------------------------------------- |
| `page`      | `number`  | `1`     | `z.coerce.number()`                       |
| `pageSize`  | `number`  | `10`    | tối đa `200`                              |
| `searchKey` | `string`  | —       | tìm gần đúng theo `name`, không phân biệt hoa/thường (`contains`, `insensitive`) |

Luôn lọc `deletedAt: null` (ẩn role đã xóa mềm).

Response `200`:

```jsonc
{
  "success": true,
  "statusCode": 200,
  "message": "Success",
  "data": [ { "id": 1, "name": "ADMIN", ... } ],
  "meta": { "page": 1, "pageSize": 10, "total": 3, "totalPages": 1 },
  "timestamp": "...",
  "path": "/api/v1/roles"
}
```

Lưu ý: `findAll` **không** `include: { permissions: true }`, nên item trong `data` không có field `permissions` (khác với `findOne`/`create`/`update`).

### `GET /api/v1/roles/:id` — Chi tiết role

- `id` là số nguyên (path param dạng string, service tự `+id`).
- Không tìm thấy (hoặc đã soft-delete) → `404`: `Vai trò #<id> không tồn tại`.
- Response `200`: object `Role` kèm `permissions`.

### `PUT /api/v1/roles/:id` — Cập nhật role

Body (`UpdateRoleDto` = `CreateRoleSchema.partial()`): tất cả field optional, cùng cấu trúc `create`.

- Role không tồn tại → `404` (như `findOne`).
- Nếu đổi `name`, service check trùng tên với **role khác** (`ensureNameAvailable(name, id)` loại trừ chính `id` đang sửa) → `409` nếu trùng.
- Nếu truyền `permissionIds`, quan hệ `permissions` bị **ghi đè hoàn toàn** bằng `set` (không phải merge/append) — gửi `permissionIds: []` sẽ gỡ hết permission khỏi role.
- Response `200`: object `Role` đã cập nhật, kèm `permissions`.

### `DELETE /api/v1/roles/:id` — Xóa mềm role

- Role không tồn tại → `404`.
- Thực chất là **soft delete**: set `isActive: false`, `deletedAt: now()` (repository `remove()`), record vẫn còn trong DB nhưng bị loại khỏi `findAll`/`findOne`/`findByName` (đều filter `deletedAt: null`).
- **Không** gỡ role khỏi `User.roleId` hay quan hệ `permissions` — nếu còn `User` đang tham chiếu role này, quan hệ đó vẫn trỏ tới role đã "xóa".
- Response `200`, `data`: chuỗi `"Đã xóa vai trò #<id>"` (không phải object).

## Gotchas khi tích hợp

- **Không có `@UseGuards`/RBAC check** trên `RolesController` — bất kỳ ai gọi được API đều tạo/sửa/xóa role được, kể cả không đăng nhập (chỉ thiếu `createdById`).
- **`name` không unique ở DB**: constraint duy nhất do service tự áp (dựa trên `findFirst`), nên khác với `User.userName`/`email` (unique thật ở DB, lỗi ném ra qua `PrismaExceptionFilter` P2002) — role trùng tên tạo đồng thời có thể lọt qua.
- **`findAll` thiếu `permissions`** trong khi các endpoint khác có — cần gọi `GET /:id` nếu cần danh sách permission của một role cụ thể trong màn hình list.
- **`permissionIds` trong `update` là "set", không phải "add"** — luôn phải gửi full danh sách ID mong muốn, không phải danh sách cần thêm.
