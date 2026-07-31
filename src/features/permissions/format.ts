import type { HttpMethod, Permission } from "./types";

/** Nhãn tiếng Việt cho từng nhóm route (đoạn đầu tiên trong path), theo đúng
 * các controller thật trong backend. Nhóm lạ (nếu backend thêm module mới)
 * sẽ tự rơi vào nhãn viết hoa chữ cái đầu — không chặn UI. */
const MODULE_LABELS: Record<string, string> = {
  patient: "Bệnh nhân",
  appointments: "Lịch hẹn",
  invoices: "Hoá đơn",
  services: "Dịch vụ",
  "service-categories": "Danh mục dịch vụ",
  users: "Người dùng",
  roles: "Vai trò & phân quyền",
  permission: "Quyền hệ thống",
  auth: "Xác thực",
};

const MODULE_ORDER = Object.keys(MODULE_LABELS);

export function permissionModuleKey(permission: Pick<Permission, "path">): string {
  const segments = permission.path.split("/").filter(Boolean);
  const first = segments[0] === "api" ? segments[2] : segments[0];
  return first ?? "khac";
}

export function permissionModuleLabel(key: string): string {
  return MODULE_LABELS[key] ?? key.charAt(0).toUpperCase() + key.slice(1);
}

export function groupPermissions(permissions: Permission[]): { key: string; label: string; items: Permission[] }[] {
  const groups = new Map<string, Permission[]>();
  for (const p of permissions) {
    const key = permissionModuleKey(p);
    const list = groups.get(key) ?? [];
    list.push(p);
    groups.set(key, list);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => {
      const ia = MODULE_ORDER.indexOf(a);
      const ib = MODULE_ORDER.indexOf(b);
      if (ia === -1 && ib === -1) return a.localeCompare(b);
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    })
    .map(([key, items]) => ({ key, label: permissionModuleLabel(key), items }));
}

const KNOWN_METHOD_COLORS: Record<string, { bg: string; fg: string }> = {
  GET: { bg: "#cdf5ec", fg: "#0f7a73" },
  POST: { bg: "#c8f7d4", fg: "#15803d" },
  PUT: { bg: "#fef0c7", fg: "#b45309" },
  PATCH: { bg: "#fef0c7", fg: "#b45309" },
  DELETE: { bg: "#fdd9d9", fg: "#c0392b" },
};
const FALLBACK_METHOD_COLOR = { bg: "#eef2f2", fg: "#5c7a78" };

/** Không dùng Record trực tiếp — DB không ràng buộc enum cho `method`, cần màu dự
 * phòng cho giá trị lạ để không vỡ UI (xem HttpMethod ở types.ts). */
export function methodColors(method: HttpMethod): { bg: string; fg: string } {
  return KNOWN_METHOD_COLORS[method] ?? FALLBACK_METHOD_COLOR;
}

/** Mô tả tiếng Việt ngắn gọn cho 1 permission, suy từ method + có tham số :id hay không. */
export function describePermission(permission: Pick<Permission, "method" | "path" | "description">): string {
  if (permission.description) return permission.description;
  const hasParam = permission.path.includes(":");
  switch (permission.method) {
    case "GET":
      return hasParam ? "Xem chi tiết" : "Xem danh sách";
    case "POST":
      return "Tạo mới";
    case "PUT":
    case "PATCH":
      return "Cập nhật";
    case "DELETE":
      return "Xoá";
    default:
      return permission.path;
  }
}
