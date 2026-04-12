import { AppProvider } from './context/AppContext';
import AppSidebar from './components/AppSidebar';
import MainContent from './components/MainContent';
import { Toaster as Sonner } from "@/components/ui/sonner";

const App = () => (
  <AppProvider>
    <div className="flex h-screen overflow-hidden">
      <AppSidebar />
      <MainContent />
    </div>
    <Sonner />
  </AppProvider>
);

export default App;
