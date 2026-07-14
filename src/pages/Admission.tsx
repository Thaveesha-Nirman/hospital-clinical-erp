// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  User, FileText, Stethoscope, Save, Activity, HeartPulse, 
  ChevronRight, ChevronLeft, Thermometer, Wind, ShieldAlert, 
  Check, Settings, Trash2, Plus, AlertTriangle, X, ChevronDown, 
  AlertCircle, Search, Clock, Pill, Minus, RotateCcw, Printer, 
  CheckCircle, Eye, FilePlus, Layout, Share2, ClipboardCheck, ClipboardList,
  Map as MapIcon, Layers, FileCheck ,Unlock, Languages
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// IMPORT THE BRIDGE
import { getPrintData } from '../PrintMapping'; 

// IMPORTING THE LUNG IMAGE
import lungImg from '../assets/lung.png';

// Define the exact Octagon shape path for CSS clip-path
const OCTAGON_PATH = "polygon(30% 0%, 70% 0%, 100% 30%, 100% 70%, 70% 100%, 30% 100%, 0% 70%, 0% 30%)";
// --- UPDATED STRUCTURE (Removed Topic + Date) ---
const DEFAULT_TEMPLATE_STRUCTURE = `Done by: 
Assisted by: 
Indication: 
Procedure / Findings: 
Modes of Anesthesia: 
`;

// --- HELPER: AUTO FONT SIZE ---
// --- HELPER: AUTO FONT SIZE (UPGRADED) ---
// --- HELPER: AGGRESSIVE AUTO FONT SCALER ---
// --- HELPER: STRICT AUTO FONT SCALER ---
const getAutoFontSize = (text) => {
  if (!text || typeof text !== 'string') return '11px';

  // Count "Enter" keys as extra length to account for vertical space
  const newLines = (text.match(/\n/g) || []).length;
  const weightedLength = text.length + (newLines * 40);

  // STRICTER THRESHOLDS: Shrink sooner!
  if (weightedLength < 150) return '11pt'; // Very short text
  if (weightedLength < 250) return '10pt'; // Short paragraph
  if (weightedLength < 450) return '9pt';  // Medium paragraph
  if (weightedLength < 750) return '8pt';  // Long paragraph
  if (weightedLength < 1100) return '7pt'; // Very long
  if (weightedLength < 1600) return '6pt'; // Huge
  return '5pt';                            // Massive (prevent cutoff)
};
// --- NEW HELPER: SMART FONT SCALER FOR OP NOTES ---
const getSmartOpFontSize = (textLength) => {
    // Standard size for short notes
    if (textLength < 300) return '10pt'; 
    // Medium notes
    if (textLength < 600) return '9pt';  
    // Long notes
    if (textLength < 1000) return '8pt'; 
    // Very long notes
    if (textLength < 1500) return '7pt'; 
    // Ultra long notes (prevents overflow)
    return '6pt'; 
};

// --- DUMMY INITIAL TEMPLATES ---
const INITIAL_TEMPLATES = [
  { id: 1, name: "Appendectomy (Routine)", content: "Procedure: Appendectomy\nIndication: Acute Appendicitis\nIncision: Lanz\nFindings: Inflamed appendix, base healthy.\nClosure: Layered closure." },
  { id: 2, name: "Hernia Repair (Inguinal)", content: "Procedure: Lichtenstein Repair\nSide: Right\nFindings: Direct sac, reduced.\nMesh: Prolene mesh fixed." }
];

// --- CONSTANTS FOR TABLE RESET ---
const INITIAL_INV_ROWS = [
  { id: 'fbs', name: 'FBS (70-110)' }, 
  { id: 'crp', name: 'CRP (< 5)' },
  { id: 'scr', name: 'Serum Creatinine (0.6-1.1)' }, 
  { id: 'tsh', name: 'TSH' }
];

const INITIAL_FBC_LABELS = {
  main: 'FBC', 
  hb: 'Hb (12.0-16.0)', 
  wbc: 'WBC (4.0-11.0)', 
  n: 'N (2.0-7.5)', 
  l: 'L (1.0-4.0)', 
  plt: 'PLT (150-400)'
};

const Admission = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); 
  const editId = searchParams.get('id');    
  
  const [activeStep, setActiveStep] = useState(1);
  const [entryMode, setEntryMode] = useState('routine');
  const [isSaving, setIsSaving] = useState(false); 

  // --- MESSAGE MODAL STATE ---
  const [msgModal, setMsgModal] = useState(null);

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
  const [doctorToDelete, setDoctorToDelete] = useState(null);
  // --- NEW HO / MO STATE LOGIC ---
// --- 1. MO LIST & MANAGEMENT ---
  const [moList, setMoList] = useState(["Dr. A.B. Perera", "Dr. S.H. Silva"]);
  const [showManageMO, setShowManageMO] = useState(false);
  const [newMO, setNewMO] = useState("");

  const handleAddMO = () => { 
    if (newMO.trim()) { setMoList([...moList, newMO]); setNewMO(""); } 
  };
  const handleDeleteMO = (moName) => {
    setMoList(prev => prev.filter(m => m !== moName));
  };
  //save add
const [editingTemplateId, setEditingTemplateId] = useState(null); // <--- Add this
  // --- 2. WARD LOCK & DEFAULT LOGIC ---
  const [isWardLocked, setIsWardLocked] = useState(() => localStorage.getItem('ward_locked') === 'true');
  const [lockedWardValue, setLockedWardValue] = useState(() => localStorage.getItem('locked_ward_value') || "");

  const handleSetDefaultWard = (wardName) => {
    setLockedWardValue(wardName);
    localStorage.setItem('locked_ward_value', wardName);
  };

  const toggleWardLock = () => {
    const newLockState = !isWardLocked;
    const currentWard = formData.ward; 
    setIsWardLocked(newLockState);
    if (newLockState) handleSetDefaultWard(currentWard); 
    localStorage.setItem('ward_locked', newLockState);
  };

  // --- 3. PINNED HO (MO) LOGIC ---
  const [defaultMO, setDefaultMO] = useState(() => localStorage.getItem('default_mo_name') || "");
  const handleSetDefaultMO = (name) => {
    setDefaultMO(name);
    localStorage.setItem('default_mo_name', name);
    setFormData(prev => ({ ...prev, moName: name }));
  };
  // --- TEMPLATES ---
// --- TEMPLATES (With Local Storage) ---
  const [templates, setTemplates] = useState(() => {
    const saved = localStorage.getItem('op_note_templates');
    return saved ? JSON.parse(saved) : INITIAL_TEMPLATES;
  });

  // Save to Local Storage whenever templates change
  useEffect(() => {
    localStorage.setItem('op_note_templates', JSON.stringify(templates));
  }, [templates]);
  // 2. Save to Local Storage whenever templates change
  useEffect(() => {
    localStorage.setItem('op_note_templates', JSON.stringify(templates));
  }, [templates]);  const [showTemplateList, setShowTemplateList] = useState(false);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showManageTemplates, setShowManageTemplates] = useState(false); // <--- ADD THIS

// --- UNIQUE ADMISSION DRUGS LOGIC ---
const addAdmissionDrug = () => {
    if (tempAdmDrug.trim()) {
        const newEntry = { 
            name: tempAdmDrug, 
            duration: tempAdmDuration || 'N/A' 
        };
        setFormData(p => ({
            ...p,
            generalExam: {
                ...p.generalExam,
                // Using the OR operator || [] ensures it doesn't crash if admissionDrugs is missing
                admissionDrugs: [...(p.generalExam.admissionDrugs || []), newEntry]
            }
        }));
        setTempAdmDrug("");     
        setTempAdmDuration(""); 
    }
};

const removeAdmissionDrug = (index) => {
    setFormData(p => ({
        ...p,
        generalExam: {
            ...p.generalExam,
            admissionDrugs: (p.generalExam.admissionDrugs || []).filter((_, i) => i !== index)
        }
    }));
};
  
  const [templateToDelete, setTemplateToDelete] = useState(null);
  // --- NEW TEMPLATE STATE (Add this block) ---
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateTopic, setNewTemplateTopic] = useState("");   // <--- Was Missing
  const [newTemplateDate, setNewTemplateDate] = useState("");     // <--- Was Missing
  const [newTemplateContent, setNewTemplateContent] = useState("");
  const [newTemplateDuration, setNewTemplateDuration] = useState(""); // <--- Was Missing
  const [newTemplateDrugs, setNewTemplateDrugs] = useState("");       // <--- Was Missing

  const executeFinalClear = () => {
    
    // Reset everything to initial state
    setFormData({
      hospitalName: 'National Hospital Galle', phn: '', contactNo: '', nic: '', bloodGroup: 'B+',
      patientName: '', bhtNo: '', // If locked, keep the ward. If not locked, make it empty.
      ward: isWardLocked ? lockedWardValue : '', age: '', sex: '',
      admissionDate: new Date().toISOString().split('T')[0],
      dischargeDate: new Date().toISOString().split('T')[0],
      principalDiagnosis: '', comorbidities: '',
      modeOfAdmission: 'Self', referringDoctor: '', transferInHospital: '',
      modeOfDischarge: 'Routine', transferOutHospital: '',
      diseaseNotification: 'Yes', medicalCertificate: 'No', insuranceForm: 'No',
      consultant: '',moName: defaultMO, 
      allergies: { food: 'Negative', plaster: 'Negative', drug: 'Negative', selectedDrugs: [], otherDrug: '' },
      allergyRemarks: {},
      presentingComplaint: ' ', historyOfComplaint: '',
      pastMedicalHistory: '', pastSurgicalHistory: '', socialHistory: '',
generalExam: { 
  pale: false, 
  icterus: false, 
  ankleEdema: false, 
  otherFindings: [],
  admissionDrugs: [] // <--- CHANGED TO ARRAY: Stores [{name: 'Drug', duration: '3 days'}]
},      cvs: { pulse: '', bpSys: '', bpDia: '', otherFindings: [] },
     resp: { 
  rightLung: { airEntry: 'Equal', sound: 'Clear', otherFindings: [] }, // Changed to Array
  leftLung: { airEntry: 'Equal', sound: 'Clear', otherFindings: [] }   // Changed to Array
},
      abdomen: { quadrants: [null, null, null, null, null, null, null, null, null], additionalNotes: '', dre: { hardStools: false, bloodStained: false, otherFindings: [] } },
      cns: { gcs: '', other: '' },
      opNote: { templateSearch: '', topic: '', opDate: '', content: '', duration: '', drugsGiven: [] },
      managementNotes: '', specialInvestigations: '',
      conditionAtDischarge: 'Hemodynamically stable',medicationsOnDischarge: [{ name: '', dose: '', freq: '', duration: '', instructions: '' }], dischargePlan: '', instructionsSinhalaTamil: '', referralNote: '' 
    });
    setInvData({});
    setInvDays(["Day 1"]);
    setInvRows(INITIAL_INV_ROWS);
    setFbcLabels(INITIAL_FBC_LABELS);
    sessionStorage.removeItem('admission_draft');
    setMsgModal(null); // Close modal
    setActiveStep(1);   // Back to start
  };
  // clear field button 
const handleClearForm = () => {
    setMsgModal({
      show: true,
      type: 'error', // Use red theme
      title: 'Wipe All Data?',
      message: 'This will permanently clear all fields and your current draft. This cannot be undone.',
      isConfirm: true // NEW FLAG
    });
  };
  // --- INVESTIGATIONS TABLE STATE ---
  // 1. Columns (Days)
  const [invDays, setInvDays] = useState(() => {
    const saved = sessionStorage.getItem('admission_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._invDays) return parsed._invDays;
    }
    return ["Day 1"];
  });

  // 2. Rows (Test Names)
  const [invRows, setInvRows] = useState(() => {
    const saved = sessionStorage.getItem('admission_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._invRows) return parsed._invRows;
    }
    return INITIAL_INV_ROWS;
  });

  // 3. Cells (The numbers typed in)
  const [invData, setInvData] = useState(() => {
    const saved = sessionStorage.getItem('admission_draft');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed._invData) return parsed._invData;
    }
    return {};
  });
  const [fbcLabels, setFbcLabels] = useState(INITIAL_FBC_LABELS);
  // --- LAB TEST LIBRARY STATE ---
// --- CLEANED LAB LIBRARY (No Duplicates) ---
  // --- MASTER CLEANUP: Acronyms & Duplicates ---
  const [labLibrary, setLabLibrary] = useState(() => {
    const saved = localStorage.getItem('lab_test_library');
    
    // 1. Define the GOLD STANDARD names
    const goldStandardUFR = "URINE FULL REPORT";
    const goldStandardElectrolytes = "Serum Electrolytes";

    const initialTests = [
      { 
        name: goldStandardElectrolytes, 
        isLocked: true, 
        subLabels: ["Sodium (Na+) - (135 - 145)", "Potassium (k+) - (3.5-5)", "Chloride (Cl-) - (98-107)"] 
      },
      { 
        name: goldStandardUFR, 
        isLocked: true, 
        subLabels: ["Protein", "RBC - (0-2/Hpf)", "Pus Cells - (0-5/Hpf)", "Nitrite", "Ketone"] 
      },
      { name: "AST (< 40)", subLabels: [] }, 
      { name: "ALT (< 40)", subLabels: [] }
    ];
    
    if (saved) {
      const parsedSaved = JSON.parse(saved);
      const merged = [...initialTests];
      
      parsedSaved.forEach(item => {
        // CLEANING LOGIC: Remove extra spaces
        let cleanName = item.name.replace(/\s+/g, ' ').trim();
        const upperName = cleanName.toUpperCase();

        // 2. ACRONYM CHECK: If it looks like UFR, treat it as the full report
        if (upperName === "UFR" || upperName.includes("URINE FULL")) {
          cleanName = goldStandardUFR;
        }
        
        // 3. If it's Serum Elec variants, treat as gold standard
        if (upperName.includes("SERUM ELEC")) {
          cleanName = goldStandardElectrolytes;
        }

        // Only add if it's not a duplicate of what we already have
        const exists = merged.find(m => m.name.toLowerCase() === cleanName.toLowerCase());
        if (!exists && cleanName !== "") {
          merged.push({ ...item, name: cleanName });
        }
      });
      return merged;
    }
    return initialTests;
  });
  const [showLabModal, setShowLabModal] = useState(false);
  const [newLibraryTestName, setNewLibraryTestName] = useState("");
  const [testToDelete, setTestToDelete] = useState(null);

  // Save library to local storage whenever it changes
  useEffect(() => {
    localStorage.setItem('lab_test_library', JSON.stringify(labLibrary));
  }, [labLibrary]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // --- PRINTING STATE ---
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [savedLayouts, setSavedLayouts] = useState([]);
  const [printItems, setPrintItems] = useState([]);
  const [printMode, setPrintMode] = useState('outer');
  const [sectionFilter, setSectionFilter] = useState([]);

  // ==========================================
  // 2. FORM DATA STATE
  // ==========================================
const [formData, setFormData] = useState(() => {
    const saved = sessionStorage.getItem('admission_draft');
    const emptyMed = { name: '', dose: '', freq: '', duration: '', instructions: '' };
    
    // 1. Mandatory New Structure for 35, 36, 37
const templateStructure = {
    f35_data: { sutureDate: '', clinicWeeks: '', histologyWeeks: '' },
    // 🟢 Separated into roomNoClinic and roomNoHistology
    f36_data: { 
        sutureDate: '', 
        clinicWeeks: '', 
        histologyWeeks: '', 
        roomNoClinic: '4',    // Default for Clinic
        roomNoHistology: '4'  // Default for Histology
    }, 
    f37_data: { sutureDate: '' },
    activeTemplates: { f35: false, f36: false, f37: false }
};

    const initialState = {
      hospitalName: 'National Hospital Galle', phn: '', contactNo: '', nic: '', bloodGroup: '',
      patientName: '', bhtNo: '', ward: '', age: '', sex: '',
      admissionDate: new Date().toISOString().split('T')[0],
      dischargeDate: new Date().toISOString().split('T')[0],
      principalDiagnosis: '', comorbidities: '',
      modeOfAdmission: 'Self', referringDoctor: '', transferInHospital: '',
      modeOfDischarge: 'Routine', transferOutHospital: '',
      diseaseNotification: 'Yes', medicalCertificate: 'No', insuranceForm: 'No',
      consultant: '', moName: '',
      allergies: { food: 'Negative', plaster: 'Negative', drug: 'Negative', selectedDrugs: [], otherDrug: '' },
      allergyRemarks: {},
      presentingComplaint: '', historyOfComplaint: '',
      pastMedicalHistory: '', pastSurgicalHistory: '', socialHistory: '',
      generalExam: { normal: false, pale: false, icterus: false, ankleEdema: false, otherFindings: [], admissionDrugs: [] },
      cvs: { pulse: '', bpSys: '', bpDia: '', otherFindings: [] },
     resp: { 
  rightLung: { airEntry: 'Equal', sound: 'Clear', otherFindings: [] }, // Changed to Array
  leftLung: { airEntry: 'Equal', sound: 'Clear', otherFindings: [] }   // Changed to Array
},
      abdomen: { quadrants: [null, null, null, null, null, null, null, null, null], additionalNotes: '', dre: { normal: false, hardStools: false, bloodStained: false, otherFindings: [] } },
      cns: { gcs: '', other: '' },
      // ENSURE templateSearch IS DEFINED HERE
      opNote: { templateSearch: '', topic: '', opDate: '', content: '', duration: '', drugsGiven: [] },
      managementNotes: '', specialInvestigations: '',
      conditionAtDischarge: 'Hemodynamically stable', 
      medicationsOnDischarge: [emptyMed], 
      dischargePlan: '', instructionsSinhalaTamil: '', referralNote: '',
      // ATTACH THE TEMPLATE FOLDERS
      ...templateStructure
    };

    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // SAFETY: Force deep merge of medications and templates
        if (!Array.isArray(parsed.medicationsOnDischarge)) {
          parsed.medicationsOnDischarge = initialState.medicationsOnDischarge;
        }
        return { 
            ...initialState, 
            ...parsed,
            // Guard against missing nested objects in old drafts
            opNote: { ...initialState.opNote, ...(parsed.opNote || {}) },
            activeTemplates: { ...templateStructure.activeTemplates, ...(parsed.activeTemplates || {}) },
            f35_data: { ...templateStructure.f35_data, ...(parsed.f35_data || {}) },
            f36_data: { ...templateStructure.f36_data, ...(parsed.f36_data || {}) },
            f37_data: { ...templateStructure.f37_data, ...(parsed.f37_data || {}) }
        };
      } catch (e) { console.error("Draft parse error", e); }
    }
    return initialState;
  });
  const [tempRightLung, setTempRightLung] = useState("");
const [tempLeftLung, setTempLeftLung] = useState("");

  const [tempGeneralFinding, setTempGeneralFinding] = useState("");
  const [tempCVSFinding, setTempCVSFinding] = useState("");
  const [tempOtherDrug, setTempOtherDrug] = useState(""); 
  const [tempDREFinding, setTempDREFinding] = useState("");
  const [allergySummary, setAllergySummary] = useState("No known allergies.");
  
  const drugOptions = ["Penicillin", "Sulfonamides", "NSAIDS", "Anticonvulsants"];
const [tempAdmDrug, setTempAdmDrug] = useState("");
const [tempAdmDuration, setTempAdmDuration] = useState("");
const [tempOpDrug, setTempOpDrug] = useState("");
  const [tempOpDuration, setTempOpDuration] = useState("");

  const addRespFinding = (side, value, setter) => {
    if (value.trim()) {
        setFormData(p => ({
            ...p,
            resp: {
                ...p.resp,
                [side]: {
                    ...p.resp[side],
                    otherFindings: [...(p.resp[side].otherFindings || []), value]
                }
            }
        }));
        setter(""); // Clear the input box
    }
};

const removeRespFinding = (side, index) => {
    setFormData(p => ({
        ...p,
        resp: {
            ...p.resp,
            [side]: {
                ...p.resp[side],
                otherFindings: p.resp[side].otherFindings.filter((_, i) => i !== index)
            }
        }
    }));
};
  // --- SINGLE CLEAN COPY OF OP NOTE DRUG LOGIC ---
  const addOpDrug = () => {
    if (tempOpDrug.trim()) {
      const newEntry = { name: tempOpDrug, duration: tempOpDuration || 'N/A' };
      setFormData(p => ({
        ...p,
        opNote: { 
          ...p.opNote, 
          drugsGiven: [...(Array.isArray(p.opNote.drugsGiven) ? p.opNote.drugsGiven : []), newEntry] 
        }
      }));
      setTempOpDrug(""); setTempOpDuration("");
    }
  };

  const removeOpDrug = (index) => {
    setFormData(p => ({
      ...p,
      opNote: { 
        ...p.opNote, 
        drugsGiven: (Array.isArray(p.opNote.drugsGiven) ? p.opNote.drugsGiven : []).filter((_, i) => i !== index) 
      }
    }));
  };
// --- OP NOTE DRUG LOGIC (MULTIPLE DRUGS) ---



  // ==========================================
  // LOAD/SAVE LOGIC
  // ==========================================
  
  // 1. Load Draft


  // 2. Auto-Save
  useEffect(() => {
    if (!editId) {
        const timer = setTimeout(() => {
            sessionStorage.setItem('admission_draft', JSON.stringify({
                ...formData, _invData: invData, _invDays: invDays, _invRows: invRows
            }));
        }, 800); 
        return () => clearTimeout(timer);
    }
  }, [formData, invData, invDays, invRows, editId]);
  
  // 3. Load DB
// 3. Load DB & Fresh Start Logic
  useEffect(() => {
    if (editId) {
      const load = async () => {
        try {
          if (window.api && window.api.getPatientById) {
             const data = await window.api.getPatientById(editId);
             if (data) {
                setFormData({ ...data, patientName: data.patientName || "", nic: data.nic || "", bhtNo: data.bhtNo || "", ward: data.ward || "" });
                if(data.invData) setInvData(data.invData);
                if(data.invDays) setInvDays(data.invDays);
                if(data.invRows) setInvRows(data.invRows);
                if(data.fbcLabels) setFbcLabels(data.fbcLabels);
             }
          }
        } catch (e) { console.error("Load failed", e); }
      };
      load();
    } else {
      // --- THE BUG FIX: FRESH START FOR NEW PATIENTS ---
      // If there is no ID in the URL, check if the draft has data.
      // If the draft has a name or BHT, it's likely old data. 
      // We trigger a clear so you don't see the previous patient's table rows.
      const savedDraft = sessionStorage.getItem('admission_draft');
      if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          // If the draft has an ID, it definitely belongs to a previous patient
          if (parsed.id || parsed.patientName || parsed.bhtNo) {
              executeFinalClear();
          }
      }
    }
  }, [editId]);

  // 4. Save to DB
  const validateForm = () => {
    if (!formData.patientName?.trim() || !formData.bhtNo?.trim()) { setMsgModal({ show: true, type: 'error', title: 'Missing Details', message: 'Name & BHT required.' }); return false; }
    
    // --- NIC VALIDATION ---
    if (formData.nic && formData.nic.length < 10) { 
        setMsgModal({ show: true, type: 'error', title: 'Invalid NIC', message: 'NIC must be at least 10 characters.' }); 
        return false; 
    }
    
    return true;
  };
// Open the modal and Pre-fill the structure
// Open the modal and Reset all fields
  const handleOpenNewTemplateModal = () => {
      setNewTemplateName("");
      setNewTemplateTopic("");
      setNewTemplateDate(""); 
      setNewTemplateContent(DEFAULT_TEMPLATE_STRUCTURE); 
      setNewTemplateDuration("");
      setNewTemplateDrugs("");
      setShowTemplateModal(true);
  };

// 🟢 NEW: LOAD DATA INTO MODAL FOR EDITING
const handleEditTemplate = (t) => {
    setNewTemplateName(t.name);
    setNewTemplateTopic(t.topic || "");
    setNewTemplateDate(t.opDate || "");
    setNewTemplateContent(t.content || "");
    
    setEditingTemplateId(t.id); // Save the ID so we know which one to update later
    setShowTemplateModal(true); // Open the Editor Modal
    setShowManageTemplates(false); // Close the List Modal
};
  // Save the new template to the list
  // Save the structured template
  const saveNewTemplate = () => {
    if (newTemplateName) {
        const templateData = {
            id: editingTemplateId || Date.now(), // Use existing ID if editing
            name: newTemplateName,
            topic: newTemplateTopic,
            opDate: newTemplateDate,
            content: newTemplateContent
        };

        if (editingTemplateId) {
            // SCENARIO: UPDATING EXISTING
            setTemplates(prev => prev.map(t => t.id === editingTemplateId ? templateData : t));
        } else {
            // SCENARIO: ADDING BRAND NEW
            setTemplates(prev => [...prev, templateData]);
        }

        // RESET EVERYTHING
        setEditingTemplateId(null);
        setShowTemplateModal(false);
        setNewTemplateName(""); // Clear inputs for next time
    }
};
  const handleSaveRecord = async () => {
    if (!validateForm()) return; 
    setIsSaving(true);
    try {
        const payload = {
            ...formData, 
            invData, invDays, invRows, fbcLabels, // Table Data Included
            id: editId || `pid_${Date.now()}`, lastModified: Date.now()
        };
        if (window.api && window.api.savePatient) {
            await window.api.savePatient(payload);
            sessionStorage.removeItem('admission_draft'); 
            setMsgModal({ show: true, type: 'success', title: 'Saved', message: 'Record committed successfully.' });
        } else {
            setMsgModal({ show: true, type: 'error', title: 'Error', message: 'Bridge disconnected.' });
        }
    } catch (error) { setMsgModal({ show: true, type: 'error', title: 'Error', message: error.message }); } 
    finally { setIsSaving(false); }
  };

  // ==========================================
  // HANDLERS
  // ==========================================
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    let finalValue = type === 'checkbox' ? checked : value;
    // ✅ Fixed: Removed 'phn' so it now accepts text and symbols
if (name === 'contactNo' || name === 'bhtNo') finalValue = value.replace(/[^0-9]/g, '');
    if (name === 'nic') finalValue = value.replace(/[^0-9vVxX]/g, '').toUpperCase();
    setFormData(prev => ({ ...prev, [name]: finalValue }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
  };
  // 🟢 NEW: LINKED HANDLER FOR 35 & 36
const handleLinkedDischargeChange = (field, value) => {
    setFormData(prev => ({
        ...prev,
        // Updates the English data
        f35_data: { ...prev.f35_data, [field]: value },
        // Updates the Sinhala data at the same time
        f36_data: { ...prev.f36_data, [field]: value }
    }));
};
// --- MEDICATIONS TABLE ENGINE ---
// --- MEDICATIONS TABLE HANDLERS ---
  const addMedRow = () => {
    setFormData(p => ({
      ...p,
      medicationsOnDischarge: [...(p.medicationsOnDischarge || []), { name: '', dose: '', freq: '', duration: '', instructions: '' }]
    }));
  };

  const updateMedRow = (idx, field, val) => {
    const updated = [...formData.medicationsOnDischarge];
    updated[idx][field] = val;
    setFormData(p => ({ ...p, medicationsOnDischarge: updated }));
  };

  const removeMedRow = (idx) => {
    if (formData.medicationsOnDischarge.length > 1) {
      setFormData(p => ({
        ...p,
        medicationsOnDischarge: p.medicationsOnDischarge.filter((_, i) => i !== idx)
      }));
    }
  };

  const resetMedTable = () => {
    setFormData(p => ({
      ...p,
      medicationsOnDischarge: [{ name: '', dose: '', freq: '', duration: '', instructions: '' }]
    }));
  };
  // --- ALLERGY ---
const handleAllergyStatus = (t, s) => { 
    setFormData(p => { 
      const r = {...p.allergyRemarks}; 
      
      // 1. Pre-load the specific category (Food/Plaster/Drug)
      if(s === 'Positive' && !r[t]) {
          r[t] = `${t.charAt(0).toUpperCase() + t.slice(1)} Allergy - `; 
      }
      
      // 2. THE POLISH: Pre-load the General Note box as well
      if(s === 'Positive' && !r.general) {
          r.general = "Other Allergy Notes - ";
      }
      
      return {
          ...p, 
          allergies: {...p.allergies, [t]: s}, 
          allergyRemarks: r
      }; 
    }); 
  };  const handleDrugSelection = (d) => { setFormData(p => { const l=p.allergies.selectedDrugs; const n=l.includes(d)?l.filter(x=>x!==d):[...l,d]; const r={...p.allergyRemarks}; if(!l.includes(d) && !r[d]) r[d]=`${d} Allergy - `; return {...p, allergies:{...p.allergies, selectedDrugs:n}, allergyRemarks:r}; }); };
const addCustomDrug = () => { 
    if(tempOtherDrug.trim()){ 
      const drugName = tempOtherDrug.trim();
      setFormData(p => {
        const newRemarks = { ...p.allergyRemarks };
        // This is the magic line that pre-loads your custom drug name
        if (!newRemarks[drugName]) {
            newRemarks[drugName] = `${drugName} Allergy - `;
        }
        
        return {
          ...p, 
          allergies: {
            ...p.allergies, 
            selectedDrugs: [...p.allergies.selectedDrugs, drugName]
          },
          allergyRemarks: newRemarks
        };
      });
      setTempOtherDrug(""); 
    } 
  };  const handleAllergyRemarkChange = (k, v) => setFormData(p => ({...p, allergyRemarks:{...p.allergyRemarks, [k]:v}}));

  // --- OP NOTE ---
  const handleOpNoteChange = (f, v) => { setFormData(p => ({...p, opNote:{...p.opNote, [f]:v}})); if(f==='templateSearch') setShowTemplateList(true); };
// Load the structured template into the Main Form
  const selectTemplate = (t) => {
      setFormData(p => ({
          ...p,
          opNote: {
              ...p.opNote,
              templateSearch: t.name,
              topic: t.topic || "",
              opDate: t.opDate || "",       // <--- Loads the Date
              content: t.content || "",
              duration: t.duration || "",
              drugsGiven: t.drugsGiven || []
          }
      }));
      setShowTemplateList(false);
  };  const requestDeleteTemplate = (e, id) => { e.stopPropagation(); setTemplateToDelete(id); };
  const confirmDeleteTemplate = () => { if(templateToDelete) { setTemplates(p => p.filter(t => t.id !== templateToDelete)); setTemplateToDelete(null); } };
// --- THE FIX FOR LINE 670 ---
const filteredTemplates = (templates || []).filter(t => {
    // We use ?. and || "" to ensure we never call toLowerCase on undefined
    const templateName = (t?.name || "").toLowerCase();
    const searchString = (formData.opNote?.templateSearch || "").toLowerCase();
    return templateName.includes(searchString);
});
  // --- TABLE ---
  const addInvDay = () => setInvDays(p => [...p, `Day ${p.length+1}`]);
  const removeInvDay = () => { if(invDays.length>1) setInvDays(p => p.slice(0,-1)); };
  // 1. Add specific test from library to the table
 // 1. ADD FROM LIBRARY TO TABLE (Smart version that looks up sub-labels)
  const addTestToTable = (testName) => {
    const newId = `dyn_${Date.now()}`;
    // Find the full test object from your library to get the sub-labels
    const libraryEntry = labLibrary.find(l => l.name === testName);
    
    setInvRows(p => [...p, { 
        id: newId, 
        name: testName, 
        // If it has sub-labels, include them; otherwise, an empty array
        subLabels: libraryEntry?.subLabels || [] 
    }]);
    setShowLabModal(false);
  };

  // 2. Add a completely blank row
  const addBlankRow = () => {
    setInvRows(p => [...p, { id: `custom_${Date.now()}`, name: "" }]);
    setShowLabModal(false);
  };

  // 3. Save a new test into the permanent Library
  // 4. Delete a test from the library with confirmation
const requestDeleteTest = (e, index) => {
    e.stopPropagation();
    setTestToDelete(index);
    // setShowLabModal(false); // Optional: Uncomment this to hide library during confirm
    setMsgModal({
      show: true,
      type: 'error',
      title: 'Delete Test?',
      message: 'Are you sure you want to remove this test from your library?',
      isConfirm: true,
      confirmAction: 'DELETE_TEST'
    });
  };
 const saveTestToLibrary = () => {
    const cleanNewName = newLibraryTestName.replace(/\s+/g, ' ').trim();
    
    if (cleanNewName) {
      // Check if name already exists in library
      const alreadyExists = labLibrary.some(l => l.name.toLowerCase() === cleanNewName.toLowerCase());
      
      if (alreadyExists) {
        setMsgModal({ show: true, type: 'error', title: 'Duplicate', message: 'This test already exists in your library.' });
        return;
      }

      setLabLibrary(prev => [...prev, { name: cleanNewName, subLabels: [] }]);
      setNewLibraryTestName("");
    }
  };
  const removeInvRow = (id) => setInvRows(p => p.filter(r=>r.id!==id));
  // 4. SMART UPDATER (Handles Main Name and Sub-labels)
  const updateInvRowName = (id, v, field = 'name') => {
    setInvRows(p => p.map(r => r.id === id ? { ...r, [field]: v } : r));
  };
  const updateFbcLabel = (k, v) => setFbcLabels(p => ({...p, [k]:v}));
  const updateInvData = (rId, dIdx, v) => setInvData(p => ({...p, [rId]: {...(p[rId]||{}), [dIdx]:v}}));
  const handleResetRequest = () => setShowResetConfirm(true);
  const confirmResetTable = () => { setInvData({}); setInvDays(["Day 1"]); setInvRows(INITIAL_INV_ROWS); setFbcLabels(INITIAL_FBC_LABELS); setShowResetConfirm(false); };

  // --- EXAM ---
  const handleAbdomenClick = (i) => { const q=[...formData.abdomen.quadrants]; q[i]=!q[i]?'Tender':null; setFormData(p=>({...p, abdomen:{...p.abdomen, quadrants:q}})); };
  const updateQuadrant = (i, v) => { const q=[...formData.abdomen.quadrants]; q[i]=v; setFormData(p=>({...p, abdomen:{...p.abdomen, quadrants:q}})); };
  const addFinding = (s, v, setter) => { if(v.trim()){ setFormData(p=>({...p, [s]:{...p[s], otherFindings:[...p[s].otherFindings, v]}})); setter(""); } };
  // --- LOGIC FOR ADMISSION DRUGS (FIELD 29) ---

// 1. This function runs when you click the "+" button


// 2. This function runs when you click the "X" on a drug chip

  const removeFinding = (s, i) => { setFormData(p=>({...p, [s]:{...p[s], otherFindings:p[s].otherFindings.filter((_,x)=>x!==i)}})); };
  const handleRespChange = (s, f, v) => setFormData(p=>({...p, resp:{...p.resp, [s]:{...p.resp[s], [f]:v}}}));
  const handleDRECheckbox = (f, v) => setFormData(p=>({...p, abdomen:{...p.abdomen, dre:{...p.abdomen.dre, [f]:v}}}));
  const addDREFinding = () => { if(tempDREFinding.trim()){ setFormData(p=>({...p, abdomen:{...p.abdomen, dre:{...p.abdomen.dre, otherFindings:[...p.abdomen.dre.otherFindings, tempDREFinding]}}})); setTempDREFinding(""); } };
  const removeDREFinding = (i) => { setFormData(p=>({...p, abdomen:{...p.abdomen, dre:{...p.abdomen.dre, otherFindings:p.abdomen.dre.otherFindings.filter((_,x)=>x!==i)}}})); };
  const handleAddConsultant = () => { if(newConsultant.trim()){ setConsultants([...consultants, newConsultant]); setNewConsultant(""); } };
// DIRECT DELETE FUNCTION
  const handleDeleteConsultant = (docName) => {
      setConsultants(prev => prev.filter(c => c !== docName));
  };
  // ==========================================
  // PRINT ENGINE
  // ==========================================
// --- SURGICAL FIX: FETCH LAYOUTS FROM SQLITE ---
 // --- SURGICAL FIX: PRE-PRINT DATABASE CHECK ---
  const handleOpenPrintModal = async (mode, filter = []) => {
    // 1. KEEP: Basic Form Validation (Name/BHT check)
    if (!validateForm()) return;

    // 2. ADDED CONDITION: Check if record is saved (editId check)
    // If editId is null/undefined, it means the user hasn't clicked "Save Record" yet.
    if (!editId) {
        setMsgModal({
            show: true,
            type: 'error',
            title: 'Save Required',
            message: 'This record must be saved to the database before printing. Please click "Save Record" at the top to proceed.',
        });
        return; // This stops the code here so the modal below never opens
    }

    // 3. KEEP: Existing State Updates
    setPrintMode(mode);
    setSectionFilter(filter);

    // 4. KEEP: Existing Layout Fetching & Formatting logic
    if (window.api && window.api.getLayouts) {
      const dbLayouts = await window.api.getLayouts();
      
      // Mapping database columns back to UI names (Exactly as you had it)
      const formatted = dbLayouts.map(l => ({
        ...l,
        name: l.profile_name,
        fields: JSON.parse(l.coordinates || '[]')
      }));
      
      setSavedLayouts(formatted);
    }
    
    // 5. KEEP: Open the Layout Selection Modal
    setIsPrintModalOpen(true);
  };
const handlePrintExecution = (layout) => {
    // 1. DATA PREPARATION
    const printPayload = { 
        ...formData, 
        invDays, invRows, invData, fbcLabels,
        '34_med_table': formData.medicationsOnDischarge,
        '30_smart_complete': { 
            isSmartOpNote: true, 
            topic: formData.opNote.topic, 
            date: formData.opNote.opDate, 
            content: formData.opNote.content, 
            drugs: formData.opNote.drugsGiven, 
            duration: formData.opNote.duration 
        }
    };

    // Standard Checkboxes (16-20)
 // --- FIX: MODE OF ADMISSION TICKS (16) ---
    printPayload['16_self']  = formData.modeOfAdmission === 'Self' ? '✓' : '';
    printPayload['16_ref']   = formData.modeOfAdmission === 'Referred' ? '✓' : '';
    printPayload['16_trans'] = formData.modeOfAdmission === 'Transferred In' ? '✓' : '';

    // --- FIX: MODE OF DISCHARGE TICKS (17) ---
    printPayload['17_routine'] = formData.modeOfDischarge === 'Routine' ? '✓' : '';
    printPayload['17_trans']   = formData.modeOfDischarge === 'Transferred Out' ? '✓' : '';
    printPayload['17_self']    = formData.modeOfDischarge === 'Self Discharge' ? '✓' : '';
// --- FIX: GHOST TEXT BUG (Only print text if mode matches) ---
    printPayload['16_ref_text'] = (formData.modeOfAdmission === 'Referred') ? formData.referringDoctor : '';
    printPayload['16_trans_text'] = (formData.modeOfAdmission === 'Transferred In') ? formData.transferInHospital : '';
    printPayload['17_trans_text'] = (formData.modeOfDischarge === 'Transferred Out') ? formData.transferOutHospital : '';
    
  // --- FIX: YES/NO TICKS FOR 18, 19, 20 ---
    printPayload['18_yes'] = formData.diseaseNotification === 'Yes' ? '✓' : '';
    printPayload['18_no']  = formData.diseaseNotification === 'No' ? '✓' : '';

    printPayload['19_yes'] = formData.medicalCertificate === 'Yes' ? '✓' : '';
    printPayload['19_no']  = formData.medicalCertificate === 'No' ? '✓' : '';

    printPayload['20_yes'] = formData.insuranceForm === 'Yes' ? '✓' : '';
    printPayload['20_no']  = formData.insuranceForm === 'No' ? '✓' : '';

    // 2. MAPPING
    const mappedData = getPrintData(printPayload);
    const PAGE_WIDTH_MM = 148.5;
    const isRightSheet = (p, mode) => (mode === 'outer' && p === 1) || (mode === 'inner' && p === 3) || (mode === 'full' && (p === 1 || p === 3));
    let pages = printMode === 'outer' ? [1,4] : printMode === 'inner' ? [2,3] : [1,2,3,4];

   const items = (layout.fields || []).filter(f => {
        // 1. Only allow the current page selection
        if (!pages.includes(f.page)) return false;

        // 2. Section filtering
        if(printMode === 'section') return sectionFilter.includes(f.fieldNumber);

        // --- THE MASTER OVERLAP FIX ---
        if (entryMode === 'op_note') {
            // IF OP NOTE MODE: Hide History (23-28) AND Examination (29)
            if ([23, 24, 25, 26, 27, 28, 29].includes(f.fieldNumber)) return false;
        } else {
            // IF ROUTINE MODE: Hide the Op Note (30)
            if (f.fieldNumber === 30) return false;
        }

        return true;
    }).map(f => {
        // Initial value from payload or bridge
        let val = printPayload[f.id] || mappedData[f.fieldNumber];
        // --- ADD THIS BLOCK HERE ---
if ([18, 19, 20].includes(f.fieldNumber)) {
    // This stops the word "No" or "Yes" from appearing in the wrong box.
    // It only allows the tick mark (✓) assigned to the specific ID.
    val = printPayload[f.id] || ''; 
}
// ---------------------------
        // --- FIX: PREVENT OVERLAP & DUPLICATES ---
if (f.id.includes('img')) val = '';

        // === PAGE 1 FIXES (FIELDS 1-15 & 6) ===
if (f.fieldNumber === 1) val = formData.hospitalName;
        if (f.fieldNumber === 2) val = formData.phn;
        if (f.fieldNumber === 3) val = formData.contactNo;
        if (f.fieldNumber === 4) val = formData.nic;
        if (f.fieldNumber === 5) val = formData.bloodGroup;
        
        // FIELD 6: ALLERGIES (FIXED: Restore classic comma format for better resizing)
       // FIELD 6: ALLERGIES (Correct Comma Format)
// --- UPDATED FIELD 6: SUPERSCRIPT STATUS CODES ---
// --- UPDATED FIELD 6: COMPACT STATUS WITH PARENTHESES ---
// === FIELD 6: CLEAN STATUS INDICATORS ONLY ===
        if (f.fieldNumber === 6) {
            const al = formData.allergies;
            
            // 1. Create simple status indicators (Positive = ⁺ / Negative = ⁰)
            const fStatus = al.food === 'Positive' ? 'F⁺' : 'F⁰';
            const pStatus = al.plaster === 'Positive' ? 'P⁺' : 'P⁰';
            const dStatus = al.drug === 'Positive' ? 'D⁺' : 'D⁰';

            // 2. Final value: Just the codes, no drug names
            // This stays small and fits in any box size
            val = `${fStatus} , ${pStatus} , ${dStatus}`;
        }

        if (f.fieldNumber === 7) val = formData.patientName;
        if (f.fieldNumber === 8) val = formData.bhtNo;
        if (f.fieldNumber === 9) val = formData.ward;
        if (f.fieldNumber === 10) val = formData.age;
        if (f.fieldNumber === 11) val = formData.sex;
        if (f.fieldNumber === 12) val = formData.admissionDate;
        if (f.fieldNumber === 13) val = formData.dischargeDate;
        if (f.fieldNumber === 14) val = formData.principalDiagnosis;
        if (f.fieldNumber === 15) val = formData.comorbidities;
        if (f.fieldNumber === 21) val = formData.consultant;
        if (f.fieldNumber === 22) val = formData.moName;
        // --- Inside handlePrintExecution .map() ---

// Rule for 35
// Rule for 35
if (f.fieldNumber === 35 && formData.activeTemplates?.f35) {
    const d = formData.f35_data;
    val = `* Suture/Stapler removal on ${d.sutureDate || '____'} from OPD\n` +
          `* R/V at clinic after ${d.clinicWeeks || '__'} weeks\n` +
          `* R/V with histology report after ${d.histologyWeeks || '__'} weeks\n` +
          `* Other: ${formData.dischargePlan}`;
}

// Rule for 36 (Sinhala Printout)
// Rule for 36 (Sinhala Printout)
if (f.fieldNumber === 36 && formData.activeTemplates?.f36) {
    const d = formData.f36_data;
    // 🟢 Separated variables for printing
    const rmClinic = d.roomNoClinic || '4'; 
    const rmHisto = d.roomNoHistology || '4'; 
    
    val = `* ස්ටේප්ලර් / මැහුම් ඉවත් කිරීමට ${d.sutureDate || '____'} දින බාහිර රෝගී අංශයට එන්න.\n` +
          `* සති ${d.clinicWeeks || '__'} කට පසු සිකුරාදා උදේ 8ට කාමර අංක ${rmClinic} සායනයට එන්න.\n` +
          `* සති ${d.histologyWeeks || '__'} කට පසු වාර්තා පෙන්වීමට කාමර අංක ${rmHisto} සායනයට එන්න.`;
}

// Rule for 37
if (f.fieldNumber === 37 && formData.activeTemplates?.f37) {
    val = `MO OPD,\nDear Dr,\nPlease arrange stapler / suture removal on ${formData.f37_data?.sutureDate || '____'}.\nThank you.`;
}
        // --- UPGRADED MASTER OP NOTE PRINTER (FIELD 30) ---
     if (f.fieldNumber === 30) {
            const op = formData.opNote;
            const line = "_________________________________________________________";
            
            // 1. HEADER SECTION (Topic & Date)
            let masterString = `${line}\n\n`; 
            masterString += `TOPIC - ${(op.topic || "N/A").toUpperCase()}\n\n`; 
            masterString += `DATE - ${op.opDate || "N/A"}\n`;
            masterString += `${line}\n\n`; 

            // 2. PROCEDURE CONTENT SECTION
            // We use .replace to turn single line breaks into double breaks 
            // This makes Done by, Assisted by, etc. spread out automatically
            if (op.content) {
                const spacedContent = op.content.trim().split('\n').join('\n\n');
                masterString += `${spacedContent}\n`;
            } else {
                masterString += "No procedure notes recorded.\n";
            }
            
            masterString += `\n${line}\n\n`; 

            // 3. DRUGS GIVEN SECTION (Formatted as: DRUG - DURATION)
            if (Array.isArray(op.drugsGiven) && op.drugsGiven.length > 0) {
                const drugList = op.drugsGiven.map(d => `${d.name.toUpperCase()} - ${d.duration}`).join(' , ');
                masterString += `GIVEN DRUG - DURATION: ${drugList}\n`;
            } else {
                masterString += "GIVEN DRUG - DURATION: Nil\n";
            }
            masterString += `${line}`;

            val = masterString;
        }

        // History Master (23) - Handled separately via 'type'
       // History Master (23) - UPDATED TO INCLUDE DRUG HISTORY (27)
        // 1. DATA MAPPING: HISTORY MASTER (23) - CLEAN TITLES
       // 1. DATA MAPPING: HISTORY MASTER (23) - INCLUDES FIELD 28
       // 1. DATA MAPPING: HISTORY MASTER (23) - INCLUDES FIELD 28 (SOCIAL)
        // 1. DATA MAPPING: HISTORY MASTER (23) - INCLUDES FIELD 28 (SOCIAL)
// --- FULL DATA PREP FOR FIELD 23 ---
if (f.fieldNumber === 23) {
    const al = formData.allergies || {};
    const rem = formData.allergyRemarks || {};
    let alParts = [];
    
    // 1. ALLERGY SUB-LIST: Using single \n for tight vertical breaks
    // We only add '*' because your remark boxes already contain the labels
    if (al.food === 'Positive' && rem.food) {
        alParts.push(`* ${rem.food.trim()}`); 
    }
    if (al.plaster === 'Positive' && rem.plaster) {
        alParts.push(`* ${rem.plaster.trim()}`);
    }
    
    // 2. DRUG ROMAN NUMERALS: Printed on one line to save vertical space
    if (al.drug === 'Positive' && al.selectedDrugs?.length > 0) {
        const drugDetails = al.selectedDrugs.map((d, i) => {
            const roman = ['i', 'ii', 'iii', 'iv', 'v'][i] || (i + 1);
            return `${roman}. ${rem[d] || d}`;
        }).join('   '); // Triple space separator
        alParts.push(`* Drug allergy - ( ${drugDetails} )`);
    }

    if (rem.general && rem.general.trim().length > 5) {
        alParts.push(`* ${rem.general.trim()}`);
    }
    
    // Clean join with single line breaks
    const allergyFinalStr = alParts.filter(p => p.trim() !== '').join('\n');

    // Given Drugs formatting (Drug - Duration)
    const givenDrugsLines = (formData.generalExam?.admissionDrugs || [])
        .map(d => `${d.name} - ${d.duration}`)
        .join(', ');

    return {
        id: f.id, 
        // COORDINATE LOGIC RESTORED
        x: f.x + (isRightSheet(f.page, printMode) ? PAGE_WIDTH_MM : 0), 
        y: f.y, 
        width: f.width, 
        height: f.height,
        type: 'history_master_box', 
        value: { 
            'PRESENTING COMPLAINT': formData.presentingComplaint, 
            'HISTORY OF PRESENTING COMPLAINT': formData.historyOfComplaint, 
            'PAST MEDICAL HISTORY': formData.pastMedicalHistory, 
            'PAST SURGICAL HISTORY': formData.pastSurgicalHistory, 
            'DRUG AND ALLERGY HISTORY': allergyFinalStr || 'Nil significant', 
            'SOCIAL HISTORY': formData.socialHistory,
            'Given drugs': givenDrugsLines || 'Nil given' 
        }
    };
}

        // Exam Boxes (29)
        if (f.fieldNumber === 29) {
// --- UPDATED PRINT LOGIC FOR FIELD 29 ---
// Clean version for Field 29 - No drugs here anymore
// Clean version for Field 29 - General Section
if (f.id.includes('gen')) {
    const gen = formData.generalExam;
    const findings = [];

    // 1. Check all standard boxes
    if (gen.normal) findings.push("Normal");
    if (gen.pale) findings.push("Pale +");
    if (gen.icterus) findings.push("Icterus +");
    if (gen.ankleEdema) findings.push("Ankle Edema +");

    // 2. Combine with extra findings
    const allGen = [...findings, ...(gen.otherFindings || [])];

    // 3. Final formatted string for the print box
    val = `General: ${allGen.length > 0 ? allGen.join(', ') : 'Nil significant'}`;
}
          if (f.id.includes('cvs')) val = `CVS: Pulse - ${formData.cvs.pulse} bpm, BP ${formData.cvs.bpSys}/${formData.cvs.bpDia}mmHg. ${formData.cvs.otherFindings.join(', ')}`;
            if (f.id.includes('cns')) val = `CNS: GCS Score - ${formData.cns.gcs}/15.   ${formData.cns.other}`;
            if (f.id.includes('lung_r')) {
    const side = formData.resp.rightLung;
    const extra = (side.otherFindings || []).join(', ');
    val = `R: ${side.airEntry}, ${side.sound}${extra ? '. ' + extra : ''}`;
}

if (f.id.includes('lung_l')) {
    const side = formData.resp.leftLung;
    const extra = (side.otherFindings || []).join(', ');
    val = `L: ${side.airEntry}, ${side.sound}${extra ? '. ' + extra : ''}`;
}
            if (f.id.includes('abd_notes')) val = `Additional Abdominal Note -: ${formData.abdomen.additionalNotes}`;
if (f.id.includes('dre')) {
    const dre = formData.abdomen.dre;
    const findings = [];
    
    // 1. Check all standard checkboxes including the new Normal option
    if (dre.normal) findings.push("Normal");
    if (dre.hardStools) findings.push("Hard Stools");
    if (dre.bloodStained) findings.push("Blood Stained");
    if (dre.melena) findings.push("Melena");
    if (dre.enlargedProstate) findings.push("Enlarged Prostate");
    if (dre.mass) findings.push("Mass");
    
    // 2. Combine with the "Other Findings" array
    const allFindings = [...findings, ...(dre.otherFindings || [])];
    
    // 3. Join them into one clean string
    val = `DRE: ${allFindings.length > 0 ? allFindings.join(', ') : 'Nil significant'}`;
}         // --- FIX: STOP TEXT FROM PRINTING ON DIAGRAMS ---
    if (f.id.includes('img')) val = '';
        }

        // Final formatting
        if (val === 'Yes' || val === true) val = '✓';

        // SAFETY: Prevent React from trying to render raw objects
        if (typeof val === 'object' && val !== null && !f.id.includes('smart')) val = '';

        let x = f.x; if (isRightSheet(f.page, printMode)) x += PAGE_WIDTH_MM;
        
        return { 
            id: f.id, 
            x, 
            y: f.y, 
            width: f.width, 
            height: f.height, 
            value: val || '', 
            type: f.dataType,
            // --- THE FIX: ADD THIS LINE SO THE PRINTER KNOWS THE BOX NUMBER ---
            fieldNumber: f.fieldNumber, 
            specialType: (f.id === 'f_29_lung_img' || f.id === 'f_29_abd_img' || f.dataType === 'table_grid') ? 'visual' : 'text',
            fontSize: f.fontSize || 10 
        };
    }).filter(i => i !== null);

    // Force table for page 4 if missing
    if (pages.includes(4) && !items.some(i => i.specialType === 'visual' && i.id.includes('table'))) {
        items.push({ id: 'force_table_31', x: 10, y: 50, width: 120, specialType: 'visual', type: 'table_grid' });
    }

    setPrintItems(items); 
    setIsPrintModalOpen(false); 
    setTimeout(() => window.print(), 500);
  };

  const steps = [{id:1, title:"Admission Profile", icon:User}, {id:2, title:"Clinical History", icon:FileText}, {id:3, title:"Examination", icon:Stethoscope}, {id:4, title:"Management", icon:Activity}, {id:5, title:"Discharge Plan", icon:Save}];

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-6 font-sans pb-20 relative overflow-x-hidden">
      
      {/* ==========================================
          MODALS (THEMED GLASS UI)
          ========================================== */}
      <AnimatePresence>
        {msgModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col">
               <div className={`p-6 flex flex-col items-center text-center border-b ${msgModal.type === 'success' ? 'bg-green-50/50 border-green-100' : 'bg-red-50/50 border-red-100'}`}>
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${msgModal.type === 'success' ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                      {msgModal.type === 'success' ? <CheckCircle size={32} /> : <AlertTriangle size={32} />}
                  </div>
                  <h3 className={`text-xl font-black uppercase tracking-tight ${msgModal.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{msgModal.title}</h3>
               </div>
               <div className="p-8 text-center"><p className="text-slate-600 font-bold text-sm leading-relaxed">{msgModal.message}</p></div>
               <div className="p-4 bg-slate-50/50 border-t border-slate-100 flex gap-3 justify-center">
  {/* Scenario A: If this is a Confirmation Modal (Clear Form) */}
  {msgModal.isConfirm ? (
    <>
      <button 
        onClick={() => setMsgModal(null)} 
        className="flex-1 py-3 bg-slate-200 text-slate-600 rounded-xl font-bold uppercase text-[10px] tracking-wider hover:bg-slate-300 transition-all"
      >
        No, Keep Data
      </button>
      
     <button 
        onClick={() => {
          if (msgModal.confirmAction === 'DELETE_TEST') {
            // ACTION: Delete only the selected library test
            setLabLibrary(prev => prev.filter((_, i) => i !== testToDelete));
            setTestToDelete(null);
            setMsgModal(null);
          } else {
            // ACTION: Standard Full Form Wipe
            executeFinalClear();
          }
        }} 
        className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold uppercase text-[10px] tracking-wider shadow-lg hover:bg-red-700 transition-all"
      >
        Yes, Confirm
      </button>
    </>
  ) : (
    /* Scenario B: If this is a Standard Alert (Success/Error) */
    <button 
      onClick={() => { setMsgModal(null); if(msgModal.type === 'success') navigate('/dashboard'); }} 
      className="px-8 py-3 bg-slate-800 text-white rounded-xl font-bold uppercase text-xs shadow-lg hover:bg-black transition-all"
    >
      Okay, Got it
    </button>
  )}
</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showResetConfirm && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/30 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/90 backdrop-blur-xl border border-white/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
              <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner"><AlertTriangle size={32} /></div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Reset Table?</h3>
              <div className="flex gap-3 justify-center mt-6">
                <button onClick={() => setShowResetConfirm(false)} className="px-6 py-2 rounded-lg border border-slate-300 text-slate-600 font-bold hover:bg-white">Cancel</button>
                <button onClick={confirmResetTable} className="px-6 py-2 rounded-lg bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg">Yes, Reset</button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showManageConsultants && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <div className="bg-blue-600/90 backdrop-blur-md p-4 flex justify-between items-center relative z-10">
                <h3 className="text-white font-bold flex items-center gap-2"><Settings size={18} /> Manage Consultants</h3>
                <button onClick={() => setShowManageConsultants(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 relative z-10">
                <div className="flex gap-2 mb-6">
                  <input type="text" placeholder="Dr. Name" value={newConsultant} onChange={(e) => setNewConsultant(e.target.value)} className="flex-1 p-3 border border-slate-200/60 bg-white/50 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-bold backdrop-blur-sm" />
                  <button onClick={handleAddConsultant} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={20} /></button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {consultants.map((doc, idx) => (
                    <div key={idx} className="flex justify-between items-center p-3 bg-white/40 rounded-xl border border-white/60 shadow-sm">
                      <span className="font-bold text-slate-700 text-sm">{doc}</span>
<button 
    onClick={() => handleDeleteConsultant(doc)} 
    className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
>
    <Trash2 size={18} />
</button>                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        {/* NEW: MANAGE MO MODAL */}
        {showManageMO && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-4">
            <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="bg-white/70 backdrop-blur-xl border border-white/50 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden relative">
              <div className="bg-slate-800/90 backdrop-blur-md p-4 flex justify-between items-center relative z-10">
                <h3 className="text-white font-bold flex items-center gap-2"><Settings size={18} /> Manage MO List</h3>
                <button onClick={() => setShowManageMO(false)} className="text-white/80 hover:text-white"><X size={20} /></button>
              </div>
              <div className="p-6 relative z-10">
                <div className="flex gap-2 mb-6">
                  <input type="text" placeholder="Dr. Name" value={newMO} onChange={(e) => setNewMO(e.target.value)} className="flex-1 p-3 border border-slate-200/60 bg-white/50 rounded-xl focus:outline-none focus:border-blue-500 text-sm font-bold backdrop-blur-sm" />
                  <button onClick={handleAddMO} className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 shadow-lg"><Plus size={20} /></button>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                  {moList.map((doc, idx) => (
  <div key={idx} className={`flex justify-between items-center p-3 rounded-xl border transition-all ${defaultMO === doc ? 'bg-blue-50 border-blue-200 shadow-sm' : 'bg-white/40 border-white/60'}`}>
    <div className="flex items-center gap-3 flex-1 cursor-pointer" onClick={() => handleSetDefaultMO(doc)}>
      {/* SELECTION INDICATOR */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${defaultMO === doc ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
        {defaultMO === doc && <Check size={12} className="text-white" strokeWidth={4} />}
      </div>
      <span className={`font-bold text-sm ${defaultMO === doc ? 'text-blue-900' : 'text-slate-700'}`}>{doc}</span>
      {defaultMO === doc && <span className="text-[8px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-black uppercase">Active HO</span>}
    </div>
    
    <button onClick={() => handleDeleteMO(doc)} className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all">
      <Trash2 size={18} />
    </button>
  </div>
))}
                </div>
              </div>
            </motion.div>
          </div>
        )}
        
      </AnimatePresence>
      

     {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        
        {/* LEFT SIDE: NEW BRANDING CARD */}
        <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-sm">
                <div className="p-2 bg-blue-100 rounded-xl text-blue-600">
                    <Stethoscope size={24} />
                </div>
                <div className="flex flex-col items-end text-right">
                    <h2 className="text-[10px] font-bold text-slate-600 leading-tight">ජාතික රෝහල ගාල්ල</h2>
                    <h2 className="text-[10px] font-bold text-slate-600 leading-tight">தேசிய வைத்தியசாலை காலி</h2>
                    <h2 className="text-sm font-extrabold text-blue-900 leading-tight uppercase tracking-wide">National Hospital Galle</h2>
                </div>
            </div>
        </div>

        {/* RIGHT SIDE: ACTION BUTTONS (Kept exactly as they were) */}
        <div className="flex gap-3">
            <button onClick={() => navigate('/dashboard')} className="px-5 py-2.5 text-slate-500 font-bold hover:bg-slate-200 rounded-xl transition-colors">
                Cancel
            </button>
            <button onClick={handleSaveRecord} disabled={isSaving} className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl shadow-lg hover:bg-blue-700 flex items-center gap-2">
                <Save size={18} /> {isSaving ? "Saving..." : "Save Record"}
            </button>
            <button 
                onClick={handleClearForm}
                className="px-5 py-2.5 bg-red-50 text-red-600 font-bold hover:bg-red-100 rounded-xl transition-all flex items-center gap-2 border border-red-100"
            >
                <RotateCcw size={18} /> Clear Form
            </button>
        </div>

      </div>

      {/* STEPPER */}
      {/* STATIC WARNING BANNER */}
<div className="mb-4 flex items-center gap-3 bg-red-50/80 backdrop-blur-md p-3 rounded-2xl border border-red-100 shadow-sm animate-pulse">
    <div className="p-2 bg-red-100 rounded-xl text-red-600">
        <AlertTriangle size={20} />
    </div>
    <div className="flex flex-col">
        <h4 className="text-[10px] font-black text-red-800 uppercase tracking-widest">Data Safety Notice</h4>
        <p className="text-xs font-bold text-red-600/80">
            Leaving this page or refreshing will reset the form. Please click <span className="text-red-700">"Save Record"</span> before navigating away. And also make sure to <span className="text-red-700">"SAVE"</span> the patient data <span className="text-red-700">"BEFORE PRINT !"</span>
        </p>
    </div>
</div>
      <div className="flex items-center justify-between mb-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-100 overflow-x-auto">
        {steps.map((step) => (<button key={step.id} onClick={() => setActiveStep(step.id)} className="relative flex items-center gap-2 px-6 py-3 rounded-xl transition-all duration-300">{activeStep === step.id && (<motion.div layoutId="active-step-pill" className="absolute inset-0 bg-blue-100 rounded-xl" />)}<div className="relative z-10 flex items-center gap-2"><div className={`w-8 h-8 rounded-full flex items-center justify-center ${activeStep === step.id ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}><step.icon size={16} /></div><span className={`font-bold whitespace-nowrap ${activeStep === step.id ? 'text-blue-700' : 'text-slate-500'}`}>{step.title}</span></div></button>))}
      </div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1 */}
      {/* === STEP 1: ADMISSION PROFILE (FIELDS 1-22) === */}
      {activeStep === 1 && (
        <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
          
          {/* HEADER */}
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
            {/* FIELDS 1-5 */}
            <Input label="Hospital (1)" name="hospitalName" value={formData.hospitalName} onChange={handleChange} />
            <Input label="PHN (2)" name="phn" value={formData.phn} onChange={handleChange} />
            <Input label="Contact No (3)" name="contactNo" value={formData.contactNo} onChange={handleChange} placeholder="07xxxxxxxx" />
            <Input label="NIC No (4)" name="nic" value={formData.nic} onChange={handleChange} placeholder="97xxxxxxxV" />
<div className="md:col-span-2">
    <SegmentedControl 
        label="Blood Group (5)" 
        name="bloodGroup" 
        selected={formData.bloodGroup} 
        onChange={handleChange} 
        options={["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]} 
    />
</div>            
            {/* FIELD 6: ALLERGIES (WITH CHIPS) */}
            <div className="md:col-span-3 bg-red-50/50 border border-red-100 p-6 rounded-2xl">
               <label className="block text-xs font-bold text-red-600 uppercase mb-3 flex items-center gap-2"><ShieldAlert size={16} /> Allergies (6)</label>
               <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <AllergyToggle type="food" label="Food Allergy" status={formData.allergies.food} onToggle={handleAllergyStatus} />
                  <AllergyToggle type="plaster" label="Plaster Allergy" status={formData.allergies.plaster} onToggle={handleAllergyStatus} />
                  
                  <div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm">
                      <span className="text-sm font-bold text-slate-700 block mb-3">Drug Allergy</span>
                      <div className="flex bg-slate-100 rounded-lg p-1 mb-3">
                         <button onClick={() => handleAllergyStatus('drug', 'Positive')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.allergies.drug === 'Positive' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-white'}`}>+ Positive</button>
                         <button onClick={() => handleAllergyStatus('drug', 'Negative')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${formData.allergies.drug === 'Negative' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-white'}`}>- Negative</button>
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
                            
                            {/* CUSTOM DRUG INPUT */}
                            <div className="flex gap-2 mt-2">
                                <input type="text" placeholder="Add Other Drug..." value={tempOtherDrug} onChange={(e) => setTempOtherDrug(e.target.value)} className="flex-1 p-2 text-xs border rounded-lg focus:border-red-500 outline-none" />
                                <button onClick={addCustomDrug} className="px-3 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"><Check size={14}/></button>
                            </div>

                            {/* DRUG CHIPS DISPLAY */}
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

     {/* FIELDS 7-11: CLEAN PROFESSIONAL GRID */}
<div className="md:col-span-2">
    <Input label="Patient's Name (7)" name="patientName" value={formData.patientName} onChange={handleChange} />
</div>
<div className="md:col-span-1">
    <Input label="BHT No (8)" name="bhtNo" value={formData.bhtNo} onChange={handleChange} placeholder="Numbers Only" />
</div>

<div className="md:col-span-1">
    <div className="flex items-center justify-between mb-1.5">
        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ward/Unit (9)</label>
        {/* THE LOCK BUTTON */}
        <button 
            type="button" 
            onClick={toggleWardLock}
            className={`p-1.5 rounded-lg transition-all flex items-center gap-1 ${isWardLocked ? 'bg-red-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
            {isWardLocked ? <ShieldAlert size={12} /> : <Unlock size={12} />}
            <span className="text-[8px] font-black uppercase">{isWardLocked ? 'Locked' : 'Lock'}</span>
        </button>
    </div>
    {/* Becomes semi-transparent and unclickable when locked */}
    <div className={isWardLocked ? "opacity-50 pointer-events-none" : ""}>
        <SegmentedControl name="ward" selected={formData.ward} onChange={handleChange} options={["Ward 3", "Ward 5"]} isLocked={isWardLocked} />
    </div>
</div>

<div className="md:col-span-1">
    <Input label="Age (10)" name="age" value={formData.age} onChange={handleChange} type="number" />
</div>
<div className="md:col-span-1">
    <SegmentedControl label="Sex (11)" name="sex" selected={formData.sex} onChange={handleChange} options={["Male", "Female"]} />
</div>
{/* --- FIELDS 12 & 13: CLINICAL TIMELINE --- */}
<div className="md:col-span-1">
    <Input 
        label="Date Admission (12)" 
        name="admissionDate" 
        value={formData.admissionDate} 
        onChange={handleChange} 
        type="date" 
    />
</div>
<div className="md:col-span-1">
    <Input 
        label="Date Discharge (13)" 
        name="dischargeDate" 
        value={formData.dischargeDate} 
        onChange={handleChange} 
        type="date" 
    />
</div>
            
            {/* FIELDS 14-15 */}
            <div className="md:col-span-3 space-y-4">
              <Input label="Principal Diagnosis (14)" name="principalDiagnosis" value={formData.principalDiagnosis} onChange={handleChange} />
              <TextArea label="Co-morbidities / Surgeries / Procedures (15)" name="comorbidities" value={formData.comorbidities} onChange={handleChange} rows={2} placeholder="" />
            </div>
          </div>

          {/* FIELDS 16-20 (MODE OF ADMISSION & DISCHARGE / LEGAL) */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
              {/* Field 16 */}
              <div className="flex flex-col gap-3">
                 <label className="block text-xs font-bold text-slate-500 uppercase">Mode of Admission (16)</label>
                 <div className="flex flex-wrap gap-4">{["Self", "Referred", "Transferred In"].map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="modeOfAdmission" value={opt} checked={formData.modeOfAdmission === opt} onChange={handleChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div>
                 {formData.modeOfAdmission === 'Referred' && <input type="text" name="referringDoctor" value={formData.referringDoctor} onChange={handleChange} placeholder="By Whom?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
                 {formData.modeOfAdmission === 'Transferred In' && <input type="text" name="transferInHospital" value={formData.transferInHospital} onChange={handleChange} placeholder="From Which Hospital?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
              </div>
              
              {/* Field 17 */}
              <div className="flex flex-col gap-3">
                 <label className="block text-xs font-bold text-slate-500 uppercase">Mode of Discharge (17)</label>
                 <div className="flex flex-wrap gap-4">{["Routine", "Transferred Out", "Self Discharge"].map(opt => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name="modeOfDischarge" value={opt} checked={formData.modeOfDischarge === opt} onChange={handleChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div>
                 {formData.modeOfDischarge === 'Transferred Out' && <input type="text" name="transferOutHospital" value={formData.transferOutHospital} onChange={handleChange} placeholder="To Which Hospital?" className="w-full p-2 text-sm border border-blue-300 rounded-lg" />}
              </div>

              {/* Fields 18, 19, 20 */}
              <div className="flex gap-8 mt-2"><BooleanRadio label="Disease Notification (18)" name="diseaseNotification" selected={formData.diseaseNotification} onChange={handleChange} /><BooleanRadio label="Medical Cert. Issued (19)" name="medicalCertificate" selected={formData.medicalCertificate} onChange={handleChange} /></div>
              <div className="flex gap-8 mt-2"><BooleanRadio label="Insurance Form (20)" name="insuranceForm" selected={formData.insuranceForm} onChange={handleChange} /></div>
          </div>

          {/* FIELDS 21-22 (CONSULTANT & MO) */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
              <div className="flex items-end gap-2">
                  <div className="flex-1"><Select label="Consultant (21)" name="consultant" value={formData.consultant} onChange={handleChange} options={consultants} /></div>
                  <motion.button whileTap={{ scale: 0.9 }} onClick={() => setShowManageConsultants(true)} className="mb-[2px] p-2.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors" title="Manage Consultants"><Settings size={20} /></motion.button>
              </div>
{/* UPDATED FIELD 22: MO SELECTION DROPDOWN */}
          <div className="flex items-end gap-2">
              <div className="flex-1">
                <Select label="HO / MO Name (22)" name="moName" value={formData.moName} onChange={handleChange} options={moList} />
              </div>
              <motion.button 
                whileTap={{ scale: 0.9 }} 
                onClick={() => setShowManageMO(true)} 
                className="mb-[2px] p-2.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors" 
                title="Manage MOs"
              >
                <Settings size={20} />
              </motion.button>
          </div>          </div>
        </div>
      )}
        {/* STEP 2 */}
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
       {/* --- DYNAMIC ADMISSION DRUGS SECTION (FIELD 29) --- */}
<div className="mt-6 pt-4 border-t border-slate-100">
    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2 flex items-center gap-2">
        <Pill size={14} className="text-blue-600"/> Admission Drugs & Duration
    </label>

    {/* INPUT BOXES + THE ADD BUTTON */}
    <div className="flex gap-2 mb-4">
        <input 
            type="text" 
            placeholder="Drug Name..." 
            value={tempAdmDrug}
            onChange={(e) => setTempAdmDrug(e.target.value)}
            className="flex-[2] p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
        />
        <input 
            type="text" 
            placeholder="Duration..." 
            value={tempAdmDuration}
            onChange={(e) => setTempAdmDuration(e.target.value)}
            className="flex-1 p-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none font-bold bg-white"
        />
        <button 
            type="button"
            onClick={addAdmissionDrug}
            className="px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-lg transition-all font-black text-xl flex items-center justify-center"
        >
            +
        </button>
    </div>

    {/* THE LIST DISPLAY (CHIPS) */}
    <div className="flex flex-wrap gap-2">
        {formData.generalExam.admissionDrugs?.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full animate-entry shadow-sm">
                <span className="text-[10px] font-black text-blue-800 uppercase">{item.name}</span>
                <span className="text-[9px] font-bold text-blue-400 bg-white px-1.5 rounded-md border border-blue-100">
                    {item.duration}
                </span>
                <button 
                    type="button"
                    onClick={() => removeAdmissionDrug(idx)} 
                    className="text-red-400 hover:text-red-600 transition-colors ml-1"
                >
                    <X size={12} strokeWidth={3}/>
                </button>
            </div>
        ))}
    </div>
</div>
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
               <h3 className="text-lg font-bold text-blue-800 mb-6 uppercase tracking-wide border-b pb-2">3. Examination Findings (29) - (p2)</h3>
               <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                  {/* LEFT COLUMN */}
                  <div className="space-y-6">
                      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                         <h4 className="font-bold text-slate-700 mb-3 flex items-center gap-2"><Thermometer size={16} /> General</h4>
                         <div className="flex gap-4 mb-4">
  <Checkbox 
            label="Normal" 
            checked={formData.generalExam.normal} 
            onChange={(e) => handleNestedChange('generalExam', 'normal', e.target.checked)} 
        />
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
    <h4 className="font-bold text-slate-700 mb-4 flex items-center gap-2">
        <Wind size={16} /> Respiratory
    </h4>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* --- COLUMN 1: RIGHT LUNG --- */}
        <div className="space-y-4">
            <h5 className="font-bold text-slate-600 text-sm border-b border-slate-100 pb-1">Right Lung</h5>
            
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Air Entry</label>
                <Select 
                    value={formData.resp.rightLung.airEntry} 
                    onChange={(e) => handleRespChange('rightLung', 'airEntry', e.target.value)} 
                    options={["Equal", "Reduced", "Absent"]} 
                />
            </div>
            
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sound</label>
                <Select 
                    value={formData.resp.rightLung.sound} 
                    onChange={(e) => handleRespChange('rightLung', 'sound', e.target.value)} 
                    options={["Clear", "Crepts", "Rhonchi", "Wheeze"]} 
                />
            </div>

            {/* RESPONSIVE OTHER FIELD */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Other</label>
                <div className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        placeholder="Findings..." 
                        value={tempRightLung} 
                        onChange={(e) => setTempRightLung(e.target.value)}
                        className="flex-1 min-w-0 p-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white font-bold"
                    />
                    <button 
                        type="button" 
                        onClick={() => addRespFinding('rightLung', tempRightLung, setTempRightLung)} 
                        className="shrink-0 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm"
                    >
                        <Check size={16}/>
                    </button>
                </div>
                {/* CHIPS LIST */}
                <div className="mt-2 space-y-1">
                    {(formData.resp.rightLung.otherFindings || []).map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-blue-50/50 p-1.5 rounded text-[10px] border border-blue-100 animate-entry">
                            <span className="font-black text-blue-800 uppercase truncate mr-2">{f}</span>
                            <button type="button" onClick={() => removeRespFinding('rightLung', i)} className="text-red-400 hover:text-red-600">
                                <X size={12} strokeWidth={3}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* --- COLUMN 2: THE LUNG IMAGE (Centered) --- */}
        <div className="flex items-center justify-center py-4">
            {lungImg && <img src={lungImg} alt="Lung Diagram" className="w-full max-w-[140px] opacity-60 h-auto object-contain" />}
        </div>

        {/* --- COLUMN 3: LEFT LUNG --- */}
        <div className="space-y-4">
            <h5 className="font-bold text-slate-600 text-sm border-b border-slate-100 pb-1">Left Lung</h5>
            
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Air Entry</label>
                <Select 
                    value={formData.resp.leftLung.airEntry} 
                    onChange={(e) => handleRespChange('leftLung', 'airEntry', e.target.value)} 
                    options={["Equal", "Reduced", "Absent"]} 
                />
            </div>
            
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Sound</label>
                <Select 
                    value={formData.resp.leftLung.sound} 
                    onChange={(e) => handleRespChange('leftLung', 'sound', e.target.value)} 
                    options={["Clear", "Crepts", "Rhonchi", "Wheeze"]} 
                />
            </div>

            {/* RESPONSIVE OTHER FIELD */}
            <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Other</label>
                <div className="flex gap-2 items-center">
                    <input 
                        type="text" 
                        placeholder="Findings..." 
                        value={tempLeftLung} 
                        onChange={(e) => setTempLeftLung(e.target.value)}
                        className="flex-1 min-w-0 p-2 text-xs border border-slate-300 rounded-lg focus:border-blue-500 outline-none bg-white font-bold"
                    />
                    <button 
                        type="button" 
                        onClick={() => addRespFinding('leftLung', tempLeftLung, setTempLeftLung)} 
                        className="shrink-0 p-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-all shadow-sm"
                    >
                        <Check size={16}/>
                    </button>
                </div>
                {/* CHIPS LIST */}
                <div className="mt-2 space-y-1">
                    {(formData.resp.leftLung.otherFindings || []).map((f, i) => (
                        <div key={i} className="flex justify-between items-center bg-blue-50/50 p-1.5 rounded text-[10px] border border-blue-100 animate-entry">
                            <span className="font-black text-blue-800 uppercase truncate mr-2">{f}</span>
                            <button type="button" onClick={() => removeRespFinding('leftLung', i)} className="text-red-400 hover:text-red-600">
                                <X size={12} strokeWidth={3}/>
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        
    </div>
</div>
                  </div>
                  {/* RIGHT COLUMN */}
                  <div className="space-y-6">
                     <div className="bg-slate-300 p-4 rounded-xl border border-slate-400 shadow-sm relative">
    <div className="absolute top-0 right-0 p-2 bg-slate-400/50 rounded-bl-xl border-l border-b border-slate-400">
        <h4 className="font-bold text-slate-800 text-xs">Abdomen / DRE</h4>
    </div>

    {/* 🟢 ADD THESE TWO LINES HERE */}
    <div className="absolute top-5 left-8 font-black text-slate-500 text-sm pointer-events-none select-none">R</div>
    <div className="absolute top-5 left-[215px] font-black text-slate-500 text-sm pointer-events-none select-none">L</div>

    <div className="flex gap-6 mt-6">
        {/* ... Rest of your existing code remains exactly the same ... */}
                           <div className="relative mx-auto md:mx-0" style={{ width: '240px', height: '240px' }}>
                              <p className="text-[10px] font-bold text-slate-600 uppercase mb-2 text-center">Tenderness / Masses</p>
                              <div className="absolute inset-0 z-0"><div className="w-full h-full bg-white border-[2px] border-black" style={{ clipPath: OCTAGON_PATH }}><div className="grid grid-cols-3 grid-rows-3 w-full h-full">{formData.abdomen.quadrants.map((val, i) => (<div key={i} className={`border-[1px] border-black transition-colors ${val ? 'bg-[#d4af37]' : 'bg-transparent'}`} />))}</div></div></div>
                              <div className="absolute inset-0 z-10 grid grid-cols-3 grid-rows-3">{formData.abdomen.quadrants.map((val, i) => (<div key={i} onClick={() => handleAbdomenClick(i)} className="relative flex items-center justify-center cursor-pointer group">{!val && <span className="text-[10px] text-slate-900 font-bold opacity-0 group-hover:opacity-100 transition-opacity select-none">+</span>}{val && (<div className="absolute z-50" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 'auto' }}><div className="relative shadow-lg rounded bg-white border border-black"><select className="appearance-none bg-white text-xs font-bold text-slate-900 rounded py-1 pl-2 pr-6 focus:outline-none cursor-pointer" value={val} onChange={(e) => updateQuadrant(i, e.target.value)} onClick={(e) => e.stopPropagation()}><option value="Soft">Soft</option><option value="Tender">Tender</option></select><ChevronDown size={10} className="absolute right-1 top-1/2 -translate-y-1/2 text-black pointer-events-none"/><button onClick={(e) => { e.stopPropagation(); updateQuadrant(i, null); }} className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[8px] shadow-sm border border-white hover:bg-red-700 transition-colors"><X size={10} strokeWidth={3} /></button></div></div>)}</div>))}</div>
                           </div>
                           <div className="flex-1 p-4 bg-white rounded-xl border border-slate-300 h-fit">
                              <p className="text-sm font-bold text-slate-700 mb-3">DRE Findings:</p>
                              <div className="space-y-2 pl-2"><Checkbox 
            label="Normal" 
            checked={formData.abdomen.dre.normal} 
            onChange={(e) => handleDRECheckbox('normal', e.target.checked)} 
        /><Checkbox label="Hard Stools" checked={formData.abdomen.dre.hardStools} onChange={(e: any) => handleDRECheckbox('hardStools', e.target.checked)} /><Checkbox label="Blood Stained" checked={formData.abdomen.dre.bloodStained} onChange={(e: any) => handleDRECheckbox('bloodStained', e.target.checked)} /><Checkbox label="Melena" checked={formData.abdomen.dre.melena} onChange={(e: any) => handleDRECheckbox('melena', e.target.checked)} /><Checkbox label="Enlarged Prostate" checked={formData.abdomen.dre.enlargedProstate} onChange={(e: any) => handleDRECheckbox('enlargedProstate', e.target.checked)} /><Checkbox label="Mass" checked={formData.abdomen.dre.mass} onChange={(e: any) => handleDRECheckbox('mass', e.target.checked)} /></div>
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

        {activeStep === 4 && (
                 <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
                    {/* HEADER WITH INNER PRINT BUTTON */}
                    <div className="flex justify-between items-center border-b pb-2 mb-6">
                        <h3 className="text-lg font-bold text-blue-800 uppercase tracking-wide">4. Management & Investigations (p3)</h3>
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
            
            {/* Template Search */}
            <div className="mb-4 relative">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Load Template</label>
                <div className="flex gap-2">
                    <div className="relative flex-1">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 z-10" />
                        
                        <input 
                            type="text" 
                            placeholder="Search saved templates..." 
                            value={formData.opNote.templateSearch} 
                            onFocus={() => setShowTemplateList(true)} 
                            onChange={(e) => handleOpNoteChange('templateSearch', e.target.value)} 
                            className="w-full pl-9 p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 relative z-10" 
                        />
                        
                        {/* === CLICK OUTSIDE LAYER (Closes the list when you click away) === */}
                        {showTemplateList && (
                            <div 
                                className="fixed inset-0 z-[40] cursor-default" 
                                onClick={() => setShowTemplateList(false)}
                            ></div>
                        )}
                        
                        {/* === DROPDOWN LIST === */}
                        {showTemplateList && (
                            <div className="absolute top-full left-0 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-[50] max-h-48 overflow-y-auto">
                                {filteredTemplates.length > 0 ? filteredTemplates.map(t => (
                                    <div key={t.id} className="p-3 hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0 flex justify-between items-center" onClick={() => selectTemplate(t)}>
                                        <span className="text-sm font-bold text-slate-700">{t.name}</span>
                                      
                                    </div>
                                )) : <div className="p-3 text-sm text-slate-400 italic">No templates found.</div>}
                            </div>
                        )}
                    </div>
                    <button onClick={handleOpenNewTemplateModal} className="px-4 bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-100 font-bold flex items-center gap-2"><Plus size={16}/> New</button>
                <button 
    onClick={() => setShowManageTemplates(true)} 
    className="p-2.5 bg-slate-200 text-slate-600 rounded-lg hover:bg-slate-300 transition-colors shadow-sm" 
    title="Manage Templates"
>
    <Settings size={20} />
</button>
                </div>
            </div>

            {/* === NEW: TOPIC & DATE ROW === */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic / Surgery</label>
                    <input type="text" value={formData.opNote.topic} onChange={(e) => handleOpNoteChange('topic', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
                </div>
                <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                    <input type="date" value={formData.opNote.opDate} onChange={(e) => handleOpNoteChange('opDate', e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold text-slate-800" />
                </div>
            </div>

            <div className="mb-4">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Op Note Details</label>
                <textarea className="w-full p-4 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 h-48 resize-none font-mono text-sm" value={formData.opNote.content} onChange={(e) => handleOpNoteChange('content', e.target.value)} />
            </div>
            
            {/* --- MULTI-DRUG BUILDER (NO SURGERY DURATION) --- */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-2 flex items-center gap-2">
                <Pill size={14} className="text-blue-600"/> Given Drugs & Duration (Multi-Entry)
              </label>
              
              <div className="flex gap-2 mb-4">
                <input type="text" placeholder="Drug Name..." value={tempOpDrug} onChange={(e) => setTempOpDrug(e.target.value)} className="flex-[2] p-2.5 text-xs border border-slate-300 rounded-lg font-bold" />
                <input type="text" placeholder="Duration..." value={tempOpDuration} onChange={(e) => setTempOpDuration(e.target.value)} className="flex-1 p-2.5 text-xs border border-slate-300 rounded-lg" />
                <button type="button" onClick={addOpDrug} className="px-6 bg-blue-600 text-white rounded-lg font-black hover:bg-blue-700 shadow-md text-xl">+</button>
              </div>

              <div className="flex flex-wrap gap-2">
                {(Array.isArray(formData.opNote.drugsGiven) ? formData.opNote.drugsGiven : []).map((d, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1.5 rounded-full text-[10px] font-black text-blue-800 uppercase shadow-sm">
                    {d.name} — {d.duration}
                    <button type="button" onClick={() => removeOpDrug(idx)} className="text-red-400 hover:text-red-600 ml-1"><X size={12}/></button>
                  </div>
                ))}
              </div>
            </div>
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
                             {invRows.map((row) => {
                // Check if this row has sub-labels (Serum Electrolytes or UFR)
                const isComplex = row.subLabels && row.subLabels.length > 0;

                // --- SCENARIO A: COMPLEX PANEL (Serum Electrolytes / UFR) ---
                if (isComplex) {
                  return (
                    <React.Fragment key={row.id}>
                      {row.subLabels.map((subLabel, sIdx) => (
                        <tr key={`${row.id}_s${sIdx}`} className={sIdx % 2 === 0 ? "bg-white" : "bg-slate-50/30"}>
                          
                          {/* 1. EDITABLE MAIN TITLE (e.g., Serum Electrolytes) */}
                          {sIdx === 0 && (
                            <td className="border border-black bg-slate-100 p-0 w-10 align-middle" rowSpan={row.subLabels.length}>
  <div className="flex items-center justify-center h-full w-full">
    <input 
      className="bg-transparent text-center font-black text-[10px] outline-none focus:bg-white uppercase tracking-tighter"
      style={{ 
        writingMode: 'vertical-rl', 
        transform: 'rotate(180deg)',
        whiteSpace: 'nowrap'
      }}
      value={row.name} 
      onChange={(e) => updateInvRowName(row.id, e.target.value, 'name')}
    />
  </div>
</td>
                          )}

                          {/* 2. EDITABLE SUB-LABELS (e.g., Sodium, RBC) */}
                          <td className="p-0 border border-black" colSpan={2}>
                            <input 
                              className="w-full p-1.5 text-[10px] font-bold text-slate-700 outline-none bg-transparent focus:bg-white italic" 
                              value={subLabel} 
                              onChange={(e) => {
                                const newLabels = [...row.subLabels];
                                newLabels[sIdx] = e.target.value;
                                updateInvRowName(row.id, newLabels, 'subLabels');
                              }}
                            />
                          </td>

                          {/* 3. DATA INPUTS (STAY THE SAME) */}
                          {invDays.map((_, dIdx) => (
                            <td key={dIdx} className="p-0 border border-black">
                              <input 
                                className="w-full p-1.5 text-center text-xs outline-none focus:bg-blue-50 focus:ring-1 focus:ring-blue-400" 
                                value={invData[`${row.id}_s${sIdx}`]?.[dIdx] || ''} 
                                onChange={(e) => updateInvData(`${row.id}_s${sIdx}`, dIdx, e.target.value)} 
                              />
                            </td>
                          ))}
                          
                          <td className="border border-black text-center">
                            {sIdx === 0 && <button onClick={() => removeInvRow(row.id)} className="text-red-400 p-1 hover:bg-red-50 rounded"><Minus size={14}/></button>}
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  );
                }

                // --- STANDARD SINGLE ROW (AST, ALT, etc.) ---
                return (
                  <tr key={row.id}>
                    <td className="p-0 border border-black sticky left-0 z-10 bg-white" colSpan={3}>
                      <div className="flex justify-between items-center w-full">
                        <input className="w-full p-2 bg-transparent outline-none font-bold text-xs" value={row.name} onChange={(e) => updateInvRowName(row.id, e.target.value)} />
                        <button onClick={() => removeInvRow(row.id)} className="text-red-400 hover:text-red-600 pr-2"><Minus size={14}/></button>
                      </div>
                    </td>
                    {invDays.map((_, i) => (
                      <td key={i} className="p-0 border border-black">
                        <input className="w-full p-2 text-center text-xs outline-none" value={invData[row.id]?.[i] || ''} onChange={(e) => updateInvData(row.id, i, e.target.value)} />
                      </td>
                    ))}
                    <td className="border border-black bg-slate-50"></td>
                  </tr>
                );
              })}
                          </tbody>
                       </table>
                       <div className="mt-4 flex justify-center">
                          <button onClick={() => setShowLabModal(true)} className="w-8 h-8 rounded-full border border-slate-300 flex items-center justify-center hover:bg-slate-100 text-slate-500 transition-colors"><Plus size={16}/></button>
                       </div>
                    </div>
        
                    <div className="mt-6">
                       <TextArea label="Special Investigations (32)" name="specialInvestigations" value={formData.specialInvestigations} onChange={handleChange} rows={2} placeholder="Histology, CT, MRI..." />
                    </div>
                 </div>
              )}

        {/* STEP 5 */}
       {/* === STEP 5: DISCHARGE PLAN (FIELDS 33-37) === */}
       {/* === STEP 5: DISCHARGE PLAN (FIELDS 33-37) === */}
        {/* === STEP 5: DISCHARGE PLAN (FIELDS 33-37) STACKED === */}
        {/* === STEP 5: DISCHARGE PLAN (FIELDS 33-37) === */}
       {activeStep === 5 && (
            <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-lg border border-white/50 animate-entry">
                <div className="flex justify-between items-center border-b-2 border-slate-100 pb-4 mb-8">
                    <h3 className="text-xl font-bold text-blue-800 uppercase tracking-wide">5. Discharge & Referral Plan (p4) </h3>

                    
                    {/* --- HIGH-CONTRAST PRINT BAR --- */}
{/* --- PROFESSIONAL PRINT BAR (STEP 5) --- */}
<div className="flex flex-wrap items-center gap-3 mt-10 p-4 bg-slate-50/50 backdrop-blur-sm rounded-2xl border border-slate-200 w-fit shadow-inner">
    
    <motion.button 
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => handleOpenPrintModal('outer')} 
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-blue-200 text-blue-700 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-blue-50 transition-all"
    >
        <Layout size={14} strokeWidth={3} />
        <span>Print Cover ( pg 1-4 )</span>
    </motion.button>

    <motion.button 
        whileHover={{ y: -2 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => handleOpenPrintModal('inner')} 
        className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-300 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-wider shadow-sm hover:bg-slate-50 transition-all"
    >
        <FileText size={14} strokeWidth={3} />
        <span>Print Inner ( pg 2-3 )</span>
    </motion.button>

    <div className="w-px h-6 bg-slate-300 mx-1"></div>

</div>
                </div>

                <div className="space-y-10">
                    {/* FIELD 33 */}
<Input 
    label="Condition at Discharge (33)" 
    name="conditionAtDischarge" 
    value={formData.conditionAtDischarge} 
    onChange={handleChange} 
    onFocus={(e) => e.target.select()} // 🟢 NEW: Highlights all text when clicked
    placeholder="type here..." 
/>
                    {/* FIELD 34: HIGH-VISIBILITY CLINICAL TABLE */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-end px-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Medications on Discharge (34)</label>
                            <button onClick={resetMedTable} className="text-[9px] font-black text-red-500 uppercase border-b border-red-200 hover:text-red-700 transition-colors">
                                Reset Table
                            </button>
                        </div>

                        <div className="border-2 border-black rounded-xl overflow-hidden bg-white">
                            <table className="w-full border-collapse">
                                <thead className="bg-slate-200 border-b-2 border-black">
                                    <tr>
                                        <th className="p-3 text-left text-[11px] font-black text-black uppercase border-r border-black w-1/3">Drug Medication</th>
                                        <th className="p-3 text-center text-[11px] font-black text-black uppercase border-r border-black">Dose</th>
                                        <th className="p-3 text-center text-[11px] font-black text-black uppercase border-r border-black">Frequency</th>
                                        <th className="p-3 text-center text-[11px] font-black text-black uppercase border-r border-black">Duration</th>
                                        <th className="p-3 text-left text-[11px] font-black text-black uppercase">Instructions</th>
                                        <th className="p-3 w-10"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-black">
                                    {(formData.medicationsOnDischarge || []).map((row, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/50">
                                            <td className="p-1 border-r border-black">
                                                <input className="w-full p-2 text-xs font-bold text-black bg-transparent outline-none placeholder:text-slate-300" value={row.name} onChange={(e) => updateMedRow(idx, 'name', e.target.value)} placeholder="type drug name here..." />
                                            </td>
                                            <td className="p-1 border-r border-black">
                                                <input className="w-full p-2 text-xs font-bold text-black bg-transparent outline-none text-center placeholder:text-slate-300" value={row.dose} onChange={(e) => updateMedRow(idx, 'dose', e.target.value)} placeholder="500mg" />
                                            </td>
                                            <td className="p-1 border-r border-black">
                                                <input className="w-full p-2 text-xs font-bold text-black bg-transparent outline-none text-center placeholder:text-slate-300" value={row.freq} onChange={(e) => updateMedRow(idx, 'freq', e.target.value)} placeholder="TDS" />
                                            </td>
                                            <td className="p-1 border-r border-black">
                                                <input className="w-full p-2 text-xs font-bold text-black bg-transparent outline-none text-center placeholder:text-slate-300" value={row.duration} onChange={(e) => updateMedRow(idx, 'duration', e.target.value)} placeholder="5 Days" />
                                            </td>
                                            <td className="p-1 border-r-0">
                                                <input className="w-full p-2 text-xs font-bold text-black bg-transparent outline-none placeholder:text-slate-300" value={row.instructions} onChange={(e) => updateMedRow(idx, 'instructions', e.target.value)} placeholder="type here..." />
                                            </td>
                                            <td className="p-1 text-center">
                                                <button onClick={() => removeMedRow(idx)} className="text-slate-300 hover:text-red-600"><Minus size={18}/></button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <button onClick={addMedRow} className="w-full py-3 border-2 border-dashed border-slate-300 text-slate-400 rounded-xl font-black text-[11px] uppercase hover:bg-slate-50 hover:border-blue-400 hover:text-blue-500 transition-all flex items-center justify-center gap-2">
                            <Plus size={16} /> Add Medication Line
                        </button>
                    </div>

                    {/* FIELDS 35, 36, 37 */}
                    {/* --- FIELD 35: DISCHARGE PLAN (SMART) --- */}
{/* FIELD 35 */}
{/* --- FIELD 35: DISCHARGE PLAN (SMART) --- */}
{/* --- FIELD 35: DISCHARGE PLAN (SMART) --- */}
<div className="bg-white p-6 rounded-2xl border-2 border-slate-100 mb-6 shadow-sm">
    <div className="flex justify-between items-center mb-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discharge Plan (35)</label>
        <button onClick={() => setFormData(p => ({...p, activeTemplates: {...(p.activeTemplates || {}), f35: !p.activeTemplates?.f35}}))} className="px-4 py-1.5 rounded-lg font-black text-[10px] uppercase bg-blue-600 text-white shadow-md">
            {formData.activeTemplates?.f35 ? '✓ Active' : '+ Load Template'}
        </button>
    </div>
    {!formData.activeTemplates?.f35 ? <TextArea name="dischargePlan" value={formData.dischargePlan} onChange={handleChange} rows={3} /> : (
        <div className="space-y-4 bg-blue-50/30 p-4 rounded-xl border border-blue-100 text-sm font-bold text-slate-700 animate-entry">
            
            {/* 1. Suture Date Link */}
            <div className="flex items-center gap-2 flex-wrap">
                Suture / stapler removal on 
                <input 
                    type="date" 
                    value={formData.f35_data?.sutureDate || ''} 
                    onChange={(e) => handleLinkedDischargeChange('sutureDate', e.target.value)} // 🟢 Changed
                    className="p-1 border rounded" 
                /> from OPD
            </div>

            {/* 2. Clinic Weeks Link */}
            <div className="flex items-center gap-2 flex-wrap">
                R/V at clinic after 
                <input 
                    type="number" 
                    value={formData.f35_data?.clinicWeeks || ''} 
                    onChange={(e) => handleLinkedDischargeChange('clinicWeeks', e.target.value)} // 🟢 Changed
                    className="w-12 p-1 border rounded text-center" 
                /> weeks.
            </div>

            {/* 3. Histology Weeks Link */}
            <div className="flex items-center gap-2 flex-wrap">
                R/V with histology report after 
                <input 
                    type="number" 
                    value={formData.f35_data?.histologyWeeks || ''} 
                    onChange={(e) => handleLinkedDischargeChange('histologyWeeks', e.target.value)} // 🟢 Changed
                    className="w-12 p-1 border rounded text-center" 
                /> weeks.
            </div>

            <div className="flex items-center gap-2 flex-wrap">Other - <input type="text" value={formData.dischargePlan} name="dischargePlan" onChange={handleChange} className="flex-1 p-1 border rounded font-medium" placeholder="Alphabetical letters & Numerical numbers" /></div>
        </div>
    )}
</div>

{/* --- FIELD 36: SINHALA INSTRUCTIONS (SMART) --- */}
{/* --- FIELD 36: SINHALA INSTRUCTIONS (SMART) --- */}
<div className="bg-white p-6 rounded-2xl border-2 border-slate-100 mb-6 shadow-sm">
    <div className="flex justify-between items-center mb-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Sinhala Instructions (36)</label>
        <button onClick={() => setFormData(p => ({...p, activeTemplates: {...(p.activeTemplates || {}), f36: !p.activeTemplates?.f36}}))} className="px-4 py-1.5 rounded-lg font-black text-[10px] uppercase bg-orange-600 text-white shadow-md">
            Template
        </button>
    </div>
    {!formData.activeTemplates?.f36 ? <TextArea name="instructionsSinhalaTamil" value={formData.instructionsSinhalaTamil} onChange={handleChange} rows={3} /> : (
        <div className="space-y-4 bg-orange-50/30 p-4 rounded-xl border border-orange-100 text-sm font-bold text-slate-800 leading-loose animate-entry">
            
            {/* 1. Sinhala Suture Date Link */}
            <div className="flex items-center gap-2 flex-wrap">
                ස්ටේප්ලර් / මැහුම් ඉවත් කිරීමට 
                <input 
                    type="date" 
                    value={formData.f36_data?.sutureDate || ''} 
                    onChange={(e) => handleLinkedDischargeChange('sutureDate', e.target.value)} // 🟢 Changed
                    className="p-1 border rounded bg-white" 
                /> දිනදී බාහිර රෝගී අංශයට පැමිණෙන්න.
            </div>

            {/* 2. Sinhala Clinic Weeks Link */}
            <div className="flex items-center gap-2 flex-wrap">
                සති 
                <input 
                    type="number" 
                    value={formData.f36_data?.clinicWeeks || ''} 
                    onChange={(e) => handleLinkedDischargeChange('clinicWeeks', e.target.value)} // 🟢 Changed
                    className="w-12 p-1 border rounded text-center" 
                /> 
                කට පසු සිකුරාදා උදෑසන 8ට කාමර අංක 
                <input 
                    type="number" 
                    value={formData.f36_data?.roomNoClinic || '4'} 
                    onChange={(e) => handleNestedChange('f36_data', 'roomNoClinic', e.target.value)} 
                    className="w-12 p-1 border rounded text-center text-blue-600 font-black appearance-none" 
                /> සායනයට පැමිණෙන්න.
            </div>

            {/* 3. Sinhala Histology Weeks Link */}
            <div className="flex items-center gap-2 flex-wrap">
                සති 
                <input 
                    type="number" 
                    value={formData.f36_data?.histologyWeeks || ''} 
                    onChange={(e) => handleLinkedDischargeChange('histologyWeeks', e.target.value)} // 🟢 Changed
                    className="w-12 p-1 border rounded text-center" 
                /> 
                පසු පරීක්ෂණ වාර්තා ලබාගෙන කාමර අංක 
                <input 
                    type="number" 
                    value={formData.f36_data?.roomNoHistology || '4'} 
                    onChange={(e) => handleNestedChange('f36_data', 'roomNoHistology', e.target.value)} 
                    className="w-12 p-1 border rounded text-center text-blue-600 font-black appearance-none" 
                /> සායනයට පෙන්වන්න.
            </div>
        </div>
    )}
</div>

{/* --- FIELD 37: REFERRAL LETTER (SMART) --- */}
<div className="bg-white p-6 rounded-2xl border-2 border-slate-100 shadow-sm">
    <div className="flex justify-between items-center mb-4">
        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Referral Note (37)</label>
        <button onClick={() => setFormData(p => ({...p, activeTemplates: {...(p.activeTemplates || {}), f37: !p.activeTemplates?.f37}}))} className="px-4 py-1.5 rounded-lg font-black text-[10px] uppercase bg-emerald-600 text-white shadow-md">
            MO OPD Letter
        </button>
    </div>
    {!formData.activeTemplates?.f37 ? <TextArea name="referralNote" value={formData.referralNote} onChange={handleChange} rows={3} /> : (
        <div className="p-6 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200 font-serif font-bold text-slate-800 animate-entry">
            <p>MO OPD,</p><p className="mt-2">Dear Dr,</p>
            <div className="flex items-center gap-2 mt-4 flex-wrap">Please arrange stapler / suture removal on: <input type="date" value={formData.f37_data?.sutureDate || ''} onChange={(e) => handleNestedChange('f37_data', 'sutureDate', e.target.value)} className="p-1 border-b-2 border-blue-500 bg-transparent font-bold outline-none" /></div>
            <p className="mt-6 text-right italic">Thank you.</p>
        </div>
    )}
</div>

</div>

                <div className="mt-12 flex justify-end">
                    <button onClick={handleSaveRecord} disabled={isSaving} className="px-12 py-5 bg-green-600 text-white font-black uppercase text-sm rounded-2xl shadow-2xl shadow-green-100 hover:bg-green-700 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center gap-3">
                        <FileCheck size={24} /> {isSaving ? "Finalizing..." : "Complete & Save All Records"}
                    </button>
                </div>
            </div>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-8">
         <button disabled={activeStep === 1} onClick={() => setActiveStep(p => p - 1)} className="px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold disabled:opacity-50 hover:bg-slate-50 flex items-center gap-2"><ChevronLeft size={20} /> Previous</button>
         <button disabled={activeStep === 5} onClick={() => setActiveStep(p => p + 1)} className="px-6 py-3 rounded-xl bg-blue-600 text-white font-bold disabled:opacity-50 hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">Next Step <ChevronRight size={20} /></button>
      </div>

      {isPrintModalOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center"><h3 className="font-black text-lg text-slate-800">Select Layout</h3><button onClick={() => setIsPrintModalOpen(false)}><X size={24} className="text-slate-400"/></button></div>
            <div className="p-6 max-h-[400px] overflow-y-auto">
              {savedLayouts.map(l => <button key={l.id} onClick={() => handlePrintExecution(l)} className="w-full flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-blue-50 transition-all"><div className="p-3 bg-white rounded-lg text-slate-400"><FileText size={24}/></div><div className="text-left font-bold text-slate-700">{l.profile_name || l.name}</div></button>)}
            </div>
          </div>
        </div>
      )}

      {/* HIDDEN PRINT LAYER */}
      <div className="hidden print:block fixed inset-0 z-[10000] bg-white pointer-events-none">
        <style>{`@media print { @page { size: A4 landscape; margin: 0mm !important; } html, body { margin: 0 !important; width: 297mm; height: 210mm; } body * { visibility: hidden; } .print-layer, .print-layer * { visibility: visible; } .print-layer { position: fixed; left: 0; top: 0; width: 297mm; height: 210mm; } }`}</style>
        <div className="print-layer relative w-[297mm] h-[210mm]">
{/* HIDDEN PRINT LAYER */}
      <div className="hidden print:block fixed inset-0 z-[10000] bg-white pointer-events-none">
        <style>{`@media print { @page { size: A4 landscape; margin: 0mm !important; } html, body { margin: 0 !important; width: 297mm; height: 210mm; } body * { visibility: hidden; } .print-layer, .print-layer * { visibility: visible; } .print-layer { position: fixed; left: 0; top: 0; width: 297mm; height: 210mm; } }`}</style>
        <div className="print-layer relative w-[297mm] h-[210mm]">
       {printItems.map((item) => {
            // 1. DATA PREP & IDENTIFICATION
            const textVal = typeof item.value === 'string' ? item.value : '';
            const isTick = textVal === '✓';
            
            // === SPECIAL TYPE: HISTORY MASTER (FIELD 23) ===
            // === 1. UPGRADED LIQUID HISTORY MASTER (Field 23) ===
           // === 2. CLEAN REPORT-STYLE HISTORY MASTER (Field 23) ===
           // === 2. ULTRA-CLEAN LIQUID HISTORY MASTER (Field 23) ===
           // === 2. SPACED-OUT LIQUID HISTORY MASTER (Field 23) ===
           // === ULTRA-STRICT LIQUID HISTORY MASTER (Field 23) ===
// === 2. SPACED-OUT LIQUID HISTORY MASTER (Field 23) ===
          // === POLISHED LIQUID HISTORY MASTER (Field 23) ===
     // === UPGRADED AGGRESSIVE HISTORY MASTER (FIELD 23) ===
// === BALANCED HISTORY MASTER ENGINE (FIELD 23) ===
// === POWER-BOOSTED HISTORY MASTER (FIELD 23) ===
// === NUMBERED HISTORY MASTER ENGINE (FIELD 23) ===
// === NUMBERED & SCALED MASTER ENGINE (FIELD 23) ===
// === BULLETPROOF VERTICAL SCALING ENGINE (FIELD 23) ===
// === BIG & BOLD HISTORY MASTER ENGINE ===
// === FULL FEATURE MASTER RENDERER ===
if (item.type === 'history_master_box') {
    const data = item.value || {};
    const hEntries = Object.entries(data).filter(([_, text]) => text && String(text).trim() !== '');
    
    if (hEntries.length === 0) return null;

    let totalChars = 0;
    let totalLines = 0;
    
    hEntries.forEach(([label, text]) => {
        const cleanText = String(text);
        totalChars += (label.length + cleanText.length);
        // Every \n in the text counts as a new line of vertical pressure
        totalLines += 1 + (cleanText.match(/\n/g) || []).length;
    });

    // THE MATH: 30 virtual characters per line to force shrinkage
    const gapPenalty = (hEntries.length * 20) + (totalLines * 30);
    const hChars = (totalChars + gapPenalty) || 1;
    const hArea = item.width * item.height; 
    
    let hFluidFS = Math.sqrt(hArea / hChars) * 2.9; 

    // Final readable boundaries
    if (hFluidFS > 10.5) hFluidFS = 10.5;
    if (hFluidFS < 7.5) hFluidFS = 7.5; 

    return (
        <div key={item.id} className="absolute flex flex-col font-bold text-black" 
             style={{ 
                 left: `${item.x}mm`, top: `${item.y}mm`, 
                 width: `${item.width}mm`, height: `${item.height}mm`, 
                 overflow: 'hidden', 
                 fontSize: `${hFluidFS.toFixed(1)}pt`, 
                 lineHeight: '1.05', 
                 wordBreak: 'break-all', 
                 overflowWrap: 'anywhere'
             }}>
            {hEntries.map(([label, text], idx) => (
                <div key={label} style={{ marginBottom: '4px' }}> 
                    <div style={{ textTransform: 'uppercase', color: '#475569', fontSize: '0.85em', marginBottom: '0px' }}>
                        {idx + 1}. {label}
                    </div>
                    <div style={{ whiteSpace: 'pre-wrap', color: 'black' }}>
                        {text}
                    </div>
                </div>
            ))}
        </div>
    );
}

            // === SPECIAL TYPE: VISUALS (TABLES & DIAGRAMS) ===
            // === UPGRADED HIGH-FIDELITY INVESTIGATION TABLE (FIELD 31) ===
            // === MASTER TABLE ROUTER (FIXED: Added Rows included) ===
            if (item.type === 'table_grid') {
                
                // --- CASE 31: INVESTIGATIONS (Labs) ---
               // === CASE 31: SMART SCALING INVESTIGATION TABLE (Labs) ===
if (item.fieldNumber === 31) {
  // 1. THE MATH: Count every single row to calculate vertical space
  let totalRows = 1; // Start with Header
  totalRows += 4;    // Add 4 rows for the FBC section
  
  invRows.forEach(row => {
    const isComplex = row.subLabels && row.subLabels.length > 0;
    totalRows += isComplex ? row.subLabels.length : 1;
  });

  // 2. THE PRECISION SCALER
  const availableHeightMm = item.height;
  // Multiplier 1.8 ensures rows have enough padding to be readable
  let fluidLabFS = (availableHeightMm / totalRows) * 1.8; 

  // 3. SAFETY CAPS (Keep it between 5pt and 9pt)
  if (fluidLabFS > 9.0) fluidLabFS = 9.0;
  if (fluidLabFS < 5.0) fluidLabFS = 5.0;

  return (
    <div key={item.id} className="absolute bg-white overflow-hidden" 
         style={{ 
           left: `${item.x}mm`, 
           top: `${item.y}mm`, 
           width: `${item.width}mm`, 
           height: `${item.height}mm`, // Forcing the vertical boundary
           zIndex: 20 
         }}>
        <table className="w-full border-collapse border-[1px] border-black font-bold leading-none"
               style={{ fontSize: `${fluidLabFS.toFixed(1)}pt` }}>
            <thead className="bg-slate-100 text-black border-b-[1px] border-black">
                <tr>
                    <th className="border-r border-black p-[1px] text-left pl-1" colSpan={3}>Investigation</th>
                    {invDays.map((d, i) => (<th key={i} className="border-l border-black p-[1px] text-center">{d}</th>))}
                </tr>
            </thead>
            <tbody className="text-black">
                {/* FBC SECTION */}
                <tr className="border-b border-black">
                    <td className="border-r border-black text-center align-middle" rowSpan={4} style={{ width: '8mm' }}>{fbcLabels.main}</td>
                    <td className="border-r border-black px-1" colSpan={2}>{fbcLabels.hb}</td>
                    {invDays.map((_, i) => <td key={i} className="border-l border-black text-center">{invData['fbc_hb']?.[i] || ''}</td>)}
                </tr>
                <tr className="border-b border-black">
                    <td className="border-r border-black text-center align-middle" rowSpan={2} style={{ width: '8mm' }}>{fbcLabels.wbc}</td>
                    <td className="border-r border-black px-1">{fbcLabels.n}</td>
                    {invDays.map((_, i) => <td key={i} className="border-l border-black text-center">{invData['fbc_n']?.[i] || ''}</td>)}
                </tr>
                <tr className="border-b border-black">
                    <td className="border-r border-black px-1">{fbcLabels.l}</td>
                    {invDays.map((_, i) => <td key={i} className="border-l border-black text-center">{invData['fbc_l']?.[i] || ''}</td>)}
                </tr>
                <tr className="border-b border-black">
                    <td className="border-r border-black px-1" colSpan={2}>{fbcLabels.plt}</td>
                    {invDays.map((_, i) => <td key={i} className="border-l border-black text-center">{invData['fbc_plt']?.[i] || ''}</td>)}
                </tr>

                {/* DYNAMIC ROWS */}
                {invRows.map((row) => {
                    const isComplex = row.subLabels && row.subLabels.length > 0;
                    if (isComplex) {
                        return row.subLabels.map((subLabel, sIdx) => (
                            <tr key={`${row.id}_${sIdx}`} className="border-b border-black">
                                {sIdx === 0 && (
                                    <td className="border-r border-black text-center font-black align-middle px-1" rowSpan={row.subLabels.length} style={{ width: '8mm' }}>{row.name}</td>
                                )}
                                <td className="border-r border-black px-1" colSpan={2}>{subLabel}</td>
                                {invDays.map((_, dIdx) => (<td key={dIdx} className="border-l border-black text-center">{invData[`${row.id}_s${sIdx}`]?.[dIdx] || ''}</td>))}
                            </tr>
                        ));
                    }
                    return (
                        <tr key={row.id} className="border-b border-black">
                            <td className="border-r border-black px-1" colSpan={3}>{row.name}</td>
                            {invDays.map((_, i) => (
                                <td key={i} className="border-l border-black text-center">{invData[row.id]?.[i] || ''}</td>
                            ))}
                        </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
  );
}

                // --- CASE 34: DISCHARGE MEDICATIONS ---
                // --- CASE 34: FLUID MEDICATIONS TABLE ---
               // === CASE 34: PRECISION SCALING MEDICATIONS TABLE ===
if (item.fieldNumber === 34) {
  // 1. THE MATH: Count rows (Drugs + 1 for Header)
  const medRows = (formData.medicationsOnDischarge || []);
  const rowCount = medRows.length + 1.2; // 1.2 adds a tiny buffer for borders
  const availableHeightMm = item.height;

  // 2. THE PRECISION SCALER
  // We dropped the multiplier from 2.3 to 1.9 to account for row padding.
  let fluidMedFS = (availableHeightMm / rowCount) * 1.9; 

  // 3. CAP LIMITS
  if (fluidMedFS > 9.5) fluidMedFS = 9.5; 
  if (fluidMedFS < 4.5) fluidMedFS = 4.5; // Micro-font floor for emergency space

  return (
    <div key={item.id} className="absolute bg-white overflow-hidden border-black" 
         style={{ 
           left: `${item.x}mm`, 
           top: `${item.y}mm`, 
           width: `${item.width}mm`, 
           height: `${item.height}mm`, // Forcing the hard boundary
           zIndex: 50 
         }}>
        <table className="w-full border-collapse border-[1px] border-black font-bold"
               style={{ 
                 fontSize: `${fluidMedFS.toFixed(1)}pt`,
                 lineHeight: '1.1' // Tighten vertical space between letters
               }}>
            <thead className="bg-slate-100 border-b-[1px] border-black text-black">
                <tr>
                    <th className="border-r border-black p-[1px] text-left pl-1">Medication</th>
                    <th className="border-r border-black p-[1px] w-12 text-center">Dose</th>
                    <th className="border-r border-black p-[1px] w-12 text-center">Frequesncy</th>
                    <th className="border-r border-black p-[1px] w-12 text-center">Duration</th>
                    <th className="p-[1px] text-left pl-1">Instructions</th>
                </tr>
            </thead>
            <tbody className="text-black">
                {medRows.map((m, i) => (
                    <tr key={i} className="border-b border-black last:border-b-0">
                        <td className="border-r border-black p-[1px] pl-1">{m.name}</td>
                        <td className="border-r border-black p-[1px] text-center">{m.dose}</td>
                        <td className="border-r border-black p-[1px] text-center">{m.freq}</td>
                        <td className="border-r border-black p-[1px] text-center">{m.duration}</td>
                        <td className="p-[1px] pl-1">{m.instructions}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
  );
}
            }
           // === 1. CLEAN LUNG RENDERER (ONLY PRINTS ONCE) ===
            // === LANDMARK 2: CLEAN LUNG RENDERER (FIXES THE 3 LUNGS BUG) ===
            if (item.id === 'f_29_lung_img') {
                return (
                    <div key={item.id} className="absolute flex items-center justify-center" 
                         style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm` }}>
                        <img src={lungImg} style={{ width: '95%', height: '95%', objectFit: 'contain' }} />
                    </div>
                );
            }

            // === LANDMARK 3: PROFESSIONAL SVG OCTAGON (WITH CENTERED S/T) ===
            // === LANDMARK 3: UPDATED SVG OCTAGON WITH R/L LABELS ===
if (item.id === 'f_29_abd_img') {
    return (
        <div key={item.id} className="absolute overflow-visible" 
             style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm`, zIndex: 20 }}>
            <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* R and L SIDE LABELS (Added these 2 lines) */}
                <text x="5" y="5" fontSize="10" fontWeight="900" fill="black">R</text>
                <text x="85" y="5" fontSize="10" fontWeight="900" fill="black">L</text>

                <path d="M30,0 L70,0 L100,30 L100,70 L70,100 L30,100 L0,70 L0,30 Z" fill="white" stroke="black" strokeWidth="1.5" />
                <line x1="33.3" y1="0" x2="33.3" y2="100" stroke="black" strokeWidth="0.5" opacity="0.3" />
                <line x1="66.6" y1="0" x2="66.6" y2="100" stroke="black" strokeWidth="0.5" opacity="0.3" />
                <line x1="0" y1="33.3" x2="100" y2="33.3" stroke="black" strokeWidth="0.5" opacity="0.3" />
                <line x1="0" y1="66.6" x2="100" y2="66.6" stroke="black" strokeWidth="0.5" opacity="0.3" />
                
                {formData.abdomen.quadrants.map((v, i) => {
                    const row = Math.floor(i / 3);
                    const col = i % 3;
                    const cx = (col * 33.3) + 16.6;
                    const cy = (row * 33.3) + 16.6;
                    if (!v) return null;
                    return (
                        <text key={i} x={cx} y={cy} textAnchor="middle" dominantBaseline="central" 
                              style={{ fontSize: '14px', fontWeight: '900', fill: 'black', fontFamily: 'Arial' }}>
                            {v === 'Soft' ? 'S' : 'T'}
                        </text>
                    );
                })}
            </svg>
        </div>
    );
}

            // === CLEAN LUNG RENDERER ===
            if (item.id === 'f_29_lung_img') return (<div key={item.id} className="absolute flex items-center justify-center" style={{ left: `${item.x}mm`, top: `${item.y}mm`, width: `${item.width}mm`, height: `${item.height}mm` }}><img src={lungImg} style={{width:'95%', height:'95%', objectFit:'contain'}}/></div>);
            // === YOUR WORKING FLUID SCALING (FOR FIELD 1, 6, ETC) ===
           // --- THE LIQUID FONT ENGINE (UPGRADED) ---
// --- UPDATED VERTICAL-AWARE FONT ENGINE ---
const chars = textVal.length || 1;
const area = (item.width * item.height) || 1;

// 1. Calculate how many vertical lines the text is using
// We estimate 1 line per 18 chars for these narrow name boxes
const estimatedLines = Math.ceil(chars / 18); 
// 2. Add "Vertical Pressure" to the character count
const verticalPressure = chars + (estimatedLines * 25);

// 3. New Multiplier (3.3) with Vertical Pressure
let fluidFS = Math.sqrt(area / verticalPressure) * 3.3; 

// THE "SAFETY CAPS"
if (fluidFS > 11) fluidFS = 11; 
if (fluidFS < 4.5) fluidFS = 4.5; // Slightly higher floor to keep it readable

const finalFS = isTick ? '14pt' : `${fluidFS.toFixed(1)}pt`;
const finalLH = isTick ? '1' : '0.95'; // Tightened line height (1.05 to 0.95)
// === THE FINAL RENDERER (WORD-WRAP FIX) ===
return (
  <div
    key={item.id}
    className="absolute font-bold text-black overflow-hidden"
    style={{
      left: `${item.x}mm`,
      top: `${item.y}mm`,
      width: `${item.width}mm`,
      height: `${item.height}mm`,
      fontSize: finalFS,
      
      // THE FIXES FOR VERTICAL OVERLAP:
      lineHeight: finalLH,         // Uses the new 0.95 tight spacing
      display: 'flex',
      flexDirection: 'column',     // Ensures vertical stacking
      justifyContent: 'flex-start',
      
      whiteSpace: 'pre-wrap',
      wordBreak: 'normal',         
      overflowWrap: 'break-word',  
      textAlign: 'left'
    }}
  >
    {textVal}
  </div>
);
          })}
        </div>
      </div>
        </div>
      </div>
      {/* === NEW TEMPLATE CREATOR MODAL === */}
      <AnimatePresence>
        {showTemplateModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.9 }} 
                animate={{ opacity: 1, scale: 1 }} 
                className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col"
            >
               {/* Modal Header */}
               <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                  <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                      <FilePlus size={20} className="text-blue-600"/> Create New Template
                  </h3>
                  <button onClick={() => setShowTemplateModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400">
                      <X size={20}/>
                  </button>
               </div>

               {/* Modal Body */}
               {/* Modal Body (Upgraded with Calendar) */}
               <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                  
                  {/* Row 1: Name & Date */}
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Template Name</label>
                          <input autoFocus type="text" placeholder="e.g. Hernia Repair" value={newTemplateName} onChange={(e) => setNewTemplateName(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                      <div>
                          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Default Date</label>
                          <input type="date" value={newTemplateDate} onChange={(e) => setNewTemplateDate(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      </div>
                  </div>

                  {/* Row 2: Topic */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Topic / Surgery Name</label>
                      <input type="text" placeholder="e.g. Lichtenstein Repair" value={newTemplateTopic} onChange={(e) => setNewTemplateTopic(e.target.value)} className="w-full p-2.5 border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>

                  {/* Row 3: Content */}
                  <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Procedure Details</label>
                      <textarea value={newTemplateContent} onChange={(e) => setNewTemplateContent(e.target.value)} className="w-full p-3 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm h-32 resize-none bg-slate-50" />
                  </div>

                  {/* Row 4: Extra Details */}
                  
               </div>

               {/* Modal Footer */}
               <div className="p-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3">
                  <button onClick={() => setShowTemplateModal(false)} className="px-5 py-2.5 rounded-xl font-bold text-slate-500 hover:bg-slate-200">Cancel</button>
                  <button onClick={saveNewTemplate} className="px-6 py-2.5 rounded-xl font-bold bg-blue-600 text-white shadow-lg hover:bg-blue-700">Save Template</button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* === MANAGE TEMPLATES MODAL (THEMED) === */}
      <AnimatePresence>
        {showManageTemplates && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 backdrop-blur-[3px] p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 10 }} 
                animate={{ opacity: 1, scale: 1, y: 0 }} 
                className="bg-white/90 backdrop-blur-2xl border border-white/60 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[75vh]"
            >
               {/* Header - Glass Style */}
               <div className="px-8 py-6 border-b border-slate-100/80 bg-slate-50/50 flex justify-between items-center">
                  <div className="flex items-center gap-4">
                      <div className="p-3 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-600">
                          <Settings size={22} />
                      </div>
                      <div>
                          <h3 className="font-black text-xl text-slate-800 uppercase tracking-tight leading-none mb-1">Templates</h3>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Manage your library</p>
                      </div>
                  </div>
                  <button onClick={() => setShowManageTemplates(false)} className="p-3 hover:bg-slate-200/50 rounded-full text-slate-400 hover:text-red-500 transition-all active:scale-90">
                      <X size={24} />
                  </button>
               </div>

               {/* List Content */}
               <div className="p-6 overflow-y-auto custom-scrollbar flex-1 space-y-3 bg-slate-50/30">
                  {templates.length === 0 ? (
                      <div className="flex flex-col items-center justify-center h-40 text-slate-400 opacity-60">
                          <FileText size={40} className="mb-2" strokeWidth={1.5} />
                          <span className="text-xs font-bold italic">No saved templates yet.</span>
                      </div>
                  ) : (
                      templates.map((t) => (
                          <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            key={t.id} 
                            className="flex justify-between items-center p-5 bg-white border border-slate-100 rounded-[1.2rem] shadow-sm hover:shadow-md hover:border-blue-200 transition-all group"
                          >
                              <div className="flex items-center gap-4">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-black text-xs">
                                      T{t.id.toString().slice(-2)}
                                  </div>
                                  <div>
                                      <h4 className="font-bold text-slate-800 text-sm leading-tight">{t.name}</h4>
                                      {t.topic ? (
                                          <p className="text-[10px] text-blue-500 font-bold uppercase tracking-wider mt-0.5">{t.topic}</p>
                                      ) : (
                                          <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">No Topic</p>
                                      )}
                                  </div>
                              </div>
                              
                            {/* --- ACTION BUTTONS --- */}
<div className="flex gap-2">
    {/* 🔵 NEW EDIT BUTTON */}
    <button 
        onClick={() => handleEditTemplate(t)} 
        className="p-2.5 text-blue-500 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all shadow-inner"
        title="Edit Template"
    >
        <FilePlus size={18} /> {/* Using FilePlus as an Edit icon */}
    </button>

    <button 
        onClick={() => setTemplates(prev => prev.filter(item => item.id !== t.id))} 
        className="p-2.5 text-slate-300 bg-slate-50 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all shadow-inner"
    >
        <Trash2 size={18} />
    </button>
</div>
                          </motion.div>
                      ))
                  )}
               </div>
               
               {/* Footer */}
               <div className="p-4 bg-white border-t border-slate-100 text-center">
                   <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                       Total Saved: {templates.length}
                   </p>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* === INVESTIGATION LIBRARY MODAL === */}
      <AnimatePresence>
        {showLabModal && (
          <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
              <div className="p-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
                <h3 className="font-black text-slate-800 flex items-center gap-2"><ClipboardList size={20} className="text-blue-600"/> Lab Test Library</h3>
                <button onClick={() => setShowLabModal(false)} className="p-2 hover:bg-slate-200 rounded-full text-slate-400"><X size={20}/></button>
              </div>

              <div className="p-6 space-y-6">
                {/* PART 1: QUICK SELECTION */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Select Common Test</label>
                  <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                    {labLibrary.map((test, idx) => (
                      <div key={idx} className="relative group">
                        {/* THE ADD BUTTON (Main Area) */}
                        <button 
                          onClick={() => addTestToTable(test.name)} 
                          className="w-full text-left p-3 pr-8 bg-slate-50 hover:bg-blue-50 border border-slate-100 rounded-xl text-xs font-bold text-slate-700 transition-all truncate"
                        >
                          + {test.name}
                        </button>
                        
                        {/* THE DELETE BUTTON (Small X on the right) */}
                        {/* Only show the delete button IF the test is NOT locked */}
    {!test.isLocked && (
      <button 
        onClick={(e) => requestDeleteTest(e, idx)}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
      >
        <X size={14} strokeWidth={3} />
      </button>
    )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* PART 2: CREATE & SAVE NEW TEST */}
                <div className="pt-4 border-t border-slate-100">
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Save New Test to Library</label>
                  <div className="flex gap-2">
                    <input type="text" placeholder="e.g. LFT (Normal)" value={newLibraryTestName} onChange={(e) => setNewLibraryTestName(e.target.value)} className="flex-1 p-2.5 border border-slate-300 rounded-xl text-sm font-bold" />
                    <button onClick={saveTestToLibrary} className="px-4 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700"><Save size={18}/></button>
                  </div>
                </div>

                {/* PART 3: EMPTY ROW OPTION */}
                <button onClick={addBlankRow} className="w-full py-3 border-2 border-dashed border-slate-200 text-slate-400 rounded-xl font-bold text-sm hover:bg-slate-50 hover:border-slate-300 transition-all">
                  Add Empty Custom Row
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// --- COMPONENTS ---
function Checkbox({ label, checked, onChange }: any) { return (<label className="flex items-center gap-3 cursor-pointer hover:bg-slate-100 p-1 rounded"><input type="checkbox" className="hidden" checked={checked || false} onChange={onChange} /><div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>{checked && <Check size={14} className="text-white" strokeWidth={3} />}</div><span className="text-sm font-semibold text-slate-700">{label}</span></label>); }
function Input({ label, ...props }: any) { return (<div className="w-full">{label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}<input className="w-full p-2.5 bg-white/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700" {...props} /></div>); }
function TextArea({ label, ...props }: any) { return (<div className="w-full">{label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}<textarea className="w-full p-2.5 bg-white/60 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 resize-none" {...props} /></div>); }
function Select({ label, options, ...props }: any) { return (<div className="w-full">{label && <label className="block text-xs font-bold text-slate-500 uppercase mb-1">{label}</label>}<select className="w-full p-2.5 bg-white/50 backdrop-blur-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-slate-700 appearance-none shadow-sm hover:bg-white/70 transition-all cursor-pointer" {...props}><option value="">Select...</option>{options.map((o: string) => (<option key={o} value={o}>{o}</option>))}</select></div>); }
function BooleanRadio({ label, name, selected, onChange }: any) { return (<div><label className="block text-xs font-bold text-slate-500 uppercase mb-2">{label}</label><div className="flex flex-wrap gap-4">{["Yes", "No"].map((opt) => (<label key={opt} className="flex items-center gap-2 cursor-pointer"><input type="radio" name={name} value={opt} checked={selected === opt} onChange={onChange} className="w-4 h-4 text-blue-600" /><span className="text-sm font-medium text-slate-700">{opt}</span></label>))}</div></div>); }
function AllergyToggle({ type, label, status, onToggle }: any) { return (<div className="bg-white p-4 rounded-xl border border-red-100 shadow-sm"><span className="text-sm font-bold text-slate-700 block mb-3">{label}</span><div className="flex bg-slate-100 rounded-lg p-1"><button onClick={() => onToggle(type, 'Positive')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Positive' ? 'bg-red-500 text-white' : 'text-slate-500 hover:bg-white'}`}>+ Positive</button><button onClick={() => onToggle(type, 'Negative')} className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${status === 'Negative' ? 'bg-green-500 text-white' : 'text-slate-500 hover:bg-white'}`}>- Negative</button></div></div>); }
function SegmentedControl({ label, name, options, selected, onChange, isLocked }) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-[10px] font-black text-slate-500 uppercase mb-1.5 tracking-widest">
          {label}
        </label>
      )}
      <div className="relative flex bg-slate-200/50 p-1 rounded-xl border border-slate-300 shadow-inner overflow-hidden">
        {options.map((opt) => {
          const isActive = selected === opt;
          return (
            <button
              key={opt}
              type="button"
              // Change the button's onClick inside SegmentedControl to this:
// Inside SegmentedControl onClick:
onClick={() => {
    onChange({ target: { name, value: opt } });
    // If it's ward and NOT locked, update the last used value
    if (name === 'ward' && !isWardLocked) {
        handleSetDefaultWard(opt);
    }
}}
              className={`relative flex-1 py-2 text-[10px] font-black uppercase transition-colors duration-300 z-10 ${
                isActive ? 'text-white' : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="relative z-20">{opt}</span>
              
              {/* THE SLIDING SELECTOR BACKGROUND */}
              {isActive && (
                <motion.div
                  layoutId={`${name}-active-pill`} // Unique ID per group so they don't jump between fields
                  className="absolute inset-0 bg-blue-600 rounded-lg shadow-md"
                  transition={{ type: "spring", duration: 0.5, bounce: 0.2 }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
export default Admission;
