import React, { useState, useEffect, useMemo } from 'react';
import { User } from 'firebase/auth';
import { MoodLevel, MoodEntry, GamificationStats, AppTab, UserProfile, FriendRequest, NudgeNotification } from './types';
import { storageService, getTodayDateString } from './services/storageService';
import { firestoreService } from './services/firestoreService';
import { signInWithGoogle, logOut } from './services/firebase';
import { GamificationHeader } from './components/GamificationHeader';
import { CelebrationModal } from './components/CelebrationModal';
import { MoodHistoryModal } from './components/MoodHistoryModal';
import { DomainAuthorizationModal } from './components/DomainAuthorizationModal';
import { NudgeToast } from './components/NudgeToast';
import { NudgeNotificationModal } from './components/NudgeNotificationModal';
import { BottomNavigation } from './components/BottomNavigation';
import { MoodsView } from './components/MoodsView';
import { FeedsView } from './components/FeedsView';
import { CroodsView } from './components/CroodsView';
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

  // Social & Croods state
  const [allRegisteredUsers, setAllRegisteredUsers] = useState<UserProfile[]>([]);
  const [friendRequests, setFriendRequests] = useState<FriendRequest[]>([]);
  const [incomingNudges, setIncomingNudges] = useState<NudgeNotification[]>([]);
  const [sentNudges, setSentNudges] = useState<NudgeNotification[]>([]);
  const [activeNudgeToast, setActiveNudgeToast] = useState<NudgeNotification | null>(null);
  const [showNudgesModal, setShowNudgesModal] = useState(false);

  // Listen to Firebase Auth state
  useEffect(() => {
    const unsubscribeAuth = firestoreService.onAuthChange(async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsCloudSynced(true);

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
            const todayCloud = remoteEntries.find((e) => e.date === today);
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
          console.error('Error fetching user stats/profile from Firestore:', err);
        }
      } else {
        setIsCloudSynced(false);
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
          const todayCloud = cloudEntries.find((e) => e.date === today);
          setTodayEntry(todayCloud || null);
          storageService.cacheCloudData(currentUser.uid, cloudEntries, stats);
          setStats(storageService.getStats(currentUser.uid));
        }
      },
      (error) => {
        console.error('Firestore subscription error:', error);
      }
    );

    return () => unsubscribe();
  }, [currentUser, stats]);

  // Subscribe to all registered users for live search & friend status
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeUsers = firestoreService.subscribeUsersList(
      (users) => {
        setAllRegisteredUsers(users);
      },
      (err) => {
        console.error('Error loading users list:', err);
      }
    );

    return () => unsubscribeUsers();
  }, [currentUser]);

  // Subscribe to friend requests involving the current user
  useEffect(() => {
    if (!currentUser) return;

    const unsubscribeRequests = firestoreService.subscribeFriendRequests(
      currentUser.uid,
      (requests) => {
        setFriendRequests(requests);
      },
      (err) => {
        console.error('Error listening to friend requests:', err);
      }
    );

    return () => unsubscribeRequests();
  }, [currentUser]);

  // Subscribe to real-time incoming and sent nudges
  useEffect(() => {
    if (!currentUser) return;

    const unsubIncoming = firestoreService.subscribeIncomingNudges(
      currentUser.uid,
      (nudges) => {
        const today = getTodayDateString();
        const todayNudges = nudges.filter((n) => n.date === today);
        setIncomingNudges(todayNudges);

        // Show toast alert for the newest unread nudge today if available
        const unreadToday = todayNudges.filter((n) => !n.read);
        if (unreadToday.length > 0) {
          setActiveNudgeToast(unreadToday[0]);
        }
      },
      (err) => {
        console.error('Error listening to incoming nudges:', err);
      }
    );

    const unsubSent = firestoreService.subscribeSentNudges(
      currentUser.uid,
      (nudges) => {
        const today = getTodayDateString();
        setSentNudges(nudges.filter((n) => n.date === today));
      },
      (err) => {
        console.error('Error listening to sent nudges:', err);
      }
    );

    return () => {
      unsubIncoming();
      unsubSent();
    };
  }, [currentUser]);

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
      const result = await storageService.saveMoodEntry({
        mood: moodToSave,
        reason: hasContent ? reason : undefined,
        isPrivateReason: !hasContent,
        tags: hasContent ? tags : undefined,
        userId: currentUser?.uid,
      });

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
      const result = await storageService.saveMoodEntry({
        mood: moodToSave,
        isPrivateReason: true,
        userId: currentUser?.uid,
      });

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
    await firestoreService.markAllTodayNudgesAsRead(incomingNudges);
    setIncomingNudges((prev) => prev.map((n) => ({ ...n, read: true })));
    setActiveNudgeToast(null);
  };

  const handleMarkSingleNudgeRead = async (nudgeId: string) => {
    await firestoreService.markNudgeAsRead(nudgeId);
    setIncomingNudges((prev) =>
      prev.map((n) => (n.id === nudgeId ? { ...n, read: true } : n))
    );
    if (activeNudgeToast?.id === nudgeId) {
      setActiveNudgeToast(null);
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

      {/* Real-time Toast Alert for incoming Nudges */}
      <NudgeToast
        nudge={activeNudgeToast}
        onDismiss={() => setActiveNudgeToast(null)}
        onLogMood={() => {
          setActiveNudgeToast(null);
          setActiveTab('moods');
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
        <main className="flex-1 px-4 pt-4 pb-28 flex flex-col overflow-y-auto">
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
        </main>

        {/* 3-Option Bottom Navigation Bar */}
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
        />

        {/* Domain Authorization Guidance Modal */}
        <DomainAuthorizationModal
          isOpen={showDomainAuthModal}
          onClose={() => setShowDomainAuthModal(false)}
          onRetrySignIn={handleSignIn}
        />
      </div>
    </div>
  );
}
