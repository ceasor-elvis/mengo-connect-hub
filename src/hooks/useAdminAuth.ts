import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { AdminRole } from "@/pages/portal/evote/AdminLoginPage";

export const useAdminAuth = (requiredRole?: "full_admin") => {
  const navigate = useNavigate();
  const [role, setRole] = useState<AdminRole | null>(null);
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const storedRole = sessionStorage.getItem("adminRole") as AdminRole | null;
    if (!storedRole) {
      navigate("/evote/admin/login");
      return;
    }
    if (requiredRole === "full_admin" && storedRole !== "full_admin") {
      navigate("/evote/admin");
      return;
    }
    setRole(storedRole);
    setIsAuthed(true);
  }, [navigate, requiredRole]);

  const logout = () => {
    sessionStorage.removeItem("adminRole");
    sessionStorage.removeItem("adminUser");
    navigate("/evote/admin/login");
  };

  const isFullAdmin = role === "full_admin";
  const isViewer = role === "viewer";

  return { role, isAuthed, isFullAdmin, isViewer, logout };
};
