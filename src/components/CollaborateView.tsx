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
  Users,
  UserPlus,
  Sparkles,
  ArrowLeft,
  Target,
  Shield,
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
  onGoToCroods,
}) => {
  const [activePlannerId, setActivePlannerId] = useState<string | null>(null);

  // New task form state
  const [taskTitle, setTaskTitle] = useState('');
  const [taskPriority, setTaskPriority] = useState<TaskPriority>('medium');
  const [taskAssigneeId, setTaskAssigneeId] = useState<string>('all');
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Attach Crood modal state
  const [showAttachModal, setShowAttachModal] = useState(false);
  const [selectedCroodIds, setSelectedCroodIds] = useState<string[]>([]);
  const [isSavingCroods, setIsSavingCroods] = useState(false);

  // Filter tasks tab
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'completed'>('all');

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

  // Initialize selectedCroodIds when opening modal
  useEffect(() => {
    if (currentPlanner) {
      setSelectedCroodIds(currentPlanner.attachedCroodIds || []);
    } else {
      setSelectedCroodIds([]);
    }
  }, [currentPlanner, showAttachModal]);

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
      title: customTitle || 'Focus & Goals Planner',
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

      const updatedPlan: DailyPlanner = {
        ...targetPlan,
        tasks: [newTask, ...targetPlan.tasks],
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

    const updatedPlan: DailyPlanner = {
      ...activePlan,
      tasks: updatedTasks,
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

    await onSavePlanner({
      ...activePlan,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  // Delete task
  const handleDeleteTask = async (taskId: string) => {
    if (!activePlan) return;
    const updatedTasks = activePlan.tasks.filter((t) => t.id !== taskId);
    await onSavePlanner({
      ...activePlan,
      tasks: updatedTasks,
      updatedAt: new Date().toISOString(),
    });
  };

  // Save attached croods
  const handleSaveAttachedCroods = async () => {
    if (!activePlan) return;
    setIsSavingCroods(true);
    try {
      const creatorId = activePlan.ownerId;
      const attachedIds = selectedCroodIds.filter((id) => id !== creatorId);

      // Build collaborator summaries
      const attachedSummaries: CollaboratorSummary[] = attachedIds.map((id) => {
        const friend = croodFriends.find((f) => f.userId === id);
        return {
          uid: id,
          displayName: friend?.displayName || 'Crood Friend',
          email: friend?.email,
          photoURL: friend?.photoURL,
          currentStreak: friend?.currentStreak || 0,
          latestMood: friend?.latestMood,
        };
      });

      // Owner summary
      const ownerSummary: CollaboratorSummary = {
        uid: creatorId,
        displayName: activePlan.ownerName,
        photoURL: activePlan.ownerPhoto,
      };

      const updatedPlan: DailyPlanner = {
        ...activePlan,
        attachedCroodIds: attachedIds,
        collaboratorIds: [creatorId, ...attachedIds],
        collaborators: [ownerSummary, ...attachedSummaries],
        updatedAt: new Date().toISOString(),
      };

      await onSavePlanner(updatedPlan);
      setShowAttachModal(false);
    } finally {
      setIsSavingCroods(false);
    }
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

  return (
    <div id="collaborate-panel" className="flex-1 flex flex-col relative space-y-4">
      {/* Top Header with Back Navigation */}
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
          <span>Live Planner</span>
        </div>
      </div>

      {/* Main Collaborate Hero Card */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-white via-indigo-50/30 to-purple-50/40 border border-indigo-100/80 shadow-2xs space-y-3.5 relative overflow-hidden">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-1">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 fill-indigo-600/30" />
              <span>Collaborative Planner</span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 leading-tight">
              {activePlan?.title || 'Focus & Goals Planner'}
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Plan focus goals for yourself and attach your Crood to co-plan together.
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

        {/* Attached Croods Pill Section */}
        <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Users className="w-3.5 h-3.5 text-slate-400" />
              <span>Crood Squad:</span>
            </span>

            {/* Avatar Stack */}
            <div className="flex items-center -space-x-1.5 overflow-hidden">
              {/* Owner */}
              <div
                className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-2xs"
                title={`Creator: ${activePlan?.ownerName || 'You'}`}
              >
                {activePlan?.ownerPhoto ? (
                  <img src={activePlan.ownerPhoto} alt="Owner" className="w-full h-full object-cover rounded-full" />
                ) : (
                  (activePlan?.ownerName || 'Y').charAt(0).toUpperCase()
                )}
              </div>

              {/* Attached Members */}
              {activePlan?.collaborators
                .filter((c) => c.uid !== activePlan.ownerId)
                .map((member) => (
                  <div
                    key={member.uid}
                    className="w-6 h-6 rounded-full bg-purple-600 text-white font-bold text-[10px] flex items-center justify-center ring-2 ring-white shadow-2xs"
                    title={`Crood: ${member.displayName}`}
                  >
                    {member.photoURL ? (
                      <img src={member.photoURL} alt={member.displayName} className="w-full h-full object-cover rounded-full" />
                    ) : (
                      member.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                ))}
            </div>

            <span className="text-[11px] font-medium text-slate-500">
              {activePlan && activePlan.attachedCroodIds.length > 0
                ? `${activePlan.attachedCroodIds.length} attached`
                : 'Only you'}
            </span>
          </div>

          {/* Attach Crood CTA Button */}
          <button
            type="button"
            id="attach-crood-btn"
            onClick={() => {
              if (!user) {
                onSignIn();
              } else {
                setShowAttachModal(true);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold shadow-2xs transition-all cursor-pointer active:scale-95 min-h-[34px]"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>{activePlan?.attachedCroodIds.length ? 'Manage Croods' : 'Attach Crood'}</span>
          </button>
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

        {/* Priority Selector */}
        <div className="flex items-center gap-1 pt-1 text-xs">
          <span className="text-[11px] font-bold text-slate-400 mr-1">Priority:</span>
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
                className={`px-2 py-0.5 rounded-lg border text-[11px] font-bold capitalize transition-all cursor-pointer ${colorClasses}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Optional Assignee if croods are attached */}
        {activePlan && activePlan.attachedCroodIds.length > 0 && (
          <div className="flex items-center gap-2 pt-1 text-[11px] text-slate-500">
            <span className="font-bold text-slate-600">Assign to:</span>
            <select
              value={taskAssigneeId}
              onChange={(e) => setTaskAssigneeId(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-slate-700 font-medium text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
            >
              <option value="all">Everyone / Shared</option>
              <option value={user?.uid || 'guest'}>Myself</option>
              {croodFriends
                .filter((f) => activePlan.attachedCroodIds.includes(f.userId))
                .map((f) => (
                  <option key={f.userId} value={f.userId}>
                    {f.displayName}
                  </option>
                ))}
            </select>
          </div>
        )}
      </form>

      {/* Task Filters & Counts */}
      <div className="flex items-center justify-between gap-2 pt-1">
        <div className="flex items-center gap-1.5">
          {(['all', 'pending', 'completed'] as const).map((filter) => {
            const count =
              filter === 'all'
                ? totalTasksCount
                : filter === 'pending'
                ? totalTasksCount - completedTasksCount
                : completedTasksCount;

            return (
              <button
                key={filter}
                type="button"
                onClick={() => setTaskFilter(filter)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  taskFilter === filter
                    ? 'bg-indigo-600 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80'
                }`}
              >
                <span className="capitalize">{filter}</span>
                <span className="ml-1 opacity-80 text-[10px]">({count})</span>
              </button>
            );
          })}
        </div>

        <span className="text-[11px] text-slate-400 font-medium">
          {filteredTasks.length} {filteredTasks.length === 1 ? 'task' : 'tasks'}
        </span>
      </div>

      {/* Task List */}
      <div className="space-y-2.5 pb-6">
        <AnimatePresence mode="popLayout">
          {filteredTasks.length > 0 ? (
            filteredTasks.map((task) => {
              const isHighPriority = task.priority === 'high';
              const isMediumPriority = task.priority === 'medium';

              return (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`p-3.5 sm:p-4 rounded-2xl border transition-all duration-200 bg-white ${
                    task.completed
                      ? 'border-emerald-200/80 bg-emerald-50/20'
                      : isHighPriority
                      ? 'border-rose-200/80 shadow-2xs'
                      : 'border-slate-200/90 shadow-2xs'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Checkbox */}
                    <button
                      type="button"
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-6 h-6 rounded-xl flex items-center justify-center transition-all cursor-pointer shrink-0 mt-0.5 ${
                        task.completed
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'border-2 border-slate-300 hover:border-indigo-500 bg-white'
                      }`}
                      title={task.completed ? 'Mark as incomplete' : 'Mark as completed'}
                    >
                      {task.completed && <Check className="w-4 h-4 stroke-[3]" />}
                    </button>

                    {/* Task Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        {/* Priority Dot */}
                        <span
                          className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold ${
                            isHighPriority
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : isMediumPriority
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isHighPriority ? 'bg-rose-500' : isMediumPriority ? 'bg-amber-500' : 'bg-emerald-500'
                            }`}
                          />
                          <span className="capitalize">{task.priority}</span>
                        </span>

                        {/* Assigned Crood Badge */}
                        {task.assignedTo && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
                            <Users className="w-2.5 h-2.5" />
                            <span>{task.assignedTo.displayName}</span>
                          </span>
                        )}
                      </div>

                      {/* Task Title */}
                      <p
                        className={`text-xs sm:text-sm font-semibold transition-all ${
                          task.completed ? 'text-slate-400 line-through' : 'text-slate-900'
                        }`}
                      >
                        {task.title}
                      </p>

                      {/* CRITICAL REQUIREMENT: Last Modified Person metadata footer */}
                      <div className="mt-2.5 pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                        <div className="flex items-center gap-1.5">
                          {/* Modifier avatar/initials */}
                          <div className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 font-bold text-[9px] flex items-center justify-center overflow-hidden">
                            {task.lastModifiedBy?.photoURL ? (
                              <img
                                src={task.lastModifiedBy.photoURL}
                                alt={task.lastModifiedBy.displayName}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              (task.lastModifiedBy?.displayName || 'M').charAt(0).toUpperCase()
                            )}
                          </div>
                          <span>
                            {task.completed ? 'Completed by' : 'Last modified by'}{' '}
                            <strong className="text-slate-700 font-bold">
                              {task.lastModifiedBy?.displayName || 'Friend'}
                            </strong>
                          </span>
                          <span className="text-slate-400">• {formatTimeAgo(task.lastModifiedAt)}</span>
                        </div>

                        {/* Actions: Cheer & Delete */}
                        <div className="flex items-center gap-1.5 ml-auto">
                          {/* Cheer / High-five */}
                          <button
                            type="button"
                            onClick={() => handleCheerTask(task.id)}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-50 hover:bg-amber-50 text-slate-600 hover:text-amber-700 text-[10px] font-bold border border-slate-200/80 transition-colors cursor-pointer"
                            title="Cheer this task with high-five"
                          >
                            <span>🙌</span>
                            {task.cheers && task.cheers.length > 0 && (
                              <span>{task.cheers.length}</span>
                            )}
                          </button>

                          {/* Delete button */}
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
                Add focus goals above or attach your Croods to coordinate your schedule together.
              </p>
            </div>
          )}
        </AnimatePresence>
      </div>

      {/* Attach Crood to Planner Modal */}
      <AnimatePresence>
        {showAttachModal && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs"
            onClick={() => {
              if (!isSavingCroods) setShowAttachModal(false);
            }}
          >
            <motion.div
              id="attach-crood-modal"
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 12 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]"
            >
              {/* Header */}
              <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50/70 to-purple-50/70">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                    <UserPlus className="w-4 h-4 stroke-[2.5]" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                      Attach Croods to Plan
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Co-plan tasks together in real-time
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Body */}
              <div className="p-4 sm:p-5 overflow-y-auto space-y-3">
                <div className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-950 flex items-start gap-2.5">
                  <Shield className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <p className="leading-relaxed">
                    Once attached, this task planner appears on their Collaborate screen as well. Only the Croods you attach can view and contribute to this plan.
                  </p>
                </div>

                <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider pt-1">
                  Your Crood Members ({croodFriends.length})
                </h4>

                {croodFriends.length > 0 ? (
                  <div className="space-y-2">
                    {croodFriends.map((friend) => {
                      const isSelected = selectedCroodIds.includes(friend.userId);

                      return (
                        <div
                          key={friend.userId}
                          onClick={() => {
                            setSelectedCroodIds((prev) =>
                              prev.includes(friend.userId)
                                ? prev.filter((id) => id !== friend.userId)
                                : [...prev, friend.userId]
                            );
                          }}
                          className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-indigo-50/50 border-indigo-300 shadow-2xs'
                              : 'bg-white border-slate-200/80 hover:bg-slate-50'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs overflow-hidden shrink-0">
                              {friend.photoURL ? (
                                <img src={friend.photoURL} alt={friend.displayName} className="w-full h-full object-cover" />
                              ) : (
                                friend.displayName.charAt(0).toUpperCase()
                              )}
                            </div>
                            <div className="min-w-0">
                              <span className="text-xs font-bold text-slate-900 block truncate">
                                {friend.displayName}
                              </span>
                              <span className="text-[11px] text-slate-500 block truncate">
                                {friend.email}
                              </span>
                            </div>
                          </div>

                          <div
                            className={`w-6 h-6 rounded-xl flex items-center justify-center border transition-all ${
                              isSelected
                                ? 'bg-indigo-600 border-indigo-600 text-white'
                                : 'border-slate-300 bg-white'
                            }`}
                          >
                            {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-6 px-3 bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-2">
                    <p className="text-xs text-slate-600">
                      You have no Crood friends yet. Find and add friends in the Croods tab to collaborate on tasks!
                    </p>
                    {onGoToCroods && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowAttachModal(false);
                          onGoToCroods();
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-700 bg-indigo-50 px-3 py-1.5 rounded-xl border border-indigo-200 hover:bg-indigo-100 transition-colors cursor-pointer"
                      >
                        <UserPlus className="w-3 h-3" />
                        <span>Go to Croods Squad</span>
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-end gap-2.5 bg-slate-50/50">
                <button
                  type="button"
                  onClick={() => setShowAttachModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors cursor-pointer min-h-[40px]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  id="save-attached-croods-btn"
                  disabled={isSavingCroods}
                  onClick={handleSaveAttachedCroods}
                  className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-2xs transition-all cursor-pointer min-h-[40px] flex items-center gap-1.5"
                >
                  {isSavingCroods ? <span>Saving...</span> : <span>Save Collaborators</span>}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
