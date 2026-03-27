import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: "student" | "parent";
    };
  }

  interface User {
    role: "student" | "parent";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "student" | "parent";
  }
}
