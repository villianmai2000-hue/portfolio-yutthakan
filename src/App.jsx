import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import HeroProfile from './components/HeroProfile.jsx';
import PortfolioGrid from './components/PortfolioGrid.jsx';
import SiteLogsSection from './components/SiteLogsSection.jsx';
import ProjectDetailModal from './components/ProjectDetailModal.jsx';
import ContactSection from './components/ContactSection.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import LoginModal from './components/LoginModal.jsx';
import ForgotPasswordModal from './components/ForgotPasswordModal.jsx';
import { api, getToken, removeToken } from './utils/api.js';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('yutthakan_theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteLogs, setSiteLogs] = useState([]);
  const [messages, setMessages] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [prefilledProjectForHire, setPrefilledProjectForHire] = useState('');

  // Modals state (รองรับการจำแท็บและการรีโหลดหน้าเว็บ - ข้อกำหนด 14, 15)
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.startsWith('#admin')) return true;
    return typeof localStorage !== 'undefined' && localStorage.getItem('yutthakan_admin_open') === 'true';
  });
  const [adminInitialTab, setAdminInitialTab] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.startsWith('#admin-')) {
      return hash.replace('#admin-', '');
    }
    return (typeof localStorage !== 'undefined' && localStorage.getItem('yutthakan_admin_tab')) || 'rebar';
  });
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Sync admin open state to localStorage and URL hash
  useEffect(() => {
    localStorage.setItem('yutthakan_admin_open', isAdminOpen ? 'true' : 'false');
    if (!isAdminOpen && window.location.hash.startsWith('#admin')) {
      history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [isAdminOpen]);

  // Sync Dark mode with html class
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('yutthakan_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('yutthakan_theme', 'light');
    }
  }, [darkMode]);

  // Initial Data Load
  const loadData = async () => {
    try {
      const [prof, projs, cats, logs, msgs] = await Promise.all([
        api.getProfile().catch(() => null),
        api.getProjects().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSiteLogs().catch(() => []),
        api.getMessages().catch(() => [])
      ]);
      if (prof) setProfile(prof);
      setProjects(projs);
      setCategories(cats.length ? cats : (prof?.categories || []));
      setSiteLogs(logs);
      setMessages(msgs || []);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const token = getToken();
    if (token) {
      setCurrentUser({ name: 'Admin', role: 'admin' });
    }
  }, []);

  // Poll messages if logged in
  useEffect(() => {
    if (!currentUser) return;
    const interval = setInterval(async () => {
      try {
        const msgs = await api.getMessages();
        setMessages(msgs || []);
      } catch (e) {
        // quiet ignore
      }
    }, 15000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const handleLogout = () => {
    removeToken();
    setCurrentUser(null);
    setIsAdminOpen(false);
  };

  const handleScrollToContact = () => {
    const el = document.getElementById('contact');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToPortfolio = () => {
    const el = document.getElementById('portfolio');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleScrollToSiteLogs = () => {
    const el = document.getElementById('sitelogs');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const handleHireForProject = (projectTitle) => {
    setPrefilledProjectForHire(projectTitle);
    handleScrollToContact();
  };

  const unreadHireCount = messages.filter(m => m.status === 'unread').length;
  const footerTitle = profile?.name || 'ยุทธการ คำกลอน';

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navigation Bar with Notification Bell */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        profile={profile}
        unreadHireCount={unreadHireCount}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenAdmin={(tab) => {
          setAdminInitialTab(tab || 'projects');
          setIsAdminOpen(true);
        }}
        onLogout={handleLogout}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Profile & Cover Hero with Owner Fast Edit */}
        <HeroProfile
          profile={profile}
          currentUser={currentUser}
          onProfileUpdated={(updated) => setProfile(updated)}
          onScrollToContact={handleScrollToContact}
          onScrollToPortfolio={handleScrollToPortfolio}
          onScrollToSiteLogs={handleScrollToSiteLogs}
        />

        {/* Portfolio Showcase Grid with Dynamic Categories */}
        <PortfolioGrid
          projects={projects}
          categories={categories}
          onSelectProject={(proj) => setSelectedProject(proj)}
        />

        {/* Construction Daily Log & Inspection Section (Public if toggled) */}
        <SiteLogsSection
          siteLogs={siteLogs}
          onRefreshLogs={loadData}
        />

        {/* Contact & Hire Me Section */}
        <ContactSection
          profile={profile}
          prefilledProject={prefilledProjectForHire}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 py-10 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-800 dark:text-white">{footerTitle}</span>
            <span>• แฟ้มสะสมผลงานสถาปัตยกรรม & โมเดล 3D ออกแบบใช้งานระยะยาว 10–20 ปี</span>
          </div>
          <div className="flex items-center gap-4">
            {profile?.phone && <span>เบอร์ติดต่อ: {profile.phone}</span>}
            {profile?.lineId && <span>LINE: {profile.lineId}</span>}
          </div>
        </div>
      </footer>

      {/* Modals */}
      {selectedProject && (
        <ProjectDetailModal
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          onHireForProject={handleHireForProject}
        />
      )}

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onLoginSuccess={(user) => {
          setCurrentUser(user);
          setIsAdminOpen(true);
        }}
        onOpenForgotPassword={() => setIsForgotPasswordOpen(true)}
      />

      <ForgotPasswordModal
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
        onBackToLogin={() => {
          setIsForgotPasswordOpen(false);
          setIsLoginOpen(true);
        }}
      />

      <AdminPanel
        isOpen={isAdminOpen}
        initialTab={adminInitialTab}
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={loadData}
      />

    </div>
  );
}
