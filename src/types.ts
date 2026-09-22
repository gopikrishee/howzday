export type MoodLevel =
  | 'happy'
  | 'neutral'
  | 'sad'
  | 'angry'
  | 'tired'
  | 'relax'
  | 'sleepy'
  | 'romantic'
  | 'sick';

export interface MoodConfig {
  id: MoodLevel;
  label: string;
  tagline: string;
  primaryColor: string;
  bgLight: string;
  borderColor: string;
  textColor: string;
  glowColor: string;
  emoji: string;
  soundCue?: string;
  description: string;
}

export interface MoodEntry {
  id: string;
  userId?: string;
  date: string; // YYYY-MM-DD
  timestamp: number;
  mood: MoodLevel;
  reason?: string;
  isPrivateReason?: boolean; // true if user selected "Not willing to tell"
  tags?: string[];
  xpEarned: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface GamificationStats {
  userId?: string;
  currentStreak: number;
  longestStreak: number;
  totalCheckIns: number;
  currentXp: number;
  level: number;
  lastCheckInDate?: string;
  todayCompleted: boolean;
  unlockedBadges: string[];
  updatedAt?: string;
}

export type AppTab = 'moods' | 'feeds' | 'croods' | 'insights';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  level: number;
  currentStreak: number;
  latestMood?: MoodLevel | null;
  latestMoodDate?: string | null;
  latestMoodReason?: string | null;
  latestMoodIsPrivate?: boolean;
  updatedAt?: string;
}

export interface FriendRequest {
  id: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName: string;
  receiverEmail: string;
  receiverPhoto?: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface FriendActivityFeedItem {
  friend: UserProfile;
  latestMood: MoodLevel;
  date: string;
  updatedAt?: string;
}

export interface NudgeNotification {
  id: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  receiverId: string;
  receiverName: string;
  date: string; // YYYY-MM-DD
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface StatusReaction {
  id: string; // react_${targetUserId}_${senderId}
  targetUserId: string;
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  targetMood: MoodLevel;
  emoji: string;
  label: string;
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface CroodCheckInNotification {
  id: string; // moodchange_${date}_${senderId}_${receiverId}_${timestamp}
  senderId: string;
  senderName: string;
  senderPhoto?: string;
  receiverId: string;
  date: string; // YYYY-MM-DD
  message: string; // "Your crood's mood changed today"
  read: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface MonthlyInsight {
  monthKey: string; // e.g. "2026-09"
  monthName: string; // e.g. "September 2026"
  totalEntries: number;
  emotionalWeather: {
    archetype: string; // e.g. "Golden Horizon", "Steady Anchor", "Breezy Growth"
    emoji: string;
    headline: string;
  };
  reflectiveSummary: string; // 2-3 sentence thoughtful reflection
  keyStrengths: string[]; // 2-3 bullet highlights
  mindfulExperiment: string; // 1 actionable suggestion for next month
  topMoodDistribution: {
    dominantMood: MoodLevel;
    dominantPercentage: number;
    happyPercentage: number;
    neutralPercentage: number;
    challengingPercentage: number;
  };
  emotionalSpectrum?: {
    upliftedDaysPercent: number;
    calmDaysPercent: number;
    challengingDaysPercent: number;
  };
  catalystTags?: {
    positiveTags: string[];
    challengingTags: string[];
  };
  positiveCatalysts?: string[];
  stressTriggers?: string[];
  generatedAt: number;
  isAiGenerated: boolean;
}


