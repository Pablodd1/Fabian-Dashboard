
import React, { useState, useRef } from 'react';
/* Added Database icon to the import list to fix the compilation error on line 191 */
import { Upload, Mic, File as FileIcon, X, Plus, Image as ImageIcon, Loader2, FileAudio, Edit2, Check, Maximize2, Activity as ActivityIcon, ScanEye, Trash2, Play, Info, Database } from 'lucide-react';
import { PatientData, FileRecord, ImageRecord, AudioRecord } from '../types.ts';
import { transcribeAudio } from '../services/geminiService.ts';
import { DicomViewer } from './DicomViewer.tsx';

interface IngestionPanelProps {
  patient: PatientData;
  onUpdatePatient: (data: Partial<PatientData>) => void;
  onAnalyze: () => void;
  isAnalyzing: boolean;
}

type TranscriptionStatus = 'idle' | 'loading' | 'error' | 'success';

export const IngestionPanel: React.FC<IngestionPanelProps> = ({ patient, onUpdatePatient, onAnalyze, isAnalyzing }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptionStatuses, setTranscriptionStatuses] = useState<Record<string, TranscriptionStatus>>({});
  const [activeDicom, setActiveDicom] = useState<{ name: string; url: string; content?: string } | null>(null);
  const [selectedImage, setSelectedImage] = useState<ImageRecord | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  
  const setStatus = (id: string, status: TranscriptionStatus) => {
    setTranscriptionStatuses(prev => ({ ...prev, [id]: status }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles: FileRecord[] = [];
      const newImages: ImageRecord[] = [];
      
      for (let i = 0; i < e.target.files.length; i++) {
        const file = e.target.files[i];
        const isDicom = file.name.toLowerCase().endsWith('.dcm');
        
        if (file.type.startsWith('image/') || isDicom) {
          newImages.push({
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            url: URL.createObjectURL(file),
            originalFile: file,
            mimeType: isDicom ? 'application/dicom' : file.type
          });
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
      onUpdatePatient({ 
        files: [...patient.files, ...newFiles],
        images: [...patient.images, ...newImages]
      });
      // Reset input
      e.target.value = '';
    }
  };

  const removeImage = (id: string) => {
    onUpdatePatient({ images: patient.images.filter(img => img.id !== id) });
  };

  const removeAudio = (id: string) => {
    onUpdatePatient({ audioRecordings: patient.audioRecordings.filter(rec => rec.id !== id) });
  };

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

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-32 animate-in fade-in duration-500">
      
      {activeDicom && <DicomViewer file={activeDicom} onClose={() => setActiveDicom(null)} />}

      {/* Enhanced Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-[110] bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4 lg:p-12" onClick={() => setSelectedImage(null)}>
          <div className="relative w-full h-full flex flex-col items-center justify-center gap-6" onClick={e => e.stopPropagation()}>
            <button 
              onClick={() => setSelectedImage(null)} 
              className="absolute top-0 right-0 p-4 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-10 h-10" />
            </button>
            
            <div className="flex-1 w-full flex items-center justify-center overflow-hidden">
               <img 
                src={selectedImage.url} 
                className="max-w-full max-h-full object-contain rounded-2xl shadow-[0_0_100px_rgba(99,102,241,0.2)] border border-slate-800" 
                alt={selectedImage.name} 
              />
            </div>

            <div className="bg-slate-900/80 border border-slate-800 backdrop-blur px-8 py-6 rounded-3xl w-full max-w-2xl flex items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-2xl border border-indigo-500/20">
                  <ImageIcon className="w-6 h-6 text-indigo-400" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white tracking-tight">{selectedImage.name}</h3>
                  <p className="text-xs text-slate-500 font-mono uppercase tracking-widest mt-1">
                    {selectedImage.mimeType} // ID: {selectedImage.id}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                {selectedImage.mimeType === 'application/dicom' && (
                  <button 
                    onClick={() => { setActiveDicom(selectedImage); setSelectedImage(null); }}
                    className="flex items-center gap-2 px-6 py-3 bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <ScanEye className="w-4 h-4" /> Open DICOM
                  </button>
                )}
                <button 
                  onClick={() => { removeImage(selectedImage.id); setSelectedImage(null); }}
                  className="p-4 bg-red-500/10 text-red-400 rounded-2xl hover:bg-red-500/20 transition-all border border-red-500/20"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-900/40 p-8 rounded-[2.5rem] border border-slate-800/60 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shadow-inner">
            <Database className="w-8 h-8 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-4xl font-black text-white tracking-tighter">Diagnostic Hub</h2>
            <p className="text-slate-400 mt-1 uppercase text-[10px] font-black tracking-[0.3em] flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
              Synchronizing Case: {patient.codeName}
            </p>
          </div>
        </div>
        <button
          onClick={onAnalyze}
          disabled={isAnalyzing}
          className="group relative bg-gradient-to-br from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white px-12 py-6 rounded-3xl font-black text-lg shadow-[0_20px_50px_-15px_rgba(79,70,229,0.5)] transition-all disabled:opacity-50 flex items-center gap-4 overflow-hidden"
        >
          {isAnalyzing ? <Loader2 className="w-6 h-6 animate-spin" /> : <ActivityIcon className="w-6 h-6 group-hover:scale-125 transition-transform" />}
          <span className="relative z-10">{isAnalyzing ? "Reasoning..." : "Execute Analysis"}</span>
          <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform"></div>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Upload & Narrative */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-slate-900/60 border-2 border-dashed border-slate-800 rounded-[2.5rem] p-10 transition-all hover:border-indigo-500/50 hover:bg-slate-900/80 group">
            <label className="flex flex-col items-center justify-center cursor-pointer space-y-6">
              <div className="w-20 h-20 rounded-full bg-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform shadow-2xl border border-slate-800 group-hover:border-indigo-500/30">
                <Upload className="w-10 h-10 text-indigo-400" />
              </div>
              <div className="text-center">
                <h3 className="text-xl font-black text-slate-100 tracking-tight">Stage Assets</h3>
                <p className="text-sm text-slate-500 mt-2 font-medium">Drop MRI, Bloodwork, or DNA raw data</p>
              </div>
              <input type="file" multiple onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div className="bg-slate-900/60 rounded-[2.5rem] p-8 border border-slate-800/60 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-white text-lg flex items-center gap-3">
                <Edit2 className="w-5 h-5 text-indigo-400" /> Clinical Vault
              </h3>
            </div>
            <textarea
              value={patient.notes}
              onChange={(e) => onUpdatePatient({ notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-2xl px-6 py-5 text-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/50 min-h-[220px] transition-all placeholder:text-slate-700"
              placeholder="Inject clinical observations, symptom clusters, or medical history..."
            />
          </div>

          <button
            onClick={toggleRecording}
            className={`w-full flex items-center justify-center gap-4 py-8 rounded-[2rem] font-black text-xl transition-all border-2 ${
              isRecording 
                ? 'bg-red-500/20 border-red-500 text-red-500 shadow-[0_0_30px_rgba(239,68,68,0.2)] animate-pulse' 
                : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:border-indigo-500/50 hover:text-indigo-400'
            }`}
          >
            <Mic className={`w-8 h-8 ${isRecording ? 'fill-red-500' : ''}`} />
            {isRecording ? "Listening..." : "Clinical Dictation"}
          </button>
        </div>

        {/* Right Column: Ingested Assets Display */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Images Grid */}
          <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60 min-h-[300px]">
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4">
                <ImageIcon className="w-7 h-7 text-indigo-400" /> Neural Imagery
              </h3>
              <span className="px-4 py-1.5 bg-slate-800/50 rounded-xl text-[10px] font-black text-slate-500 uppercase tracking-widest border border-slate-700/50">
                {patient.images.length} Assets Found
              </span>
            </div>

            {patient.images.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-6">
                {patient.images.map((img) => (
                  <div 
                    key={img.id} 
                    className="group relative aspect-square bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden cursor-pointer hover:border-indigo-500/50 transition-all hover:scale-105 shadow-xl"
                    onClick={() => setSelectedImage(img)}
                  >
                    <img src={img.url} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" alt={img.name} />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <div className="absolute bottom-4 left-4 right-4">
                      <p className="text-[10px] font-black text-white truncate drop-shadow-lg">{img.name}</p>
                    </div>
                    {img.mimeType === 'application/dicom' && (
                      <div className="absolute top-3 left-3 px-2 py-0.5 bg-indigo-500 text-[8px] font-black text-white rounded uppercase tracking-tighter shadow-lg">DICOM</div>
                    )}
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
                <p className="font-bold text-xs uppercase tracking-widest opacity-40">Awaiting Imaging Data</p>
              </div>
            )}
          </div>

          {/* Audio Recordings List */}
          {patient.audioRecordings.length > 0 && (
            <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60">
              <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-8">
                <FileAudio className="w-7 h-7 text-indigo-400" /> Voice Transcripts
              </h3>
              <div className="space-y-4">
                {patient.audioRecordings.map((rec) => (
                  <div key={rec.id} className="bg-slate-950/60 border border-slate-800 rounded-3xl p-6 flex flex-col gap-4 group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-indigo-500/10 rounded-2xl">
                          <Mic className="w-5 h-5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm tracking-tight">Clinical Recording // {rec.id.slice(0,6)}</p>
                          <p className="text-[10px] text-slate-500 font-mono uppercase tracking-widest mt-0.5">Mime: Audio/WebM</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <audio src={rec.url} controls className="h-8 w-40 opacity-50 hover:opacity-100 transition-opacity" />
                        <button 
                          onClick={() => removeAudio(rec.id)}
                          className="p-3 text-slate-600 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                    
                    {rec.transcription ? (
                      <div className="bg-slate-900/80 p-5 rounded-2xl border border-slate-800 text-sm text-slate-300 italic leading-relaxed">
                        <span className="text-indigo-400 font-black text-[10px] uppercase block mb-2 tracking-widest">AI Result:</span>
                        "{rec.transcription}"
                      </div>
                    ) : (
                      <button
                        onClick={() => handleTranscribe(rec.id, rec.blob)}
                        disabled={transcriptionStatuses[rec.id] === 'loading'}
                        className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 text-indigo-400 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {transcriptionStatuses[rec.id] === 'loading' ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Transcribing Bio-Node...
                          </>
                        ) : (
                          <>
                            <ScanEye className="w-4 h-4" />
                            Run Voice Analysis
                          </>
                        )}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Files List */}
          {patient.files.length > 0 && (
            <div className="bg-slate-900/40 rounded-[2.5rem] p-8 border border-slate-800/60">
               <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-4 mb-8">
                <FileIcon className="w-7 h-7 text-indigo-400" /> Lab Metadata
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {patient.files.map((file) => (
                  <div key={file.id} className="bg-slate-950 p-5 rounded-3xl border border-slate-800 flex items-center justify-between group hover:border-indigo-500/40 transition-all">
                    <div className="flex items-center gap-4 overflow-hidden">
                      <div className="p-3 bg-slate-900 rounded-2xl border border-slate-800 group-hover:bg-indigo-500/10 group-hover:border-indigo-500/20 transition-all">
                        <FileIcon className="w-5 h-5 text-slate-500 group-hover:text-indigo-400" />
                      </div>
                      <div className="overflow-hidden">
                        <p className="text-slate-100 font-bold text-sm truncate">{file.name}</p>
                        <p className="text-[10px] text-slate-600 font-mono tracking-tighter uppercase">{file.type || 'Generic Document'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button className="p-2 text-slate-700 hover:text-slate-300 transition-colors">
                        <Info className="w-4 h-4" />
                      </button>
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
