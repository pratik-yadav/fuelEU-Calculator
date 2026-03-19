import { Anchor } from 'lucide-react';
import { TabNav } from './TabNav';
import ToastContainer from '@/components/ui/Toast';
import Badge from '@/components/ui/Badge';
import { useActiveTab } from '@/stores/app.store';
import { RoutesTab } from '@/features/routes/RoutesTab';
import { CompareTab } from '@/features/compare/CompareTab';
import { BankingTab } from '@/features/banking/BankingTab';
import { PoolingTab } from '@/features/pooling/PoolingTab';

export function AppShell() {
  const activeTab = useActiveTab();

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center gap-3">
          <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <Anchor className="w-4 h-4 text-slate-950" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-100 tracking-wide">VarunaMarine</h1>
            <p className="text-xs text-slate-500">FuelEU Compliance Dashboard</p>
          </div>
          <div className="ml-auto">
            <Badge variant="teal">FuelEU 2025–2029</Badge>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto">
          <TabNav />
        </div>
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-7xl mx-auto p-6">
          {activeTab === 'routes' && <RoutesTab />}
          {activeTab === 'compare' && <CompareTab />}
          {activeTab === 'banking' && <BankingTab />}
          {activeTab === 'pooling' && <PoolingTab />}
        </div>
      </main>

      <ToastContainer />
    </div>
  );
}
