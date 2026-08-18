import { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";

import { Input } from "@/components/ui/input";
import { getRoles } from "@/features/roles/api";
import type { Role } from "@/features/roles/types";
import { getUsers } from "@/features/users/api";
import { AssignRoleDialog } from "@/features/users/AssignRoleDialog";
import { UserTable } from "@/features/users/UserTable";
import type { User } from "@/features/users/types";

export function StaffPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [assigning, setAssigning] = useState<User | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    Promise.all([getUsers({ pageSize: 200 }), getRoles({ pageSize: 100 })])
      .then(([userPage, rolePage]) => {
        setUsers(userPage.data);
        setRoles(rolePage.data);
      })
      .catch(() => setError("Không thể tải danh sách người dùng."))
      .finally(() => setLoading(false));
  }, []);

  // Lọc theo tên (và tên đăng nhập) ngay trên client — không phân biệt hoa/thường.
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.fullName.toLowerCase().includes(q) ||
        u.userName.toLowerCase().includes(q),
    );
  }, [users, search]);

  const handleSaved = (updated: User) => {
    setUsers((prev) =>
      prev.map((u) => (u.id === updated.id ? { ...u, ...updated } : u)),
    );
    setAssigning(null);
  };

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-destructive">{error}</p>}

      <UserTable
        users={filtered}
        roles={roles}
        loading={loading}
        onAssignRole={setAssigning}
        actions={
          <div className="relative w-full sm:w-auto">
            <Search className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo tên người dùng"
              className="h-9 w-full pl-8 sm:w-56"
            />
          </div>
        }
      />

      <AssignRoleDialog
        user={assigning}
        roles={roles}
        onOpenChange={(open) => !open && setAssigning(null)}
        onSaved={handleSaved}
      />
    </div>
  );
}
