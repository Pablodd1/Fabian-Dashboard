import React, { useState } from 'react';
import { X, UserPlus, Fingerprint, MapPin, Activity, ShieldCheck, ChevronRight } from 'lucide-react';
import { PatientData } from '../types.ts';

interface RegistrationModalProps {
  onClose: () => void;
  onConfirm: (data: Partial<PatientData>) => void;
}

export const RegistrationModal: React.FC<RegistrationModalProps> = ({ onClose, onConfirm }) => {
  const [formData, setFormData] = useState({
    codeName: '',
    age: '30',
    gender: 'Other',
    birthLocation: '',
    currentLocation: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      codeName: formData.codeName || 'Unnamed Subject',
      age: parseInt(formData.age),
      gender: formData.gender,
      location: {
        birth: formData.birthLocation || 'Unknown',
        current: formData.currentLocation || 'Unknown'
      },
      status: 'Staging',
      notes: '',
      files: [],
      audioRecordings: [],
      images: [],
      rawMetrics: []
    });
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4 lg:p-8">
      <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={onClose}></div>
      
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-800 rounded-[3rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.7)] overflow-hidden animate-in zoom-in-95 fade-in duration-300">
        {/* Modal Header */}
        <div className="bg-slate-950/50 p-8 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20">
              <UserPlus className="w-7 h-7 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none">Register New Case</h2>
              <p className="text-[10px] uppercase font-black tracking-[0.3em] text-slate-500 mt-2 flex items-center gap-2">
                <Fingerprint className="w-3 h-3" />
                Initializing Neural Registry
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white transition-colors">
            <X className="w-7 h-7" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          <div className="space-y-6">
            <div className="group">
              <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Clinical Alias / Code Name</label>
              <div className="relative">
                <input
                  autoFocus
                  required
                  type="text"
                  placeholder="e.g. Project Phoenix"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white text-lg font-bold placeholder:text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
                  value={formData.codeName}
                  onChange={e => setFormData({ ...formData, codeName: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Age</label>
                <input
                  required
                  type="number"
                  min="0"
                  max="120"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
                  value={formData.age}
                  onChange={e => setFormData({ ...formData, age: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Clinical Gender</label>
                <select
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-white font-bold focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all appearance-none"
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other / Non-Binary</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Origin (Birth Location)</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="City, Country"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-800"
                    value={formData.birthLocation}
                    onChange={e => setFormData({ ...formData, birthLocation: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-3 ml-1">Current Residence</label>
                <div className="relative">
                  <MapPin className="absolute left-5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-600" />
                  <input
                    type="text"
                    placeholder="Current City"
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-12 pr-6 py-5 text-white font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all placeholder:text-slate-800"
                    value={formData.currentLocation}
                    onChange={e => setFormData({ ...formData, currentLocation: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              className="w-full bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white py-6 rounded-[1.5rem] font-black text-xl shadow-[0_20px_40px_-10px_rgba(79,70,229,0.5)] transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-4"
            >
              <Activity className="w-6 h-6" />
              Initialize Clinical Node
              <ChevronRight className="w-6 h-6" />
            </button>
            <p className="text-[10px] text-center text-slate-600 mt-6 font-bold uppercase tracking-widest flex items-center justify-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" />
              Secure Biometric Staging Active
            </p>
          </div>
        </form>
      </div>
    </div>
  );
};