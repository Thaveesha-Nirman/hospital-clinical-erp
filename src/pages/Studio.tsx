// @ts-nocheck
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, Printer, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Search, ChevronDown, Check, X, Layout, Scaling, Trash2, 
  Settings as SettingsIcon, CheckCircle, ShieldAlert, FilePlus,
  MousePointer, Boxes, Type, CheckSquare, Grid, Image as ImageIcon, Binary, 
  MousePointerSquareDashed, AlertTriangle, FolderOpen, ChevronRight, FileText, Calendar, UploadCloud

// ==========================================
// IMPORTANT: IMAGE ASSET IMPORTS
// These must match the filenames in your src/assets folder
// ==========================================
import img1 from '../assets/1.jpg'; 
import img2 from '../assets/2.jpg'; 
import img3 from '../assets/3.jpg'; 
import img4 from '../assets/4.jpg'; 

// ==========================================
// 1. CONFIGURATION & LOGIC GROUPS
// ==========================================
const STORAGE_KEY = 'hospital_layouts_master_db'; 
const PAPER_WIDTH_MM = 297; 
const PAPER_HEIGHT_MM = 210;
const PAGE_WIDTH_MM = PAPER_WIDTH_MM / 2; 
const SCREEN_SCALE = 3.5; 

// Print Scaling Logic: Target Position (mm) = Pixel Value (px) * Scale Ratio
// Translates web screen telemetry coordinate metrics safely onto pre-printed state forms.

const mmToPx = (mm: number) => mm * SCREEN_SCALE;
const pxToMm = (px: number) => px / SCREEN_SCALE;

const safeParseFloat = (val: string): number => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : Number(num.toFixed(1));
};

const IDS_COMPLEX_TICK_GROUP = [16, 17];
const IDS_DUAL_DIAGRAM = [29];
const IDS_SINGLE_DIAGRAM = [31];

const FIELD_DEFINITIONS: Record<number, { name: string, sample: string }> = {
    1: { name: "Hospital Name", sample: "National Hospital Galle" },
    2: { name: "PHN Number", sample: "123456789" },
    3: { name: "Contact No", sample: "071-2345678" },
    4: { name: "NIC No", sample: "199012345678" },
    5: { name: "Blood Group", sample: "O+" },
    6: { name: "Allergies", sample: "Amoxicillin, Plaster" },
    7: { name: "Patient Name", sample: "K.K.T.V.N. Kodithuwakku" },
    8: { name: "BHT No", sample: "BHT-999" },
    9: { name: "Ward/Unit", sample: "Ward 5" },
    10: { name: "Age", sample: "24 Y" },
    11: { name: "Sex", sample: "Male" },
    12: { name: "Date Admission", sample: "2025-10-20" },
    13: { name: "Date Discharge", sample: "2025-10-25" },
    14: { name: "Diagnosis", sample: "Acute Appendicitis" },
    15: { name: "Comorbidities", sample: "Diabetes, Hypertension" },
    16: { name: "Mode Admission", sample: "" }, 
    17: { name: "Mode Discharge", sample: "" }, 
    18: { name: "Disease Notif.", sample: "Yes" },
    19: { name: "Medical Cert.", sample: "No" },
    20: { name: "Insurance Form", sample: "Yes" },
    21: { name: "Consultant", sample: "Dr. Vidu De Silva" },
    22: { name: "MO Name", sample: "Dr. Perera" },
    23: { name: "Presenting Complaint", sample: "Abdominal Pain" },
    24: { name: "History of PC", sample: "Pain started 2 days ago..." },
    25: { name: "Past Med. Hx", sample: "Asthma on inhalers" },
    26: { name: "Past Surg. Hx", sample: "LCS in 2020" },
    27: { name: "Allergy History", sample: "Severe rash with Penicillin" },
    28: { name: "Social History", sample: "Non-smoker" },
    29: { name: "Exam Findings", sample: "" }, 
    30: { name: "Management / OP Note", sample: "Appendectomy done..." },
    31: { name: "Investigations", sample: "" }, 
    32: { name: "Special Inv.", sample: "CT Abdomen: Normal" },
    33: { name: "Cond. Discharge", sample: "Stable" },
    34: { name: "Discharge Meds", sample: "Panadol 1g TDS" },
    35: { name: "Discharge Plan", sample: "Review in 1 week" },
    36: { name: "Instructions", sample: "Dressing care explained" },
    37: { name: "Referral Note", sample: "Ref to Surgical Clinic" },
};

export type FieldDataType = 'text_box' | 'number_box' | 'tick_mark' | 'diagram_box' | 'table_grid';

const DATA_TYPE_OPTIONS = [
    { type: 'text_box', label: 'Text Field', description: 'Names, Address, Notes', icon: Type, defaultW: 60, defaultH: 12 },
    { type: 'number_box', label: 'Numeric Field', description: 'Age, Phone, NIC, ID', icon: Binary, defaultW: 40, defaultH: 8 },
    { type: 'tick_mark', label: 'Tick Box', description: 'Yes/No, Gender Selection', icon: CheckSquare, defaultW: 8, defaultH: 8 },
    { type: 'diagram_box', label: 'Diagram Area', description: 'Medical Sketches', icon: ImageIcon, defaultW: 50, defaultH: 40 },
    { type: 'table_grid', label: 'Data Grid', description: 'Lab Results, Charts', icon: Grid, defaultW: 130, defaultH: 60 },
];

interface FieldInstance {
    id: string; fieldNumber: number; dataType: FieldDataType; sampleData: string;
    page: number; x: number; y: number; width: number; height: number;
}

interface SavedSchema {
    id: string; name: string; fields: FieldInstance[]; lastModified: number;
}

const LayoutStudio = () => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // --- STATE ---
  const [fields, setFields] = useState<FieldInstance[]>([]); 
  const [activeTab, setActiveTab] = useState<'outer' | 'inner'>('outer');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nudgeStep, setNudgeStep] = useState<number>(0.5);
  const [nudgeTarget, setNudgeTarget] = useState<'all' | 'single'>('all');

  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newFieldNumber, setNewFieldNumber] = useState<number | null>(null);
  const [newDataType, setNewDataType] = useState<FieldDataType | null>(null);
  const [newSampleData, setNewSampleData] = useState('');
  const [pendingImages, setPendingImages] = useState<string[]>([]);

  const [savedSchemas, setSavedSchemas] = useState<SavedSchema[]>([]);
  const [currentSchemaId, setCurrentSchemaId] = useState<string | null>(null);
  const [currentSchemaName, setCurrentSchemaName] = useState<string>('Hospital Layout V1');
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState({ x: 0, y: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState<any>(null);

  useEffect(() => {
    const loadedLayouts = localStorage.getItem(STORAGE_KEY);
    if (loadedLayouts) { 
        try { 
            const parsed = JSON.parse(loadedLayouts);
            if (Array.isArray(parsed)) setSavedSchemas(parsed);
        } catch(e) { console.error(e); } 
    }
    const savedCal = localStorage.getItem('printer_calibration_settings');
    if (savedCal) setCalibration(JSON.parse(savedCal));
  }, []);

  const activePages = useMemo(() => activeTab === 'outer' ? [4, 1] : [2, 3], [activeTab]);
  const activeFieldsList = fields.filter(f => activePages.includes(f.page));
  const selectedField = fields.find(f => f.id === selectedId);
  const usedFieldNumbers = useMemo(() => fields.map(f => f.fieldNumber), [fields]);

  const openWizard = () => { 
      setNewFieldNumber(null); setNewDataType(null); setNewSampleData(''); setPendingImages([]); 
      setWizardStep(1); setIsWizardOpen(true); 
  };

  const handleSelectNumber = (num: number) => { 
      if (usedFieldNumbers.includes(num)) return; 
      setNewFieldNumber(num);
      setNewSampleData(FIELD_DEFINITIONS[num]?.sample || `Data ${num}`);
      if (IDS_COMPLEX_TICK_GROUP.includes(num)) setWizardStep(10); 
      else if (IDS_DUAL_DIAGRAM.includes(num) || IDS_SINGLE_DIAGRAM.includes(num)) setWizardStep(20); 
      else setWizardStep(2); 
  };

  const finalizeFieldCreation = () => {
    if (!newFieldNumber) return;
    const baseConfig = { page: activePages[1], x: 20, y: 30, width: 40, height: 10 };

    if (IDS_COMPLEX_TICK_GROUP.includes(newFieldNumber)) {
        const group = [
            { ...baseConfig, id: `f_${Date.now()}_1`, fieldNumber: newFieldNumber, dataType: 'tick_mark', sampleData: '', width: 8, height: 8, x: 20, y: 30 },
            { ...baseConfig, id: `f_${Date.now()}_2`, fieldNumber: newFieldNumber, dataType: 'tick_mark', sampleData: '', width: 8, height: 8, x: 30, y: 30 },
            { ...baseConfig, id: `f_${Date.now()}_4`, fieldNumber: newFieldNumber, dataType: 'text_box', sampleData: 'Remarks', width: 60, height: 10, x: 50, y: 29 }
        ];
        setFields([...fields, ...group]);
    } else {
        if (!newDataType) return;
        const config = DATA_TYPE_OPTIONS.find(o => o.type === newDataType);
        const newField = {
            ...baseConfig, id: `f_${Date.now()}`, fieldNumber: newFieldNumber, dataType: newDataType,
            sampleData: newSampleData, width: config?.defaultW || 40, height: config?.defaultH || 10
        };
        setFields([...fields, newField]);
        setSelectedId(newField.id);
    }
    setIsWizardOpen(false);
  };

  const handleSave = () => {
    const newId = currentSchemaId || `layout_${Date.now()}`;
    const schema = { id: newId, name: currentSchemaName, fields, lastModified: Date.now() };
    const updated = savedSchemas.some(s => s.id === newId) ? savedSchemas.map(s => s.id === newId ? schema : s) : [...savedSchemas, schema];
    setSavedSchemas(updated); setCurrentSchemaId(newId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); 
    setShowSaveFeedback(true); setTimeout(() => setShowSaveFeedback(false), 2000);
  };

  const handleNudge = (dir: string) => {

    // Refactored active workspace coordinates to throttle rendering updates while tracking dynamic block moves.
    // Secure calculation loops optimize bulk item layout rendering states.
    
    setFields(prev => prev.map(f => {
      if (!(nudgeTarget === 'all' ? activePages.includes(f.page) : f.id === selectedId)) return f;
      let { x, y } = f;
      if (dir === 'up') y -= nudgeStep; if (dir === 'down') y += nudgeStep;
      if (dir === 'left') x -= nudgeStep; if (dir === 'right') x += nudgeStep;
      return { ...f, x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    }));
  };

  const updateProp = (id: string, prop: string, val: string) => {
    const num = safeParseFloat(val);
    if(!isNaN(num)) setFields(prev => prev.map(f => f.id === id ? { ...f, [prop]: Number(num.toFixed(1)) } : f));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden relative h-screen">
      
      {/* HEADER */}
      <header className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-lg"><Layout size={24}/></div>
            <div><h1 className="text-xl font-black text-slate-800 tracking-tight">Studio</h1><p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Layout Engine v25</p></div>
        </div>
        <div className="flex items-center gap-4">
           <button onClick={() => setIsManagerOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase shadow-sm transition-all"><FolderOpen size={16}/> Load</button>
           <input value={currentSchemaName} onChange={(e)=>setCurrentSchemaName(e.target.value)} className="h-11 border-2 border-slate-100 rounded-xl px-4 text-sm font-black text-slate-700 w-64 outline-none focus:border-blue-500 transition-all" />
           <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-xs uppercase shadow-xl hover:bg-blue-700 transition-all active:scale-95"><Save size={16}/> {showSaveFeedback ? 'Saved!' : 'Save Layout'}</button>
        </div>
      </header>

      {/* TOOLBAR */}
      <div className="bg-white border-b border-slate-200 px-6 py-3 flex justify-between items-center z-40">
         <div className="flex gap-5">
            <div className="bg-slate-100 p-1.5 rounded-2xl flex gap-1.5 border border-slate-200">
                <button onClick={() => setActiveTab('outer')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 'outer' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Cover (1 & 4)</button>
                <button onClick={() => setActiveTab('inner')} className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${activeTab === 'inner' ? 'bg-white text-blue-600 shadow-md' : 'text-slate-500 hover:text-slate-800'}`}>Internal (2 & 3)</button>
            </div>
            <button onClick={openWizard} className="flex items-center gap-2 px-6 py-2 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase hover:bg-black shadow-lg transition-all active:scale-95"><Plus size={18}/> New Data Slot</button>
         </div>

         <div className="flex gap-4 items-center">
            {selectedField ? (
                <div className="flex items-center gap-4 bg-blue-600 px-5 py-2 rounded-2xl shadow-xl border border-blue-400">
                    <span className="text-sm font-black text-white"># {selectedField.fieldNumber}</span>
                    <input type="number" step="0.1" value={selectedField.x} onChange={(e)=>updateProp(selectedId, 'x', e.target.value)} className="w-16 h-8 text-xs font-black rounded-lg px-2 bg-white/10 text-white" />
                    <input type="number" step="0.1" value={selectedField.y} onChange={(e)=>updateProp(selectedId, 'y', e.target.value)} className="w-16 h-8 text-xs font-black rounded-lg px-2 bg-white/10 text-white" />
                    <button onClick={() => setFields(fields.filter(f => f.id !== selectedId))} className="p-2 bg-red-500 text-white rounded-xl"><Trash2 size={16}/></button>
                </div>
            ) : (
                <div className="px-6 py-3 bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center">Select field to edit</div>
            )}
            <button onClick={() => window.print()} className="flex items-center gap-3 px-8 py-3 bg-white border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-[11px] uppercase shadow-md active:scale-95"><Printer size={18}/> Print</button>
         </div>
      </div>

      {/* CANVAS ZONE */}
      <div className="flex-1 overflow-auto bg-slate-200/50 p-12 flex justify-center">
          <div ref={canvasRef} className="relative bg-white shadow-2xl border-[20px] border-white shrink-0 rounded-sm ring-1 ring-slate-300 overflow-hidden" 
               style={{ width: mmToPx(PAPER_WIDTH_MM), height: mmToPx(PAPER_HEIGHT_MM) }}>
              
              {/* FIXED: Form Backgrounds */}
              <div className="absolute inset-0 flex pointer-events-none opacity-90 mix-blend-multiply select-none">
                  <img src={activeTab==='outer' ? img4 : img2} className="w-1/2 h-full object-fill border-r-2 border-blue-100" alt="bg-left"/>
                  <img src={activeTab==='outer' ? img1 : img3} className="w-1/2 h-full object-fill" alt="bg-right"/>
              </div>

              {/* Grid Lines */}
              <div className="absolute inset-0 pointer-events-none opacity-[0.04]" style={{ backgroundImage: `linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)`, backgroundSize: `${mmToPx(10)}px ${mmToPx(10)}px` }}></div>

              {/* Map Fields */}
              {activeFieldsList.map(field => {
                  const isRight = field.page === 1 || field.page === 3; 
                  const visualX = isRight ? (field.x + PAGE_WIDTH_MM) : field.x; 
                  const isActive = selectedId === field.id;
                  
                  return (
                    <div key={field.id} className="absolute group" 
                         style={{ left: mmToPx(visualX), top: mmToPx(field.y), width: mmToPx(field.width), height: mmToPx(field.height), zIndex: isActive ? 100 : 10 }}
                         onPointerDown={(e) => {
                            if ((e.target as HTMLElement).closest('.resize-handle')) return; 
                            e.stopPropagation(); setSelectedId(field.id);
                            const startX = field.x; const startY = field.y; const startCX = e.clientX; const startCY = e.clientY;
                            const move = (ev: PointerEvent) => { 
                                const dx = pxToMm(ev.clientX - startCX); const dy = pxToMm(ev.clientY - startCY); 
                                setFields(prev => prev.map(f => f.id === field.id ? { ...f, x: Number((startX + dx).toFixed(1)), y: Number((startY + dy).toFixed(1)) } : f)); 
                            };
                            const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
                            window.addEventListener('pointermove', move); window.addEventListener('pointerup', up);
                         }}>
                        
                        <div className={`w-full h-full border-2 rounded-[4px] flex items-start justify-start text-left p-1 text-[11px] font-black cursor-move overflow-hidden bg-white/70 backdrop-blur-[2px] ${isActive ? 'border-blue-600 ring-4 ring-blue-500/10' : 'border-slate-400/40 hover:border-blue-400'}`}>
                            {field.dataType === 'tick_mark' ? <Check size={mmToPx(field.width*0.8)} strokeWidth={5} className="text-blue-700"/> : field.sampleData}
                        </div>
                        
                        <div className={`resize-handle absolute bottom-[-4px] right-[-4px] bg-red-600 w-6 h-6 flex items-center justify-center cursor-nwse-resize rounded-full z-[110] border-4 border-white shadow-lg transition-all ${isActive ? 'scale-100 opacity-100' : 'scale-0'}`}
                             onPointerDown={(e) => { 
                                e.stopPropagation(); e.preventDefault(); 
                                const startW = field.width; const startH = field.height; const startCX = e.clientX; const startCY = e.clientY; 
                                const move = (ev: PointerEvent) => { 
                                    const dw = pxToMm(ev.clientX - startCX); const dh = pxToMm(ev.clientY - startCY); 
                                    setFields(prev => prev.map(f => f.id === field.id ? { ...f, width: Math.max(2, Number((startW + dw).toFixed(1))), height: Math.max(2, Number((startH + dh).toFixed(1))) } : f)); 
                                }; 
                                const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); }; 
                                window.addEventListener('pointermove', move); window.addEventListener('pointerup', up); 
                             }}>
                            <Scaling size={10} className="text-white"/>
                        </div>
                    </div>
                  );
              })}
          </div>
      </div>

      {/* WIZARD MODAL */}
      <AnimatePresence>
        {isWizardOpen && (
           <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-6">
              <div className="bg-white rounded-[50px] shadow-2xl max-w-4xl w-full border border-white/20 overflow-hidden flex flex-col">
                 <div className="px-12 py-10 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
                    <h3 className="text-3xl font-black text-slate-800">Deployment Wizard</h3>
                    <button onClick={() => setIsWizardOpen(false)} className="p-4 hover:bg-slate-200 rounded-full text-slate-400 transition-all"><X size={32}/></button>
                 </div>
                 <div className="p-12 min-h-[500px]">
                    {wizardStep === 1 && (
                        <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
                            {Array.from({ length: 37 }, (_, i) => i + 1).map(num => (
                                <button key={num} onClick={() => handleSelectNumber(num)} disabled={usedFieldNumbers.includes(num)} 
                                        className={`h-20 rounded-3xl border-4 font-black text-lg transition-all ${usedFieldNumbers.includes(num) ? 'bg-slate-100 border-slate-100 text-slate-300' : 'border-slate-100 text-slate-600 hover:border-blue-600'}`}>
                                    <span>{num}</span>
                                </button>
                            ))}
                        </div>
                    )}
                    {wizardStep === 2 && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-entry">
                            {DATA_TYPE_OPTIONS.map(opt => (
                                <button key={opt.type} onClick={() => { setNewDataType(opt.type); setWizardStep(3); }} 
                                        className="p-8 border-4 border-slate-100 rounded-[40px] hover:border-blue-600 hover:bg-blue-50/50 text-left flex items-start gap-6 transition-all group shadow-sm">
                                    <div className="p-5 bg-white rounded-3xl text-slate-400 group-hover:text-blue-600 shadow-inner border border-slate-100"><opt.icon size={32}/></div>
                                    <div><span className="text-xl font-black uppercase text-slate-800 block mb-2">{opt.label}</span><span className="text-sm text-slate-400 font-bold leading-relaxed">{opt.description}</span></div>
                                </button>
                            ))}
                        </div>
                    )}
                    {wizardStep === 3 && (
                        <div className="space-y-10 animate-entry text-center">
                            <input autoFocus value={newSampleData} onChange={(e) => setNewSampleData(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finalizeFieldCreation()} 
                                   className="w-full bg-slate-50 border-4 border-slate-100 rounded-3xl h-24 px-10 font-black text-4xl outline-none focus:border-blue-500 shadow-xl text-center text-slate-800" placeholder="TYPE CONTENT HERE"/>
                            <button onClick={finalizeFieldCreation} className="w-full h-20 bg-blue-600 text-white rounded-[30px] font-black text-lg uppercase shadow-2xl hover:bg-blue-700 flex items-center justify-center gap-4"><CheckCircle size={28}/> Deploy to Canvas</button>
                        </div>
                    )}
                 </div>
              </div>
           </div>
        )}

        {isManagerOpen && (
            <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-6">
                <div className="bg-white rounded-[50px] shadow-2xl max-w-xl w-full flex flex-col overflow-hidden">
                    <div className="p-10 border-b bg-slate-50 flex justify-between items-center"><h3 className="text-2xl font-black">Saved Layouts</h3><button onClick={()=>setIsManagerOpen(false)}><X size={32}/></button></div>
                    <div className="p-10 overflow-y-auto max-h-[60vh]">
                        {savedSchemas.map(s => (
                            <div key={s.id} className="p-6 bg-white border-4 border-slate-100 rounded-3xl mb-4 flex justify-between items-center hover:border-blue-500 transition-all">
                                <span className="font-black text-slate-800">{s.name}</span>
                                <button onClick={()=> { setFields(s.fields); setCurrentSchemaId(s.id); setCurrentSchemaName(s.name); setIsManagerOpen(false); }} className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-md">Load</button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LayoutStudio;
