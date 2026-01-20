'use client';

import { motion } from 'framer-motion';
import {
  House,
  NotePencil,
  ChartLine,
  ClockCounterClockwise,
  User,
} from '@phosphor-icons/react';
import { useLifelogStore } from '@/store/lifelog-store';
import type { TabId } from '@/types';

interface NavItem {
  id: TabId;
  label: string;
  Icon: typeof House;
}

const navItems: NavItem[] = [
  { id: 'home', label: '홈', Icon: House },
  { id: 'logs', label: '기록', Icon: NotePencil },
  { id: 'insights', label: '분석', Icon: ChartLine },
  { id: 'history', label: '히스토리', Icon: ClockCounterClockwise },
  { id: 'profile', label: '프로필', Icon: User },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useLifelogStore();

  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] h-16 bg-white border-t border-gray-100 flex justify-around items-center z-50 safe-area-bottom">
      {navItems.map(({ id, label, Icon }) => {
        const isActive = activeTab === id;

        return (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className="relative flex flex-col items-center justify-center w-16 h-full gap-0.5"
          >
            {isActive && (
              <motion.div
                layoutId="activeTab"
                className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-[#665DC6] rounded-full"
                transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              />
            )}
            <motion.div
              animate={{
                scale: isActive ? 1.1 : 1,
                y: isActive ? -2 : 0,
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            >
              <Icon
                size={24}
                weight={isActive ? 'fill' : 'regular'}
                className={isActive ? 'text-[#665DC6]' : 'text-gray-400'}
              />
            </motion.div>
            <span
              className={`text-[10px] font-medium ${
                isActive ? 'text-[#665DC6]' : 'text-gray-400'
              }`}
            >
              {label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
