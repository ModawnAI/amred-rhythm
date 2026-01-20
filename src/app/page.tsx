'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { BottomNav } from '@/components/shared/bottom-nav';
import { useLifelogStore } from '@/store/lifelog-store';
import { HomeTab } from '@/components/tabs/home-tab';
import { LogsTab } from '@/components/tabs/logs-tab';
import { InsightsTab } from '@/components/tabs/insights-tab';
import { HistoryTab } from '@/components/tabs/history-tab';
import { ProfileTab } from '@/components/tabs/profile-tab';

const pageVariants = {
  initial: { opacity: 0, y: 10 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

// Clear old localStorage data once to ensure fresh mock data loads
if (typeof window !== 'undefined') {
  const STORAGE_VERSION = 'v3'; // Bumped for avatar support
  const versionKey = 'amred-rhythm-version';
  if (localStorage.getItem(versionKey) !== STORAGE_VERSION) {
    localStorage.removeItem('amred-rhythm-storage');
    localStorage.setItem(versionKey, STORAGE_VERSION);
  }
}

export default function Home() {
  const { activeTab } = useLifelogStore();

  const renderTab = () => {
    switch (activeTab) {
      case 'home':
        return <HomeTab />;
      case 'logs':
        return <LogsTab />;
      case 'insights':
        return <InsightsTab />;
      case 'history':
        return <HistoryTab />;
      case 'profile':
        return <ProfileTab />;
      default:
        return <HomeTab />;
    }
  };

  return (
    <div className="flex-1 flex flex-col pb-20">
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.2 }}
          className="flex-1"
        >
          {renderTab()}
        </motion.div>
      </AnimatePresence>
      <BottomNav />
    </div>
  );
}
