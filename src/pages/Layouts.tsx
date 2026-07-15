/**
 * @module ApplicationLayoutShell
 * @description Main interface structural grid. Manages common viewport view constraints and responsive sidebar transitions.
 * @author Thaveesha Nirman / K.K.T.V.N. Kodithuwakku 
 * @institution NSBM Green University
 */



// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { 
  Layout, Calendar, FileText, Trash2, Edit, 
  Search, ArrowRight, HardDrive, CheckCircle, AlertTriangle 
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

// MUST MATCH SETTINGS.TSX
const STORAGE_KEY = 'hospital_layouts_master_db'; 

interface SavedSchema {
  id: string; name: string; fields: any[]; lastModified: number;
}

const Layouts = () => {
  const navigate = useNavigate();
  const [layouts, setLayouts] = useState<SavedSchema[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // LOAD DATA
// --- SURGICAL FIX: LOAD FROM DATABASE ---
  const loadData = async () => {
    if ((window as any).api) {
      try {
        const dbLayouts = await (window as any).api.getLayouts();
        
        // We map the database columns to your UI format
        const formatted = dbLayouts.map(l => ({
          id: l.id.toString(), // Convert to string to match your interface
          name: l.profile_name,
          fields: JSON.parse(l.coordinates || '[]'),
          lastModified: Date.now() // UI uses this for sorting
        }));

        setLayouts(formatted.sort((a, b) => b.id - a.id));
      } catch (e) {
        console.error("Database Load Error:", e);
      }
    }
  };

  useEffect(() => {
    loadData();
    // Refresh if window gains focus (e.g., coming back from Studio)
    window.addEventListener('focus', loadData);
    return () => window.removeEventListener('focus', loadData);
  }, []);

  // DELETE
// --- SURGICAL FIX: DELETE FROM DATABASE ---
  const handleDelete = async () => {
    if (!deleteId || !(window as any).api) return;

    const res = await (window as any).api.deleteLayout(deleteId);
    
    if (res.status === 'success') {
      // Re-fetch the list from the database to update the UI
      await loadData();
      setDeleteId(null);
    } else {
      alert("Failed to delete layout from database.");
    }
  };

  // --- THE FIX: SEND SIGNAL BEFORE NAVIGATING ---
  const handleEdit = (layout: SavedSchema) => {
      localStorage.setItem('active_edit_id', layout.id); // Set the signal
      navigate('/settings'); // Go to studio
  };

  const filtered = layouts.filter(l => l.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans p-8">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
        <div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight flex items-center gap-3">
                <div className="p-3 bg-blue-600 text-white rounded-2xl shadow-lg shadow-blue-200"><HardDrive size={28}/></div>
                Saved Layouts
            </h1>
            <p className="text-slate-400 font-bold text-sm mt-2 ml-1">Connected DB: <span className="font-mono text-blue-500 bg-blue-50 px-2 py-0.5 rounded">{STORAGE_KEY}</span></p>
        </div>
        <div className="relative group">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors"/>
            <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Search database..." className="pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl w-full md:w-80 shadow-sm focus:ring-4 ring-blue-100 outline-none font-bold text-slate-600 transition-all"/>
        </div>
      </header>

      {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <div className="p-6 bg-slate-200 rounded-full mb-4"><Layout size={48} className="text-slate-400"/></div>
              <h3 className="text-xl font-black text-slate-400">No Layouts Found</h3>
              <button onClick={() => navigate('/settings')} className="mt-6 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg">Go to Studio</button>
          </div>
      ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((layout) => (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} key={layout.id} className="bg-white rounded-[32px] p-6 border border-slate-100 shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:scale-[1.02] transition-all group relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                        <button onClick={() => setDeleteId(layout.id)} className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18}/></button>
                    </div>
                    <div className="mb-6">
                        <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-4 font-black text-lg">{layout.name.charAt(0).toUpperCase()}</div>
                        <h3 className="text-lg font-black text-slate-800 leading-tight mb-1 truncate pr-8">{layout.name}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Calendar size={12}/> {new Date(layout.lastModified).toLocaleDateString()}</p>
                    </div>
                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                        <div className="flex items-center gap-2 text-slate-500 text-xs font-bold bg-slate-50 px-3 py-1.5 rounded-lg"><FileText size={14}/> {layout.fields.length} Fields</div>
                        <button onClick={() => handleEdit(layout)} className="flex items-center gap-2 text-blue-600 font-black text-xs uppercase hover:underline">Open Studio <ArrowRight size={14}/></button>
                    </div>
                </motion.div>
            ))}
          </div>
      )}

      <AnimatePresence>
        {deleteId && (
            <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                <motion.div initial={{scale:0.9}} animate={{scale:1}} className="bg-white p-8 rounded-[32px] shadow-2xl max-w-sm w-full text-center">
                    <div className="mx-auto w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={32}/></div>
                    <h3 className="text-xl font-black text-slate-900 mb-2">Delete Layout?</h3>
                    <p className="text-slate-500 text-sm font-medium mb-8">This action cannot be undone.</p>
                    <div className="flex gap-3">
                        <button onClick={() => setDeleteId(null)} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">Cancel</button>
                        <button onClick={handleDelete} className="flex-1 py-3 bg-red-500 text-white rounded-xl font-bold text-sm hover:bg-red-600 transition-colors shadow-lg shadow-red-200">Yes, Delete</button>
                    </div>
                </motion.div>
            </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Layouts;
