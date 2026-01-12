
import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { IngestionPanel } from './components/IngestionPanel';
import { AnalysisReport } from './components/AnalysisReport';
import { PatientList } from './components/PatientList';
import { AppView, PatientData, AnalysisResult } from './types';
import { analyzePatientData } from './services/geminiService';

// Pre-populated full result for immediate review (Demo Patient)
const DEMO_PATIENT_COMPLETE: PatientData = {
  id: 'demo-1',
  codeName: 'Cassandra Nova Vance',
  age: 38,
  gender: 'Female',
  status: 'Complete',
  location: { birth: 'Berlin, Germany', current: 'Los Angeles, CA' },
  notes: 'High-performing executive with chronic fatigue, evening brain fog, and intermittent joint pain in the mornings. Sleep latency is low but restorative sleep (REM) is insufficient.',
  files: [{ id: 'f1', name: 'DNA_Metabolic_SNP_Report.txt', type: 'text/plain', content: 'MTHFR C677T Heterozygous. COMT Val/Met. VDR Taq polymorphism identified.' }],
  audioRecordings: [],
  images: [{ id: 'i1', name: 'Right_Knee_MRI.jpg', url: 'https://images.unsplash.com/photo-1530243627471-d1f2e96291ba?auto=format&fit=crop&q=80&w=200', base64: 'data:image/jpeg;base64,/', mimeType: 'image/jpeg' }],
  rawMetrics: [
    { source: 'Oura', key: 'Sleep Score', value: 64 },
    { source: 'Oura', key: 'Deep Sleep', value: '42m' },
    { source: 'Whoop', key: 'HRV', value: 28 },
    { source: 'DNA', key: 'Methylation Age', value: 42 }
  ],
  analysisResult: {
    rootCause: ["Chronic HPA-axis dysregulation", "Methylation pathway impairment (MTHFR/COMT synergy)", "Early stage synovial inflammation"],
    brainPowerScore: 72,
    longevityScore: 68,
    imagingFindings: ["Mild effusion in the suprapatellar bursa", "Consistent with early-stage inflammatory response rather than mechanical wear"],
    missingLabs: ["Full Cyrex Array 3/4", "Organic Acids Test (OAT) to assess neurotransmitter metabolites"],
    discoveryQuestions: ["Is the joint pain improved with heat or cold?", "Evaluate mold exposure at current LA residence."],
    nutrientDepletions: ["Low Serum Folate due to MTHFR genotype", "Magnesium deficiency likely causing low HRV"],
    therapeuticSynergies: ["Combination of Methyl-Folate and B12 likely to significantly improve executive function"],
    lifestyleRecommendations: ["Evening infrared sauna for cytokine reduction", "Binaural beats (Alpha/Gamma) during high-output sessions"],
    peptideProtocol: [
      { name: "BPC-157", dosage: "250mcg BID", mechanism: "Angiogenesis and soft tissue repair stimulation", expectedOutcome: "Resolution of knee effusion within 21 days" },
      { name: "Semax", dosage: "2 drops (1%) intranasal", mechanism: "BDNF/NGF upregulation", expectedOutcome: "Elimination of 4 PM brain fog" }
    ],
    labOrders: [
      { testName: "Comprehensive Metabolic Panel", cptCode: "80053", reason: "Baseline liver and kidney filtration" },
      { testName: "Homocysteine", cptCode: "83090", reason: "Assess methylation efficiency" }
    ],
    summary: "Patient presents with a classic mismatch between high cognitive demand and cellular recovery capabilities. Visual evidence of joint inflammation correlates with oxidative stress markers and poor HRV. Focus should be on stabilizing the HPA axis while bypassing enzymatic bottlenecks in the folate cycle.",
    disclaimer: "Educational Prototype Content."
  }
};

const DEMO_PATIENT_STAGING: PatientData = {
  id: 'demo-2',
  codeName: 'Marcus Aurelius Sterling',
  age: 52,
  gender: 'Male',
  status: 'Staging',
  location: { birth: 'London, UK', current: 'New York, NY' },
  notes: 'Former athlete. Experiencing slower recovery times and high fasting glucose (105 mg/dL). Interested in longevity protocols and rapamycin synergy.',
  files: [],
  audioRecordings: [],
  images: [],
  rawMetrics: [
    { source: 'Blood', key: 'HbA1c', value: '5.7%' },
    { source: 'Whoop', key: 'Recovery', value: '45%' }
  ]
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PATIENT_LIST);
  const [patients, setPatients] = useState<PatientData[]>([DEMO_PATIENT_COMPLETE, DEMO_PATIENT_STAGING]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiKeyDetected, setApiKeyDetected] = useState<boolean | null>(null);

  useEffect(() => {
    // Check for API Key presence on load
    setApiKeyDetected(!!process.env.API_KEY);
  }, []);

  const activePatient = patients.find(p => p.id === selectedPatientId) || null;

  const handleUpdatePatient = (data: Partial<PatientData>) => {
    if (!selectedPatientId) return;
    setPatients(prev => prev.map(p => 
      p.id === selectedPatientId ? { ...p, ...data } : p
    ));
  };

  const handleSelectPatient = (id: string, view: AppView) => {
    setSelectedPatientId(id);
    setCurrentView(view);
  };

  const addNewPatient = () => {
    const names = ["Julian Thorne", "Elena Rodriguez", "Silas Vane", "Aria Chen", "Felix Mercer"];
    const randomName = names[Math.floor(Math.random() * names.length)];
    const newId = Math.random().toString(36).substr(2, 9);
    const newPatient: PatientData = {
      id: newId,
      codeName: randomName,
      age: Math.floor(Math.random() * 40) + 20,
      gender: Math.random() > 0.5 ? 'Male' : 'Female',
      status: 'Staging',
      location: { birth: 'Unknown', current: 'Remote' },
      notes: '',
      files: [],
      audioRecordings: [],
      images: [],
      rawMetrics: []
    };
    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatientId(newId);
    setCurrentView(AppView.INGESTION);
  };

  const runAnalysis = async () => {
    if (!activePatient) return;
    setIsAnalyzing(true);
    try {
      // Direct integration with Gemini Service
      const result = await analyzePatientData(activePatient);
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientId 
          ? { ...p, analysisResult: result, status: 'Complete' } 
          : p
      ));
      setCurrentView(AppView.ANALYSIS);
    } catch (error) {
      console.error(error);
      alert("Analysis engine error. Check your API_KEY in Vercel settings.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <Sidebar 
        currentView={currentView} 
        onChangeView={(view) => {
          if (view === AppView.PATIENT_LIST) setSelectedPatientId(null);
          setCurrentView(view);
        }} 
      />

      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 lg:p-10 relative">
          
          {currentView === AppView.PATIENT_LIST && (
            <PatientList 
              patients={patients} 
              onSelectPatient={handleSelectPatient}
              onAddPatient={addNewPatient}
            />
          )}

          {currentView === AppView.INGESTION && activePatient && (
            <IngestionPanel 
              patient={activePatient} 
              onUpdatePatient={handleUpdatePatient} 
              onAnalyze={runAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentView === AppView.ANALYSIS && activePatient && (
            <AnalysisReport 
              data={activePatient.analysisResult || null} 
              onRetry={runAnalysis}
              isAnalyzing={isAnalyzing}
            />
          )}

          {currentView === AppView.SETTINGS && (
            <div className="max-w-2xl mx-auto mt-10">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">System Configuration</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Gemini API Status</h4>
                      <p className="text-xs text-slate-500">
                        {apiKeyDetected ? "Connected to Google GenAI Cloud" : "Missing API_KEY in environment"}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${apiKeyDetected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
                  </div>

                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Deployment Environment</h4>
                      <p className="text-xs text-slate-500">Live Vercel Production</p>
                    </div>
                    <div className="px-2 py-1 bg-indigo-500/10 text-indigo-400 text-[10px] font-bold uppercase tracking-wider rounded border border-indigo-500/20">
                      MVP Active
                    </div>
                  </div>

                  <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl text-xs text-amber-200/70 leading-relaxed">
                    <strong>Note for Live Demo:</strong> Ensure you are using the <span className="text-amber-400">gemini-3-pro-preview</span> model for best multimodal results. Your <code>API_KEY</code> must be configured in Vercel Project Settings for the <code>process.env.API_KEY</code> mapping to function.
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;
