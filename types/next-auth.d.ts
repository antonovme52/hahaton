import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "student" | "parent" | "teacher";
    };
  }

  interface User {
    role: "student" | "parent" | "teacher";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "parent" | "teacher";
  }
}
