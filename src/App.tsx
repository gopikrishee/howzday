import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { MoodLevel, MoodEntry, GamificationStats, AppTab, UserProfile, FriendRequest, NudgeNotification, StatusReaction, CroodCheckInNotification, DailyPlanner } from './types';
import { storageService, getTodayDateString } from './services/storageService';
import { firestoreService } from './services/firestoreService';
import { notificationService } from './services/notificationService';
import { signInWithGoogle, logOut, onQuotaExceededChange, isQuotaExceededError } from './services/firebase';
import { GamificationHeader } from './components/GamificationHeader';
import { CelebrationModal } from './components/CelebrationModal';
import { MoodHistoryModal } from './components/MoodHistoryModal';
import { DomainAuthorizationModal } from './components/DomainAuthorizationModal';
import { NudgeToast } from './components/NudgeToast';
import { CroodsReactedToast } from './components/CroodsReactedToast';
import { CroodCheckInToast } from './components/CroodCheckInToast';
import { NudgeNotificationModal } from './components/NudgeNotificationModal';
import { BottomNavigation } from './components/BottomNavigation';
import { MoodsView } from './components/MoodsView';
import { FeedsView } from './components/FeedsView';
import { CroodsView } from './components/CroodsView';
import { MonthlyInsightView } from './components/MonthlyInsightView';
import { OfflineIndicator } from './components/OfflineIndicator';
import { getMoodTheme } from './data/moodThemes';

export default function App() {
  const [activeTab, setActiveTab] = useState<AppTab>('moods');
  const [selectedMood, setSelectedMood] = useState<MoodLevel | null>(null);
  const [todayEntry, setTodayEntry] = useState<MoodEntry | null>(() => storageService.getTodayEntry());
  const [stats, setStats] = useState<GamificationStats>(() => storageService.getStats());
  const [entries, setEntries] = useState<MoodEntry[]>(() => storageService.getEntries());
  const [isSaving, setIsSaving] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [latestSavedEntry, setLatestSavedEntry] = useState<MoodEntry | null>(null);
  const [latestDeltaXp, setLatestDeltaXp] = useState<number>(35);
  const [newLevelUnlocked, setNewLevelUnlocked] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  // Firebase auth & cloud sync state
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isCloudSynced, setIsCloudSynced] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isUnauthorizedDomain, setIsUnauthorizedDomain] = useState(false);
  const [showDomainAuthModal, setShowDomainAuthModal] = useState(false);
  const [isQuotaExceeded, setIsQuotaExceeded] = useState(false);

  useEffect(() => {
    const unsub = onQuotaExceededChange((exceeded) => {
      setIsQuotaExceeded(exceeded);
    });
    return () => unsub();
  }, []);

  // Social & Croods state
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingNudges, setIncomingNudges] = useState<NudgeNotification[]>([]);
  const [sentNudges, setSentNudges] = useState<NudgeNotification[]>([]);
  const [activeNudgeToast, setActiveNudgeToast] = useState<NudgeNotification | null>(null);
  const [showNudgesModal, setShowNudgesModal] = useState(false);
  const [statusReactions, setStatusReactions] = useState<StatusReaction[]>([]);
  const [sentReactions, setSentReactions] = useState<StatusReaction[]>([]);
  const [activeCheckInToast, setActiveCheckInToast] = useState<CroodCheckInNotification | null>(null);
  const [dailyPlanners, setDailyPlanners] = useState<DailyPlanner[]>(() => storageService.getDailyPlanners());
  const dismissedNudgeIdsRef = React.useRef<Set<string>>(new Set());

  // Subscribe to real-time Daily Collaborative Planners
  useEffect(() => {
    if (!currentUser) {
      setDailyPlanners(storageService.getDailyPlanners());
      return;
    }

    const unsubPlanners = firestoreService.subscribeDailyPlanners(
      currentUser.uid,
      (cloudPlanners) => {
        setDailyPlanners(cloudPlanners);
        storageService.saveDailyPlanners(currentUser.uid, cloudPlanners);
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to daily planners:', err);
        }
      }
    );

    return () => unsubPlanners();
  }, [currentUser?.uid]);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = firestoreService.onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(true);

        // One-time historical cleanup to purge old data prior to today
        const cleanupKey = `howzday_historical_cleanup_done_${user.uid}`;
        if (!localStorage.getItem(cleanupKey)) {
          try {
            await firestoreService.purgeHistoricalEntriesExceptToday(user.uid);
          } catch (err) {
            console.warn('Could not purge historical Firestore entries:', err);
          }
          storageService.purgeHistoricalEntriesExceptToday(user.uid);
          localStorage.setItem(cleanupKey, 'true');
        }

        // Instantly load user-scoped local cache to prevent any layout/mood flicker
        const userCachedToday = storageService.getTodayEntry(user.uid);
        const userCachedStats = storageService.getStats(user.uid);
        const userCachedEntries = storageService.getEntries(user.uid);

        if (userCachedToday) {
          setTodayEntry(userCachedToday);
        }
        if (userCachedStats.totalCheckIns > 0 || userCachedStats.currentXp > 0) {
          setStats(userCachedStats);
        }
        if (userCachedEntries.length > 0) {
          setEntries(userCachedEntries);
        }

        // Sync and fetch remote Firestore data
        try {
          const remoteStats = await firestoreService.fetchUserStats(user.uid);
          if (remoteStats) {
            setStats(remoteStats);
          }

          const remoteEntries = await firestoreService.fetchUserEntries(user.uid);
          if (remoteEntries && remoteEntries.length > 0) {
            setEntries(remoteEntries);
            const today = getTodayDateString();
            const todayEntries = remoteEntries.filter((e) => e.date === today);
            const todayCloud = todayEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
            setTodayEntry(todayCloud || null);
            storageService.cacheCloudData(user.uid, remoteEntries, remoteStats);
            setStats(storageService.getStats(user.uid));
          } else if (userCachedToday) {
            // If cloud has no entries yet, sync today's cached entry
            await firestoreService.syncUserProfile(
              user,
              remoteStats || userCachedStats,
              userCachedToday.mood,
              userCachedToday.date,
              userCachedToday.reason,
              userCachedToday.isPrivateReason
            );
          }
        } catch (err) {
          if (!isQuotaExceededError(err)) {
            console.error('Error fetching user stats/profile from Firestore:', err);
          }
        }
      } else {
        setIsCloudSynced(false);
        const guestCleanupKey = 'howzday_guest_cleanup_done';
        if (!localStorage.getItem(guestCleanupKey)) {
          storageService.purgeHistoricalEntriesExceptToday();
          localStorage.setItem(guestCleanupKey, 'true');
        }
        const localToday = storageService.getTodayEntry();
        setTodayEntry(localToday || null);
        setStats(storageService.getStats());
        setEntries(storageService.getEntries());
      }
    });

    return () => unsubscribeAuth();
  }, []);

  // Real-time Firestore sync for entries when authenticated
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribe = firestoreService.subscribeUserEntries(
      currentUser.uid,
      (cloudEntries) => {
        if (cloudEntries.length > 0) {
          setEntries(cloudEntries);
          const today = getTodayDateString();
          const todayEntries = cloudEntries.filter((e) => e.date === today);
          const todayCloud = todayEntries.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0))[0];
          setTodayEntry(todayCloud || null);
          const currentStats = storageService.getStats(currentUser.uid);
          storageService.cacheCloudData(currentUser.uid, cloudEntries, currentStats);
          setStats(currentStats);
        }
      },
      (error) => {
        if (!isQuotaExceededError(error)) {
          console.error('Firestore subscription error:', error);
        }
      }
    );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  // Subscribe to all registered users for live search & friend status
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeUsers = firestoreService.subscribeUsersList(
      (users) => {
        setAllRegisteredUsers(users);
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error loading users list:', err);
        }
      }
    );

    return () => unsubscribeUsers();
  }, [currentUser?.uid]);

  // Subscribe to friend requests involving the current user
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeRequests = firestoreService.subscribeFriendRequests(
      currentUser.uid,
      (requests) => {
        setFriendRequests(requests);
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to friend requests:', err);
        }
      }
    );

    return () => unsubscribeRequests();
  }, [currentUser?.uid]);

  // Subscribe to real-time incoming and sent nudges
  useEffect(() => {
    if (!currentUser) return;

    const unsubIncoming = firestoreService.subscribeIncomingNudges(
      currentUser.uid,
      (nudges) => {
        const today = getTodayDateString();
        const todayNudges = nudges.filter((n) => n.date === today);
        setIncomingNudges(todayNudges);

        // Show toast alert for the newest unread nudge today if available and not dismissed
        const unreadToday = todayNudges.filter(
          (n) => !n.read && !dismissedNudgeIdsRef.current.has(n.id)
        );
        if (unreadToday.length > 0) {
          setActiveNudgeToast((prev) => prev || unreadToday[0]);
        }
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to incoming nudges:', err);
        }
      }
    );

    const unsubSent = firestoreService.subscribeSentNudges(
      currentUser.uid,
      (nudges) => {
        const today = getTodayDateString();
        setSentNudges(nudges.filter((n) => n.date === today));
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to sent nudges:', err);
        }
      }
    );

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, [currentUser?.uid]);

  // Subscribe to real-time status reactions (who cheered/reacted to current user's mood status)
  useEffect(() => {
    if (!currentUser) {
      const local = storageService.getLocalReactions();
      setStatusReactions(local);
      return;
    }

    const unsubTarget = firestoreService.subscribeTargetReactions(
      currentUser.uid,
      (reactions) => {
        setStatusReactions(reactions);
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to status reactions:', err);
        }
      }
    );

    const unsubSent = firestoreService.subscribeSentReactions(
      currentUser.uid,
      (reactions) => {
        setSentReactions(reactions);
      },
      (err) => {
        if (!isQuotaExceededError(err)) {
          console.error('Error listening to sent reactions:', err);
        }
      }
    );

    return () => {
      unsubTarget();
      unsubSent();
    };
  }, [currentUser?.uid]);

  // Subscribe to real-time Crood mood change notifications for mobile push alerts & in-app alerts
  useEffect(() => {
    if (!currentUser) return;

    const todayStr = getTodayDateString();
    const unsubCheckIns = firestoreService.subscribeIncomingCheckInNotifications(
      currentUser.uid,
      todayStr,
      async (notifications) => {
        for (const notif of notifications) {
          if (!notif.read && !notificationService.hasPushedToday(notif.id, todayStr)) {
            notificationService.markPushedToday(notif.id, todayStr);

            // Trigger system mobile push notification
            await notificationService.pushMobileNotification(
              'HowZDay',
              notif.message,
              {
                tag: notif.id,
                url: './',
              }
            );

            // Also show real-time in-app banner toast
            setActiveCheckInToast(notif);
          }
        }
      },
      (err) => {
        console.warn('Error in incoming mood change notifications subscription:', err);
      }
    );

    return () => {
      unsubCheckIns();
    };
  }, [currentUser?.uid]);

  // Show incoming unread nudge notification across the app (irrespective of section)
  useEffect(() => {
    const unreadToday = incomingNudges.filter(
      (n) => !n.read && !dismissedNudgeIdsRef.current.has(n.id)
    );
    if (unreadToday.length > 0) {
      setActiveNudgeToast((prev) => prev || unreadToday[0]);
    } else {
      setActiveNudgeToast(null);
    }
  }, [incomingNudges]);

  // Check today's entry on mount and automatically refresh on new day / midnight rollover
  useEffect(() => {
    const checkToday = () => {
      const existing = storageService.getTodayEntry(currentUser?.uid);
      setTodayEntry(existing || null);
    };

    // Check periodically every 30 seconds & on tab visibility change to automatically release the lock on a brand new day
    const interval = setInterval(checkToday, 30000);
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkToday();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentUser]);

  // Compute accepted Crood friends
  const croodFriends = useMemo(() => {
    if (!currentUser) return [];

    const acceptedRequests = friendRequests.filter((r) => r.status === 'accepted');
    const friendsMap = new Map<string, UserProfile>();

    acceptedRequests.forEach((req) => {
      const isSender = req.senderId === currentUser.uid;
      const friendId = isSender ? req.receiverId : req.senderId;
      const friendName = isSender ? req.receiverName : req.senderName;
      const friendEmail = isSender ? req.receiverEmail : req.senderEmail;
      const friendPhoto = isSender ? req.receiverPhoto : req.senderPhoto;

      // Find in live allRegisteredUsers list if available for real-time mood
      const liveProfile = allRegisteredUsers.find((u) => u.userId === friendId);

      if (liveProfile) {
        friendsMap.set(friendId, liveProfile);
      } else {
        friendsMap.set(friendId, {
          userId: friendId,
          displayName: friendName,
          email: friendEmail,
          photoURL: friendPhoto,
          level: 1,
          currentStreak: 0,
          latestMood: null,
          latestMoodDate: null,
          latestMoodReason: null,
          latestMoodIsPrivate: false,
        });
      }
    });

    return Array.from(friendsMap.values());
  }, [friendRequests, currentUser, allRegisteredUsers]);

  // Incoming pending requests count for the badge
  const incomingPendingCount = useMemo(() => {
    if (!currentUser) return 0;
    return friendRequests.filter(
      (r) => r.receiverId === currentUser.uid && r.status === 'pending'
    ).length;
  }, [friendRequests, currentUser]);

  const unreadNudgesCount = useMemo(() => {
    return incomingNudges.filter((n) => !n.read).length;
  }, [incomingNudges]);

  const unreadReactions = useMemo(() => {
    return statusReactions.filter((r) => !r.read);
  }, [statusReactions]);

  // Formatted date string
  const todayFormatted = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const handleSelectMood = (mood: MoodLevel) => {
    setSelectedMood(mood);
  };

  const handleCancelMoodSelection = () => {
    setSelectedMood(null);
  };

  const handleSignIn = async () => {
    setAuthError(null);
    setIsUnauthorizedDomain(false);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      console.error('Sign-in error:', err);
      const isDomainError =
        (err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'auth/unauthorized-domain') ||
        (err instanceof Error && err.message.includes('auth/unauthorized-domain'));

      if (isDomainError) {
        setIsUnauthorizedDomain(true);
        setShowDomainAuthModal(true);
        setAuthError(
          `Domain "${window.location.hostname}" must be authorized in Firebase Authentication Settings.`
        );
      } else {
        const msg = err instanceof Error ? err.message : 'Google sign in was cancelled or failed';
        setAuthError(msg);
      }
    }
  };

  const handleSignOut = async () => {
    try {
      await logOut();
      setCurrentUser(null);
      setIsCloudSynced(false);
      setFriendRequests([]);
      setAllRegisteredUsers([]);
      const localToday = storageService.getTodayEntry();
      setTodayEntry(localToday || null);
      setStats(storageService.getStats());
      setEntries(storageService.getEntries());
    } catch (err) {
      console.error('Sign-out error:', err);
    }
  };

  const handleSaveFullEntry = async ({
    reason,
    tags,
  }: {
    reason: string;
    tags: string[];
  }) => {
    if (!selectedMood) return;
    const moodToSave = selectedMood;
    // Dismiss the mood input modal immediately so user returns directly to moods view
    setSelectedMood(null);
    setIsSaving(true);
    setAuthError(null);
    try {
      const hasContent = Boolean(
        (reason && reason.trim().length > 0) || (tags && tags.length > 0)
      );

      // 1. Save to local storage for immediate offline reliability
      const isMoodChange = !todayEntry || todayEntry.mood !== moodToSave;
      const isFirstCheckInToday = !todayEntry;
      const result = await storageService.saveMoodEntry({
        mood: moodToSave,
        reason: hasContent ? reason : undefined,
        isPrivateReason: !hasContent,
        tags: hasContent ? tags : undefined,
        userId: currentUser?.uid,
      });

      if (isMoodChange) {
        storageService.clearLocalReactions(currentUser?.uid);
        setStatusReactions([]);
        if (currentUser) {
          firestoreService.clearStatusReactionsForUser(currentUser.uid).catch((err) => {
            console.warn('Failed to clear reactions on mood change:', err);
          });
        }
      }

      // 2. If user is signed in, sync to Firestore and update public user profile
      if (currentUser) {
        try {
          await firestoreService.saveEntryToFirestore(currentUser.uid, result.entry, result.stats);
          await firestoreService.syncUserProfile(
            currentUser,
            result.stats,
            result.entry.mood,
            result.entry.date,
            result.entry.reason,
            result.entry.isPrivateReason
          );
          setIsCloudSynced(true);

          // Push mobile notification to user's croods whenever user changes mood
          if (isMoodChange && croodFriends.length > 0) {
            firestoreService
              .sendCroodMoodChangeNotifications(currentUser, croodFriends, result.entry.date)
              .catch((err) => {
                console.warn('Failed to send crood mood change notifications:', err);
              });
          }
        } catch (fireErr) {
          console.error('Failed to sync entry to Firestore:', fireErr);
        }
      }

      setTodayEntry(result.entry);
      setStats(result.stats);
      setEntries(storageService.getEntries(currentUser?.uid));
      setLatestSavedEntry(result.entry);
      setLatestDeltaXp(result.deltaXp);
      setNewLevelUnlocked(result.newLevelUnlocked);
      if (result.shouldCelebrate) {
        setShowCelebration(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveWithoutReason = async () => {
    if (!selectedMood) return;
    const moodToSave = selectedMood;
    // Dismiss the mood input modal immediately so user returns directly to moods view
    setSelectedMood(null);
    setIsSaving(true);
    setAuthError(null);
    try {
      // 1. Save to local storage
      const isMoodChange = !todayEntry || todayEntry.mood !== moodToSave;
      const isFirstCheckInToday = !todayEntry;
      const result = await storageService.saveMoodEntry({
        mood: moodToSave,
        isPrivateReason: true,
        userId: currentUser?.uid,
      });

      if (isMoodChange) {
        storageService.clearLocalReactions(currentUser?.uid);
        setStatusReactions([]);
        if (currentUser) {
          firestoreService.clearStatusReactionsForUser(currentUser.uid).catch((err) => {
            console.warn('Failed to clear reactions on mood change:', err);
          });
        }
      }

      // 2. If user is signed in, sync to Firestore and update public user profile
      if (currentUser) {
        try {
          await firestoreService.saveEntryToFirestore(currentUser.uid, result.entry, result.stats);
          await firestoreService.syncUserProfile(
            currentUser,
            result.stats,
            result.entry.mood,
            result.entry.date,
            undefined,
            true
          );
          setIsCloudSynced(true);

          // Push mobile notification to user's croods whenever user changes mood
          if (isMoodChange && croodFriends.length > 0) {
            firestoreService
              .sendCroodMoodChangeNotifications(currentUser, croodFriends, result.entry.date)
              .catch((err) => {
                console.warn('Failed to send crood mood change notifications:', err);
              });
          }
        } catch (fireErr) {
          console.error('Failed to sync entry to Firestore:', fireErr);
        }
      }

      setTodayEntry(result.entry);
      setStats(result.stats);
      setEntries(storageService.getEntries(currentUser?.uid));
      setLatestSavedEntry(result.entry);
      setLatestDeltaXp(result.deltaXp);
      setNewLevelUnlocked(result.newLevelUnlocked);
      if (result.shouldCelebrate) {
        setShowCelebration(true);
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetToday = () => {
    // Open the mood modal with current today mood to allow editing or switching
    if (todayEntry) {
      setSelectedMood(todayEntry.mood);
    } else {
      setSelectedMood(null);
    }
  };

  // Social actions
  const handleSendFriendRequest = async (targetUser: UserProfile) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    await firestoreService.sendFriendRequest(currentUser, targetUser);
  };

  const handleAcceptFriendRequest = async (requestId: string) => {
    await firestoreService.acceptFriendRequest(requestId);
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    await firestoreService.declineFriendRequest(requestId);
  };

  const handleRemoveFriend = async (requestId: string) => {
    await firestoreService.cancelOrRemoveFriend(requestId);
  };

  const handleSendNudge = async (targetFriend: UserProfile) => {
    if (!currentUser) {
      await handleSignIn();
      return;
    }
    await firestoreService.sendNudge(currentUser, targetFriend);
  };

  const handleMarkAllNudgesRead = async () => {
    incomingNudges.forEach((n) => dismissedNudgeIdsRef.current.add(n.id));
    setIncomingNudges((prev) => prev.map((n) => ({ ...n, read: true })));
    setActiveNudgeToast(null);
    await firestoreService.markAllTodayNudgesAsRead(incomingNudges).catch((err) => {
      console.warn('Failed to mark all nudges read in Firestore:', err);
    });
  };

  const handleMarkSingleNudgeRead = (nudgeId: string) => {
    dismissedNudgeIdsRef.current.add(nudgeId);
    setIncomingNudges((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, read: true } : n))
    );
    setActiveNudgeToast((curr) => (curr?.id === nudgeId ? null : curr));
    firestoreService.markNudgeAsRead(nudgeId).catch((err) => {
      console.warn('Failed to mark nudge read in Firestore:', err);
    });
  };

  const handleAcknowledgeReactions = async () => {
    storageService.markLocalReactionsAsRead(currentUser?.uid);
    setStatusReactions((prev) => prev.map((r) => ({ ...r, read: true })));

    if (currentUser && statusReactions.some((r) => !r.read)) {
      try {
        await firestoreService.markReactionsAsRead(statusReactions);
      } catch (err) {
        console.error('Error marking reactions read in Firestore:', err);
      }
    }
  };

  const handleSendReaction = async (
    targetFriend: UserProfile,
    emoji: string,
    label: string
  ) => {
    if (currentUser) {
      try {
        const reaction = await firestoreService.sendMoodReaction(
          currentUser,
          targetFriend,
          emoji,
          label
        );
        setSentReactions((prev) => {
          const filtered = prev.filter((r) => r.targetUserId !== targetFriend.userId);
          return [reaction, ...filtered];
        });
      } catch (err) {
        console.error('Error sending reaction:', err);
      }
    } else {
      const localReaction: StatusReaction = {
        id: `react_${targetFriend.userId}_${Date.now()}`,
        targetUserId: targetFriend.userId,
        senderId: 'guest_user',
        senderName: 'You',
        targetMood: targetFriend.latestMood || 'happy',
        emoji,
        label,
        read: false,
        createdAt: new Date().toISOString(),
      };
      setSentReactions((prev) => [
        localReaction,
        ...prev.filter((r) => r.targetUserId !== targetFriend.userId),
      ]);
    }
  };

  const handleSaveDailyPlanner = async (planner: DailyPlanner) => {
    setDailyPlanners((prev) => {
      const idx = prev.findIndex((p) => p.id === planner.id);
      const updated = idx >= 0 ? prev.map((p) => (p.id === planner.id ? planner : p)) : [planner, ...prev];
      storageService.saveDailyPlanners(currentUser?.uid, updated);
      return updated;
    });

    if (currentUser) {
      try {
        await firestoreService.createDailyPlanner(planner);
      } catch (err) {
        console.warn('Failed to sync daily planner to Firestore:', err);
      }
    }
  };

  const handleDeleteDailyPlanner = async (plannerId: string) => {
    setDailyPlanners((prev) => {
      const updated = prev.filter((p) => p.id !== plannerId);
      storageService.saveDailyPlanners(currentUser?.uid, updated);
      return updated;
    });

    if (currentUser) {
      try {
        await firestoreService.deleteDailyPlanner(plannerId);
      } catch (err) {
        console.warn('Failed to delete daily planner from Firestore:', err);
      }
    }
  };

  const activeMood = selectedMood || todayEntry?.mood || null;
  const currentMoodTheme = getMoodTheme(activeMood);

  return (
    <div
      className={`min-h-screen bg-gradient-to-br ${currentMoodTheme.pageBgGradient} text-slate-900 flex flex-col font-sans antialiased selection:bg-indigo-100 selection:text-indigo-900 transition-all duration-700 ease-in-out relative overflow-x-hidden`}
    >
      {/* Dynamic Ambient Mood Light Aura 1 (Top-Right) */}
      <div
        className="fixed -top-24 -right-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out z-0 opacity-75"
        style={{ backgroundColor: currentMoodTheme.auraColor1 }}
      />
      {/* Dynamic Ambient Mood Light Aura 2 (Bottom-Left) */}
      <div
        className="fixed top-1/2 -left-24 w-96 h-96 rounded-full blur-3xl pointer-events-none transition-all duration-1000 ease-out z-0 opacity-75"
        style={{ backgroundColor: currentMoodTheme.auraColor2 }}
      />

      {/* Real-time In-App Notification Toast for incoming Nudges (Shown across the app irrespective of section) */}
      <NudgeToast
        nudge={activeNudgeToast}
        isVisible={Boolean(activeNudgeToast)}
        onDismiss={() => {
          if (activeNudgeToast) {
            handleMarkSingleNudgeRead(activeNudgeToast.id);
          } else {
            setActiveNudgeToast(null);
          }
        }}
        onLogMood={() => {
          if (activeNudgeToast) {
            handleMarkSingleNudgeRead(activeNudgeToast.id);
          } else {
            setActiveNudgeToast(null);
          }
          setActiveTab('moods');
        }}
      />

      {/* Toast Notification when Crood members cheer / react to your status (Shown across the app irrespective of section) */}
      <CroodsReactedToast
        unreadReactions={unreadReactions}
        onViewInMoods={() => {
          setActiveTab('moods');
          handleAcknowledgeReactions();
        }}
        onDismiss={handleAcknowledgeReactions}
        isVisible={unreadReactions.length > 0}
      />

      {/* Real-time Crood Check-In Toast (Shown across the app when your crood checks in) */}
      <CroodCheckInToast
        notification={activeCheckInToast}
        onViewInFeeds={() => {
          if (activeCheckInToast) {
            firestoreService.markCheckInNotificationAsRead(activeCheckInToast.id).catch(() => {});
          }
          setActiveCheckInToast(null);
          setActiveTab('feeds');
        }}
        onDismiss={() => {
          if (activeCheckInToast) {
            firestoreService.markCheckInNotificationAsRead(activeCheckInToast.id).catch(() => {});
          }
          setActiveCheckInToast(null);
        }}
      />

      {/* Mobile Frame Container with gentle ambient tint and smooth transition */}
      <div
        className={`w-full max-w-md mx-auto min-h-screen ${currentMoodTheme.containerBg} shadow-2xl flex flex-col relative border-x ${currentMoodTheme.borderColor} transition-colors duration-700 ease-in-out z-10`}
      >
        
        {/* Gamified App Header */}
        <GamificationHeader
          stats={stats}
          user={currentUser}
          isCloudSynced={isCloudSynced}
          unreadNudgesCount={unreadNudgesCount}
          moodTheme={currentMoodTheme}
          onOpenNudges={() => setShowNudgesModal(true)}
          onOpenHistory={() => setShowHistory(true)}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
        />

        {/* Main Content Area based on Active Tab */}
        <main className="flex-1 px-3.5 sm:px-4 pt-3 sm:pt-4 pb-28 flex flex-col overflow-y-auto">
          {activeTab === 'moods' && (
            <MoodsView
              todayFormatted={todayFormatted}
              todayEntry={todayEntry}
              selectedMood={selectedMood}
              onSelectMood={handleSelectMood}
              onCancelMoodSelection={handleCancelMoodSelection}
              onResetToday={handleResetToday}
              onSaveFullEntry={handleSaveFullEntry}
              onSaveWithoutReason={handleSaveWithoutReason}
              isSaving={isSaving}
              stats={stats}
              onOpenDomainModal={() => setShowDomainAuthModal(true)}
              authError={authError}
              isUnauthorizedDomain={isUnauthorizedDomain}
              statusReactions={statusReactions}
              onAcknowledgeReactions={handleAcknowledgeReactions}
              user={currentUser}
              croodFriends={croodFriends}
              planners={dailyPlanners}
              onSavePlanner={handleSaveDailyPlanner}
              onDeletePlanner={handleDeleteDailyPlanner}
              onSignIn={handleSignIn}
              onGoToCroods={() => setActiveTab('croods')}
            />
          )}

          {activeTab === 'feeds' && (
            <FeedsView
              user={currentUser}
              friends={croodFriends}
              sentNudges={sentNudges}
              onNudgeFriend={handleSendNudge}
              onGoToCroods={() => setActiveTab('croods')}
              onSignIn={handleSignIn}
              sentReactions={sentReactions}
              onSendReaction={handleSendReaction}
              hasUserLoggedMoodToday={Boolean(todayEntry)}
            />
          )}

          {activeTab === 'croods' && (
            <CroodsView
              user={currentUser}
              allUsers={allRegisteredUsers}
              friends={croodFriends}
              friendRequests={friendRequests}
              onSendFriendRequest={handleSendFriendRequest}
              onAcceptFriendRequest={handleAcceptFriendRequest}
              onDeclineFriendRequest={handleDeclineFriendRequest}
              onRemoveFriend={handleRemoveFriend}
              onSignIn={handleSignIn}
            />
          )}

          {activeTab === 'insights' && (
            <MonthlyInsightView
              entries={entries}
              stats={stats}
              user={currentUser}
              onNavigateToMoods={() => setActiveTab('moods')}
            />
          )}
        </main>

        {/* 4-Option Bottom Navigation Bar */}
        <BottomNavigation
          activeTab={activeTab}
          onTabChange={setActiveTab}
          pendingRequestsCount={incomingPendingCount}
          moodTheme={currentMoodTheme}
        />

        {/* Nudge Notification List Modal */}
        <NudgeNotificationModal
          isOpen={showNudgesModal}
          nudges={incomingNudges}
          onClose={() => setShowNudgesModal(false)}
          onLogMood={() => {
            setShowNudgesModal(false);
            setActiveTab('moods');
          }}
          onMarkAllRead={handleMarkAllNudgesRead}
          onMarkSingleRead={handleMarkSingleNudgeRead}
        />

        {/* Celebration Modal upon Save */}
        <CelebrationModal
          isOpen={showCelebration}
          entry={latestSavedEntry}
          stats={stats}
          xpAwarded={latestDeltaXp}
          newLevelUnlocked={newLevelUnlocked}
          onClose={() => setShowCelebration(false)}
          onViewHistory={() => {
            setShowCelebration(false);
            setShowHistory(true);
          }}
        />

        {/* Mood History & Gamified Stats Modal */}
        <MoodHistoryModal
          isOpen={showHistory}
          onClose={() => setShowHistory(false)}
          entries={entries}
          stats={stats}
          user={currentUser}
          onOpenInsightsScreen={() => {
            setShowHistory(false);
            setActiveTab('insights');
          }}
        />

        {/* Domain Authorization Guidance Modal */}
        <DomainAuthorizationModal
          isOpen={showDomainAuthModal}
          onClose={() => setShowDomainAuthModal(false)}
          onRetrySignIn={handleSignIn}
        />

        {/* PWA Offline Network Banner Indicator */}
        <OfflineIndicator isQuotaExceeded={isQuotaExceeded} />
      </div>
    </div>
  );
}
