export type HttpMethod =
  | "GET"
  | "POST"
  | "PUT"
  | "PATCH"
  | "DELETE"
  | (string & {});

export type Permission = {
  id: number;
  name: string;
  description: string;
  path: string;
  method: HttpMethod;
  isActive: boolean;
  createdById: string;
  updatedById: string;
  createdAt: string;
  updatedAt: string;
};
