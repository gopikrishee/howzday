import React, { useState, useMemo, useEffect } from 'react';
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
} from '../types';
import { getMoodConfig } from '../data/moodConfigs';
import {
  Check,
  Plus,
  Trash2,
  Sparkles,
  ArrowLeft,
  Target,
  User as UserIcon,
  Calendar,
  Layers,
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

const QUICK_INSPIRATIONS = [
  { title: 'Drink 2L water & stay hydrated', priority: 'medium' as TaskPriority },
  { title: '15-min Crood check-in sync', priority: 'high' as TaskPriority },
  { title: 'Complete today’s top focus priority', priority: 'high' as TaskPriority },
  { title: '10-min mindful breathwork / stretch', priority: 'low' as TaskPriority },
  { title: '20-min fresh air evening walk', priority: 'medium' as TaskPriority },
];

export const CollaborateView: React.FC<CollaborateViewProps> = ({
  user,
  croodFriends,
  todayMoodEntry,
  planners,
  onSavePlanner,
  onDeletePlanner,
  onBackToMoods,
  onSignIn,
}) => {
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('all');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Filter tasks tab
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

  // New planner creation modal / inline input state
  const [showNewPlanInput, setShowNewPlanInput] = useState(false);
  const [newPlanTitle, setNewPlanTitle] = useState('');

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

  // Helper to sync collaborators and attached Croods onto the planner
  const syncPlannerCollaborators = (
    planner: DailyPlanner,
    tasks: DailyTaskItem[],
    newAssigneeId?: string
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
      if (t.assignedTo?.uid && t.assignedTo.uid !== 'all' && t.assignedTo.uid !== 'guest') {
        allUids.add(t.assignedTo.uid);
      }
    });

    if (newAssigneeId && newAssigneeId !== 'all' && newAssigneeId !== 'guest') {
      allUids.add(newAssigneeId);
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

  // Handle creating a new planner
  const handleCreatePlanner = async (customTitle?: string) => {
    const creatorId = user ? user.uid : 'guest';
    const creatorName = user?.displayName || user?.email?.split('@')[0] || 'Me';
    const creatorPhoto = user?.photoURL || undefined;

    const newPlanner: DailyPlanner = {
      id: `plan_${creatorId}_${Date.now()}`,
      ownerId: creatorId,
      ownerName: creatorName,
      ownerPhoto: creatorPhoto,
      date: getTodayDateString(),
      title: customTitle?.trim() || 'Daily Task Planner',
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

    await onSavePlanner(newPlanner);
    setActivePlannerId(newPlanner.id);
    setShowNewPlanInput(false);
    setNewPlanTitle('');
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
          title: 'Daily Task Planner',
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

      const currentUserModifier = {
        uid: user?.uid || 'guest',
        displayName: user?.displayName || user?.email?.split('@')[0] || 'Me',
        photoURL: user?.photoURL || undefined,
      };

      let assignedToData: { uid: string; displayName: string; photoURL?: string } | undefined;
      if (taskAssigneeId !== 'all') {
        if (taskAssigneeId === user?.uid) {
          assignedToData = currentUserModifier;
        } else {
          const friend = croodFriends.find((f) => f.userId === taskAssigneeId);
          if (friend) {
            assignedToData = {
              uid: friend.userId,
              displayName: friend.displayName || 'Crood Friend',
              photoURL: friend.photoURL,
            };
          }
        }
      }

      const newTask: DailyTaskItem = {
        id: `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        title: trimmed,
        completed: false,
        priority: taskPriority,
        assignedTo: assignedToData,
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
        taskAssigneeId !== 'all' ? taskAssigneeId : undefined
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
    } finally {
      setIsSubmittingTask(false);
    }
  };

  // Quick add inspiration task
  const handleQuickAdd = async (item: { title: string; priority: TaskPriority }) => {
    setTaskTitle(item.title);
    setTaskPriority(item.priority);
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
  const progressPercent = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    if (!activePlan) return [];
    if (taskFilter === 'pending') return activePlan.tasks.filter((t) => !t.completed);
    if (taskFilter === 'completed') return activePlan.tasks.filter((t) => t.completed);
    return activePlan.tasks;
  }, [activePlan, taskFilter]);

  const activeMoodConfig = todayMoodEntry ? getMoodConfig(todayMoodEntry.mood) : null;
  const isOwner = !activePlan || activePlan.ownerId === (user?.uid || 'guest');

  return (
    <div id="collaborate-panel" className="flex-1 flex flex-col relative space-y-4">
      {/* Top Header with Back Navigation and Plan Selector */}
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

        <div className="inline-flex items-center gap-2">
          {planners.length > 1 && (
            <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs px-2 py-1 rounded-full border border-slate-200/90 shadow-2xs">
              <Layers className="w-3.5 h-3.5 text-indigo-600" />
              <select
                value={activePlan?.id || ''}
                onChange={(e) => setActivePlannerId(e.target.value)}
                className="text-[11px] font-bold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer pr-1"
              >
                {planners.map((p) => {
                  const isPlanOwner = p.ownerId === (user?.uid || 'guest');
                  return (
                    <option key={p.id} value={p.id}>
                      {isPlanOwner ? `My Plan: ${p.title}` : `${p.ownerName}'s Plan`}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          <div className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-xs px-3 py-1.5 rounded-full border border-slate-200/90 shadow-2xs text-[11px] font-bold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Shared Planner</span>
          </div>
        </div>
      </div>

      {/* Main Collaborate Hero Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 border border-indigo-100/80 shadow-2xs space-y-3.5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/30" />
              <span>{isOwner ? 'My Collaborative Plan' : `Shared by ${activePlan?.ownerName || 'Crood'}`}</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight truncate">
              {activePlan?.title || 'Daily Task Planner'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Co-plan and assign focus goals together. Assigned tasks appear live on your Crood’s planner.
            </p>
          </div>

          {/* Progress Badge */}
          {totalTasksCount > 0 && (
            <div className="shrink-0 flex flex-col items-end">
              <span className="text-xs font-black text-indigo-700">
                {completedTasksCount}/{totalTasksCount} Done
              </span>
              <span className="text-[10px] text-slate-500 font-medium">
                {progressPercent}% completed
              </span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        {totalTasksCount > 0 && (
          <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden border border-slate-200/60">
            <motion.div
              className={`h-full rounded-full ${
                progressPercent === 100
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-500'
                  : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-600'
              }`}
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
            />
          </div>
        )}

        {/* Plan meta & action bar */}
        <div className="pt-2 border-t border-slate-100/90 flex items-center justify-between gap-2 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            <span>{activePlan?.date || getTodayDateString()}</span>
            {!isOwner && activePlan && (
              <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                From {activePlan.ownerName}
              </span>
            )}
          </div>

          {/* Create new plan button */}
          <button
            type="button"
            onClick={() => setShowNewPlanInput((prev) => !prev)}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 cursor-pointer transition-colors"
          >
            <Plus className="w-3 h-3 stroke-[2.5]" />
            <span>New Plan</span>
          </button>
        </div>

        {/* Inline new plan creator */}
        {showNewPlanInput && (
          <div className="p-3 bg-white rounded-2xl border border-indigo-200 shadow-2xs flex items-center gap-2">
            <input
              type="text"
              value={newPlanTitle}
              onChange={(e) => setNewPlanTitle(e.target.value)}
              placeholder="Enter new plan name (e.g. Project Sprint, Weekend Goals)..."
              className="flex-1 px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (newPlanTitle.trim()) handleCreatePlanner(newPlanTitle);
                }
              }}
            />
            <button
              type="button"
              onClick={() => {
                if (newPlanTitle.trim()) handleCreatePlanner(newPlanTitle);
              }}
              disabled={!newPlanTitle.trim()}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Create
            </button>
            <button
              type="button"
              onClick={() => {
                setShowNewPlanInput(false);
                setNewPlanTitle('');
              }}
              className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
            >
              Cancel
            </button>
          </div>
        )}
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

      {/* Quick Inspiration Chips */}
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
          Quick Inspirations
        </span>
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {QUICK_INSPIRATIONS.map((insp, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleQuickAdd(insp)}
              className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200/90 text-[11px] font-medium text-slate-700 shadow-2xs transition-all cursor-pointer active:scale-95"
            >
              <Plus className="w-3 h-3 text-indigo-600" />
              <span>{insp.title}</span>
            </button>
          ))}
        </div>
      </div>

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

        {/* Priority & Assignee Selectors */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
          {/* Priority pills */}
          <div className="flex items-center gap-1.5">
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

          {/* Assign to Crood selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1">
              <UserIcon className="w-3 h-3 text-slate-400" />
              <span>Assign to:</span>
            </span>
            <select
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1 text-slate-700 font-bold text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
            >
              <option value="all">Everyone / Shared</option>
              <option value={user?.uid || 'guest'}>Myself</option>
              {croodFriends.map((friend) => (
                <option key={friend.userId} value={friend.userId}>
                  {friend.displayName}
                </option>
              ))}
            </select>
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

        {isOwner && activePlan && planners.length > 1 && (
          <button
            type="button"
            onClick={() => onDeletePlanner(activePlan.id)}
            className="text-[11px] font-medium text-rose-500 hover:text-rose-700 transition-colors flex items-center gap-1 cursor-pointer"
            title="Delete this planner"
          >
            <Trash2 className="w-3 h-3" />
            <span>Delete Plan</span>
          </button>
        )}
      </div>

      {/* Tasks List */}
      <div className="space-y-2.5">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isAssignedToCurrentUser =
                user && task.assignedTo && task.assignedTo.uid === user.uid;
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

                      {/* Meta Information Footer (Assignee, Modifier, Cheers) */}
                      <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-[11px] text-slate-500">
                        <div className="flex flex-wrap items-center gap-2">
                          {/* Assignee Badge */}
                          {task.assignedTo ? (
                            <span
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold text-[10px] border ${
                                isAssignedToCurrentUser
                                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                                  : 'bg-slate-100 text-slate-700 border-slate-200'
                              }`}
                            >
                              <UserIcon className="w-2.5 h-2.5" />
                              <span>
                                {isAssignedToCurrentUser ? 'Assigned to You' : `Assigned: ${task.assignedTo.displayName}`}
                              </span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-slate-400">
                              Shared
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
                Add focus goals above and assign them to yourself or any of your Croods to co-plan live.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
