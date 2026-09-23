import React, { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { User } from 'firebase/auth';
import {
  DailyPlanner,
  DailyTaskItem,
  UserProfile,
  MoodEntry,
  TaskPriority,
  CollaboratorSummary,
  TaskModifier,
} from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import {
  Check,
  Plus,
  Trash2,
  ArrowLeft,
  Target,
  Users,
  Search,
  ChevronDown,
  X,
} from 'lucide-react';
import { getTodayDateString } from '../services/storageService';

interface CollaborateViewProps {
  user: User | null;
  croodFriends: UserProfile[];
  todayMoodEntry: MoodEntry | null;
  planners: DailyPlanner[];
  onSavePlanner: (planner: DailyPlanner) => Promise<void>;
  onDeletePlanner: (plannerId: string) => Promise<void>;
  onBackToMoods: () => void;
  onSignIn: () => void;
  onGoToCroods?: () => void;
}

export const CollaborateView: React.FC<CollaborateViewProps> = ({
  user,
  croodFriends,
  todayMoodEntry,
  planners,
  onSavePlanner,
  onBackToMoods,
}) => {
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  // Selected Crood friends to collaborate with. Creator (Myself) is default and always included.
  const [selectedFriendUids, setSelectedFriendUids] = useState<string[]>([]);
  const [isCollabDropdownOpen, setIsCollabDropdownOpen] = useState(false);
  const [collabSearchQuery, setCollabSearchQuery] = useState('');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);
  const collabDropdownRef = useRef<HTMLDivElement>(null);

  // Filter tasks tab
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // Click-outside listener for Collab multi-select dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        collabDropdownRef.current &&
        !collabDropdownRef.current.contains(event.target as Node)
      ) {
        setIsCollabDropdownOpen(false);
      }
    };
    if (isCollabDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCollabDropdownOpen]);

  // Current selected planner or fallback to first available
  const currentPlanner = useMemo(() => {
    if (activePlannerId) {
      const found = planners.find((p) => p.id === activePlannerId);
      if (found) return found;
    }
    return planners[0] || null;
  }, [planners, activePlannerId]);

  // Sync activePlannerId when planners change
  useEffect(() => {
    if (planners.length > 0 && (!activePlannerId || !planners.some((p) => p.id === activePlannerId))) {
      setActivePlannerId(planners[0].id);
    }
  }, [planners, activePlannerId]);

  // Filtered Crood friends for search in the Collab dropdown (no Myself option needed)
  const filteredFriends = useMemo(() => {
    const query = collabSearchQuery.trim().toLowerCase();
    if (!query) return croodFriends;
    return croodFriends.filter(
      (friend) =>
        (friend.displayName && friend.displayName.toLowerCase().includes(query)) ||
        (friend.email && friend.email.toLowerCase().includes(query))
    );
  }, [croodFriends, collabSearchQuery]);

  // Toggle selection of a friend
  const toggleFriendSelection = (uid: string) => {
    setSelectedFriendUids((prev) =>
      prev.includes(uid) ? prev.filter((id) => id !== uid) : [...prev, uid]
    );
  };

  // Fixed trigger button summary text (stable length to prevent layout jumps)
  const collabSummaryText = useMemo(() => {
    if (selectedFriendUids.length === 0) return 'Just Me';
    if (selectedFriendUids.length === 1) {
      const friend = croodFriends.find((f) => f.userId === selectedFriendUids[0]);
      const name = friend?.displayName ? friend.displayName.split(' ')[0] : '1 Crood';
      return `${name} & You`;
    }
    return `${selectedFriendUids.length} Croods & You`;
  }, [selectedFriendUids, croodFriends]);

  // Helper to sync collaborators and attached Croods onto the planner
  const syncPlannerCollaborators = (
    planner: DailyPlanner,
    tasks: DailyTaskItem[],
    newCollabUids?: string[]
  ): {
    collaboratorIds: string[];
    attachedCroodIds: string[];
    collaborators: CollaboratorSummary[];
  } => {
    const allUids = new Set<string>();
    if (planner.ownerId) allUids.add(planner.ownerId);
    if (user?.uid) allUids.add(user.uid);

    (planner.collaboratorIds || []).forEach((id) => {
      if (id) allUids.add(id);
    });

    tasks.forEach((t) => {
      if (t.assignedTo?.uid && t.assignedTo.uid !== 'guest') {
        allUids.add(t.assignedTo.uid);
      }
      if (t.collabWith && Array.isArray(t.collabWith)) {
        t.collabWith.forEach((c) => {
          if (c.uid && c.uid !== 'guest') allUids.add(c.uid);
        });
      }
    });

    if (newCollabUids && Array.isArray(newCollabUids)) {
      newCollabUids.forEach((id) => {
        if (id && id !== 'guest') allUids.add(id);
      });
    }

    const collaboratorIds = Array.from(allUids);
    const attachedCroodIds = collaboratorIds.filter((id) => id !== planner.ownerId);

    const collaborators: CollaboratorSummary[] = collaboratorIds.map((uid) => {
      if (uid === planner.ownerId) {
        return {
          uid: planner.ownerId,
          displayName: planner.ownerName || 'Creator',
          photoURL: planner.ownerPhoto,
        };
      }
      const friend = croodFriends.find((f) => f.userId === uid);
      if (friend) {
        return {
          uid: friend.userId,
          displayName: friend.displayName || 'Crood Friend',
          email: friend.email,
          photoURL: friend.photoURL,
          currentStreak: friend.currentStreak || 0,
          latestMood: friend.latestMood,
        };
      }
      const existing = (planner.collaborators || []).find((c) => c.uid === uid);
      if (existing) return existing;
      return {
        uid,
        displayName: 'Crood Friend',
      };
    });

    return { collaboratorIds, attachedCroodIds, collaborators };
  };

  const activePlan = currentPlanner;

  // Add task handler
  const handleAddTask = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = taskTitle.trim();
    if (!trimmed) return;

    setIsSubmittingTask(true);
    try {
      let targetPlan = activePlan;

      // If no planner exists yet, create one
      if (!targetPlan) {
        const creatorId = user ? user.uid : 'guest';
        const creatorName = user?.displayName || user?.email?.split('@')[0] || 'Me';
        const creatorPhoto = user?.photoURL || undefined;

        targetPlan = {
          id: `plan_${creatorId}_${Date.now()}`,
          ownerId: creatorId,
          ownerName: creatorName,
          ownerPhoto: creatorPhoto,
          date: getTodayDateString(),
          title: 'Focus & Goals Planner',
          attachedCroodIds: [],
          collaboratorIds: [creatorId],
          collaborators: [
            {
              uid: creatorId,
              displayName: creatorName,
              photoURL: creatorPhoto,
            },
          ],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
      }

      // Creator is always default and included in task
      const currentUserModifier: TaskModifier = {
        uid: user?.uid || 'guest',
        displayName: user?.displayName || user?.email?.split('@')[0] || 'Me',
        photoURL: user?.photoURL || undefined,
      };

      // Map selected friends
      const selectedFriendModifiers: TaskModifier[] = selectedFriendUids
        .map((uid) => {
          const friend = croodFriends.find((f) => f.userId === uid);
          if (!friend) return null;
          return {
            uid: friend.userId,
            displayName: friend.displayName || 'Crood Friend',
            photoURL: friend.photoURL,
          };
        })
        .filter(Boolean) as TaskModifier[];

      // Collaborators always includes creator (Myself) + any chosen Croods
      const finalCollabWith: TaskModifier[] = [currentUserModifier, ...selectedFriendModifiers];

      const newTask: DailyTaskItem = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: trimmed,
        completed: false,
        priority: taskPriority,
        assignedTo: currentUserModifier, // for backward compatibility
        collabWith: finalCollabWith,
        createdBy: currentUserModifier,
        lastModifiedBy: currentUserModifier,
        lastModifiedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        cheers: [],
      };

      const newTasks = [newTask, ...targetPlan.tasks];
      const { collaboratorIds, attachedCroodIds, collaborators } = syncPlannerCollaborators(
        targetPlan,
        newTasks,
        finalCollabWith.map((c) => c.uid)
      );

      const updatedPlan: DailyPlanner = {
        ...targetPlan,
        tasks: newTasks,
        collaboratorIds,
        attachedCroodIds,
        collaborators,
        updatedAt: new Date().toISOString(),
      };

      await onSavePlanner(updatedPlan);
      setActivePlannerId(updatedPlan.id);
      setTaskTitle('');
      setSelectedFriendUids([]);
      setCollabSearchQuery('');
      setIsCollabDropdownOpen(false);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Toggle task complete
  const handleToggleTask = async (taskId: string) => {
    if (!activePlan) return;

    const modifier = {
      uid: user?.uid || 'guest',
      displayName: user?.displayName || user?.email?.split('@')[0] || 'Me',
      photoURL: user?.photoURL || undefined,
    };

    let willCompleteAll = false;

    const updatedTasks = activePlan.tasks.map((task) => {
      if (task.id === taskId) {
        const nextCompleted = !task.completed;
        return {
          ...task,
          completed: nextCompleted,
          lastModifiedBy: modifier,
          lastModifiedAt: new Date().toISOString(),
        };
      }
      return task;
    });

    // Check if this action completed all tasks
    const allCompleted = updatedTasks.length > 0 && updatedTasks.every((t) => t.completed);
    if (allCompleted) {
      willCompleteAll = true;
    }

    const { collaboratorIds, attachedCroodIds, collaborators } = syncPlannerCollaborators(
      activePlan,
      updatedTasks
    );

    const updatedPlan: DailyPlanner = {
      ...activePlan,
      tasks: updatedTasks,
      collaboratorIds,
      attachedCroodIds,
      collaborators,
      updatedAt: new Date().toISOString(),
    };

    await onSavePlanner(updatedPlan);

    if (willCompleteAll) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {
        // Confetti non-critical
      }
    }
  };

  // Cheer / High-five a task
  const handleCheerTask = async (taskId: string) => {
    if (!activePlan) return;
    const currentUid = user?.uid || 'guest';
    const currentName = user?.displayName || 'Friend';

    const updatedTasks = activePlan.tasks.map((t) => {
      if (t.id === taskId) {
        const existingCheers = t.cheers || [];
        const hasCheered = existingCheers.some((c) => c.uid === currentUid);
        const nextCheers = hasCheered
          ? existingCheers.filter((c) => c.uid !== currentUid)
          : [...existingCheers, { uid: currentUid, emoji: '🙌', name: currentName }];
        return {
          ...t,
          cheers: nextCheers,
        };
      }
      return t;
    });

    const { collaboratorIds, attachedCroodIds, collaborators } = syncPlannerCollaborators(
      activePlan,
      updatedTasks
    );

    await onSavePlanner({
      ...activePlan,
      tasks: updatedTasks,
      collaboratorIds,
      attachedCroodIds,
      collaborators,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!activePlan) return;
    const updatedTasks = activePlan.tasks.filter((t) => t.id !== taskId);
    const { collaboratorIds, attachedCroodIds, collaborators } = syncPlannerCollaborators(
      activePlan,
      updatedTasks
    );

    await onSavePlanner({
      ...activePlan,
      tasks: updatedTasks,
      collaboratorIds,
      attachedCroodIds,
      collaborators,
      updatedAt: new Date().toISOString(),
    });
  };

  // Format relative time for last modified info
  const formatTimeAgo = (isoString?: string) => {
    if (!isoString) return 'recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      if (diffSecs < 60) return 'Just now';
      const diffMins = Math.floor(diffSecs / 60);
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return 'recently';
    }
  };

  // Progress metrics
  const totalTasksCount = activePlan?.tasks.length || 0;
  const completedTasksCount = activePlan?.tasks.filter((t) => t.completed).length || 0;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!activePlan) return [];
    if (taskFilter === 'pending') return activePlan.tasks.filter((t) => !t.completed);
    if (taskFilter === 'completed') return activePlan.tasks.filter((t) => t.completed);
    return activePlan.tasks;
  }, [activePlan, taskFilter]);

  const activeMoodConfig = todayMoodEntry ? getMoodConfig(todayMoodEntry.mood) : null;

  return (
    <div id="collaborate-panel" className="flex-1 flex flex-col relative space-y-4">
      {/* Top Header with Back Navigation and Live Collab Indicator */}
      <div className="flex items-center justify-between gap-2">
        <button
          type="button"
          onClick={onBackToMoods}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-slate-700 hover:text-slate-900 bg-white hover:bg-slate-100 border border-slate-200/90 shadow-2xs transition-all cursor-pointer min-h-[34px] active:scale-95"
          title="Return to Mood Pulse view"
        >
          <ArrowLeft className="w-3.5 h-3.5 text-indigo-600" />
          <span>Mood Pulse</span>
        </button>

        <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xs text-[11px] font-bold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>Live Collab</span>
        </div>
      </div>

      {/* Mood & Focus Synergy Card */}
      {todayMoodEntry && activeMoodConfig && (
        <div className="p-3 rounded-2xl bg-white/80 border border-slate-200/80 flex items-center justify-between gap-3 shadow-2xs">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="text-2xl shrink-0">{activeMoodConfig.emoji}</span>
            <div className="min-w-0">
              <span className="text-xs font-bold text-slate-800 block truncate">
                Today’s Pulse: {activeMoodConfig.label}
              </span>
              <span className="text-[10px] text-slate-500 block truncate">
                {todayMoodEntry.mood === 'happy'
                  ? 'High energy day — fantastic for tackling major focus tasks!'
                  : todayMoodEntry.mood === 'tired' || todayMoodEntry.mood === 'sleepy'
                  ? 'Pace yourself gently — prioritize 1-2 essentials today.'
                  : todayMoodEntry.mood === 'relax'
                  ? 'Centered & calm — great steady momentum.'
                  : 'Collaborate with your Croods for mutual support.'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 shrink-0 border border-slate-200">
            Synergy
          </span>
        </div>
      )}

      {/* Add New Task Form */}
      <form
        onSubmit={handleAddTask}
        className="p-3.5 sm:p-4 rounded-3xl bg-white border border-slate-200/90 shadow-2xs space-y-3"
      >
        <div className="flex items-center gap-2">
          <input
            type="text"
            id="new-task-input"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Add a task or focus goal..."
            className="flex-1 min-h-[42px] px-3.5 py-2 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all"
          />
          <button
            type="submit"
            id="submit-task-btn"
            disabled={!taskTitle.trim() || isSubmittingTask}
            className="px-4 py-2 min-h-[42px] rounded-2xl bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Add</span>
          </button>
        </div>

        {/* Priority & Collab Controls with stable layout */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 pt-1">
          {/* Priority pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-bold text-slate-500 mr-1">Priority:</span>
            {(['low', 'medium', 'high'] as TaskPriority[]).map((p) => {
              const isActive = taskPriority === p;
              const colorClasses =
                p === 'high'
                  ? isActive
                    ? 'bg-rose-500 text-white border-rose-500'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                  : p === 'medium'
                  ? isActive
                    ? 'bg-amber-500 text-white border-amber-500'
                    : 'bg-amber-50 text-amber-700 border-amber-200'
                  : isActive
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200';

              return (
                <button
                  key={p}
                  type="button"
                  onClick={() => setTaskPriority(p)}
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold capitalize transition-all cursor-pointer ${colorClasses}`}
                >
                  {p}
                </button>
              );
            })}
          </div>

          {/* Searchable Multi-Select Collab (Croods only, Myself is default) */}
          <div className="flex items-center justify-between sm:justify-end gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1 shrink-0">
              <Users className="w-3 h-3 text-slate-400" />
              <span>Collab:</span>
            </span>

            <div className="relative" ref={collabDropdownRef}>
              <button
                type="button"
                id="collab-select-trigger"
                onClick={() => setIsCollabDropdownOpen((prev) => !prev)}
                className="w-36 sm:w-40 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-bold text-xs flex items-center justify-between gap-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all cursor-pointer shrink-0"
                title="Select Croods to collaborate with"
              >
                <span className="truncate text-left">{collabSummaryText}</span>
                <ChevronDown
                  className={`w-3 h-3 text-slate-400 shrink-0 transition-transform ${
                    isCollabDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {/* Dropdown Popover positioned safely on all screens */}
              {isCollabDropdownOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-72 max-w-[calc(100vw-2.5rem)] bg-white rounded-2xl shadow-xl border border-slate-200 p-2.5 z-40 space-y-2">
                  {croodFriends.length > 0 ? (
                    <>
                      {/* Search Input */}
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          value={collabSearchQuery}
                          onChange={(e) => setCollabSearchQuery(e.target.value)}
                          placeholder="Search croods..."
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-7 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
                          autoFocus
                        />
                        {collabSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setCollabSearchQuery('')}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>

                      {/* Options List */}
                      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 scrollbar-thin">
                        {filteredFriends.length > 0 ? (
                          filteredFriends.map((friend) => {
                            const isSelected = selectedFriendUids.includes(friend.userId);
                            return (
                              <button
                                key={friend.userId}
                                type="button"
                                onClick={() => toggleFriendSelection(friend.userId)}
                                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs transition-colors cursor-pointer ${
                                  isSelected
                                    ? 'bg-indigo-50 text-indigo-900 font-bold'
                                    : 'hover:bg-slate-50 text-slate-700'
                                }`}
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <div
                                    className={`w-4 h-4 rounded-md flex items-center justify-center border transition-all shrink-0 ${
                                      isSelected
                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                                  </div>

                                  {friend.photoURL ? (
                                    <img
                                      src={friend.photoURL}
                                      alt={friend.displayName}
                                      className="w-5 h-5 rounded-full object-cover shrink-0"
                                    />
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                                      {friend.displayName ? friend.displayName.charAt(0).toUpperCase() : 'C'}
                                    </div>
                                  )}

                                  <span className="truncate">
                                    {friend.displayName || 'Crood Friend'}
                                  </span>
                                </div>
                              </button>
                            );
                          })
                        ) : (
                          <div className="py-3 text-center text-xs text-slate-400">
                            No matching croods found
                          </div>
                        )}
                      </div>

                      {/* Footer Controls */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>
                          {selectedFriendUids.length === 0
                            ? 'Only You'
                            : `${selectedFriendUids.length} selected (+You)`}
                        </span>
                        <div className="flex items-center gap-2.5">
                          {selectedFriendUids.length > 0 && (
                            <button
                              type="button"
                              onClick={() => setSelectedFriendUids([])}
                              className="text-slate-500 hover:text-slate-700 font-medium cursor-pointer"
                            >
                              Clear
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() =>
                              setSelectedFriendUids(croodFriends.map((f) => f.userId))
                            }
                            className="text-indigo-600 hover:text-indigo-700 font-bold cursor-pointer"
                          >
                            Select All
                          </button>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="py-3 px-2 text-center text-xs text-slate-500 space-y-1">
                      <p className="font-semibold text-slate-700">No Crood friends yet</p>
                      <p className="text-[11px] text-slate-400">
                        Tasks automatically include you. Connect with friends in the Croods tab to collaborate together!
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </form>

      {/* Task Filters & Counts */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setTaskFilter('all')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              taskFilter === 'all'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            All ({totalTasksCount})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('pending')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              taskFilter === 'pending'
                ? 'bg-indigo-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            Pending ({totalTasksCount - completedTasksCount})
          </button>
          <button
            type="button"
            onClick={() => setTaskFilter('completed')}
            className={`px-2.5 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              taskFilter === 'completed'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
            }`}
          >
            Done ({completedTasksCount})
          </button>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              // Extract all collaborators assigned to this task
              const taskCollabs: TaskModifier[] =
                task.collabWith && task.collabWith.length > 0
                  ? task.collabWith
                  : task.assignedTo
                  ? [task.assignedTo]
                  : [];

              const isCollabWithCurrentUser = taskCollabs.some(
                (c) => c.uid === (user?.uid || 'guest')
              );

              const collabDisplayNames = taskCollabs
                .map((c) => (c.uid === (user?.uid || 'guest') ? 'You' : c.displayName))
                .join(', ');

              const hasCheers = task.cheers && task.cheers.length > 0;
              const hasUserCheered = task.cheers?.some(
                (c) => c.uid === (user?.uid || 'guest')
              );

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.2 }}
                  className={`p-3.5 sm:p-4 rounded-3xl border transition-all ${
                    task.completed
                      ? 'bg-slate-50/80 border-slate-200/60 opacity-80'
                      : 'bg-white border-slate-200/90 hover:border-indigo-200 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Completion Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all cursor-pointer shrink-0 mt-0.5 ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-2xs'
                          : 'border-slate-300 bg-white hover:border-indigo-500 hover:bg-indigo-50/50'
                      }`}
                      title={task.completed ? 'Mark as pending' : 'Mark as completed'}
                    >
                      {task.completed && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-start justify-between gap-2">
                        <span
                          className={`text-xs sm:text-sm font-bold block break-words ${
                            task.completed
                              ? 'line-through text-slate-400'
                              : 'text-slate-800'
                          }`}
                        >
                          {task.title}
                        </span>

                        {/* Priority Badge */}
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase shrink-0 border ${
                            task.priority === 'high'
                              ? 'bg-rose-50 text-rose-700 border-rose-200'
                              : task.priority === 'medium'
                              ? 'bg-amber-50 text-amber-700 border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {/* Meta Information Footer (Collab With, Modifier, Cheers) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Collab with Badge */}
                          {taskCollabs.length > 0 ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                isCollabWithCurrentUser
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <Users className="w-2.5 h-2.5" />
                              <span>Collab with: {collabDisplayNames}</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Open Collab
                            </span>
                          )}

                          {/* Created/Modified meta */}
                          <span className="text-[10px] text-slate-400">
                            • {formatTimeAgo(task.lastModifiedAt || task.createdAt)}
                          </span>

                          {task.createdBy?.displayName && (
                            <span className="text-[10px] text-slate-400">
                              by {task.createdBy.displayName}
                            </span>
                          )}
                        </div>

                        {/* Actions (Cheer, Delete) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {/* Cheer / High-five */}
                          <button
                            type="button"
                            onClick={() => handleCheerTask(task.id)}
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg border text-[11px] font-bold transition-all cursor-pointer ${
                              hasUserCheered
                                ? 'bg-amber-50 border-amber-300 text-amber-700'
                                : 'bg-slate-50 hover:bg-amber-50 border-slate-200 text-slate-600'
                            }`}
                            title="Cheer your Crood for progress!"
                          >
                            <span>🙌</span>
                            {hasCheers && <span>{task.cheers?.length}</span>}
                          </button>

                          {/* Delete task */}
                          <button
                            type="button"
                            onClick={() => handleDeleteTask(task.id)}
                            className="w-6 h-6 flex items-center justify-center rounded-md text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                            title="Delete task"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-10 px-4 bg-white rounded-3xl border border-slate-200/80 shadow-2xs space-y-2.5">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center border border-indigo-100">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No tasks planned yet</h3>
              <p className="text-xs text-slate-500 max-w-xs mx-auto">
                Add focus goals above and choose Collab members to co-plan live.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
