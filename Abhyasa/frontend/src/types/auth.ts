export type AuthRole = "admin" | "teacher" | "student";

export type AuthUser = {
  id: string;
  name: string;
  email: string;
  role: AuthRole;
  createdAt: string;
};

export type LoginResponse = {
  token: string;
  user: AuthUser;
};

export type RegisterInput = {
  name: string;
  email: string;
  password: string;
  role: "teacher" | "student";
};