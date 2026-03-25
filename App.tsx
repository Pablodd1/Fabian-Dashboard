import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { IngestionPanel } from './components/IngestionPanel.tsx';
import { AnalysisReport } from './components/AnalysisReport.tsx';
import { PatientList } from './components/PatientList.tsx';
import { DisclaimerModal } from './components/DisclaimerModal.tsx';
import { RegistrationModal } from './components/RegistrationModal.tsx';
import { AppView, PatientData } from './types.ts';
import { analyzePatientData } from './services/geminiService.ts';

const DEMO_PATIENTS: PatientData[] = [
  {
    id: 'demo-1',
    codeName: 'Arthur Vanguard Morgan',
    age: 52,
    gender: 'Male',
    status: 'Complete',
    location: { birth: 'London, UK', current: 'Miami, FL' },
    notes: 'Presents with systemic insulin resistance, elevated visceral fat, and nocturnal apnea patterns. High stress environment.',
    files: [{ id: 'f1', name: 'Metabolic_Panel_Q4.pdf', type: 'application/pdf', content: 'HbA1c: 5.9, Triglycerides: 210, HDL: 38.' }],
    audioRecordings: [],
    images: [{ id: 'i1', name: 'Liver_Ultrasound.jpg', url: 'https://images.unsplash.com/photo-1576086213369-97a306d36557?auto=format&fit=crop&q=80&w=200', base64: 'data:image/jpeg;base64,/', mimeType: 'image/jpeg' }],
    rawMetrics: [
      { source: 'Oura', key: 'Sleep Score', value: 48 },
      { source: 'Whoop', key: 'Recovery', value: 12 }
    ],
    analysisResult: {
      rootCause: ["Hyperinsulinemia", "Non-alcoholic fatty liver progression", "Circadian misalignment"],
      brainPowerScore: 58,
      longevityScore: 52,
      imagingFindings: ["Signs of Grade 1 Steatosis in liver ultrasound"],
      missingLabs: ["ApoB/ApoA1 Ratio", "Adiponectin", "Fast Insulin (C-Peptide)"],
      discoveryQuestions: ["Do you experience post-prandial somnolence daily?", "How many hours after sunset is your last meal?"],
      nutrientDepletions: ["Thiamine (B1)", "Magnesium Malate", "Zinc"],
      therapeuticSynergies: ["Berberine with Alpha Lipoic Acid"],
      lifestyleRecommendations: ["Zone 2 cardio (45 min 4x/week)", "Strict 10-hour feeding window", "Blue light blocking after 8 PM"],
      peptideProtocol: [
        { name: "Tesamorelin", dosage: "2mg daily", mechanism: "GHRH Analogue", expectedOutcome: "Visceral fat reduction" },
        { name: "MOTS-c", dosage: "5mg 3x/week", mechanism: "Mitochondrial ORF", expectedOutcome: "Improved insulin sensitivity" }
      ],
      labOrders: [
        { testName: "NMR LipoProfile", cptCode: "80061", reason: "Advanced lipid assessment" }
      ],
      summary: "Patient Arthur is in a significant metabolic deficit. Focus on glucose disposal and liver health.",
      optimizationRoadmap: [
        { phase: "Phase 1", title: "Stabilization", description: "Seal gut lining & dampen chronic HPA activation." },
        { phase: "Phase 2", title: "Detoxification", description: "Upregulate Phase II liver detox & bind toxins." },
        { phase: "Phase 3", title: "Enhancement", description: "Peptide load & mitochondrial biogenesis peak." }
      ],
      disclaimer: "Educational Prototype Content."
    },
    chatHistory: []
  },
  {
    id: 'demo-2',
    codeName: 'Elena Cipher Gilbert',
    age: 29,
    gender: 'Female',
    status: 'Complete',
    location: { birth: 'Seattle, WA', current: 'Austin, TX' },
    notes: 'Chronic fatigue syndrome, recurring skin rashes, and brain fog following meal consumption. Suspected mold exposure.',
    files: [{ id: 'f2', name: 'Mycotoxin_Report.txt', type: 'text/plain', content: 'Ochratoxin A: High, Gliotoxin: Moderate.' }],
    audioRecordings: [],
    images: [],
    rawMetrics: [
      { source: 'Whoop', key: 'HRV', value: 92 },
      { source: 'Oura', key: 'Readiness', value: 88 }
    ],
    analysisResult: {
      rootCause: ["Mycotoxin-driven immunotoxicity", "Intestinal permeability (Leaky Gut)", "Mast Cell Activation"],
      brainPowerScore: 64,
      longevityScore: 78,
      imagingFindings: [],
      missingLabs: ["TGF-Beta 1", "C4a", "HLA-DR Multilocus"],
      discoveryQuestions: ["Is there visible water damage in your current residence?", "Does your brain fog improve with fasting?"],
      nutrientDepletions: ["Glutathione", "Activated Charcoal (Binders)", "Molybdenum"],
      therapeuticSynergies: ["Quercetin with Vitamin C"],
      lifestyleRecommendations: ["Infrared sauna (bi-daily)", "Air purification (HEPA/PECO)", "Low-amylose diet"],
      peptideProtocol: [
        { name: "KPV", dosage: "200mcg BID", mechanism: "Anti-inflammatory", expectedOutcome: "Reduction in gut inflammation" },
        { name: "VIP", dosage: "50mcg nasal", mechanism: "Neuropeptide", expectedOutcome: "HPA-axis normalization" }
      ],
      labOrders: [
        { testName: "Cyrex Array 2 (Gut)", cptCode: "82784", reason: "Assess barrier integrity" }
      ],
      summary: "Elena presents with a classic environmentally-triggered inflammatory response. Detoxification pathways need support.",
      optimizationRoadmap: [
        { phase: "Phase 1", title: "Stabilization", description: "Binders and histimine suppression." },
        { phase: "Phase 2", title: "Detoxification", description: "Vigorous toxin mobilization." },
        { phase: "Phase 3", title: "Enhancement", description: "Mitochondrial repair and peptide healing." }
      ],
      disclaimer: "Educational Prototype Content."
    },
    chatHistory: []
  },
  {
    id: 'demo-3',
    codeName: 'Marcus Aurelius Zen',
    age: 34,
    gender: 'Male',
    status: 'Complete',
    location: { birth: 'Rome, Italy', current: 'San Francisco, CA' },
    notes: 'High-performance athlete focus. Recent drop in power output, low libido, and slow recovery from sessions.',
    files: [],
    audioRecordings: [],
    images: [{ id: 'i2', name: 'Shoulder_MRI.jpg', url: 'https://images.unsplash.com/photo-1559757175-5700dde675bc?auto=format&fit=crop&q=80&w=200', base64: 'data:image/jpeg;base64,/', mimeType: 'image/jpeg' }],
    rawMetrics: [
      { source: 'Whoop', key: 'Strain', value: 18.2 },
      { source: 'Oura', key: 'HRV', value: 110 }
    ],
    analysisResult: {
      rootCause: ["Overtraining-induced hypogonadism", "Sub-optimal free Testosterone", "Chronic tendon micro-trauma"],
      brainPowerScore: 84,
      longevityScore: 91,
      imagingFindings: ["Mild tendinosis in the supraspinatus tendon"],
      missingLabs: ["Free/Total Testosterone Ratio", "SHBG", "IGF-1"],
      discoveryQuestions: ["Has your explosive power decreased by more than 10%?", "How is your morning erectile quality?"],
      nutrientDepletions: ["Vitamin D3", "Boron", "Cistanche"],
      therapeuticSynergies: ["Zinc with Ashwagandha KSM-66"],
      lifestyleRecommendations: ["Deload week (active recovery)", "Cold plunge (11°C for 3 min)", "Sleep hygiene optimization"],
      peptideProtocol: [
        { name: "BPC-157", dosage: "250mcg daily", mechanism: "Healing", expectedOutcome: "Tendon repair" },
        { name: "Enclomiphene", dosage: "12.5mg daily", mechanism: "SERM", expectedOutcome: "Endogenous Test boost" }
      ],
      labOrders: [
        { testName: "Comprehensive Male Elite", cptCode: "80048", reason: "Hormonal optimization" }
      ],
      summary: "Marcus is hitting a recovery ceiling. Need to pivot from high volume to high quality hormonal support.",
      optimizationRoadmap: [
        { phase: "Phase 1", title: "Rehabilitation", description: "Reduce workload to basic maintenance and repair." },
        { phase: "Phase 2", title: "Hormone Rebalancing", description: "Stimulate endogenous testosterone and clear SHBG." },
        { phase: "Phase 3", title: "Performance Enhancement", description: "Resume full load with added regenerative peptides." }
      ],
      disclaimer: "Educational Prototype Content."
    },
    chatHistory: []
  },
  {
    id: 'demo-4',
    codeName: 'Seraphina Aether Moon',
    age: 65,
    gender: 'Female',
    status: 'Complete',
    location: { birth: 'Kyoto, Japan', current: 'New York, NY' },
    notes: 'Longevity optimization patient. Interested in senolytics, cognitive preservation, and biological age reversal.',
    files: [{ id: 'f3', name: 'BioAge_Report_2025.pdf', type: 'application/pdf', content: 'Biological Age: 54, DNA Methylation: Optimal.' }],
    audioRecordings: [],
    images: [],
    rawMetrics: [
      { source: 'Oura', key: 'Sleep Score', value: 94 },
      { source: 'Whoop', key: 'Recovery', value: 98 }
    ],
    analysisResult: {
      rootCause: ["Cellular senescence accumulation", "NAD+ decline", "Decreasing osteoblastic activity"],
      brainPowerScore: 92,
      longevityScore: 95,
      imagingFindings: [],
      missingLabs: ["NAD+ levels", "DEXA Scan (Bone)", "GrimAge Clock"],
      discoveryQuestions: ["Any family history of early-onset neurodegeneration?", "How is your balance/proprioception?"],
      nutrientDepletions: ["NMN", "Resveratrol", "TMG"],
      therapeuticSynergies: ["Spermidine with Autophagy"],
      lifestyleRecommendations: ["Resistance training (3x/week)", "High-polyphenol diet", "Meditation (20 min daily)"],
      peptideProtocol: [
        { name: "Epitalon", dosage: "10mg/cycle", mechanism: "Telomerase", expectedOutcome: "DNA protection" },
        { name: "GHK-Cu", dosage: "2mg daily", mechanism: "Copper peptide", expectedOutcome: "Skin and tissue rejuvenation" }
      ],
      labOrders: [
        { testName: "TruDiagnostic DNAm", cptCode: "81479", reason: "Biological age tracking" }
      ],
      summary: "Seraphina is an elite longevity patient. Strategy is now focus on maintenance of cellular integrity.",
      optimizationRoadmap: [
        { phase: "Phase 1", title: "Senescence Clearing", description: "Senolytic protocols and NAD+ boosting." },
        { phase: "Phase 2", title: "Cellular Rejuvenation", description: "Epigenic modifier and telomere length management." },
        { phase: "Phase 3", title: "Tissue Regeneration", description: "GHK-Cu and other advanced peptide cycles." }
      ],
      disclaimer: "Educational Prototype Content."
    },
    chatHistory: []
  }
];

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<AppView>(AppView.PATIENT_LIST);
  const [patients, setPatients] = useState<PatientData[]>(DEMO_PATIENTS);
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
      rawMetrics: [],
      chatHistory: []
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
            <AnalysisReport 
              patient={activePatient}
              onUpdatePatient={handleUpdatePatient}
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