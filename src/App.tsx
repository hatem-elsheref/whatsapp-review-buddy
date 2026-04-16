import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import AppSidebar from './components/AppSidebar';
import MainContent from './components/MainContent';
import { Toaster as Sonner } from "@/components/ui/sonner";
import LoginPage from './pages/LoginPage';
import PendingVerificationPage from './pages/PendingVerificationPage';
import { api } from './lib/api';
import { useEffect, useState } from 'react';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();
  const [checking, setChecking] = useState(true);
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await api.get<{ user: unknown }>('/me');
        if (mounted && (res as any)?.user) {
          localStorage.setItem('user', JSON.stringify((res as any).user));
        }
      } catch {
        // api.ts will handle redirect on auth failure
      } finally {
        if (mounted) setChecking(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (checking) return null;
  
  return <>{children}</>;
};

const AppLayout = () => (
  <div className="flex h-screen overflow-hidden">
    <AppSidebar />
    <MainContent />
  </div>
);

const routerBasename = (import.meta.env.BASE_URL || "/").replace(/\/$/, "") || undefined;

const App = () => (
  <BrowserRouter basename={routerBasename} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
    <ThemeProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/pending-verification" element={<PendingVerificationPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppProvider>
                <AppLayout />
                <Sonner />
              </AppProvider>
            </ProtectedRoute>
          }
        />
      </Routes>
    </ThemeProvider>
  </BrowserRouter>
);

export default App;