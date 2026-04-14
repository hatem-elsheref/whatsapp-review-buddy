import { MessageSquare, FileText, Users, Webhook, Settings, Sun, Moon, LogOut, UsersRound, Workflow } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { useTheme } from '../context/ThemeContext';
import { Section } from '../types';
import { useNavigate } from 'react-router-dom';

const AppSidebar = () => {
  const { activeSection, setActiveSection } = useApp();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  
  const appName = import.meta.env.VITE_APP_NAME || 'WhatsApp Dashboard';
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isAdmin = user?.role === 'admin';

  const navItems: { section: Section; label: string; icon: React.ElementType }[] = [
    { section: 'chat', label: 'Chat Inbox', icon: MessageSquare },
    { section: 'templates', label: 'Templates', icon: FileText },
    { section: 'customers', label: 'Customers', icon: Users },
    { section: 'webhooks', label: 'Webhook Logs', icon: Webhook },
    ...(isAdmin ? [
      { section: 'flow' as Section, label: 'Flow Builder', icon: Workflow },
      { section: 'settings' as Section, label: 'Settings', icon: Settings },
      { section: 'users' as Section, label: 'Users', icon: UsersRound },
    ] : []),
  ];

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className="w-16 lg:w-56 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 h-screen sticky top-0">
      <div className="p-3 lg:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="hidden lg:block font-bold text-sm text-sidebar-foreground">{appName}</span>
        </div>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {navItems.map(({ section, label, icon: Icon }) => (
          <button
            key={section}
            onClick={() => setActiveSection(section)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
              activeSection === section
                ? 'bg-sidebar-accent text-primary font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
            }`}
          >
            <Icon className="w-5 h-5 shrink-0" />
            <span className="hidden lg:block">{label}</span>
          </button>
        ))}
      </nav>
      <div className="p-3 border-t border-sidebar-border space-y-2">
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span className="hidden lg:block">{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
        </button>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm text-red-400 hover:bg-red-500/10 transition-colors"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden lg:block">Logout</span>
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            {user?.name?.charAt(0).toUpperCase() || 'U'}
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-sidebar-foreground">{user?.name || 'User'}</p>
            <p className="text-xs text-muted-foreground capitalize">{user?.role || 'Agent'}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;