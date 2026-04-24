import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";

interface RoleGuardProps {
  allowedRoles?: string[];
  allowedPermission?: string;
}

/**
 * Wraps a set of routes and redirects to /portal if the current
 * user does not have any of the `allowedRoles` or the `allowedPermission`.
 */
export default function RoleGuard({ allowedRoles, allowedPermission }: RoleGuardProps) {
  const { loading, hasAnyRole, hasPermission } = useAuth();
  const location = useLocation();

  const isAllowedByRole = allowedRoles ? hasAnyRole(allowedRoles) : false;
  const isAllowedByPermission = allowedPermission ? hasPermission(allowedPermission) : false;
  
  const isAllowed = (allowedRoles && allowedPermission) 
    ? (isAllowedByRole || isAllowedByPermission)
    : (allowedPermission ? isAllowedByPermission : isAllowedByRole);

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
