 // @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  User, FileText, Stethoscope, Save, Activity, HeartPulse, 
  ChevronRight, ChevronLeft, Thermometer, Wind, ShieldAlert, 
  Check, Settings, Trash2, Plus, AlertTriangle, X, ChevronDown, 
  AlertCircle, Search, Clock, Pill, Minus, RotateCcw, Printer, 
  CheckCircle, Eye, FilePlus, Layout, Share2, ClipboardCheck, ClipboardList,
  Map as MapIcon // FIXED: Renamed to prevent crash
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT THE BRIDGE
// Ensure 'src/PrintMapping.ts' exists and exports getPrintData
import { getPrintData } from '../PrintMapping'; 

// IMPORTING THE LUNG IMAGE
import lungImg from '../assets/lung.png';

// Define the exact Octagon shape path for CSS clip-path
const OCTAGON_PATH = "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";

// --- HELPER: AUTO FONT SIZE ---
const getAutoFontSize = (text: string | boolean) => {
  if (typeof text !== 'string') return '11px';
  const len = text.length;
  if (len < 10) return '11px'; 
  if (len < 20) return '10px'; 
  if (len < 40) return '9px';  
  if (len < 60) return '8px';  
  return '7px';                 
};

// --- DUMMY INITIAL TEMPLATES ---
const INITIAL_TEMPLATES = [
  { id: 1, name: "Appendectomy (Routine)", content: "Procedure: Appendectomy\nIndication: Acute Appendicitis\nIncision: Lanz\nFindings: Inflamed appendix, base healthy.\nClosure: Layered closure." },
  { id: 2, name: "Hernia Repair (Inguinal)", content: "Procedure: Lichtenstein Repair\nSide: Right\nFindings: Direct sac, reduced.\nMesh: Prolene mesh fixed." }
];

// --- CONSTANTS FOR TABLE RESET ---
const INITIAL_INV_ROWS = [
  { id: 'fbs', name: 'FBS' },
  { id: 'crp', name: 'CRP' },
  { id: 'scr', name: 'S.Cr²' },
  { id: 'tsh', name: 'TSH' }
];

const INITIAL_FBC_LABELS = {
  main: 'FBC', hb: 'Hb', wbc: 'WBC', n: 'N', l: 'L', plt: 'PLT'
};

const Admission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const editId = searchParams.get('id');    
  
  const [activeStep, setActiveStep] = useState(1);
  const [entryMode, setEntryMode] = useState<'routine' | 'op_note'>('routine');
  const [isSaving, setIsSaving] = useState(false); 

  // --- MESSAGE MODAL STATE (Theme-Consistent Dialog) ---
  const [msgModal, setMsgModal] = useState<{ show: boolean, type: 'success' | 'error', title: string, message: string } | null>(null);

  // ==========================================
  // 1. DYNAMIC DATA STATE
  // ==========================================
  const [consultants, setConsultants] = useState([
    "Prof. Ranjan Senevirathna",
    "Dr. Vidu Ruchira de Silva",
    "Dr. J.P.M Kumarasinghe"
  ]);
  const [showManageConsultants, setShowManageConsultants] = useState(false);
  const [newConsultant, setNewConsultant] = useState("");
  const [doctorToDelete, setDoctorToDelete] = useState<string | null>(null);

  // --- TEMPLATE STATE ---
  const [templates, setTemplates] = useState(INITIAL_TEMPLATES);
  const [showTemplateList, setShowTemplateList] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<number | null>(null);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateContent, setNewTemplateContent] = useState("");

  // --- INVESTIGATIONS TABLE STATE (FIELD 31) ---
  const [invDays, setInvDays] = useState(["Day 1"]); 
  const [fbcLabels, setFbcLabels] = useState(INITIAL_FBC_LABELS);
  const [invRows, setInvRows] = useState(INITIAL_INV_ROWS); 
  const [invData, setInvData] = useState<Record<string, Record<number, string>>>({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // ==========================================
  // 1.5 PRINTING STATE
  // ==========================================
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState<any[]>([]);
  const [printItems, setPrintItems] = useState<any[]>([]);
  const [printMode, setPrintMode] = useState<'outer' | 'inner'>('outer');

  // ==========================================
  // 2. FORM DATA STATE
  // ==========================================
  const [formData, setFormData] = useState({
    hospitalName: 'National Hospital Galle', 
    phn: '', contactNo: '', nic: '', bloodGroup: '', 
    
    // --- FIELD 6: ALLERGIES ---
    allergies: {
      food: 'Negative',      
      plaster: 'Negative',   
      drug: 'Negative',      
      selectedDrugs: [] as string[], 
      otherDrug: ''          
    },

    patientName: '', bhtNo: '', ward: '', age: '', sex: '', 
    admissionDate: new Date().toISOString().split('T')[0], 
    dischargeDate: new Date().toISOString().split('T')[0], 
    principalDiagnosis: '', comorbidities: '', 
    modeOfAdmission: 'Self', referringDoctor: '', transferInHospital: '',     
    modeOfDischarge: 'Routine', transferOutHospital: '',   
    diseaseNotification: 'Yes', medicalCertificate: 'No', insuranceForm: 'No', 
    consultant: '', moName: '', 
    
    // --- STEP 2: HISTORY ---
    presentingComplaint: '', 
    historyOfComplaint: '', 
    pastMedicalHistory: '', 
    pastSurgicalHistory: '', 
    allergyHistory: '', 
    allergyRemarks: {} as Record<string, string>,
    socialHistory: '', 
    
    // --- STEP 3: EXAMINATION ---
    generalExam: { 
      pale: false, icterus: false, ankleEdema: false,
      otherFindings: [] as string[] 
    }, 
    
    cvs: { 
      pulse: '', 
      bpSys: '', bpDia: '', 
      otherFindings: [] as string[] 
    }, 
    
    resp: { 
      rightLung: { airEntry: 'Equal', sound: 'Clear', other: '' }, 
      leftLung: { airEntry: 'Equal', sound: 'Clear', other: '' } 
    }, 
    
    abdomen: { 
      quadrants: [null, null, null, null, null, null, null, null, null] as (string | null)[],
      additionalNotes: '',
      dre: {
        hardStools: false, bloodStained: false, emptyRectum: false, melena: false, 
        enlargedProstate: false, mass: false, otherFindings: [] as string[]
      }
    }, 
    
    cns: { gcs: '', other: '' }, 
    
    // --- STEP 4 ---
    managementNotes: '', 
    specialInvestigations: '', 
    
    // --- FIELD 30: OP NOTE ---
    opNote: {
        templateSearch: '',
        content: '', 
        duration: '',
        drugsGiven: ''
    },

    conditionAtDischarge: '', medicationsOnDischarge: '', 
    dischargePlan: '', instructionsSinhalaTamil: '', referralNote: '' 
  });

  // Local state for temporary inputs
  const [tempGeneralFinding, setTempGeneralFinding] = useState("");
  const [tempCVSFinding, setTempCVSFinding] = useState("");
  const [tempOtherDrug, setTempOtherDrug] = useState(""); 
  const [tempDREFinding, setTempDREFinding] = useState("");

  const [allergySummary, setAllergySummary] = useState("No known allergies.");
// ==========================================
  // 2.2 AUTO-SAVE DRAFT SYSTEM (Fix for Accidental Navigation)
  // ==========================================
  
  useEffect(() => {
    // Only load draft if we are doing a NEW admission (not editing an old one)
    if (!editId) {
      const savedDraft = sessionStorage.getItem('admission_draft');
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          setFormData(parsed);
          // Optional: Show a small toast saying "Draft Restored"
        } catch (e) {
          console.error("Failed to restore draft", e);
        }
      }
    }
  }, [editId]);

  // 2. AUTO-SAVE: Save data to memory whenever it changes
  useEffect(() => {
    if (!editId) { // Only auto-save drafts for new admissions
        const timer = setTimeout(() => {
            sessionStorage.setItem('admission_draft', JSON.stringify(formData));
        }, 500); // Wait 0.5s after typing stops (Performance)
        return () => clearTimeout(timer);
    }
  }, [formData, editId]);
  // ==========================================
  // 2.5 DATABASE LOADING
  // ==========================================
  
  // Load data if editing
  useEffect(() => {
    if (editId) {
      const load = async () => {
        try {
          if (window.api && window.api.getPatientById) {
             const data = await window.api.getPatientById(editId);
if (data) {
    setFormData({
        ...data,
        // Maps database keys back to your Form variables
        patientName: data.patient_name || data.patientName || "",
        nic: data.nic_no || data.nic || "",
        bhtNo: data.bht_no || data.bhtNo || "",
        ward: data.ward || ""
    });
}          }
        } catch (e) { console.error("Failed to load patient", e); }
      };
      load();
    }
  }, [editId]);

  // Effect for Allergies Summary
  useEffect(() => {
    const parts = [];
    if (formData.allergies.food === 'Positive') parts.push("Food");
    if (formData.allergies.plaster === 'Positive') parts.push("Plaster");
    if (formData.allergies.drug === 'Positive') {
      const drugs = formData.allergies.selectedDrugs.join(", ");
      if (drugs) parts.push(`Drug: ${drugs}`);
    }
    setAllergySummary(parts.length > 0 ? parts.join(", ") : "No known allergies.");
  }, [formData.allergies]);

// ==========================================
  // 2.9 VALIDATION HELPER (Strict Rules)
  // ==========================================
  const validateForm = () => {
    
    // Rule 1: Name and BHT cannot be empty
    if (!formData.patientName?.trim() || !formData.bhtNo?.trim()) {
        setMsgModal({
            show: true, type: 'error', title: 'Missing Details',
            message: 'Patient Name and BHT Number are required.'
        });
        return false;
    }

    // Rule 2: Contact Number must be EXACTLY 10 digits
    // (Removed the check that allowed empty fields)
    if (!formData.contactNo || formData.contactNo.length !== 10) {
        setMsgModal({
            show: true, type: 'error', title: 'Invalid Contact Number',
            message: 'The Contact Number must contain exactly 10 digits.'
        });
        return false;
    }

    // Rule 3: NIC cannot be lesser than 10 characters
    // (Removed the check that allowed empty fields)
    if (!formData.nic || formData.nic.length < 10) {
        setMsgModal({
            show: true, type: 'error', title: 'Invalid NIC',
            message: 'The NIC Number must be 10 characters or more.'
        });
        return false;
    }

    // All rules passed
    return true;
  };

  // ==========================================
  // 3. HANDLERS
  // ==========================================
// --- DATABASE SAVE HANDLER ---
const handleSaveRecord = async () => {
    // 1. RUN VALIDATION
    if (!validateForm()) return; 

    setIsSaving(true);
    try {
        // We create a clean object with names the Database/Dashboard understand
        const patientPayload = {
    ...formData, 
    id: editId || `pid_${Date.now()}`, 
    // These specific keys are what main.cjs and Dashboard are now looking for
    patientName: formData.patientName,
    nic: formData.nic,
    bhtNo: formData.bhtNo,
    ward: formData.ward,
    admissionDate: formData.admissionDate,
    lastModified: Date.now()
};

        if (window.api && window.api.savePatient) {
            // This sends the data through the Bridge to main.cjs
            const result = await window.api.savePatient(patientPayload);
            
            if (result.status === 'success') {
                sessionStorage.removeItem('admission_draft'); 
                setMsgModal({
                    show: true,
                    type: 'success',
                    title: 'Record Saved!',
                    message: 'The data has successfully crossed the bridge to the database.'
                });
            }
        } else {
            setMsgModal({ show: true, type: 'error', title: 'Bridge Error', message: 'The API bridge (preload) is not responding.' });
        }
    } catch (error: any) {
        setMsgModal({ show: true, type: 'error', title: 'Save Failed', message: error.message });
    } finally {
        setIsSaving(false);
    }
  };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    let finalValue: any = value;
    if (name === 'contactNo') finalValue = value.replace(/[^0-9]/g, '');
    if (name === 'phn') finalValue = value.replace(/[^0-9]/g, ''); // Ensure PHN is also numbers only
    if (name === 'nic') finalValue = value.replace(/[^0-9vVxX]/g, '').toUpperCase();
    if (name === 'bhtNo') finalValue = value.replace(/[^0-9]/g, '');
    const checked = (e.target as HTMLInputElement).checked;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : finalValue }));
  };

  const handleAllergyStatus = (type: 'food' | 'drug' | 'plaster', status: 'Positive' | 'Negative') => {
    setFormData(prev => {
        const newRemarks = { ...prev.allergyRemarks };
        if (status === 'Positive') {
            const label = type.charAt(0).toUpperCase() + type.slice(1);
            if (!newRemarks[type]) newRemarks[type] = `${label} Allergy - `;
        }
        return { ...prev, allergies: { ...prev.allergies, [type]: status }, allergyRemarks: newRemarks };
    });
  };

  const handleDrugSelection = (drug: string) => {
    setFormData(prev => {
      const currentList = prev.allergies.selectedDrugs;
      const newList = currentList.includes(drug) ? currentList.filter(d => d !== drug) : [...currentList, drug];
      const newRemarks = { ...prev.allergyRemarks };
      if (!currentList.includes(drug) && !newRemarks[drug]) newRemarks[drug] = `${drug} Allergy - `;
      return { ...prev, allergies: { ...prev.allergies, selectedDrugs: newList }, allergyRemarks: newRemarks };
    });
  };

  const addCustomDrug = () => {
    const drugName = tempOtherDrug.trim();
    if (!drugName) return;
    setFormData(prev => {
        const newRemarks = { ...prev.allergyRemarks };
        if (!newRemarks[drugName]) newRemarks[drugName] = `${drugName} Allergy - `;
        return { ...prev, allergies: { ...prev.allergies, selectedDrugs: [...prev.allergies.selectedDrugs, drugName] }, allergyRemarks: newRemarks };
    });
    setTempOtherDrug(""); 
  };

  const handleAllergyRemarkChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, allergyRemarks: { ...prev.allergyRemarks, [key]: value } }));
  };

  const handleNestedChange = (section: keyof typeof formData, field: string, value: any) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section] as object, [field]: value } }));
  };

  // --- OP NOTE TEMPLATE HANDLERS ---
  const handleOpNoteChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, opNote: { ...prev.opNote, [field]: value } }));
    if (field === 'templateSearch') setShowTemplateList(true);
  };

  const selectTemplate = (template: { name: string, content: string }) => {
    setFormData(prev => ({
        ...prev,
        opNote: {
            ...prev.opNote,
            templateSearch: template.name,
            content: template.content
        }
    }));
    setShowTemplateList(false);
  };

  const requestDeleteTemplate = (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setTemplateToDelete(id);
  };

  const confirmDeleteTemplate = () => {
    if (templateToDelete) {
        setTemplates(prev => prev.filter(t => t.id !== templateToDelete));
        setTemplateToDelete(null);
    }
  };

  const saveNewTemplate = () => {
    if (newTemplateName && newTemplateContent) {
        const newTemp = { id: Date.now(), name: newTemplateName, content: newTemplateContent };
        setTemplates([...templates, newTemp]);
        setFormData(prev => ({ ...prev, opNote: { ...prev.opNote, templateSearch: newTemp.name, content: newTemp.content } }));
    }
    setShowTemplateModal(false);
    setNewTemplateName("");
    setNewTemplateContent("");
  };

  const filteredTemplates = templates.filter(t => 
    t.name.toLowerCase().includes(formData.opNote.templateSearch.toLowerCase())
  );

  // --- INVESTIGATIONS TABLE HANDLERS ---
  const addInvDay = () => {
    setInvDays(prev => [...prev, `Day ${prev.length + 1}`]);
  };

  const removeInvDay = () => {
    if (invDays.length > 1) {
        setInvDays(prev => prev.slice(0, -1));
    }
  };

  const addInvRow = () => {
    const newId = `custom_${Date.now()}`;
    setInvRows(prev => [...prev, { id: newId, name: "" }]);
  };

  const removeInvRow = (id: string) => {
    setInvRows(prev => prev.filter(r => r.id !== id));
  };

  const updateInvRowName = (id: string, newName: string) => {
    setInvRows(prev => prev.map(r => r.id === id ? { ...r, name: newName } : r));
  };
  
  const updateFbcLabel = (key: keyof typeof fbcLabels, val: string) => {
    setFbcLabels(prev => ({ ...prev, [key]: val }));
  };

  const updateInvData = (rowId: string, dayIndex: number, val: string) => {
    setInvData(prev => ({
        ...prev,
        [rowId]: {
            ...(prev[rowId] || {}),
            [dayIndex]: val
        }
    }));
  };

  // --- NEW RESET HANDLER (TRIGGERS MODAL) ---
  const handleResetRequest = () => {
    setShowResetConfirm(true);
  };

  const confirmResetTable = () => {
    setInvData({});                   // 1. Clear Data
    setInvDays(["Day 1"]);            // 2. Reset Days
    setInvRows(INITIAL_INV_ROWS);     // 3. Restore Default Rows
    setFbcLabels(INITIAL_FBC_LABELS); // 4. Reset Labels
    setShowResetConfirm(false);       // 5. Close Modal
  };

  // --- ABDOMEN ---
  const handleAbdomenClick = (index: number) => {
    if (!formData.abdomen.quadrants[index]) updateQuadrant(index, 'Tender');
  };

  const updateQuadrant = (index: number, value: string | null) => {
    const newQuads = [...formData.abdomen.quadrants];
    newQuads[index] = value;
    setFormData(prev => ({ ...prev, abdomen: { ...prev.abdomen, quadrants: newQuads } }));
  };

  const addFinding = (section: 'generalExam' | 'cvs', value: string, setter: React.Dispatch<React.SetStateAction<string>>) => {
    if (!value.trim()) return;
    setFormData(prev => ({ ...prev, [section]: { ...prev[section] as any, otherFindings: [...(prev[section] as any).otherFindings, value] } }));
    setter("");
  };

  const removeFinding = (section: 'generalExam' | 'cvs', index: number) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section] as any, otherFindings: (prev[section] as any).otherFindings.filter((_:any, i:number) => i !== index) } }));
  };

  const handleRespChange = (side: 'rightLung' | 'leftLung', field: string, value: string) => {
    setFormData(prev => ({ ...prev, resp: { ...prev.resp, [side]: { ...prev.resp[side], [field]: value } } }));
  };

  const handleDRECheckbox = (field: string, value: boolean) => {
    setFormData(prev => ({ ...prev, abdomen: { ...prev.abdomen, dre: { ...prev.abdomen.dre, [field]: value } } }));
  };

  const addDREFinding = () => {
    if (!tempDREFinding.trim()) return;
    setFormData(prev => ({ ...prev, abdomen: { ...prev.abdomen, dre: { ...prev.abdomen.dre, otherFindings: [...prev.abdomen.dre.otherFindings, tempDREFinding] } } }));
    setTempDREFinding(""); 
  };

  const removeDREFinding = (index: number) => {
    setFormData(prev => ({ ...prev, abdomen: { ...prev.abdomen, dre: { ...prev.abdomen.dre, otherFindings: prev.abdomen.dre.otherFindings.filter((_, i) => i !== index) } } }));
  };

  const handleAddConsultant = () => { if (newConsultant.trim()) { setConsultants([...consultants, newConsultant.trim()]); setNewConsultant(""); } };
  const confirmDeleteConsultant = () => { if (doctorToDelete) { setConsultants(consultants.filter(c => c !== doctorToDelete)); setDoctorToDelete(null); } };

  // ==========================================
  // 3.5 PRINT HANDLERS (UPDATED FOR INNER/OUTER)
  // ==========================================
  const handleOpenPrintModal = (mode: 'outer' | 'inner') => {
    // RUN VALIDATION BEFORE PRINTING
    if (!validateForm()) return; // Block printing if invalid

    setPrintMode(mode); // Set the mode before opening
    const loaded = localStorage.getItem('hospital_layouts_master_db'); 
    if (loaded) {
      setSavedLayouts(JSON.parse(loaded));
    }
    setIsPrintModalOpen(true);
  };

  const handlePrintExecution = (layout: any) => {
    const mappedData = getPrintData(formData as any); 
    const PAGE_WIDTH_MM = 148.5; // (297mm / 2)

    // Determine which pages to include based on mode
    const targetPages = printMode === 'outer' ? [1, 4] : [2, 3];

    const itemsToPrint = layout.fields
      .filter((field: any) => targetPages.includes(field.page)) 
      .map((field: any) => {
        let valueToPrint = mappedData[field.fieldNumber];
        
        // --- SMART LOGIC FOR COMPLEX FIELDS (16 & 17) ---
        if (typeof valueToPrint === 'object' && valueToPrint !== null) {
            const parts = field.id.split('_');
            const suffix = parts[parts.length - 1]; // "1", "2", "3", or "4"
            const key = `_${suffix}`;

            // @ts-ignore
            const specificValue = valueToPrint[key];

            if (specificValue === false) return null;
            valueToPrint = specificValue;
        }

        if (valueToPrint) {
          // --- OFFSET LOGIC FOR A4 ---
          // Outer Mode: Page 1 is Right (+148.5), Page 4 is Left (0)
          // Inner Mode: Page 2 is Left (0), Page 3 is Right (+148.5)
          let finalX = field.x;
          
          if (printMode === 'outer') {
             // Page 1 goes on Right
             if (field.page === 1) finalX += PAGE_WIDTH_MM;
          } else {
             // Page 3 goes on Right
             if (field.page === 3) finalX += PAGE_WIDTH_MM;
          }

          return {
            id: field.id,
            x: finalX,
            y: field.y,
            width: field.width,
            height: field.height, // Passed down for styling
            value: valueToPrint === true ? '✓' : valueToPrint,
            type: field.dataType
          };
        }
        return null;
      })
      .filter((item: any) => item !== null);

    setPrintItems(itemsToPrint);
    setIsPrintModalOpen(false);
    
    // Wait for render then print
    setTimeout(() => {
      window.print();
    }, 500);
  };

  const steps = [
    { id: 1, title: "Admission Profile", icon: User },
    { id: 2, title: "Clinical History", icon: FileText },
    { id: 3, title: "Examination", icon: Stethoscope },
    { id: 4, title: "Management", icon: Activity },
    { id: 5, title: "Discharge Plan", icon: Save },
  ];

  const drugOptions = ["Penicillin", "Sulfonamides", "NSAIDS", "Anticonvulsants"];
    
  // ==========================================
  // 4. MAIN RENDER
  // ==========================================
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans pb-20 relative overflow-x-hidden">
      
      {/* MESSAGE MODAL (Dialog Box Theme) */}
      <AnimatePresence>
        {msgModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
               <div className={`p-6 flex flex-col items-center text-center border-b ${msgModal.type === 'success' ? 'bg-green-50 border-green-100' : 'bg-red-50 border-red-100'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${msgModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {msgModal.type === 'success' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  <h3 className={`text-xl font-black uppercase tracking-tight ${msgModal.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{msgModal.title}</h3>
               </div>
               <div className="p-8 text-center">
                  <p className="text-slate-600 font-bold text-sm leading-relaxed">{msgModal.message}</p>
               </div>
               <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-center">
                  <button onClick={() => {
                      setMsgModal(null);
                      if(msgModal.type === 'success') navigate('/dashboard');
                  }} className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-black transition-all">
                      Okay, Got it
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* OTHER MODALS */}
      <AnimatePresence>
        
        {/* RESET CONFIRMATION MODAL */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }} 
              animate={{ opacity: 1, scale: 1 }} 
              exit={{ opacity: 0, scale: 0.8 }} 
              className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-white relative overflow-hidden"
            >
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                <AlertTriangle size={32} />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Table?</h3>
              <p className="text-slate-500 text-sm mb-6">
                This will clear all data and restore the default investigation rows.
              </p>
              <div className="flex gap-3 justify-center">
                <button 
                  onClick={() => setShowResetConfirm(false)} 
                  className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmResetTable} 
                  className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg"
                >
                  Yes, Reset
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {showManageConsultants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <div className="bg-blue-600/90 backdrop-blur-md p-4 flex justify-between items-center relative z-10">
                <h3 className="text-white font-bold flex items-center gap-2"><Settings size={18} /> Manage Consultants</h3>
                <button onClick={() => setShowManageConsultants(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 relative z-10">
                <div className="flex gap-2 mb-6">
                  <input type="text" placeholder="Dr. Name" value={newConsultant} onChange={(e) => setNewConsultant(e.target.value)} className="flex-1 p-3 border border-slate-200/60 bg-white/50 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-bold backdrop-blur-sm" />
                  <motion.button whileTap={{ scale: 0.9 }} onClick={handleAddConsultant} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={20} /></motion.button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {consultants.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/40 rounded-xl border border-white/60 shadow-sm">
                      <span className="font-bold text-slate-700 text-sm">{doc}</span>
                      <button onClick={() => setDoctorToDelete(doc)} className="text-slate-400 hover:text-red-500"><Trash2 size={18} /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: CREATE TEMPLATE --- */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 50 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden relative">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                <h3 className="text-lg font-bold text-slate-800">Create Custom Template</h3>
                <button onClick={() => setShowTemplateModal(false)} className="text-slate-400 hover:text-slate-600"><X size={20}/></button>
              </div>
              <div className="p-6 space-y-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                    <input type="text" className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" placeholder="e.g. Appendectomy Routine" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} />
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Content</label>
                    <textarea className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-40 resize-none font-mono text-sm" placeholder="Type default content here..." value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} />
                 </div>
              </div>
              <div className="p-6 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                 <button onClick={() => setShowTemplateModal(false)} className="px-6 py-2 border border-slate-300 rounded-lg font-bold text-slate-600 hover:bg-white transition-colors">Cancel</button>
                 <button onClick={saveNewTemplate} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 shadow-lg flex items-center gap-2"><Save size={16}/> Save Template</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* --- MODAL: DELETE TEMPLATE WARNING --- */}
      <AnimatePresence>
        {templateToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-white relative overflow-hidden">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Remove Template?</h3>
              <p className="text-slate-500 text-sm mb-6">This cannot be undone.</p>
              <div className="flex gap-3 justify-center">
                <button onClick={() => setTemplateToDelete(null)} className="px-6 py-2 rounded-lg border border-slate-200 text-slate-600 font-bold hover:bg-slate-50">Cancel</button>
                <button onClick={confirmDeleteTemplate} className="px-6 py-2 rounded-lg bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg">Yes, Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {doctorToDelete && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} className="bg-white/80 backdrop-blur-2xl rounded-3xl shadow-2xl w-full max-w-sm p-6 text-center border border-white/50 relative overflow-hidden">
              <div className="w-16 h-16 bg-red-100/80 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Remove Consultant?</h3>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => setDoctorToDelete(null)} className="px-6 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold hover:bg-white/60">Cancel</button>
                <button onClick={confirmDeleteConsultant} className="px-6 py-2 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg">Yes, Remove</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4">
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100 text-blue-600"><Stethoscope size={32} /></div>
            <div>
               <h2 className="text-[10px] font-bold text-slate-500 leading-tight">ජාතික රෝහල ගාල්ල</h2>
               <h2 className="text-[10px] font-bold text-slate-500 leading-tight">தேசிய வைத்தியசாலை காலி</h2>
               <h1 className="text-xl font-extrabold text-blue-900 uppercase tracking-wide leading-tight">National Hospital Galle</h1>
               <p className="text-xs text-blue-400 font-bold">Diagnosis Card System (H 383A)</p>
            </div>
        </div>
        <div className="flex gap-3">
           <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">Cancel</button>
           
           {/* SAVE RECORD BUTTON - CONNECTED TO DB */}
           <button 
             onClick={handleSaveRecord} 
             disabled={isSaving}
             className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center gap-2"
           >
             <Save size={18} /> {isSaving ? "Saving..." : "Save Record"}
           </button>
        </div>
      </div>

      {/* STEPPER */}
      <div className="flex items-center justify-between mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        {steps.map((step) => (
          <button key={step.id} onClick={() => setActiveStep(step.id)} className="relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300">
            {activeStep === step.id && (<motion.div layoutId="active-step-pill" className="absolute inset-0 bg-blue-100 rounded-xl" transition={{ type: "spring", stiffness: 300, damping: 30 }} />)}
            <div className="relative z-10 flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${activeStep === step.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}><step.icon size={16} /></div>
              <span className={`font-bold whitespace-nowrap ${activeStep === step.id ? 'text-blue-700' : 'text-slate-500'}`}>{step.title}</span>
            </div>
          </button>
        ))}
      </div>

      {/* === STEP 1: ADMISSION PROFILE === */}
      {activeStep === 1 && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
          
          {/* HEADER WITH PRINT BUTTON */}
          <div className="flex justify-between items-center border-b pb-2 mb-6">
             <h3 className="text-lg font-bold text-blue-800 uppercase tracking-wide">1. Patient Demographics & Admission</h3>
             <button 
                onClick={() => handleOpenPrintModal('outer')}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg font-bold text-xs uppercase shadow hover:bg-black transition-all"
             >
               <Printer size={16} /> Print Cover (Pg 1 & 4)
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Input label="Hospital (1)" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
            <Input label="PHN (2)" name="phn" value={formData.phn} onChange={handleChange} />
            <Input label="Contact No (3)" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="07xxxxxxxx" />
            <Input label="NIC No (4)" name="nic" value={formData.nic} onChange={handleChange} placeholder="97xxxxxxxV" />
            <Select label="Blood Group (5)" name="bloodGroup" value={formData.bloodGroup} onChange={handleChange} options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} />
            {/* Allergies Block */}
            <div className="md:col-span-3 bg-red-50/50 border border-red-100 p-6 rounded-2xl">
               <label className="block text-xs font-bold text-red-600 uppercase mb-3 flex items-center gap-2"><ShieldAlert size={16} /> Allergies (6)</label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AllergyToggle type="food" label="Food Allergy" status={formData.allergies.food} onToggle={handleAllergyStatus} />
                  <AllergyToggle type="plaster" label="Plaster Allergy" status={formData.allergies.plaster} onToggle={handleAllergyStatus} />
                  <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                      <span className="text-sm font-bold text-slate-700 block mb-3">Drug Allergy</span>
                      <div className="flex bg-slate-100 rounded-lg p-1 mb-3">
                         <button onClick={() => handleAllergyStatus('drug', 'Positive')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.allergies.drug === 'Positive' ? 'bg-red-500 text-white' : 'text-slate-500'}`}>+ Positive</button>
                         <button onClick={() => handleAllergyStatus('drug', 'Negative')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.allergies.drug === 'Negative' ? 'bg-green-500 text-white' : 'text-slate-500'}`}>- Negative</button>
                      </div>
                      {formData.allergies.drug === 'Positive' && (
                         <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-100">
                            <p className="text-[10px] font-bold text-red-500 uppercase mb-2">Select Drugs:</p>
                            <div className="space-y-2">
                               {drugOptions.map(drug => (
                                  <label key={drug} className="flex items-center gap-2 cursor-pointer p-1 rounded hover:bg-red-100/50">
                                     <input type="checkbox" checked={formData.allergies.selectedDrugs.includes(drug)} onChange={() => handleDrugSelection(drug)} className="w-4 h-4 text-red-500 rounded border-red-200" />
                                     <span className="text-xs font-bold text-slate-700">{drug}</span>
                                  </label>
                               ))}
                            </div>
                            <div className="flex gap-2 mt-2">
                                <input type="text" placeholder="Add Other Drug..." value={tempOtherDrug} onChange={(e) => setTempOtherDrug(e.target.value)} className="flex-1 p-2 text-xs border rounded-lg focus:border-red-500 outline-none" />
                                <button onClick={addCustomDrug} className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Check size={14}/></button>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                                 {formData.allergies.selectedDrugs.filter(d => !drugOptions.includes(d)).map((drug, idx) => (
                                    <span key={idx} className="text-[10px] bg-red-100 text-red-800 px-2 py-1 rounded-full font-bold flex items-center gap-1">
                                       {drug}
                                       <button onClick={() => handleDrugSelection(drug)} className="hover:text-red-900"><X size={10} /></button>
                                    </span>
                                 ))}
                            </div>
                         </div>
                      )}
                  </div>
               </div>
            </div>
            <div className="md:col-span-2"><Input label="Patient's Name (7)" name="patientName" value={formData.patientName} onChange={handleChange} /></div>
            <Input label="BHT No (8)" name="bhtNo" value={formData.bhtNo} onChange={handleChange} placeholder="Numbers Only" className="border-blue-300 bg-blue-50 font-bold" />
            <Select label="Ward/Unit (9)" name="ward" value={formData.ward} onChange={handleChange} options={["Ward 3", "Ward 5"]} />
            <Input label="Age (10)" name="age" value={formData.age} onChange={handleChange} type="number" />
            <Select label="Sex (11)" name="sex" value={formData.sex} onChange={handleChange} options={["Male", "Female"]} />
            <Input label="Date of Admission (12)" name="admissionDate" value={formData.admissionDate} onChange={handleChange} type="date" />
            <Input label="Date of Discharge (13)" name="dischargeDate" value={formData.dischargeDate} onChange={handleChange} type="date" />
            <div className="md:col-span-3 space-y-4">
              <Input label="Principal Diagnosis (14)" name="principalDiagnosis" value={formData.principalDiagnosis} onChange={handleChange} />
              <TextArea label="Co-morbidities / Surgeries / Procedures (15)" name="comorbidities" value={formData.comorbidities} onChange={handleChange} rows={2} placeholder="Enter medical & surgical history here..." />
            </div>
          </div>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              <div className="flex flex-col gap-3">
                 <label className="block text-xs font-bold text-slate-500 uppercase">Mode of Admission (16)</label>
                 <div className="flex flex-wrap gap-4">{["Self", "Referred", "Transferred In"].map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="modeOfAdmission" value={opt} checked={formData.modeOfAdmission === opt} onChange={handleChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div>
                 {formData.modeOfAdmission === 'Referred' && <input type="text" name="referringDoctor" value={formData.referringDoctor} onChange={handleChange} placeholder="By Whom?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
                 {formData.modeOfAdmission === 'Transferred In' && <input type="text" name="transferInHospital" value={formData.transferInHospital} onChange={handleChange} placeholder="From Which Hospital?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
              </div>
              <div className="flex flex-col gap-3">
                 <label className="block text-xs font-bold text-slate-500 uppercase">Mode of Discharge (17)</label>
                 <div className="flex flex-wrap gap-4">{["Routine", "Transferred Out", "Self Discharge"].map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="modeOfDischarge" value={opt} checked={formData.modeOfDischarge === opt} onChange={handleChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div>
                 {formData.modeOfDischarge === 'Transferred Out' && <input type="text" name="transferOutHospital" value={formData.transferOutHospital} onChange={handleChange} placeholder="To Which Hospital?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
              </div>
              <div className="flex gap-8 mt-2"><BooleanRadio label="Disease Notification (18)" name="diseaseNotification" selected={formData.diseaseNotification} onChange={handleChange} /><BooleanRadio label="Medical Cert. Issued (19)" name="medicalCertificate" selected={formData.medicalCertificate} onChange={handleChange} /></div>
              <div className="flex gap-8 mt-2"><BooleanRadio label="Insurance Form (20)" name="insuranceForm" selected={formData.insuranceForm} onChange={handleChange} /></div>
          </div>
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="flex items-end gap-2">
                  <div className="flex-1"><Select label="Consultant (21)" name="consultant" value={formData.consultant} onChange={handleChange} options={consultants} /></div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowManageConsultants(true)} className="mb-[2px] p-2.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors" title="Manage Consultants"><Settings size={20} /></motion.button>
              </div>
              <Input label="HO / MO Name (22)" name="moName" value={formData.moName} onChange={handleChange} />
          </div>
        </div>
      )}

      {/* === STEP 2: CLINICAL HISTORY === */}
      {activeStep === 2 && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
           {/* ENTRY MODE SWITCH */}
           <div className="flex justify-center mb-8">
              <div className="bg-slate-200 p-1 rounded-xl flex gap-1 shadow-inner">
                 <button onClick={() => setEntryMode('routine')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${entryMode === 'routine' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Full Admission (23-29)</button>
                 <button onClick={() => setEntryMode('op_note')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${entryMode === 'op_note' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Op Note Only (30)</button>
              </div>
           </div>

           {entryMode === 'routine' ? (
             <div className="space-y-6 animate-entry">
                <h3 className="text-lg font-bold text-blue-800 mb-6 uppercase tracking-wide border-b pb-2">2. Clinical History</h3>
                <TextArea label="Presenting Complaint (23)" name="presentingComplaint" value={formData.presentingComplaint} onChange={handleChange} rows={2} />
                <TextArea label="History of Presenting Complaint (24)" name="historyOfComplaint" value={formData.historyOfComplaint} onChange={handleChange} rows={4} />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                   <TextArea label="Past Medical History (25)" name="pastMedicalHistory" value={formData.pastMedicalHistory} onChange={handleChange} rows={3} />
                   <TextArea label="Past Surgical History (26)" name="pastSurgicalHistory" value={formData.pastSurgicalHistory} onChange={handleChange} rows={3} />
                </div>

                {/* FIELD 27: DYNAMIC ALLERGY HISTORY */}
                <div className="bg-red-50/50 border border-red-100 p-4 rounded-2xl">
                   <div className="flex items-center gap-2 mb-3">
                      <AlertCircle size={18} className="text-red-500" />
                      <label className="text-xs font-bold text-red-600 uppercase">Allergy History (27)</label>
                   </div>
                   
                   <div className="space-y-4">
                      {formData.allergies.food === 'Positive' && <TextArea label="Food Allergy History" value={formData.allergyRemarks.food || ''} onChange={(e: any) => handleAllergyRemarkChange('food', e.target.value)} rows={2} className="bg-white" />}
                      {formData.allergies.plaster === 'Positive' && <TextArea label="Plaster Allergy History" value={formData.allergyRemarks.plaster || ''} onChange={(e: any) => handleAllergyRemarkChange('plaster', e.target.value)} rows={2} className="bg-white" />}
                      {formData.allergies.drug === 'Positive' && (
                          <div className="border-t border-red-200 pt-4 mt-2">
                              <h6 className="font-bold text-sm text-red-700 mb-3 flex items-center gap-2 bg-red-100/50 p-2 rounded-lg w-fit">💊 Drug Allergies</h6>
                              <div className="space-y-4 pl-1">
                                  {formData.allergies.selectedDrugs.map((drugName) => (
                                      <div key={drugName} className="animate-entry">
                                          <TextArea label={`${drugName} Allergy History`} value={formData.allergyRemarks[drugName] || ''} onChange={(e: any) => handleAllergyRemarkChange(drugName, e.target.value)} rows={2} className="bg-white border-red-200" />
                                      </div>
                                  ))}
                              </div>
                          </div>
                      )}
                      <div className="border-t border-red-200 pt-4 mt-2"><TextArea label="Other / General Allergy Notes" value={formData.allergyRemarks.general || ''} onChange={(e: any) => handleAllergyRemarkChange('general', e.target.value)} rows={2} placeholder="Any other allergy details..." className="bg-white" /></div>
                   </div>
                </div>

                <TextArea label="Social History (28)" name="socialHistory" value={formData.socialHistory} onChange={handleChange} rows={2} />
             </div>
           ) : (
             <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-entry">
                <FileText size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">History Skipped</h3>
                <p className="text-slate-400">You selected "Op Note Only". Proceed to Step 4.</p>
                <button onClick={() => setActiveStep(4)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Go to Management (Field 30)</button>
             </div>
           )}
        </div>
      )}

      {/* === STEP 3: EXAMINATION === */}
      {activeStep === 3 && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
           {entryMode === 'routine' ? (
             <>
               <h3 className="text-lg font-bold text-blue-800 mb-6 uppercase tracking-wide border-b pb-2">3. Examination Findings (29)</h3>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* LEFT COLUMN */}
                  <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Thermometer size={16} /> General</h4>
                         <div className="flex gap-4 mb-4">
                            <Checkbox label="Pale" checked={formData.generalExam.pale} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('generalExam', 'pale', e.target.checked)} />
                            <Checkbox label="Icterus" checked={formData.generalExam.icterus} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('generalExam', 'icterus', e.target.checked)} />
                            <Checkbox label="Ankle Edema" checked={formData.generalExam.ankleEdema} onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleNestedChange('generalExam', 'ankleEdema', e.target.checked)} />
                         </div>
                         <div className="space-y-2">
                            {formData.generalExam.otherFindings.map((finding, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm"><span className="font-medium text-slate-700">{finding}</span><button onClick={() => removeFinding('generalExam', idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button></div>))}
                            <div className="flex gap-2"><input type="text" placeholder="Add new field..." value={tempGeneralFinding} onChange={(e) => setTempGeneralFinding(e.target.value)} className="flex-1 p-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500" /><button onClick={() => addFinding('generalExam', tempGeneralFinding, setTempGeneralFinding)} className="px-3 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-xl font-bold">+</button></div>
                         </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><HeartPulse size={16} /> CVS</h4>
                         <div className="flex gap-2 items-center mb-4"><span className="text-sm font-bold text-slate-500 w-12">Pulse:</span><input className="w-20 p-2 border border-slate-300 rounded text-center font-bold text-slate-700" value={formData.cvs.pulse} onChange={(e) => handleNestedChange('cvs', 'pulse', e.target.value)} /><span className="text-sm font-bold text-slate-500">BPM</span></div>
                         <div className="flex gap-2 items-center mb-4"><span className="text-sm font-bold text-slate-500 w-12">BP:</span><input className="w-20 p-2 border border-slate-300 rounded text-center font-bold text-slate-700" placeholder="Sys" value={formData.cvs.bpSys} onChange={(e) => handleNestedChange('cvs', 'bpSys', e.target.value)} /><span className="text-xl text-slate-300">/</span><input className="w-20 p-2 border border-slate-300 rounded text-center font-bold text-slate-700" placeholder="Dia" value={formData.cvs.bpDia} onChange={(e) => handleNestedChange('cvs', 'bpDia', e.target.value)} /><span className="text-sm font-bold text-slate-500">mmHg</span></div>
                         <div className="space-y-2">
                            {formData.cvs.otherFindings.map((finding, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-50 p-2 rounded text-sm"><span className="font-medium text-slate-700">{finding}</span><button onClick={() => removeFinding('cvs', idx)} className="text-red-400 hover:text-red-600"><X size={14} /></button></div>))}
                            <div className="flex gap-2"><input type="text" placeholder="Add new field..." value={tempCVSFinding} onChange={(e) => setTempCVSFinding(e.target.value)} className="flex-1 p-2 text-sm border border-slate-300 rounded focus:outline-none focus:border-blue-500" /><button onClick={() => addFinding('cvs', tempCVSFinding, setTempCVSFinding)} className="px-3 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 text-xl font-bold">+</button></div>
                         </div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Wind size={16} /> Respiratory</h4>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-4"><h5 className="font-bold text-slate-600 text-sm border-b border-slate-100 pb-1">Right Lung</h5><div><label className="block text-xs font-bold text-slate-500 mb-1">Air Entry</label><Select value={formData.resp.rightLung.airEntry} onChange={(e: any) => handleRespChange('rightLung', 'airEntry', e.target.value)} options={["Equal", "Reduced", "Absent"]} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Sound</label><Select value={formData.resp.rightLung.sound} onChange={(e: any) => handleRespChange('rightLung', 'sound', e.target.value)} options={["Clear", "Crepts", "Rhonchi", "Wheeze"]} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Other</label><Input placeholder="Enter other finding..." value={formData.resp.rightLung.other} onChange={(e: any) => handleRespChange('rightLung', 'other', e.target.value)} /></div></div>
                            <div className="flex items-center justify-center">
                              {/* LUNG IMAGE */}
                              {lungImg && <img src={lungImg} alt="Lung Diagram" className="w-full max-w-[150px] opacity-80" />}
                            </div>
                            <div className="space-y-4"><h5 className="font-bold text-slate-600 text-sm border-b border-slate-100 pb-1">Left Lung</h5><div><label className="block text-xs font-bold text-slate-500 mb-1">Air Entry</label><Select value={formData.resp.leftLung.airEntry} onChange={(e: any) => handleRespChange('leftLung', 'airEntry', e.target.value)} options={["Equal", "Reduced", "Absent"]} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Sound</label><Select value={formData.resp.leftLung.sound} onChange={(e: any) => handleRespChange('leftLung', 'sound', e.target.value)} options={["Clear", "Crepts", "Rhonchi", "Wheeze"]} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1">Other</label><Input placeholder="Enter other finding..." value={formData.resp.leftLung.other} onChange={(e: any) => handleRespChange('leftLung', 'other', e.target.value)} /></div></div>
                         </div>
                      </div>
                  </div>
                  {/* RIGHT COLUMN */}
                  <div className="space-y-6">
                      <div className="bg-slate-300 p-4 rounded-xl border border-slate-400 shadow-sm relative">
                          <div className="absolute top-0 right-0 p-2 bg-slate-400/50 rounded-bl-xl border-l border-b border-slate-400"><h4 className="font-bold text-slate-800 text-xs">Abdomen / DRE</h4></div>
                          <div className="flex gap-6 mt-6">
                           <div className="relative mx-auto md:mx-0" style={{ width: '240px', height: '240px' }}>
                              <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 text-center">Tenderness / Masses</p>
                              <div className="absolute inset-0 z-0"><div className="w-full h-full bg-white border-[2px] border-black" style={{ clipPath: OCTAGON_PATH }}><div className="grid grid-cols-3 grid-rows-3 w-full h-full">{formData.abdomen.quadrants.map((val, i) => (<div key={i} className={`border-[1px] border-black transition-colors ${val ? 'bg-[#d4af37]' : 'bg-transparent'}`} />))}</div></div></div>
                              <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">{formData.abdomen.quadrants.map((val, i) => (<div key={i} onClick={() => handleAbdomenClick(i)} className="relative flex items-center justify-center cursor-pointer group">{!val && <span className="text-[10px] text-slate-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none">+</span>}{val && (<div className="absolute z-50" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'auto' }}><div className="relative shadow-lg rounded bg-white border border-black"><select className="appearance-none bg-white text-xs font-bold text-slate-900 rounded py-1 pl-2 pr-6 focus:outline-none cursor-pointer" value={val} onChange={(e) => updateQuadrant(i, e.target.value)} onClick={(e) => e.stopPropagation()}><option value="Soft">Soft</option><option value="Tender">Tender</option></select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-black pointer-events-none"/><button onClick={(e) => { e.stopPropagation(); updateQuadrant(i, null); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-sm border border-white hover:bg-red-700 transition-colors"><X size={10} strokeWidth={3} /></button></div></div>)}</div>))}</div>
                           </div>
                           <div className="flex-1 p-4 bg-white rounded-xl border border-slate-300 h-fit">
                              <p className="text-sm font-bold text-slate-700 mb-3">DRE Findings:</p>
                              <div className="space-y-2 pl-2"><Checkbox label="Hard Stools" checked={formData.abdomen.dre.hardStools} onChange={(e: any) => handleDRECheckbox('hardStools', e.target.checked)} /><Checkbox label="Blood Stained" checked={formData.abdomen.dre.bloodStained} onChange={(e: any) => handleDRECheckbox('bloodStained', e.target.checked)} /><Checkbox label="Melena" checked={formData.abdomen.dre.melena} onChange={(e: any) => handleDRECheckbox('melena', e.target.checked)} /><Checkbox label="Enlarged Prostate" checked={formData.abdomen.dre.enlargedProstate} onChange={(e: any) => handleDRECheckbox('enlargedProstate', e.target.checked)} /><Checkbox label="Mass" checked={formData.abdomen.dre.mass} onChange={(e: any) => handleDRECheckbox('mass', e.target.checked)} /></div>
                              <div className="mt-4"><div className="flex gap-2"><input type="text" placeholder="Other DRE finding..." className="flex-1 p-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:border-blue-500" value={tempDREFinding} onChange={(e) => setTempDREFinding(e.target.value)} /><button onClick={addDREFinding} className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Check size={16}/></button></div><div className="mt-2 space-y-1">{formData.abdomen.dre.otherFindings.map((finding, idx) => (<div key={idx} className="flex justify-between items-center bg-slate-100 p-1.5 rounded text-xs"><span>{finding}</span><button onClick={() => removeDREFinding(idx)} className="text-red-500 hover:text-red-700"><X size={12}/></button></div>))}</div></div>
                           </div>
                          </div>
                          <div className="mt-6"><TextArea label="Additional Abdominal Notes" value={formData.abdomen.additionalNotes} onChange={(e: any) => setFormData(prev => ({...prev, abdomen: {...prev.abdomen, additionalNotes: e.target.value}}))} rows={3} className="bg-white" /></div>
                      </div>
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                          <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Activity size={16} /> CNS</h4>
                          <div className="flex items-center gap-3 mb-4 bg-slate-50 p-3 rounded-lg inline-block"><span className="font-bold text-sm text-slate-600">GCS Score:</span><input className="w-16 p-2 border-2 border-blue-200 rounded-lg text-center font-bold text-xl text-blue-700 focus:outline-none focus:border-blue-500" value={formData.cns.gcs} onChange={(e) => handleNestedChange('cns', 'gcs', e.target.value)} /><span className="font-bold text-lg text-slate-400">/ 15</span></div>
                          <TextArea label="Other CNS Findings" value={formData.cns.other} onChange={(e: any) => handleNestedChange('cns', 'other', e.target.value)} rows={3} />
                      </div>
                  </div>
               </div>
             </>
           ) : (
             <div className="text-center p-12 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200 animate-entry">
                <Stethoscope size={48} className="mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-bold text-slate-600 mb-2">Examination Skipped</h3>
                <p className="text-slate-400">You selected "Op Note Only". Proceed to Step 4.</p>
                <button onClick={() => setActiveStep(4)} className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold">Go to Management (Field 30)</button>
             </div>
           )}
        </div>
      )}

      {/* === STEP 4: MANAGEMENT (FIELD 30 & INVESTIGATIONS) === */}
      {activeStep === 4 && (
         <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
            {/* HEADER WITH INNER PRINT BUTTON */}
            <div className="flex justify-between items-center border-b pb-2 mb-6">
                <h3 className="text-lg font-bold text-blue-800 uppercase tracking-wide">4. Management & Investigations</h3>
                <button 
                   onClick={() => handleOpenPrintModal('inner')}
                   className="flex items-center gap-2 px-4 py-2 bg-blue-800 text-white rounded-lg font-bold text-xs uppercase shadow hover:bg-blue-900 transition-all"
                >
                  <Printer size={16} /> Print Inner (Pg 2 & 3)
                </button>
            </div>
            
            {entryMode === 'op_note' && (
                <div className="border border-slate-200 bg-slate-50 rounded-xl p-6 mb-6 animate-entry relative">
                    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><FileText size={18}/> Operation / Procedure Note (30)</h4>
                    <div className="mb-4 relative">
                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input type="text" placeholder="Search templates..." value={formData.opNote.templateSearch} onChange={(e) => handleOpNoteChange('templateSearch', e.target.value)} className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                {showTemplateList && formData.opNote.templateSearch && (
                                    <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 max-h-48 overflow-y-auto">
                                            {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                                                <div key={t.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center" onClick={() => selectTemplate(t)}>
                                                    <span className="text-sm font-bold text-slate-700">{t.name}</span>
                                                    <button onClick={(e) => requestDeleteTemplate(e, t.id)} className="text-slate-400 hover:text-red-500 p-1"><Trash2 size={14}/></button>
                                                </div>
                                            )) : (
                                                <div className="p-3 text-sm text-slate-400 italic">No templates found.</div>
                                            )}
                                    </div>
                                )}
                            </div>
                            <button onClick={() => setShowTemplateModal(true)} className="px-4 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 font-bold flex items-center gap-2"><Plus size={16}/> New</button>
                        </div>
                    </div>
                    <div className="mb-4"><label className="block text-xs font-bold text-slate-500 uppercase mb-1">Op Note Content</label><textarea className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none font-mono text-sm" placeholder={`Topic + Date\nDone by:\nAssisted by:\nIndication:\nProcedure / Findings:`} value={formData.opNote.content} onChange={(e) => handleOpNoteChange('content', e.target.value)} /></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6"><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Clock size={12}/> Duration</label><input type="text" placeholder="Enter duration..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.opNote.duration} onChange={(e) => handleOpNoteChange('duration', e.target.value)} /></div><div><label className="block text-xs font-bold text-slate-500 uppercase mb-1 flex items-center gap-1"><Pill size={12}/> Drugs Given</label><input type="text" placeholder="Enter drugs given..." className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" value={formData.opNote.drugsGiven} onChange={(e) => handleOpNoteChange('drugsGiven', e.target.value)} /></div></div>
                </div>
            )}

            {entryMode === 'routine' && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl mb-6">
                    <p className="text-sm text-blue-700 font-semibold italic">Routine Admission (23-29). Proceeding to Investigations (31).</p>
                </div>
            )}

            {/* INVESTIGATIONS TABLE (Field 31) */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 mt-6 overflow-x-auto relative">
               <div className="flex justify-between items-center mb-4">
                   <h4 className="font-bold text-slate-700">Investigations (31)</h4>
                   <button onClick={handleResetRequest} className="text-xs flex items-center gap-1 text-slate-400 hover:text-red-500 transition-colors border border-slate-200 px-3 py-1.5 rounded-lg hover:bg-red-50"><RotateCcw size={12}/> Reset Table</button>
               </div>
               
               <table className="w-full border-collapse min-w-[600px] border border-black">
                  <thead>
                      <tr className="bg-slate-50">
                          <th className="p-3 text-left border border-black text-xs font-bold text-slate-500 uppercase bg-slate-100 sticky left-0 z-10 w-64" colSpan={3}>Investigation</th>
                          {invDays.map((day, i) => (
                             <th key={i} className="p-2 border border-black text-center min-w-[100px] relative group">
                                <span className="text-xs font-bold text-slate-600">{day}</span>
                                {i === invDays.length - 1 && invDays.length > 1 && (
                                  <button onClick={removeInvDay} className="absolute top-1 right-1 bg-red-100 text-red-600 rounded-full p-1 opacity-100 hover:bg-red-200 transition-colors"><Minus size={10}/></button>
                                )}
                             </th>
                          ))}
                          <th className="p-2 border border-black w-10 text-center">
                             <button onClick={addInvDay} className="w-6 h-6 rounded-full bg-white border border-slate-300 flex items-center justify-center hover:bg-slate-50 text-slate-500"><Plus size={14}/></button>
                          </th>
                      </tr>
                  </thead>
                  <tbody>
                      {/* FBC ROW (BLUE-100 BACKGROUND) */}
                      <tr>
                          <td className="p-0 border border-black sticky left-0 z-10 bg-blue-100 align-middle" rowSpan={4}>
                             <div className="flex h-full items-center justify-center p-2">
                                 <input 
                                    className="bg-transparent w-full text-center font-bold text-slate-900 outline-none text-sm focus:ring-2 focus:ring-blue-600 focus:bg-white rounded" 
                                    value={fbcLabels.main}
                                    onChange={(e) => updateFbcLabel('main', e.target.value)}
                                 />
                             </div>
                          </td>
                          <td className="p-0 border border-black bg-emerald-100 sticky left-16 z-10" colSpan={2}>
                             <input 
                                 className="w-full h-full p-2 text-xs font-bold bg-transparent outline-none text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white" 
                                 value={fbcLabels.hb} 
                                 onChange={(e) => updateFbcLabel('hb', e.target.value)}
                             />
                          </td>
                          {invDays.map((_, i) => (
                             <td key={i} className="p-0 border border-black bg-emerald-100">
                                <div className="w-full h-full">
                                   <input 
                                      className="w-full h-full p-2 text-center text-xs bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" 
                                      value={invData['fbc_hb']?.[i] || ''}
                                      onChange={(e) => updateInvData('fbc_hb', i, e.target.value)} 
                                   />
                                </div>
                             </td>
                          ))}
                          <td className="border border-black bg-emerald-100"></td>
                      </tr>

                      <tr>
                          <td className="p-0 border border-black sticky left-16 z-10 bg-yellow-100 align-middle" rowSpan={2}>
                              <div className="flex h-full items-center justify-center p-2">
                                  <input 
                                     className="bg-transparent w-full text-center font-bold text-slate-900 outline-none text-xs focus:ring-2 focus:ring-blue-600 focus:bg-white rounded" 
                                     value={fbcLabels.wbc}
                                     onChange={(e) => updateFbcLabel('wbc', e.target.value)}
                                  />
                              </div>
                          </td>
                          <td className="p-0 border border-black bg-orange-50 sticky left-28 z-10">
                              <input 
                                  className="w-full h-full p-2 text-xs font-bold bg-transparent outline-none text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white" 
                                  value={fbcLabels.n}
                                  onChange={(e) => updateFbcLabel('n', e.target.value)}
                              />
                          </td>
                          {invDays.map((_, i) => (
                             <td key={i} className="p-0 border border-black bg-orange-50">
                                <div className="w-full h-full">
                                   <input 
                                      className="w-full h-full p-2 text-center text-xs bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" 
                                      value={invData['fbc_n']?.[i] || ''}
                                      onChange={(e) => updateInvData('fbc_n', i, e.target.value)} 
                                   />
                                </div>
                             </td>
                          ))}
                          <td className="border border-black bg-orange-50"></td>
                      </tr>
                      <tr>
                          <td className="p-0 border border-black bg-orange-50 sticky left-28 z-10">
                              <input 
                                  className="w-full h-full p-2 text-xs font-bold bg-transparent outline-none text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white" 
                                  value={fbcLabels.l}
                                  onChange={(e) => updateFbcLabel('l', e.target.value)}
                              />
                          </td>
                          {invDays.map((_, i) => (
                             <td key={i} className="p-0 border border-black bg-orange-50">
                                <div className="w-full h-full">
                                   <input 
                                      className="w-full h-full p-2 text-center text-xs bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" 
                                      value={invData['fbc_l']?.[i] || ''}
                                      onChange={(e) => updateInvData('fbc_l', i, e.target.value)} 
                                   />
                                </div>
                             </td>
                          ))}
                          <td className="border border-black bg-orange-50"></td>
                      </tr>

                      <tr>
                          <td className="p-0 border border-black bg-emerald-100 sticky left-16 z-10" colSpan={2}>
                             <input 
                                 className="w-full h-full p-2 text-xs font-bold bg-transparent outline-none text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white" 
                                 value={fbcLabels.plt}
                                 onChange={(e) => updateFbcLabel('plt', e.target.value)}
                             />
                          </td>
                          {invDays.map((_, i) => (
                             <td key={i} className="p-0 border border-black bg-emerald-100">
                                <div className="w-full h-full">
                                   <input 
                                      className="w-full h-full p-2 text-center text-xs bg-transparent outline-none focus:bg-white focus:ring-2 focus:ring-blue-600 transition-all" 
                                      value={invData['fbc_plt']?.[i] || ''}
                                      onChange={(e) => updateInvData('fbc_plt', i, e.target.value)} 
                                   />
                                </div>
                             </td>
                          ))}
                          <td className="border border-black bg-emerald-100"></td>
                      </tr>

                      {/* DYNAMIC ROWS (Standard White) */}
                      {invRows.map((row) => (
                          <tr key={row.id}>
                             <td className="p-0 border border-black sticky left-0 z-10 bg-white" colSpan={3}>
                                <div className="flex justify-between items-center w-full h-full">
                                    <input 
                                       className="w-full h-full p-2 bg-transparent outline-none font-bold text-xs text-slate-800 focus:ring-2 focus:ring-blue-600 focus:bg-white" 
                                       value={row.name} 
                                       placeholder="Enter test name..." 
                                       onChange={(e) => updateInvRowName(row.id, e.target.value)} 
                                    />
                                    <button onClick={() => removeInvRow(row.id)} className="text-red-400 hover:text-red-600 opacity-100 transition-opacity pr-2"><Minus size={14}/></button>
                                </div>
                             </td>
                             {invDays.map((_, i) => (
                                <td key={i} className="p-0 border border-black">
                                    <div className="w-full h-full">
                                        <input 
                                           className="w-full h-full p-2 text-center text-xs outline-none focus:bg-blue-50/50 focus:ring-2 focus:ring-blue-600 transition-all" 
                                           value={invData[row.id]?.[i] || ''}
                                           onChange={(e) => updateInvData(row.id, i, e.target.value)} 
                                        />
                                    </div>
                               </td>
                             ))}
                             <td className="border border-black bg-slate-50"></td>
                          </tr>
                      ))}
                  </tbody>
               </table>
               <div className="mt-4 flex justify-center">
                  <button onClick={addInvRow} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"><Plus size={16}/></button>
               </div>
            </div>

            <div className="mt-6">
               <TextArea label="Special Investigations (32)" name="specialInvestigations" value={formData.specialInvestigations} onChange={handleChange} rows={2} placeholder="Histology, CT, MRI..." />
            </div>
         </div>
      )}

      {/* === STEP 5: DISCHARGE === */}
      {activeStep === 5 && (
         <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
            <h3 className="text-lg font-bold text-blue-800 mb-6 uppercase tracking-wide border-b pb-2">5. Discharge Plan</h3>
            <div className="space-y-6">
               <Input label="Condition at Discharge (33)" name="conditionAtDischarge" value={formData.conditionAtDischarge} onChange={handleChange} />
               <TextArea label="Medications on Discharge (34)" name="medicationsOnDischarge" value={formData.medicationsOnDischarge} onChange={handleChange} rows={4} className="font-mono bg-yellow-50" />
               <TextArea label="Discharge Plan / Advice (35)" name="dischargePlan" value={formData.dischargePlan} onChange={handleChange} rows={3} />
               <TextArea label="Instructions in Sinhala/Tamil (36)" name="instructionsSinhalaTamil" value={formData.instructionsSinhalaTamil} onChange={handleChange} rows={2} />
               <TextArea label="Referral Note (37)" name="referralNote" value={formData.referralNote} onChange={handleChange} rows={2} />
            </div>
            <div className="mt-8 flex justify-end">
               {/* SAVE RECORD BUTTON - CONNECTED TO DB */}
               <button 
                 onClick={handleSaveRecord} 
                 disabled={isSaving}
                 className="px-8 py-3 bg-green-600 text-white font-bold rounded-xl shadow-lg hover:bg-green-700 flex items-center gap-2"
               >
                 <Save size={20} /> {isSaving ? "Saving..." : "Complete Admission"}
               </button>
            </div>
         </div>
      )}

      {/* --- FOOTER NAVIGATION --- */}
      <div className="flex justify-between mt-8">
         <button disabled={activeStep === 1} onClick={() => setActiveStep(p => p - 1)} className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 flex items-center gap-2"><ChevronLeft size={20} /> Previous</button>
         <button disabled={activeStep === 5} onClick={() => setActiveStep(p => p + 1)} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">Next Step <ChevronRight size={20} /></button>
      </div>

      {/* --- PRINT MODAL & HIDDEN LAYER (NEW ADDITION) --- */}
      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center">
              <h3 className="font-black text-lg text-slate-800">Select Layout</h3>
              <button onClick={() => setIsPrintModalOpen(false)}><X size={24} className="text-slate-400"/></button>
            </div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {savedLayouts.length === 0 ? (
                <p className="text-center text-slate-400 font-bold">No layouts found. Go to Settings &gt; Studio to create one.</p>
              ) : (
                <div className="space-y-3">
                  {savedLayouts.map((layout) => (
                    <button 
                      key={layout.id}
                      onClick={() => handlePrintExecution(layout)}
                      className="w-full flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 hover:border-blue-500 transition-all group"
                    >
                      <div className="p-3 bg-white rounded-lg text-slate-400 group-hover:text-blue-600"><FileText size={24}/></div>
                      <div className="text-left">
                        <div className="font-bold text-slate-700">{layout.name}</div>
                        <div className="text-xs text-slate-400 font-bold">Last modified: {new Date(layout.lastModified).toLocaleDateString()}</div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- HIDDEN PRINT LAYER (CORRECTED WITH MM & ZERO MARGINS) --- */}
      <div className="hidden print:block fixed inset-0 z-[10000] bg-white pointer-events-none">
        <style>{`
          @media print { 
            @page { 
              size: A4 landscape; 
              margin: 0mm !important; /* FORCE ZERO MARGINS */
            }
            html, body {
              margin: 0 !important;
              padding: 0 !important;
              width: 297mm;
              height: 210mm;
            }
            body * { visibility: hidden; }
            .print-layer, .print-layer * { visibility: visible; }
            .print-layer { 
              position: fixed; 
              left: 0; 
              top: 0; 
              width: 297mm; 
              height: 210mm; 
              z-index: 9999;
            }
          }
        `}</style>
        
        <div className="print-layer relative w-[297mm] h-[210mm]">
          {printItems.map((item) => {
  // --- SPECIAL CASE: ABDOMEN GRID (FIELD 29 SUB-ID) ---
  if (item.id.includes('29_abd_img')) {
    return (
      <div key={item.id} className="absolute border border-black overflow-hidden" 
           style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm` }}>
        {/* REPLICATE THE OCTAGON FOR PRINT */}
        <div className="w-full h-full bg-white relative" style={{ clipPath: OCTAGON_PATH, border: '1px solid black' }}>
           <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
              {formData.abdomen.quadrants.map((val, i) => (
                <div key={i} className="border border-black relative flex items-center justify-center" 
                     style={{ backgroundColor: val ? '#FFFF00' : 'transparent' }}>
                   {/* TYPE "SOFT" OR "TENDER" INSIDE THE YELLOW BLOCK */}
                   {val && <span className="text-[6px] font-black uppercase text-black leading-none text-center">{val}</span>}
                </div>
              ))}
           </div>
        </div>
      </div>
    );
  }

  // --- SPECIAL CASE: LUNG DIAGRAM (FIELD 29 SUB-ID) ---
  if (item.id.includes('29_lung_img')) {
    return (
        <div key={item.id} className="absolute flex items-center justify-center" 
             style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm` }}>
            <img src={lungImg} className="w-full h-full object-contain" alt="lungs" />
        </div>
    );
  }

  // --- STANDARD TEXT PRINTING ---
  return (
    <div key={item.id} className="absolute font-bold text-black overflow-hidden"
         style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm`, fontSize: getAutoFontSize(item.value) }}>
      {item.value}
    </div>
  );
})}
        </div>
      </div>

    </div>
  );
};

// ==========================================
// HELPER COMPONENTS (UNCHANGED)
// ==========================================
function Checkbox({ label, checked, onChange }: any) {
  return (
    <label className="flex items-center gap-3 cursor-pointer transition-colors hover:bg-slate-100 p-1 rounded">
      <input type="checkbox" className="hidden" checked={checked} onChange={onChange} />
      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>
        {checked && <Check size={14} className="text-white" strokeWidth={3} />}
      </div>
      <span className="text-sm font-semibold text-slate-700">{label}</span>
    </label>
  );
}

function Input({ label, className = "", ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
      <input className={`w-full p-2.5 bg-white/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 ${className}`} {...props} />
    </div>
  );
}

function TextArea({ label, className = "", ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
      <textarea className={`w-full p-2.5 bg-white/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none ${className}`} {...props} />
    </div>
  );
}

function Select({ label, options, ...props }: any) {
  return (
    <div className="w-full">
      {label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}
      <select className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 appearance-none shadow-sm hover:bg-white/70 transition-all cursor-pointer" {...props}>
        <option value="">Select...</option>
        {options.map((o: string) => (<option key={o} value={o}>{o}</option>))}
      </select>
    </div>
  );
}

function RadioGroup({ label, options, name, selected, onChange }: any) {
  return (
    <div>
      <label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label>
      <div className="flex flex-wrap gap-4">
        {options.map((opt: string) => (
          <label key={opt} className="flex items-center gap-2 cursor-pointer">
            <input type="radio" name={name} value={opt} checked={selected === opt} onChange={onChange} className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-slate-700">{opt}</span>
          </label>
        ))}
      </div>
    </div>
  );
}

function BooleanRadio({ label, name, selected, onChange }: any) {
  return <RadioGroup label={label} name={name} selected={selected} onChange={onChange} options={["Yes", "No"]} />;
}

function AllergyToggle({ type, label, status, onToggle }: any) {
  return (
    <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
      <span className="text-sm font-bold text-slate-700 block mb-3">{label}</span>
      <div className="flex bg-slate-100 rounded-lg p-1">
        <button onClick={() => onToggle(type, 'Positive')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Positive' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-white'}`}>+ Positive</button>
        <button onClick={() => onToggle(type, 'Negative')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Negative' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-white'}`}>- Negative</button>
      </div>
    </div>
  );
}

export default Admission;
