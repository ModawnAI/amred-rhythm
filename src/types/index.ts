// Lifelog Entry Types
export type LogType = 'diet' | 'sleep' | 'activity' | 'weight' | 'mood';

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type MoodScore = 1 | 2 | 3 | 4 | 5;
export type Intensity = 'low' | 'medium' | 'high';
export type WeightTime = 'am' | 'pm';

export interface LifelogEntry {
  id: string;
  userId: string;
  timestamp: string; // ISO String
  date: string; // YYYY-MM-DD
  type: LogType;
  value: number;
  metadata: {
    // Diet specific
    mealType?: MealType;
    mealDescription?: string;
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
    sodium?: number;
    photoUrl?: string;

    // Sleep specific
    sleepQuality?: MoodScore;
    bedtime?: string;
    wakeTime?: string;

    // Activity specific
    activityType?: string;
    intensity?: Intensity;
    duration?: number; // minutes

    // Weight specific
    weightTime?: WeightTime;

    // Mood specific
    moodScore?: MoodScore;
    moodNote?: string;

    // General
    description?: string;
  };
}

// AI Feedback Types
export type FeedbackType = 'morning' | 'evening' | 'warning';
export type RiskLevel = 'low' | 'medium' | 'high';

export interface Factor {
  id: string;
  name: string;
  description: string;
  evidence: string; // The specific data point
  impact: 'positive' | 'negative' | 'neutral';
}

export interface AIFeedback {
  id: string;
  userId: string;
  date: string;
  type: FeedbackType;
  content: string;
  factors: Factor[];
  prescriptions?: string[]; // 1-2 behavioral tasks
  riskLevel?: RiskLevel;
  riskReason?: string;
  createdAt: string;
}

// CRM Export Types
export interface CRMRecord {
  id: string;
  userId: string;
  date: string;
  summary: string;
  riskFlag: boolean;
  riskLevel?: RiskLevel;
  recommendedAction: string;
  messageLog: string;
  factors: Factor[];
  createdAt: string;
}

// User Profile
export interface UserProfile {
  id: string;
  name: string;
  age?: number;
  gender?: 'male' | 'female' | 'other';
  height?: number; // cm
  targetWeight?: number; // kg
  healthGoals?: string[];
  avatarUrl?: string;
  createdAt: string;
}

// Navigation
export type TabId = 'home' | 'logs' | 'insights' | 'history' | 'profile';

export interface NavItem {
  id: TabId;
  label: string;
  icon: string;
}
