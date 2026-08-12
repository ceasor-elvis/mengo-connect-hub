import React, { lazy, Suspense } from "react";
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

// Direct / Critical Eager Load for Instant Landing Page LCP
import HomePage from "@/pages/HomePage";

// Lazy-loaded secondary public routes
const PublicBlogPage = lazy(() => import("@/pages/PublicBlogPage"));
const StudentVoicePage = lazy(() => import("@/pages/StudentVoicePage"));
const CouncilBoardPage = lazy(() => import("@/pages/CouncilBoardPage"));
const GalleryPage = lazy(() => import("@/pages/GalleryPage"));
const CalendarPage = lazy(() => import("@/pages/CalendarPage"));
const LoginPage = lazy(() => import("@/pages/LoginPage"));

// Lazy-loaded portal routes
const DashboardPage = lazy(() => import("@/pages/portal/DashboardPage"));
const IssuesPage = lazy(() => import("@/pages/portal/IssuesPage"));
const ProgrammesPage = lazy(() => import("@/pages/portal/ProgrammesPage"));
const RotaPage = lazy(() => import("@/pages/portal/RotaPage"));
const DocumentsPage = lazy(() => import("@/pages/portal/DocumentsPage"));
const RequisitionsPage = lazy(() => import("@/pages/portal/RequisitionsPage"));
const ElectionsPage = lazy(() => import("@/pages/portal/ElectionsPage"));
const ElectionControlPage = lazy(() => import("@/pages/portal/ElectionControlPage"));
const StudentVoicesPage = lazy(() => import("@/pages/portal/StudentVoicesPage"));
const HierarchyPage = lazy(() => import("@/pages/portal/HierarchyPage"));
const ActivityLogsPage = lazy(() => import("@/pages/portal/ActivityLogsPage"));
const RegisterMemberPage = lazy(() => import("@/pages/portal/RegisterMemberPage"));
const RegisterPatronPage = lazy(() => import("./pages/portal/RegisterPatronPage"));
const BlogManagerPage = lazy(() => import("@/pages/portal/BlogManagerPage"));
const GalleryManagerPage = lazy(() => import("@/pages/portal/GalleryManagerPage"));
const DisciplinaryPage = lazy(() => import("@/pages/portal/DisciplinaryPage"));
const ActionPlanPage = lazy(() => import("@/pages/portal/ActionPlanPage"));
const SettingsPage = lazy(() => import("@/pages/portal/SettingsPage"));
const FinancialSummaryPage = lazy(() => import("@/pages/portal/FinancialSummaryPage"));
const HomeLayoutPage = lazy(() => import("@/pages/portal/HomeLayoutPage"));
const PermissionManagementPage = lazy(() => import("@/pages/portal/PermissionManagementPage"));
const IncomePage = lazy(() => import("@/pages/portal/IncomePage"));
const NotificationsPage = lazy(() => import("@/pages/portal/NotificationsPage"));
const ReportsPage = lazy(() => import("@/pages/portal/ReportsPage"));
const SystemFeedbackPage = lazy(() => import("@/pages/portal/SystemFeedbackPage"));
const NotFound = lazy(() => import("./pages/NotFound.tsx"));

// Lazy-loaded e-vote routes
const EvoteLayout = lazy(() => import("@/layouts/EvoteLayout"));
const EvoteLoginPage = lazy(() => import("@/pages/portal/evote/LoginPage"));
const EvoteConfirmPage = lazy(() => import("@/pages/portal/evote/ConfirmPage"));
const EvoteVotePage = lazy(() => import("@/pages/portal/evote/VotePage"));
const EvoteAdminLoginPage = lazy(() => import("@/pages/portal/evote/AdminLoginPage"));
const EvoteAdminDashboard = lazy(() => import("@/pages/portal/evote/AdminDashboard"));
const EvoteAdminManage = lazy(() => import("@/pages/portal/evote/AdminManage"));
const EvoteAdminReports = lazy(() => import("@/pages/portal/evote/AdminReports"));
const EvoteAdminTimingPage = lazy(() => import("@/pages/portal/evote/AdminTimingPage"));
const EvoteAdminCodes = lazy(() => import("@/pages/portal/evote/AdminCodes"));
const EvoteNotFound = lazy(() => import("@/pages/portal/evote/NotFound"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh] p-8">
    <div className="flex flex-col items-center gap-3">
      <div className="h-8 w-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      <p className="text-xs font-semibold text-muted-foreground tracking-wider uppercase">Loading...</p>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <MantineProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public routes */}
                <Route element={<PublicLayout />}>
                  <Route path="/" element={<HomePage />} />
                  <Route path="/blog" element={<PublicBlogPage />} />
                  <Route path="/student-voice" element={<StudentVoicePage />} />
                  <Route path="/council-board" element={<CouncilBoardPage />} />
                  <Route path="/gallery" element={<GalleryPage />} />
                  <Route path="/calendar" element={<CalendarPage />} />

                  <Route path="/login" element={<LoginPage />} />
                </Route>

                {/* Portal routes (protected by PortalLayout) */}
                <Route path="/portal" element={<PortalLayout />}>
                  {/* ... rest of routes ... */}
                  <Route index element={<DashboardPage />} />
                  <Route path="notifications" element={<NotificationsPage />} />
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
                  <Route element={<RoleGuard allowedPermission="manage_blog" />}>
                    <Route path="gallery" element={<GalleryManagerPage />} />
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

                  {/* Activity Logs – Leadership */}
                  <Route element={<RoleGuard allowedPermission="view_logs" />}>
                    <Route path="logs" element={<ActivityLogsPage />} />
                  </Route>

                  {/* Register Member / Patron / Admin Absolute */}
                  <Route element={<RoleGuard allowedPermission="register_member" />}>
                    <Route path="register-member" element={<RegisterMemberPage />} />
                  </Route>
                  <Route element={<RoleGuard allowedPermission="register_patron" />}>
                    <Route path="register-patron" element={<RegisterPatronPage />} />
                  </Route>
                  <Route element={<RoleGuard allowedPermission="manage_home_layout" />}>
                    <Route path="home-layout" element={<HomeLayoutPage />} />
                  </Route>
                  <Route element={<RoleGuard allowedPermission="view_action_plan" />}>
                    <Route path="action-plan" element={<ActionPlanPage />} />
                  </Route>
                  <Route element={<RoleGuard allowedPermission="manage_permissions" />}>
                    <Route path="admin-absolute/features" element={<PermissionManagementPage />} />
                  </Route>
                  <Route element={<RoleGuard allowedPermission="view_reports" />}>
                    <Route path="reports" element={<ReportsPage />} />
                  </Route>
                  <Route path="feedback" element={<SystemFeedbackPage />} />
                </Route>

                {/* E-Voting routes */}
                <Route path="/evote" element={<EvoteLayout />}>
                  <Route index element={<EvoteLoginPage />} />
                  <Route path="confirm" element={<EvoteConfirmPage />} />
                  <Route path="vote" element={<EvoteVotePage />} />
                  <Route path="admin" element={<EvoteAdminLoginPage />} />
                  <Route path="admin/dashboard" element={<EvoteAdminDashboard />} />
                  <Route path="admin/manage" element={<EvoteAdminManage />} />
                  <Route path="admin/reports" element={<EvoteAdminReports />} />
                  <Route path="admin/timing" element={<EvoteAdminTimingPage />} />
                  <Route path="admin/codes" element={<EvoteAdminCodes />} />
                  <Route path="*" element={<EvoteNotFound />} />
                </Route>

                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </MantineProvider>
  </QueryClientProvider>
);

export default App;
