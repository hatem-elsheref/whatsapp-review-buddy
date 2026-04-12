import { MessageSquare, FileText, Users, Webhook, Settings } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { Section } from '../types';

const navItems: { section: Section; label: string; icon: React.ElementType }[] = [
  { section: 'chat', label: 'Chat Inbox', icon: MessageSquare },
  { section: 'templates', label: 'Templates', icon: FileText },
  { section: 'customers', label: 'Customers', icon: Users },
  { section: 'webhooks', label: 'Webhook Logs', icon: Webhook },
  { section: 'settings', label: 'Settings', icon: Settings },
];

const AppSidebar = () => {
  const { activeSection, setActiveSection } = useApp();

  return (
    <div className="w-16 lg:w-56 bg-sidebar flex flex-col border-r border-sidebar-border shrink-0 h-screen sticky top-0">
      <div className="p-3 lg:p-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <MessageSquare className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="hidden lg:block font-bold text-sm text-sidebar-foreground">WA Review Board</span>
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
      <div className="p-3 border-t border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
            D
          </div>
          <div className="hidden lg:block">
            <p className="text-xs font-medium text-sidebar-foreground">Developer</p>
            <p className="text-xs text-muted-foreground">App Review</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppSidebar;
