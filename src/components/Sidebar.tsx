
import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LayoutDashboard, UserPlus, Settings, LogOut, Printer, FileText } from 'lucide-react'; // Added FileText

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeIndex, setActiveIndex] = useState(0);

  // === UPDATED MENU ITEMS ===
  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { path: '/admission', label: 'New Admission', icon: <UserPlus size={20} /> },
    { path: '/layouts', label: 'Saved Layouts', icon: <FileText size={20} /> }, // <--- NEW BUTTON
    { path: '/settings', label: 'Settings', icon: <Settings size={20} /> },
  ];

  // Update the active slider position whenever the URL changes
  useEffect(() => {
    const index = menuItems.findIndex(item => item.path === location.pathname);
    if (index !== -1) {
      setActiveIndex(index);
    }
  }, [location.pathname]);

  const handleLogout = () => {
    navigate('/');
  };

  return (
    <div className="w-64 h-screen relative overflow-hidden flex flex-col font-sans border-r border-slate-200/20 shadow-2xl shrink-0">
      
      {/* BACKGROUND & SNOW EFFECT */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 z-0"></div>
      
      <style>
        {`
          @keyframes snowfall {
              0% { transform: translateY(-10%) translateX(0); opacity: 0; }
              10% { opacity: 0.5; }
              90% { opacity: 0.5; }
              100% { transform: translateY(100vh) translateX(10px); opacity: 0; }
          }
          .snowball-sidebar {
              position: absolute;
              background: white;
              border-radius: 50%;
              top: -10px;
              animation: snowfall linear infinite;
              pointer-events: none;
              opacity: 0.3;
          }
        `}
      </style>

      {/* SNOW PARTICLES */}
      <div className="snowball-sidebar w-1 h-1 left-[10%]" style={{ animationDuration: '8s', animationDelay: '0s' }}></div>
      <div className="snowball-sidebar w-2 h-2 left-[30%]" style={{ animationDuration: '12s', animationDelay: '2s' }}></div>
      <div className="snowball-sidebar w-1 h-1 left-[60%]" style={{ animationDuration: '7s', animationDelay: '1s' }}></div>
      <div className="snowball-sidebar w-1.5 h-1.5 left-[80%]" style={{ animationDuration: '10s', animationDelay: '4s' }}></div>
      <div className="snowball-sidebar w-1 h-1 left-[40%]" style={{ animationDuration: '9s', animationDelay: '3s' }}></div>
      <div className="snowball-sidebar w-2 h-2 left-[20%]" style={{ animationDuration: '11s', animationDelay: '5s' }}></div>
      <div className="snowball-sidebar w-1 h-1 left-[70%]" style={{ animationDuration: '13s', animationDelay: '1.5s' }}></div>

      {/* CONTENT */}
      <div className="relative z-10 flex-1 flex flex-col">
          
          {/* HEADER */}
          <div className="p-6 mb-4 border-b border-white/10 backdrop-blur-sm bg-white/5">
            <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-500/30">
                    <Printer size={20} />
                </div>
                <div>
                    <h2 className="text-white font-bold text-lg leading-tight tracking-tight">Diagnosis Card</h2>
                    <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">Printer System</p>
                </div>
            </div>
            <div className="bg-white/10 rounded-lg py-1 px-2 text-center border border-white/5">
                <p className="text-[9px] text-slate-300 font-medium">Galle National Hospital</p>
            </div>
          </div>

          {/* MENU ITEMS */}
          <nav className="flex-1 px-4 relative flex flex-col gap-2">
            
            {/* SLIDING PILL */}
            <div 
                className="absolute left-4 right-4 h-12 bg-blue-600 rounded-xl shadow-lg shadow-blue-900/50 transition-all duration-300 ease-[cubic-bezier(0.25,0.1,0.25,1.0)] z-0"
                style={{ 
                    top: `${activeIndex * 56}px` // 56px = 48px height + 8px gap
                }}
            />

            {menuItems.map((item, index) => {
              const isActive = index === activeIndex;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full h-12 flex items-center gap-3 px-4 rounded-xl transition-colors duration-300 font-medium relative z-10 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <span className={`transition-transform duration-300 ${isActive ? 'scale-110' : ''}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* FOOTER */}
          <div className="p-4 border-t border-white/10 bg-slate-950/30 backdrop-blur-sm">
            <button 
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-all duration-300 font-bold group border border-transparent hover:border-red-500/20"
            >
              <LogOut size={18} className="group-hover:-translate-x-1 transition-transform" />
              <span>Logout Securely</span>
            </button>
            <p className="text-center text-[10px] text-slate-600 mt-3 font-mono">v1.0.0 • Secure</p>
          </div>
      </div>
    </div>
  );
};

export default Sidebar;
