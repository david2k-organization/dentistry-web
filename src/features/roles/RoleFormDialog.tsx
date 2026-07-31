import { useEffect, useState, type ReactNode } from "react";
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
import { describePermission, groupPermissions, methodColors } from "@/features/permissions/format";
import type { Permission } from "@/features/permissions/types";
import { createRole, getRole, updateRole } from "./api";
import type { Role } from "./types";

type RoleFormDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roleId: number | null;
  permissions: Permission[];
  onSaved: (role: Role) => void;
};

function FieldBox({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="text-[11.5px] text-muted-foreground">{label}</div>
      <div className="mt-1.5 flex items-center gap-2 rounded-[11px] border border-[#dde8e7] bg-card px-3.5">
        {children}
      </div>
    </div>
  );
}

const boxInputClass =
  "flex-1 min-w-0 border-0 bg-transparent py-2.5 font-sans text-[13px] text-foreground outline-none placeholder:text-muted-foreground";

export function RoleFormDialog({ open, onOpenChange, roleId, permissions, onSaved }: RoleFormDialogProps) {
  const isEditing = roleId != null;
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setSubmitError(null);
      setName("");
      setDescription("");
      setIsActive(true);
      setSelected(new Set());
    }
  }

  useEffect(() => {
    if (!open || roleId == null) return;
    let cancelled = false;
    Promise.resolve().then(async () => {
      setLoadingDetail(true);
      try {
        const role = await getRole(roleId);
        if (cancelled) return;
        setName(role.name);
        setDescription(role.description ?? "");
        setIsActive(role.isActive ?? true);
        setSelected(new Set((role.permissions ?? []).map((p) => p.id)));
      } catch {
        if (!cancelled) setSubmitError("Không thể tải chi tiết vai trò.");
      } finally {
        if (!cancelled) setLoadingDetail(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [open, roleId]);

  const groups = groupPermissions(permissions);
  const canSave = name.trim() !== "" && !loadingDetail;

  const toggle = (id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleGroup = (items: Permission[], select: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      for (const p of items) {
        if (select) next.add(p.id);
        else next.delete(p.id);
      }
      return next;
    });
  };

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    setSubmitError(null);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      isActive,
      permissionIds: [...selected],
    };
    try {
      const saved = roleId != null ? await updateRole(roleId, payload) : await createRole(payload);
      onSaved(saved);
      onOpenChange(false);
    } catch (error) {
      const fallback = isEditing ? "Không thể cập nhật vai trò." : "Không thể tạo vai trò.";
      setSubmitError(error instanceof AxiosError ? (error.response?.data?.message ?? fallback) : fallback);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Sửa vai trò" : "Thêm vai trò mới"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Cập nhật tên, mô tả và quyền hạn của vai trò."
              : "Đặt tên và chọn quyền hạn cho vai trò mới."}
          </DialogDescription>
        </DialogHeader>

        {loadingDetail ? (
          <p className="text-sm text-muted-foreground">Đang tải chi tiết vai trò...</p>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3.5">
              <FieldBox label="Tên vai trò">
                <input
                  placeholder="VD: Điều dưỡng"
                  className={boxInputClass}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </FieldBox>
              <FieldBox label="Mô tả">
                <input
                  placeholder="Mô tả ngắn về vai trò"
                  className={boxInputClass}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </FieldBox>
            </div>

            <div className="mt-1">
              <div className="text-[11.5px] text-muted-foreground">Trạng thái</div>
              <div className="mt-1.5 flex gap-2">
                {[
                  { value: true, label: "Đang hoạt động" },
                  { value: false, label: "Tạm khoá" },
                ].map((opt) => {
                  const active = isActive === opt.value;
                  return (
                    <button
                      key={String(opt.value)}
                      type="button"
                      onClick={() => setIsActive(opt.value)}
                      className="cursor-pointer rounded-full border px-4 py-1.5 text-[12.5px] font-medium transition-[filter] hover:brightness-95"
                      style={
                        active
                          ? { background: "#0f7a73", color: "#ffffff", borderColor: "#0f7a73" }
                          : { background: "#ffffff", color: "#4a6664", borderColor: "#dde8e7" }
                      }
                    >
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-center gap-2.5">
                <div className="text-[13.5px] font-semibold text-foreground">Phân quyền</div>
                <div className="text-xs text-muted-foreground">{selected.size} quyền đã chọn</div>
              </div>

              {groups.length === 0 && (
                <p className="mt-2 text-[12.5px] text-muted-foreground">
                  Chưa có quyền nào trong hệ thống.
                </p>
              )}

              <div className="mt-2.5 flex flex-col gap-3">
                {groups.map((group) => {
                  const allSelected = group.items.every((p) => selected.has(p.id));
                  return (
                    <div key={group.key} className="rounded-xl border border-[#eef4f3] p-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="text-[13px] font-semibold text-foreground">{group.label}</div>
                        <div className="flex-1" />
                        <button
                          type="button"
                          onClick={() => toggleGroup(group.items, !allSelected)}
                          className="cursor-pointer text-[11.5px] font-medium text-primary hover:underline"
                        >
                          {allSelected ? "Bỏ chọn nhóm" : "Chọn cả nhóm"}
                        </button>
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {group.items.map((p) => {
                          const checked = selected.has(p.id);
                          const colors = methodColors(p.method);
                          return (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => toggle(p.id)}
                              title={p.path}
                              className="flex cursor-pointer items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[12px] font-semibold transition-[filter] hover:brightness-95"
                              style={
                                checked
                                  ? { background: colors.bg, color: colors.fg, borderColor: colors.fg }
                                  : {
                                      background: "#ffffff",
                                      color: "#4a6664",
                                      borderColor: "#dde8e7",
                                    }
                              }
                            >
                              <span
                                className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                                style={
                                  checked
                                    ? { background: colors.fg, color: "#ffffff" }
                                    : { background: "#eef2f2", color: "#5c7a78" }
                                }
                              >
                                {p.method}
                              </span>
                              {describePermission(p)}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {submitError && (
              <p role="alert" className="text-sm text-destructive">
                {submitError}
              </p>
            )}
          </>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Huỷ
          </Button>
          <Button onClick={handleSave} disabled={!canSave || saving}>
            {saving ? "Đang lưu..." : isEditing ? "Lưu thay đổi" : "Tạo vai trò"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
