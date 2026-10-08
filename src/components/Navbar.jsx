import React from 'react';
import { Shield, Sun, Moon, LogIn, LogOut, Layers, MessageSquare, Briefcase, User, ClipboardList } from 'lucide-react';

export default function Navbar({ 
  darkMode, 
  setDarkMode, 
  currentUser, 
  profile,
  onOpenLogin, 
  onOpenAdmin, 
  onLogout 
}) {
  const isNameHidden = profile?.hidePublicName;
  const displayName = isNameHidden ? 'แฟ้มสะสมผลงาน สถาปัตยกรรม & 3D' : (profile?.name || 'ยุทธการ คำกลอน');
  const logoChar = isNameHidden ? 'A' : (displayName ? displayName.charAt(0) : 'ย');

  return (
    <header className="sticky top-0 z-40 w-full glass-nav bg-white/85 dark:bg-slate-900/85 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 transition-colors duration-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* Logo & Identity */}
        <a href="#home" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white font-bold text-lg shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
            {logoChar}
          </div>
          <div>
            <div className="font-bold text-base sm:text-lg tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              <span>{displayName}</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-normal border border-emerald-300/40">
                Portfolio
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">
              {profile?.title || 'Architectural Design • 3D SketchUp • AutoCAD'}
            </p>
          </div>
        </a>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600 dark:text-slate-300">
          <a href="#home" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
            หน้าแรก
          </a>
          <a href="#portfolio" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5">
            <Layers className="w-4 h-4" /> ผลงานทั้งหมด
          </a>
          <a href="#sitelogs" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-medium">
            <ClipboardList className="w-4 h-4" /> ตรวจงานก่อสร้าง & บันทึก
          </a>
          <a href="#contact" className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
            <Briefcase className="w-4 h-4" /> {profile?.contactBadgeText || 'ติดต่อจ้างงาน'}
          </a>
        </nav>

        {/* Action Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Work status pill (Navbar compact) */}
          {profile?.workStatus?.showPublic !== false && (
            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span className={`w-2 h-2 rounded-full ${
                profile?.workStatus?.status === 'busy' ? 'bg-amber-500' :
                profile?.workStatus?.status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500 animate-pulse'
              }`} />
              <span>{profile?.workStatus?.text || 'พร้อมรับงานทันที'}</span>
            </div>
          )}

          {/* Dark / Light Toggle */}
          <button
            onClick={() => setDarkMode(!darkMode)}
            className="p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            title={darkMode ? 'เปลี่ยนเป็นธีมสว่าง' : 'เปลี่ยนเป็นธีมมืด'}
            aria-label="Toggle Theme"
          >
            {darkMode ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-slate-600" />}
          </button>

          {/* Admin Button */}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAdmin}
                className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-medium shadow-sm transition-all"
              >
                <Shield className="w-4 h-4" />
                <span>จัดการหลังบ้าน</span>
              </button>
              <button
                onClick={onLogout}
                className="p-2 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
                title="ออกจากระบบ"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium transition-all"
            >
              <LogIn className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span className="hidden sm:inline">เข้าสู่ระบบ</span>เจ้าของ
            </button>
          )}
        </div>

      </div>
    </header>
  );
}
