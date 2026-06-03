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
import CouncilBoardPage from "@/pages/CouncilBoardPage";
import GalleryPage from "@/pages/GalleryPage";
import CalendarPage from "@/pages/CalendarPage";
import FeaturesPage from "@/pages/FeaturesPage";
import DashboardPage from "@/pages/portal/DashboardPage";
import IssuesPage from "@/pages/portal/IssuesPage";
import ProgrammesPage from "@/pages/portal/ProgrammesPage";
import RotaPage from "@/pages/portal/RotaPage";
import DocumentsPage from "@/pages/portal/DocumentsPage";
import RequisitionsPage from "@/pages/portal/RequisitionsPage";
import ElectionsPage from "@/pages/portal/ElectionsPage";
import ElectionControlPage from "@/pages/portal/ElectionControlPage";
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
import EvoteLayout from "@/layouts/EvoteLayout";
import EvoteLoginPage from "@/pages/portal/evote/LoginPage";
import EvoteConfirmPage from "@/pages/portal/evote/ConfirmPage";
import EvoteVotePage from "@/pages/portal/evote/VotePage";
import EvoteAdminLoginPage from "@/pages/portal/evote/AdminLoginPage";
import EvoteAdminDashboard from "@/pages/portal/evote/AdminDashboard";
import EvoteAdminManage from "@/pages/portal/evote/AdminManage";
import EvoteAdminReports from "@/pages/portal/evote/AdminReports";
import EvoteAdminTimingPage from "@/pages/portal/evote/AdminTimingPage";
import EvoteAdminCodes from "@/pages/portal/evote/AdminCodes";
import EvoteNotFound from "@/pages/portal/evote/NotFound";
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
                <Route path="/council-board" element={<CouncilBoardPage />} />
                <Route path="/gallery" element={<GalleryPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/features" element={<FeaturesPage />} />
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
                <Route element={<RoleGuard allowedPermission="manage_elections" />}>
                  <Route path="elections/control" element={<ElectionControlPage />} />
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

              {/* E-Voting routes wrapped in EvoteLayout */}
              <Route path="/evote" element={<EvoteLayout />}>
                <Route index element={<EvoteLoginPage />} />
                <Route path="confirm" element={<EvoteConfirmPage />} />
                <Route path="vote" element={<EvoteVotePage />} />
                <Route path="admin/login" element={<EvoteAdminLoginPage />} />
                <Route path="admin" element={<EvoteAdminDashboard />} />
                <Route path="admin/manage" element={<EvoteAdminManage />} />
                <Route path="admin/reports" element={<EvoteAdminReports />} />
                <Route path="admin/timing" element={<EvoteAdminTimingPage />} />
                <Route path="admin/codes" element={<EvoteAdminCodes />} />
                <Route path="*" element={<EvoteNotFound />} />
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
