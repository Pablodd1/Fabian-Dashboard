import React, { useState } from 'react';
import { Upload, Activity, Image as ImageIcon, FileText, Trash2, Zap, Timer, Dumbbell, Heart, TrendingUp, Loader2, Database, Info } from 'lucide-react';
import { PatientData, MetricRecord } from '../types.ts';

interface PerformancePanelProps {
  patient: PatientData;
  onUpdatePatient: (data: Partial<PatientData>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

const COMMON_METRICS: { key: string; source: MetricRecord['source']; label: string }[] = [
  { key: 'Recovery', source: 'Whoop', label: 'Whoop Recovery %' },
  { key: 'HRV', source: 'Whoop', label: 'Whoop HRV (ms)' },
  { key: 'Sleep Score', source: 'Whoop', label: 'Whoop Sleep Score' },
  { key: 'Strain', source: 'Whoop', label: 'Whoop Strain' },
  { key: 'Sleep Score', source: 'Oura', label: 'Oura Sleep Score' },
  { key: 'Readiness', source: 'Oura', label: 'Oura Readiness' },
  { key: 'HRV', source: 'Oura', label: 'Oura HRV' },
  { key: 'Resting HR', source: 'Oura', label: 'Oura Resting HR' },
  { key: 'FTP', source: 'Manual', label: 'Functional Threshold Power' },
  { key: 'VO2Max', source: 'Manual', label: 'VO2 Max' },
  { key: 'Threshold Pace', source: 'Manual', label: 'Threshold Pace (min/mi)' },
  { key: 'Max HR', source: 'Manual', label: 'Max Heart Rate' },
];

export const PerformancePanel: React.FC<PerformancePanelProps> = ({ patient, onUpdatePatient, onAnalyze, isAnalyzing }) => {
  const [selectedMetric, setSelectedMetric] = useState(COMMON_METRICS[0]);
  const [metricValue, setMetricValue] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const performanceImages = patient.images.filter(img => 
    img.name.toLowerCase().includes('whoop') ||
    img.name.toLowerCase().includes('garmin') ||
    img.name.toLowerCase().includes('strava') ||
    img.name.toLowerCase().includes('oura') ||
    img.name.toLowerCase().includes('training') ||
    img.name.toLowerCase().includes('fitness') ||
    img.name.toLowerCase().includes('workout')
  );

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    
    const newImages: any[] = [];
    for (let i = 0; i < e.target.files.length; i++) {
      const file = e.target.files[i];
      const reader = new FileReader();
      await new Promise<void>((resolve) => {
        reader.onload = (ev) => {
          const base64 = ev.target?.result as string;
          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: URL.createObjectURL(file),
            base64,
            mimeType: file.type
          });
          resolve();
        };
        reader.readAsDataURL(file);
      });
    }
    
    onUpdatePatient({ images: [...patient.images, ...newImages] });
    e.target.value = '';
  };

  const addMetric = () => {
    if (!metricValue.trim()) return;
    const newMetric: MetricRecord = {
      source: selectedMetric.source,
      key: selectedMetric.key,
      value: parseFloat(metricValue) || metricValue
    };
    
    // Replace if same source+key exists
    const filtered = patient.rawMetrics.filter(m => !(m.source === newMetric.source && m.key === newMetric.key));
    onUpdatePatient({ rawMetrics: [...filtered, newMetric] });
    setMetricValue('');
  };

  const removeMetric = (source: string, key: string) => {
    onUpdatePatient({
      rawMetrics: patient.rawMetrics.filter(m => !(m.source === source && m.key === key))
    });
  };

  const removeImage = (id: string) => {
    onUpdatePatient({ images: patient.images.filter(img => img.id !== id) });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {/* Image Lightbox */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl w-full">
            <button onClick={() => setSelectedImage(null)} className="absolute -top-12 right-0 text-slate-400 hover:text-white">
              Close
            </button>
            <img src={selectedImage} className="w-full rounded-2xl border border-slate-800" />
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-gradient-to-br from-emerald-900/40 to-slate-900/40 p-8 rounded-[2.5rem] border border-emerald-500/20 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20 shadow-inner">
            <Zap className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Performance Hub</h2>
            <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              AI Coaching Engine // {patient.codeName}
            </p>
          </div>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing || (patient.rawMetrics.length === 0 && patient.images.length === 0)}
          className="group relative bg-gradient-to-br from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600 text-white px-12 py-6 rounded-3xl font-black text-lg shadow-[0_20px_50px_-15px_rgba(16,185,129,0.5)] transition-all disabled:opacity-50 flex items-center gap-4 overflow-hidden"
        >
          {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <Activity className="w-6 h-6 group-hover:scale-125 transition-transform" />}
          <span className="relative z-10">{isAnalyzing ? "Building Plan..." : "Generate Plan"}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Upload & Metrics */}
        <div className="lg:col-span-5 space-y-8">
          
          {/* Screenshot Upload */}
          <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-10 transition-all hover:border-emerald-500/50 hover:bg-slate-900/80 group">
            <label className="flex flex-col items-center justify-center cursor-pointer space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl border border-slate-800 group-hover:border-emerald-500/30">
                <Upload className="w-10 h-10 text-emerald-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-100 tracking-tight">Upload Screenshots</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium max-w-[240px]">
                  Whoop, Garmin, Strava, Oura app screenshots. AI will extract all metrics via OCR.
                </p>
              </div>
              <input type="file" multiple accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Manual Metrics */}
          <div className="bg-slate-900/60 rounded-[2.5rem] p-8 border border-slate-800/60 shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <Database className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black text-white text-lg">Manual Metrics</h3>
            </div>
            
            <div className="space-y-4">
              <select
                value={`${selectedMetric.source}-${selectedMetric.key}`}
                onChange={(e) => {
                  const found = COMMON_METRICS.find(m => `${m.source}-${m.key}` === e.target.value);
                  if (found) setSelectedMetric(found);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
              >
                {COMMON_METRICS.map(m => (
                  <option key={`${m.source}-${m.key}`} value={`${m.source}-${m.key}`}>
                    {m.label}
                  </option>
                ))}
              </select>
              
              <div className="flex gap-3">
                <input
                  type="text"
                  value={metricValue}
                  onChange={(e) => setMetricValue(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMetric()}
                  placeholder="Value..."
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  onClick={addMetric}
                  className="px-5 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-xl font-black text-sm transition-all"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Current Metrics List */}
            {patient.rawMetrics.length > 0 && (
              <div className="mt-6 space-y-2">
                {patient.rawMetrics.map((m, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-950/60 p-3 rounded-xl border border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] uppercase font-black text-slate-500">{m.source}</span>
                      <span className="text-sm text-slate-200">{m.key}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-emerald-400 font-bold">{m.value}</span>
                      <button
                        onClick={() => removeMetric(m.source, m.key)}
                        className="p-1.5 text-slate-600 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Quick Tip */}
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-emerald-400 text-sm mb-1">No API? No Problem.</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Simply screenshot your Whoop, Garmin Connect, or Strava app screens and upload them. 
                  Gemini's vision model will extract HRV, recovery scores, sleep data, and workout stats automatically.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Uploaded Assets */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Images Grid */}
          <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60 min-h-[300px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                <ImageIcon className="w-7 h-7 text-emerald-400" /> Wearable Screenshots
              </h3>
              <span className="px-4 py-1.5 bg-slate-800/50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-700/50">
                {patient.images.length} Assets
              </span>
            </div>

            {patient.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-6">
                {patient.images.map((img) => (
                  <div 
                    key={img.id} 
                    className="group relative aspect-square bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden cursor-pointer hover:border-emerald-500/50 transition-all hover:scale-105 shadow-xl"
                    onClick={() => setSelectedImage(img.url)}
                  >
                    <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={img.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black text-white truncate drop-shadow-lg">{img.name}</p>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                      className="absolute top-3 right-3 p-2 bg-slate-900/80 text-red-400 rounded-xl opacity-0 group-hover:opacity-100 hover:bg-red-500 hover:text-white transition-all backdrop-blur"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[200px] border border-slate-800/30 rounded-3xl bg-slate-950/20 text-slate-600">
                <ImageIcon className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-bold text-xs uppercase tracking-widest opacity-40">Awaiting Screenshot Data</p>
              </div>
            )}
          </div>

          {/* Data Source Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/60">
              <Heart className="w-6 h-6 text-rose-400 mb-4" />
              <h4 className="font-bold text-white mb-1">Recovery</h4>
              <p className="text-xs text-slate-500">HRV, resting HR, sleep scores, readiness</p>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/60">
              <TrendingUp className="w-6 h-6 text-sky-400 mb-4" />
              <h4 className="font-bold text-white mb-1">Performance</h4>
              <p className="text-xs text-slate-500">VO2Max, FTP, threshold pace, power zones</p>
            </div>
            <div className="bg-slate-900/40 rounded-2xl p-6 border border-slate-800/60">
              <Dumbbell className="w-6 h-6 text-amber-400 mb-4" />
              <h4 className="font-bold text-white mb-1">Training Load</h4>
              <p className="text-xs text-slate-500">Strain, TSS, weekly volume, workout history</p>
            </div>
          </div>

          {/* File uploads */}
          {patient.files.length > 0 && (
            <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-8">
                <FileText className="w-7 h-7 text-emerald-400" /> Uploaded Files
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.files.map((file) => (
                  <div key={file.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex items-center justify-between">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <FileText className="w-5 h-5 text-slate-500" />
                      <div className="overflow-hidden">
                        <p className="text-slate-100 font-bold text-sm truncate">{file.name}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
