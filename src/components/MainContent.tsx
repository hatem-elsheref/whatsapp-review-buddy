import { useApp } from '../context/AppContext';
import ChatInbox from './chat/ChatInbox';
import TemplatesSection from './templates/TemplatesSection';
import CustomersSection from './customers/CustomersSection';
import WebhookLogsSection from './webhooks/WebhookLogsSection';
import SettingsSection from './settings/SettingsSection';
import { motion, AnimatePresence } from 'framer-motion';

const MainContent = () => {
  const { activeSection } = useApp();

  const sections: Record<string, React.ReactNode> = {
    chat: <ChatInbox />,
    templates: <TemplatesSection />,
    customers: <CustomersSection />,
    webhooks: <WebhookLogsSection />,
    settings: <SettingsSection />,
  };

  return (
    <div className="flex-1 h-screen overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.15 }}
          className="h-full"
        >
          {sections[activeSection]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default MainContent;
