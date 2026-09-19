import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  onSnapshot,
} from 'firebase/firestore';
import { onAuthStateChanged, User } from 'firebase/auth';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
import { MoodEntry, GamificationStats, MoodLevel, UserProfile, FriendRequest, NudgeNotification, StatusReaction } from '../types';
import { getTodayDateString } from './storageService';

export const firestoreService = {
  onAuthChange(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  async syncUserProfile(
    user: User,
    stats?: GamificationStats,
    latestMood?: MoodLevel,
    latestMoodDate?: string,
    latestMoodReason?: string | null,
    latestMoodIsPrivate?: boolean
  ): Promise<void> {
    const userPath = `users/${user.uid}`;
    try {
      const payload: Record<string, unknown> = {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Crood Member',
        email: user.email || '',
        photoURL: user.photoURL || '',
        level: stats?.level || 1,
        currentStreak: stats?.currentStreak || 0,
        updatedAt: new Date().toISOString(),
      };

      if (latestMood) {
        payload.latestMood = latestMood;
        payload.latestMoodDate = latestMoodDate || getTodayDateString();
        payload.latestMoodReason = latestMoodIsPrivate ? null : (latestMoodReason?.trim() || null);
        payload.latestMoodIsPrivate = Boolean(latestMoodIsPrivate);
      }

      await setDoc(doc(db, userPath), payload, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, userPath);
    }
  },

  async searchUsers(currentUserId: string, searchTerm: string = ''): Promise<UserProfile[]> {
    const path = 'users';
    try {
      const snapshot = await getDocs(collection(db, path));
      const users: UserProfile[] = [];
      const term = searchTerm.toLowerCase().trim();

      snapshot.forEach((d) => {
        const data = d.data();
        if (data.userId && data.userId !== currentUserId) {
          const nameMatch = (data.displayName || '').toLowerCase().includes(term);
          const emailMatch = (data.email || '').toLowerCase().includes(term);
          if (!term || nameMatch || emailMatch) {
            users.push({
              userId: data.userId,
              displayName: data.displayName || 'Friend',
              email: data.email || '',
              photoURL: data.photoURL,
              level: data.level || 1,
              currentStreak: data.currentStreak || 0,
              latestMood: data.latestMood || null,
              latestMoodDate: data.latestMoodDate || null,
              latestMoodReason: data.latestMoodReason || null,
              latestMoodIsPrivate: Boolean(data.latestMoodIsPrivate),
              updatedAt: data.updatedAt,
            });
          }
        }
      });
      return users;
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  },

  async sendFriendRequest(
    currentUser: User,
    targetUser: UserProfile
  ): Promise<FriendRequest> {
    const requestId = `req_${currentUser.uid}_${targetUser.userId}`;
    const path = `friend_requests/${requestId}`;
    try {
      const now = new Date().toISOString();
      const newRequest: FriendRequest = {
        id: requestId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Friend',
        senderEmail: currentUser.email || '',
        senderPhoto: currentUser.photoURL || undefined,
        receiverId: targetUser.userId,
        receiverName: targetUser.displayName || 'Friend',
        receiverEmail: targetUser.email || '',
        receiverPhoto: targetUser.photoURL || undefined,
        status: 'pending',
        createdAt: now,
        updatedAt: now,
      };

      const payload: Record<string, unknown> = {
        id: newRequest.id,
        senderId: newRequest.senderId,
        senderName: newRequest.senderName,
        senderEmail: newRequest.senderEmail,
        receiverId: newRequest.receiverId,
        receiverName: newRequest.receiverName,
        receiverEmail: newRequest.receiverEmail,
        status: newRequest.status,
        createdAt: newRequest.createdAt,
        updatedAt: newRequest.updatedAt,
      };
      if (newRequest.senderPhoto) payload.senderPhoto = newRequest.senderPhoto;
      if (newRequest.receiverPhoto) payload.receiverPhoto = newRequest.receiverPhoto;

      await setDoc(doc(db, path), payload);
      return newRequest;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async acceptFriendRequest(requestId: string): Promise<void> {
    const path = `friend_requests/${requestId}`;
    try {
      await updateDoc(doc(db, path), {
        status: 'accepted',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async declineFriendRequest(requestId: string): Promise<void> {
    const path = `friend_requests/${requestId}`;
    try {
      await updateDoc(doc(db, path), {
        status: 'declined',
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async cancelOrRemoveFriend(requestId: string): Promise<void> {
    const path = `friend_requests/${requestId}`;
    try {
      await deleteDoc(doc(db, path));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  subscribeFriendRequests(
    currentUserId: string,
    onNext: (requests: FriendRequest[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'friend_requests';
    // Listen to requests where receiver is current user
    const qReceiver = query(collection(db, path), where('receiverId', '==', currentUserId));
    // Listen to requests where sender is current user
    const qSender = query(collection(db, path), where('senderId', '==', currentUserId));

    let receivedList: FriendRequest[] = [];
    let sentList: FriendRequest[] = [];

    const emit = () => {
      const combinedMap = new Map<string, FriendRequest>();
      [...receivedList, ...sentList].forEach((r) => combinedMap.set(r.id, r));
      onNext(Array.from(combinedMap.values()));
    };

    const unsubReceiver = onSnapshot(
      qReceiver,
      (snapshot) => {
        receivedList = [];
        snapshot.forEach((d) => {
          const data = d.data();
          receivedList.push({
            id: data.id || d.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            senderPhoto: data.senderPhoto,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            receiverEmail: data.receiverEmail,
            receiverPhoto: data.receiverPhoto,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        emit();
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    const unsubSender = onSnapshot(
      qSender,
      (snapshot) => {
        sentList = [];
        snapshot.forEach((d) => {
          const data = d.data();
          sentList.push({
            id: data.id || d.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderEmail: data.senderEmail,
            senderPhoto: data.senderPhoto,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            receiverEmail: data.receiverEmail,
            receiverPhoto: data.receiverPhoto,
            status: data.status,
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        emit();
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );

    return () => {
      unsubReceiver();
      unsubSender();
    };
  },

  subscribeUsersList(
    onNext: (users: UserProfile[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'users';
    return onSnapshot(
      collection(db, path),
      (snapshot) => {
        const users: UserProfile[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          if (data.userId) {
            users.push({
              userId: data.userId,
              displayName: data.displayName || 'Member',
              email: data.email || '',
              photoURL: data.photoURL,
              level: data.level || 1,
              currentStreak: data.currentStreak || 0,
              latestMood: data.latestMood || null,
              latestMoodDate: data.latestMoodDate || null,
              latestMoodReason: data.latestMoodReason || null,
              latestMoodIsPrivate: Boolean(data.latestMoodIsPrivate),
              updatedAt: data.updatedAt,
            });
          }
        });
        onNext(users);
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  },

  async fetchUserEntries(userId: string): Promise<MoodEntry[]> {
    const path = `users/${userId}/entries`;
    try {
      const q = query(collection(db, path), orderBy('date', 'desc'));
      const snapshot = await getDocs(q);
      const entries: MoodEntry[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        entries.push({
          id: data.id || d.id,
          userId: data.userId,
          date: data.date,
          timestamp: data.timestamp || Date.now(),
          mood: data.mood as MoodLevel,
          reason: data.reason,
          isPrivateReason: data.isPrivateReason,
          tags: data.tags,
          xpEarned: data.xpEarned || 20,
        });
      });
      return entries;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  subscribeUserEntries(
    userId: string,
    onNext: (entries: MoodEntry[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = `users/${userId}/entries`;
    const q = query(collection(db, path), orderBy('date', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const entries: MoodEntry[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          entries.push({
            id: data.id || d.id,
            userId: data.userId,
            date: data.date,
            timestamp: data.timestamp || Date.now(),
            mood: data.mood as MoodLevel,
            reason: data.reason,
            isPrivateReason: data.isPrivateReason,
            tags: data.tags,
            xpEarned: data.xpEarned || 20,
          });
        });
        onNext(entries);
      },
      (error) => {
        if (onError) onError(error);
        handleFirestoreError(error, OperationType.GET, path);
      }
    );
  },

  async fetchUserStats(userId: string): Promise<GamificationStats | null> {
    const path = `users/${userId}/stats/current`;
    try {
      const docRef = doc(db, path);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data();
        return {
          userId: data.userId,
          currentStreak: data.currentStreak ?? 0,
          longestStreak: data.longestStreak ?? 0,
          totalCheckIns: data.totalCheckIns ?? 0,
          currentXp: data.currentXp ?? 0,
          level: data.level ?? 1,
          lastCheckInDate: data.lastCheckInDate,
          todayCompleted: false,
          unlockedBadges: data.unlockedBadges || ['first_step'],
        };
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
    }
  },

  async saveEntryToFirestore(
    userId: string,
    entry: MoodEntry,
    stats: GamificationStats
  ): Promise<void> {
    const entryPath = `users/${userId}/entries/${entry.id}`;
    const statsPath = `users/${userId}/stats/current`;

    try {
      // Save entry
      const entryPayload: Record<string, unknown> = {
        id: entry.id,
        userId,
        date: entry.date,
        timestamp: entry.timestamp,
        mood: entry.mood,
        xpEarned: entry.xpEarned,
      };

      if (entry.reason !== undefined) {
        entryPayload.reason = entry.reason;
      }
      if (entry.isPrivateReason !== undefined) {
        entryPayload.isPrivateReason = entry.isPrivateReason;
      }
      if (entry.tags && entry.tags.length > 0) {
        entryPayload.tags = entry.tags;
      }

      await setDoc(doc(db, entryPath), entryPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, entryPath);
    }

    try {
      // Save stats
      const statsPayload: Record<string, unknown> = {
        userId,
        currentStreak: stats.currentStreak,
        longestStreak: stats.longestStreak,
        totalCheckIns: stats.totalCheckIns,
        currentXp: stats.currentXp,
        level: stats.level,
      };
      if (stats.lastCheckInDate) {
        statsPayload.lastCheckInDate = stats.lastCheckInDate;
      }

      await setDoc(doc(db, statsPath), statsPayload);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, statsPath);
    }
  },

  async sendNudge(
    currentUser: User,
    targetFriend: UserProfile
  ): Promise<NudgeNotification> {
    const today = getTodayDateString();
    const nudgeId = `nudge_${currentUser.uid}_${targetFriend.userId}_${today}`;
    const path = `nudges/${nudgeId}`;
    try {
      const now = new Date().toISOString();
      const nudge: NudgeNotification = {
        id: nudgeId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Friend',
        senderPhoto: currentUser.photoURL || undefined,
        receiverId: targetFriend.userId,
        receiverName: targetFriend.displayName || 'Friend',
        date: today,
        read: false,
        createdAt: now,
        updatedAt: now,
      };

      const payload: Record<string, unknown> = {
        id: nudge.id,
        senderId: nudge.senderId,
        senderName: nudge.senderName,
        receiverId: nudge.receiverId,
        receiverName: nudge.receiverName,
        date: nudge.date,
        read: nudge.read,
        createdAt: nudge.createdAt,
        updatedAt: nudge.updatedAt,
      };
      if (nudge.senderPhoto) payload.senderPhoto = nudge.senderPhoto;

      await setDoc(doc(db, path), payload);
      return nudge;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeIncomingNudges(
    currentUserId: string,
    onNext: (nudges: NudgeNotification[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'nudges';
    const q = query(
      collection(db, path),
      where('receiverId', '==', currentUserId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: NudgeNotification[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            senderId: data.senderId,
            senderName: data.senderName || 'A friend',
            senderPhoto: data.senderPhoto,
            receiverId: data.receiverId,
            receiverName: data.receiverName || 'You',
            date: data.date,
            read: Boolean(data.read),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onNext(list);
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  },

  subscribeSentNudges(
    currentUserId: string,
    onNext: (nudges: NudgeNotification[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'nudges';
    const q = query(
      collection(db, path),
      where('senderId', '==', currentUserId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: NudgeNotification[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            senderId: data.senderId,
            senderName: data.senderName,
            senderPhoto: data.senderPhoto,
            receiverId: data.receiverId,
            receiverName: data.receiverName,
            date: data.date,
            read: Boolean(data.read),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        onNext(list);
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  },

  async markNudgeAsRead(nudgeId: string): Promise<void> {
    const path = `nudges/${nudgeId}`;
    try {
      await updateDoc(doc(db, path), {
        read: true,
        updatedAt: new Date().toISOString(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  async markAllTodayNudgesAsRead(todayNudges: NudgeNotification[]): Promise<void> {
    const unread = todayNudges.filter((n) => !n.read);
    for (const nudge of unread) {
      try {
        await updateDoc(doc(db, `nudges/${nudge.id}`), {
          read: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error marking nudge as read:', e);
      }
    }
  },

  async sendMoodReaction(
    currentUser: User,
    targetUser: UserProfile,
    emoji: string,
    label: string
  ): Promise<StatusReaction> {
    const reactionId = `react_${targetUser.userId}_${currentUser.uid}`;
    const path = `status_reactions/${reactionId}`;
    const now = new Date().toISOString();

    try {
      const reaction: StatusReaction = {
        id: reactionId,
        targetUserId: targetUser.userId,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || currentUser.email?.split('@')[0] || 'Crood Friend',
        targetMood: targetUser.latestMood || 'happy',
        emoji,
        label,
        read: false,
        createdAt: now,
        updatedAt: now,
      };

      if (currentUser.photoURL) {
        reaction.senderPhoto = currentUser.photoURL;
      }

      await setDoc(doc(db, path), reaction, { merge: true });
      return reaction;
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  subscribeTargetReactions(
    targetUserId: string,
    onNext: (reactions: StatusReaction[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'status_reactions';
    const q = query(
      collection(db, path),
      where('targetUserId', '==', targetUserId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: StatusReaction[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            targetUserId: data.targetUserId,
            senderId: data.senderId,
            senderName: data.senderName || 'Crood Friend',
            senderPhoto: data.senderPhoto,
            targetMood: data.targetMood || 'happy',
            emoji: data.emoji || '❤️',
            label: data.label || 'Cheer',
            read: Boolean(data.read),
            createdAt: data.createdAt || new Date().toISOString(),
            updatedAt: data.updatedAt,
          });
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        onNext(list);
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  },

  subscribeSentReactions(
    senderId: string,
    onNext: (reactions: StatusReaction[]) => void,
    onError?: (err: unknown) => void
  ) {
    const path = 'status_reactions';
    const q = query(
      collection(db, path),
      where('senderId', '==', senderId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const list: StatusReaction[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: data.id || d.id,
            targetUserId: data.targetUserId,
            senderId: data.senderId,
            senderName: data.senderName || 'You',
            senderPhoto: data.senderPhoto,
            targetMood: data.targetMood || 'happy',
            emoji: data.emoji || '❤️',
            label: data.label || 'Cheer',
            read: Boolean(data.read),
            createdAt: data.createdAt,
            updatedAt: data.updatedAt,
          });
        });
        onNext(list);
      },
      (err) => {
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.LIST, path);
      }
    );
  },

  async markReactionsAsRead(reactions: StatusReaction[]): Promise<void> {
    const unread = reactions.filter((r) => !r.read);
    for (const r of unread) {
      try {
        await updateDoc(doc(db, `status_reactions/${r.id}`), {
          read: true,
          updatedAt: new Date().toISOString(),
        });
      } catch (e) {
        console.warn('Error marking reaction as read:', e);
      }
    }
  },

  async clearStatusReactionsForUser(targetUserId: string): Promise<void> {
    const path = 'status_reactions';
    try {
      const q = query(collection(db, path), where('targetUserId', '==', targetUserId));
      const snap = await getDocs(q);
      const deletePromises = snap.docs.map((d) => deleteDoc(d.ref));
      await Promise.all(deletePromises);
    } catch (e) {
      console.warn('Error clearing status reactions for user:', e);
    }
  },
};
