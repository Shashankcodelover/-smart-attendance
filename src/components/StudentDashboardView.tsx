import React, { useState, useEffect } from 'react';
import { Student, Session } from '../types';

interface StudentDashboardViewProps {
  onCheckInClick: () => void;
  currentUser?: { codeOrUsn: string; name: string } | null;
  students?: Student[];
  sessions?: Session[];
}

export default function StudentDashboardView({ onCheckInClick, currentUser, students = [], sessions = [] }: StudentDashboardViewProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(timer);
  }, []);

  // Find this student's real attendance data from the roster
  const myRecord = students.find(s => s.usn?.toLowerCase() === currentUser?.codeOrUsn?.toLowerCase());
  const myAttendance = myRecord?.attendanceRate ?? null;
  const displayName = currentUser?.name?.split(' ')[0] || 'Student';
  const myUsn = currentUser?.codeOrUsn?.toUpperCase() || '';

  const attendanceStatus = myAttendance === null ? 'New' : myAttendance >= 85 ? 'Healthy' : myAttendance >= 75 ? 'Moderate' : 'Critical';
  const attendanceColor = myAttendance === null ? '#6b38d4' : myAttendance >= 85 ? '#6b38d4' : myAttendance >= 75 ? '#f59e0b' : '#ba1a1a';
  const statusTagColor = myAttendance === null
    ? 'text-[#6b38d4] bg-[#6b38d4]/5'
    : myAttendance >= 85 ? 'text-[#6b38d4] bg-[#6b38d4]/5'
    : myAttendance >= 75 ? 'text-amber-700 bg-amber-50'
    : 'text-[#ba1a1a] bg-red-50';

  const profileMessage = myAttendance === null
    ? 'You\'re all set! Your account is active. Use the Check-in button below when a session is live to start tracking your attendance.'
    : myAttendance >= 85
    ? 'Outstanding! Your attendance metrics are categorized as optimal. Keep it up!'
    : myAttendance >= 75
    ? 'Your attendance is satisfactory. Stay consistent to maintain your standing.'
    : '⚠️ Warning! Your attendance is below 75%. You risk being barred from exams. Check in to every session.';

  const circleCircumference = 408.4;
  const strokeDashoffset = myAttendance === null ? 408.4 : circleCircumference * (1 - myAttendance / 100);

  // Find active sessions the student can check into
  const activeSessions = sessions.filter(s => s.status === 'ACTIVE');
  const currentTime = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="space-y-6 animate-fade-in">

      {/* Welcome & Status Bento Row */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

        {/* Welcome card */}
        <div className="md:col-span-8 acrylic-card rounded-2xl p-6 flex flex-col justify-between overflow-hidden relative group border border-[#eceef0]">
          <div className="relative z-10 space-y-2">
            <span className={`text-[10px] uppercase tracking-widest font-extrabold px-2.5 py-1 rounded-full inline-block ${statusTagColor}`}>
              {attendanceStatus === 'New' ? 'NEW STUDENT ACCOUNT' : attendanceStatus === 'Healthy' ? 'OPTIMAL HEALTH PROFILE' : attendanceStatus === 'Moderate' ? 'MODERATE STANDING' : '⚠ ATTENDANCE ALERT'}
            </span>
            <h1 className="text-2xl sm:text-3xl font-display font-semibold text-[#191c1e] leading-snug">
              Welcome back, {displayName}.
            </h1>
            {myUsn && (
              <p className="text-[10px] font-mono text-[#7b7486]">USN: {myUsn}</p>
            )}
            <p className="text-sm text-[#494454] max-w-md leading-relaxed">
              {profileMessage}
            </p>
          </div>

          <div className="mt-6 flex flex-wrap gap-3 relative z-10">
            <button
              onClick={onCheckInClick}
              className="px-6 py-3 bg-gradient-to-r from-[#6b38d4] to-[#8455ef] hover:from-[#8455ef] hover:to-[#6b38d4] text-white font-display text-sm font-semibold rounded-xl shadow-md shadow-[#6b38d4]/10 hover:scale-[1.01] transition-transform flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">qr_code_scanner</span>
              Check-in Now
            </button>
          </div>

          <div className="absolute -right-16 -bottom-16 w-48 h-48 bg-[#6b38d4]/5 rounded-full blur-3xl pointer-events-none group-hover:bg-[#6b38d4]/10 transition-colors" />
        </div>

        {/* Live session alert or time card */}
        <div className="md:col-span-4 acrylic-card rounded-2xl p-6 flex flex-col items-center justify-center text-center">
          {activeSessions.length > 0 ? (
            <>
              <span className="flex h-3 w-3 relative mb-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-[9px] font-sans font-extrabold text-emerald-600 uppercase tracking-wider mb-1">
                Live Session Active!
              </span>
              <p className="font-display font-bold text-base text-[#191c1e]">
                {activeSessions[0].subjectCode}
              </p>
              <p className="text-xs text-[#7b7486] font-sans mt-0.5 font-semibold">
                {activeSessions[0].subjectName}
              </p>
              <p className="text-[10px] text-emerald-600 font-bold mt-2">
                Sec {activeSessions[0].section} • Year {activeSessions[0].year}
              </p>
              <button
                onClick={onCheckInClick}
                className="mt-3 px-4 py-2 bg-emerald-600 text-white text-[11px] font-bold rounded-xl hover:bg-emerald-700 transition-all cursor-pointer"
              >
                Mark Attendance →
              </button>
            </>
          ) : (
            <>
              <span className="material-symbols-outlined text-[36px] text-[#6b38d4]/30 mb-2">sensors_off</span>
              <p className="font-display font-bold text-sm text-[#191c1e]">No Active Session</p>
              <p className="text-xs text-[#7b7486] font-sans mt-1 leading-relaxed">
                Your lecturer hasn't opened a check-in gate yet. Check back when class starts.
              </p>
              <p className="text-[10px] font-mono text-[#7b7486] mt-3">{currentTime}</p>
            </>
          )}
        </div>
      </div>

      {/* Attendance Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Progress ring */}
        <div className="acrylic-card rounded-2xl p-6 flex flex-col items-center shadow-sm">
          <h3 className="font-display font-bold self-start text-[#191c1e] text-base mb-4">
            Attendance Health
          </h3>

          <div className="relative w-40 h-40 flex items-center justify-center">
            <svg className="w-full h-full">
              <circle className="text-[#eceef0] stroke-current" cx="80" cy="80" fill="transparent" r="65" strokeWidth="10" />
              <circle
                cx="80" cy="80" fill="transparent" r="65"
                strokeWidth="10"
                strokeDasharray={circleCircumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                stroke={attendanceColor}
                style={{ transform: 'rotate(-90deg)', transformOrigin: '50% 50%', transition: 'stroke-dashoffset 0.6s ease' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center select-none">
              <span className="text-3xl font-display font-bold text-[#191c1e]">
                {myAttendance === null ? '—' : `${myAttendance}%`}
              </span>
              <span className="text-[10px] font-sans font-bold tracking-widest uppercase mt-0.5" style={{ color: attendanceColor }}>
                {attendanceStatus}
              </span>
            </div>
          </div>

          {myAttendance !== null ? (
            <div className="mt-6 w-full flex justify-between px-2 font-sans text-xs">
              <div className="text-center">
                <p className="text-[9px] text-[#7b7486] uppercase font-bold tracking-wider mb-0.5">Attendance</p>
                <p className="font-bold text-[#6b38d4] text-base">{myAttendance}%</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-[#7b7486] uppercase font-bold tracking-wider mb-0.5">Status</p>
                <p className="font-bold text-base" style={{ color: attendanceColor }}>{attendanceStatus}</p>
              </div>
              <div className="text-center">
                <p className="text-[9px] text-[#7b7486] uppercase font-bold tracking-wider mb-0.5">Section</p>
                <p className="font-bold text-[#00687a] text-base">{myRecord?.section || '—'}</p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#7b7486] text-center mt-4 leading-relaxed">
              No attendance data yet. Your record will appear here once a lecturer marks you present.
            </p>
          )}
        </div>

        {/* Active sessions info */}
        <div className="md:col-span-2 acrylic-card rounded-2xl p-6 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-display font-bold text-base text-[#191c1e]">Live & Upcoming Sessions</h3>
            <span className="text-[10px] uppercase font-sans tracking-wide text-[#7b7486] font-bold">Real-time</span>
          </div>

          {sessions.length === 0 ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center py-8 space-y-3">
              <span className="material-symbols-outlined text-4xl text-[#6b38d4]/20">calendar_month</span>
              <div>
                <p className="font-display font-semibold text-[#191c1e] text-sm">No sessions scheduled yet</p>
                <p className="text-xs text-[#7b7486] mt-1 leading-relaxed max-w-xs mx-auto">
                  Your lecturer hasn't created any class sessions yet. Sessions will appear here once your class schedule is set up.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3 flex-1">
              {sessions.slice(0, 4).map((s) => (
                <div
                  key={s.id}
                  className={`flex items-center justify-between p-3 rounded-xl transition-colors group ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-50 border border-emerald-100'
                      : 'bg-[#f2f4f6]/40 hover:bg-[#f2f4f6]/70'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${
                      s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-700' : 'bg-[#e9ddff]/50 text-[#6b38d4]'
                    }`}>
                      <span className="material-symbols-outlined text-sm">
                        {s.status === 'ACTIVE' ? 'radio_button_checked' : 'schedule'}
                      </span>
                    </div>
                    <div>
                      <p className="font-display font-semibold text-[#191c1e] text-sm">{s.subjectCode} — {s.subjectName}</p>
                      <p className="text-[10px] text-[#7b7486]">Year {s.year} • Sec {s.section} • {s.timeline}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${
                    s.status === 'ACTIVE'
                      ? 'bg-emerald-100 text-emerald-700'
                      : s.status === 'DRAFT'
                      ? 'bg-slate-100 text-slate-600'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {s.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick info cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="acrylic-card rounded-2xl p-4 text-center border border-[#eceef0]">
          <span className="material-symbols-outlined text-[28px] text-[#6b38d4] mb-1 block">qr_code_scanner</span>
          <p className="font-display font-bold text-xs text-[#191c1e]">Check-in via QR</p>
          <p className="text-[10px] text-[#7b7486] mt-0.5">Scan when live</p>
        </div>
        <div className="acrylic-card rounded-2xl p-4 text-center border border-[#eceef0]">
          <span className="material-symbols-outlined text-[28px] text-[#00687a] mb-1 block">cloud_sync</span>
          <p className="font-display font-bold text-xs text-[#191c1e]">Auto Sync</p>
          <p className="text-[10px] text-[#7b7486] mt-0.5">Offline buffer</p>
        </div>
        <div className="acrylic-card rounded-2xl p-4 text-center border border-[#eceef0]">
          <span className="material-symbols-outlined text-[28px] text-indigo-400 mb-1 block">lock</span>
          <p className="font-display font-bold text-xs text-[#191c1e]">Anti-Proxy</p>
          <p className="text-[10px] text-[#7b7486] mt-0.5">Secure gate lock</p>
        </div>
        <div className="acrylic-card rounded-2xl p-4 text-center border border-[#eceef0]">
          <span className="material-symbols-outlined text-[28px] text-amber-400 mb-1 block">notifications</span>
          <p className="font-display font-bold text-xs text-[#191c1e]">Alert System</p>
          <p className="text-[10px] text-[#7b7486] mt-0.5">Below 75% warn</p>
        </div>
      </div>

    </div>
  );
}
