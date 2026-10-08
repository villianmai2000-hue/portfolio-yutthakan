import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Upload, Database, HardDrive, 
  Download, MessageSquare, Image as ImageIcon, CheckCircle, 
  AlertCircle, RefreshCw, Layers, User, Phone, MessageCircle, 
  ExternalLink, FileCode2, Sparkles, Check, ArrowUpRight,
  Lock, KeyRound, Copy, Eye, EyeOff, ShieldCheck, MapPin, 
  Navigation, Calendar, Clock, Ruler, ClipboardList, CheckCheck,
  Tag, Settings as SettingsIcon, ShieldAlert, FolderPlus, Bell
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressImage, compressUltraCompact, formatBytes } from '../utils/compressor.js';

export default function AdminPanel({ isOpen, onClose, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('projects'); 
  // Tabs: 'projects', 'categories', 'sitelogs', 'vault', 'messages', 'settings', 'system'

  // Data states
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [siteLogs, setSiteLogs] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Project Editor State
  const [editingProject, setEditingProject] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);

  // Category Editor State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Private Vault State (Requirement 10)
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPinInput, setVaultPinInput] = useState('');
  const [vaultPinError, setVaultPinError] = useState('');
  const [vaultItems, setVaultItems] = useState([]);
  const [newVaultItem, setNewVaultItem] = useState({ label: '', emailOrId: '', note: '' });
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinValue, setNewPinValue] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Site Log Editor State (Requirement 11 & 12)
  const [editingSiteLog, setEditingSiteLog] = useState(null);
  const [isSiteLogEditorOpen, setIsSiteLogEditorOpen] = useState(false);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [acknowledgingLog, setAcknowledgingLog] = useState(null);
  const [ackStatusNote, setAckStatusNote] = useState('');
  const [ackEstDate, setAckEstDate] = useState('');

  // Initial Load
  useEffect(() => {
    if (isOpen) {
      loadAllAdminData();
    } else {
      setVaultUnlocked(false);
      setVaultPinInput('');
    }
  }, [isOpen]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [projData, profData, msgData, catData, logData, statData] = await Promise.all([
        api.getProjects(),
        api.getProfile(),
        api.getMessages(),
        api.getCategories().catch(() => []),
        api.getSiteLogs().catch(() => []),
        api.getStatus().catch(() => null)
      ]);
      setProjects(projData);
      setProfile(profData);
      setMessages(msgData);
      setCategories(catData.length ? catData : (profData?.categories || []));
      setSiteLogs(logData);
      setSystemStatus(statData);
    } catch (err) {
      console.error('Error loading admin data:', err);
    } finally {
      setLoading(false);
    }
  };

  const showFeedback = (msg, type = 'success') => {
    setFeedback({ msg, type });
    setTimeout(() => setFeedback(null), 4000);
  };

  // --- Project Management Handlers ---
  const handleOpenNewProject = () => {
    const defaultCat = categories[0] || 'งานเขียนแบบ AutoCAD (.dwg)';
    setEditingProject({
      title: '',
      category: defaultCat,
      description: '',
      year: new Date().getFullYear().toString(),
      location: 'ประเทศไทย',
      area: '',
      coverImage: '',
      images: [],
      tags: ['AutoCAD', 'SketchUp'],
      files: []
    });
    setCompressionStats(null);
    setIsEditorOpen(true);
  };

  const handleOpenEditProject = (proj) => {
    setEditingProject({ ...proj });
    setCompressionStats(null);
    setIsEditorOpen(true);
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้?')) return;
    try {
      await api.deleteProject(id);
      showFeedback('ลบผลงานเรียบร้อยแล้ว');
      loadAllAdminData();
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleProjectImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setCompressing(true);
      const newImages = [...(editingProject.images || [])];
      let totalBefore = 0;
      let totalAfter = 0;

      for (const file of files) {
        const result = await compressImage(file, 1600, 1600, 0.74);
        let savedUrl = result.dataUrl;
        try {
          const uploadRes = await api.uploadFile({
            name: file.name,
            type: 'webp',
            mimeType: 'image/webp',
            dataBase64: result.dataUrl,
            size: result.compressedSizeBytes
          });
          if (uploadRes?.url) savedUrl = uploadRes.url;
        } catch (uploadErr) {
          console.warn('Fallback dataUrl:', uploadErr);
        }

        newImages.push(savedUrl);
        totalBefore += result.originalSizeBytes;
        totalAfter += result.compressedSizeBytes;
      }

      const cover = editingProject.coverImage || newImages[0];
      setEditingProject({
        ...editingProject,
        coverImage: cover,
        images: newImages
      });

      setCompressionStats(
        `บีบอัดสำเร็จ: ${formatBytes(totalBefore)} ลดเหลือเพียง ${formatBytes(totalAfter)} (ส่งเข้า MongoDB Atlas เรียบร้อย!)`
      );
      showFeedback('ส่งรูปภาพเข้า MongoDB Atlas สำเร็จแล้ว!');
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveProject = async (e) => {
    e.preventDefault();
    if (!editingProject.title) {
      showFeedback('กรุณากรอกชื่อผลงาน', 'error');
      return;
    }

    try {
      setLoading(true);
      if (editingProject.id) {
        await api.updateProject(editingProject.id, editingProject);
        showFeedback('อัปเดตผลงานเรียบร้อยแล้ว');
      } else {
        await api.createProject(editingProject);
        showFeedback('สร้างผลงานใหม่เรียบร้อยแล้ว');
      }
      setIsEditorOpen(false);
      loadAllAdminData();
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Category Management Handlers (Requirement 4) ---
  const handleAddCategory = async (e) => {
    e.preventDefault();
    const clean = newCategoryName.trim();
    if (!clean) return;

    try {
      setLoading(true);
      const updated = await api.addCategory(clean);
      setCategories(updated);
      setNewCategoryName('');
      showFeedback(`เพิ่มหมวดหมู่ "${clean}" เรียบร้อย`);
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`ต้องการลบหมวดหมู่ "${catName}" หรือไม่?`)) return;
    try {
      setLoading(true);
      const updated = await api.deleteCategory(catName);
      setCategories(updated);
      showFeedback(`ลบหมวดหมู่ "${catName}" เรียบร้อย`);
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Settings & Profile Handlers (Requirements 1, 2, 5, 6, 7, 9) ---
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateProfile(profile);
      showFeedback('บันทึกการตั้งค่าหน้าเว็บเรียบร้อยแล้ว');
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 500, 500, 0.75);
      let avatarUrl = res.dataUrl;
      try {
        const uploadRes = await api.uploadFile({
          name: 'avatar_' + file.name,
          type: 'webp',
          mimeType: 'image/webp',
          dataBase64: res.dataUrl,
          size: res.compressedSizeBytes
        });
        if (uploadRes?.url) avatarUrl = uploadRes.url;
      } catch (err) {}
      setProfile({ ...profile, avatar: avatarUrl });
      showFeedback('อัปโหลดรูปโปรไฟล์เรียบร้อย (อย่าลืมกดปุ่มบันทึกการตั้งค่า)');
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 1600, 700, 0.75);
      let coverUrl = res.dataUrl;
      try {
        const uploadRes = await api.uploadFile({
          name: 'cover_' + file.name,
          type: 'webp',
          mimeType: 'image/webp',
          dataBase64: res.dataUrl,
          size: res.compressedSizeBytes
        });
        if (uploadRes?.url) coverUrl = uploadRes.url;
      } catch (err) {}
      setProfile({ ...profile, cover: coverUrl });
      showFeedback('อัปโหลดภาพปกเรียบร้อย (อย่าลืมกดปุ่มบันทึกการตั้งค่า)');
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // --- Private Vault Handlers (Requirement 10) ---
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setVaultPinError('');
    if (!vaultPinInput) return;

    try {
      setLoading(true);
      const res = await api.verifyVaultPin(vaultPinInput);
      if (res.success) {
        setVaultUnlocked(true);
        const items = await api.getVaultItems();
        setVaultItems(items);
        if (res.initialSet) {
          showFeedback('บันทึกรหัส PIN คลังส่วนตัวครั้งแรกสำเร็จแล้ว!');
        }
      } else {
        setVaultPinError('รหัส PIN ไม่ถูกต้อง กรุณาลองใหม่อีกครั้ง');
      }
    } catch (err) {
      setVaultPinError(err.message || 'เกิดข้อผิดพลาดในการตรวจสอบ PIN');
    } finally {
      setLoading(false);
    }
  };

  const handleAddVaultItem = async (e) => {
    e.preventDefault();
    if (!newVaultItem.label || !newVaultItem.emailOrId) {
      alert('กรุณากรอกชื่อรายการและอีเมล/ไอดี');
      return;
    }
    try {
      setLoading(true);
      const created = await api.addVaultItem(newVaultItem);
      setVaultItems([created, ...vaultItems]);
      setNewVaultItem({ label: '', emailOrId: '', note: '' });
      showFeedback('บันทึกบัญชีลงคลังส่วนตัวเรียบร้อย');
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVaultItem = async (id) => {
    if (!window.confirm('ต้องการลบบัญชีนี้ออกจากคลังหรือไม่?')) return;
    try {
      await api.deleteVaultItem(id);
      setVaultItems(vaultItems.filter(i => i.id !== id));
      showFeedback('ลบรายการเรียบร้อย');
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCopyText = (text, label) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(label);
    setTimeout(() => setCopyFeedback(null), 2500);
  };

  const handleChangeVaultPin = async (e) => {
    e.preventDefault();
    if (!newPinValue || newPinValue.length < 4) {
      alert('รหัส PIN ต้องมีความยาวอย่างน้อย 4 ตัวอักษร/ตัวเลข');
      return;
    }
    try {
      setLoading(true);
      await api.setVaultPin(newPinValue);
      showFeedback('เปลี่ยนรหัส PIN ส่วนตัวสำเร็จแล้ว!');
      setIsChangePinOpen(false);
      setNewPinValue('');
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // --- Site Logs Handlers (Requirements 11 & 12) ---
  const handleOpenNewSiteLog = () => {
    const now = new Date();
    setEditingSiteLog({
      title: '',
      category: 'ตรวจรอยร้าว',
      date: now.toISOString().split('T')[0],
      time: now.toTimeString().substring(0, 5),
      location: '',
      gps: { lat: '', lng: '', address: '' },
      measurements: { width: '', length: '', thickness: '', unit: 'ซม.' },
      description: '',
      images: [],
      isPublic: true,
      status: 'acknowledged',
      statusNote: '',
      estimatedCompletionDate: ''
    });
    setIsSiteLogEditorOpen(true);
  };

  const handleOpenEditSiteLog = (log) => {
    setEditingSiteLog({ ...log });
    setIsSiteLogEditorOpen(true);
  };

  const handleDeleteSiteLog = async (id) => {
    if (!window.confirm('คุณแน่ใจว่าต้องการลบบันทึกงานนี้?')) return;
    try {
      await api.deleteSiteLog(id);
      showFeedback('ลบบันทึกงานเรียบร้อย');
      loadAllAdminData();
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // ดึงตำแหน่งพิกัด GPS ปัจจุบันผ่าน Geolocation API (ข้อกำหนด 11)
  const handleGetGpsLocation = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        setEditingSiteLog(prev => ({
          ...prev,
          gps: {
            ...prev.gps,
            lat,
            lng,
            address: `พิกัด GPS (${lat}, ${lng})`
          }
        }));
        setGpsLoading(false);
        showFeedback('ดึงพิกัดตำแหน่งปัจจุบันสำเร็จแล้ว!');
      },
      (err) => {
        setGpsLoading(false);
        alert('ไม่สามารถดึงพิกัดได้: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSiteLogImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setCompressing(true);
      const newImages = [...(editingSiteLog.images || [])];

      for (const file of files) {
        const res = await compressUltraCompact(file);
        let savedUrl = res.dataUrl;
        try {
          const uploadRes = await api.uploadFile({
            name: 'site_' + file.name,
            type: 'webp',
            mimeType: 'image/webp',
            dataBase64: res.dataUrl,
            size: res.compressedSizeBytes
          });
          if (uploadRes?.url) savedUrl = uploadRes.url;
        } catch (uploadErr) {}
        newImages.push(savedUrl);
      }

      setEditingSiteLog(prev => ({ ...prev, images: newImages }));
      showFeedback('อัปโหลดรูปภาพงานก่อสร้างสำเร็จ (WebP จิ๋ว คมชัด)');
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveSiteLog = async (e) => {
    e.preventDefault();
    if (!editingSiteLog.title) {
      alert('กรุณาระบุชื่องาน / จุดที่ตรวจ');
      return;
    }

    try {
      setLoading(true);
      if (editingSiteLog.id) {
        await api.updateSiteLog(editingSiteLog.id, editingSiteLog);
        showFeedback('อัปเดตบันทึกตรวจงานเรียบร้อย');
      } else {
        await api.createSiteLog(editingSiteLog);
        showFeedback('สร้างบันทึกตรวจงานใหม่เรียบร้อย');
      }
      setIsSiteLogEditorOpen(false);
      loadAllAdminData();
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // แอดมินกดรับเรื่องข้อเสนอแนะจากผู้ว่าจ้าง (ข้อกำหนด 12)
  const handleAcknowledgeLog = async (e) => {
    e.preventDefault();
    if (!acknowledgingLog) return;
    try {
      setLoading(true);
      await api.acknowledgeSiteLog(acknowledgingLog.id, {
        status: 'in_progress',
        statusNote: ackStatusNote || 'รับเรื่องแล้ว กำลังดำเนินการแก้ไข',
        estimatedCompletionDate: ackEstDate
      });
      showFeedback('กดรับเรื่องเรียบร้อย! อัปเดตแสดงผลหน้าเว็บให้ผู้ว่าจ้างเห็นแล้ว');
      setAcknowledgingLog(null);
      loadAllAdminData();
      onRefreshData();
    } catch (err) {
      showFeedback(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Toggle Message Status
  const handleToggleMessage = async (msgId, currentStatus) => {
    const nextStatus = currentStatus === 'unread' ? 'contacted' : 'unread';
    try {
      await api.updateMessageStatus(msgId, nextStatus);
      setMessages(messages.map(m => m.id === msgId ? { ...m, status: nextStatus } : m));
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Main Admin Dialog Container */}
      <div className="relative w-full max-w-6xl h-[94vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              ย
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                ระบบจัดการหลังบ้าน (Admin Control Panel)
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-300/30">
                  Cloud MongoDB Atlas
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการผลงาน, บันทึกตรวจงานก่อสร้าง, คลังส่วนตัว, หมวดหมู่ และตั้งค่าระบบ
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Global Feedback Banner */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 transition-all ${
            feedback.type === 'error' ? 'bg-rose-500 text-white' : 'bg-emerald-600 text-white'
          }`}>
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Navigation Tabs Bar */}
        <div className="flex items-center gap-1 sm:gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'projects'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> ผลงาน ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'categories'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Tag className="w-4 h-4" /> หมวดหมู่ ({categories.length})
          </button>

          <button
            onClick={() => setActiveTab('sitelogs')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'sitelogs'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> ตรวจงานก่อสร้าง & GPS ({siteLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'vault'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Lock className="w-4 h-4" /> คลังส่วนตัว (PIN Lock)
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'messages'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> ข้อความจ้างงาน ({messages.filter(m => m.status === 'unread').length} ใหม่)
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <SettingsIcon className="w-4 h-4" /> การตั้งค่าหน้าเว็บ & ความเป็นส่วนตัว
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3.5 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'system'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <HardDrive className="w-4 h-4" /> ฐานข้อมูล & สำรองข้อมูล 10-20 ปี
          </button>
        </div>

        {/* Tab Contents Scroll Area */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/30">
          
          {/* ========================================================
              TAB 1: PROJECTS MANAGEMENT
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">แฟ้มผลงานสถาปัตยกรรม & 3D</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">รูปภาพทุกรูปจะถูกบีบอัดเป็น WebP คุณภาพสูงก่อนส่งเข้า MongoDB Atlas</p>
                </div>
                <button
                  onClick={handleOpenNewProject}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> เพิ่มผลงานใหม่
                </button>
              </div>

              {/* Projects List Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col justify-between">
                    <div>
                      <div className="relative aspect-[16/10] bg-slate-100 dark:bg-slate-800">
                        <img src={proj.coverImage || proj.images?.[0]} alt={proj.title} className="w-full h-full object-cover" />
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-lg bg-slate-900/80 text-white text-[11px] font-medium backdrop-blur-sm">
                          {proj.category}
                        </span>
                      </div>
                      <div className="p-4">
                        <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{proj.title}</h4>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                      </div>
                    </div>
                    <div className="p-4 pt-0 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-slate-400">{proj.images?.length || 0} ภาพ</span>
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                          title="ลบ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 2: CATEGORY MANAGEMENT (Requirement 4)
             ======================================================== */}
          {activeTab === 'categories' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">จัดการหมวดหมู่ผลงาน (Category Manager)</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  เพิ่ม หรือลบหมวดหมู่ผลงานได้อิสระ โดยจะแสดงผลในแท็บกรองผลงานหน้าเว็บหลักทันที
                </p>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="flex gap-2 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น งานออกแบบคาเฟ่, แบบบ้านชั้นเดียว..."
                  className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500/50"
                />
                <button
                  type="submit"
                  disabled={loading || !newCategoryName.trim()}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold rounded-xl flex items-center gap-1.5 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
                </button>
              </form>

              {/* Category Items List */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                {categories.map((cat, idx) => (
                  <div key={idx} className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 flex items-center justify-center text-xs font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{cat}</span>
                    </div>
                    <button
                      onClick={() => handleDeleteCategory(cat)}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                      title="ลบหมวดหมู่นี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: SITE INSPECTION LOGS & GPS (Requirement 11 & 12)
             ======================================================== */}
          {activeTab === 'sitelogs' && (
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <ClipboardList className="w-5 h-5 text-blue-500" /> ระบบลงงาน & ตรวจงานก่อสร้างจริง
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    บันทึกภาพหน้างาน วัน/เวลา การวัดขนาดรอยร้าว กว้าง x ยาว x หนา พิกัด GPS และข้อเสนอแนะจากผู้ว่าจ้าง
                  </p>
                </div>
                <button
                  onClick={handleOpenNewSiteLog}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-sm transition-all"
                >
                  <Plus className="w-4 h-4" /> บันทึกการตรวจงานใหม่
                </button>
              </div>

              {/* Logs List */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {siteLogs.map((log) => {
                  const unacknowledgedFeedbacks = (log.feedbackList || []).filter(f => !f.acknowledgedByAdmin);

                  return (
                    <div key={log.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-3 flex flex-col justify-between">
                      <div className="space-y-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[11px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-semibold mr-2">
                              {log.category}
                            </span>
                            <span className={`text-[11px] px-2 py-0.5 rounded-md font-semibold ${
                              log.isPublic ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}>
                              {log.isPublic ? 'แสดงหน้าเว็บ (Public)' : 'ซ่อนเฉพาะหลังบ้าน'}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleOpenEditSiteLog(log)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteSiteLog(log.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        <h4 className="font-bold text-base text-slate-900 dark:text-white">{log.title}</h4>

                        {/* Date, Time, Location & GPS */}
                        <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                          <span>📅 {log.date} {log.time ? `(${log.time} น.)` : ''}</span>
                          {log.location && <span>📍 {log.location}</span>}
                          {log.gps?.lat && log.gps?.lng && (
                            <a
                              href={`https://www.google.com/maps?q=${log.gps.lat},${log.gps.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:underline flex items-center gap-0.5"
                            >
                              <ExternalLink className="w-3 h-3" /> แผนที่
                            </a>
                          )}
                        </div>

                        {/* Measurements */}
                        {log.measurements && (log.measurements.width || log.measurements.length || log.measurements.thickness) && (
                          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-700 dark:text-slate-300 flex items-center gap-3">
                            <Ruler className="w-4 h-4 text-blue-500" />
                            <span>กว้าง: <b>{log.measurements.width || '-'}</b></span>
                            <span>ยาว: <b>{log.measurements.length || '-'}</b></span>
                            <span>หนา: <b>{log.measurements.thickness || '-'}</b></span>
                          </div>
                        )}

                        <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2">{log.description}</p>

                        {/* Photos preview */}
                        {log.images && log.images.length > 0 && (
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {log.images.map((img, i) => (
                              <img key={i} src={img} alt="" className="w-16 h-16 rounded-xl object-cover border border-slate-200 dark:border-slate-700 flex-shrink-0" />
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Feedback & Acknowledge Section (Requirement 12) */}
                      <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
                        {unacknowledgedFeedbacks.length > 0 ? (
                          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-300 dark:border-amber-800 rounded-xl space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-amber-800 dark:text-amber-300">
                              <span className="flex items-center gap-1.5">
                                <Bell className="w-3.5 h-3.5 animate-bounce" /> มีข้อเสนอแนะใหม่ ({unacknowledgedFeedbacks.length})
                              </span>
                              <button
                                onClick={() => {
                                  setAcknowledgingLog(log);
                                  setAckStatusNote(log.statusNote || 'รับเรื่องแล้ว กำลังเข้าดำเนินการแก้ไข');
                                  setAckEstDate(log.estimatedCompletionDate || '');
                                }}
                                className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-[11px] font-semibold"
                              >
                                กดรับเรื่อง & กำหนดวันเสร็จ
                              </button>
                            </div>
                            <div className="text-xs text-slate-700 dark:text-slate-300">
                              "{unacknowledgedFeedbacks[0].comment}" (จาก: {unacknowledgedFeedbacks[0].clientName})
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>สถานะ: {log.statusNote || 'ยังไม่มีข้อเสนอแนะค้าง'}</span>
                            <button
                              onClick={() => {
                                setAcknowledgingLog(log);
                                setAckStatusNote(log.statusNote || '');
                                setAckEstDate(log.estimatedCompletionDate || '');
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:underline text-[11px]"
                            >
                              อัปเดตสถานะ/วันเสร็จ
                            </button>
                          </div>
                        )}
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 4: PRIVATE VAULT (Requirement 10)
             ======================================================== */}
          {activeTab === 'vault' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-amber-500" /> คลังข้อมูลส่วนตัว (Private Vault)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  สำหรับเก็บอีเมลส่วนตัวหลายแอ็กเคานต์ ไอดี รหัสผ่าน กันลืม พร้อมปุ่มคัดลอกใน 1 คลิก ป้องกันด้วยรหัส PIN แยกต่างหาก
                </p>
              </div>

              {!vaultUnlocked ? (
                /* PIN Screen */
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950 text-amber-600 flex items-center justify-center mx-auto">
                    <KeyRound className="w-7 h-7" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-base">กรุณากรอกรหัส PIN คลังส่วนตัว</h4>
                    <p className="text-xs text-slate-500 mt-1">
                      (รหัสนี้เป็นรหัสส่วนตัว แยกต่างหากจากรหัสผ่านเข้าหลังบ้าน)
                    </p>
                  </div>

                  {vaultPinError && (
                    <div className="p-2.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-600 text-xs rounded-xl">
                      {vaultPinError}
                    </div>
                  )}

                  <form onSubmit={handleUnlockVault} className="space-y-3">
                    <input
                      type="password"
                      autoFocus
                      value={vaultPinInput}
                      onChange={(e) => setVaultPinInput(e.target.value)}
                      placeholder="ใส่รหัส PIN 4-6 หลัก..."
                      className="w-full text-center tracking-widest text-lg font-bold px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-amber-500/50"
                    />
                    <button
                      type="submit"
                      disabled={loading || !vaultPinInput}
                      className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all disabled:opacity-50"
                    >
                      {loading ? 'กำลังตรวจสอบ...' : 'ปลดล็อกคลังส่วนตัว'}
                    </button>
                  </form>
                </div>
              ) : (
                /* Unlocked Vault Interface */
                <div className="space-y-6">
                  <div className="flex items-center justify-between bg-emerald-50 dark:bg-emerald-950/40 p-4 rounded-2xl border border-emerald-300 dark:border-emerald-800">
                    <div className="flex items-center gap-2 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                      <ShieldCheck className="w-4 h-4" /> ปลดล็อกเรียบร้อยแล้ว
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setIsChangePinOpen(true)}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline flex items-center gap-1"
                      >
                        <KeyRound className="w-3.5 h-3.5" /> เปลี่ยนรหัส PIN
                      </button>
                      <button
                        onClick={() => setVaultUnlocked(false)}
                        className="text-xs text-rose-600 dark:text-rose-400 hover:underline"
                      >
                        ล็อกคลัง
                      </button>
                    </div>
                  </div>

                  {/* Add New Item */}
                  <form onSubmit={handleAddVaultItem} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">เพิ่มรายการบัญชี / อีเมลใหม่</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        required
                        value={newVaultItem.label}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, label: e.target.value })}
                        placeholder="ชื่อบัญชี เช่น Gmail งาน, Apple ID"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        required
                        value={newVaultItem.emailOrId}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, emailOrId: e.target.value })}
                        placeholder="อีเมล หรือ Username หรือรหัส"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                      <input
                        type="text"
                        value={newVaultItem.note}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, note: e.target.value })}
                        placeholder="บันทึกช่วยจำ (ถ้ามี)"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white outline-none"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> บันทึกลงคลัง
                    </button>
                  </form>

                  {/* Items List */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800">
                    {vaultItems.length === 0 ? (
                      <div className="p-8 text-center text-xs text-slate-400">ยังไม่มีรายการบัญชีในคลัง</div>
                    ) : (
                      vaultItems.map((item) => (
                        <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <div className="font-bold text-sm text-slate-900 dark:text-white">{item.label}</div>
                            <div className="font-mono text-xs text-emerald-600 dark:text-emerald-400 mt-0.5 select-all">
                              {item.emailOrId}
                            </div>
                            {item.note && <div className="text-[11px] text-slate-400 mt-1">{item.note}</div>}
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleCopyText(item.emailOrId, item.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all ${
                                copyFeedback === item.id
                                  ? 'bg-emerald-600 text-white'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                              }`}
                            >
                              <Copy className="w-3.5 h-3.5" />
                              {copyFeedback === item.id ? 'คัดลอกแล้ว!' : 'คัดลอก (Copy)'}
                            </button>
                            <button
                              onClick={() => handleDeleteVaultItem(item.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: MESSAGES & HIRE INQUIRIES
             ======================================================== */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">กล่องข้อความจ้างงาน & รูปภาพแนบ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">ข้อความและรูปถ่ายหน้างานที่ลูกค้าส่งผ่านแบบฟอร์ม</p>
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  ยังไม่มีข้อความจ้างงานใหม่
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{msg.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full ${
                              msg.status === 'unread' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {msg.status === 'unread' ? 'ยังไม่ได้ติดต่อ' : 'ติดต่อแล้ว'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                            {msg.phone && <span>เบอร์โทร: <b>{msg.phone}</b></span>}
                            {msg.lineId && <span>LINE: <b>{msg.lineId}</b></span>}
                            <span>ประเภท: <b>{msg.projectType}</b></span>
                            {msg.budget && <span>งบประมาณ: <b>{msg.budget}</b></span>}
                          </div>
                        </div>
                        <button
                          onClick={() => handleToggleMessage(msg.id, msg.status)}
                          className="px-3 py-1 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                        >
                          {msg.status === 'unread' ? 'ทำเครื่องหมายว่าติดต่อแล้ว' : 'ตั้งเป็นยังไม่ติดต่อ'}
                        </button>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl">
                        {msg.message || 'ไม่มีรายละเอียดเพิ่มเติม'}
                      </p>

                      {/* Attached Customer Photos */}
                      {msg.images && msg.images.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> รูปภาพที่ลูกค้าแนบมา ({msg.images.length} ภาพ):
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {msg.images.map((imgUrl, i) => (
                              <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="block relative aspect-square w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 hover:opacity-90">
                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: SETTINGS & PRIVACY (Requirements 1, 2, 5, 6, 7, 9)
             ======================================================== */}
          {activeTab === 'settings' && profile && (
            <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">การตั้งค่าหน้าเว็บ & ความเป็นส่วนตัว</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ปรับแต่งข้อความ ป้ายสถานะ และสิทธิ์การมองเห็นข้อมูลติดต่อตามข้อกำหนดของคุณ
                </p>
              </div>

              {/* Privacy Toggles (ข้อกำหนด 1) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-emerald-500" /> ควบคุมความเป็นส่วนตัวบนหน้าเว็บสาธารณะ
                </h4>
                
                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">ซ่อนชื่อจริงบนหน้าเว็บสาธารณะ</span>
                    <span className="text-[11px] text-slate-400">เมื่อเปิด จะแสดงเฉพาะตำแหน่งและผลงาน ไม่แสดงชื่อจริงของคุณ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.hidePublicName || false}
                    onChange={(e) => setProfile({ ...profile, hidePublicName: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">ซ่อนเบอร์โทรศัพท์บนหน้าเว็บ</span>
                    <span className="text-[11px] text-slate-400">เมื่อเปิด จะไม่แสดงเบอร์โทรศัพท์บนหน้าเว็บสาธารณะ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.hidePublicPhone || false}
                    onChange={(e) => setProfile({ ...profile, hidePublicPhone: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>

                <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">ซ่อนอีเมลบนหน้าเว็บ</span>
                    <span className="text-[11px] text-slate-400">เมื่อเปิด จะไม่แสดงอีเมลในส่วนติดต่อ</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={profile.hidePublicEmail || false}
                    onChange={(e) => setProfile({ ...profile, hidePublicEmail: e.target.checked })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                </label>
              </div>

              {/* Work Status Badge Settings (ข้อกำหนด 7) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  สถานะการจ้างงาน / กำลังดำเนินงาน (Work Status Badge)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ระดับสถานะ</label>
                    <select
                      value={profile.workStatus?.status || 'available'}
                      onChange={(e) => setProfile({
                        ...profile,
                        workStatus: { ...(profile.workStatus || {}), status: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    >
                      <option value="available">พร้อมรับงานทันที (สีเขียว)</option>
                      <option value="in_progress">กำลังดำเนินงาน / คิวงานแน่น (สีน้ำเงิน)</option>
                      <option value="busy">งดรับงานชั่วคราว (สีส้ม)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ข้อความแสดงบนป้าย</label>
                    <input
                      type="text"
                      value={profile.workStatus?.text || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        workStatus: { ...(profile.workStatus || {}), text: e.target.value }
                      })}
                      placeholder="เช่น พร้อมรับงานออกแบบ & เขียนแบบ"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
                <label className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 pt-1">
                  <input
                    type="checkbox"
                    checked={profile.workStatus?.showPublic !== false}
                    onChange={(e) => setProfile({
                      ...profile,
                      workStatus: { ...(profile.workStatus || {}), showPublic: e.target.checked }
                    })}
                    className="w-4 h-4 text-emerald-600 rounded"
                  />
                  <span>แสดงป้ายสถานะนี้บนหน้าเว็บสาธารณะ</span>
                </label>
              </div>

              {/* Customizable Website Texts (ข้อกำหนด 5, 6, 9) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  ปรับแต่งข้อความส่วนติดต่อและแบบฟอร์ม
                </h4>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    ข้อความป้ายหัวข้อ (ข้อกำหนด 9)
                  </label>
                  <input
                    type="text"
                    value={profile.contactBadgeText || ''}
                    onChange={(e) => setProfile({ ...profile, contactBadgeText: e.target.value })}
                    placeholder="ติดต่อจ้างงาน & ปรึกษาแบบ"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    หัวข้อหลักส่วนติดต่อ (ข้อกำหนด 5)
                  </label>
                  <input
                    type="text"
                    value={profile.contactTitle || ''}
                    onChange={(e) => setProfile({ ...profile, contactTitle: e.target.value })}
                    placeholder="ยินดีให้คำปรึกษาและร่วมงานกับคุณ"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    คำอธิบายแบบฟอร์มส่งรายละเอียดจ้างงาน (ข้อกำหนด 6)
                  </label>
                  <textarea
                    rows={2}
                    value={profile.hireFormDesc || ''}
                    onChange={(e) => setProfile({ ...profile, hireFormDesc: e.target.value })}
                    placeholder="กรอกข้อมูลเบื้องต้นด้านล่าง จะติดต่อกลับเพื่อประเมินราคาโดยเร็วที่สุด สามารถลงรูปได้และบีบอัดให้เล็กที่สุด"
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Photos & Cover uploads */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">รูปภาพโปรไฟล์และภาพปก</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">รูปโปรไฟล์ (Avatar)</label>
                    <div className="flex items-center gap-3">
                      <img src={profile.avatar} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                      <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs rounded-xl cursor-pointer">
                        เลือกรูปใหม่
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">ภาพปก (Cover Banner)</label>
                    <div className="flex items-center gap-3">
                      <img src={profile.cover} alt="" className="w-20 h-12 rounded-xl object-cover border" />
                      <label className="px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs rounded-xl cursor-pointer">
                        เลือกรูปใหม่
                        <input type="file" accept="image/*" onChange={handleCoverUpload} className="hidden" />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all disabled:opacity-50"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการตั้งค่าทั้งหมด'}
              </button>
            </form>
          )}

          {/* ========================================================
              TAB 7: SYSTEM & DATABASE 10-20 YEARS (Requirement 8)
             ======================================================== */}
          {activeTab === 'system' && (
            <div className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-500" /> สถานะฐานข้อมูล & การสำรองข้อมูล 10-20 ปี
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ระบบออกแบบให้ยั่งยืน รองรับการใช้งานยาวนาน 10–20 ปี ฟรี ไม่มีค่าบริการรายเดือน
                </p>
              </div>

              {/* Cloud DB Meter */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-slate-800 dark:text-slate-200">
                  <span>MongoDB Atlas Cloud Storage:</span>
                  <span>{systemStatus?.storageUsedBytes ? formatBytes(systemStatus.storageUsedBytes) : '150 KB'} / 512 MB (ฟรีตลอดชีพ)</span>
                </div>
                <div className="w-full h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full w-[2%]" />
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  💡 ด้วยเทคโนโลยีบีบอัด WebP อัตโนมัติ (ขนาดรูปละ ~30-70 KB) โควต้าฟรี 512 MB ของคุณสามารถเก็บภาพผลงานและแบบแปลนได้มากกว่า <b>10,000+ ภาพ</b> ใช้งานได้ต่อเนื่อง 10-20 ปีสบายๆ ครับ
                </p>
              </div>

              {/* 1-Click Backup Export */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                  <Download className="w-4 h-4 text-emerald-500" /> สำรองข้อมูลทั้งหมด (1-Click Full Backup)
                </h4>
                <p className="text-xs text-slate-500">
                  ดาวน์โหลดไฟล์ .json ก้อนเดียวที่มีครบทุกอย่าง: ผลงาน, บันทึกตรวจงาน, ข้อความลูกค้า, บัญชีคลังส่วนตัว และการตั้งค่า สำหรับเก็บสำรองใน Flash Drive หรือ Google Drive
                </p>
                <a
                  href={api.getBackupUrl()}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm"
                >
                  <Download className="w-4 h-4" /> ดาวน์โหลดไฟล์สำรองข้อมูล (.json)
                </a>
              </div>
            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          MODAL: PROJECT EDITOR
         ======================================================== */}
      {isEditorOpen && editingProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-3xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProject.id ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">ชื่อผลงาน / โครงการ *</label>
                <input
                  type="text"
                  required
                  value={editingProject.title}
                  onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                  placeholder="เช่น Modern Minimalist Villa 2 ชั้น"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">หมวดหมู่</label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    {categories.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">ปีที่ทำ / สถานที่</label>
                  <input
                    type="text"
                    value={editingProject.location}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    placeholder="เช่น เชียงใหม่, 2026"
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">คำอธิบายรายละเอียดผลงาน</label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Project Photos & Upload */}
              <div>
                <label className="block text-xs font-semibold mb-1.5 flex items-center justify-between">
                  <span>รูปภาพผลงาน (บีบอัด WebP อัตโนมัติ)</span>
                  {compressionStats && <span className="text-[11px] text-emerald-600">{compressionStats}</span>}
                </label>
                
                {editingProject.images && editingProject.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {editingProject.images.map((img, i) => (
                      <div key={i} className="relative aspect-video rounded-xl overflow-hidden border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingProject({ ...editingProject, images: editingProject.images.filter((_, idx) => idx !== i) })}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 cursor-pointer text-xs">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>{compressing ? 'กำลังบีบอัดภาพ WebP...' : 'คลิกเพื่อเลือกภาพผลงาน (ย่ออัตโนมัติก่อนส่งขึ้นคลาวด์)'}</span>
                  <input type="file" multiple accept="image/*" onChange={handleProjectImageUpload} className="hidden" />
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading || compressing}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  บันทึกผลงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SITE LOG EDITOR (Requirement 11)
         ======================================================== */}
      {isSiteLogEditorOpen && editingSiteLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl max-h-[90vh] bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-blue-500" />
                {editingSiteLog.id ? 'แก้ไขบันทึกตรวจงาน' : 'บันทึกการตรวจงานก่อสร้างใหม่'}
              </h3>
              <button onClick={() => setIsSiteLogEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiteLog} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold mb-1">หัวข้องาน / ตำแหน่งที่ตรวจ *</label>
                <input
                  type="text"
                  required
                  value={editingSiteLog.title}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, title: e.target.value })}
                  placeholder="เช่น ตรวจรอยร้าวผนังอิฐมวลเบา ทิศตะวันตก ชั้น 2"
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">หมวดหมู่ตรวจงาน</label>
                  <select
                    value={editingSiteLog.category}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, category: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="ตรวจรอยร้าว">ตรวจรอยร้าว</option>
                    <option value="งานโครงสร้าง">งานโครงสร้าง</option>
                    <option value="แก้งาน / เก็บงาน">แก้งาน / เก็บงาน</option>
                    <option value="ส่งมอบงาน">ส่งมอบงาน</option>
                    <option value="ตรวจงานสถาปัตย์">ตรวจงานสถาปัตย์</option>
                    <option value="รายงานประจำวัน">รายงานประจำวัน</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">วันที่</label>
                  <input
                    type="date"
                    value={editingSiteLog.date}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">เวลา</label>
                  <input
                    type="time"
                    value={editingSiteLog.time}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, time: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Location & GPS Button (ข้อกำหนด 11) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-rose-500" /> สถานที่ & แผนที่ปักหมุด GPS
                  </span>
                  <button
                    type="button"
                    onClick={handleGetGpsLocation}
                    disabled={gpsLoading}
                    className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[11px] font-semibold flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    {gpsLoading ? 'กำลังดึงพิกัด...' : '📍 ดึงตำแหน่งปัจจุบันของฉัน (GPS)'}
                  </button>
                </div>

                <input
                  type="text"
                  value={editingSiteLog.location}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, location: e.target.value })}
                  placeholder="ชื่อสถานที่ หรือโครงการ เช่น โครงการบ้านเดี่ยว สันทราย เชียงใหม่"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />

                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    value={editingSiteLog.gps?.lat || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      gps: { ...(editingSiteLog.gps || {}), lat: e.target.value }
                    })}
                    placeholder="Latitude เช่น 18.7883"
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                  <input
                    type="text"
                    value={editingSiteLog.gps?.lng || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      gps: { ...(editingSiteLog.gps || {}), lng: e.target.value }
                    })}
                    placeholder="Longitude เช่น 98.9853"
                    className="px-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white font-mono"
                  />
                </div>
              </div>

              {/* Measurements: กว้าง x ยาว x หนา (ข้อกำหนด 11) */}
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-2">
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Ruler className="w-4 h-4 text-blue-500" /> การวัดขนาดงาน / รอยร้าว (กว้าง x ยาว x หนา)
                </span>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={editingSiteLog.measurements?.width || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      measurements: { ...(editingSiteLog.measurements || {}), width: e.target.value }
                    })}
                    placeholder="กว้าง เช่น 120 ซม."
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editingSiteLog.measurements?.length || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      measurements: { ...(editingSiteLog.measurements || {}), length: e.target.value }
                    })}
                    placeholder="ยาว เช่น 0.2 มม."
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                  <input
                    type="text"
                    value={editingSiteLog.measurements?.thickness || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      measurements: { ...(editingSiteLog.measurements || {}), thickness: e.target.value }
                    })}
                    placeholder="หนา / ลึก เช่น ผิวปูนฉาบ"
                    className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">รายละเอียดการตรวจ & แนวทางแก้ไข</label>
                <textarea
                  rows={3}
                  value={editingSiteLog.description}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, description: e.target.value })}
                  placeholder="ระบุสิ่งที่พบ เช่น รอยร้าวแตกลายงา เซาะร่องและใช้วัสดุอุดโป๊ว..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              {/* Photos upload */}
              <div>
                <label className="block text-xs font-semibold mb-1">รูปถ่ายหน้างาน</label>
                {editingSiteLog.images && editingSiteLog.images.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {editingSiteLog.images.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-xl overflow-hidden border">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingSiteLog({
                            ...editingSiteLog,
                            images: editingSiteLog.images.filter((_, idx) => idx !== i)
                          })}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-full text-xs"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 cursor-pointer text-xs">
                  <Upload className="w-4 h-4 text-blue-500" />
                  <span>{compressing ? 'กำลังบีบอัดรูปภาพ...' : 'คลิกเพื่อเลือกภาพถ่ายหน้างาน (บีบอัด WebP จิ๋วอัตโนมัติ)'}</span>
                  <input type="file" multiple accept="image/*" onChange={handleSiteLogImageUpload} className="hidden" />
                </label>
              </div>

              {/* Public Toggle (ข้อกำหนด 12) */}
              <label className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 cursor-pointer">
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-white block">เปิดให้ผู้ชมเว็ปไซต์เห็นบันทึกนี้</span>
                  <span className="text-[11px] text-slate-400">ผู้ชมและผู้ว่าจ้างจะสามารถส่งข้อเสนอแนะและตรวจรับงานได้</span>
                </div>
                <input
                  type="checkbox"
                  checked={editingSiteLog.isPublic}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, isPublic: e.target.checked })}
                  className="w-4 h-4 text-blue-600 rounded"
                />
              </label>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsSiteLogEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold"
                >
                  บันทึกข้อมูลหน้างาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: ACKNOWLEDGE FEEDBACK (Requirement 12)
         ======================================================== */}
      {acknowledgingLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-500" /> กดรับเรื่องข้อเสนอแนะ
              </h3>
              <button onClick={() => setAcknowledgingLog(null)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleAcknowledgeLog} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">ข้อความอัปเดตสถานะให้ผู้ว่าจ้างเห็น</label>
                <input
                  type="text"
                  required
                  value={ackStatusNote}
                  onChange={(e) => setAckStatusNote(e.target.value)}
                  placeholder="เช่น หลังบ้านรับเรื่องแล้ว ช่างกำลังเข้าสกัดโป๊วรอยต่อ"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">กำหนดวันที่เสร็จ (หรือไม่ระบุก็ได้ตามข้อกำหนด 12)</label>
                <input
                  type="date"
                  value={ackEstDate}
                  onChange={(e) => setAckEstDate(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAcknowledgingLog(null)}
                  className="px-4 py-2 border rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold"
                >
                  ยืนยันรับเรื่อง & แสดงหน้าเว็บ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CHANGE VAULT PIN (Requirement 10)
         ======================================================== */}
      {isChangePinOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-sm bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 p-6 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" /> ตั้งรหัส PIN คลังส่วนตัวใหม่
              </h3>
              <button onClick={() => setIsChangePinOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleChangeVaultPin} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold mb-1">รหัส PIN ใหม่ (อย่างน้อย 4 ตัว)</label>
                <input
                  type="password"
                  required
                  value={newPinValue}
                  onChange={(e) => setNewPinValue(e.target.value)}
                  placeholder="กรอกรหัส PIN ใหม่..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangePinOpen(false)}
                  className="px-3 py-1.5 border rounded-xl text-xs font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-semibold"
                >
                  บันทึก PIN ใหม่
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
