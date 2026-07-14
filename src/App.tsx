import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';

// --- YOUR ORIGINAL PAGES ---
import Login from './pages/Login';          // Your Blue/Snowfall Login
import Dashboard from './pages/Dashboard';  // Your ORIGINAL Dashboard
import Sidebar from './components/Sidebar'; // Your Sidebar
import Admission from './pages/Admission';
import Settings from './pages/Settings';    // Where Layout Setup is
import PrintPreview from './pages/PrintPreview';
import Layouts from './pages/Layouts';      // Where the Saved Layout Table is

const App = () => {
  return (
    <Router>
      <Routes>
        
        {/* 1. LOGIN PAGE */}
        <Route path="/" element={<Login />} />

        {/* 2. DASHBOARD */}
        <Route 
          path="/dashboard" 
          element={
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <div className="flex-1 overflow-auto p-4">
                <Dashboard />
              </div>
            </div>
          } 
        />

        {/* 3. ADMISSION */}
        <Route 
          path="/admission" 
          element={
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <div className="flex-1 overflow-auto p-4">
                <Admission />
              </div>
            </div>
          } 
        />
      

        {/* 4. LAYOUTS (The Saved Table) */}
        <Route 
          path="/layouts" 
          element={
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <div className="flex-1 overflow-auto p-4">
                <Layouts />
              </div>
            </div>
          } 
        />

        {/* 5. SETTINGS (The Setup) */}
        <Route 
          path="/settings" 
          element={
            <div className="flex h-screen bg-slate-50">
              <Sidebar />
              <div className="flex-1 overflow-auto p-4">
                <Settings />
              </div>
            </div>
          } 
        />

        {/* 6. PRINT PREVIEW */}
        <Route path="/print/:id" element={<PrintPreview />} />

      </Routes>
    </Router>
  );
};

export default App;