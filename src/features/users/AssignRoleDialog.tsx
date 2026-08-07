import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getRole } from "@/features/roles/api";
import type { Role } from "@/features/roles/types";
import {
  describePermission,
  groupPermissions,
  methodColors,
} from "@/features/permissions/format";
import { updateUser } from "./api";
import type { User } from "./types";

const assignRoleSchema = z.object({
  roleId: z.number().nullable(),
});

type AssignRoleFormValues = z.input<typeof assignRoleSchema>;

type AssignRoleDialogProps = {
  user: User | null;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
  onSaved: (user: User) => void;
};

export function AssignRoleDialog({
  user,
  roles,
  onOpenChange,
  onSaved,
}: AssignRoleDialogProps) {
  const [detail, setDetail] = useState<Role | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const form = useForm<AssignRoleFormValues>({
    resolver: zodResolver(assignRoleSchema),
    defaultValues: { roleId: null },
  });

  const roleId = form.watch("roleId");

  // Đặt lại lựa chọn mỗi khi mở dialog cho một user khác.
  useEffect(() => {
    if (user) {
      form.reset({ roleId: user.roleId ?? null });
      setDetail(null);
      setSubmitError(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  // Tải chi tiết vai trò đang chọn để xem trước danh sách quyền được cấp.
  useEffect(() => {
    if (!user || roleId == null) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoadingDetail(true);
      try {
        const role = await getRole(roleId);
        if (!cancelled) setDetail(role);
      } catch {
        if (!cancelled) setDetail(null);
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [user, roleId]);

  const changed = user != null && roleId != null && roleId !== user.roleId;
  const groups = groupPermissions(detail?.permissions ?? []);

  const onSubmit = form.handleSubmit(async (values) => {
    if (!user || values.roleId == null) return;
    setSubmitError(null);
    try {
      const updated = await updateUser(user.id, { roleId: values.roleId });
      onSaved(updated);
      onOpenChange(false);
    } catch (err) {
      setSubmitError(
        err instanceof AxiosError
          ? (err.response?.data?.message ?? "Không thể gán vai trò.")
          : "Không thể gán vai trò.",
      );
    }
  });

  return (
    <Dialog open={!!user} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Phân quyền cho {user?.fullName}</DialogTitle>
          <DialogDescription>
            Chọn vai trò cho người dùng. Người dùng sẽ nhận toàn bộ quyền của vai
            trò được gán.
          </DialogDescription>
        </DialogHeader>

        <form id="assign-role-form" onSubmit={onSubmit}>
          <div className="text-[11.5px] text-muted-foreground">Vai trò</div>
          <Select
            value={roleId != null ? String(roleId) : undefined}
            onValueChange={(v) => form.setValue("roleId", Number(v))}
          >
            <SelectTrigger className="mt-1.5 w-full">
              <SelectValue placeholder="Chọn vai trò" />
            </SelectTrigger>
            <SelectContent>
              {roles.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </form>

        <div className="mt-1">
          <div className="flex items-center gap-2.5">
            <div className="text-[13.5px] font-semibold text-foreground">
              Quyền được cấp
            </div>
            {detail?.description && (
              <div className="truncate text-xs text-muted-foreground">
                {detail.description}
              </div>
            )}
          </div>

          {loadingDetail ? (
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              Đang tải danh sách quyền...
            </p>
          ) : groups.length === 0 ? (
            <p className="mt-2 text-[12.5px] text-muted-foreground">
              Vai trò này chưa có quyền nào.
            </p>
          ) : (
            <div className="mt-2.5 flex flex-col gap-3">
              {groups.map((group) => (
                <div
                  key={group.key}
                  className="rounded-xl border border-[#eef4f3] p-3.5"
                >
                  <div className="text-[13px] font-semibold text-foreground">
                    {group.label}
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {group.items.map((p) => {
                      const colors = methodColors(p.method);
                      return (
                        <span
                          key={p.id}
                          title={p.path}
                          className="flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[12px] font-semibold"
                          style={{
                            background: colors.bg,
                            color: colors.fg,
                            borderColor: colors.fg,
                          }}
                        >
                          <span
                            className="rounded px-1.5 py-0.5 text-[10px] font-bold text-white"
                            style={{ background: colors.fg }}
                          >
                            {p.method}
                          </span>
                          {describePermission(p)}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {submitError && (
          <p role="alert" className="text-sm text-destructive">
            {submitError}
          </p>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button
            type="submit"
            form="assign-role-form"
            disabled={!changed || form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? "Đang lưu..." : "Lưu phân quyền"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
