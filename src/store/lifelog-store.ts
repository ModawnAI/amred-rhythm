'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { LifelogEntry, AIFeedback, UserProfile, TabId } from '@/types';
import { getMockData } from '@/lib/mock-data-loader';

// Get initial mock data
const initialMockData = getMockData();

interface LifelogState {
  // Data
  logs: LifelogEntry[];
  feedbacks: AIFeedback[];
  profile: UserProfile | null;

  // UI State
  activeTab: TabId;
  isLoading: boolean;
  selectedDate: string; // YYYY-MM-DD

  // Actions - Logs
  addLog: (log: Omit<LifelogEntry, 'id' | 'timestamp'>) => void;
  updateLog: (id: string, updates: Partial<LifelogEntry>) => void;
  deleteLog: (id: string) => void;
  getLogsByDate: (date: string) => LifelogEntry[];
  getLogsByType: (type: LifelogEntry['type']) => LifelogEntry[];

  // Actions - Feedbacks
  addFeedback: (feedback: Omit<AIFeedback, 'id' | 'createdAt'>) => void;
  getFeedbackByDate: (date: string) => AIFeedback[];
  getLatestFeedback: (type: AIFeedback['type']) => AIFeedback | null;

  // Actions - Profile
  setProfile: (profile: UserProfile) => void;
  updateProfile: (updates: Partial<UserProfile>) => void;

  // Actions - UI
  setActiveTab: (tab: TabId) => void;
  setSelectedDate: (date: string) => void;
  setLoading: (loading: boolean) => void;

  // Utility
  clearAllData: () => void;
}

const generateId = () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

const getTodayDate = () => new Date().toISOString().split('T')[0];

export const useLifelogStore = create<LifelogState>()(
  persist(
    (set, get) => ({
      // Initial State - Pre-populated with mock data
      logs: initialMockData.logs,
      feedbacks: initialMockData.feedbacks,
      profile: initialMockData.profile,
      activeTab: 'home',
      isLoading: false,
      selectedDate: getTodayDate(),

      // Log Actions
      addLog: (log) =>
        set((state) => ({
          logs: [
            ...state.logs,
            {
              ...log,
              id: generateId(),
              timestamp: new Date().toISOString(),
            },
          ],
        })),

      updateLog: (id, updates) =>
        set((state) => ({
          logs: state.logs.map((log) =>
            log.id === id ? { ...log, ...updates } : log
          ),
        })),

      deleteLog: (id) =>
        set((state) => ({
          logs: state.logs.filter((log) => log.id !== id),
        })),

      getLogsByDate: (date) => {
        return get().logs.filter((log) => log.date === date);
      },

      getLogsByType: (type) => {
        return get().logs.filter((log) => log.type === type);
      },

      // Feedback Actions
      addFeedback: (feedback) =>
        set((state) => ({
          feedbacks: [
            ...state.feedbacks,
            {
              ...feedback,
              id: generateId(),
              createdAt: new Date().toISOString(),
            },
          ],
        })),

      getFeedbackByDate: (date) => {
        return get().feedbacks.filter((f) => f.date === date);
      },

      getLatestFeedback: (type) => {
        const filtered = get().feedbacks.filter((f) => f.type === type);
        if (filtered.length === 0) return null;
        return filtered.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )[0];
      },

      // Profile Actions
      setProfile: (profile) => set({ profile }),

      updateProfile: (updates) =>
        set((state) => ({
          profile: state.profile ? { ...state.profile, ...updates } : null,
        })),

      // UI Actions
      setActiveTab: (activeTab) => set({ activeTab }),
      setSelectedDate: (selectedDate) => set({ selectedDate }),
      setLoading: (isLoading) => set({ isLoading }),

      // Utility
      clearAllData: () =>
        set({
          logs: [],
          feedbacks: [],
          profile: null,
          selectedDate: getTodayDate(),
        }),
    }),
    {
      name: 'amred-rhythm-storage',
      partialize: (state) => ({
        logs: state.logs,
        feedbacks: state.feedbacks,
        profile: state.profile,
      }),
    }
  )
);
