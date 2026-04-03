import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { api } from "@/lib/api";

type AppRole = string;

export interface User {
  id: string;
  username?: string;
  email?: string;
}

export interface Session {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string;
  profile_pic: string | null;   // from backend
  student_class: string | null; // from backend
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  roles: AppRole[];
  loading: boolean;
  isAbsoluteAdmin: boolean;
  isCouncillor: boolean;
  hasRole: (role: AppRole) => boolean;
  hasAnyRole: (roles: AppRole[]) => boolean;
  signOut: () => Promise<void>;
  setAuthData: (access: string, refresh: string, user: User, profileData?: Profile, rolesData?: string[]) => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  roles: [],
  loading: true,
  isAbsoluteAdmin: false,
  isCouncillor: false,
  hasRole: () => false,
  hasAnyRole: () => false,
  signOut: async () => {},
  setAuthData: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserData = async () => {
    try {
      // Fallback format for Django
      const [profileRes, rolesRes] = await Promise.all([
        api.get("/users/me/profile/").catch(() => ({ data: null })),
        api.get("/users/me/roles/").catch(() => ({ data: [] }))
      ]);
      
      if (profileRes.data) setProfile(profileRes.data);
      if (rolesRes.data) {
        const r = Array.isArray(rolesRes.data) ? rolesRes.data : rolesRes.data.roles || [];
        setRoles(r.map((roleObj: any) => roleObj.role || roleObj));
      }
    } catch (e) {
      console.error("Failed to fetch user data:", e);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      const refreshToken = localStorage.getItem("refresh_token");
      const storedUser = localStorage.getItem("user");

      if (accessToken && refreshToken && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setSession({ access_token: accessToken, refresh_token: refreshToken, user: parsedUser });
          setUser(parsedUser);
          await fetchUserData();
        } catch (e) {
          // Parse fail
        }
      }
      setLoading(false);
    };

    initAuth();
  }, []);

  const isAbsoluteAdmin = roles.includes('adminabsolute');
  const isCouncillor = roles.length === 0 || isAbsoluteAdmin;

  const hasRole = (role: AppRole) => isAbsoluteAdmin || roles.includes(role);
  const hasAnyRole = (r: AppRole[]) => isAbsoluteAdmin || r.some((role) => roles.includes(role));

  const setAuthData = (access: string, refresh: string, u: User, p?: Profile, r?: string[]) => {
    localStorage.setItem("access_token", access);
    localStorage.setItem("refresh_token", refresh);
    localStorage.setItem("user", JSON.stringify(u));
    setSession({ access_token: access, refresh_token: refresh, user: u });
    setUser(u);
    if (p) setProfile(p);
    if (r) setRoles(r);
    else fetchUserData();
  };

  const signOut = async () => {
    try {
       const refresh = localStorage.getItem("refresh_token");
       if (refresh) await api.post("/users/logout/", { refresh });
    } catch (e) {}

    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user");
    setUser(null);
    setSession(null);
    setProfile(null);
    setRoles([]);
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, roles, loading, isAbsoluteAdmin, isCouncillor, hasRole, hasAnyRole, signOut, setAuthData }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
