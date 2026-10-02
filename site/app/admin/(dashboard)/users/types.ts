export type RoleOption = { id: number; slug: string; name: string };

export type UserRow = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  status: "active" | "suspended";
  roleId: number;
  roleSlug: string;
  roleName: string;
};
