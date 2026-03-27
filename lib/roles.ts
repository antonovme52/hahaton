export type AppRole = "student" | "parent" | "teacher";

export function getRoleHomePath(role: AppRole) {
  if (role === "teacher") {
    return "/dashboard/teacher";
  }

  if (role === "parent") {
    return "/dashboard/parent";
  }

  return "/dashboard/student";
}

export function getRoleLabel(role: AppRole) {
  if (role === "teacher") {
    return "Учитель";
  }

  if (role === "parent") {
    return "Родитель";
  }

  return "Ученик";
}
