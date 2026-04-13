import React, { useState } from 'react';
import { PerformanceResult, PatientData } from '../types.ts';
import { Zap, Heart, TrendingUp, Timer, Dumbbell, Activity, RefreshCw, Loader2, Save, Download, MessageSquare, Send, Brain, AlertTriangle, ChevronRight, Target, Flame } from 'lucide-react';
import { askPerformanceAI } from '../services/geminiService.ts';

interface PerformanceReportProps {
  data: PerformanceResult | null;
  patient: PatientData;
  onUpdatePatient: (data: Partial<PatientData>) => void;
  onRetry?: () => void;
  isAnalyzing?: boolean;
}

const INTENSITY_COLORS = {
  easy: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  moderate: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  hard: 'bg-rose-500/20 text-rose-400 border-rose-500/30'
};

export const PerformanceReport: React.FC<PerformanceReportProps> = ({ 
  data, 
  patient, 
  onUpdatePatient, 
  onRetry, 
  isAnalyzing 
}) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);

  if (!data) return (
    <div className="text-center text-slate-500 mt-20">
      <Activity className="w-16 h-16 mx-auto mb-4 opacity-20" />
      <p>No performance plan generated yet.</p>
      <p className="text-sm mt-2">Upload screenshots and click "Generate Plan"</p>
    </div>
  );

  const handleAskAI = async () => {
    if (!chatInput.trim() || isChatting) return;
    setIsChatting(true);
    const newHistory = [...(patient.performanceChatHistory || []), { role: 'user' as const, text: chatInput }];
    onUpdatePatient({ performanceChatHistory: newHistory });
    setChatInput('');
    
    try {
      const response = await askPerformanceAI(patient, chatInput);
      onUpdatePatient({ performanceChatHistory: [...newHistory, { role: 'ai' as const, text: response }] });
    } catch (err) {
      alert("Failed to query AI coach.");
    } finally {
      setIsChatting(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-400';
    if (score >= 60) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      
      {/* Top Summary Card */}
      <div className="bg-gradient-to-br from-slate-900 to-emerald-950/20 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
                  <Zap className="w-8 h-8 text-emerald-400" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-white tracking-tight">Performance Analysis</h2>
                  <p className="text-slate-400 text-sm">AI-Generated Training Plan</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button onClick={() => alert("Performance data saved.")} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all">
                  <Save className="w-4 h-4" /> Save
                </button>
                <button onClick={() => window.print()} className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all">
                  <Download className="w-4 h-4" /> PDF
                </button>
                {onRetry && (
                  <button onClick={onRetry} disabled={isAnalyzing} className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50">
                    {isAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                    {isAnalyzing ? "Regenerating..." : "Regenerate"}
                  </button>
                )}
              </div>
            </div>
            
            <p className="text-slate-300 leading-relaxed text-lg">{data.summary}</p>
            
            {/* Athlete Profile */}
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-emerald-400 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain className="w-4 h-4" /> Athlete Profile
              </h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-slate-800 border border-slate-700 text-slate-200 rounded-full text-sm">
                  Current: {data.athleteProfile.currentFitness}
                </span>
                <span className={`px-3 py-1 rounded-full text-sm ${
                  data.athleteProfile.injuryRisk === 'low' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                  data.athleteProfile.injuryRisk === 'medium' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' :
                  'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                }`}>
                  Injury Risk: {data.athleteProfile.injuryRisk}
                </span>
              </div>
            </div>
          </div>

          {/* Key Metrics */}
          <div className="bg-slate-950/50 rounded-2xl p-6 border border-slate-800">
            <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">Key Metrics</h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-400 text-sm">Fitness Level</span>
                <span className={`text-2xl font-black ${getScoreColor(data.keyMetrics.fitness)}`}>{data.keyMetrics.fitness}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full transition-all" style={{ width: `${data.keyMetrics.fitness}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 text-sm">Fatigue</span>
                <span className={`text-xl font-bold ${getScoreColor(100 - data.keyMetrics.fatigueLevel)}`}>{data.keyMetrics.fatigueLevel}%</span>
              </div>
              
              <div className="flex justify-between items-center pt-2">
                <span className="text-slate-400 text-sm">Form</span>
                <span className={`text-xl font-bold ${getScoreColor(data.keyMetrics.form)}`}>{data.keyMetrics.form}%</span>
              </div>
              
              {data.keyMetrics.vo2max && (
                <div className="flex justify-between items-center pt-2 border-t border-slate-800">
                  <span className="text-slate-400 text-sm">VO2 Max</span>
                  <span className="text-emerald-400 font-bold text-lg">{data.keyMetrics.vo2max} ml/kg/min</span>
                </div>
              )}
              
              {data.keyMetrics.threshold && (
                <div className="flex justify-between items-center pt-2">
                  <span className="text-slate-400 text-sm">Threshold</span>
                  <span className="text-emerald-400 font-bold">{data.keyMetrics.threshold}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Strengths & Weaknesses */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 text-emerald-400">
            <TrendingUp className="w-6 h-6" />
            <h3 className="text-xl font-bold">Strengths</h3>
          </div>
          <div className="space-y-3">
            {data.athleteProfile.strengths.map((s, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{s}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-amber-950/10 border border-amber-500/20 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4 text-amber-400">
            <Target className="w-6 h-6" />
            <h3 className="text-xl font-bold">Areas to Improve</h3>
          </div>
          <div className="space-y-3">
            {data.athleteProfile.weaknesses.map((w, idx) => (
              <div key={idx} className="flex items-start gap-3 bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 flex-shrink-0" />
                <p className="text-slate-300 text-sm">{w}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Weekly Training Plan */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 bg-slate-900/50 flex items-center gap-3">
          <Timer className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">Weekly Training Plan</h3>
        </div>
        <div className="divide-y divide-slate-800">
          {data.weeklyPlan.map((day, idx) => (
            <div key={idx} className="p-4 flex items-center gap-4 hover:bg-slate-800/30 transition-colors">
              <div className="w-20 flex-shrink-0">
                <span className="text-xs font-black text-slate-500 uppercase tracking-widest">{day.day}</span>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1">
                  <span className="font-bold text-white">{day.workout}</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider border ${INTENSITY_COLORS[day.intensity]}`}>
                    {day.intensity}
                  </span>
                </div>
                <p className="text-sm text-slate-400">{day.focus} • {day.duration}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </div>
          ))}
        </div>
      </div>

      {/* Training Zones */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <Flame className="w-6 h-6 text-orange-400" />
          <h3 className="text-xl font-bold text-white">Heart Rate Zones</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {Object.entries(data.trainingZones).map(([zone, description], idx) => {
            const colors = [
              'from-gray-600 to-gray-500',
              'from-blue-600 to-blue-500',
              'from-emerald-600 to-emerald-500',
              'from-amber-600 to-amber-500',
              'from-rose-600 to-rose-500'
            ];
            return (
              <div key={zone} className="bg-slate-950 rounded-2xl p-4 border border-slate-800">
                <div className={`w-full h-2 rounded-full bg-gradient-to-r ${colors[idx]} mb-3`}></div>
                <span className="text-xs font-black text-slate-500 uppercase">{zone.toUpperCase()}</span>
                <p className="text-slate-300 text-sm mt-1">{description}</p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recovery & Nutrition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Heart className="w-6 h-6 text-rose-400" />
            <h3 className="text-xl font-bold text-white">Recovery Protocol</h3>
          </div>
          <ul className="space-y-3">
            {data.recoveryProtocol.map((rec, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-2 flex-shrink-0" />
                <span className="text-sm">{rec}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Dumbbell className="w-6 h-6 text-amber-400" />
            <h3 className="text-xl font-bold text-white">Nutrition Tips</h3>
          </div>
          <ul className="space-y-3">
            {data.nutritionTips.map((tip, idx) => (
              <li key={idx} className="flex items-start gap-3 text-slate-300">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400 mt-2 flex-shrink-0" />
                <span className="text-sm">{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Recommendations */}
      <div className="bg-indigo-950/10 border border-indigo-500/20 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4 text-indigo-400">
          <AlertTriangle className="w-6 h-6" />
          <h3 className="text-xl font-bold">Coach's Recommendations</h3>
        </div>
        <div className="space-y-3">
          {data.recommendations.map((rec, idx) => (
            <div key={idx} className="flex items-start gap-3 bg-indigo-500/5 p-4 rounded-xl border border-indigo-500/10">
              <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-bold text-indigo-400">{idx + 1}</span>
              </div>
              <p className="text-slate-300 text-sm">{rec}</p>
            </div>
          ))}
        </div>
      </div>

      {/* AI Coach Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8 shadow-2xl">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-emerald-400" />
          <h3 className="text-xl font-bold text-white">AI Performance Coach</h3>
        </div>
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto bg-slate-950/50">
          {(patient.performanceChatHistory || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-emerald-500/20 text-emerald-100 border border-emerald-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Coach is typing...
              </div>
            </div>
          )}
        </div>
        <div className="p-4 border-t border-slate-700 bg-slate-900 flex gap-4">
          <input 
            type="text" 
            value={chatInput}
            onChange={e => setChatInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAskAI()}
            placeholder="Ask your coach about this week's plan..." 
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500"
          />
          <button 
            onClick={handleAskAI}
            disabled={isChatting || !chatInput.trim()}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

    </div>
  );
};
