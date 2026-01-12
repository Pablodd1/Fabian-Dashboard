import React, { useState, useRef } from 'react';
import { Upload, Mic, File as FileIcon, X, Plus, Image as ImageIcon, MapPin, Loader2, FileAudio, Edit2, Check, AlertCircle, RefreshCw, FileText, ScanEye, Maximize2 } from 'lucide-react';
import { PatientData, FileRecord, ImageRecord, AudioRecord, MetricRecord } from '../types';
import { transcribeAudio } from '../services/geminiService';
import { DicomViewer } from './DicomViewer';

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
  const [activeDicom, setActiveDicom] = useState<{ name: string; url: string; content?: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
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
        const isDicom = file.name.toLowerCase().endsWith('.dcm');
        
        if (file.type.startsWith('image/') || isDicom) {
           const reader = new FileReader();
           reader.onload = (ev) => {
             const base64 = ev.target?.result as string;
             onUpdatePatient({
               images: [...patient.images, {
                 id: Math.random().toString(36).substr(2, 9),
                 name: file.name,
                 url: URL.createObjectURL(file),
                 base64,
                 mimeType: isDicom ? 'application/dicom' : file.type
               }]
             });
           };
           reader.readAsDataURL(file);
        } else {
          const text = await file.text().catch(() => "Binary content placeholder");
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
      
      {activeDicom && <DicomViewer file={activeDicom} onClose={() => setActiveDicom(null)} />}

      {/* Image Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] bg-black/90 backdrop-blur-md flex items-center justify-center p-4" onClick={() => setSelectedImage(null)}>
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center gap-4" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
            >
              <X className="w-8 h-8" />
            </button>
            <img 
              src={selectedImage.url} 
              className="max-w-full max-h-full object-contain rounded-lg border border-slate-700 shadow-2xl" 
              alt={selectedImage.name} 
            />
            <div className="bg-slate-900 px-6 py-3 rounded-full border border-slate-800 text-slate-300 text-sm font-medium">
              {selectedImage.name} • {selectedImage.mimeType}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Data Ingestion</h2>
          <p className="text-slate-400 mt-1 flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-400 text-xs font-mono border border-indigo-500/30">
              ID: {patient.codeName}
            </span>
            <span className="text-sm">• Active Case Staging</span>
          </p>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="group bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3 rounded-xl font-semibold shadow-xl shadow-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Processing Multimodal Data...
            </>
          ) : (
            <>
              Execute Deep Analysis
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
            <h3 className="text-xl font-semibold text-slate-200">Stage Patient Assets</h3>
            <p className="text-slate-500 text-center mt-2 max-w-sm">
              Upload DICOM Imaging, genetic text files, blood work PDFs, or clinical photos.
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
                Clinical Narrative
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
                placeholder="Enter clinical observations..."
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
                Capture Consultation
              </h3>
              {isRecording && <div className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div><span className="text-red-500 text-xs font-bold uppercase tracking-wider">Recording</span></div>}
            </div>
            <button
              onClick={toggleRecording}
              className={`w-full py-4 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 ${
                isRecording 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/50' 
                  : 'bg-slate-700 hover:bg-slate-600 text-slate-200 shadow-lg shadow-black/20'
              }`}
            >
              {isRecording ? "Stop Capture" : "Start Live Consultation Audio"}
            </button>
          </div>
        </div>
      </div>

      {/* Asset Library Grid */}
      <div className="space-y-6">
        {patient.images.length > 0 && (
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
            <h3 className="font-semibold text-white mb-4 flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-purple-400" />
              Imaging Assets
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
              {patient.images.map(img => (
                <div key={img.id} className="relative group aspect-square rounded-xl overflow-hidden border border-slate-800 hover:border-indigo-500/50 transition-all bg-slate-950">
                  <img 
                    src={img.url} 
                    className="w-full h-full object-cover transition-transform group-hover:scale-110" 
                    alt={img.name} 
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center">
                    <p className="text-[10px] text-white font-medium truncate w-full mb-2">{img.name}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setSelectedImage(img)}
                        className="p-2 bg-white/10 hover:bg-white/20 rounded-lg text-white"
                        title="Preview"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      {img.name.toLowerCase().endsWith('.dcm') && (
                        <button 
                          onClick={() => setActiveDicom({ name: img.name, url: img.url })}
                          className="p-2 bg-indigo-500/20 hover:bg-indigo-500/40 rounded-lg text-indigo-400"
                          title="Open DICOM Console"
                        >
                          <ScanEye className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => onUpdatePatient({images: patient.images.filter(x => x.id !== img.id)})}
                        className="p-2 bg-red-500/20 hover:bg-red-500/40 rounded-lg text-red-400"
                        title="Remove"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Other Assets (Files & Audio) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-2xl">
          <div className="p-4 bg-slate-800/50 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-slate-300">Staged Clinical Documents & Audio</h3>
              <span className="text-[10px] bg-indigo-500/10 border border-indigo-500/20 px-1.5 py-0.5 rounded text-indigo-400 font-mono">
                {patient.files.length + patient.audioRecordings.length} ASSETS
              </span>
            </div>
            <button onClick={addMetric} className="text-xs bg-slate-800 hover:bg-slate-700 px-3 py-1 rounded text-emerald-400 flex items-center gap-1 border border-slate-700 transition-colors font-semibold">
              <Plus className="w-3 h-3" /> Add Marker
            </button>
          </div>
          
          <div className="p-4 space-y-3">
            {patient.files.length === 0 && patient.audioRecordings.length === 0 && (
               <div className="text-center py-8 text-slate-600 italic">
                 No documents or recordings staged.
               </div>
            )}

            {patient.files.map(f => (
              <div key={f.id} className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-xl hover:bg-slate-800/40 transition-colors border border-slate-800/50">
                <div className="p-2 bg-blue-500/10 rounded-lg"><FileIcon className="w-5 h-5 text-blue-400" /></div>
                <div className="flex-1">
                  <div className="text-sm font-medium text-slate-200">{f.name}</div>
                  <div className="text-[10px] text-slate-500 uppercase font-mono tracking-tighter">{f.type || 'Clinical Document'}</div>
                </div>
                <button onClick={() => onUpdatePatient({files: patient.files.filter(x => x.id !== f.id)})} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}

            {patient.audioRecordings.map(a => {
              const status = transcriptionStatuses[a.id] || 'idle';
              return (
                <div key={a.id} className="flex flex-col gap-3 p-4 bg-slate-800/20 rounded-xl transition-all border border-slate-800/50 hover:border-slate-700">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-pink-500/10 rounded-lg"><Mic className="w-5 h-5 text-pink-400" /></div>
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-200">Consultation Recording</div>
                      <audio src={a.url} controls className="h-8 mt-1.5 w-full max-w-sm opacity-90" />
                    </div>
                    <div className="flex items-center gap-2">
                      {status === 'loading' && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-bold animate-pulse">
                          <Loader2 className="w-3 h-3 animate-spin" />
                        </div>
                      )}
                      {!a.transcription && status === 'idle' && (
                        <button onClick={() => handleTranscribe(a.id, a.blob)} className="px-4 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20 border border-indigo-500/30 transition-all flex items-center gap-2">
                          <FileAudio className="w-3 h-3" /> Transcribe
                        </button>
                      )}
                      {a.transcription && (
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
                          <Check className="w-3 h-3" />
                        </div>
                      )}
                      <button onClick={() => onUpdatePatient({audioRecordings: patient.audioRecordings.filter(x => x.id !== a.id)})} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  {a.transcription && (
                    <div className="mt-1 ml-11 relative group">
                      <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 relative">
                        <p className="text-xs text-slate-400 font-mono leading-relaxed">{a.transcription}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

             {patient.rawMetrics.map((m, i) => (
              <div key={i} className="flex items-center gap-3 p-3 bg-slate-800/20 rounded-xl border-l-4 border-emerald-500 hover:bg-slate-800/40 transition-colors">
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
    </div>
  );
};

const ActivityIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
  </svg>
);