export type Permission = { id: number; slug: string; label: string; group: string };
export type Role = { id: number; slug: string; name: string; isSystem: boolean; permissions: string[] };
