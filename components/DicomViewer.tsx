import React, { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Move, Contrast, Sun, RotateCw, Grid3X3, Layers, Info, Activity } from 'lucide-react';

interface DicomViewerProps {
  file: { name: string; url: string; content?: string };
  onClose: () => void;
}

// Simulated DICOM metadata extraction
const metadata = {
  modality: "MR",
  studyDate: "2024-05-12",
  seriesDescription: "T2-Weighted Axial",
  sliceThickness: "3.0mm",
  resolution: "512x512",
  bitDepth: "16-bit",
  institution: "Bio-Integrator Virtual Lab"
};

export const DicomViewer: React.FC<DicomViewerProps> = ({ file, onClose }) => {
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [zoom, setZoom] = useState(1);
  const [isAnonymized, setIsAnonymized] = useState(true);

  return (
    <div className="fixed inset-0 z-[100] bg-black flex flex-col font-mono text-xs uppercase tracking-wider text-emerald-500/80">
      {/* Top Bar */}
      <div className="h-12 border-b border-white/10 flex items-center justify-between px-4 bg-zinc-900">
        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5 text-emerald-500 animate-pulse" />
          <span className="font-bold text-white tracking-widest">DICOM_VIEWER // {file.name}</span>
          <div className="h-4 w-px bg-white/20"></div>
          <span className="text-zinc-500">Slice 24/48</span>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-red-500/20 hover:text-red-500 transition-colors rounded-lg">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <div className="w-14 border-r border-white/10 flex flex-col items-center py-4 gap-4 bg-zinc-900/50">
          <ToolbarButton icon={ZoomIn} active onClick={() => setZoom(z => z + 0.1)} />
          <ToolbarButton icon={ZoomOut} onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} />
          <ToolbarButton icon={Move} />
          <div className="w-8 h-px bg-white/10"></div>
          <ToolbarButton icon={Contrast} />
          <ToolbarButton icon={Sun} />
          <ToolbarButton icon={RotateCw} />
          <div className="w-8 h-px bg-white/10"></div>
          <ToolbarButton icon={Grid3X3} />
          <ToolbarButton icon={Layers} />
          <ToolbarButton icon={Info} onClick={() => setIsAnonymized(!isAnonymized)} />
        </div>

        {/* Main Viewport */}
        <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden cursor-crosshair group">
          {/* Viewport Guides */}
          <div className="absolute inset-0 border border-emerald-500/10 pointer-events-none"></div>
          <div className="absolute top-1/2 left-0 right-0 h-px bg-emerald-500/5 pointer-events-none"></div>
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-emerald-500/5 pointer-events-none"></div>
          
          {/* The Image (Simulated DICOM Frame) */}
          <div 
            className="relative transition-all duration-200"
            style={{ 
              transform: `scale(${zoom})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%) grayscale(100%)`
            }}
          >
            {/* If it's a real image, we show it; otherwise a high-tech placeholder */}
            {file.url && !file.name.endsWith('.dcm') ? (
               <img src={file.url} className="max-w-[80vh] border border-white/20 shadow-2xl" alt="Imaging" />
            ) : (
              <div className="w-[500px] h-[500px] bg-zinc-900 border border-white/10 flex items-center justify-center relative overflow-hidden">
                 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-zinc-800 to-transparent opacity-50"></div>
                 <Layers className="w-20 h-20 text-emerald-500/10" />
                 <div className="absolute bottom-4 left-4 text-left">
                   <p>NO PREVIEW FRAGMENT</p>
                   <p className="text-[10px] text-zinc-500">RAW DICOM DATA DETECTED</p>
                 </div>
              </div>
            )}
            
            {/* Crosshair Overlay */}
            <div className="absolute inset-0 pointer-events-none border border-emerald-500/20 group-hover:border-emerald-500/40"></div>
          </div>

          {/* HUD Info Overlays */}
          <div className="absolute top-6 left-6 space-y-1 pointer-events-none">
            <p className="text-white font-bold">{isAnonymized ? "PATIENT_ANONYMIZED" : "CASSANDRA NOVA VANCE"}</p>
            <p>ID: 992-001-B</p>
            <p>DOB: 1986-04-12</p>
            <p className="mt-4 text-emerald-500/50">STUDY: {metadata.seriesDescription}</p>
          </div>

          <div className="absolute bottom-6 left-6 space-y-1 text-zinc-500 pointer-events-none">
            <p>MOD: {metadata.modality}</p>
            <p>THICK: {metadata.sliceThickness}</p>
            <p>RES: {metadata.resolution}</p>
          </div>

          <div className="absolute top-6 right-6 text-right space-y-1 pointer-events-none">
            <p>{metadata.institution}</p>
            <p>{metadata.studyDate}</p>
            <p className="text-white">WW: 400 WL: 40</p>
          </div>

          <div className="absolute bottom-6 right-6 text-right pointer-events-none">
            <p className="text-2xl font-bold text-white">L</p>
            <p className="text-[10px]">AXIAL VIEW</p>
          </div>
        </div>

        {/* Right Sidebar - Histogram/Metadata */}
        <div className="w-64 border-l border-white/10 bg-zinc-900 p-4 flex flex-col gap-6 overflow-y-auto">
          <div>
            <h4 className="text-zinc-400 mb-3 flex items-center gap-2">
              <Sun className="w-3 h-3" /> Image Adjust
            </h4>
            <div className="space-y-4">
               <RangeControl label="Brightness" value={brightness} onChange={setBrightness} min={0} max={200} />
               <RangeControl label="Contrast" value={contrast} onChange={setContrast} min={0} max={200} />
            </div>
          </div>

          <div className="flex-1">
             <h4 className="text-zinc-400 mb-3">Series Metadata</h4>
             <div className="space-y-2 text-[10px] font-mono leading-tight">
               {Object.entries(metadata).map(([k, v]) => (
                 <div key={k} className="flex justify-between border-b border-white/5 pb-1">
                   <span className="text-zinc-500 uppercase">{k}</span>
                   <span className="text-emerald-500">{v}</span>
                 </div>
               ))}
             </div>
          </div>

          <div className="p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg">
             <p className="text-emerald-500 font-bold mb-1">AI INSIGHT</p>
             <p className="text-emerald-500/70 lowercase leading-tight">Searching for T2 hyperintensity markers consistent with reported clinical pain...</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const ToolbarButton = ({ icon: Icon, active, onClick }: { icon: any, active?: boolean, onClick?: () => void }) => (
  <button 
    onClick={onClick}
    className={`p-2.5 rounded-xl transition-all ${active ? 'bg-emerald-500/20 text-emerald-500' : 'text-zinc-500 hover:text-white hover:bg-white/5'}`}
  >
    <Icon className="w-5 h-5" />
  </button>
);

const RangeControl = ({ label, value, onChange, min, max }: { label: string, value: number, onChange: (v: number) => void, min: number, max: number }) => (
  <div className="space-y-1.5">
    <div className="flex justify-between text-[10px]">
      <span className="text-zinc-500">{label}</span>
      <span className="text-emerald-500">{value}%</span>
    </div>
    <input 
      type="range" min={min} max={max} value={value} 
      onChange={(e) => onChange(parseInt(e.target.value))}
      className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
    />
  </div>
);