import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import PublicLayout from "@/layouts/PublicLayout";
import PortalLayout from "@/layouts/PortalLayout";
import HomePage from "@/pages/HomePage";
import StudentVoicePage from "@/pages/StudentVoicePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/portal/DashboardPage";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<PublicLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/student-voice" element={<StudentVoicePage />} />
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Portal routes (protected once auth is enabled) */}
          <Route path="/portal" element={<PortalLayout />}>
            <Route index element={<DashboardPage />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
