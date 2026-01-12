
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { IngestionPanel } from './components/IngestionPanel';
import { AnalysisReport } from './components/AnalysisReport';
import { PatientList } from './components/PatientList';
import { AppView, PatientData, AnalysisResult } from './types';
import { analyzePatientData } from './services/geminiService';

// Pre-populated full result for immediate review (Demo Patient)
const DEMO_PATIENT: PatientData = {
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

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PATIENT_LIST);
  const [patients, setPatients] = useState<PatientData[]>([DEMO_PATIENT]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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
    const newId = Math.random().toString(36).substr(2, 9);
    const newPatient: PatientData = {
      id: newId,
      codeName: 'New Case ' + Math.floor(Math.random() * 1000).toString(),
      age: 0,
      gender: 'Other',
      status: 'Staging',
      location: { birth: '', current: '' },
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      const result = await analyzePatientData(activePatient);
      setPatients(prev => prev.map(p => 
        p.id === selectedPatientId 
          ? { ...p, analysisResult: result, status: 'Complete' } 
          : p
      ));
      setCurrentView(AppView.ANALYSIS);
    } catch (error) {
      alert("Analysis engine timeout. Retrying...");
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
                      <h4 className="font-medium text-slate-200">Patient Data Isolation</h4>
                      <p className="text-xs text-slate-500">Local browser storage is active</p>
                    </div>
                    <div className="w-12 h-6 bg-emerald-600 rounded-full flex items-center px-1">
                      <div className="w-4 h-4 bg-white rounded-full ml-auto"></div>
                    </div>
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
