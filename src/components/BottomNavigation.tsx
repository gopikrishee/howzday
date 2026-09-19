import React from 'react';
import { AppTab } from '../types';
import { MoodTheme } from '../data/moodThemes';
import { Smile, Activity, Users } from 'lucide-react';

interface BottomNavigationProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  pendingRequestsCount?: number;
  moodTheme?: MoodTheme;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  pendingRequestsCount = 0,
  moodTheme,
}) => {
  const tabs = [
    {
      id: 'moods' as AppTab,
      label: 'Moods',
      icon: Smile,
      badge: 0,
    },
    {
      id: 'feeds' as AppTab,
      label: 'Feeds',
      icon: Activity,
      badge: 0,
    },
    {
      id: 'croods' as AppTab,
      label: 'Croods',
      icon: Users,
      badge: pendingRequestsCount,
    },
  ];

  return (
    <nav
      id="bottom-app-navigation"
      aria-label="Bottom Navigation"
      className={`fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md z-40 ${moodTheme?.navBg || 'bg-white/95'} backdrop-blur-md border-t border-x ${moodTheme?.borderColor || 'border-slate-200'} shadow-lg px-2 pt-1.5 pb-[max(0.375rem,env(safe-area-inset-bottom))] transition-colors duration-700`}
    >
      <div className="w-full grid grid-cols-3 gap-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              id={`nav-tab-${tab.id}`}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-3 rounded-2xl transition-all duration-300 cursor-pointer select-none min-h-[50px] ${
                isActive
                  ? `${moodTheme ? `${moodTheme.accentText} ${moodTheme.accentBg} ${moodTheme.accentBorder}` : 'text-indigo-700 bg-indigo-50 border-indigo-200/90'} font-extrabold border shadow-2xs`
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100/80 font-semibold'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-200 ${
                    isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[2]'
                  }`}
                />

                {tab.badge > 0 && (
                  <span
                    id="nav-croods-badge"
                    className="absolute -top-1.5 -right-2.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-xs animate-pulse"
                  >
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>

              <span className="text-xs mt-1 tracking-tight leading-none whitespace-nowrap">
                {tab.label}
              </span>

              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
