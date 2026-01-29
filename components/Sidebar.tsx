import React from 'react';
import { AppView } from '../types.ts';
import { FileText, Settings, Activity, Dna, Database } from 'lucide-react';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
}

const navItems = [
  { id: AppView.PATIENT_LIST, icon: Database, label: 'Patient Database' },
  { id: AppView.INGESTION, icon: FileText, label: 'Data Ingestion' },
  { id: AppView.ANALYSIS, icon: Activity, label: 'Analysis Report' },
  { id: AppView.SETTINGS, icon: Settings, label: 'Settings' },
];

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView }) => {
  return (
    <div className="w-20 lg:w-64 flex-shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
      <div className="h-16 flex items-center justify-center lg:justify-start lg:px-6 border-b border-slate-800">
        <Dna className="w-8 h-8 text-indigo-500" />
        <span className="hidden lg:block ml-3 font-bold text-lg tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-cyan-400">
          Bio-Integrator
        </span>
      </div>

      <nav className="flex-1 py-6 space-y-2 px-2">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onChangeView(item.id)}
            className={`w-full flex items-center p-3 rounded-xl transition-all group ${
              currentView === item.id
                ? 'bg-indigo-500/10 text-indigo-400 shadow-sm shadow-indigo-900/20'
                : 'text-slate-500 hover:bg-slate-800 hover:text-slate-300'
            }`}
          >
            <item.icon className={`w-6 h-6 ${currentView === item.id ? 'stroke-2' : 'stroke-1.5'}`} />
            <span className="hidden lg:block ml-3 font-medium">{item.label}</span>
            {currentView === item.id && (
              <div className="ml-auto hidden lg:block w-1.5 h-1.5 rounded-full bg-indigo-400 shadow-[0_0_8px_rgba(129,140,248,0.8)]"></div>
            )}
          </button>
        ))}
      </nav>

      <div className="p-4 border-t border-slate-800">
        <div className="hidden lg:block p-4 rounded-xl bg-slate-800/50 border border-slate-700/50">
          <h4 className="text-xs font-semibold text-slate-400 uppercase">System Status</h4>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
            <span className="text-xs text-slate-300">Engine Online</span>
          </div>
        </div>
      </div>
    </div>
  );
};