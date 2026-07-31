import type { Permission } from "@/features/permissions/types";

export type Role = {
  id: number;
  name: string;
  description: string;
  isActive: boolean;
  permissions?: Permission[];
  createdById: string | null;
  updatedById: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CreateRoleInput = {
  name: string;
  description?: string;
  isActive?: boolean;
  permissionIds?: number[];
};

export type UpdateRoleInput = Partial<CreateRoleInput>;
