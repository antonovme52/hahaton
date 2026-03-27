import { getRoleHomePath } from "@/lib/roles";

describe("roles", () => {
  it("maps roles to home paths", () => {
    expect(getRoleHomePath("student")).toBe("/dashboard/student");
    expect(getRoleHomePath("parent")).toBe("/dashboard/parent");
    expect(getRoleHomePath("teacher")).toBe("/dashboard/teacher");
  });
});
