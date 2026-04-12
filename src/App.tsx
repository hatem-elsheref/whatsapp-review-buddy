import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { ThemeProvider } from './context/ThemeContext';
import AppSidebar from './components/AppSidebar';
import MainContent from './components/MainContent';
import { Toaster as Sonner } from "@/components/ui/sonner";
import LoginPage from './pages/LoginPage';
import PendingVerificationPage from './pages/PendingVerificationPage';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = localStorage.getItem('auth_token');
  const location = useLocation();
  
  if (!token) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }
  
  return <>{children}</>;
};

const AppLayout = () => (
  <div className="flex h-screen overflow-hidden">
    <AppSidebar />
    <MainContent />
  </div>
);

const App = () => (
  <BrowserRouter>
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