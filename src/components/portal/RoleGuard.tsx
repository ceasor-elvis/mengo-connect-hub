import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  allowedRoles: string[];
}

/**
 * Wraps a set of routes and redirects to /portal if the current
 * user does not have any of the `allowedRoles`.
 */
export default function RoleGuard({ allowedRoles }: RoleGuardProps) {
  const { roles, loading } = useAuth();
  const location = useLocation();

  const isAllowed = roles.some((r) => allowedRoles.includes(r));

  useEffect(() => {
    if (!loading && !isAllowed) {
      toast.error("You don't have permission to access that page.");
    }
  }, [loading, isAllowed]);

  if (loading) return null;

  if (!isAllowed) {
    return <Navigate to="/portal" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
