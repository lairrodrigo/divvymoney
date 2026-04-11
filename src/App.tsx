import { useState, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { WorkspaceProvider } from "@/contexts/WorkspaceContext";
import AppLayout from "@/components/AppLayout";
import SplashScreen from "@/components/SplashScreen";
import HomePage from "@/pages/HomePage";
import HistoryPage from "@/pages/HistoryPage";
import AddTransactionPage from "@/pages/AddTransactionPage";
import GoalsPage from "@/pages/GoalsPage";
import ComprasPage from "@/pages/ComprasPage";
import ProfilePage from "@/pages/ProfilePage";
import WorkspacePage from "@/pages/WorkspacePage";
import LoginPage from "@/pages/LoginPage";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoutes() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return <SplashScreen />;
  }

  if (!user) return <Navigate to="/login" replace />;

  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/historico" element={<HistoryPage />} />
        <Route path="/adicionar" element={<AddTransactionPage />} />
        <Route path="/metas" element={<GoalsPage />} />
        <Route path="/espacos" element={<WorkspacePage />} />
        <Route path="/perfil" element={<ProfilePage />} />
      </Route>
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

function AppRoutes() {
  const { user, isReady } = useAuth();
  const [minSplashReady, setMinSplashReady] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMinSplashReady(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (!isReady || !minSplashReady) return <SplashScreen />;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route path="/*" element={<ProtectedRoutes />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <AuthProvider>
        <WorkspaceProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </WorkspaceProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
