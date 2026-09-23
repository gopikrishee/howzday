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

export type MoodTimeSlot = 'slot_12am_8am' | 'slot_8am_4pm' | 'slot_4pm_12am';

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
  timeSlot?: MoodTimeSlot; // slot_12am_8am, slot_8am_4pm, slot_4pm_12am
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

export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskCategory = 'Work' | 'Health' | 'Crood Sync' | 'Personal' | 'Mindfulness';

export interface TaskModifier {
  uid: string;
  displayName: string;
  photoURL?: string;
}

export interface TaskCheer {
  uid: string;
  emoji: string;
  name: string;
}

export interface DailyTaskItem {
  id: string;
  title: string;
  completed: boolean;
  priority: TaskPriority;
  category?: TaskCategory;
  assignedTo?: TaskModifier;
  collabWith?: TaskModifier[];
  createdBy: TaskModifier;
  lastModifiedBy: TaskModifier;
  lastModifiedAt: string; // ISO date string
  createdAt: string; // ISO date string
  cheers?: TaskCheer[];
}

export interface CollaboratorSummary {
  uid: string;
  displayName: string;
  email?: string;
  photoURL?: string;
  currentStreak?: number;
  latestMood?: MoodLevel | null;
}

export interface DailyPlanner {
  id: string;
  ownerId: string;
  ownerName: string;
  ownerPhoto?: string;
  date: string; // YYYY-MM-DD
  title: string;
  attachedCroodIds: string[]; // UIDs of attached croods
  collaboratorIds: string[]; // [ownerId, ...attachedCroodIds]
  collaborators: CollaboratorSummary[];
  tasks: DailyTaskItem[];
  createdAt: string;
  updatedAt?: string;
}


