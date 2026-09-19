import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar.jsx';
import HeroProfile from './components/HeroProfile.jsx';
import PortfolioGrid from './components/PortfolioGrid.jsx';
import ProjectDetailModal from './components/ProjectDetailModal.jsx';
import ContactSection from './components/ContactSection.jsx';
import AdminPanel from './components/AdminPanel.jsx';
import LoginModal from './components/LoginModal.jsx';
import ForgotPasswordModal from './components/ForgotPasswordModal.jsx';
import { api, getToken, removeToken } from './utils/api.js';
import { Phone, MessageCircle, Mail, Heart, Sparkles } from 'lucide-react';

export default function App() {
  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('yutthakan_theme') === 'dark' || 
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const [currentUser, setCurrentUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [prefilledProjectForHire, setPrefilledProjectForHire] = useState('');

  // Modals state
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

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
      const [prof, projs] = await Promise.all([
        api.getProfile(),
        api.getProjects()
      ]);
      setProfile(prof);
      setProjects(projs);
    } catch (err) {
      console.error('Error loading data:', err);
    }
  };

  useEffect(() => {
    loadData();
    const token = getToken();
    if (token) {
      setCurrentUser({ name: 'ยุทธการ คำกลอน', role: 'admin' });
    }
  }, []);

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

  const handleHireForProject = (projectTitle) => {
    setPrefilledProjectForHire(projectTitle);
    handleScrollToContact();
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {/* Navigation Bar */}
      <Navbar
        darkMode={darkMode}
        setDarkMode={setDarkMode}
        currentUser={currentUser}
        onOpenLogin={() => setIsLoginOpen(true)}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Sections */}
      <main className="flex-1">
        {/* Profile & Cover Hero */}
        <HeroProfile
          profile={profile}
          onScrollToContact={handleScrollToContact}
          onScrollToPortfolio={handleScrollToPortfolio}
        />

        {/* Portfolio Showcase Grid */}
        <PortfolioGrid
          projects={projects}
          onSelectProject={(proj) => setSelectedProject(proj)}
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
            <span className="font-bold text-slate-800 dark:text-white">ยุทธการ คำกลอน</span>
            <span>• แฟ้มสะสมผลงานสถาปัตยกรรม & โมเดล 3D ออกแบบใช้งานระยะยาว 10–20 ปี</span>
          </div>
          <div className="flex items-center gap-4">
            <span>เบอร์ติดต่อ: 064-303-2859</span>
            <span>LINE: 0643032859</span>
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
        onClose={() => setIsAdminOpen(false)}
        onRefreshData={loadData}
      />

    </div>
  );
}
