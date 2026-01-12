import React, { useState, useRef } from 'react';
import { Upload, Mic, File as FileIcon, X, Plus, Image as ImageIcon, MapPin, Loader2, FileAudio, Edit2, Check, AlertCircle, RefreshCw, FileText } from 'lucide-react';
import { PatientData, FileRecord, ImageRecord, AudioRecord, MetricRecord } from '../types';
import { transcribeAudio } from '../services/geminiService';

interface IngestionPanelProps {
  patient: PatientData;
  onUpdatePatient: (data: Partial<PatientData>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

type TranscriptionStatus = 'idle' | 'loading' | 'error' | 'success';

export const IngestionPanel: React.FC<IngestionPanelProps> = ({ patient, onUpdatePatient, onAnalyze, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [transcriptionStatuses, setTranscriptionStatuses] = useState<Record<string, TranscriptionStatus>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const setStatus = (id: string, status: TranscriptionStatus) => {
    setTranscriptionStatuses(prev => ({ ...prev, [id]: status }));
  };

  // File Upload Handlers
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileRecord[] = [];
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        if (file.type.startsWith('image/')) {
           const reader = new FileReader();
           reader.onload = (ev) => {
             const base64 = ev.target?.result as string;
             onUpdatePatient({
               images: [...patient.images, {
                 id: Math.random().toString(36).substr(2, 9),
                 name: file.name,
                 url: URL.createObjectURL(file),
                 base64,
                 mimeType: file.type
               }]
             });
           };
           reader.readAsDataURL(file);
        } else {
          const text = await file.text().catch(() => "Binary content (PDF/Doc) placeholder");
          newFiles.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            type: file.type,
            content: text
          });
        }
      }
      if (newFiles.length > 0) {
        onUpdatePatient({ files: [...patient.files, ...newFiles] });
      }
    }
  };

  // Audio Recording
  const toggleRecording = async () => {
    if (isRecording) {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: BlobPart[] = [];
        
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const newId = Math.random().toString(36).substr(2, 9);
          onUpdatePatient({
            audioRecordings: [...patient.audioRecordings, {
              id: newId,
              blob,
              url,
              transcription: "" 
            }]
          });
          stream.getTracks().forEach(track => track.stop());
        };
        
        recorder.start();
        mediaRecorderRef.current = recorder;
        setIsRecording(true);
      } catch (err) {
        alert("Microphone access denied or not available.");
      }
    }
  };

  const handleTranscribe = async (audioId: string, blob: Blob) => {
    setStatus(audioId, 'loading');
    try {
      const text = await transcribeAudio(blob);
      const updatedRecordings = patient.audioRecordings.map(rec => 
        rec.id === audioId ? { ...rec, transcription: text } : rec
      );
      onUpdatePatient({ audioRecordings: updatedRecordings });
      setStatus(audioId, 'success');
    } catch (error) {
      console.error("Transcription error", error);
      setStatus(audioId, 'error');
    }
  };

  const handleUpdateTranscription = (id: string, newText: string) => {
    const updatedRecordings = patient.audioRecordings.map(rec => 
      rec.id === id ? { ...rec, transcription: newText } : rec
    );
    onUpdatePatient({ audioRecordings: updatedRecordings });
  };

  const addMetric = () => {
    const key = prompt("Metric Name (e.g. HRV, Vitamin D):");
    const val = prompt("Value:");
    if (key && val) {
      onUpdatePatient({
        rawMetrics: [...patient.rawMetrics, {
          source: 'Manual',
          key,
          value: val
        }]
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white">Data Ingestion</h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-sm font-mono border border-indigo-500/30">
              ID: {patient.codeName}
            </span>
            <span className="text-sm">• Active Case Staging</span>
          </p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              AI Thinking...
            </>
          ) : (
            <>
              Run Deep Analysis
              <ActivityIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Drop Zone */}
        <div className="bg-slate-800/50 border-2 border-dashed border-slate-700 rounded-2xl p-8 transition-all hover:border-indigo-500/50 hover:bg-slate-800 group">
          <label className="flex flex-col items-center justify-center h-full cursor-pointer">
            <div className="w-16 h-16 rounded-full bg-slate-900 flex items-center justify-center mb-4 shadow-inner group-hover:bg-indigo-900/20 group-hover:scale-110 transition-all">
              <Upload className="w-8 h-8 text-indigo-400" />
            </div>
            <h3 className="text-xl font-semibold text-slate-200">Upload Patient Assets</h3>
            <p className="text-slate-500 text-center mt-2 max-w-sm">
              Upload clinical documentation, lab PDFs, imaging (DICOM/JPG), or genetic data.
            </p>
            <input 
              type="file" 
              multiple 
              onChange={handleFileUpload} 
              className="hidden" 
              accept=".pdf,.txt,.csv,.jpg,.jpeg,.png,.dcm"
            />
          </label>
        </div>

        {/* Live Capture & Notes */}
        <div className="space-y-6">
          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Clinical Narrative & Notes
              </h3>
              <button 
                onClick={() => setIsEditingNotes(!isEditingNotes)}
                className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-semibold"
              >
                {isEditingNotes ? <><Check className="w-3 h-3"/> Commit</> : <><Edit2 className="w-3 h-3"/> Edit Notes</>}
              </button>
            </div>
            {isEditingNotes ? (
              <textarea
                value={patient.notes}
                onChange={(e) => onUpdatePatient({ notes: e.target.value })}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[120px] font-mono leading-relaxed"
                placeholder="Enter clinical observations, patient history, or specific concerns..."
              />
            ) : (
              <p className="text-sm text-slate-300 bg-slate-900/30 p-4 rounded-xl border border-slate-700/50 italic leading-relaxed">
                {patient.notes || "No clinical notes provided yet. Click edit to add context."}
              </p>
            )}
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Mic className="w-5 h-5 text-pink-400" />
                Live Consultation Audio
              </h3>
              {isRecording && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><span className="text-red-500 text-xs font-bold uppercase tracking-wider">Recording</span></div>}
            </div>
            <div className="flex gap-4">
              <button
                onClick={toggleRecording}
                className={`flex-1 py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                  isRecording 
                    ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                    : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                }`}
              >
                {isRecording ? "Stop Capture" : "Capture Audio Consultation"}
              </button>
            </div>
          </div>

          <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700 shadow-sm">
            <h3 className="font-semibold text-white flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-emerald-400" />
              Patient Geography
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-tight font-bold">Birth Location</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={patient.location.birth}
                  onChange={(e) => onUpdatePatient({ location: { ...patient.location, birth: e.target.value } })}
                  placeholder="City, Country"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1 uppercase tracking-tight font-bold">Current Residence</label>
                <input 
                  type="text" 
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                  value={patient.location.current}
                  onChange={(e) => onUpdatePatient({ location: { ...patient.location, current: e.target.value } })}
                  placeholder="City, Country"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Uploaded Items List */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
        <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-slate-300">Staged Clinical Evidence</h3>
            <span className="text-[10px] bg-slate-700 px-1.5 py-0.5 rounded text-slate-400 font-mono">
              {patient.files.length + patient.images.length + patient.audioRecordings.length} ITEMS
            </span>
          </div>
          <button onClick={addMetric} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-indigo-400 flex items-center gap-1 border border-slate-700 transition-colors">
            <Plus className="w-3 h-3" /> Add Marker
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {patient.files.length === 0 && patient.audioRecordings.length === 0 && patient.images.length === 0 && (
             <div className="text-center py-12 text-slate-600 italic flex flex-col items-center gap-3">
               <div className="w-12 h-12 rounded-full border-2 border-slate-800 flex items-center justify-center opacity-40">
                 <FileIcon className="w-6 h-6" />
               </div>
               No clinical assets staged yet.
             </div>
          )}

          {patient.files.map(f => (
            <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors border border-slate-800/50">
              <div className="p-2 bg-blue-500/10 rounded-lg"><FileIcon className="w-5 h-5 text-blue-400" /></div>
              <div className="flex-1">
                <div className="text-sm font-medium text-slate-200">{f.name}</div>
                <div className="text-xs text-slate-500 uppercase font-mono tracking-tighter">{f.type || 'Document'}</div>
              </div>
              <button onClick={() => onUpdatePatient({files: patient.files.filter(x => x.id !== f.id)})} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {patient.images.map(img => (
            <div key={img.id} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl hover:bg-slate-800/50 transition-colors border border-slate-800/50">
              <div className="p-2 bg-purple-500/10 rounded-lg"><ImageIcon className="w-5 h-5 text-purple-400" /></div>
              <div className="flex-1 flex items-center gap-3">
                <img src={img.url} className="w-10 h-10 rounded-lg object-cover border border-slate-700" alt="thumbnail" />
                <div>
                  <div className="text-sm font-medium text-slate-200">{img.name}</div>
                  <div className="text-xs text-slate-500 uppercase font-mono tracking-tighter">Diagnostic Imaging</div>
                </div>
              </div>
              <button onClick={() => onUpdatePatient({images: patient.images.filter(x => x.id !== img.id)})} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          {patient.audioRecordings.map(a => {
            const status = transcriptionStatuses[a.id] || 'idle';
            return (
              <div key={a.id} className="flex flex-col gap-3 p-4 bg-slate-800/30 rounded-xl transition-all border border-slate-800/50 hover:border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-pink-500/10 rounded-lg"><Mic className="w-5 h-5 text-pink-400" /></div>
                  <div className="flex-1">
                    <div className="text-sm font-medium text-slate-200">Consultation Recording</div>
                    <audio src={a.url} controls className="h-8 mt-1.5 w-full max-w-sm opacity-90 custom-audio" />
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {status === 'loading' && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold animate-pulse">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Transcribing...
                      </div>
                    )}

                    {status === 'error' && (
                      <button 
                        onClick={() => handleTranscribe(a.id, a.blob)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Retry Transcription
                      </button>
                    )}

                    {!a.transcription && status === 'idle' && (
                      <button 
                        onClick={() => handleTranscribe(a.id, a.blob)}
                        className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-2"
                      >
                        <FileAudio className="w-3 h-3" />
                        Transcribe Now
                      </button>
                    )}

                    {a.transcription && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                        <Check className="w-3 h-3" />
                        Verified
                      </div>
                    )}

                    <button onClick={() => onUpdatePatient({audioRecordings: patient.audioRecordings.filter(x => x.id !== a.id)})} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {status === 'error' && (
                  <div className="ml-11 flex items-center gap-2 text-xs text-red-400/80 bg-red-950/20 p-2 rounded-lg border border-red-500/20">
                    <AlertCircle className="w-3 h-3" />
                    Failed to process audio. Ensure your internet connection is stable and try again.
                  </div>
                )}

                {a.transcription && (
                  <div className="mt-1 ml-11 relative group">
                    {editingId === a.id ? (
                      <div className="space-y-2">
                         <textarea 
                            value={a.transcription}
                            onChange={(e) => handleUpdateTranscription(a.id, e.target.value)}
                            className="w-full bg-slate-950 p-4 rounded-xl border border-indigo-500/50 text-xs font-mono text-slate-300 focus:outline-none min-h-[120px] ring-2 ring-indigo-500/20 shadow-inner"
                            placeholder="Type transcription manually if needed..."
                         />
                         <button 
                           onClick={() => {
                             setEditingId(null);
                             setStatus(a.id, 'success');
                           }}
                           className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 text-xs font-bold transition-all"
                         >
                           <Check className="w-3 h-3" /> Commit Changes
                         </button>
                      </div>
                    ) : (
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 hover:border-indigo-500/30 transition-all relative">
                        <p className="text-xs text-slate-400 font-mono leading-relaxed pr-8">{a.transcription}</p>
                        <button 
                           onClick={() => setEditingId(a.id)}
                           className="absolute top-4 right-4 text-slate-600 hover:text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 hover:bg-indigo-500/10 rounded-lg"
                           title="Refine Transcription"
                         >
                           <Edit2 className="w-3 h-3" />
                         </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}

           {patient.rawMetrics.map((m, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-xl border-l-4 border-emerald-500 hover:bg-slate-800/50 transition-colors">
              <div className="p-2 bg-emerald-500/10 rounded-lg"><ActivityIcon className="w-4 h-4 text-emerald-400" /></div>
              <div className="flex-1 flex gap-4 items-center">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{m.source}</span>
                <span className="text-sm text-slate-300">{m.key}: <span className="text-white font-mono font-bold">{m.value}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);