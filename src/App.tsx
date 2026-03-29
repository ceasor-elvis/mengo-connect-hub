import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import PublicLayout from "@/layouts/PublicLayout";
import PortalLayout from "@/layouts/PortalLayout";
import RoleGuard from "@/components/portal/RoleGuard";
import HomePage from "@/pages/HomePage";
import StudentVoicePage from "@/pages/StudentVoicePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/portal/DashboardPage";
import IssuesPage from "@/pages/portal/IssuesPage";
import ProgrammesPage from "@/pages/portal/ProgrammesPage";
import RotaPage from "@/pages/portal/RotaPage";
import DocumentsPage from "@/pages/portal/DocumentsPage";
import RequisitionsPage from "@/pages/portal/RequisitionsPage";
import ElectionsPage from "@/pages/portal/ElectionsPage";
import StudentVoicesPage from "@/pages/portal/StudentVoicesPage";
import HierarchyPage from "@/pages/portal/HierarchyPage";
import ActivityLogsPage from "@/pages/portal/ActivityLogsPage";
import RegisterMemberPage from "@/pages/portal/RegisterMemberPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route element={<PublicLayout />}>
              <Route path="/" element={<HomePage />} />
              <Route path="/student-voice" element={<StudentVoicePage />} />
              <Route path="/login" element={<LoginPage />} />
            </Route>

            {/* Portal routes (protected by PortalLayout) */}
            <Route path="/portal" element={<PortalLayout />}>
              {/* Open to all logged-in users */}
              <Route index element={<DashboardPage />} />
              <Route path="issues" element={<IssuesPage />} />
              <Route path="programmes" element={<ProgrammesPage />} />
              <Route path="rota" element={<RotaPage />} />
              <Route path="documents" element={<DocumentsPage />} />
              <Route path="hierarchy" element={<HierarchyPage />} />

              {/* Student Voices – secretariat & leadership */}
              <Route element={<RoleGuard allowedRoles={["patron", "chairperson", "general_secretary", "assistant_general_secretary"]} />}>
                <Route path="student-voices" element={<StudentVoicesPage />} />
              </Route>

              {/* Requisitions – finance chain */}
              <Route element={<RoleGuard allowedRoles={["patron", "chairperson", "secretary_finance"]} />}>
                <Route path="requisitions" element={<RequisitionsPage />} />
              </Route>

              {/* Elections – leadership & EC */}
              <Route element={<RoleGuard allowedRoles={["patron", "chairperson", "speaker", "electoral_commission"]} />}>
                <Route path="elections" element={<ElectionsPage />} />
              </Route>

              {/* Activity Logs – leadership & EC */}
              <Route element={<RoleGuard allowedRoles={["patron", "chairperson", "speaker", "electoral_commission"]} />}>
                <Route path="logs" element={<ActivityLogsPage />} />
              </Route>

              {/* Register Member – top leadership only */}
              <Route element={<RoleGuard allowedRoles={["patron", "chairperson"]} />}>
                <Route path="register-member" element={<RegisterMemberPage />} />
              </Route>
            </Route>

            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
