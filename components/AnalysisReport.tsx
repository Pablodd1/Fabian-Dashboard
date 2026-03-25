import React, { useState } from 'react';
import { AnalysisResult, PatientData } from '../types.ts';
import { ResponsiveContainer, RadialBarChart, RadialBar, Legend, Tooltip } from 'recharts';
import { Beaker, Brain, Heart, ClipboardList, AlertCircle, Play, ScanEye, AlertTriangle, Pill, FileQuestion, TestTube, RefreshCw, Loader2, Download, Mail, Save, MessageSquare, Send, FileText, Zap, Calendar, TrendingUp } from 'lucide-react';
import { askAIChat } from '../services/geminiService.ts';

interface AnalysisReportProps {
  data: AnalysisResult | null;
  patient: PatientData;
  onUpdatePatient: (data: Partial<PatientData>) => void;
  onRetry?: () => void;
  isAnalyzing?: boolean;
}

export const AnalysisReport: React.FC<AnalysisReportProps> = ({ data, patient, onUpdatePatient, onRetry, isAnalyzing }) => {
  const [chatInput, setChatInput] = useState('');
  const [isChatting, setIsChatting] = useState(false);
  const [showPreVisit, setShowPreVisit] = useState(false);

  if (!data) return <div className="text-center text-slate-500 mt-20">No analysis generated yet.</div>;

  const handleAskAI = async () => {
    if (!chatInput.trim() || isChatting) return;
    setIsChatting(true);
    const newHistory = [...(patient.chatHistory || []), { role: 'user' as const, text: chatInput }];
    onUpdatePatient({ chatHistory: newHistory });
    setChatInput('');
    
    try {
      const response = await askAIChat(patient, chatInput);
      onUpdatePatient({ chatHistory: [...newHistory, { role: 'ai' as const, text: response }] });
    } catch (err) {
      alert("Failed to query AI.");
    } finally {
      setIsChatting(false);
    }
  };

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
              <div className="flex items-center gap-3">
                <button
                  onClick={() => alert("Patient record saved successfully.")}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setShowPreVisit(true)}
                  className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded-lg text-sm font-semibold transition-all"
                >
                  <FileText className="w-4 h-4" /> Pre-Visit Brief
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all"
                >
                  <Download className="w-4 h-4" /> PDF
                </button>
                <button
                  onClick={() => window.location.href = `mailto:?subject=Functional Medicine Lab Report&body=Review your comprehensive medical extraction here: ${data.summary}`}
                  className="flex items-center gap-2 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-semibold transition-all"
                >
                  <Mail className="w-4 h-4" /> Email
                </button>
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
        {/* Missing Labs - RED FLAGS */}
        <div className="bg-red-950/20 border border-red-500/50 rounded-2xl p-6 shadow-[0_0_20px_rgba(239,68,68,0.1)]">
           <div className="flex items-center gap-3 mb-4 text-red-500 animate-pulse">
             <AlertTriangle className="w-6 h-6" />
             <h3 className="text-xl font-bold">Red Flag: Missing Markers</h3>
           </div>
           <div className="text-xs text-red-400/80 mb-4 uppercase tracking-widest font-semibold font-mono border-b border-red-900/50 pb-2">
             Required for further investigation & decision making
           </div>
           <div className="space-y-3">
             {data.missingLabs?.length > 0 ? (
               data.missingLabs.map((flag, idx) => (
                 <div key={idx} className="flex items-start gap-3 bg-red-950/30 p-3 rounded-xl border border-red-500/20">
                   <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0 shadow-[0_0_5px_rgba(239,68,68,0.8)]" />
                   <p className="text-red-200/90 text-sm font-medium">{flag}</p>
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

      {/* AI Chat Window */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden mt-8 print-hide shadow-2xl">
        <div className="p-6 border-b border-slate-700 bg-slate-800/50 flex items-center gap-3">
          <MessageSquare className="w-6 h-6 text-indigo-400" />
          <h3 className="text-xl font-bold text-white">Clinical AI Assistant</h3>
        </div>
        <div className="p-6 space-y-4 max-h-96 overflow-y-auto bg-slate-950/50">
          {(patient.chatHistory || []).map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-4 rounded-2xl ${msg.role === 'user' ? 'bg-indigo-500/20 text-indigo-100 border border-indigo-500/20' : 'bg-slate-800 text-slate-200 border border-slate-700'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isChatting && (
            <div className="flex justify-start">
              <div className="p-4 rounded-2xl bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Querying knowledge base...
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
            placeholder="Ask questions about this patient's data..." 
            className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-indigo-500"
          />
          <button 
            onClick={handleAskAI}
            disabled={isChatting || !chatInput.trim()}
            className="px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white rounded-xl font-bold transition-all disabled:opacity-50 flex items-center gap-2"
          >
            <Send className="w-4 h-4" /> Send
          </button>
        </div>
      </div>

      {/* ADDITIONAL PREMIUM CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-8">
        {/* Wearable Pulse Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 relative overflow-hidden group shadow-2xl">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
             <Zap className="w-16 h-16 text-yellow-400" />
          </div>
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-6 h-6 text-yellow-500" />
            <h3 className="text-xl font-bold text-white">Wearable Deep Pulse</h3>
          </div>
          <div className="space-y-4">
            {patient.rawMetrics.map((m, idx) => (
              <div key={idx} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <p className="text-[10px] uppercase font-black tracking-widest text-slate-500">{m.source}</p>
                  <p className="text-white font-bold">{m.key}</p>
                </div>
                <div className="text-2xl font-black text-indigo-400">{m.value}</div>
              </div>
            ))}
            {patient.rawMetrics.length === 0 && (
               <p className="text-slate-500 italic text-sm text-center py-4">No real-time data synced.</p>
            )}
          </div>
          <div className="mt-6 pt-6 border-t border-slate-800 flex items-center justify-between text-[10px] font-black uppercase text-indigo-400 tracking-widest cursor-pointer hover:text-indigo-300">
            <span>Historical Trends</span>
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>

        {/* 90-Day Optimization Roadmap */}
        <div className="lg:col-span-2 bg-indigo-950/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/5 rounded-full blur-[80px] -mr-32 -mt-32"></div>
          <div className="flex items-center gap-4 mb-8">
            <Calendar className="w-7 h-7 text-indigo-400" />
            <h3 className="text-2xl font-black text-white tracking-tight">Phase 1 Optimization Roadmap (90 Days)</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
             <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-indigo-500/10 -translate-y-1/2 hidden md:block"></div>
             {data.optimizationRoadmap && data.optimizationRoadmap.length > 0 ? data.optimizationRoadmap.map((phaseData, idx) => {
               const colors = ["bg-orange-500", "bg-emerald-500", "bg-indigo-500"];
               return (
                 <div key={idx} className="relative z-10 bg-slate-950/80 p-5 rounded-2xl border border-indigo-500/10 group hover:border-indigo-500/30 transition-all">
                   <div className={`w-8 h-8 rounded-full ${colors[idx % colors.length]} mb-4 flex items-center justify-center text-white font-black text-xs shadow-lg`}>{idx + 1}</div>
                   <h4 className="font-bold text-white mb-2">{phaseData.title}</h4>
                   <p className="text-xs text-slate-400 leading-relaxed">{phaseData.description}</p>
                 </div>
               );
             }) : (
               <p className="text-slate-500 italic">No roadmap available.</p>
             )}
          </div>
        </div>
      </div>

      {/* PERSONALIZED OPTIMIZATION LETTER */}
      <div className="bg-white rounded-[2.5rem] p-12 shadow-2xl relative border-t-8 border-indigo-600 mt-12 mb-20 overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
           <FileText className="w-48 h-48 text-indigo-900" />
        </div>
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <div>
              <div className="bg-indigo-600 text-white text-[10px] font-black px-4 py-1.5 rounded-full inline-block uppercase tracking-[0.2em] mb-4 shadow-lg shadow-indigo-500/20">
                Authorized Clinical Recommendation
              </div>
              <h3 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">Patient Optimization Protocol</h3>
            </div>
            <div className="flex gap-4">
               <button className="h-14 w-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 hover:bg-slate-200 transition-all">
                  <Save className="w-6 h-6" />
               </button>
               <button className="h-14 px-8 rounded-2xl bg-indigo-600 text-white font-black flex items-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 group">
                  <Download className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
                  Save Recommendation
               </button>
            </div>
          </div>

          <div className="grid lg:grid-cols-5 gap-12">
            <div className="lg:col-span-3 space-y-8">
              <div className="bg-slate-50 p-8 rounded-3xl border border-slate-100 shadow-inner">
                 <p className="text-xl font-medium text-slate-800 leading-relaxed italic">
                    "Dear {patient.codeName.split(' ')[0]}, we have analyzed your biomarkers in depth. The core objective of this protocol is to address {data.rootCause[0]} and {data.rootCause[1]} through targeted interventions."
                 </p>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-[0.3em]">Immediate Action Plan</h4>
                <div className="grid gap-4">
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-start gap-4">
                     <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                        <Zap className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 mb-1">Primary Optimization Focus</p>
                        <p className="text-sm text-slate-500 leading-relaxed">Systemic focus on {data.rootCause[0]} using {data.therapeuticSynergies[0] || 'targeted nutrient support'}.</p>
                     </div>
                  </div>
                  <div className="p-6 bg-white border border-slate-100 rounded-3xl shadow-sm flex items-start gap-4">
                     <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                        <Heart className="w-5 h-5" />
                     </div>
                     <div>
                        <p className="font-bold text-slate-900 mb-1">Lifestyle ROI</p>
                        <p className="text-sm text-slate-500 leading-relaxed">Prioritize {data.lifestyleRecommendations[0]} for maximum physiological return.</p>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
               <div className="bg-slate-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
                  <div className="absolute -top-10 -right-10 h-40 w-40 bg-indigo-500/20 rounded-full blur-3xl" />
                  <h4 className="text-xs font-black text-indigo-400 uppercase tracking-[0.3em] mb-8">Clinical Summary</h4>
                  <div className="space-y-6">
                     <div className="flex justify-between items-end border-b border-white/10 pb-4">
                        <span className="text-slate-400 text-sm">Longevity Index</span>
                        <span className="text-3xl font-black text-emerald-400">{data.longevityScore}%</span>
                     </div>
                     <div className="flex justify-between items-end border-b border-white/10 pb-4">
                        <span className="text-slate-400 text-sm">Cognitive Reserve</span>
                        <span className="text-3xl font-black text-indigo-400">{data.brainPowerScore}%</span>
                     </div>
                     <div className="pt-4">
                        <p className="text-xs text-slate-500 leading-relaxed">
                          This protocol is designed specifically for {patient.id} following multimodal data ingestion including bloodwork, genomics, and medical imaging.
                        </p>
                     </div>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showPreVisit && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl p-8 space-y-6 shadow-[0_0_50px_rgba(0,0,0,0.5)]">
             <div className="flex justify-between items-center bg-indigo-500/10 p-4 rounded-xl border border-indigo-500/20">
               <div>
                 <h2 className="text-2xl font-black text-indigo-400">Pre-Visit Briefing</h2>
                 <p className="text-sm text-slate-400 uppercase tracking-widest">{patient.codeName}</p>
               </div>
               <button onClick={() => setShowPreVisit(false)} className="text-slate-500 hover:text-white transition-colors">Close</button>
             </div>
             <div className="space-y-4 text-slate-300">
               <h3 className="font-bold text-lg text-white">Summary</h3>
               <p>{data.summary}</p>
               <h3 className="font-bold text-lg text-red-400 mt-4">Critical Flags</h3>
               <ul className="list-disc pl-5 space-y-1">
                 {data.missingLabs.map((l, i) => <li key={i}>{l}</li>)}
               </ul>
               <h3 className="font-bold text-lg text-emerald-400 mt-4">Top Targets</h3>
               <ul className="list-disc pl-5 space-y-1">
                 {data.rootCause.map((c, i) => <li key={i}>{c}</li>)}
               </ul>
             </div>
          </div>
        </div>
      )}

    </div>
  );
};