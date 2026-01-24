import React, { useState, Suspense, lazy } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { IngestionPanel } from './components/IngestionPanel.tsx';
import { PatientList } from './components/PatientList.tsx';
import { DisclaimerModal } from './components/DisclaimerModal.tsx';

const AnalysisReport = lazy(() => import('./components/AnalysisReport.tsx').then(module => ({ default: module.AnalysisReport })));
import { RegistrationModal } from './components/RegistrationModal.tsx';
import { AppView, PatientData } from './types.ts';
import { analyzePatientData } from './services/geminiService.ts';

const DEMO_PATIENT_COMPLETE: PatientData = {
  id: 'demo-1',
  codeName: 'Cassandra Nova Vance',
  age: 38,
  gender: 'Female',
  status: 'Complete',
  location: { birth: 'Berlin, Germany', current: 'Los Angeles, CA' },
  notes: 'High-performing executive with chronic fatigue, evening brain fog, and intermittent joint pain in the mornings.',
  files: [{ id: 'f1', name: 'DNA_Metabolic_SNP_Report.txt', type: 'text/plain', content: 'MTHFR C677T Heterozygous.' }],
  audioRecordings: [],
  images: [{ id: 'i1', name: 'Right_Knee_MRI.jpg', url: 'https://images.unsplash.com/photo-1530243627471-d1f2e96291ba?auto=format&fit=crop&q=80&w=200', base64: 'data:image/jpeg;base64,/', mimeType: 'image/jpeg' }],
  rawMetrics: [
    { source: 'Oura', key: 'Sleep Score', value: 64 },
    { source: 'Whoop', key: 'HRV', value: 28 }
  ],
  analysisResult: {
    rootCause: ["Chronic HPA-axis dysregulation", "Methylation pathway impairment"],
    brainPowerScore: 72,
    longevityScore: 68,
    imagingFindings: ["Mild effusion in the suprapatellar bursa"],
    missingLabs: ["Full Cyrex Array 3/4"],
    discoveryQuestions: ["Is the joint pain improved with heat or cold?"],
    nutrientDepletions: ["Low Serum Folate"],
    therapeuticSynergies: ["Methyl-Folate and B12"],
    lifestyleRecommendations: ["Evening infrared sauna"],
    peptideProtocol: [
      { name: "BPC-157", dosage: "250mcg BID", mechanism: "Angiogenesis", expectedOutcome: "Resolution of effusion" }
    ],
    labOrders: [
      { testName: "Comprehensive Metabolic Panel", cptCode: "80053", reason: "Baseline" }
    ],
    summary: "Patient presents with a mismatch between demand and recovery capabilities.",
    disclaimer: "Educational Prototype Content."
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PATIENT_LIST);
  const [patients, setPatients] = useState<PatientData[]>([DEMO_PATIENT_COMPLETE]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  
  const apiKeyDetected = !!process.env.API_KEY;

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

  const confirmRegistration = (data: Partial<PatientData>) => {
    const newId = Math.random().toString(36).substr(2, 9);
    const newPatient: PatientData = {
      id: newId,
      codeName: data.codeName || 'Unnamed Subject',
      age: data.age || 30,
      gender: data.gender || 'Other',
      status: 'Staging',
      location: data.location || { birth: 'Unknown', current: 'Unknown' },
      notes: '',
      files: [],
      audioRecordings: [],
      images: [],
      rawMetrics: []
    };
    setPatients(prev => [newPatient, ...prev]);
    setSelectedPatientId(newId);
    setIsRegistering(false);
    setCurrentView(AppView.INGESTION);
  };

  const runAnalysis = async () => {
    if (!activePatient) return;
    setIsAnalyzing(true);
    try {
      const result = await analyzePatientData(activePatient);
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientId 
          ? { ...p, analysisResult: result, status: 'Complete' } 
          : p
      ));
      setCurrentView(AppView.ANALYSIS);
    } catch (error) {
      alert("Analysis engine error. Verify API configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-950 text-slate-200">
      <DisclaimerModal />
      {isRegistering && (
        <RegistrationModal 
          onClose={() => setIsRegistering(false)} 
          onConfirm={confirmRegistration} 
        />
      )}
      
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
              onAddPatient={() => setIsRegistering(true)}
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
            <Suspense fallback={
              <div className="flex items-center justify-center h-full">
                <div className="text-slate-400">Loading analysis module...</div>
              </div>
            }>
              <AnalysisReport
                data={activePatient.analysisResult || null}
                onRetry={runAnalysis}
                isAnalyzing={isAnalyzing}
              />
            </Suspense>
          )}

          {currentView === AppView.SETTINGS && (
            <div className="max-w-2xl mx-auto mt-10">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-2xl font-bold text-white mb-6">System Configuration</h2>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-slate-800/50 rounded-xl border border-slate-700">
                    <div>
                      <h4 className="font-medium text-slate-200">Gemini AI Status</h4>
                      <p className="text-xs text-slate-500">
                        {apiKeyDetected ? "Connected to Google GenAI Cloud" : "Missing API_KEY in environment"}
                      </p>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${apiKeyDetected ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' : 'bg-red-500 shadow-[0_0_8px_#ef4444]'} animate-pulse`}></div>
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