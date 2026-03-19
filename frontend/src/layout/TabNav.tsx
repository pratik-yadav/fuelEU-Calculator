import { useActiveTab, useSetActiveTab, type TabId } from '@/stores/app.store';
import { Ship, BarChart2, Landmark, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ReactNode } from 'react';

const tabs: Array<{ id: TabId; label: string; icon: ReactNode }> = [
  { id: 'routes', label: 'Routes', icon: <Ship className="w-4 h-4" /> },
  { id: 'compare', label: 'Compare', icon: <BarChart2 className="w-4 h-4" /> },
  { id: 'banking', label: 'Banking', icon: <Landmark className="w-4 h-4" /> },
  { id: 'pooling', label: 'Pooling', icon: <Users className="w-4 h-4" /> },
];

export function TabNav() {
  const activeTab = useActiveTab();
  const setActiveTab = useSetActiveTab();

  return (
    <nav className="flex gap-1 px-4">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors rounded-t-lg -mb-px border-b-2',
            activeTab === tab.id
              ? 'border-teal-500 text-teal-400 bg-teal-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50',
          )}
        >
          {tab.icon}
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
