export type Gender = "MALE" | "FEMALE" | "OTHER";

export type Patient = {
  id: string;
  fullName: string;
  phone: string | null;
  email: string | null;
  avatar: string | null;
  dateOfBirth: string | null;
  gender: Gender | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
};

export type CreatePatientInput = {
  fullName: string;
  phone?: string;
  email?: string;
  dateOfBirth?: string;
  gender?: Gender;
  notes?: string;
};

export type UpdatePatientInput = Partial<CreatePatientInput>;
