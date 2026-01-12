import React from 'react';
import { AnalysisResult } from '../types';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { Beaker, Brain, Heart, ClipboardList, AlertCircle, Play, ScanEye, AlertTriangle, Pill, FileQuestion, TestTube, RefreshCw, Loader2 } from 'lucide-react';

interface AnalysisReportProps {
  data: AnalysisResult | null;
  onRetry?: () => void;
  isAnalyzing?: boolean;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ data, onRetry, isAnalyzing }) => {
  if (!data) return <div className="text-center text-slate-500 mt-20">No analysis generated yet.</div>;

  const chartData = [
    { name: 'Longevity', uv: data.longevityScore, fill: '#10b981' },
    { name: 'Brain Power', uv: data.brainPowerScore, fill: '#818cf8' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Top Summary Card */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -mr-16 -mt-16 pointer-events-none"></div>
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-bold text-white tracking-tight">Executive Health Summary</h2>
              {onRetry && (
                <button
                  onClick={onRetry}
                  disabled={isAnalyzing}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isAnalyzing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4" />
                  )}
                  {isAnalyzing ? "Recalculating..." : "Retry Analysis"}
                </button>
              )}
            </div>
            <p className="text-slate-400 leading-relaxed text-lg">{data.summary}</p>
            
            <div className="pt-4">
              <h4 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Potential Root Causes
              </h4>
              <div className="flex flex-wrap gap-2">
                {data.rootCause.map((cause, idx) => (
                  <span key={idx} className="px-3 py-1 bg-red-500/10 border border-red-500/20 text-red-200 rounded-full text-sm">
                    {cause}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <div className="h-64 relative">
             <ResponsiveContainer width="100%" height="100%">
              <RadialBarChart innerRadius="30%" outerRadius="100%" data={chartData} startAngle={180} endAngle={0} cy="70%">
                <RadialBar
                  label={{ position: 'insideStart', fill: '#fff' }}
                  background
                  dataKey="uv"
                />
                <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{top: 0, left: 0}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </RadialBarChart>
            </ResponsiveContainer>
            <div className="absolute bottom-0 left-0 right-0 text-center text-slate-500 text-xs">
              AI-Generated Health Scores (0-100)
            </div>
          </div>
        </div>
      </div>

      {/* GAP ANALYSIS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Missing Labs */}
        <div className="bg-orange-950/20 border border-orange-500/30 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4 text-orange-400">
             <TestTube className="w-6 h-6" />
             <h3 className="text-xl font-bold">Missing Blood Panels (Red Flags)</h3>
           </div>
           <div className="space-y-3">
             {data.missingLabs?.length > 0 ? (
               data.missingLabs.map((flag, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 flex-shrink-0" />
                   <p className="text-orange-200/80 text-sm">{flag}</p>
                 </div>
               ))
             ) : (
               <p className="text-slate-500 italic text-sm">No critical lab gaps identified.</p>
             )}
           </div>
        </div>

        {/* Discovery Questions */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4 text-indigo-400">
             <FileQuestion className="w-6 h-6" />
             <h3 className="text-xl font-bold">Deep Dive Discovery Questions</h3>
           </div>
           <div className="space-y-3">
             {data.discoveryQuestions?.length > 0 ? (
               data.discoveryQuestions.map((q, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-2 flex-shrink-0" />
                   <p className="text-slate-300 text-sm">{q}</p>
                 </div>
               ))
             ) : (
               <p className="text-slate-500 italic text-sm">No further history questions needed.</p>
             )}
           </div>
        </div>
      </div>

      {/* PHARMACOLOGY ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Nutrient Depletions (Negative) */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4 text-pink-400">
             <AlertTriangle className="w-6 h-6" />
             <h3 className="text-xl font-bold">Drug-Induced Nutrient Depletions</h3>
           </div>
           <div className="space-y-3">
             {data.nutrientDepletions?.length > 0 ? (
               data.nutrientDepletions.map((item, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-pink-500 mt-2 flex-shrink-0" />
                   <p className="text-slate-300 text-sm">{item}</p>
                 </div>
               ))
             ) : (
               <p className="text-slate-500 italic text-sm">No significant depletions detected.</p>
             )}
           </div>
        </div>

        {/* Therapeutic Synergies (Positive) */}
         <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
           <div className="flex items-center gap-3 mb-4 text-emerald-400">
             <Pill className="w-6 h-6" />
             <h3 className="text-xl font-bold">Therapeutic Synergies</h3>
           </div>
           <div className="space-y-3">
             {data.therapeuticSynergies?.length > 0 ? (
               data.therapeuticSynergies.map((item, idx) => (
                 <div key={idx} className="flex items-start gap-3">
                   <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-2 flex-shrink-0" />
                   <p className="text-slate-300 text-sm">{item}</p>
                 </div>
               ))
             ) : (
               <p className="text-slate-500 italic text-sm">No specific synergies noted.</p>
             )}
           </div>
        </div>
      </div>

      {/* Imaging Findings Section */}
      {data.imagingFindings && data.imagingFindings.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <ScanEye className="w-6 h-6 text-sky-400" />
            <h3 className="text-xl font-bold text-white">Medical Imaging Analysis</h3>
          </div>
          <div className="grid gap-3">
            {data.imagingFindings.map((finding, idx) => (
              <div key={idx} className="bg-slate-900 p-4 rounded-lg border border-slate-800 flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-2 flex-shrink-0" />
                <p className="text-slate-300">{finding}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Peptide Protocol */}
        <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
          <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
            <Beaker className="w-6 h-6 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Recommended Protocols</h3>
          </div>
          <div className="p-6 space-y-4">
            {data.peptideProtocol.map((peptide, idx) => (
              <div key={idx} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="text-lg font-semibold text-purple-300">{peptide.name}</h4>
                  <span className="text-xs bg-purple-500/20 text-purple-200 px-2 py-0.5 rounded border border-purple-500/20">
                    {peptide.dosage}
                  </span>
                </div>
                <p className="text-sm text-slate-400 mb-2">{peptide.mechanism}</p>
                {peptide.expectedOutcome && (
                  <div className="text-xs text-purple-300/80 bg-purple-500/5 p-2 rounded border border-purple-500/10 flex gap-2">
                    <span className="font-semibold">Outcome:</span>
                    {peptide.expectedOutcome}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Labs & Lifestyle */}
        <div className="space-y-8">
          
          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
            <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
              <ClipboardList className="w-6 h-6 text-blue-400" />
              <h3 className="text-xl font-bold text-white">Lab Order Generator</h3>
            </div>
            <div className="divide-y divide-slate-700">
              {data.labOrders.map((lab, idx) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-slate-700/30 transition-colors">
                  <div>
                    <div className="font-medium text-slate-200">{lab.testName}</div>
                    <div className="text-xs text-slate-500 mt-0.5">{lab.reason}</div>
                  </div>
                  <div className="text-sm font-mono text-blue-300 bg-blue-500/10 px-2 py-1 rounded">
                    {lab.cptCode}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden">
             <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
              <Heart className="w-6 h-6 text-emerald-400" />
              <h3 className="text-xl font-bold text-white">Lifestyle Hacks</h3>
            </div>
            <ul className="p-6 space-y-3">
              {data.lifestyleRecommendations.map((rec, idx) => (
                <li key={idx} className="flex items-start gap-3 text-slate-300">
                  <Play className="w-4 h-4 text-emerald-500 mt-1 flex-shrink-0 fill-emerald-500/20" />
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};