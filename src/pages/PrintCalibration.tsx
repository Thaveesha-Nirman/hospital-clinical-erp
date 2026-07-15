
// @ts-nocheck

import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Move, Layers, ArrowLeftRight, ArrowUpDown, RotateCcw } from 'lucide-react';


interface FieldData {
  id: number;
  label: string;
  page: number;
  x: number;
  y: number;
  width: number;
}

const initialFields: FieldData[] = [

  { id: 1, label: '1. Hospital Name', page: 1, x: 1220, y: 350, width: 200 },
  { id: 2, label: '2. PHN No', page: 1, x: 1800, y: 210, width: 150 },
  { id: 3, label: '3. Contact No', page: 1, x: 1800, y: 250, width: 150 },
  { id: 4, label: '4. NIC No', page: 1, x: 1800, y: 290, width: 150 },
  { id: 5, label: '5. Blood Group', page: 1, x: 1800, y: 330, width: 100 },
  { id: 6, label: '6. Allergy', page: 1, x: 1800, y: 370, width: 200 },
  { id: 7, label: '7. Patient Name', page: 1, x: 1220, y: 400, width: 300 },
  { id: 8, label: '8. BHT No', page: 1, x: 1280, y: 440, width: 100 },
  { id: 9, label: '9. Ward/Unit', page: 1, x: 1480, y: 440, width: 100 },
  { id: 10, label: '10. Age', page: 1, x: 1900, y: 440, width: 60 },
  { id: 11, label: '11. Sex', page: 1, x: 1700, y: 440, width: 80 },
  { id: 12, label: '12. Date Admission', page: 1, x: 1280, y: 485, width: 120 },
  { id: 13, label: '13. Date Discharge', page: 1, x: 1600, y: 485, width: 120 },
  { id: 14, label: '14. Principal Diagnosis', page: 1, x: 1350, y: 535, width: 600 },
  { id: 15, label: '15. Co-morbidities', page: 1, x: 1350, y: 600, width: 600 },
  { id: 16, label: '16. Mode of Admin', page: 1, x: 1300, y: 680, width: 150 },
  { id: 17, label: '17. Mode of Discharge', page: 1, x: 1300, y: 740, width: 150 },
  { id: 18, label: '18. Disease Notification', page: 1, x: 1350, y: 785, width: 100 },
  { id: 19, label: '19. Medical Certificate', page: 1, x: 1350, y: 820, width: 100 },
  { id: 20, label: '20. Insurance Form', page: 1, x: 1350, y: 855, width: 100 },
  { id: 21, label: '21. Consultant Stamp', page: 1, x: 1750, y: 780, width: 200 },
  { id: 22, label: '22. MO Signature', page: 1, x: 1750, y: 840, width: 200 },

  // PAGE 4 FIELDS (Left side of Outer)
  { id: 34, label: '34. Meds on Discharge', page: 4, x: 100, y: 250, width: 800 },
  { id: 35, label: '35. Discharge Plan', page: 4, x: 100, y: 420, width: 800 },
  { id: 36, label: '36. Instructions', page: 4, x: 100, y: 630, width: 800 },
  { id: 37, label: '37. Referral Note', page: 4, x: 100, y: 710, width: 800 },

  // PAGE 2 FIELDS (Left side of Inner)
  { id: 23, label: '23. Presenting Complaint', page: 2, x: 100, y: 230, width: 800 },
  { id: 24, label: '24. History L1', page: 2, x: 100, y: 270, width: 800 },
  { id: 25, label: '25. History L2', page: 2, x: 100, y: 310, width: 800 },
  { id: 26, label: '26. Exam Findings L1', page: 2, x: 100, y: 350, width: 800 },
  { id: 27, label: '27. Exam Findings L2', page: 2, x: 100, y: 390, width: 800 },
  { id: 28, label: '28. Treatment L1', page: 2, x: 100, y: 430, width: 800 },
  { id: 29, label: '29. Treatment L2', page: 2, x: 100, y: 470, width: 800 },
  { id: 30, label: '30. Surgical Procedures', page: 2, x: 100, y: 510, width: 800 },

  // PAGE 3 FIELDS (Right side of Inner)
  { id: 31, label: '31. Investigations', page: 3, x: 1100, y: 250, width: 800 },
  { id: 32, label: '32. Special Investigations', page: 3, x: 1100, y: 600, width: 800 },
  { id: 33, label: '33. Condition on Discharge', page: 3, x: 1100, y: 800, width: 800 },
];

const PrintCalibration = () => {
  const [fields, setFields] = useState<FieldData[]>(initialFields);
  const [activeTab, setActiveTab] = useState<'outer' | 'inner'>('outer');
  const canvasRef = useRef<HTMLDivElement>(null);

  const activePages = activeTab === 'outer' ? [1, 4] : [2, 3];
  const activeFields = fields.filter(f => activePages.includes(f.page));

  // HANDLERS
  const handleDragEnd = (id: number, newX: number, newY: number) => {
    setFields(prev => prev.map(f => f.id === id ? { ...f, x: newX, y: newY } : f));
  };

  const moveAllX = (amount: number) => {
    setFields(prev => prev.map(f => activePages.includes(f.page) ? { ...f, x: f.x + amount } : f));
  };

  const moveAllY = (amount: number) => {
    setFields(prev => prev.map(f => activePages.includes(f.page) ? { ...f, y: f.y + amount } : f));
  };
  
  const handleResetActiveSide = () => {
       setFields(prev => prev.map(field => {
             if(activePages.includes(field.page)) {
                 const initial = initialFields.find(init => init.id === field.id);
                 return initial || field;
             }
             return field;
         })
       );
  }

  const handleSaveConfig = () => {
      console.log("Saving Configuration:", fields);
      alert("Configuration Saved! (Check console for raw data)");
  };

  return (
    // Use flex-col to stack the top panel above the canvas area
    <div className="min-h-screen bg-slate-100 font-sans overflow-hidden flex flex-col">
      
      {/* ==========================================
          TOP PANEL: CALIBRATION CONTROLS 
      ========================================== */}
      <div className="w-full bg-white border-b border-slate-200 shadow-lg z-20 relative">
        <div className="p-4 md:p-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            
            {/* Left Section: Title and Tabs */}
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6 flex-1">
                <div className="flex items-center gap-3">
                    <div className="text-blue-800 bg-blue-50 p-2 rounded-lg">
                        <Settings size={24} className="animate-spin-slow" />
                    </div>
                    <div>
                        <h2 className="font-extrabold text-xl tracking-tight text-slate-800">Print Calibration</h2>
                        <p className="text-slate-500 text-sm font-medium leading-tight">Drag boxes to align with the form.</p>
                    </div>
                </div>

                {/* Tab Selection (Outer vs Inner) */}
                <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('outer')}
                        className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'outer' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layers size={16} /> Outer Side
                    </button>
                    <button 
                        onClick={() => setActiveTab('inner')}
                        className={`py-2 px-4 rounded-lg flex items-center justify-center gap-2 font-bold text-sm transition-all ${activeTab === 'inner' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        <Layers size={16} /> Inner Side
                    </button>
                </div>
            </div>

            {/* Right Section: Global Moves and Save */}
            <div className="flex flex-wrap items-center gap-3">
                
                {/* Global Horizontal Move */}
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                     <ArrowLeftRight size={16} className="text-blue-500 ml-1" />
                     <span className="font-bold text-slate-700 text-xs mr-1">X:</span>
                     <button onClick={() => moveAllX(-5)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">-5</button>
                     <button onClick={() => moveAllX(1)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">+1</button>
                     <button onClick={() => moveAllX(5)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">+5</button>
                </div>
                
                {/* Global Vertical Move */}
                <div className="flex items-center gap-1 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                     <ArrowUpDown size={16} className="text-blue-500 ml-1" />
                     <span className="font-bold text-slate-700 text-xs mr-1">Y:</span>
                     <button onClick={() => moveAllY(-5)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">-5</button>
                     <button onClick={() => moveAllY(1)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">+1</button>
                     <button onClick={() => moveAllY(5)} className="py-1 px-2 bg-white border border-blue-100 text-blue-600 rounded-md font-bold text-xs hover:bg-blue-50 active:scale-95 transition-all">+5</button>
                </div>
                
                <div className="h-8 w-px bg-slate-200 mx-1"></div>

                {/* Reset & Save */}
                <button 
                    onClick={handleResetActiveSide}
                    className="py-2 px-4 rounded-xl border-2 border-red-100 text-red-500 font-bold hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw size={18} /> Reset
                </button>
                <button 
                    onClick={handleSaveConfig}
                    className="py-2 px-6 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                    <Save size={20} /> Save
                </button>
            </div>
        </div>
      </div>

      {/* ==========================================
          MAIN CANVAS AREA (Occupies remaining space below top panel)
      ========================================== */}
      <div className="flex-1 bg-slate-200 overflow-auto p-4 md:p-8 relative flex justify-center z-10">
          <div 
            ref={canvasRef}
            className="relative bg-white shadow-2xl overflow-hidden border-4 border-white"
            style={{ 
                width: '2000px', 
                height: '1414px',
                
                backgroundImage: activeTab === 'outer' 
                  ? 'linear-gradient(to right, #e2e8f0 50%, #cbd5e1 50%)' // Grey Split (Outer)
                  : 'linear-gradient(to right, #bfdbfe 50%, #93c5fd 50%)', // Blue Split (Inner)
                // backgroundImage: activeTab === 'outer' ? `url(${imgOuter})` : `url(${imgInner})`,
                backgroundPosition: 'center',
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat'
            }}
          >
              <div className="absolute inset-0 pointer-events-none opacity-10" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-blue-400/30 border-dashed border-l border-blue-400"></div>

              {/* RENDER THE DRAGGABLE FIELDS */}
              {activeFields.map((field) => (
                  <motion.div
                    key={field.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0.1}
                    dragConstraints={canvasRef}
                    onDragEnd={(event, info) => {
                        const parentBounds = canvasRef.current?.getBoundingClientRect();
                        if(parentBounds) {
                            {/* NOTE: Calculate position relative to the local 2000px canvas bounds 
                                instead of the browser viewport coordinates. This keeps calibration 
                                measurements accurate even if the main container is scrolled. */}
                            const newX = info.point.x - parentBounds.left;
                            const newY = info.point.y - parentBounds.top;
                            handleDragEnd(field.id, newX, newY);
                        }
                    }}
              {activeFields.map((field) => (
                  <motion.div
                    key={field.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0.1}
                    dragConstraints={canvasRef}
                    onDragEnd={(event, info) => {
                        const parentBounds = canvasRef.current?.getBoundingClientRect();
                        if(parentBounds) {
                            {/* NOTE: Calculate position relative to the local 2000px canvas bounds 
                                instead of the browser viewport coordinates. This keeps calibration 
                                measurements accurate even if the main container is scrolled. */}
                            const newX = info.point.x - parentBounds.left;
                            const newY = info.point.y - parentBounds.top;
                            handleDragEnd(field.id, newX, newY);
                        }
                    }}
              {activeFields.map((field) => (
                  <motion.div
                    key={field.id}
                    drag
                    dragMomentum={false}
                    dragElastic={0.1}
                    dragConstraints={canvasRef}
                    onDragEnd={(event, info) => {
                        const parentBounds = canvasRef.current?.getBoundingClientRect();
                        if(parentBounds) {
                            // Calculate position relative to canvas (not screen)
                            const newX = info.point.x - parentBounds.left;
                            const newY = info.point.y - parentBounds.top;
                            handleDragEnd(field.id, newX, newY);
                        }
                    }}
                    style={{ x: field.x, y: field.y, width: field.width }}
                    className="absolute z-10 group"
                  >
                      <div className="
                        bg-blue-500/20 border-2 border-blue-500 text-blue-800 
                        px-3 py-2 rounded-md cursor-move 
                        shadow-sm backdrop-blur-sm
                        text-xs font-bold uppercase tracking-wider
                        flex items-center gap-2
                        transition-all duration-200
                        group-hover:bg-blue-500/40 group-hover:scale-105 group-hover:shadow-md group-hover:z-50
                        group-active:scale-95 group-active:cursor-grabbing
                      ">
                          <Move size={14} className="opacity-50 group-hover:opacity-100" />
                          {field.label}
                          <span className="ml-auto bg-blue-600 text-white text-[9px] w-5 h-5 flex items-center justify-center rounded-full">
                              {field.id}
                          </span>
                      </div>
                      <div className="absolute -top-8 left-0 bg-slate-800 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap font-mono">
                          X: {Math.round(field.x)} | Y: {Math.round(field.y)}
                      </div>
                  </motion.div>
              ))}
          </div>
      </div>
    </div>
  );
};

export default PrintCalibration;
