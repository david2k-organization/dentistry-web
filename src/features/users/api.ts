import {
  api,
  listQuery,
  normalizePaginated,
  type ApiEnvelope,
  type ListParams,
  type Paginated,
} from "@/lib/api";
import type { UpdateUserInput, User } from "./types";

/** Vai trò dùng để lọc danh sách người dùng (vd lấy riêng bác sĩ). */
export type UserRoleFilter = "Bác sĩ" | "Nhân viên" | "Quản trị viên";

export async function getUsers(
  params: ListParams & { roleName?: UserRoleFilter } = {},
): Promise<Paginated<User>> {
  const { roleName, ...rest } = params;
  const res = await api.get<ApiEnvelope<Paginated<User> | User[]>>("/users", {
    params: { ...listQuery(rest), ...(roleName ? { roleName } : {}) },
  });
  return normalizePaginated(res.data);
}

/** Gán lại vai trò cho user (phân quyền) — PUT /users/:id { roleId }. */
export async function updateUser(
  id: string,
  input: UpdateUserInput,
): Promise<User> {
  const res = await api.put<ApiEnvelope<User>>(`/users/${id}`, input);
  return res.data.data;
}
