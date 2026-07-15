

// --- ICONS ---
// Includes: Actions (Save, Print), Navigation (Arrows, Chevrons), 
// Canvas Tools (MousePointer, BoxSelect, Scaling), and Node Types (Type, Image, Binary)
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom'; 
import { motion, AnimatePresence } from 'framer-motion';

// --- ICONS ---
import { 
  Save, Printer, Plus, ArrowUp, ArrowDown, ArrowLeft, ArrowRight,
  Search, ChevronDown, Check, X, Layout, Scaling, Trash2, 
  Settings as SettingsIcon, CheckCircle, ShieldAlert, FilePlus,
  MousePointer, Boxes, Type, CheckSquare, Grid, Image as ImageIcon, Binary, 
  MousePointerSquareDashed, AlertTriangle, FolderOpen, ChevronRight, FileText, 
  Calendar, UploadCloud, Copy, RefreshCcw, Layers, Maximize, MousePointer2, Info, Lock,
  BoxSelect
} from 'lucide-react';

// --- ASSETS ---
import img1 from '../assets/1.jpg'; 
import img2 from '../assets/2.jpg'; 
import img3 from '../assets/3.jpg'; 
import img4 from '../assets/4.jpg'; 
import lungImg from '../assets/lung.png'; 

// ==========================================
// 1. ENGINE CONSTANTS
// ==========================================
const STORAGE_KEY = 'hospital_layouts_master_db'; 
const CALIBRATION_KEY = 'printer_calibration_settings';
const OCTAGON_PATH = "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";

// Paper Dimensions (A4 Landscape split)
const PAPER_WIDTH_MM = 297; 
const PAPER_HEIGHT_MM = 210;
const PAGE_WIDTH_MM = PAPER_WIDTH_MM / 2; 

// Zoom/Scale Factor
const SCREEN_SCALE = 3.5; 

// Helpers
const mmToPx = (mm) => mm * SCREEN_SCALE;
const pxToMm = (px) => px / SCREEN_SCALE;
const safeParseFloat = (val) => { 
    const parsed = parseFloat(val); 
    return isNaN(parsed) ? 0 : Number(parsed.toFixed(1)); 
};

// ==========================================
// 2. FIELD CONFIGURATIONS
// ==========================================

// *** CRITICAL: DEFINED AT TOP LEVEL TO AVOID REFERENCE ERRORS ***
const SMART_GROUP_IDS = [16, 17, 18, 19, 20, 29, 30, 31];
const IDS_BOOLEAN_TICK_GROUP = [18, 19, 20];

const FIELD_DEFINITIONS = {
    1: { name: "Hospital Name", sample: "National Hospital Galle" },
    2: { name: "PHN Number", sample: "123456789" },
    3: { name: "Contact No", sample: "0712345678" },
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
    15: { name: "Comorbidities", sample: "Diabetes" },
    
    // SMART MODULES
    16: { name: "Mode of Admission", sample: "TICK_GROUP: Self, Ref, Trans" }, 
    17: { name: "Mode of Discharge", sample: "TICK_GROUP: Routine, Trans, Self" }, 
    18: { name: "Disease Notif.", sample: "YES/NO Pair" },
    19: { name: "Medical Cert.", sample: "YES/NO Pair" },
    20: { name: "Insurance Form", sample: "YES/NO Pair" },
    
    21: { name: "Consultant", sample: "Dr. Vidu De Silva" },
    22: { name: "MO Name", sample: "Dr. Perera" },
    23: { name: "Presenting Complaint", sample: "Symptoms..." },
    24: { name: "History of PC", sample: "Pain history..." },
    25: { name: "Past Med. Hx", sample: "Medical history..." },
    26: { name: "Past Surg. Hx", sample: "Surgical history..." },
    27: { name: "Allergy History", sample: "Extended allergy data..." },
    28: { name: "Social History", sample: "Lifestyle data..." },
    
    // SMART MODULES
    29: { name: "Examination Suite", sample: "FULL_EXAM: Lungs, Heart, Abd" }, 
    30: { name: "Op Note / Management", sample: "SMART_OP: Topic, Date, Content, Rx" }, 
    31: { name: "Investigations Table", sample: "TABLE_GRID: FBC, CRP, etc." }, 
    
    32: { name: "Special Inv.", sample: "CT/MRI Results..." },
    33: { name: "Cond. Discharge", sample: "Stable" },
    34: { name: "Discharge Meds", sample: "Prescriptions..." },
    35: { name: "Discharge Plan", sample: "Review in 1 week" },
    36: { name: "Instructions", sample: "Sinhala/Tamil advice..." },
    37: { name: "Referral Note", sample: "Ref to clinic..." },
};

const DATA_TYPE_OPTIONS = [
    { type: 'text_box', label: 'Text Module', description: 'Names, Remarks, Detailed Notes', icon: Type, defaultW: 60, defaultH: 12 },
    { type: 'number_box', label: 'Numeric Data', description: 'Age, Phone, NIC, ID Codes', icon: Binary, defaultW: 40, defaultH: 8 },
    { type: 'tick_mark', label: 'Tick Module', description: 'Clinical Selection Checkboxes', icon: CheckSquare, defaultW: 8, defaultH: 8 },
    { type: 'diagram_box', label: 'Visual Interface', description: 'Clinical Sketches & Anatomical Grids', icon: ImageIcon, defaultW: 50, defaultH: 40 },
    { type: 'table_grid', label: 'Data Array', description: 'Laboratory Dynamic Results', icon: Grid, defaultW: 130, defaultH: 60 },
];

// ==========================================
// 3. MAIN COMPONENT START
// ==========================================
const Settings = () => {
  const navigate = useNavigate(); 
  const canvasRef = useRef(null);

  // --- CORE STATE ---
  const [fields, setFields] = useState([]); 
  const [activeTab, setActiveTab] = useState('outer');
  
  // *** MULTI-SELECTION STATE ***
  const [selectedIds, setSelectedIds] = useState([]); 

  // Calibration State
  const [nudgeStep, setNudgeStep] = useState(0.5);
  const [nudgeTarget, setNudgeTarget] = useState('all');

  // Wizard State
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [wizardStep, setWizardStep] = useState(1);
  const [newFieldNumber, setNewFieldNumber] = useState(null);
  const [newDataType, setNewDataType] = useState(null);
  const [newSampleData, setNewSampleData] = useState('');

  // Storage & Archive State
  const [savedSchemas, setSavedSchemas] = useState([]);
  const [currentSchemaId, setCurrentSchemaId] = useState(null);
  const [currentSchemaName, setCurrentSchemaName] = useState('National Hospital Layout');
  const [showSaveFeedback, setShowSaveFeedback] = useState(false);
  const [isManagerOpen, setIsManagerOpen] = useState(false);
  const [managerSearch, setManagerSearch] = useState('');

  // Hardware Sync State
  const [showCalibration, setShowCalibration] = useState(false);
  const [calibration, setCalibration] = useState({ x: 0, y: 0 });

  // Dialog State
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState(null);

  // ==========================================
  // 4. LOAD & SAVE EFFECTS
  // ==========================================
 useEffect(() => {
    const initStudio = async () => {
      if (!(window as any).api) return;

      // 1. Load All Layouts from SQLite
      const archives = await (window as any).api.getLayouts();
      if (Array.isArray(archives)) setSavedSchemas(archives);
      
      // 2. Check for edit signal (If coming from Layouts.tsx)
      const signalId = localStorage.getItem('active_edit_id');
      if (signalId) {
          const matched = archives.find(s => s.id.toString() === signalId.toString());
          if (matched) {
              setFields(JSON.parse(matched.coordinates || '[]')); 
              setCurrentSchemaId(matched.id); 
              setCurrentSchemaName(matched.profile_name);
          }
          localStorage.removeItem('active_edit_id'); 
      }

      // 3. Load Hardware Calibration (Keep this in localStorage as it is machine-specific)
      const rawHardware = localStorage.getItem(CALIBRATION_KEY);
      if (rawHardware) { 
          try { setCalibration(JSON.parse(rawHardware)); } catch(e) {} 
      }
    };

    initStudio();
  }, []);

  // Derived Data
  const activePages = useMemo(() => activeTab === 'outer' ? [4, 1] : [2, 3], [activeTab]);
  const activeFieldsList = useMemo(() => fields.filter(f => activePages.includes(f.page)), [fields, activePages]);
  const usedFieldNumbers = useMemo(() => fields.map(f => f.fieldNumber), [fields]);
  
  // Single selection helper
  const singleSelectedField = selectedIds.length === 1 ? fields.find(f => f.id === selectedIds[0]) : null;

  const triggerModal = (title, message, type, action) => {
      setModalConfig({ title, message, type, action });
      setModalOpen(true);
  };

  // ==========================================
  // 5. WIZARD LOGIC (HARDCODED IDs HERE)
  // ==========================================
  const openWizard = () => { 
      setNewFieldNumber(null); setNewDataType(null); setNewSampleData(''); 
      setWizardStep(1); setIsWizardOpen(true); 
  };

  const handleSelectNumber = (num) => { 
      if (usedFieldNumbers.includes(num)) return; 
      setNewFieldNumber(num);
      setNewSampleData(FIELD_DEFINITIONS[num] ? FIELD_DEFINITIONS[num].sample : `Clinical Module ${num}`);
      
      // If it is a "Smart Group" ID (including 30), jump to deploy step
      if (SMART_GROUP_IDS.includes(num)) {
          setWizardStep(10); 
      } else {
          setWizardStep(2); 
      }
  };

 const finalizeFieldCreation = () => {
    if (!newFieldNumber) return;
    
    // 1. THE SMART ROUTER: Automatically assigns the correct physical page
    let targetPage = 1;
    if (newFieldNumber <= 15) {
        targetPage = 1; // Front Cover (Outer Right)
    } else if (newFieldNumber >= 16 && newFieldNumber <= 22) {
        targetPage = 1; // Back Cover (Outer Left)
    } else if (newFieldNumber >= 23 && newFieldNumber <= 30) {
        targetPage = 2; // History (Inner Left)
    } else if (newFieldNumber >= 31 && newFieldNumber <= 33) {
        targetPage = 3; // Exam / Labs (Inner Right)
    } else if (newFieldNumber >= 34) {
        targetPage = 4 // Discharge (Bottom Back Cover)
    }

    // 2. Base Configuration using the forced targetPage
    const baseConfig = { page: targetPage, x: 20, y: 30, width: 40, height: 10 };

    // --- FEATURE: CASE 34 (MEDICATION TABLE) ---
    if (newFieldNumber === 34) {
        const medTable = { 
            ...baseConfig, 
            id: 'f_34_med_table', 
            fieldNumber: 34, 
            dataType: 'table_grid', 
            sampleData: 'MEDICATION_TABLE_PREVIEW', 
            width: 135, height: 40, x: 10, y: 150 
        };
        setFields([...fields, medTable]);
        setSelectedIds([medTable.id]);
        setIsWizardOpen(false);
        return;
    }

    // --- FEATURE: CASE 23 (HISTORY MASTER BOX) ---
    if (newFieldNumber === 23) {
        const historySuite = {
            ...baseConfig,
            id: '23_history_master',
            fieldNumber: 23,
            dataType: 'text_box',
            sampleData: 'HISTORY MASTER (23-28)\n(Will shrink to fit)',
            width: 135, height: 50, x: 10, y: 15
        };
        setFields([...fields, historySuite]);
        setSelectedIds([historySuite.id]);
        setIsWizardOpen(false);
        return;
    }

    // FEATURE: BLOCK 24-28 (Force Master Box usage)
    if ([24, 25, 26, 28].includes(newFieldNumber)) {
        alert("Please use Field 23. It now handles ALL History in one smart box.");
        return;
    }

    // --- FEATURE: CASE 29 (EXAMINATION COMPONENTS) ---
    if (newFieldNumber === 29) {
        const group29 = [
            { ...baseConfig, id: `f_29_gen`, fieldNumber: 29, dataType: 'text_box', sampleData: 'General Exam', width: 60, height: 10, x: 10, y: 70 },
            { ...baseConfig, id: `f_29_cvs`, fieldNumber: 29, dataType: 'text_box', sampleData: 'CVS', width: 60, height: 10, x: 10, y: 82 },
            { ...baseConfig, id: `f_29_cns`, fieldNumber: 29, dataType: 'text_box', sampleData: 'CNS', width: 60, height: 10, x: 10, y: 94 },
            { ...baseConfig, id: `f_29_lung_img`, fieldNumber: 29, dataType: 'diagram_box', sampleData: 'LUNG_DIAGRAM', width: 50, height: 50, x: 80, y: 70 },
            { ...baseConfig, id: `f_29_abd_img`, fieldNumber: 29, dataType: 'diagram_box', sampleData: 'ABDOMEN_GRID', width: 60, height: 60, x: 135, y: 70 },
            { ...baseConfig, id: `f_29_lung_r`, fieldNumber: 29, dataType: 'text_box', sampleData: 'Right Lung Notes', width: 45, height: 8, x: 82, y: 115 },
            { ...baseConfig, id: `f_29_lung_l`, fieldNumber: 29, dataType: 'text_box', sampleData: 'Left Lung Notes', width: 45, height: 8, x: 82, y: 125 },
            { ...baseConfig, id: `f_29_abd_notes`, fieldNumber: 29, dataType: 'text_box', sampleData: 'Abd Findings', width: 55, height: 10, x: 135, y: 132 },
            { ...baseConfig, id: `f_29_dre`, fieldNumber: 29, dataType: 'text_box', sampleData: 'DRE Findings', width: 55, height: 8, x: 135, y: 144 },
        ];
        setFields([...fields, ...group29]);
        setIsWizardOpen(false);
        return;
    }
   // Bulk-inject the composite array, update canvas state, and exit the wizard

    // --- FEATURE: CASE 16 (MODE OF ADMISSION) ---
    if (newFieldNumber === 16) {
        const group16 = [
            { ...baseConfig, id: '16_self', fieldNumber: 16, dataType: 'tick_mark', sampleData: 'Self', width: 6, height: 6, x: 10, y: 10 },
            { ...baseConfig, id: '16_ref', fieldNumber: 16, dataType: 'tick_mark', sampleData: 'Ref', width: 6, height: 6, x: 30, y: 10 },
            { ...baseConfig, id: '16_trans', fieldNumber: 16, dataType: 'tick_mark', sampleData: 'Trans', width: 6, height: 6, x: 50, y: 10 },
            { ...baseConfig, id: '16_ref_text', fieldNumber: 16, dataType: 'text_box', sampleData: 'By Whom?', width: 40, height: 8, x: 10, y: 20 },
            { ...baseConfig, id: '16_trans_text', fieldNumber: 16, dataType: 'text_box', sampleData: 'From Hospital?', width: 40, height: 8, x: 55, y: 20 }
        ];
        setFields([...fields, ...group16]);
        setIsWizardOpen(false);
        return;
    }

    // --- FEATURE: CASE 17 (MODE OF DISCHARGE) ---
    if (newFieldNumber === 17) {
        const group17 = [
            { ...baseConfig, id: '17_routine', fieldNumber: 17, dataType: 'tick_mark', sampleData: 'Routine', width: 6, height: 6, x: 10, y: 40 },
            { ...baseConfig, id: '17_trans', fieldNumber: 17, dataType: 'tick_mark', sampleData: 'Trans Out', width: 6, height: 6, x: 35, y: 40 },
            { ...baseConfig, id: '17_self', fieldNumber: 17, dataType: 'tick_mark', sampleData: 'Self Disc', width: 6, height: 6, x: 60, y: 40 },
            { ...baseConfig, id: '17_trans_text', fieldNumber: 17, dataType: 'text_box', sampleData: 'To Hospital?', width: 50, height: 8, x: 10, y: 50 }
        ];
        setFields([...fields, ...group17]);
        setIsWizardOpen(false);
        return;
    }

    // --- FEATURE: CASES 18, 19, 20 (YES/NO TICK PAIRS) ---
    if ([18, 19, 20].includes(newFieldNumber)) {
        const groupYN = [
            { ...baseConfig, id: `${newFieldNumber}_yes`, fieldNumber: newFieldNumber, dataType: 'tick_mark', sampleData: '✓', width: 6, height: 6, x: 10, y: 10 },
            { ...baseConfig, id: `${newFieldNumber}_no`, fieldNumber: newFieldNumber, dataType: 'tick_mark', sampleData: '✓', width: 6, height: 6, x: 25, y: 10 }
        ];
        setFields([...fields, ...groupYN]);
        setIsWizardOpen(false);
        return;
    }

    // --- FEATURE: CASE 30 (OP MASTER BOX) ---
    if (newFieldNumber === 30) {
        const opMaster = { 
            ...baseConfig, 
            id: '30_op_master', 
            fieldNumber: 30, 
            dataType: 'text_box', 
            sampleData: 'OP MASTER (Full Content)', 
            width: 135, height: 60, x: 10, y: 20 
        };
        setFields([...fields, opMaster]);
        setSelectedIds([opMaster.id]);
        setIsWizardOpen(false);
        return;
    }

    // --- FEATURE: CASE 31 (INVESTIGATIONS TABLE) ---
    if (newFieldNumber === 31) {
        const tableSlot = { 
            ...baseConfig, 
            id: `f_31_table`, 
            fieldNumber: 31, 
            dataType: 'table_grid', 
            sampleData: 'TABLE_PREVIEW', 
            width: 130, height: 60, x: 10, y: 100 
        };
        setFields([...fields, tableSlot]);
        setSelectedIds([tableSlot.id]);
        setIsWizardOpen(false);
        return;
    }

    // --- STANDARD FALLBACK (SINGLE SLOTS) ---
    if (!newDataType) return;
    const typeConfig = DATA_TYPE_OPTIONS.find(o => o.type === newDataType);
    const singleSlot = { 
        id: `f_${Date.now()}`, 
        fieldNumber: newFieldNumber, 
        dataType: newDataType, 
        sampleData: newSampleData, 
        page: targetPage, // Correct page assigned here
        x: 25, y: 40, 
        width: typeConfig?.defaultW || 40, height: typeConfig?.defaultH || 10 
    };
    setFields([...fields, singleSlot]);
    setSelectedIds([singleSlot.id]);
    setIsWizardOpen(false);
  };

  // ==========================================
  // 6. ACTIONS (MULTI-SELECT ENABLED)
  // ==========================================
  
  // RESET WORKSPACE
  const handleNewLayout = () => {
      if (fields.length > 0) {
          triggerModal("Clear The Workspace?", "This action will remove all added fields.", "warning", () => {
            setFields([]); setCurrentSchemaId(null); setCurrentSchemaName("Untitled Layout"); setSelectedIds([]); setModalOpen(false);
          });
      } else { setFields([]); setCurrentSchemaId(null); setCurrentSchemaName("Untitled Layout"); setSelectedIds([]); }
  };

  // SAVE CALIBRATION
  const saveCalibration = () => {
    localStorage.setItem(CALIBRATION_KEY, JSON.stringify(calibration));
    setShowCalibration(false);
  };

  // DUPLICATE
 // DUPLICATE (Surgical Fix)
 const handleDuplicateLayout = (s) => {
    // 1. Parse the coordinates string from the database into a list
    const dbFields = JSON.parse(s.coordinates || '[]');
    
    const clonedFields = dbFields.map(f => ({ 
      ...f, 
      id: `f_${Date.now()}_${Math.random().toString(36).substr(2, 5)}` 
    }));
    
    setFields(clonedFields); 
    setCurrentSchemaId(null); 
    setCurrentSchemaName(`Copy of ${s.profile_name}`); // Changed .name to .profile_name
    setIsManagerOpen(false);
    setSelectedIds([]);
  };

  // LOAD (Surgical Fix)
  const handleLoad = (s) => { 
      setFields(JSON.parse(s.coordinates || '[]')); 
      setCurrentSchemaId(s.id); 
      setCurrentSchemaName(s.profile_name); 
      setIsManagerOpen(false);
      setSelectedIds([]);
  };
  
  // DELETE (MULTI)
  const handleDeleteField = () => {
      if (selectedIds.length === 0) return;
      triggerModal("Remove Selected?", `This action will remove delected  ${selectedIds.length} item(s) from the canvas !`, "danger", () => {
        setFields(fields.filter(f => !selectedIds.includes(f.id))); 
        setSelectedIds([]); 
        setModalOpen(false);
      });
  };
  // --- SURGICAL FIX: DELETE SAVED LAYOUT FROM DATABASE ---
  const handleDeleteSavedLayout = async (layoutId) => {
    if (!layoutId || !(window as any).api) return;

    // 1. We use your existing modal to ask for permission
    triggerModal("Delete Layout??", "This action will permanently delete this layout configuration.", "danger", async () => {
      try {
        // 2. This calls the lane we built in main.cjs/preload.cjs
        const res = await (window as any).api.deleteLayout(layoutId);
        
        if (res.status === 'success') {
          // 3. Refresh the list so the layout disappears from the screen immediately
          const archives = await (window as any).api.getLayouts();
          setSavedSchemas(archives);
          setModalOpen(false);
        }
      } catch (err) {
        console.error("Delete failed:", err);
      }
    });
  };

  // SAVE LAYOUT
// --- SURGICAL FIX: SAVE TO DATABASE ---
  const handleSave = async () => {
    if (!(window as any).api) return;

    // We prepare the package for the SQLite database
    const schema = {
      id: currentSchemaId, // Database will use this to Update or Insert
      profile_name: currentSchemaName,
      coordinates: JSON.stringify(fields)
    };

    const res = await (window as any).api.saveLayout(schema);
    
    if (res.status === 'success') {
      // Re-fetch list from DB to keep the "Saved Layouts" manager updated
      const archives = await (window as any).api.getLayouts();
      setSavedSchemas(archives);
      
      setShowSaveFeedback(true); 
      setTimeout(() => setShowSaveFeedback(false), 2500);
    }
  };

  // NUDGE (MULTI)
  const handleNudge = (dir) => {
    setFields(prev => prev.map(f => {
      // If nudging "Selected", skip non-selected items.
      if (nudgeTarget === 'single' && !selectedIds.includes(f.id)) return f;
      // If nudging "All", skip items not on the current page.
      if (nudgeTarget === 'all' && !activePages.includes(f.page)) return f;

      let { x, y } = f;
      if (dir === 'up') y -= nudgeStep; if (dir === 'down') y += nudgeStep;
      if (dir === 'left') x -= nudgeStep; if (dir === 'right') x += nudgeStep;
      return { ...f, x: Number(x.toFixed(1)), y: Number(y.toFixed(1)) };
    }));
  };

  // UPDATE PROPERTY (Single Only)
  const updateProp = (id, prop, val) => {
    const numericValue = safeParseFloat(val);
    if(!isNaN(numericValue)) setFields(prev => prev.map(f => f.id === id ? { ...f, [prop]: Number(numericValue.toFixed(1)) } : f));
  };

  // ==========================================
  // 7. RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-[#F8FAFC] flex flex-col font-sans overflow-hidden relative h-screen">
      
      {/* GLOBAL STYLES */}
      <style>{`
        @media print { 
            @page { size: landscape; margin: 0; } 
            .ui-layer { display: none !important; } 
            .print-layer { display: block !important; position: fixed; top: 0; left: 0; width: 297mm; height: 210mm; background: white; z-index: 99999; } 
            .print-item { position: absolute; font-family: Arial, sans-serif; font-size: 11pt; font-weight: bold; color: black; white-space: nowrap; overflow: hidden; display: flex; align-items: center; } 
            .print-img { object-fit: contain; width: 100%; height: 100%; } 
        }
        .custom-viewport-main::-webkit-scrollbar { width: 6px; }
        .custom-viewport-main::-webkit-scrollbar-thumb { background: #CBD5E1; border-radius: 10px; }
        
        /* PREVENT TEXT SELECTION WHEN DRAGGING */
        .select-none { user-select: none; -webkit-user-select: none; }
      `}</style>
      
      {/* 8.1 PRINT SIMULATOR (HIDDEN) */}
      <div className="print-layer hidden">
        {fields.map(f => {
            const isRightSheet = f.page === 1 || f.page === 3; 
            const pxOffset = isRightSheet ? (f.x + PAGE_WIDTH_MM) : f.x;
            return (
                <div key={f.id} className="print-item" style={{ left: `${pxOffset + calibration.x}mm`, top: `${f.y + calibration.y}mm`, width: `${f.width}mm`, height: `${f.height}mm` }}>
                    {f.dataType === 'tick_mark' ? '✓' : f.dataType === 'diagram_box' ? <img src={f.sampleData} className="print-img" alt="vis"/> : f.sampleData}
                </div>
            );
        })}
      </div>

      <div className="ui-layer flex flex-col h-full flex-1 animate-entry">
          
          {/* 8.2 HEADER */}
          <header className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm z-50">
            <div className="flex items-center gap-3 text-left">
                <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-500/10"><Layout size={20}/></div>
                <div className="leading-none">
                    <h1 className="text-lg font-black text-slate-800 tracking-tight leading-none mb-1">Layout Settings</h1>
                    <p className="text-[9px] font-bold text-blue-600 uppercase tracking-widest leading-none">Galle National Hospital</p>
                </div>
            </div>
            
            <div className="flex items-center gap-3">
               <button onClick={handleNewLayout} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase shadow-sm transition-all border border-slate-200"><FilePlus size={16}/> Remove ALL Fields</button>
               <button onClick={()=>setIsManagerOpen(true)} className="flex items-center gap-2 px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs uppercase shadow-sm transition-all border border-slate-200"><FolderOpen size={16}/> Saved Layouts</button>
               <input value={currentSchemaName} onChange={(e)=>setCurrentSchemaName(e.target.value)} className="h-10 border-2 border-slate-100 rounded-xl px-3 text-xs font-black text-center w-48 outline-none focus:border-blue-500 shadow-inner" placeholder="Layout Title" />
               <button onClick={() => setShowCalibration(true)} className="p-2.5 bg-slate-800 text-white rounded-xl shadow-md hover:bg-black transition-all active:scale-95"><SettingsIcon size={18}/></button>
               <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-[10px] uppercase shadow-xl hover:bg-blue-700 active:scale-95 transition-all"><Save size={14}/> {showSaveFeedback ? 'Saved!' : 'Save Layout'}</button>
            </div>
          </header>

          {/* 8.3 TOOLBAR */}
          <div className="bg-white border-b border-slate-200 px-8 py-3 flex justify-between items-center z-40">
             <div className="flex gap-4">
                <div className="bg-slate-100 p-1 rounded-xl flex gap-1 border border-slate-200 shadow-inner">
                    <button onClick={() => setActiveTab('outer')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'outer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Cover (1 & 4)</button>
                    <button onClick={() => setActiveTab('inner')} className={`px-4 py-2 rounded-lg text-[9px] font-black uppercase transition-all ${activeTab === 'inner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Internal (2 & 3)</button>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-xl border border-slate-200 shadow-inner">
                    <button onClick={()=>handleNudge('up')} className="p-1.5 bg-white rounded-lg hover:bg-blue-50 shadow-sm active:scale-90 transition-all"><ArrowUp size={14}/></button>
                    <button onClick={()=>handleNudge('down')} className="p-1.5 bg-white rounded-lg hover:bg-blue-50 shadow-sm active:scale-90 transition-all"><ArrowDown size={14}/></button>
                    <button onClick={()=>handleNudge('left')} className="p-1.5 bg-white rounded-lg hover:bg-blue-50 shadow-sm active:scale-90 transition-all"><ArrowLeft size={14}/></button>
                    <button onClick={()=>handleNudge('right')} className="p-1.5 bg-white rounded-lg hover:bg-blue-50 shadow-sm active:scale-90 transition-all"><ArrowRight size={14}/></button>
                    <div className="h-4 w-px bg-slate-300 mx-1"></div>
                    <button onClick={()=>setNudgeTarget('all')} className={`text-[8px] font-black uppercase px-2 py-1 rounded transition-all ${nudgeTarget==='all'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>All</button>
                    <button onClick={()=>setNudgeTarget('single')} className={`text-[8px] font-black uppercase px-2 py-1 rounded transition-all ${nudgeTarget==='single'?'bg-blue-600 text-white shadow-md':'text-slate-400'}`}>Selected</button>
                </div>
                <button onClick={openWizard} className="flex items-center gap-2 px-5 py-2 bg-slate-900 text-white rounded-xl font-bold text-[10px] uppercase hover:bg-black shadow-lg active:scale-95 transition-all"><Plus size={16}/> New Field</button>
             </div>

             <div className="flex gap-4 items-center">
                {selectedIds.length > 0 ? (
                    <div className="flex items-center gap-3 bg-blue-50 px-4 py-2 rounded-2xl border border-blue-200 animate-in slide-in-from-right-2 shadow-sm text-left">
                        {singleSelectedField ? (
                            <>
                                <div className="flex flex-col border-r border-blue-200 pr-3">
                                    <span className="text-[7px] font-black text-blue-400 uppercase leading-none mb-1 tracking-widest">Active Slot</span>
                                    <span className="text-xs font-black text-blue-800 leading-none">#{singleSelectedField.fieldNumber}</span>
                                </div>
                                <div className="flex gap-2">
                                    <div className="flex flex-col text-left"><span className="text-[6px] text-blue-400 font-bold ml-1 uppercase mb-0.5 opacity-60">X-mm</span><input type="number" step="0.1" value={singleSelectedField.x} onChange={(e)=>updateProp(singleSelectedField.id, 'x', e.target.value)} className="w-12 text-xs font-bold border rounded px-1 h-7 bg-white text-blue-900 shadow-inner" /></div>
                                    <div className="flex flex-col text-left"><span className="text-[6px] text-blue-400 font-bold ml-1 uppercase mb-0.5 opacity-60">Y-mm</span><input type="number" step="0.1" value={singleSelectedField.y} onChange={(e)=>updateProp(singleSelectedField.id, 'y', e.target.value)} className="w-12 text-xs font-bold border rounded px-1 h-7 bg-white text-blue-900 shadow-inner" /></div>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <Boxes size={16} className="text-blue-600"/>
                                <span className="text-xs font-black text-blue-800">{selectedIds.length} Items Selected</span>
                            </div>
                        )}
                        <button onClick={handleDeleteField} className="p-1.5 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 active:scale-90 shadow-sm"><Trash2 size={14}/></button>
                    </div>
                ) : (
                    <div className="px-4 py-2 bg-slate-100 border border-slate-200 rounded-xl text-[10px] font-bold text-slate-400 uppercase flex items-center shadow-inner leading-none"><MousePointer2 size={14} className="mr-2 opacity-50 animate-pulse"/> Hold Shift to Multi-Select</div>
                )}
                
             </div>
          </div>

          {/* 8.4 MAIN CANVAS */}
          <div className="flex-1 overflow-auto bg-[#EDF2F7] p-10 flex justify-center custom-viewport-main select-none" onPointerDown={() => setSelectedIds([])}>
              <div ref={canvasRef} className="relative bg-white shadow-[0_30px_60px_-12px_rgba(0,0,0,0.15)] border-[15px] border-white shrink-0 rounded-sm ring-1 ring-slate-300" 
                   style={{ width: mmToPx(PAPER_WIDTH_MM), height: mmToPx(PAPER_HEIGHT_MM) }}
                   onPointerDown={(e) => e.stopPropagation()}>
                  
                  {/* OVERLAYS */}
                  <div className="absolute inset-0 flex pointer-events-none opacity-[0.95] mix-blend-multiply select-none contrast-125 grayscale-[20%]">
                      <img src={activeTab==='outer' ? img4 : img2} className="w-1/2 h-full object-fill border-r-2 border-blue-200" alt="L"/>
                      <img src={activeTab==='outer' ? img1 : img3} className="w-1/2 h-full object-fill" alt="R"/>
                  </div>
                  <div className="absolute inset-0 pointer-events-none opacity-[0.06]" style={{ backgroundImage: `linear-gradient(#000 1.5px, transparent 1.5px), linear-gradient(90deg, #000 1.5px, transparent 1.5px)`, backgroundSize: `${mmToPx(10)}px ${mmToPx(10)}px` }}></div>

                  {/* FIELDS MAP */}
                  {activeFieldsList.map(field => {
                      const isRightSheet = field.page === 1 || field.page === 3; 
                      const horizontalPixelPos = isRightSheet ? (field.x + PAGE_WIDTH_MM) : field.x; 
                      const isSelected = selectedIds.includes(field.id);
                      
                      return (
                        <div key={field.id} className="absolute group transition-opacity duration-300 select-none" 
                             style={{ left: mmToPx(horizontalPixelPos), top: mmToPx(field.y), width: mmToPx(field.width), height: mmToPx(field.height), zIndex: isSelected ? 100 : 10 }}
                             onPointerDown={(e) => {
                                if ((e.target).closest('.resize-handle')) return; 
                                e.stopPropagation(); 
                                
                                // MULTI-SELECT LOGIC
                                let newSelection = [...selectedIds];
                                if (e.shiftKey) {
                                    if (newSelection.includes(field.id)) newSelection = newSelection.filter(id => id !== field.id);
                                    else newSelection.push(field.id);
                                } else {
                                    if (!newSelection.includes(field.id)) newSelection = [field.id];
                                }
                                setSelectedIds(newSelection);

                                // GROUP DRAG LOGIC
                                const startCX = e.clientX; const startCY = e.clientY;
                                const initialPositions = fields.filter(f => newSelection.includes(f.id)).reduce((acc, f) => ({...acc, [f.id]: {x: f.x, y: f.y}}), {});

                                const moveL = (ev) => { 
                                    const dX = pxToMm(ev.clientX - startCX); const dY = pxToMm(ev.clientY - startCY); 
                                    setFields(prev => prev.map(f => {
                                        if (newSelection.includes(f.id)) {
                                            const start = initialPositions[f.id];
                                            return { ...f, x: Number((start.x + dX).toFixed(1)), y: Number((start.y + dY).toFixed(1)) };
                                        }
                                        return f;
                                    }));
                                };
                                const upL = () => { window.removeEventListener('pointermove', moveL); window.removeEventListener('pointerup', upL); };
                                window.addEventListener('pointermove', moveL); window.addEventListener('pointerup', upL);
                             }}>
                            
                            {/* RENDER BOX CONTENT */}
                            <div className={`w-full h-full border-2 rounded-[3px] flex items-start justify-start text-left p-1.5 text-[11px] font-black cursor-move overflow-hidden leading-none bg-white/70 backdrop-blur-[2.5px] shadow-sm transition-all ${isSelected ? 'border-blue-600 ring-4 ring-blue-500/10 shadow-2xl scale-[1.01] bg-white/90' : 'border-slate-400/50 hover:border-blue-400 hover:bg-white/80'}`}>
                                {field.dataType === 'tick_mark' ? <Check size={mmToPx(field.width*0.8)} strokeWidth={6} className="text-blue-700" /> : 
                                 field.sampleData === 'LUNG_DIAGRAM' ? <img src={lungImg} className="w-full h-full object-contain opacity-50" /> :
                                 field.sampleData === 'ABDOMEN_GRID' ? (
                                    <div className="w-full h-full relative overflow-visible"><div className="absolute inset-0 z-0" style={{ clipPath: OCTAGON_PATH, background: '#ffffff' }}><div className="grid grid-cols-3 grid-rows-3 w-full h-full border border-black/30">{[...Array(9)].map((_, i) => (<div key={i} className={`border border-black/10 flex items-center justify-center ${i===1 || i===3 || i===5 ? 'bg-yellow-400/60' : ''}`}>{(i===1 || i===5) && <span className="text-[4px] font-black uppercase text-black">Soft</span>}{i===3 && <span className="text-[4px] font-black uppercase text-black">Tender</span>}</div>))}</div></div><svg className="absolute inset-0 w-full h-full z-10 pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none"><path d="M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z" fill="none" stroke="black" strokeWidth="1.5" /><line x1="33.3" y1="0" x2="33.3" y2="100" stroke="black" strokeWidth="0.5" opacity="0.2" /><line x1="66.6" y1="0" x2="66.6" y2="100" stroke="black" strokeWidth="0.5" opacity="0.2" /><line x1="0" y1="33.3" x2="100" y2="33.3" stroke="black" strokeWidth="0.5" opacity="0.2" /><line x1="0" y1="66.6" x2="100" y2="66.6" stroke="black" strokeWidth="0.5" opacity="0.2" /></svg></div>
                                 ) :
                                 field.sampleData === 'TABLE_PREVIEW' ? (
                                    <div className="w-full h-full bg-white border-2 border-black flex flex-col text-[7px] overflow-hidden shadow-inner bg-white"><div className="flex border-b border-black bg-slate-100 font-black"><div className="w-[35%] border-r border-black px-1 py-0.5 uppercase tracking-tighter">Investigation</div><div className="flex-1 border-r border-black p-0.5 text-center">Day 1</div><div className="flex-1 border-r border-black p-0.5 text-center">Day 2</div><div className="flex-1 p-0.5 text-center">Day 3</div></div><div className="flex border-b border-black bg-blue-50/40"><div className="w-[35%] border-r border-black px-1 py-0.5 font-black text-blue-800 uppercase">FBC (Hb)</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">11.4</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">12.1</div><div className="flex-1 p-0.5 text-center opacity-40">---</div></div><div className="flex border-b border-black"><div className="w-[35%] border-r border-black px-1 py-0.5 font-black uppercase">WBC</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">9.2</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">8.5</div><div className="flex-1 p-0.5 text-center opacity-40">---</div></div><div className="flex border-b border-black bg-orange-50/30"><div className="w-[35%] border-r border-black px-1 py-0.5 font-black text-orange-800 uppercase">CRP</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">12</div><div className="flex-1 border-r border-black p-0.5 text-center opacity-40">---</div><div className="flex-1 p-0.5 text-center opacity-40">---</div></div><div className="flex-1 flex flex-col">{[...Array(2)].map((_, i) => (<div key={i} className="flex border-b border-black/10"><div className="w-[35%] border-r border-black/10 h-3"></div><div className="flex-1 border-r border-black/10"></div><div className="flex-1 border-r border-black/10"></div><div className="flex-1"></div></div>))}</div><div className="bg-slate-50 p-0.5 text-[5px] text-center font-bold text-slate-400 uppercase italic">Dynamic Mapping Zone</div></div>
                                 ) :
                                 field.sampleData}
                            </div>

                            <div className={`absolute top-0 left-0 bg-blue-600 text-white text-[7px] px-1.5 py-0.5 font-black uppercase transition-opacity rounded-br ${isSelected ? 'opacity-100' : 'opacity-0'}`}>#{field.fieldNumber}</div>
                            
                            <div className={`resize-handle absolute bottom-0 right-0 bg-red-600 cursor-nwse-resize rounded-tl-lg z-[110] ${field.dataType === 'tick_mark' ? 'scale-0' : (isSelected ? 'scale-100 opacity-100' : 'scale-0 group-hover:scale-75 group-hover:opacity-100')}`}
                                 onPointerDown={(e) => { 
                                    e.stopPropagation(); e.preventDefault(); 
                                    const sW = field.width; const sH = field.height; const startCX = e.clientX; const startCY = e.clientY; 
                                    const moveResize = (ev) => { 
                                        const dW = pxToMm(ev.clientX - startCX); const dH = pxToMm(ev.clientY - startCY); 
                                        setFields(prev => prev.map(f => f.id === field.id ? { ...f, width: Math.max(2, Number((sW + dW).toFixed(1))), height: Math.max(2, Number((sH + dH).toFixed(1))) } : f)); 
                                    }; 
                                    const upResize = () => { window.removeEventListener('pointermove', moveResize); window.removeEventListener('pointerup', upResize); }; 
                                    window.addEventListener('pointermove', moveResize); window.addEventListener('pointerup', upResize); 
                                 }}>
                                {field.dataType !== 'tick_mark' && <Scaling size={12} className="text-white"/>}
                            </div>
                        </div>
                      );
                  })}
              </div>
          </div>
      </div>

      <AnimatePresence>
        {isWizardOpen && (
           <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1000] flex items-center justify-center p-4">
              <motion.div initial={{scale:0.95, y:30}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} className="bg-white rounded-[40px] shadow-2xl max-w-3xl w-full border border-white/20 overflow-hidden flex flex-col">
                 <div className="px-10 py-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shadow-sm text-left leading-none">
                    <div className="flex items-center gap-4"><div className="p-3 bg-slate-900 text-white rounded-2xl shadow-lg"><Plus size={22}/></div><div><h3 className="text-2xl font-black uppercase text-slate-800 tracking-tighter leading-none mb-1">Deployment Wizard</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Step {wizardStep} of 3</p></div></div>
                    <button onClick={() => setIsWizardOpen(false)} className="p-3 hover:bg-slate-200 rounded-full text-slate-400 hover:text-red-500 transition-all active:scale-90"><X size={28}/></button>
                 </div>
                 <div className="p-10 bg-white min-h-[400px] overflow-y-auto custom-viewport-main">
                    
                    {wizardStep === 1 && (
                        <div className="space-y-6 animate-entry">
                            <h4 className="text-lg font-bold text-slate-700 text-left border-l-4 border-blue-600 pl-4 uppercase tracking-tighter leading-none mb-6">Select Mapping Identifier</h4>
                            
                            <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3 pb-10">
                                {Array.from({ length: 37 }, (_, i) => i + 1).map(num => { 
                                   const isUsed = usedFieldNumbers.includes(num); 
                  const info = FIELD_DEFINITIONS[num];
                  const isSmart = SMART_GROUP_IDS.includes(num);

                  // 1. HIDE 24-28 (Merged into 23)
                  if ([24, 25, 26, 28,27].includes(num)) return null;

                  // 2. RENAME 23
                  let displayNum = num;
                  let displayName = info?.name;
                  if (num === 23) {
                      displayNum = "23-28";
                      displayName = "HISTORY MASTER SUITE";
                  }

                  return (
                      <button 
                          key={num} 
                          disabled={isUsed} 
                          onClick={() => handleSelectNumber(num)} 
                          className={`h-24 rounded-2xl border-2 font-black text-sm transition-all active:scale-95 flex flex-col items-center justify-center p-2 text-center shadow-sm relative group overflow-hidden 
                              ${isUsed 
                                  ? 'bg-slate-50 border-slate-100 text-slate-300' 
                                  : isSmart || num === 23
                                      ? 'bg-purple-50/50 border-purple-200 text-purple-700 hover:border-purple-500 hover:shadow-md' 
                                      : 'border-slate-200 text-slate-600 hover:border-blue-600 hover:bg-blue-50' 
                              }`}
                      >
                          <span className="text-xl group-hover:scale-110 transition-transform leading-none mb-1">{displayNum}</span>
                          {displayName && <span className="text-[8px] uppercase font-black opacity-70 leading-tight line-clamp-2">{displayName}</span>}
                          
                          {(isSmart || num === 23) && !isUsed && (
                              <div className="absolute top-1.5 right-1.5 opacity-40"><BoxSelect size={12}/></div>
                          )}
                      </button>
                  );
                                })}
                            </div>
                        </div>
                    )}
                    
                    {wizardStep === 10 && (
                        <div className="space-y-6 text-center animate-entry flex flex-col items-center justify-center h-full">
                            <div className="p-12 bg-purple-50 rounded-[50px] border-4 border-purple-100 inline-block mb-4 shadow-xl shadow-purple-500/10 text-left relative overflow-hidden">
                                <Boxes size={70} className="text-purple-600 mx-auto mb-6 animate-pulse"/>
                                <h4 className="text-3xl font-black text-slate-800 mb-2 uppercase tracking-tighter leading-none">Smart Group Detected</h4>
                                <div className="text-purple-500 font-black uppercase tracking-widest text-[10px] mb-6 leading-none">
   Deploying Complex Module #{newFieldNumber}
</div>
                                <div className="space-y-3">
                                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-purple-100"><CheckCircle className="text-purple-500" size={18}/><span className="text-xs font-black text-slate-700 uppercase leading-none">Multi-Box Array Configuration</span></div>
                                    <div className="flex items-center gap-3 bg-white p-4 rounded-xl shadow-sm border border-purple-100"><CheckCircle className="text-purple-500" size={18}/><span className="text-xs font-black text-slate-700 uppercase leading-none">Auto-Mapped IDs & Logic</span></div>
                                </div>
                            </div>
                            <button onClick={finalizeFieldCreation} className="w-full max-w-sm h-16 bg-purple-600 text-white rounded-[24px] font-black text-sm uppercase shadow-xl hover:bg-purple-700 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-purple-200"><Maximize size={24}/> Deploy Smart Group</button>
                        </div>
                    )}

                    {wizardStep === 2 && (<div><div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-entry pt-10">{DATA_TYPE_OPTIONS.map(opt => (<button key={opt.type} onClick={() => { setNewDataType(opt.type); setWizardStep(3); }} className="p-6 border-2 border-slate-100 rounded-[28px] hover:border-blue-600 hover:bg-blue-50 text-left flex items-start gap-4 transition-all group shadow-sm"><div className="p-3 bg-white rounded-2xl text-slate-400 group-hover:text-blue-600 shadow-sm border border-slate-100"><opt.icon size={24}/></div><div><span className="text-sm font-black uppercase text-slate-800 block mb-1 leading-none">{opt.label}</span><span className="text-[11px] text-slate-400 font-bold leading-tight">{opt.description}</span></div></button>))}</div></div>)}
                    {wizardStep === 3 && (<div className="space-y-8 animate-entry text-center flex flex-col items-center justify-center h-full"><div className="bg-slate-50 p-16 rounded-[60px] border-4 border-white w-full relative shadow-inner text-center"><div className="absolute top-0 right-0 p-8 opacity-5"><Layers size={100}/></div><p className="font-bold text-sm text-slate-400 mb-8 uppercase tracking-[0.4em] leading-none">Coordinate reference Injection</p><input autoFocus value={newSampleData} onChange={(e) => setNewSampleData(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && finalizeFieldCreation()} className="w-full border-4 border-white rounded-3xl h-24 px-10 font-black text-4xl outline-none focus:border-blue-500 shadow-2xl text-center text-slate-800 transition-all" placeholder="DEMO DATA"/><p className="text-xs font-bold text-slate-400 mt-8 opacity-60 italic leading-none tracking-widest uppercase">This data serves as visual anchor for coordinate mapping</p></div><button onClick={finalizeFieldCreation} className="w-full max-w-sm h-16 bg-blue-600 text-white rounded-[24px] font-black text-sm uppercase shadow-xl hover:bg-blue-700 flex items-center justify-center gap-3 active:scale-95 transition-all shadow-blue-100"><CheckCircle size={24}/> Inject Profile</button></div>)}
                 </div>
              </motion.div>
           </motion.div>
        )}

        {isManagerOpen && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 text-left">
              <motion.div initial={{scale:0.95, y:30}} animate={{scale:1, y:0}} exit={{scale:0.95, y:20}} className="bg-white rounded-[60px] shadow-2xl max-w-3xl w-full border border-white/20 overflow-hidden flex flex-col h-[750px]">
                 <div className="px-12 py-10 border-b border-slate-100 bg-white sticky top-0 z-10 shadow-sm flex flex-col gap-6">
                    <div className="flex justify-between items-center mb-4 leading-none"><div className="flex items-center gap-5"><div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-lg shadow-emerald-500/10 flex items-center justify-center"><FolderOpen size={28}/></div><h3 className="text-3xl font-black uppercase text-slate-800 tracking-tighter leading-none">Saved Layouts</h3></div><button onClick={() => setIsManagerOpen(false)} className="p-3 hover:bg-slate-100 rounded-full text-slate-400 transition-all active:scale-90 shadow-sm leading-none"><X size={24}/></button></div>
                    <div className="relative group leading-none"><Search size={24} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors"/><input value={managerSearch} onChange={(e)=>setManagerSearch(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-3xl py-6 pl-16 pr-8 font-black text-sm text-slate-700 outline-none focus:border-blue-400 focus:bg-white shadow-inner transition-all leading-none shadow-blue-500/5" placeholder="Search saved clinical profiles..."/></div>
                 </div>
                 <div className="p-10 overflow-y-auto bg-slate-50/50 flex-1 custom-viewport-main leading-none text-left">
                    {savedSchemas.filter(s => (s.profile_name || "").toLowerCase().includes(managerSearch.toLowerCase())).length === 0 ? (
                        <div className="text-center py-12 opacity-30 flex flex-col items-center"><FolderOpen size={64} className="mb-4"/><p className="font-black text-lg uppercase leading-none">Archive Empty</p></div>
                    ) : (
                        savedSchemas.filter(s => (s.profile_name || "").toLowerCase().includes(managerSearch.toLowerCase())).map(s => (
                            <div key={s.id} className="bg-white p-7 rounded-[3rem] border border-slate-100 shadow-lg mb-6 flex justify-between items-center hover:border-blue-400 hover:shadow-xl transition-all group overflow-hidden relative">
                                <div>
  {/* 1. THE LAYOUT NAME (The part that was missing) */}
  <h4 className="font-black text-slate-800 text-xl group-hover:text-blue-900 transition-colors uppercase tracking-tight leading-none mb-1">
    {s.profile_name}
  </h4>

  {/* 2. THE INFO ROW (Fixed with no nesting errors) */}
  <div className="flex gap-4">
    <p className="text-[10px] text-slate-400 uppercase font-black leading-none flex items-center gap-2">
      <Calendar size={12}/> Deploy Date: {new Date(s.lastModified).toLocaleDateString()}
    </p>
   <p className="text-[10px] text-slate-400 uppercase font-black leading-none flex items-center gap-2">
    <Layers size={12}/> Modules: {JSON.parse(s.coordinates || '[]').length}
</p>
  </div>
</div>
                                <div className="flex gap-3 relative z-10 scale-90 group-hover:scale-100 transition-all duration-300 leading-none"><button onClick={()=>handleLoad(s)} className="p-4 bg-blue-50 text-blue-600 rounded-2xl hover:bg-blue-600 hover:text-white transition-all shadow-sm active:scale-90" title="Load Alignment Data"><ArrowRight size={24}/></button><button onClick={()=>handleDuplicateLayout(s)} className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm active:scale-90" title="Duplicate Profile"><Copy size={24}/></button><button 
  onClick={() => handleDeleteSavedLayout(s.id)} 
  className="p-4 bg-red-50 text-red-600 rounded-2xl hover:bg-red-600 hover:text-white transition-all shadow-sm active:scale-90" 
  title="Authorize Wipe"
>
  <Trash2 size={24}/>
</button></div>
                            </div>
                        ))
                    )}
                 </div>
              </motion.div>
            </motion.div>
        )}

        {showCalibration && (
            <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-[1200] flex items-center justify-center p-4">
              <motion.div initial={{scale:0.95}} animate={{scale:1}} className="bg-white rounded-[4rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/20">
                 <div className="p-10 border-b border-slate-100 bg-slate-50 flex items-center gap-6 shadow-sm text-left"><div className="p-4 bg-slate-900 text-white rounded-3xl shadow-lg flex items-center justify-center"><SettingsIcon size={28}/></div><div><h3 className="text-xl font-black uppercase text-slate-800 tracking-tighter leading-none mb-1">Hardware Sync</h3><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Coordinate Offset Master</p></div></div>
                 <div className="p-12 space-y-10 text-center leading-none">
                    <div><label className="block text-[11px] font-black text-slate-500 uppercase mb-5 tracking-[0.3em] leading-none">Global Horizontal Offset (mm)</label><div className="flex items-center gap-6 leading-none"><ArrowLeft size={24} className="text-slate-300"/><input type="number" step="1" value={calibration.x} onChange={(e) => setCalibration({...calibration, x: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-3xl text-center outline-none focus:border-blue-400 shadow-inner transition-all leading-none shadow-blue-500/5" /><ArrowRight size={24} className="text-slate-300"/></div></div>
                    <div><label className="block text-[11px] font-black text-slate-500 uppercase mb-5 tracking-[0.3em] leading-none">Global Vertical Offset (mm)</label><div className="flex items-center gap-6 leading-none"><ArrowUp size={24} className="text-slate-300"/><input type="number" step="1" value={calibration.y} onChange={(e) => setCalibration({...calibration, y: Number(e.target.value)})} className="w-full p-6 bg-slate-50 border-4 border-slate-100 rounded-[2.5rem] font-black text-3xl text-center outline-none focus:border-blue-400 shadow-inner transition-all leading-none shadow-blue-500/5" /><ArrowDown size={24} className="text-slate-300"/></div></div>
                 </div>
                 <div className="p-10 bg-slate-50 border-t flex gap-5 leading-none"><button onClick={() => setShowCalibration(false)} className="flex-1 py-5 bg-white border-2 border-slate-200 rounded-3xl font-black text-xs text-slate-500 uppercase active:scale-90 shadow-sm transition-all leading-none">Abort Sync</button><button onClick={saveCalibration} className="flex-1 py-5 bg-slate-900 text-white rounded-3xl font-black text-xs uppercase shadow-xl active:scale-95 transition-all hover:bg-black leading-none shadow-slate-900/10">Authorize Sync</button></div>
              </motion.div>
            </div>
        )}

        {modalOpen && modalConfig && (
            <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[1500] flex items-center justify-center p-4">
              <motion.div initial={{scale:0.9, y:20}} animate={{scale:1, y:0}} className="bg-white p-12 rounded-[4rem] shadow-2xl max-w-sm w-full text-center relative overflow-hidden border border-white/20">
                <div className={`absolute top-0 left-0 w-full h-4 bg-gradient-to-r ${modalConfig.type==='danger'?'from-red-600 to-orange-400':'from-blue-600 to-cyan-400'}`}></div>
                <div className={`p-8 rounded-full mb-8 mx-auto w-fit shadow-2xl ${modalConfig.type==='danger'?'bg-red-50 text-red-500 shadow-red-200':'bg-blue-50 text-blue-500 shadow-blue-100'}`}>{modalConfig.type==='danger' ? <ShieldAlert size={50}/> : <AlertTriangle size={50}/>}</div>
                <h3 className="text-3xl font-black uppercase text-slate-900 mb-3 tracking-tighter leading-tight leading-none tracking-tighter">{modalConfig.title}</h3><p className="text-slate-500 font-bold text-sm mb-10 leading-relaxed px-2 uppercase italic leading-none tracking-tight">{modalConfig.message}</p>
                <div className="flex gap-4">
                    <button onClick={() => setModalOpen(false)} className="flex-1 py-5 rounded-[2rem] font-black text-[11px] uppercase bg-slate-100 text-slate-500 shadow-inner active:scale-90 transition-all leading-none">Cancel</button>
                    <button onClick={() => { modalConfig.action(); setModalOpen(false); }} className={`flex-1 py-5 rounded-[2rem] font-black text-[11px] uppercase text-white shadow-xl active:scale-95 transition-all ${modalConfig.type==='danger'?'bg-red-600 shadow-red-200':'bg-blue-600 shadow-blue-100'}`}>Yes</button>
                </div>
              </motion.div>
            </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showSaveFeedback && (
            <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: -50, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="fixed bottom-0 left-1/2 -translate-x-1/2 z-[2000] px-10 py-5 bg-slate-900 text-white rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.4)] flex items-center gap-5 border border-slate-700">
                <div className="p-2 bg-emerald-500 rounded-full shadow-lg shadow-emerald-500/50 flex items-center justify-center leading-none shadow-inner"><CheckCircle size={24}/></div>
                <div className="flex flex-col text-left leading-none"><span className="text-xs font-black uppercase tracking-[0.2em] leading-none mb-1">saved successfully.</span><span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-none">The layout configuration has been saved successfully.</span></div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Settings;
