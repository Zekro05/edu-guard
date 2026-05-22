export const mapRoleForHistory = (role) => {
  const roleMap = {
    admin: "Admin",
    student: "Student",
    teacher: "Teacher",
    guidance: "Guidance",
  };

  return roleMap[role] || "Admin";
};