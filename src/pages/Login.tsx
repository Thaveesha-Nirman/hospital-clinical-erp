
// @ts-nocheck
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, User, ArrowRight, ShieldCheck, Activity } from 'lucide-react';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'admin' && password === 'admin123') {
      navigate('/dashboard');
    } else {
      setError('Invalid Medical ID or Password');
    }
  };

  return (
    <div className="min-h-screen w-full flex font-sans bg-slate-50 overflow-hidden relative group">
      
      {/* CUSTOM ANIMATIONS */}
      <style>
        {`
          @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(20px); }
              to { opacity: 1; transform: translateY(0); }
          }
          @keyframes snowfall {
              0% { transform: translateY(-20%) translateX(0); opacity: 0; }
              10% { opacity: 1; }
              90% { opacity: 1; }
              100% { transform: translateY(120vh) translateX(20px); opacity: 0; }
          }
          .animate-entry { animation: fadeInUp 0.7s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
          
          .snowball {
              position: absolute;
              background: white;
              border-radius: 50%;
              top: -20px;
              animation: snowfall linear infinite;
              pointer-events: none;
              box-shadow: 0 0 10px rgba(255,255,255,0.6);
          }
          .delay-1 { animation-delay: 100ms; }
          .delay-2 { animation-delay: 200ms; }
          .delay-3 { animation-delay: 300ms; }
          .delay-4 { animation-delay: 400ms; }
          .delay-5 { animation-delay: 500ms; }
        `}
      </style>

      {/* =======================
          LEFT SIDE: FORM
      ======================== */}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-8 lg:p-16 relative z-10 backdrop-blur-xl bg-white/85 shadow-[20px_0_40px_rgba(0,0,0,0.05)] border-r border-white/40">
        <div className="w-full max-w-md">
          
          {/* Header Section */}
          {/* Changed mb-16 to mb-24 to add that big gap under the text */}
          <div className="text-center lg:text-left animate-entry mb-24">
            <div className="inline-flex items-center justify-center p-3 bg-gradient-to-tr from-blue-100 to-blue-50 rounded-2xl mb-8 text-blue-600 shadow-sm border border-blue-100">
                <Stethoscope size={32} />
            </div>

            {/* TRILINGUAL HOSPITAL NAME HEADER */}
            <div className="flex flex-col gap-1 mb-6 border-l-4 border-blue-600 pl-5 py-1">
                <h2 className="text-xl font-bold text-slate-800 leading-none tracking-tight">ජාතික රෝහල ගාල්ල</h2>
                <h2 className="text-lg font-bold text-slate-800 leading-snug tracking-tight">தேசிய வைத்தியசாலை காலி</h2>
                <h2 className="text-2xl font-extrabold text-blue-900 leading-tight uppercase tracking-wide mt-1">National Hospital Galle</h2>
            </div>

            {/* System Name */}
            <div className="flex items-center gap-2 justify-center lg:justify-start">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <p className="text-slate-500 text-sm font-bold uppercase tracking-widest">
                 Diagnosis Card Printer System
               </p>
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleLogin} className="space-y-10">
            
            {/* Medical ID Field */}
            <div className="animate-entry delay-1">
                <div className="relative group"> 
                    
                    {/* ICON */}
                    <User className="absolute left-4 top-5 text-slate-400 peer-focus:text-blue-500 peer-hover:text-blue-500 transition-colors duration-300 z-20 pointer-events-none" size={20} />
                    
                    {/* INPUT */}
                    <input
                        id="username"
                        type="text"
                        placeholder=" " 
                        value={username}
                        onChange={(e) => { setUsername(e.target.value); setError(''); }}
                        className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100/60 focus:border-blue-500 transition-all duration-300 font-bold text-slate-700 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/40"
                    />

                    {/* ANIMATED LABEL */}
                    <label 
                        htmlFor="username"
                        className="absolute left-1 
                                   -top-7 text-slate-500 font-bold text-sm uppercase tracking-wide
                                   transition-all duration-300 ease-out
                                   z-10 pointer-events-none
                                   
                                   /* HOVER STATE */
                                   peer-hover:top-2 peer-hover:left-12 peer-hover:text-[10px] peer-hover:text-blue-600
                                   
                                   /* FOCUS STATE */
                                   peer-focus:top-2 peer-focus:left-12 peer-focus:text-[10px] peer-focus:text-blue-600
                                   
                                   /* FILLED STATE */
                                   peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:left-12 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-600"
                    >
                        Medical ID
                    </label>
                </div>
            </div>

            {/* Password Field */}
            <div className="animate-entry delay-2">
                <div className="relative group">
                    <Lock className="absolute left-4 top-5 text-slate-400 peer-focus:text-blue-500 peer-hover:text-blue-500 transition-colors duration-300 z-20 pointer-events-none" size={20} />
                    
                    <input
                        id="password"
                        type="password"
                        placeholder=" "
                        value={password}
                        onChange={(e) => { setPassword(e.target.value); setError(''); }}
                        className="peer w-full pl-12 pr-4 pt-6 pb-2 bg-white/60 backdrop-blur-md border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100/60 focus:border-blue-500 transition-all duration-300 font-bold text-slate-700 shadow-sm hover:border-blue-400 hover:shadow-lg hover:shadow-blue-100/40"
                    />

                    <label 
                        htmlFor="password"
                        className="absolute left-1 
                                   -top-7 text-slate-500 font-bold text-sm uppercase tracking-wide
                                   transition-all duration-300 ease-out
                                   z-10 pointer-events-none
                                   
                                   /* HOVER STATE */
                                   peer-hover:top-2 peer-hover:left-12 peer-hover:text-[10px] peer-hover:text-blue-600
                                   
                                   /* FOCUS STATE */
                                   peer-focus:top-2 peer-focus:left-12 peer-focus:text-[10px] peer-focus:text-blue-600
                                   
                                   /* FILLED STATE */
                                   peer-[:not(:placeholder-shown)]:top-2 peer-[:not(:placeholder-shown)]:left-12 peer-[:not(:placeholder-shown)]:text-[10px] peer-[:not(:placeholder-shown)]:text-blue-600"
                    >
                        Secure Password
                    </label>
                </div>
            </div>

            {error && (
                <div className="animate-entry delay-3 flex items-center gap-2 text-red-600 bg-red-50/80 p-4 rounded-xl text-sm font-bold animate-pulse border border-red-100">
                    <ShieldCheck size={18} /> {error}
                </div>
            )}

            <div className="animate-entry delay-4 pt-4">
                <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-200/50 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 text-lg"
                >
                    Login Now <ArrowRight size={20} />
                </button>
            </div>
            
            <div className="text-center text-slate-400 text-sm mt-6 animate-entry delay-5">
                Forgot password? <span className="text-blue-600 font-bold cursor-pointer hover:underline hover:text-blue-700 transition-colors">Contact IT Dept.</span>
            </div>
          </form>
        </div>
      </div>

      {/* =======================
          RIGHT SIDE: BLUE + SLOW PARTICLES
      ======================== */}
      <div className="hidden lg:flex w-1/2 bg-blue-600 relative overflow-hidden items-center justify-center p-12 z-0">
        
        {/* SLOW PARTICLES */}
        <div className="snowball w-2 h-2 left-[5%]" style={{ animationDuration: '8s', animationDelay: '0s' }}></div>
        <div className="snowball w-1 h-1 left-[10%]" style={{ animationDuration: '12s', animationDelay: '1s' }}></div>
        <div className="snowball w-3 h-3 left-[15%]" style={{ animationDuration: '7s', animationDelay: '2s' }}></div>
        <div className="snowball w-2 h-2 left-[20%]" style={{ animationDuration: '10s', animationDelay: '0.5s' }}></div>
        <div className="snowball w-1 h-1 left-[25%]" style={{ animationDuration: '11s', animationDelay: '3s' }}></div>
        <div className="snowball w-4 h-4 left-[30%]" style={{ animationDuration: '9s', animationDelay: '1.5s' }}></div>
        <div className="snowball w-2 h-2 left-[35%]" style={{ animationDuration: '6s', animationDelay: '0s' }}></div>
        <div className="snowball w-1 h-1 left-[40%]" style={{ animationDuration: '9.5s', animationDelay: '2.2s' }}></div>
        <div className="snowball w-3 h-3 left-[45%]" style={{ animationDuration: '10.5s', animationDelay: '0.8s' }}></div>
        <div className="snowball w-2 h-2 left-[50%]" style={{ animationDuration: '8.5s', animationDelay: '3.5s' }}></div>
        <div className="snowball w-1 h-1 left-[55%]" style={{ animationDuration: '9.2s', animationDelay: '1.2s' }}></div>
        <div className="snowball w-4 h-4 left-[60%]" style={{ animationDuration: '11s', animationDelay: '0.3s' }}></div>
        <div className="snowball w-2 h-2 left-[65%]" style={{ animationDuration: '7.5s', animationDelay: '2.8s' }}></div>
        <div className="snowball w-1 h-1 left-[70%]" style={{ animationDuration: '8.8s', animationDelay: '1.8s' }}></div>
        <div className="snowball w-3 h-3 left-[75%]" style={{ animationDuration: '12.5s', animationDelay: '0.5s' }}></div>
        <div className="snowball w-2 h-2 left-[80%]" style={{ animationDuration: '6.8s', animationDelay: '3.2s' }}></div>
        <div className="snowball w-1 h-1 left-[85%]" style={{ animationDuration: '10.2s', animationDelay: '1s' }}></div>
        <div className="snowball w-4 h-4 left-[90%]" style={{ animationDuration: '9s', animationDelay: '2.5s' }}></div>
        <div className="snowball w-2 h-2 left-[95%]" style={{ animationDuration: '11.5s', animationDelay: '0.2s' }}></div>

        {/* Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-900/30 z-0"></div>

        {/* Card */}
        <div className="relative z-10 bg-white/10 backdrop-blur-xl border border-white/30 p-12 rounded-3xl max-w-lg text-white shadow-[0_20px_60px_rgba(0,0,0,0.4)] animate-entry delay-2">
            <div className="bg-gradient-to-tr from-white/30 to-white/10 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 shadow-inner border border-white/20">
                <Activity size={32} className="text-white drop-shadow-md" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4 drop-shadow-md">Galle National Hospital</h2>
            <p className="text-blue-50 text-lg leading-relaxed mb-8 drop-shadow-sm font-medium opacity-90">
                Official system for managing patient admissions and printing diagnosis cards.
            </p>

            <div className="space-y-4">
                <div className="flex items-center gap-3 bg-blue-800/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-blue-800/30 cursor-default">
                    <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_cyan]"></div>
                    <span className="font-medium">Instant Card Generation</span>
                </div>
                <div className="flex items-center gap-3 bg-blue-800/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-blue-800/30 cursor-default delay-1">
                    <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_cyan]"></div>
                    <span className="font-medium">Secure Patient Database</span>
                </div>
                 <div className="flex items-center gap-3 bg-blue-800/20 p-3 rounded-xl border border-white/10 backdrop-blur-sm transition-transform hover:scale-105 hover:bg-blue-800/30 cursor-default delay-2">
                    <div className="w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_10px_cyan]"></div>
                    <span className="font-medium">Custom Layout Configuration Module</span>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

