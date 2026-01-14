import React from 'react';
import { PatientData, AppView } from '../types.ts';
import { ChevronRight, Activity, Clock, CheckCircle2, Plus, Users, ShieldAlert, Database } from 'lucide-react';

interface PatientListProps {
  patients: PatientData[];
  onSelectPatient: (id: string, view: AppView) => void;
  onAddPatient: () => void;
}

export const PatientList: React.FC<PatientListProps> = ({ patients, onSelectPatient, onAddPatient }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-6 duration-700">
      {/* High-Impact Hero Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900/60 p-10 rounded-[2.5rem] border border-slate-800 shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-32 -mt-32 transition-all group-hover:bg-indigo-600/10"></div>
        
        <div className="relative z-10 flex items-start gap-6">
          <div className="p-5 bg-indigo-500/10 rounded-3xl border border-indigo-500/20 shadow-xl shadow-indigo-500/5">
            <Users className="w-10 h-10 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tight flex items-center gap-3">
              Patient Database
              <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20 uppercase tracking-tighter">Verified</span>
            </h2>
            <p className="text-slate-400 mt-3 text-lg max-w-lg leading-relaxed">
              Global clinical registry for <span className="text-indigo-300 font-semibold">Bio-Integrative Intelligence</span>. Manage multi-modal assets and trigger diagnostic protocols.
            </p>
          </div>
        </div>

        {/* HIGH-PROMINENCE ACTION BUTTON */}
        <button
          onClick={onAddPatient}
          className="group relative flex items-center justify-center gap-5 bg-gradient-to-br from-indigo-500 via-indigo-600 to-violet-700 hover:from-indigo-400 hover:to-violet-600 text-white px-14 py-8 rounded-[2rem] font-black text-2xl shadow-[0_20px_60px_-15px_rgba(79,70,229,0.6)] transition-all hover:-translate-y-2 active:scale-95 active:translate-y-0 prominent-btn-glow shrink-0 border border-white/10"
        >
          <div className="bg-white/20 p-3 rounded-2xl group-hover:rotate-180 transition-transform duration-500 shadow-inner">
            <Plus className="w-9 h-9" strokeWidth={4} />
          </div>
          <div className="flex flex-col items-start">
            <span className="tracking-tighter leading-none">Register Case</span>
            <span className="text-[10px] uppercase tracking-[0.4em] opacity-60 font-black mt-2 text-left">New Protocol</span>
          </div>
          <div className="absolute inset-0 rounded-[2rem] bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        </button>
      </div>

      {/* Database Table Section */}
      <div className="bg-slate-900/40 backdrop-blur-3xl border border-slate-800/60 rounded-[3rem] overflow-hidden shadow-[0_30px_100px_-20px_rgba(0,0,0,0.5)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/60">
                <th className="px-12 py-7 text-xs font-black text-slate-500 uppercase tracking-[0.25em]">Clinical Profile</th>
                <th className="px-12 py-7 text-xs font-black text-slate-500 uppercase tracking-[0.25em]">AI State</th>
                <th className="px-12 py-7 text-xs font-black text-slate-500 uppercase tracking-[0.25em]">Demographics</th>
                <th className="px-12 py-7 text-xs font-black text-slate-500 uppercase tracking-[0.25em]">Assets</th>
                <th className="px-12 py-7 text-xs font-black text-slate-500 uppercase tracking-[0.25em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40">
              {patients.map((p) => (
                <tr key={p.id} className="hover:bg-indigo-500/[0.04] transition-all group cursor-default">
                  <td className="px-12 py-8">
                    <div className="flex items-center gap-6">
                      <div className="w-16 h-16 rounded-[1.5rem] bg-slate-800 flex items-center justify-center border border-slate-700 group-hover:border-indigo-500/50 transition-all shadow-inner group-hover:shadow-[0_0_20px_rgba(99,102,241,0.15)]">
                        <span className="text-indigo-400 font-black text-2xl tracking-tighter">{p.codeName[0]}</span>
                      </div>
                      <div>
                        <span className="font-black text-slate-100 text-xl block leading-none mb-1.5">{p.codeName}</span>
                        <span className="text-[11px] text-slate-500 font-mono tracking-[0.2em] uppercase">REG_ID_{p.id.slice(0, 6)}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-12 py-8">
                    {p.status === 'Complete' ? (
                      <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-emerald-500/10 text-emerald-400 text-[11px] font-black border border-emerald-500/20 uppercase tracking-widest w-fit">
                        <CheckCircle2 className="w-4 h-4" /> Finalized
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-2xl bg-indigo-500/10 text-indigo-400 text-[11px] font-black border border-indigo-500/20 uppercase tracking-widest">
                        <Clock className="w-4 h-4" /> {p.status}
                      </span>
                    )}
                  </td>
                  <td className="px-12 py-8">
                    <div className="text-base font-bold text-slate-200">{p.age}y / {p.gender}</div>
                    <div className="text-xs text-slate-500 mt-1.5 font-medium tracking-tight">{p.location.current}</div>
                  </td>
                  <td className="px-12 py-8">
                    <div className="flex gap-2.5">
                      <span className="px-3 py-1 rounded-xl bg-slate-800/50 text-slate-300 text-[10px] font-black border border-slate-700/50 uppercase tracking-widest">
                        {p.images.length + p.files.length} Nodes
                      </span>
                    </div>
                  </td>
                  <td className="px-12 py-8 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <button 
                        onClick={() => onSelectPatient(p.id, AppView.INGESTION)}
                        className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-white px-6 py-3 rounded-2xl border border-slate-800 hover:bg-slate-800 hover:border-slate-700 transition-all active:scale-95"
                      >
                        Ingest
                      </button>
                      <button 
                        onClick={() => onSelectPatient(p.id, AppView.ANALYSIS)}
                        className={`text-[11px] font-black uppercase tracking-[0.2em] px-6 py-3 rounded-2xl border transition-all flex items-center gap-3 active:scale-95 ${
                          p.status === 'Complete' 
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 shadow-lg shadow-emerald-500/5' 
                          : 'bg-indigo-500 text-white border-transparent hover:bg-indigo-400 shadow-[0_10px_30px_-10px_rgba(99,102,241,0.4)]'
                        }`}
                      >
                        {p.status === 'Complete' ? 'Open Report' : 'Analyze'}
                        <ChevronRight className={`w-4 h-4 transition-transform group-hover:translate-x-1`} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-12 py-48 text-center">
                    <div className="flex flex-col items-center gap-6">
                      <div className="p-8 bg-slate-800/50 rounded-[3rem] border border-slate-700/50">
                        <ShieldAlert className="w-20 h-20 text-slate-600" />
                      </div>
                      <div className="space-y-2">
                        <p className="text-2xl font-black text-slate-400">Clinical Vault Empty</p>
                        <p className="text-slate-500 italic max-w-xs mx-auto text-sm leading-relaxed">Initialize the system by registering your first patient case.</p>
                      </div>
                      <button onClick={onAddPatient} className="mt-4 text-indigo-400 font-black uppercase tracking-[0.3em] hover:text-indigo-300 transition-colors text-sm">Initialize Data Node</button>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};