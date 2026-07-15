// @ts-nocheck
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Activity, FileText, Search, Plus, Calendar, 
  Clock, Stethoscope, Printer, Edit, Trash2, RefreshCw, 
  Settings, Database, Lock, AlertTriangle, X, CheckCircle, 
  DownloadCloud, UploadCloud, ShieldCheck, Save, FileJson, 
  ArrowRight, FolderOpen, HardDrive, KeyRound, Eye, Zap, Bomb, Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const navigate = useNavigate();

  // ==========================================
  // 1. STATE MANAGEMENT
  // ==========================================
  const [patients, setPatients] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastUpdatedText, setLastUpdatedText] = useState("Just now");
  
  // Backup indicator tracks if backup is needed (Simulated 24h check)
  const [lastBackupTime, setLastBackupTime] = useState<number>(Date.now()); 

  // UI Flow States (Modals)
  const [showManageMenu, setShowManageMenu] = useState(false); 
  const [showAuthModal, setShowAuthModal] = useState(false);   
  const [showBackupStep, setShowBackupStep] = useState(false);
  const [showRestoreInstructions, setShowRestoreInstructions] = useState(false); 
  const [showFinalRestoreConfirm, setShowFinalRestoreConfirm] = useState(false);
  
  // Wipe Protocol States
  const [showWipeWarning, setShowWipeWarning] = useState(false); 
  const [showFinalWipeConfirm, setShowFinalWipeConfirm] = useState(false);

  // Data Actions State
  const [selectedFile, setSelectedFile] = useState<{path: string, name: string} | null>(null);
  const [targetAction, setTargetAction] = useState<'BACKUP' | 'RESTORE' | 'WIPE' | null>(null);
  const [adminCreds, setAdminCreds] = useState({ id: '', pass: '' });
  const [finalPass, setFinalPass] = useState(""); 
  
  const [deleteConfirmation, setDeleteConfirmation] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ show: boolean, type: 'success' | 'error', title: string, msg: string } | null>(null);

  // ==========================================
  // 2. DATA FETCHING & LIVE LOGIC
  // ==========================================
// TODO: Show a user-friendly notification when patient records fail to load.
  const loadPatients = async () => {
    setIsLoading(true);
    if ((window as any).api) {
        try {
            const data = await (window as any).api.getPatients();
            // SAFE DATA SET: Handles both direct arrays and object responses
            const patientData = Array.isArray(data) ? data : (data?.data || []);
            setPatients(patientData);
            calculateTimeAgo(patientData);
        } catch (error) {
            console.error("Critical: Failed to fetch patient registry", error);
        } finally {
            setIsLoading(false);
        }
    }
  };

  useEffect(() => { 
      loadPatients();
      
      // Live Clock Logic (Updates every second)
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      
      // Live Update Logic (Recalculates "mins ago" every minute)
      const timeAgoTimer = setInterval(() => calculateTimeAgo(patients), 60000);
      
      return () => { 
          clearInterval(timer); 
          clearInterval(timeAgoTimer); 
      };
  }, [patients.length]);

  const calculateTimeAgo = (data: any[]) => {
      if (data.length === 0) return setLastUpdatedText("No records");
      const latest = data.reduce((max, p) => p.lastModified > max ? p.lastModified : max, 0);
      if (!latest) return setLastUpdatedText("Just now");

      const diff = Math.floor((Date.now() - latest) / 60000); // Diff in minutes
      if (diff < 1) setLastUpdatedText("Just now");
      else if (diff === 1) setLastUpdatedText("1 min ago");
      else if (diff < 60) setLastUpdatedText(`${diff} mins ago`);
      else setLastUpdatedText(`${Math.floor(diff/60)} hours ago`);
  };

  // ==========================================
  // 3. ACTION HANDLERS
  // ==========================================
  const handleView = (id: string) => navigate(`/admission?id=${id}&view=true`);
  const handleEdit = (id: string) => navigate(`/admission?id=${id}`);
  
  // Opens the Print UI in a popup to prevent dashboard refresh
  const handlePrint = (id: string) => {
    window.open(`/#/admission?id=${id}&autoprint=true`, '_blank', 'width=1150,height=900,menubar=no,toolbar=no');
  };

  // ==========================================
  // 4. DATABASE / MANAGEMENT LOGIC
  // ==========================================
  const openManageMenu = () => { 
      setShowManageMenu(true); 
      setShowAuthModal(false); 
      setShowWipeWarning(false);
  };

  const selectAction = (action: 'BACKUP' | 'RESTORE' | 'WIPE') => { 
      setTargetAction(action); 
      setShowManageMenu(false); 
      setAdminCreds({ id: '', pass: '' }); 
      setShowAuthModal(true); 
  };
  
  // Logic to jump from Warning screen to Backup screen
  const jumpToBackup = () => { 
      setShowRestoreInstructions(false); 
      setShowWipeWarning(false);
      setTimeout(() => selectAction('BACKUP'), 250); 
  };

  const verifyAdmin = () => {
      if (adminCreds.id === 'admin' && adminCreds.pass === 'admin123') {
          setShowAuthModal(false); 
          if (targetAction === 'BACKUP') setShowBackupStep(true);
          else if (targetAction === 'RESTORE') setShowRestoreInstructions(true);
          else if (targetAction === 'WIPE') setShowWipeWarning(true); 
      } else {
          showToast('error', 'Access Denied', 'Invalid credentials provided.');
      }
  };

  const handleSelectFile = async () => {
      if (!(window as any).api) return;
      const res = await (window as any).api.selectBackupFile();
      if (res.status === 'success') {
          setSelectedFile({ path: res.path, name: res.name });
          setShowRestoreInstructions(false); 
          setFinalPass(""); 
          setShowFinalRestoreConfirm(true);  
      }
  };

  const handleFinalRestore = async () => {
      if (finalPass !== 'admin123') return showToast('error', 'Error', 'Incorrect confirmation password.');
      if (selectedFile && (window as any).api) {
          const res = await (window as any).api.restoreDatabase(selectedFile.path);
          if (res.status === 'success') {
              setShowFinalRestoreConfirm(false);
              showToast('success', 'System Restored', 'Database has been successfully replaced.');
              loadPatients();
          }
      }
  };

const handleFinalWipe = async () => {
    if (finalPass !== 'admin123') return;
    if ((window as any).api) {
        // THIS LINE MUST SAY wipeAllPatients()
        const res = await (window as any).api.wipeAllPatients(); 
        if (res.status === 'success') {
            setShowFinalWipeConfirm(false);
            loadPatients();
            showToast('success', 'Wiped', 'All records destroyed.');
        }
    }
};

  const performBackup = async () => {
      if ((window as any).api) {
          const res = await (window as any).api.exportDatabase();
          if (res.status === 'success') { 
              setShowBackupStep(false); 
              setLastBackupTime(Date.now()); 
              showToast('success', 'Backup Complete', 'Database exported safely.'); 
          }
      }
  };

  const performDelete = async () => {
      if (deleteConfirmation && (window as any).api) {
          await (window as any).api.deletePatient(deleteConfirmation);
          setDeleteConfirmation(null); 
          loadPatients();
          showToast('success', 'Deleted', 'Patient removed from system.');
      }
  };

  const showToast = (type: 'success' | 'error', title: string, msg: string) => {
      setNotification({ show: true, type, title, msg });
      setTimeout(() => setNotification(null), 4000);
  };
// 🔤 Letter-based color mapping for avatar icons
const letterColors = {
  a: 'bg-red-100 text-red-600',
  b: 'bg-orange-100 text-orange-600',
  c: 'bg-amber-100 text-amber-600',
  d: 'bg-yellow-100 text-yellow-600',
  e: 'bg-lime-100 text-lime-600',
  f: 'bg-green-100 text-green-600',
  g: 'bg-emerald-100 text-emerald-600',
  h: 'bg-teal-100 text-teal-600',
  i: 'bg-cyan-100 text-cyan-600',
  j: 'bg-sky-100 text-sky-600',
  k: 'bg-blue-100 text-blue-600',
  l: 'bg-indigo-100 text-indigo-600',
  m: 'bg-violet-100 text-violet-600',
  n: 'bg-purple-100 text-purple-600',
  o: 'bg-fuchsia-100 text-fuchsia-600',
  p: 'bg-pink-100 text-pink-600',
  q: 'bg-rose-100 text-rose-600',
  r: 'bg-slate-100 text-slate-600',
  s: 'bg-gray-100 text-gray-600',
  t: 'bg-blue-100 text-blue-700', // 👈 T = blue
  u: 'bg-indigo-100 text-indigo-700',
  v: 'bg-violet-100 text-violet-700',
  w: 'bg-emerald-100 text-emerald-700',
  x: 'bg-cyan-100 text-cyan-700',
  y: 'bg-teal-100 text-teal-700',
  z: 'bg-lime-100 text-lime-700',
};


  const filteredPatients = patients.filter((p: any) => {
    // This looks for ANY possible name key so the name never disappears
    const name = (p.patient_name || p.patientName || p.name || "").toString().toLowerCase();
    const bht = (p.bht_no || p.bht || "").toString().toLowerCase();
    const nic = (p.nic_no || p.nic || "").toString().toLowerCase();
    const search = searchTerm.toLowerCase();

    return name.includes(search) || bht.includes(search) || nic.includes(search);
  });
  
  const totalPatients = patients.length;
  const todayStr = new Date().toISOString().split('T')[0];
  const todayAdmissions = patients.filter((p: any) => (p.admission_date || p.admissionDate) === todayStr).length;

  return (
    <div className="min-h-screen bg-slate-50 relative overflow-hidden font-sans text-slate-800">
      
      {/* --- LAYER 0: ANIMATIONS & BLOBS --- */}
      <style>{`
          @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          .animate-entry { animation: fadeInUp 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
          .delay-1 { animation-delay: 100ms; } .delay-2 { animation-delay: 200ms; }
          .animate-blob { animation: blob 7s infinite; }
          @keyframes blob { 0% { transform: translate(0px, 0px) scale(1); } 33% { transform: translate(30px, -50px) scale(1.1); } 66% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0px, 0px) scale(1); } }
      `}</style>
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-cyan-200/40 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>

      <div className="relative z-10 p-8 h-full flex flex-col gap-8">
        
        {/* --- LAYER 1: HEADER --- */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-entry">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">Dashboard Overview</h1>
                <div className="flex items-center gap-4 mt-2">
                    {/* SYSTEM STATUS / BACKUP INDICATOR */}
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest shadow-sm ${ (Date.now() - lastBackupTime) > 86400000 ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                        <ShieldCheck size={12} className={ (Date.now() - lastBackupTime) > 86400000 ? 'animate-bounce' : '' } />
                        { (Date.now() - lastBackupTime) > 86400000 ? 'Backup Required' : 'Backup: Secure' }
                    </div>
                    <p className="text-slate-400 font-bold text-sm flex items-center gap-2"><Clock size={14}/> {currentTime.toLocaleTimeString()}</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
               {/* BRANDING CARD */}
               <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md p-3 rounded-2xl border border-white/60 shadow-sm">
                    <div className="p-2 bg-blue-100 rounded-xl text-blue-600"><Stethoscope size={24} /></div>
                    <div className="flex flex-col items-end text-right">
                        <h2 className="text-[10px] font-bold text-slate-600 leading-tight">ජාතික රෝහල ගාල්ල</h2>
                        <h2 className="text-[10px] font-bold text-slate-600 leading-tight">தேசிய வைத்தியசாலை காலி</h2>
                        <h2 className="text-sm font-extrabold text-blue-900 leading-tight uppercase tracking-wide">National Hospital Galle</h2>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button onClick={openManageMenu} className="flex items-center gap-2 bg-slate-900 text-white border border-slate-700 rounded-xl px-4 py-3 hover:scale-105 font-bold text-xs transition-all shadow-lg hover:shadow-blue-200"><Database size={14} /> Manage Data</button>
                    <button onClick={() => navigate('/settings')} className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 text-slate-500 transition-all shadow-sm" title="Settings"><Settings size={20} /></button>
                </div>
            </div>
        </div>

        {/* --- LAYER 2: STATS CARDS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 animate-entry delay-1">
            <StatCard label="Total Patients" value={totalPatients} icon={Users} color="blue" subtitle={`Updated ${lastUpdatedText}`} />
            <StatCard label="Today's Admissions" value={todayAdmissions} icon={Activity} color="cyan" subtitle="Live tracking" />
            <StatCard label="Reports Stored" value={totalPatients} icon={FileText} color="purple" subtitle="Registry total" />
            
            <button onClick={() => navigate('/admission')} className="bg-gradient-to-br from-blue-600 to-blue-500 text-white p-6 rounded-[2.5rem] shadow-lg shadow-blue-200 hover:shadow-blue-300 hover:scale-[1.02] transition-all flex flex-col justify-center items-center gap-3 border border-white/20">
                <div className="p-3 bg-white/20 rounded-full shadow-inner"><Plus size={32} /></div>
                <span className="font-bold text-lg">New Admission</span>
            </button>
        </div>

        {/* --- LAYER 3: REGISTRY TABLE (FIXED COLUMN MAPPING) --- */}
        <div className="flex-1 min-h-[500px] bg-white/95 backdrop-blur-3xl rounded-[2.5rem] border-4 border-white shadow-2xl overflow-hidden flex flex-col animate-entry delay-2">
            
            {/* Header section with integrated search */}
            <div className="p-8 border-b border-slate-100 flex flex-col lg:flex-row justify-between items-center gap-6 bg-white/50">
                <div className="flex items-center gap-5">
                    <div className="p-4 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-100"><Users size={28}/></div>
                    <div>
                        <h3 className="text-2xl font-black text-slate-800">Patient Registry</h3>
                        <p className="text-sm font-bold text-slate-400">Database monitoring: {filteredPatients.length} active records</p>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full lg:w-auto">
                    <button onClick={loadPatients} className="p-4 bg-slate-50 border border-slate-200 text-slate-400 hover:text-blue-600 hover:bg-white rounded-2xl transition-all shadow-sm"><RefreshCw size={20}/></button>
                    <div className="relative group w-full lg:w-96">
                        <Search className="absolute left-4 top-4 text-slate-300 group-focus-within:text-blue-600 transition-colors" size={20} />
                        <input 
                            type="text" 
                            value={searchTerm} 
                            onChange={(e) => setSearchTerm(e.target.value)} 
                            placeholder="Find Patient (BHT or Name)..." 
                            className="pl-12 pr-4 py-4 w-full bg-slate-50 border-2 border-slate-100 rounded-2xl font-bold text-slate-700 outline-none focus:border-blue-400 focus:bg-white focus:ring-8 focus:ring-blue-500/5 transition-all" 
                        />
                    </div>
                </div>
            </div>

            {/* Registry Body */}
            <div className="overflow-auto flex-1 px-4 pb-4">
                {isLoading ? <div className="text-center p-20 font-bold text-slate-300 text-xl animate-pulse">Scanning Data...</div> : 
                 filteredPatients.length === 0 ? (
                    <div className="text-center p-20 flex flex-col items-center opacity-40">
                        <Users size={80} className="mb-4 text-slate-200"/>
                        <p className="font-black text-2xl text-slate-400">No Patient Records Found</p>
                    </div>
                 ) : (
                    <table className="w-full text-left border-separate border-spacing-y-3 px-4">
                        <thead>
                            <tr className="text-slate-400 text-xs uppercase tracking-widest font-black">
                                <th className="pb-4 pl-8">Identification (BHT)</th>
                                <th className="pb-4">Patient Name & NIC</th>
                                <th className="pb-4">Admitted On</th>
                               
                                <th className="pb-4 text-center">Action Center</th>
                            </tr>
                        </thead>
                        <tbody className="text-sm text-slate-700 font-bold">
                            {filteredPatients.map((patient: any, index: number) => (
                                <tr key={patient.id || index} className="bg-white hover:bg-blue-50/50 hover:scale-[1.01] transition-all shadow-sm rounded-2xl overflow-hidden group border border-slate-100">
                                    <td className="p-5 pl-8 rounded-l-2xl border-y border-l border-slate-100">
                                        {/* FIXED: Identification now shows BHT Number */}
                                        <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg w-fit font-black text-sm">
                                          #{patient.bht_no || patient.bht || '---'}
                                        </div>
                                    </td>
                                    <td className="p-5 border-y border-slate-100">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-xs font-black text-slate-400 border border-white uppercase shadow-sm">
                                                {(patient.patient_name || patient.patientName || patient.name || "?").charAt(0)}
                                            </div>
                                            <div className="flex flex-col">
                                              <span>{patient.patient_name || patient.patientName || patient.name || 'Unknown Patient'}</span>
                                              {/* FIXED: NIC Number display added under the name */}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5 border-y border-slate-100">
                                        <div className="flex items-center gap-2 text-slate-500 font-medium bg-slate-50 px-3 py-1 rounded-lg w-fit">
                                            <Calendar size={14} /> {patient.admission_date || patient.admissionDate || '---'}
                                        </div>
                                    </td>
                                  
                                    <td className="p-5 rounded-r-2xl border-y border-r border-slate-100 flex justify-center gap-2">
                                        <button onClick={() => handleView(patient.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-blue-600 hover:bg-white hover:shadow-md rounded-xl transition-all" title="View Details"><Eye size={18} /></button>
                                        <button onClick={() => handleEdit(patient.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-emerald-600 hover:bg-white hover:shadow-md rounded-xl transition-all" title="Edit Record"><Edit size={18} /></button>
                                        <button onClick={() => setDeleteConfirmation(patient.id)} className="p-3 bg-slate-50 text-slate-400 hover:text-red-600 hover:bg-white hover:shadow-md rounded-xl transition-all" title="Delete Record"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                 )}
            </div>
        </div>
      </div>

      {/* ===================================================================
          LAYER 4: MODALS (DATA CENTER, AUTH, BACKUP, RESTORE, WIPE, DELETE)
          =================================================================== */}

     
      <AnimatePresence>
        {showManageMenu && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }} 
                    animate={{ scale: 1, opacity: 1, y: 0 }} 
                    exit={{ scale: 0.95, opacity: 0 }} 
                    className="bg-white/80 backdrop-blur-2xl rounded-[3rem] shadow-2xl w-full max-w-2xl p-10 border border-white/60 relative overflow-hidden text-center"
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none transform translate-x-1/4 -translate-y-1/4">
                        <Database size={240} />
                    </div>
                    
                    <button 
                        onClick={() => setShowManageMenu(false)} 
                        className="absolute top-6 right-6 p-2 bg-white/50 rounded-full text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all z-10"
                    >
                        <X size={24}/>
                    </button>
                    
                    <div className="relative z-10">
                        <h3 className="text-4xl font-black text-slate-800 mb-2">Data Center</h3>
                        <p className="text-slate-500 font-bold text-sm mb-12 mx-auto max-w-md">
                            Securely manage your hospital database records. Please select an operation.
                        </p>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* BACKUP BUTTON */}
                            <button 
                                onClick={() => selectAction('BACKUP')} 
                                className="relative p-8 bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-emerald-300 transition-all group shadow-sm hover:shadow-lg"
                            >
                                <div className="bg-emerald-500 text-white p-5 rounded-3xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                    <DownloadCloud size={28}/>
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">Backup</h4>
                            </button>

                            {/* RESTORE BUTTON */}
                            <button 
                                onClick={() => selectAction('RESTORE')} 
                                className="relative p-8 bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-[2.5rem] flex flex-col items-center gap-4 hover:border-blue-300 transition-all group shadow-sm hover:shadow-lg"
                            >
                                <div className="bg-blue-600 text-white p-5 rounded-3xl shadow-lg group-hover:rotate-12 transition-transform duration-300">
                                    <UploadCloud size={28}/>
                                </div>
                                <h4 className="font-black text-sm uppercase tracking-widest text-slate-700">Restore</h4>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 2. AUTHENTICATION (Initial verification) */}
      <AnimatePresence>
        {showAuthModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 backdrop-blur-md p-4">
                <motion.div initial={{y:20, opacity:0}} animate={{y:0, opacity:1}} exit={{y:20, opacity:0}} className="bg-white/70 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden relative border border-white/50">
                    <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"></div>
                    <div className="p-8 text-center">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 shadow-inner"><Lock size={32} className="text-slate-700" /></div>
                        <h3 className="text-2xl font-black text-slate-800">Admin Login</h3>
                        <p className="text-slate-500 text-xs font-bold mt-1 uppercase tracking-wide">Security Verification Required</p>
                    </div>
                    <div className="px-8 pb-8 space-y-4 text-center">
                        <input type="text" className="w-full p-4 bg-white/50 border border-white rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 text-center" placeholder="Admin ID" value={adminCreds.id} onChange={e => setAdminCreds({...adminCreds, id: e.target.value})} />
                        <input type="password" className="w-full p-4 bg-white/50 border border-white rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-blue-500/10 text-center" placeholder="Password" value={adminCreds.pass} onChange={e => setAdminCreds({...adminCreds, pass: e.target.value})} />
                        <div className="flex gap-3 pt-4">
                            <button onClick={() => setShowAuthModal(false)} className="flex-1 py-4 bg-white/50 border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-white transition-colors">Cancel</button>
                            <button onClick={verifyAdmin} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl hover:bg-black shadow-lg transition-all">Unlock <ShieldCheck className="inline ml-1" size={16}/></button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 3. RESTORE / PROTOCOL ALERT (With hyperlinked list) */}
      <AnimatePresence>
        {showRestoreInstructions && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white/90 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50">
                    <div className="bg-red-500/10 p-8 border-b border-red-100/50 flex items-center justify-between">
                         <div>
                            <div className="flex items-center gap-2 mb-2"><span className="bg-red-500 text-white text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Protocol Alert</span></div>
                            <h3 className="text-3xl font-black text-red-900">Data Overwrite</h3>
                         </div>
                         <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center shadow-inner"><AlertTriangle size={32}/></div>
                    </div>
                    
                    <div className="p-8">
                        <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed">A full system restoration is pending. Please acknowledge the following protocols:</p>
                        
                        <div className="space-y-3 mb-10">
                            <div className="flex items-center gap-4 p-4 bg-red-50/50 border border-red-100/50 rounded-2xl shadow-sm">
                                <span className="font-black text-red-400 text-xl">01</span>
                                <p className="text-xs font-bold text-red-900 flex-1">Highly recommended to <button onClick={jumpToBackup} className="underline text-blue-600 hover:text-blue-800 font-black">make a backup now</button> if you haven't.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50/50 border border-red-100/50 rounded-2xl shadow-sm">
                                <span className="font-black text-red-400 text-xl">02</span>
                                <p className="text-xs font-bold text-red-900 flex-1">This process is **irreversible**. All current data will be erased.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50/50 border border-red-100/50 rounded-2xl shadow-sm">
                                <span className="font-black text-red-400 text-xl">03</span>
                                <p className="text-xs font-bold text-red-900 flex-1">A valid database file (.json) is required for execution.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowRestoreInstructions(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">Cancel Process</button>
                            <button onClick={handleSelectFile} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-2xl hover:bg-black shadow-xl transition-all flex items-center justify-center gap-2 group">
                                Select File <FolderOpen size={18} className="group-hover:translate-y-[-2px] transition-transform"/>
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 4. WIPE WARNING (Destruction Protocol) */}
      <AnimatePresence>
        {showWipeWarning && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white/90 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-lg overflow-hidden border border-white/50">
                    <div className="bg-red-600 p-8 flex items-center justify-between text-white">
                         <div>
                            <div className="flex items-center gap-2 mb-2"><span className="bg-white text-red-600 text-[10px] font-black px-2 py-1 rounded uppercase tracking-wider">Danger Zone</span></div>
                            <h3 className="text-3xl font-black">Destruction Protocol</h3>
                         </div>
                         <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md"><Bomb size={32}/></div>
                    </div>
                    
                    <div className="p-8">
                        <p className="text-sm font-bold text-slate-500 mb-6 leading-relaxed text-center">This operation will authorize the immediate destruction of all patient records.</p>
                        
                        <div className="space-y-3 mb-8">
                            <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                <span className="font-black text-red-600 text-xl">01</span>
                                <p className="text-xs font-bold text-red-900 flex-1">All database tables will be cleared. No recovery possible.</p>
                            </div>
                            <div className="flex items-center gap-4 p-4 bg-red-50 border border-red-100 rounded-2xl">
                                <span className="font-black text-red-600 text-xl">02</span>
                                <p className="text-xs font-bold text-red-900 flex-1">Ensure you have <button onClick={jumpToBackup} className="underline text-blue-600 font-bold">exported a backup</button> before clicking.</p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button onClick={() => setShowWipeWarning(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-2xl hover:bg-slate-50">Abort</button>
                            <button onClick={() => { setShowWipeWarning(false); setFinalPass(""); setShowFinalWipeConfirm(true); }} className="flex-1 py-4 bg-red-600 text-white font-bold rounded-2xl hover:bg-red-700 shadow-xl">Proceed to Verification</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 5. FINAL WIPE CONFIRMATION (Double Security) */}
      <AnimatePresence>
        {showFinalWipeConfirm && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border-4 border-red-500 relative">
                    <div className="bg-red-500 p-8 text-white text-center">
                        <KeyRound size={48} className="mx-auto mb-4 opacity-80"/>
                        <h3 className="text-2xl font-black uppercase tracking-widest">Final Authorization</h3>
                        <p className="text-red-100 text-[10px] font-black uppercase tracking-tighter mt-1 opacity-70">Execute Permanent Destruction</p>
                    </div>
                    <div className="p-8">
                        <div className="bg-red-50 p-4 rounded-2xl border border-red-100 mb-8 text-center shadow-inner">
                            <p className="text-xs font-black text-red-600 uppercase mb-1">Confirm Identity</p>
                            <p className="text-sm font-bold text-red-900 leading-tight italic">Please enter your password one final time.</p>
                        </div>
                        <div className="mb-6">
                            <input type="password" placeholder="••••••••" value={finalPass} onChange={(e) => setFinalPass(e.target.value)} className="w-full p-5 bg-white border-2 border-red-100 rounded-2xl font-bold text-red-700 text-center outline-none focus:ring-4 focus:ring-red-500/10 transition-all placeholder:text-red-200 shadow-sm" />
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleFinalWipe} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 shadow-xl shadow-red-200 transition-all uppercase tracking-widest">Destroy Registry</button>
                            <button onClick={() => setShowFinalWipeConfirm(false)} className="w-full py-3 text-slate-400 font-bold hover:text-slate-600 transition-colors">Abort Destruction</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 6. FINAL RESTORE CONFIRM (Double Security Logic) */}
      <AnimatePresence>
        {showFinalRestoreConfirm && selectedFile && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/60 backdrop-blur-md p-4">
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white/95 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50 relative">
                    <div className="bg-blue-600 p-8 text-white text-center">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-md"><KeyRound size={32}/></div>
                        <h3 className="text-2xl font-black uppercase tracking-widest">Final Authorization</h3>
                        <p className="text-blue-100 text-xs font-bold uppercase opacity-80">Confirm Database Override</p>
                    </div>
                    <div className="p-8">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 mb-8 text-center shadow-inner">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Target File</p>
                            <p className="text-sm font-mono font-bold text-blue-600 break-all">{selectedFile.name}</p>
                        </div>
                        <div className="mb-8">
                            <input type="password" placeholder="Confirm Admin Password" value={finalPass} onChange={(e) => setFinalPass(e.target.value)} className="w-full p-5 bg-white border-2 border-slate-100 rounded-2xl font-bold text-slate-800 text-center outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all placeholder:text-slate-300 shadow-sm" />
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => setShowFinalRestoreConfirm(false)} className="flex-1 py-4 bg-white border border-slate-200 text-slate-600 font-bold rounded-xl hover:bg-slate-50 transition-colors">Abort</button>
                            <button onClick={handleFinalRestore} className="flex-1 py-4 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-700 shadow-xl shadow-blue-200 flex items-center justify-center gap-2"><UploadCloud size={18}/> EXECUTE</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 7. BACKUP STEP (The secure vault view) */}
      <AnimatePresence>
        {showBackupStep && (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 backdrop-blur-md p-4">
                <motion.div initial={{scale:0.95, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white/80 backdrop-blur-3xl rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-white/50">
                    <div className="bg-emerald-500/10 p-10 border-b border-emerald-100/50">
                         <div className="w-20 h-20 bg-emerald-500 text-white rounded-3xl shadow-lg shadow-emerald-200 flex items-center justify-center mb-6 mx-auto"><HardDrive size={36}/></div>
                         <h3 className="text-3xl font-black text-emerald-900 text-center">Secure Backup</h3>
                         <p className="text-emerald-700 font-bold text-sm text-center">Your data is ready to be exported.</p>
                    </div>
                    <div className="p-8">
                        <div className="space-y-4 mb-10">
                             <div className="flex gap-4 items-center p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-full"><CheckCircle size={16}/></div><p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Full Patient Records Included</p></div>
                             <div className="flex gap-4 items-center p-4 bg-white/40 rounded-2xl border border-white/60 shadow-sm"><div className="bg-emerald-100 text-emerald-600 p-2 rounded-full"><FileJson size={16}/></div><p className="text-xs font-bold text-slate-600 uppercase tracking-tight">Secure JSON formatting</p></div>
                        </div>
                        <div className="flex gap-4">
                            <button onClick={() => setShowBackupStep(false)} className="flex-1 py-5 bg-white text-slate-600 font-bold rounded-2xl hover:bg-slate-50 transition-all">Cancel</button>
                            <button onClick={performBackup} className="flex-1 py-5 bg-emerald-500 text-white font-black rounded-2xl hover:bg-emerald-600 shadow-xl shadow-emerald-200/50 transition-all uppercase tracking-widest">Execute Save</button>
                        </div>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* 8. SINGLE DELETE CONFIRMATION */}
      <AnimatePresence>
        {deleteConfirmation && (
            <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                <motion.div initial={{scale:0.9, opacity:0}} animate={{scale:1, opacity:1}} className="bg-white/90 backdrop-blur-3xl rounded-[2.5rem] shadow-2xl w-full max-w-sm p-8 text-center border border-white/60">
                    <div className="w-16 h-16 bg-red-100/80 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner"><Trash2 size={32} /></div>
                    <h3 className="text-2xl font-black text-slate-800">Delete Record?</h3>
                    <p className="text-slate-500 text-sm mb-8 font-medium italic">This action is permanent and cannot be reversed.</p>
                    <div className="flex gap-3 justify-center">
                        <button onClick={() => setDeleteConfirmation(null)} className="px-8 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all">No, Keep It</button>
                        <button onClick={performDelete} className="px-8 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 shadow-lg shadow-red-200/50">Yes, Delete</button>
                    </div>
                </motion.div>
            </div>
        )}
      </AnimatePresence>

      {/* --- LAYER 5: GLOBAL TOAST NOTIFICATIONS --- */}
      <AnimatePresence>
        {notification && (
            <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className={`fixed top-8 right-8 z-[100] p-5 rounded-[1.5rem] shadow-2xl flex items-center gap-4 backdrop-blur-xl border ${notification.type === 'success' ? 'bg-white/80 border-emerald-200 text-emerald-800 shadow-emerald-100' : 'bg-white/80 border-red-200 text-red-800 shadow-red-100'}`}>
                <div className={`p-3 rounded-2xl ${notification.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>{notification.type === 'success' ? <CheckCircle size={24} /> : <AlertTriangle size={24} />}</div>
                <div><h4 className="font-black text-sm uppercase tracking-wider">{notification.title}</h4><p className="text-xs font-bold opacity-80 mt-0.5">{notification.msg}</p></div>
            </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

// ==========================================
// 6. HELPER COMPONENTS (Fully detailed)
// ==========================================
const StatCard = ({ label, value, icon: Icon, color, subtitle }: any) => {
    const colors: any = { 
        blue: 'text-blue-600 bg-blue-50 border-blue-100', 
        cyan: 'text-cyan-600 bg-cyan-50 border-cyan-100', 
        purple: 'text-purple-600 bg-purple-50 border-purple-100' 
    };
    
    return (
        <div className="bg-white/60 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/60 shadow-sm hover:shadow-xl transition-all group relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 transform translate-x-4 -translate-y-4"><Icon size={120} /></div>
            <div className="flex justify-between items-start relative z-10">
                <div>
                    <p className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em]">{label}</p>
                    <h3 className="text-5xl font-black text-slate-800 mt-2 tracking-tighter">{value}</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1.5"><Clock size={12} className="text-slate-300"/> {subtitle || 'Live Tracking'}</p>
                </div>
                <div className={`p-4 rounded-2xl shadow-sm border ${colors[color]}`}><Icon size={28} /></div>
            </div>
        </div>
    );
};

export default Dashboard;
