import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { User } from 'firebase/auth';
import { UserProfile, FriendRequest, MoodLevel } from '../types';
import { MOOD_CONFIGS, getMoodConfig } from '../data/moodConfigs';
import {
  Users,
  UserPlus,
  Search,
  Check,
  X,
  Clock,
  Flame,
  Shield,
  UserCheck,
  LogIn,
  Share2,
  Copy,
  Sparkles,
  Trash2,
} from 'lucide-react';

interface CroodsViewProps {
  user: User | null;
  allUsers: UserProfile[];
  friends: UserProfile[];
  friendRequests: FriendRequest[];
  onSendFriendRequest: (targetUser: UserProfile) => Promise<void>;
  onAcceptFriendRequest: (requestId: string) => Promise<void>;
  onDeclineFriendRequest: (requestId: string) => Promise<void>;
  onRemoveFriend: (requestId: string) => Promise<void>;
  onSignIn: () => void;
}

type CroodSubTab = 'crood' | 'requests' | 'search';

export const CroodsView: React.FC<CroodsViewProps> = ({
  user,
  allUsers,
  friends,
  friendRequests,
  onSendFriendRequest,
  onAcceptFriendRequest,
  onDeclineFriendRequest,
  onRemoveFriend,
  onSignIn,
}) => {
  const [subTab, setSubTab] = useState<CroodSubTab>('crood');
  const [searchQuery, setSearchQuery] = useState('');
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [hasSearched, setHasSearched] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Split requests
  const incomingRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter((r) => r.receiverId === user.uid && r.status === 'pending');
  }, [friendRequests, user]);

  const outgoingPendingRequests = useMemo(() => {
    if (!user) return [];
    return friendRequests.filter((r) => r.senderId === user.uid && r.status === 'pending');
  }, [friendRequests, user]);

  // Set of user IDs who are already in your crood
  const friendUserIds = useMemo(() => {
    return new Set(friends.map((f) => f.userId));
  }, [friends]);

  // Set of user IDs to whom you've already sent a pending request
  const pendingSentTargetIds = useMemo(() => {
    return new Set(outgoingPendingRequests.map((r) => r.receiverId));
  }, [outgoingPendingRequests]);

  // Set of user IDs from whom you have a pending incoming request
  const pendingReceivedSenderIds = useMemo(() => {
    return new Set(incomingRequests.map((r) => r.senderId));
  }, [incomingRequests]);

  // Total croods registered (excluding current user)
  const totalCroodsCount = useMemo(() => {
    if (!user) return allUsers.length;
    return allUsers.filter((u) => u.userId !== user.uid).length;
  }, [allUsers, user]);

  // Search results: only populated when search is submitted
  const searchResults = useMemo(() => {
    if (!user || !hasSearched) return [];
    const q = submittedQuery.toLowerCase().trim();
    if (!q) return [];
    return allUsers.filter((u) => {
      if (u.userId === user.uid) return false;
      return (
        (u.displayName || '').toLowerCase().includes(q) ||
        (u.email || '').toLowerCase().includes(q)
      );
    });
  }, [allUsers, hasSearched, submittedQuery, user]);

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = searchQuery.trim();
    if (!trimmed) return;
    setSubmittedQuery(trimmed);
    setHasSearched(true);
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSubmittedQuery('');
    setHasSearched(false);
  };

  // Combined Crood streak synergy
  const totalCroodStreak = useMemo(() => {
    return friends.reduce((acc, curr) => acc + (curr.currentStreak || 0), 0);
  }, [friends]);

  const handleCopyInviteLink = async () => {
    const inviteUrl = window.location.href;
    try {
      await navigator.clipboard.writeText(inviteUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleSend = async (targetUser: UserProfile) => {
    setActionLoading(targetUser.userId);
    try {
      await onSendFriendRequest(targetUser);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAccept = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await onAcceptFriendRequest(requestId);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDecline = async (requestId: string) => {
    setActionLoading(requestId);
    try {
      await onDeclineFriendRequest(requestId);
    } finally {
      setActionLoading(null);
    }
  };

  // If user is not signed in
  if (!user) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-14 h-14 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mb-4 shadow-xs">
          <Users className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900 mb-1">
          Join the Croods Community
        </h3>
        <p className="text-xs text-slate-500 max-w-xs mb-5 leading-relaxed">
          Sign in with your Google account to search friends who signed up, build your circle, and share positive daily accountability.
        </p>
        <button
          type="button"
          onClick={onSignIn}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In with Google</span>
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col pb-6 space-y-4">
      {/* Croods Header & Synergy Banner */}
      <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-white flex items-center gap-1.5">
                <span>My Crood Circle</span>
                <span className="text-[10px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-md font-bold">
                  {friends.length}
                </span>
              </h3>
              <p className="text-[11px] text-indigo-200">
                Your supportive tribe for daily emotional wellness
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyInviteLink}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/15 hover:bg-white/25 text-white text-[11px] font-semibold transition-colors cursor-pointer"
            title="Share app with friends"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-300" />
                <span className="text-emerald-300">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Invite</span>
              </>
            )}
          </button>
        </div>

        {/* Crood Combined Streak Metric */}
        {friends.length > 0 && (
          <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
            <span className="text-indigo-200 flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              Crood Synergy Streak:
            </span>
            <span className="font-extrabold text-amber-300 text-sm">
              {totalCroodStreak} Days Combined
            </span>
          </div>
        )}
      </div>

      {/* Sub-Navigation Tabs */}
      <div className="flex p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setSubTab('crood')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'crood'
              ? 'bg-white text-indigo-600 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          My Crood ({friends.length})
        </button>

        <button
          type="button"
          onClick={() => setSubTab('requests')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center relative ${
            subTab === 'requests'
              ? 'bg-white text-indigo-600 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>Requests</span>
          {incomingRequests.length > 0 && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-black">
              {incomingRequests.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setSubTab('search')}
          className={`flex-1 py-1.5 rounded-lg transition-all cursor-pointer text-center ${
            subTab === 'search'
              ? 'bg-white text-indigo-600 shadow-2xs font-bold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          Find Friends
        </button>
      </div>

      {/* Tab 1: My Crood List */}
      {subTab === 'crood' && (
        <div className="space-y-3">
          {friends.length === 0 ? (
            <div className="p-8 rounded-2xl bg-white border border-slate-200 text-center flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center mb-3">
                <Users className="w-6 h-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800 mb-1">
                No members in your Crood yet
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mb-4">
                Use the &quot;Find Friends&quot; tab to search for other members who signed up, or invite your friends to join!
              </p>
              <button
                type="button"
                onClick={() => setSubTab('search')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Search & Add Friends</span>
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {friends.map((friend) => {
                const moodConfig = friend.latestMood ? getMoodConfig(friend.latestMood) : null;
                // Find request ID to allow unfriending if needed
                const matchRequest = friendRequests.find(
                  (r) =>
                    r.status === 'accepted' &&
                    ((r.senderId === user.uid && r.receiverId === friend.userId) ||
                      (r.receiverId === user.uid && r.senderId === friend.userId))
                );

                return (
                  <div
                    key={friend.userId}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                          {friend.photoURL ? (
                            <img
                              src={friend.photoURL}
                              alt={friend.displayName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            friend.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1 rounded-full border border-white">
                          L{friend.level}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {friend.displayName}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {friend.currentStreak}d
                          </span>
                          {moodConfig && (
                            <span className="text-slate-600 font-medium">
                              • {moodConfig.emoji} {moodConfig.label}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200/80 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" />
                        <span>Crood</span>
                      </span>

                      {matchRequest && (
                        <button
                          type="button"
                          onClick={() => onRemoveFriend(matchRequest.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                          title="Remove from Crood"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Requests (Incoming & Outgoing) */}
      {subTab === 'requests' && (
        <div className="space-y-4">
          {/* Incoming Requests */}
          <div>
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
              <span>Incoming Friend Requests</span>
              <span className="text-slate-400 font-normal">({incomingRequests.length})</span>
            </h4>

            {incomingRequests.length === 0 ? (
              <div className="p-5 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500">
                No pending requests. When someone adds you, their request will appear here!
              </div>
            ) : (
              <div className="space-y-2">
                {incomingRequests.map((req) => (
                  <div
                    key={req.id}
                    id={`incoming-req-${req.id}`}
                    className="p-3.5 rounded-2xl bg-white border border-indigo-100 shadow-2xs flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-indigo-500 text-white font-bold flex items-center justify-center text-xs shadow-xs overflow-hidden shrink-0">
                        {req.senderPhoto ? (
                          <img
                            src={req.senderPhoto}
                            alt={req.senderName}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          req.senderName.charAt(0).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {req.senderName}
                        </h5>
                        <p className="text-[10px] text-slate-400 truncate">
                          wants to join your Crood
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleAccept(req.id)}
                        disabled={actionLoading === req.id}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-2xs transition-colors cursor-pointer"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Accept</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDecline(req.id)}
                        disabled={actionLoading === req.id}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors cursor-pointer"
                        title="Decline"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Outgoing Pending Requests */}
          {outgoingPendingRequests.length > 0 && (
            <div>
              <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <span>Sent Requests (Pending)</span>
                <span className="text-slate-400 font-normal">({outgoingPendingRequests.length})</span>
              </h4>
              <div className="space-y-2">
                {outgoingPendingRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs text-slate-600"
                  >
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-amber-500" />
                      <span>Sent request to <strong className="text-slate-800">{req.receiverName}</strong></span>
                    </div>
                    <span className="text-[10px] font-semibold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                      Waiting...
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Search & Discover Croods */}
      {subTab === 'search' && (
        <div className="space-y-3">
          {/* Search Box Form */}
          <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search friends by name or email..."
                className="w-full pl-9 pr-8 py-2.5 rounded-xl border border-slate-200 bg-white text-xs placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-2xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 text-xs cursor-pointer"
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={!searchQuery.trim()}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer disabled:cursor-not-allowed shrink-0"
            >
              <Search className="w-3.5 h-3.5" />
              <span>Search</span>
            </button>
          </form>

          {/* Header with Total croods count */}
          <div className="flex items-center justify-between px-1 text-[11px] text-slate-500 font-medium">
            <span>Total croods ({totalCroodsCount})</span>
            {hasSearched && (
              <span className="text-indigo-600 font-semibold">
                {searchResults.length} {searchResults.length === 1 ? 'member' : 'members'} found
              </span>
            )}
          </div>

          {/* User Results List */}
          <div className="space-y-2">
            {!hasSearched ? (
              <div className="p-8 rounded-2xl bg-white border border-slate-200/90 text-center shadow-2xs">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-3">
                  <Search className="w-5 h-5" />
                </div>
                <h4 className="text-xs font-bold text-slate-800 mb-1">Find Friends to Join Your Crood</h4>
                <p className="text-[11px] text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Enter a friend&apos;s name or email address above and press Search to find them.
                </p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white border border-slate-200 text-center text-xs text-slate-500 shadow-2xs">
                <span>No croods found matching &quot;{submittedQuery}&quot;. Try another name or email.</span>
              </div>
            ) : (
              searchResults.map((target) => {
                const isAlreadyFriend = friendUserIds.has(target.userId);
                const isPendingSent = pendingSentTargetIds.has(target.userId);
                const isPendingReceived = pendingReceivedSenderIds.has(target.userId);
                const isLoading = actionLoading === target.userId;

                return (
                  <div
                    key={target.userId}
                    id={`user-search-card-${target.userId}`}
                    className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 text-white font-bold flex items-center justify-center text-sm shadow-xs overflow-hidden">
                          {target.photoURL ? (
                            <img
                              src={target.photoURL}
                              alt={target.displayName}
                              className="w-full h-full object-cover"
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            target.displayName.charAt(0).toUpperCase()
                          )}
                        </div>
                        <span className="absolute -bottom-1 -right-1 bg-amber-500 text-white text-[9px] font-black px-1 rounded-full border border-white">
                          L{target.level}
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h5 className="text-xs font-bold text-slate-900 truncate">
                          {target.displayName}
                        </h5>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-400">
                          <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                            <Flame className="w-3 h-3 text-amber-500 fill-amber-500" />
                            {target.currentStreak}d streak
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Button: Add / Sent / In Crood */}
                    <div className="shrink-0">
                      {isAlreadyFriend ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200/70">
                          <Check className="w-3.5 h-3.5" />
                          <span>In Crood</span>
                        </span>
                      ) : isPendingSent ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/70">
                          <Clock className="w-3.5 h-3.5 text-amber-500" />
                          <span>Sent</span>
                        </span>
                      ) : isPendingReceived ? (
                        <button
                          type="button"
                          onClick={() => setSubTab('requests')}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          <span>Respond</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSend(target)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer"
                        >
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>{isLoading ? 'Adding...' : 'Add'}</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
