import mockData from '@/data/mock-data.json';
import type { LifelogEntry, AIFeedback, UserProfile } from '@/types';

export interface MockData {
  profile: UserProfile;
  logs: LifelogEntry[];
  feedbacks: AIFeedback[];
}

// Get current date in KST (Korean Standard Time, UTC+9)
function getKSTDate(): Date {
  const now = new Date();
  const kstOffset = 9 * 60; // KST is UTC+9
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + kstOffset * 60000);
}

function formatKSTDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getMockData(): MockData {
  // Update dates to be relative to today in KST
  const todayKST = getKSTDate();
  const baseDate = new Date('2025-01-20'); // Reference date in mock data

  const dayOffset = (dateStr: string): string => {
    const originalDate = new Date(dateStr);
    const daysDiff = Math.floor(
      (originalDate.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const newDate = new Date(todayKST);
    newDate.setDate(todayKST.getDate() + daysDiff);
    return formatKSTDate(newDate);
  };

  const adjustTimestamp = (timestamp: string, date: string): string => {
    const originalTime = new Date(timestamp);
    const hours = originalTime.getHours();
    const minutes = originalTime.getMinutes();
    // Create timestamp in KST
    const [year, month, day] = date.split('-').map(Number);
    const kstDate = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return kstDate.toISOString();
  };

  // Adjust logs to recent dates
  const adjustedLogs = mockData.logs.map((log) => {
    const newDate = dayOffset(log.date);
    return {
      ...log,
      date: newDate,
      timestamp: adjustTimestamp(log.timestamp, newDate),
    };
  }) as LifelogEntry[];

  // Adjust feedbacks to recent dates
  const adjustedFeedbacks = mockData.feedbacks.map((feedback) => {
    const newDate = dayOffset(feedback.date);
    return {
      ...feedback,
      date: newDate,
      createdAt: adjustTimestamp(feedback.createdAt, newDate),
    };
  }) as AIFeedback[];

  return {
    profile: mockData.profile as UserProfile,
    logs: adjustedLogs,
    feedbacks: adjustedFeedbacks,
  };
}

export function loadMockDataToStore(
  setProfile: (profile: UserProfile) => void,
  addLog: (log: Omit<LifelogEntry, 'id' | 'timestamp'>) => void,
  addFeedback: (feedback: Omit<AIFeedback, 'id' | 'createdAt'>) => void,
  clearAllData: () => void
): { logsCount: number; feedbacksCount: number } {
  // Clear existing data first
  clearAllData();

  const { profile, logs, feedbacks } = getMockData();

  // Set profile
  setProfile(profile);

  // Add logs (store will generate new IDs and timestamps)
  logs.forEach((log) => {
    addLog({
      userId: log.userId,
      date: log.date,
      type: log.type,
      value: log.value,
      metadata: log.metadata,
    });
  });

  // Add feedbacks
  feedbacks.forEach((feedback) => {
    addFeedback({
      userId: feedback.userId,
      date: feedback.date,
      type: feedback.type,
      content: feedback.content,
      factors: feedback.factors,
      prescriptions: feedback.prescriptions,
      riskLevel: feedback.riskLevel,
    });
  });

  return { logsCount: logs.length, feedbacksCount: feedbacks.length };
}
