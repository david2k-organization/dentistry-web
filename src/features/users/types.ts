/** Quan hệ role rút gọn có thể được backend trả kèm khi list/chi tiết user. */
export type UserRoleRef = {
  id: number;
  name: string;
};

export type User = {
  id: string;
  userName: string;
  fullName: string;
  roleId: number;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  createdAt: string;
  role?: UserRoleRef | null;
};

/** Cập nhật user — hiện chỉ dùng để gán lại vai trò (phân quyền). */
export type UpdateUserInput = {
  roleId: number;
};
