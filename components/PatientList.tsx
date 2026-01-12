
import React from 'react';
import { PatientData, AppView } from '../types';
import { UserPlus, ChevronRight, Activity, Clock, CheckCircle2, Search } from 'lucide-react';

interface PatientListProps {
  patients: PatientData[];
  onSelectPatient: (id: string, view: AppView) => void;
  onAddPatient: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onAddPatient }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white">Patient Database</h2>
          <p className="text-slate-400">Manage active clinical cases and bio-integrated data.</p>
        </div>
        <button
          onClick={onAddPatient}
          className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20"
        >
          <UserPlus className="w-5 h-5" />
          Add New Patient
        </button>
      </div>

      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-800/30">
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Code Name</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Demographics</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest">Assets</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700">
                        <span className="text-indigo-400 font-bold">{p.codeName[0]}</span>
                      </div>
                      <span className="font-semibold text-slate-200">{p.codeName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {p.status === 'Complete' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3" /> Ready
                      </span>
                    ) : p.status === 'Analyzing' ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20">
                        <Activity className="w-3 h-3 animate-pulse" /> Processing
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-700/50 text-slate-400 text-xs font-bold border border-slate-700">
                        <Clock className="w-3 h-3" /> Staging
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-400">
                    {p.age}y / {p.gender} / {p.location.current}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-1.5">
                      <span className="text-[10px] bg-slate-800 px-1.5 py-0.5 rounded text-slate-400 border border-slate-700">
                        {p.files.length + p.images.length + p.audioRecordings.length} Assets
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => onSelectPatient(p.id, AppView.INGESTION)}
                        className="text-xs font-semibold text-slate-400 hover:text-white px-3 py-1.5 rounded-lg border border-slate-700 hover:bg-slate-700 transition-all"
                      >
                        Edit Assets
                      </button>
                      <button 
                        onClick={() => onSelectPatient(p.id, AppView.ANALYSIS)}
                        className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all flex items-center gap-2 ${
                          p.status === 'Complete' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20' 
                          : 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/20'
                        }`}
                      >
                        {p.status === 'Complete' ? 'View Report' : 'Run Analysis'}
                        <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
