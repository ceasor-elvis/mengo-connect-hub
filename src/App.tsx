import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { MantineProvider } from "@mantine/core";
import "@mantine/core/styles.css";
import PublicLayout from "@/layouts/PublicLayout";
import PortalLayout from "@/layouts/PortalLayout";
import RoleGuard from "@/components/portal/RoleGuard";
import HomePage from "@/pages/HomePage";
import StudentVoicePage from "@/pages/StudentVoicePage";
import LoginPage from "@/pages/LoginPage";
import PublicBlogPage from "@/pages/PublicBlogPage";
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
import RegisterPatronPage from "./pages/portal/RegisterPatronPage";
import BlogManagerPage from "@/pages/portal/BlogManagerPage";
import DisciplinaryPage from "@/pages/portal/DisciplinaryPage";
import ActionPlanPage from "@/pages/portal/ActionPlanPage";
import SettingsPage from "@/pages/portal/SettingsPage";
import FinancialSummaryPage from "@/pages/portal/FinancialSummaryPage";
import HomeLayoutPage from "@/pages/portal/HomeLayoutPage";
import PermissionManagementPage from "@/pages/portal/PermissionManagementPage";
import IncomePage from "@/pages/portal/IncomePage";
import ReportsPage from "@/pages/portal/ReportsPage";
import NotFound from "./pages/NotFound.tsx";
const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MantineProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Routes>
              {/* Public routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/blog" element={<PublicBlogPage />} />
                <Route path="/student-voice" element={<StudentVoicePage />} />
                <Route path="/login" element={<LoginPage />} />
              </Route>

              {/* Portal routes (protected by PortalLayout) */}
              <Route path="/portal" element={<PortalLayout />}>
                {/* ... rest of routes ... */}
                <Route index element={<DashboardPage />} />
                <Route path="settings" element={<SettingsPage />} />
                <Route path="issues" element={<IssuesPage />} />
                <Route path="programmes" element={<ProgrammesPage />} />
                <Route path="rota" element={<RotaPage />} />
                <Route path="documents" element={<DocumentsPage />} />
                <Route path="hierarchy" element={<HierarchyPage />} />

                {/* Student Voices – secretariat & leadership */}
                <Route element={<RoleGuard allowedPermission="view_student_voices" />}>
                  <Route path="student-voices" element={<StudentVoicesPage />} />
                </Route>

                {/* Requisitions & Finance Summary – finance chain */}
                <Route element={<RoleGuard allowedPermission="view_requisitions" />}>
                  <Route path="requisitions" element={<RequisitionsPage />} />
                  <Route path="income" element={<IncomePage />} />
                  <Route path="financial-summary" element={<FinancialSummaryPage />} />
                </Route>

                {/* Blog Manager – Publicity & leadership */}
                <Route element={<RoleGuard allowedPermission="view_blog" />}>
                  <Route path="blog" element={<BlogManagerPage />} />
                </Route>
                
                {/* Disciplinary - DC & leadership */}
                <Route element={<RoleGuard allowedPermission="view_disciplinary" />}>
                  <Route path="disciplinary" element={<DisciplinaryPage />} />
                </Route>

                {/* Elections – leadership & EC */}
                <Route element={<RoleGuard allowedPermission="view_elections" />}>
                  <Route path="elections" element={<ElectionsPage />} />
                </Route>

                {/* Activity Logs – leadership & EC */}
                <Route element={<RoleGuard allowedPermission="view_logs" />}>
                  <Route path="logs" element={<ActivityLogsPage />} />
                </Route>

                {/* Register Member & Patron – top leadership only */}
                <Route element={<RoleGuard allowedPermission="register_member" />}>
                  <Route path="register-member" element={<RegisterMemberPage />} />
                </Route>
                <Route element={<RoleGuard allowedPermission="register_patron" />}>
                  <Route path="register-patron" element={<RegisterPatronPage />} />
                </Route>

                {/* Action Plan – leadership only */}
                <Route element={<RoleGuard allowedPermission="view_action_plan" />}>
                  <Route path="action-plan" element={<ActionPlanPage />} />
                </Route>

                {/* Reports – all roles with view_reports */}
                <Route element={<RoleGuard allowedPermission="view_reports" />}>
                  <Route path="reports" element={<ReportsPage />} />
                </Route>

                {/* Home Layout – admin only */}
                <Route element={<RoleGuard allowedPermission="manage_home_layout" />}>
                  <Route path="home-layout" element={<HomeLayoutPage />} />
                </Route>

                {/* Permission Management - Admin Absolute only */}
                <Route element={<RoleGuard allowedPermission="manage_permissions" />}>
                  <Route path="admin-absolute/features" element={<PermissionManagementPage />} />
                </Route>
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </MantineProvider>
  </QueryClientProvider>
);

export default App;
