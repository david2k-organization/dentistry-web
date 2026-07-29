export type ServiceCategory = {
  id: string;
  code: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateServiceCategoryInput = {
  code: string;
  name: string;
  description?: string;
  displayOrder?: number;
  isActive?: boolean;
};

export type UpdateServiceCategoryInput = Partial<CreateServiceCategoryInput>;
