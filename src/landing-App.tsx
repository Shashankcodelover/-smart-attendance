import React, { useState, useEffect } from 'react';
import { firebaseAuth } from './services/firebaseService';

// Hardcoded University Students list to match the DB roster for initial landing validations
const DB_STUDENTS = [
  { usn: '4SJ21CS005', name: 'Ananya K.' },
  { usn: '4SJ21CS042', name: 'Rohan V.' },
  { usn: '4SJ21CS112', name: 'Sneha M.' },
  { usn: '4SJ21CS028', name: 'Deepak P.' },
  { usn: '4SJ21CS004', name: 'Aditi Sharma' },
  { usn: '4SJ21CS082', name: 'Rahul Sharma' },
  { usn: '4SJ21CS111', name: 'Ananya Iyer' },
  { usn: '4SJ21CS099', name: 'Kevin Peter' },
  { usn: '4SJ21CS102', name: 'Sanya Mirza' }
];

export default function LandingApp() {
  const [loadingSplash, setLoadingSplash] = useState(true);
  const [splashFade, setSplashFade] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'student' | 'lecturer' | 'admin'>('student');
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin');
  
  const [fullNameInput, setFullNameInput] = useState('');
  const [credentialInput, setCredentialInput] = useState('');
  const [passcode, setPasscode] = useState('');
  const [dbState, setDbState] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 2.5s Splash Screen timer
  useEffect(() => {
    const timer = setTimeout(() => {
      setSplashFade(true);
      const fadeTimer = setTimeout(() => {
        setLoadingSplash(false);
      }, 500);
      return () => clearTimeout(fadeTimer);
    }, 2200);
    return () => clearTimeout(timer);
  }, []);

  // Reset fields when tab or mode changes
  useEffect(() => {
    setErrorMsg(null);
    setFullNameInput('');
    setCredentialInput('');
    setPasscode('');
  }, [activeTab, authMode]);

  const handleRoleClick = (role: 'student' | 'lecturer' | 'admin') => {
    setActiveTab(role);
    setAuthMode('signin');
    setShowModal(true);
  };

  const handleGoBack = () => {
    setShowModal(false);
    setDbState('idle');
    setErrorMsg(null);
  };

  const handleManualLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credentialInput.trim()) {
      setErrorMsg('Credential input cannot be empty.');
      return;
    }
    if (authMode === 'signup' && activeTab !== 'admin' && !fullNameInput.trim()) {
      setErrorMsg('Please enter your full name.');
      return;
    }
    
    setDbState('connecting');
    setErrorMsg(null);

    try {
      if (authMode === 'signup') {
        if (activeTab === 'admin') {
          throw new Error('Administrators must use system presets.');
        }
        
        const user = await firebaseAuth.signUp(
          credentialInput.trim(), 
          passcode, 
          fullNameInput.trim(), 
          activeTab
        );
        
        setDbState('connected');
        
        // Save auth session locally
        const sessionData = { codeOrUsn: user.codeOrUsn, name: user.name, role: activeTab };
        localStorage.setItem(`sjce_auth_session_${activeTab}`, JSON.stringify(sessionData));
        
        // Reset tour completion so that the new user gets guided immediately
        localStorage.removeItem(`sjce_tour_completed_${activeTab}`);
        
        setTimeout(() => {
          window.location.href = `/${activeTab}`;
        }, 500);
      } else {
        // Sign In
        const user = await firebaseAuth.signIn(credentialInput.trim(), passcode, activeTab);
        setDbState('connected');
        
        const sessionData = { codeOrUsn: user.codeOrUsn, name: user.name, role: activeTab };
        localStorage.setItem(activeTab === 'admin' ? 'sjce_auth_session_admin' : `sjce_auth_session_${activeTab}`, JSON.stringify(sessionData));
        
        setTimeout(() => {
          window.location.href = activeTab === 'admin' ? '/lecturer?role=admin' : `/${activeTab}`;
        }, 500);
      }
    } catch (err: any) {
      setDbState('idle');
      setErrorMsg(err.message || 'Authentication error.');
    }
  };

  // Splash Screen Render
  if (loadingSplash) {
    return (
      <div className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-500 ease-out ${splashFade ? 'opacity-0' : 'opacity-100'}`}>
        <div className="absolute inset-0 bg-gradient-to-tr from-indigo-950 via-slate-900 to-teal-950 opacity-90 pointer-events-none" />
        
        <div className="relative text-center space-y-6 max-w-lg px-6 flex flex-col items-center select-none">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#6b38d4] to-[#8455ef] flex items-center justify-center shadow-[0_0_50px_rgba(107,56,212,0.35)] animate-pulse mb-2 border border-white/10">
            <span className="material-symbols-outlined text-white text-5xl">school</span>
          </div>
          
          <div className="space-y-2">
            <span className="text-[10px] tracking-[0.25em] font-black uppercase text-indigo-400 font-sans block">
              Sri Jayachamarajendra College of Engineering
            </span>
            <h1 className="text-3xl md:text-4xl font-display font-black text-white leading-none tracking-tight">
              SJCE ATTENDANCE CORE
            </h1>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              Configuring dynamic biometric locks and secure class networks...
            </p>
          </div>

          <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden relative mt-2">
            <div 
              className="absolute top-0 bottom-0 bg-gradient-to-r from-indigo-500 to-teal-400 rounded-full" 
              style={{ animation: 'loading-bar 2s ease-in-out infinite', width: '40%' }} 
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans relative overflow-hidden flex flex-col justify-between">
      {/* Background ambient mesh */}
      <div className="absolute top-0 left-0 right-0 h-[500px] bg-gradient-to-b from-indigo-100/40 via-purple-50/20 to-transparent pointer-events-none -z-10" />
      <div className="absolute top-1/4 -right-40 w-[450px] h-[450px] bg-purple-200/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-10 -left-40 w-[400px] h-[400px] bg-teal-200/5 rounded-full blur-2xl pointer-events-none" />

      {/* Connectivity Status Bar */}
      <div className="bg-white border-b border-indigo-100/80 px-4 py-3.5 shadow-sm">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <p className="text-xs font-mono font-medium text-slate-600">
              SJCE ATTENDANCE SYSTEM CORE &bull; <span className="text-emerald-700 font-bold">ACTIVE DEPLOYMENT</span>
            </p>
          </div>
          <div className="flex items-center gap-5 text-xs text-slate-500 font-medium">
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-indigo-500">database</span>SQLite Server Active
            </span>
            <span className="flex items-center gap-1.5">
              <span className="material-symbols-outlined text-[15px] text-indigo-500">wifi_password</span>Dynamic Handshake Verifiers
            </span>
          </div>
        </div>
      </div>

      {/* Main Connective Gateway Space (Pushed behind if modal is active) */}
      <main className={`flex-1 max-w-7xl w-full mx-auto px-4 py-12 flex flex-col justify-center space-y-12 transition-all duration-500 ease-out transform ${
        showModal 
          ? '-z-10 opacity-20 blur-sm scale-95 pointer-events-none' 
          : 'z-10 opacity-100 blur-0 scale-100'
      }`}>
        {/* Welcome Section */}
        <div className="text-center space-y-3.5 max-w-3xl mx-auto">
          <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight text-slate-900 leading-none animate-fade-in">
            SJCE Smart Attendance <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#6b38d4] to-[#8455ef]">Gateway Hub</span>
          </h1>
          <p className="text-sm md:text-base text-slate-600 max-w-xl mx-auto leading-relaxed">
            Welcome to the digital administrative nerve center for Sri Jayachamarajendra College of Engineering. 
            Select an authorized department terminal below to enter your dedicated view.
          </p>
        </div>

        {/* 3 Pages Grid: Student, Lecturer, Admin */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full">
          {/* 1. Lecturer Site Card */}
          <div className="bg-white border border-indigo-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden group flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-[#6b38d4] border border-indigo-100 shadow-inner">
                  <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">co_present</span>
                </div>
                <span className="px-3 py-1 bg-indigo-100/60 text-indigo-800 text-[10px] font-bold uppercase rounded-lg">
                  Dept: CSE Staff
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-extrabold text-[#191c1e]">Lecturer Staff Deck</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Open dynamic classroom check-in gates, monitor real-time attendance logs on the projector screen, and access the Smart Spark AI assistant.
                </p>
              </div>

              <div className="py-2.5">
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-indigo-500 font-bold">check_circle</span>
                    Rotation OTP key generator
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-indigo-500 font-bold">check_circle</span>
                    Automatic parent SMS notification
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-indigo-500 font-bold">check_circle</span>
                    Interactive AI dashboard assistant
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => handleRoleClick('lecturer')}
                className="w-full py-3 bg-gradient-to-r from-[#6b38d4] to-indigo-700 hover:from-indigo-700 hover:to-[#6b38d4] text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                Access Lecture Deck
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 2. Student Site Card */}
          <div className="bg-white border border-emerald-100 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden group flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-600 border border-emerald-100 shadow-inner">
                  <span className="material-symbols-outlined text-2xl group-hover:scale-110 transition-transform">school</span>
                </div>
                <span className="px-3 py-1 bg-emerald-100/60 text-emerald-800 text-[10px] font-bold uppercase rounded-lg">
                  Dept: Student Cohort
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-extrabold text-[#191c1e]">Student Portal Site</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Verify attendance using secure QR scans. The credential interface auto-locks until scanning matching projector signals to prevent proxies.
                </p>
              </div>

              <div className="py-2.5">
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-emerald-500 font-bold">check_circle</span>
                    Strict anti-proxy scanner lock
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-emerald-500 font-bold">check_circle</span>
                    30s Dynamic session timer tracker
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-emerald-500 font-bold">check_circle</span>
                    Offline queue buffer auto-sync
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => handleRoleClick('student')}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-teal-700 hover:to-emerald-600 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                Access Client Portal
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>

          {/* 3. Admin Registrar Office Site Card */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all relative overflow-hidden group flex flex-col justify-between min-h-[380px]">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-700 border border-slate-200 shadow-inner">
                  <span className="material-symbols-outlined text-2xl group-hover:rotate-12 transition-transform">admin_panel_settings</span>
                </div>
                <span className="px-3 py-1 bg-slate-100/80 text-slate-800 text-[10px] font-bold uppercase rounded-lg">
                  Dept: Secretariat
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-lg font-display font-extrabold text-[#191c1e]">Admin Command Center</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Access student master lists, enroll newly registered USN identifiers, audit attendance percentages, and manage campus roster database tables.
                </p>
              </div>

              <div className="py-2.5">
                <ul className="space-y-2 text-[11px] text-slate-600">
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-slate-500 font-bold">check_circle</span>
                    Enroll and remove student USN candidates
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-slate-500 font-bold">check_circle</span>
                    Review complete roster directories
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-xs text-slate-500 font-bold">check_circle</span>
                    Check general statistics & shortages
                  </li>
                </ul>
              </div>
            </div>

            <div className="pt-4 space-y-2">
              <button
                onClick={() => handleRoleClick('admin')}
                className="w-full py-3 bg-gradient-to-r from-slate-700 to-slate-800 hover:from-slate-800 hover:to-slate-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm active:scale-[0.98] cursor-pointer flex items-center justify-center gap-2"
              >
                Access Command Center
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* POPUP AUTHENTICATION MODAL (Brought in front with high z-index) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative border border-slate-200/50">
            
            {/* Modal Header */}
            <div className="text-center mb-5">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 border shadow-inner ${
                activeTab === 'student'
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                  : activeTab === 'lecturer'
                  ? 'bg-indigo-50 text-[#6b38d4] border-indigo-100'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}>
                <span className="material-symbols-outlined text-3xl">
                  {activeTab === 'student' ? 'school' : activeTab === 'lecturer' ? 'co_present' : 'admin_panel_settings'}
                </span>
              </div>
              <h3 className="text-xl font-display font-extrabold text-slate-900">
                {activeTab === 'student' ? 'Student Portal' : activeTab === 'lecturer' ? 'Lecturer Staff Portal' : 'Registrar Secretariat'}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                {authMode === 'signin' ? 'Sign in to access your dashboard terminal' : 'Create a fresh account profile'}
              </p>
            </div>

            {/* Sign In / Sign Up Tabs (Not shown for Admin) */}
            {activeTab !== 'admin' && (
              <div className="flex bg-[#eceef0] p-1 rounded-xl mb-4 text-xs font-bold text-center">
                <button
                  type="button"
                  onClick={() => setAuthMode('signin')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'signin' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMode('signup')}
                  className={`flex-1 py-2 rounded-lg transition-all cursor-pointer ${
                    authMode === 'signup' 
                      ? 'bg-white text-slate-900 shadow-sm' 
                      : 'text-slate-500 hover:text-slate-750'
                  }`}
                >
                  Sign Up (New User)
                </button>
              </div>
            )}

            {/* Main Form */}
            <form onSubmit={handleManualLogin} className="space-y-4">
              {authMode === 'signup' && activeTab !== 'admin' && (
                <div>
                  <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Full Display Name
                  </label>
                  <input
                    type="text"
                    value={fullNameInput}
                    onChange={(e) => setFullNameInput(e.target.value)}
                    className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-sans text-xs focus:ring-2 focus:ring-[#6b38d4]/10 focus:border-[#6b38d4] outline-none text-[#191c1e] transition-all"
                    placeholder="e.g. Dr. Suresh K."
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {activeTab === 'student' ? 'University Student USN' : 'Staff E-mail Identifier'}
                </label>
                <input
                  type="text"
                  value={credentialInput}
                  onChange={(e) => setCredentialInput(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#6b38d4]/10 focus:border-[#6b38d4] outline-none text-[#191c1e] transition-all"
                  placeholder={activeTab === 'student' ? 'e.g. 4SJ21CS005' : 'e.g. teacher@sjce.edu'}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-sans font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                  {authMode === 'signin' ? 'Access Passkey / PIN' : 'Choose Passcode / PIN'}
                </label>
                <input
                  type="password"
                  value={passcode}
                  onChange={(e) => setPasscode(e.target.value)}
                  className="w-full p-3.5 rounded-xl border border-slate-200 bg-white font-mono text-xs focus:ring-2 focus:ring-[#6b38d4]/10 focus:border-[#6b38d4] outline-none text-[#191c1e] transition-all"
                  placeholder="••••"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-[11px] leading-relaxed">
                  ⚠️ {errorMsg}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-2 pt-2">
                <button
                  type="button"
                  onClick={handleGoBack}
                  disabled={dbState === 'connecting'}
                  className="flex-1 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-center disabled:opacity-50"
                >
                  Go Back
                </button>
                <button
                  type="submit"
                  disabled={dbState === 'connecting'}
                  className={`flex-1 py-3 font-sans font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer text-white flex items-center justify-center gap-1.5 disabled:opacity-60 ${
                    activeTab === 'student'
                      ? 'bg-gradient-to-r from-emerald-600 to-teal-700'
                      : 'bg-gradient-to-r from-[#6b38d4] to-indigo-700'
                  }`}
                >
                  {dbState === 'connecting' ? (
                    <>
                      <span className="material-symbols-outlined animate-spin text-xs">sync</span>
                      Connecting...
                    </>
                  ) : (
                    <>
                      {authMode === 'signin' ? 'Sign In' : 'Sign Up'}
                      <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* Footer copyright */}
      <footer className="bg-white border-t border-slate-150 py-5 text-center mt-12">
        <p className="text-[11px] text-slate-400 font-medium px-4">
          Designed for Sri Jayachamarajendra College of Engineering (SJCE), Mysore. Protected by cryptographic secure tokens. Used in JSS Science and Technology University.
        </p>
      </footer>
    </div>
  );
}
