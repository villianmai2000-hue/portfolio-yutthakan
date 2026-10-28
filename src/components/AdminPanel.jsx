import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Upload, Database, HardDrive, 
  Download, MessageSquare, Image as ImageIcon, CheckCircle, 
  AlertCircle, RefreshCw, Layers, User, Phone, MessageCircle, 
  ExternalLink, FileCode2, Sparkles, Check, ArrowUpRight,
  Lock, KeyRound, Copy, Eye, EyeOff, ShieldCheck, MapPin, 
  Navigation, Calendar, Clock, Ruler, ClipboardList, CheckCheck,
  Tag, Settings as SettingsIcon, ShieldAlert, FolderPlus, Bell,
  FileSpreadsheet, PhoneCall, ZoomIn, Boxes, Wrench, Send
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressImage, compressUltraCompact, formatBytes } from '../utils/compressor.js';

const REBAR_WEIGHTS = {
  DB12: 0.888,
  DB16: 1.58,
  DB20: 2.47,
  DB25: 3.85,
  DB28: 4.83,
  DB32: 6.31,
  RB6: 0.222,
  RB9: 0.499
};

export default function AdminPanel({ isOpen, onClose, onRefreshData, initialTab = 'projects' }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'projects'); 
  // Tabs: 'projects', 'categories', 'rebar', 'sitelogs', 'vault', 'messages', 'settings', 'system'

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

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

  // Rebar Cut List (BBS) State - Requirement 5 & 8
  const [rebarItems, setRebarItems] = useState([]);
  const [rebarSummary, setRebarSummary] = useState(null);
  const [rebarLoading, setRebarLoading] = useState(false);
  const [rebarAutoSync, setRebarAutoSync] = useState(true);
  const [isRebarEditorOpen, setIsRebarEditorOpen] = useState(false);
  const [editingRebarItem, setEditingRebarItem] = useState(null);
  const [rebarForm, setRebarForm] = useState({
    label: '',
    rebarType: 'DB20',
    standardLength: 12,
    cutLength: 6.0,
    quantity: 1,
    note: ''
  });

  // Message Detail & Lightbox State - Requirement 1
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

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

  // Load Data on Open
  useEffect(() => {
    if (isOpen) {
      loadAllData();
    }
  }, [isOpen]);

  // Real-Time Polling for Rebar Sync (Every 5s when on rebar tab)
  useEffect(() => {
    if (!isOpen || activeTab !== 'rebar' || !rebarAutoSync) return;
    const interval = setInterval(() => {
      loadRebarData(false);
    }, 5000);
    return () => clearInterval(interval);
  }, [isOpen, activeTab, rebarAutoSync]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [projs, prof, msgs, cats, logs, sys] = await Promise.all([
        api.getProjects(),
        api.getProfile(),
        api.getMessages().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSiteLogs().catch(() => []),
        api.getSystemStatus().catch(() => null)
      ]);
      setProjects(projs);
      setProfile(prof);
      setMessages(msgs);
      setCategories(cats);
      setSiteLogs(logs);
      setSystemStatus(sys);
      loadRebarData(false);
    } catch (err) {
      showFeedback('error', 'โหลดข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadRebarData = async (showSpinner = true) => {
    if (showSpinner) setRebarLoading(true);
    try {
      const [items, summary] = await Promise.all([
        api.getRebarItems().catch(() => []),
        api.getRebarSummary().catch(() => null)
      ]);
      setRebarItems(items);
      setRebarSummary(summary);
    } catch (err) {
      console.error('Failed to load rebar:', err);
    } finally {
      if (showSpinner) setRebarLoading(false);
    }
  };

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  // ========================================================
  // REBAR BBS & REAL-TIME CAD / SKETCHUP HANDLERS
  // ========================================================
  const calculateRebarMetrics = (stdLen, cutLen, qty, type) => {
    const sLen = Number(stdLen) || 12;
    const cLen = Number(cutLen) || 1;
    const count = Number(qty) || 1;
    const piecesPerBar = Math.max(1, Math.floor(sLen / cLen));
    const standardBarsNeeded = Math.ceil(count / piecesPerBar);
    const offcutPerBar = Math.max(0, sLen - (piecesPerBar * cLen));
    const totalCutLength = count * cLen;
    const totalStandardLength = standardBarsNeeded * sLen;
    const totalScrapLength = Math.max(0, totalStandardLength - totalCutLength);
    const scrapPercent = totalStandardLength > 0 ? ((totalScrapLength / totalStandardLength) * 100) : 0;
    const unitWeight = REBAR_WEIGHTS[type] || 2.47;
    const totalWeightKg = totalCutLength * unitWeight;
    const totalBarWeightKg = totalStandardLength * unitWeight;

    return {
      piecesPerBar,
      standardBarsNeeded,
      offcutPerBar: Number(offcutPerBar.toFixed(2)),
      totalCutLength: Number(totalCutLength.toFixed(2)),
      totalStandardLength: Number(totalStandardLength.toFixed(2)),
      totalScrapLength: Number(totalScrapLength.toFixed(2)),
      scrapPercent: Number(scrapPercent.toFixed(1)),
      unitWeight,
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalBarWeightKg: Number(totalBarWeightKg.toFixed(2))
    };
  };

  const handleSaveRebar = async (e) => {
    e.preventDefault();
    if (!rebarForm.cutLength || rebarForm.cutLength <= 0 || !rebarForm.quantity || rebarForm.quantity <= 0) {
      showFeedback('error', 'กรุณาระบุความยาวตัดและจำนวนให้ถูกต้อง');
      return;
    }
    try {
      if (editingRebarItem) {
        await api.updateRebarItem(editingRebarItem.id, rebarForm);
        showFeedback('success', 'แก้ไขรายการเหล็กเรียบร้อย และซิงก์ CAD/SketchUp สำเร็จ');
      } else {
        await api.createRebarItem(rebarForm);
        showFeedback('success', 'เพิ่มรายการเหล็กเรียบร้อย และซิงก์ CAD/SketchUp สำเร็จ');
      }
      setIsRebarEditorOpen(false);
      setEditingRebarItem(null);
      setRebarForm({ label: '', rebarType: 'DB20', standardLength: 12, cutLength: 6.0, quantity: 1, note: '' });
      loadRebarData();
    } catch (err) {
      showFeedback('error', 'บันทึกรายการเหล็กไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteRebar = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการถอดเหล็กเส้นนี้?')) return;
    try {
      await api.deleteRebarItem(id);
      showFeedback('success', 'ลบรายการเหล็กเรียบร้อย');
      loadRebarData();
    } catch (err) {
      showFeedback('error', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // MESSAGE HANDLERS (Delete & View Details)
  // ========================================================
  const handleToggleMessage = async (id, currentStatus) => {
    const nextStatus = currentStatus === 'unread' ? 'read' : 'unread';
    try {
      await api.updateMessageStatus(id, nextStatus);
      setMessages(messages.map(m => m.id === id ? { ...m, status: nextStatus } : m));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage({ ...selectedMessage, status: nextStatus });
      }
      showFeedback('success', 'อัปเดตสถานะข้อความแล้ว');
    } catch (err) {
      showFeedback('error', 'อัปเดตไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteMessage = async (id) => {
    if (!window.confirm('คุณต้องการลบข้อความจ้างงานนี้ใช่หรือไม่? ข้อมูลจะถูกลบถาวร')) return;
    try {
      await api.deleteMessage(id);
      setMessages(messages.filter(m => m.id !== id));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage(null);
      }
      showFeedback('success', 'ลบข้อความจ้างงานเรียบร้อยแล้ว');
    } catch (err) {
      showFeedback('error', 'ลบข้อความไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // VAULT HANDLERS
  // ========================================================
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setVaultPinError('');
    try {
      const res = await api.verifyVaultPin(vaultPinInput);
      setVaultItems(res.items || []);
      setVaultUnlocked(true);
      setVaultPinInput('');
    } catch (err) {
      setVaultPinError(err.message || 'รหัส PIN ไม่ถูกต้อง');
    }
  };

  const handleAddVaultItem = async (e) => {
    e.preventDefault();
    if (!newVaultItem.emailOrId) return;
    try {
      const updated = await api.addVaultItem(newVaultItem);
      setVaultItems(updated);
      setNewVaultItem({ label: '', emailOrId: '', note: '' });
      showFeedback('success', 'บันทึกข้อมูลส่วนตัวเรียบร้อย');
    } catch (err) {
      showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteVaultItem = async (id) => {
    if (!window.confirm('คุณต้องการลบรายการนี้ใช่หรือไม่?')) return;
    try {
      const updated = await api.deleteVaultItem(id);
      setVaultItems(updated);
      showFeedback('success', 'ลบรายการเรียบร้อย');
    } catch (err) {
      showFeedback('error', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const handleChangePin = async (e) => {
    e.preventDefault();
    if (newPinValue.length < 4) {
      showFeedback('error', 'รหัส PIN ต้องมีความยาวอย่างน้อย 4 ตัวอักษร');
      return;
    }
    try {
      await api.changeVaultPin(newPinValue);
      showFeedback('success', 'เปลี่ยนรหัส PIN ห้องส่วนตัวสำเร็จ');
      setIsChangePinOpen(false);
      setNewPinValue('');
    } catch (err) {
      showFeedback('error', 'เปลี่ยน PIN ไม่สำเร็จ: ' + err.message);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 2000);
  };

  // ========================================================
  // SITE LOG HANDLERS
  // ========================================================
  const handleGetCurrentGPS = () => {
    if (!navigator.geolocation) {
      alert('เบราว์เซอร์ของคุณไม่รองรับการดึงพิกัด GPS');
      return;
    }
    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLoading(false);
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        const gpsStr = `${lat}, ${lng}`;
        const mapUrl = `https://www.google.com/maps?q=${lat},${lng}`;
        setEditingSiteLog(prev => ({
          ...prev,
          gpsLocation: gpsStr,
          mapUrl: mapUrl
        }));
      },
      (err) => {
        setGpsLoading(false);
        alert('ไม่สามารถดึงตำแหน่ง GPS ได้: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSaveSiteLog = async (e) => {
    e.preventDefault();
    try {
      if (editingSiteLog.id) {
        await api.updateSiteLog(editingSiteLog.id, editingSiteLog);
        showFeedback('success', 'แก้ไขบันทึกตรวจงานเรียบร้อย');
      } else {
        await api.createSiteLog(editingSiteLog);
        showFeedback('success', 'เพิ่มบันทึกตรวจงานเรียบร้อย');
      }
      setIsSiteLogEditorOpen(false);
      setEditingSiteLog(null);
      const updated = await api.getSiteLogs();
      setSiteLogs(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteSiteLog = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบบันทึกตรวจงานนี้?')) return;
    try {
      await api.deleteSiteLog(id);
      showFeedback('success', 'ลบบันทึกตรวจงานแล้ว');
      const updated = await api.getSiteLogs();
      setSiteLogs(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  const handleRespondFeedback = async (logId, fbIndex, currentApproved) => {
    try {
      await api.respondFeedback(logId, fbIndex, {
        approved: !currentApproved,
        actionStatus: !currentApproved ? 'in_progress' : 'pending',
        targetDate: new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0]
      });
      showFeedback('success', 'อัปเดตการรับเรื่องและสถานะเรียบร้อย');
      const updated = await api.getSiteLogs();
      setSiteLogs(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'อัปเดตไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // PROJECT HANDLERS
  // ========================================================
  const handleSaveProject = async (e) => {
    e.preventDefault();
    try {
      if (editingProject.id) {
        await api.updateProject(editingProject.id, editingProject);
        showFeedback('success', 'แก้ไขผลงานเรียบร้อยแล้ว');
      } else {
        await api.createProject(editingProject);
        showFeedback('success', 'เพิ่มผลงานใหม่เรียบร้อยแล้ว');
      }
      setIsEditorOpen(false);
      setEditingProject(null);
      setCompressionStats(null);
      const updated = await api.getProjects();
      setProjects(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteProject = async (id) => {
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้?')) return;
    try {
      await api.deleteProject(id);
      showFeedback('success', 'ลบผลงานเรียบร้อยแล้ว');
      const updated = await api.getProjects();
      setProjects(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'ลบผลงานไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // CATEGORIES HANDLERS
  // ========================================================
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCategoryName.trim()) return;
    try {
      const updated = await api.createCategory(newCategoryName.trim());
      setCategories(updated);
      setNewCategoryName('');
      showFeedback('success', 'เพิ่มหมวดหมู่ผลงานใหม่แล้ว');
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'เพิ่มหมวดหมู่ไม่สำเร็จ: ' + err.message);
    }
  };

  const handleDeleteCategory = async (catName) => {
    if (!window.confirm(`คุณต้องการลบหมวดหมู่ "${catName}" ใช่หรือไม่?`)) return;
    try {
      const updated = await api.deleteCategory(catName);
      setCategories(updated);
      showFeedback('success', 'ลบหมวดหมู่เรียบร้อยแล้ว');
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'ลบหมวดหมู่ไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // SETTINGS & PROFILE HANDLERS (Requirement 4)
  // ========================================================
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      const updated = await api.updateProfile(profile);
      setProfile(updated);
      showFeedback('success', 'บันทึกข้อมูลโปรไฟล์และการตั้งค่าเรียบร้อยแล้ว');
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showFeedback('info', 'กำลังบีบอัดรูปภาพให้เล็กที่สุดแต่คมชัด...');
      const compressedDataUrl = await compressUltraCompact(file, 400, 400, 0.85);
      setProfile({ ...profile, avatar: compressedDataUrl });
      showFeedback('success', 'บีบอัดรูปโปรไฟล์พร้อมบันทึกแล้ว');
    } catch (err) {
      showFeedback('error', 'บีบอัดรูปไม่สำเร็จ: ' + err.message);
    }
  };

  const handleRemoveAvatar = () => {
    if (window.confirm('คุณต้องการลบรูปโปรไฟล์ออกใช่หรือไม่?')) {
      setProfile({ ...profile, avatar: '' });
      showFeedback('info', 'ลบรูปโปรไฟล์แล้ว (อย่าลืมกดปุ่มบันทึก)');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showFeedback('info', 'กำลังบีบอัดภาพปกให้เล็กที่สุดแต่คมชัด...');
      const compressedDataUrl = await compressUltraCompact(file, 1600, 600, 0.82);
      setProfile({ ...profile, coverImage: compressedDataUrl });
      showFeedback('success', 'บีบอัดภาพปกพร้อมบันทึกแล้ว');
    } catch (err) {
      showFeedback('error', 'บีบอัดรูปไม่สำเร็จ: ' + err.message);
    }
  };

  const handleRemoveCover = () => {
    if (window.confirm('คุณต้องการลบภาพปกออกใช่หรือไม่?')) {
      setProfile({ ...profile, coverImage: '' });
      showFeedback('info', 'ลบภาพปกแล้ว (อย่าลืมกดปุ่มบันทึก)');
    }
  };

  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;
  const currentCalc = calculateRebarMetrics(
    rebarForm.standardLength,
    rebarForm.cutLength,
    rebarForm.quantity,
    rebarForm.rebarType
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-6xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden transition-colors">
        
        {/* Top Header */}
        <div className="p-4 sm:p-6 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>ระบบจัดการหลังบ้าน (Admin Back-Office)</span>
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300/40">
                  ยุทธการ คำกลอน
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการผลงาน หมวดหมู่ ถอดเหล็กเส้น ตรวจหน้างาน และข้อความจ้างงาน
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert Toast */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center justify-between ${
            feedback.type === 'error' ? 'bg-rose-500 text-white' :
            feedback.type === 'info' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'
          }`}>
            <span>{feedback.message}</span>
            <button onClick={() => setFeedback(null)} className="opacity-80 hover:opacity-100">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="px-4 sm:px-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/40 flex items-center gap-1 sm:gap-2 overflow-x-auto scrollbar-none py-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'projects'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Layers className="w-4 h-4" /> ผลงาน ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('categories')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'categories'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Tag className="w-4 h-4" /> หมวดหมู่ ({categories.length})
          </button>

          {/* Tab: Rebar Cut List & CAD/SketchUp Sync */}
          <button
            onClick={() => setActiveTab('rebar')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'rebar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-500" /> ถอดเหล็กเส้น & Sync CAD/SketchUp ({rebarItems.length})
          </button>

          <button
            onClick={() => setActiveTab('sitelogs')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'sitelogs'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <ClipboardList className="w-4 h-4" /> บันทึกตรวจงาน ({siteLogs.length})
          </button>

          <button
            onClick={() => setActiveTab('vault')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'vault'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Lock className="w-4 h-4" /> อีเมล & บัญชีส่วนตัว (PIN)
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors relative ${
              activeTab === 'messages'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> ข้อความจ้างงาน
            {unreadMessagesCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-rose-500 text-white text-[10px] flex items-center justify-center font-bold">
                {unreadMessagesCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'settings'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <SettingsIcon className="w-4 h-4" /> ตั้งค่าโปรไฟล์ & ระบบ
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'system'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
            }`}
          >
            <Database className="w-4 h-4" /> สถานะระบบ & MongoDB
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ========================================================
              TAB 1: PROJECTS
             ======================================================== */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">จัดการแฟ้มผลงาน</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">เพิ่ม ลบ แก้ไข ผลงาน และแนบไฟล์ CAD / SketchUp</p>
                </div>
                <button
                  onClick={() => {
                    setEditingProject({
                      title: '',
                      category: categories[0] || 'บ้านพักอาศัย',
                      year: new Date().getFullYear() + 543,
                      description: '',
                      location: '',
                      images: [],
                      software: ['AutoCAD', 'SketchUp'],
                      highlights: [],
                      fileLinks: []
                    });
                    setIsEditorOpen(true);
                  }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" /> เพิ่มผลงานใหม่
                </button>
              </div>

              {projects.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  ยังไม่มีผลงานในระบบ กดปุ่ม "เพิ่มผลงานใหม่" เพื่อเริ่มต้น
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((proj) => (
                    <div key={proj.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm flex flex-col group">
                      <div className="aspect-[16/10] bg-slate-100 dark:bg-slate-800 relative overflow-hidden">
                        {proj.images?.[0] ? (
                          <img src={proj.images[0]} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">ไม่มีรูปภาพ</div>
                        )}
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-slate-950/70 text-white text-[10px] backdrop-blur-sm">
                          {proj.category}
                        </span>
                      </div>
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1">{proj.title}</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">{proj.description}</p>
                        </div>
                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 dark:border-slate-800">
                          <span className="text-[11px] text-slate-400">{proj.year}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => {
                                setEditingProject({ ...proj });
                                setIsEditorOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                              title="แก้ไข"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteProject(proj.id)}
                              className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                              title="ลบ"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 2: CATEGORIES
             ======================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">จัดการหมวดหมู่ผลงาน</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">เพิ่มหรือลบหมวดหมู่ผลงานตามต้องการ</p>
              </div>

              {/* Add category form */}
              <form onSubmit={handleAddCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น อาคารพาณิชย์, ตกแต่งภายใน, งานรีโนเวท..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                >
                  <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
                </button>
              </form>

              {/* Category tags list */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  หมวดหมู่ทั้งหมดในระบบ ({categories.length} หมวด)
                </h4>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs border border-slate-200 dark:border-slate-700"
                    >
                      <Tag className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="font-medium">{cat}</span>
                      <button
                        type="button"
                        onClick={() => handleDeleteCategory(cat)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors ml-1"
                        title="ลบหมวดหมู่นี้"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ========================================================
              TAB 3: REBAR CUT LIST & REAL-TIME CAD / SKETCHUP SYNC
             ======================================================== */}
          {activeTab === 'rebar' && (
            <div className="space-y-6">
              
              {/* Header & Controls */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-emerald-500" />
                    <span>งานถอดเหล็กเส้น (Bar Bending Schedule - BBS) & Real-Time Sync</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คำนวณจำนวนเส้นเต็ม เศษเหลือ น้ำหนักเหล็ก และซิงก์ข้อมูลสดสองทิศทางกับ AutoCAD และ SketchUp
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadRebarData(true)}
                    className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    title="รีเฟรชข้อมูลเหล็กเส้น"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${rebarLoading ? 'animate-spin' : ''}`} /> ซิงก์ทันที
                  </button>
                  <button
                    onClick={() => {
                      setEditingRebarItem(null);
                      setRebarForm({ label: '', rebarType: 'DB20', standardLength: 12, cutLength: 6.0, quantity: 1, note: '' });
                      setIsRebarEditorOpen(true);
                    }}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                  >
                    <Plus className="w-4 h-4" /> เพิ่มรายการถอดเหล็ก
                  </button>
                </div>
              </div>

              {/* Summary Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-500">เหล็กมาตรฐาน (12m/10m)</div>
                  <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                    {rebarSummary?.totalStandardBars || 0} <span className="text-xs font-normal text-slate-500">เส้น</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-500">ความยาวที่ตัดใช้จริง</div>
                  <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                    {rebarSummary?.totalCutLength || 0} <span className="text-xs font-normal text-slate-500">ม.</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-500">เศษเหล็กเหลือรวม</div>
                  <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                    {rebarSummary?.totalScrapLength || 0} <span className="text-xs font-normal text-slate-500">ม.</span>
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                  <div className="text-[11px] font-semibold text-slate-500">เปอร์เซ็นต์เศษสูญเปล่า</div>
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {rebarSummary?.averageScrapPercent || 0}%
                  </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                  <div className="text-[11px] font-semibold text-slate-500">น้ำหนักเหล็กรวม</div>
                  <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                    {rebarSummary?.totalWeightKg ? (rebarSummary.totalWeightKg / 1000).toFixed(2) : 0} <span className="text-xs font-normal text-slate-500">ตัน</span>
                  </div>
                </div>
              </div>

              {/* Real-time CAD & SketchUp Integration Banner */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-5 rounded-2xl border border-slate-700/60 shadow-lg space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="w-3 h-3 rounded-full bg-emerald-400 animate-ping" />
                    <div>
                      <h4 className="font-bold text-sm flex items-center gap-2">
                        <span>AutoCAD & SketchUp Real-Time Sync</span>
                        <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                          Live 2-Way REST API
                        </span>
                      </h4>
                      <p className="text-xs text-slate-400 mt-0.5">
                        แก้ไขข้อมูลบนหน้าเว็บ หรือแก้บน CAD/SketchUp ข้อมูลอัปเดตตรงกันทันทีแบบ Real-Time
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={api.getAutoCADPluginUrl()}
                      download="rebar_sync.lsp"
                      className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> โหลดปลั๊กอิน AutoCAD (.lsp)
                    </a>
                    <a
                      href={api.getSketchUpPluginUrl()}
                      download="rebar_live_sync.rb"
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                    >
                      <Download className="w-3.5 h-3.5" /> โหลดปลั๊กอิน SketchUp (.rb)
                    </a>
                    <a
                      href={api.getRebarCsvUrl()}
                      download="rebar_bbs.csv"
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow transition-all"
                    >
                      <FileSpreadsheet className="w-3.5 h-3.5" /> Export Excel/CSV
                    </a>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-950/60 p-3.5 rounded-xl border border-slate-800">
                  <div>
                    <div className="font-bold text-rose-400 mb-1 flex items-center gap-1">
                      <span>📐 วิธีใช้ใน AutoCAD:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                      <li>เปิด AutoCAD พิมพ์คำสั่ง <code className="text-amber-300 bg-slate-800 px-1 rounded">APPLOAD</code> แล้วเลือกไฟล์ <code className="text-amber-300">rebar_sync.lsp</code></li>
                      <li>พิมพ์ <code className="text-amber-300 bg-slate-800 px-1 rounded">REBAR_SYNC</code> เพื่อดึงตารางเหล็กและเขียนลง Drawing อัตโนมัติ</li>
                      <li>พิมพ์ <code className="text-amber-300 bg-slate-800 px-1 rounded">REBAR_DRAW</code> เพื่อวาดเหล็กเส้นมาตรฐานตามขนาดและสเกล</li>
                    </ol>
                  </div>
                  <div>
                    <div className="font-bold text-blue-400 mb-1 flex items-center gap-1">
                      <span>🧊 วิธีใช้ใน SketchUp:</span>
                    </div>
                    <ol className="list-decimal list-inside space-y-0.5 text-slate-300 text-[11px]">
                      <li>เปิด SketchUp เมนู <code className="text-amber-300 bg-slate-800 px-1 rounded">Extensions &gt; Developer &gt; Ruby Console</code></li>
                      <li>พิมพ์ <code className="text-amber-300 bg-slate-800 px-1 rounded">load 'rebar_live_sync.rb'</code> แล้วกด Enter</li>
                      <li>หน้าต่าง Live Dialog ซิงก์ข้อมูลและปุ่มสร้างโมเดลเหล็ก 3D ทรงกระบอกจะเปิดขึ้นทันที</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Rebar Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                  <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                    ตารางถอดเหล็กเส้นและคำนวณเศษคงเหลือ ({rebarItems.length} รายการ)
                  </h4>
                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarAutoSync}
                        onChange={(e) => setRebarAutoSync(e.target.checked)}
                        className="rounded text-emerald-600 w-3.5 h-3.5"
                      />
                      <span>Auto-Sync ทุก 5 วิ</span>
                    </label>
                  </div>
                </div>

                {rebarItems.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-xs">
                    ยังไม่มีรายการถอดเหล็กเส้น กดปุ่ม "เพิ่มรายการถอดเหล็ก" ด้านบน
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                        <tr>
                          <th className="p-3">หมวด / ตำแหน่ง</th>
                          <th className="p-3">ชนิดเหล็ก</th>
                          <th className="p-3">สเปกความยาว</th>
                          <th className="p-3 text-right">ตัดใช้ (ม.)</th>
                          <th className="p-3 text-right">จำนวนชิ้น</th>
                          <th className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400">เส้นเต็มที่ใช้</th>
                          <th className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">เศษเหลือ/เส้น (ม.)</th>
                          <th className="p-3 text-right">เศษสูญ (%)</th>
                          <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                          <th className="p-3 text-center">ผังตัด (12m)</th>
                          <th className="p-3 text-center">จัดการ</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {rebarItems.map((item) => {
                          const cutPercent = Math.min(100, (item.cutLength / item.standardLength) * 100);
                          const offcutPercent = Math.max(0, 100 - (cutPercent * item.piecesPerBar));
                          return (
                            <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                              <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                {item.label}
                                {item.note && <span className="block text-[10px] font-normal text-slate-400">{item.note}</span>}
                              </td>
                              <td className="p-3">
                                <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                                  {item.rebarType}
                                </span>
                              </td>
                              <td className="p-3 text-slate-500">
                                เส้นมาตรฐาน {item.standardLength}m
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                                {item.cutLength} ม.
                              </td>
                              <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                                {item.quantity} ชิ้น
                              </td>
                              <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                {item.standardBarsNeeded} <span className="text-[10px] font-normal text-slate-400">เส้น</span>
                              </td>
                              <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">
                                {item.offcutPerBar} ม.
                              </td>
                              <td className="p-3 text-right">
                                <span className={`px-1.5 py-0.5 rounded text-[11px] font-medium ${
                                  item.scrapPercent > 15 ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                }`}>
                                  {item.scrapPercent}%
                                </span>
                              </td>
                              <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                {item.totalWeightKg} กก.
                              </td>
                              <td className="p-3 text-center min-w-[140px]">
                                {/* Visual 12m Cutting Diagram Bar */}
                                <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex" title={`ตัด ${item.piecesPerBar} ชิ้น ชิ้นละ ${item.cutLength}m, เศษเหลือ ${item.offcutPerBar}m`}>
                                  {Array.from({ length: item.piecesPerBar }).map((_, pIdx) => (
                                    <div
                                      key={pIdx}
                                      style={{ width: `${cutPercent}%` }}
                                      className="bg-emerald-500 border-r border-slate-950/20"
                                    />
                                  ))}
                                  {item.offcutPerBar > 0 && (
                                    <div
                                      style={{ width: `${offcutPercent}%` }}
                                      className="bg-amber-400 flex-1"
                                    />
                                  )}
                                </div>
                                <span className="text-[9px] text-slate-400 mt-0.5 block">
                                  ตัดได้ {item.piecesPerBar} ท่อน/เส้น
                                </span>
                              </td>
                              <td className="p-3 text-center">
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={() => {
                                      setEditingRebarItem(item);
                                      setRebarForm({
                                        label: item.label,
                                        rebarType: item.rebarType,
                                        standardLength: item.standardLength,
                                        cutLength: item.cutLength,
                                        quantity: item.quantity,
                                        note: item.note || ''
                                      });
                                      setIsRebarEditorOpen(true);
                                    }}
                                    className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                    title="แก้ไข"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteRebar(item.id)}
                                    className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                                    title="ลบ"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

            </div>
          )}

          {/* ========================================================
              TAB 4: SITE LOGS (บันทึกตรวจงาน & ติชม)
             ======================================================== */}
          {activeTab === 'sitelogs' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">ระบบบันทึกตรวจงานก่อสร้าง (Daily Site Logs)</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">ลงรูปภาพ วันที่ เวลา พิกัด GPS ขนาด และให้ผู้เข้าชมส่งข้อเสนอแนะ</p>
                </div>
                <button
                  onClick={() => {
                    setEditingSiteLog({
                      title: '',
                      category: 'งานโครงสร้าง',
                      workDate: new Date().toISOString().split('T')[0],
                      workTime: new Date().toTimeString().slice(0, 5),
                      locationName: 'ไซต์งานหลัก',
                      gpsLocation: '',
                      mapUrl: '',
                      dimensions: { width: '', length: '', thickness: '', unit: 'เมตร' },
                      workType: 'รอยร้าว',
                      description: '',
                      actionTaken: 'กำลังดำเนินการตรวจสอบและแก้ไข',
                      isPublic: true,
                      images: [],
                      feedbacks: []
                    });
                    setIsSiteLogEditorOpen(true);
                  }}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Plus className="w-4 h-4" /> เพิ่มบันทึกตรวจงาน
                </button>
              </div>

              {siteLogs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  ยังไม่มีบันทึกตรวจงาน กดปุ่ม "เพิ่มบันทึกตรวจงาน" ด้านบนเพื่อเริ่มต้น
                </div>
              ) : (
                <div className="space-y-4">
                  {siteLogs.map((log) => (
                    <div key={log.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-4">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{log.title}</span>
                            <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-semibold">
                              {log.category}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              log.isPublic ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' : 'bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                            }`}>
                              {log.isPublic ? 'เผยแพร่สู่สาธารณะ' : 'ซ่อนไว้หลังบ้าน'}
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500 mt-1">
                            <span>📅 {log.workDate} {log.workTime}</span>
                            <span>📍 {log.locationName}</span>
                            {log.gpsLocation && (
                              <a href={log.mapUrl || `https://www.google.com/maps?q=${log.gpsLocation}`} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:underline flex items-center gap-1">
                                <Navigation className="w-3 h-3" /> พิกัด {log.gpsLocation}
                              </a>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => {
                              setEditingSiteLog({ ...log });
                              setIsSiteLogEditorOpen(true);
                            }}
                            className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                            title="แก้ไข"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteSiteLog(log.id)}
                            className="p-1.5 rounded-lg text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {/* Dimensions & Description */}
                      <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 text-xs">
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">ประเภทงาน</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{log.workType}</span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 sm:col-span-2">
                          <span className="text-slate-400 block text-[10px]">ขนาดการวัด</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">
                            กว้าง {log.dimensions?.width || '-'} × ยาว {log.dimensions?.length || '-'} × หนา/ลึก {log.dimensions?.thickness || '-'} {log.dimensions?.unit || 'ม.'}
                          </span>
                        </div>
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                          <span className="text-slate-400 block text-[10px]">การแก้ไข</span>
                          <span className="font-semibold text-slate-800 dark:text-slate-200">{log.actionTaken}</span>
                        </div>
                      </div>

                      {/* Site Photos */}
                      {log.images && log.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {log.images.map((imgUrl, i) => (
                            <img
                              key={i}
                              src={imgUrl}
                              alt=""
                              onClick={() => setZoomPhotoUrl(imgUrl)}
                              className="w-24 h-24 rounded-xl object-cover border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90"
                            />
                          ))}
                        </div>
                      )}

                      {/* Public Feedbacks and Admin responses */}
                      {log.feedbacks && log.feedbacks.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-between">
                            <span>💬 ข้อเสนอแนะจากผู้ชม ({log.feedbacks.length} รายการ):</span>
                          </div>
                          {log.feedbacks.map((fb, fbIdx) => (
                            <div key={fbIdx} className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-900 dark:text-white">{fb.authorName || 'ผู้เข้าชม'}</span>
                                  <span className="text-[10px] text-slate-400">{fb.createdAt?.split('T')[0]}</span>
                                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                                    fb.decisionType === 'approved' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                    fb.decisionType === 'fixing' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' : 'bg-blue-100 text-blue-800'
                                  }`}>
                                    {fb.decisionType === 'approved' ? 'เรียบร้อย / ผ่าน' : fb.decisionType === 'fixing' ? 'ต้องแก้ไข' : 'ข้อเสนอแนะ'}
                                  </span>
                                </div>
                                <p className="text-slate-600 dark:text-slate-300 mt-1">{fb.comment}</p>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleRespondFeedback(log.id, fbIdx, fb.approved)}
                                  className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 transition-colors ${
                                    fb.approved
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                                  }`}
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                  <span>{fb.approved ? 'รับเรื่องแล้ว (แสดงบนเว็บ)' : 'กดรับเรื่อง'}</span>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 5: PRIVATE VAULT (PIN)
             ======================================================== */}
          {activeTab === 'vault' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-500" /> ห้องเก็บอีเมล & รหัสส่วนตัว (Private Vault)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  พื้นที่ส่วนตัวป้องกันด้วยรหัสผ่าน PIN แยกต่างหาก สำหรับจัดเก็บอีเมลหลายบัญชีพร้อมปุ่มคัดลอก
                </p>
              </div>

              {!vaultUnlocked ? (
                <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 dark:border-slate-800 text-center max-w-md mx-auto space-y-4 shadow-sm">
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 mx-auto flex items-center justify-center">
                    <KeyRound className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-slate-900 dark:text-white">กรุณาใส่รหัส PIN เพื่อเข้าห้องส่วนตัว</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      (รหัสตั้งต้นเริ่มต้นคือ: <code className="text-emerald-600 font-bold">1234</code>)
                    </p>
                  </div>
                  <form onSubmit={handleUnlockVault} className="space-y-3">
                    <input
                      type="password"
                      maxLength={12}
                      value={vaultPinInput}
                      onChange={(e) => setVaultPinInput(e.target.value)}
                      placeholder="ใส่รหัส PIN 4-6 หลัก"
                      className="w-full px-4 py-3 text-center text-lg tracking-widest rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                    {vaultPinError && (
                      <p className="text-xs text-rose-500 font-medium">{vaultPinError}</p>
                    )}
                    <button
                      type="submit"
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md transition-colors"
                    >
                      ปลดล็อกห้องส่วนตัว
                    </button>
                  </form>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Vault Header Controls */}
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>ปลดล็อกห้องเก็บข้อมูลส่วนตัวแล้ว</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsChangePinOpen(!isChangePinOpen)}
                        className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 font-medium"
                      >
                        เปลี่ยนรหัส PIN
                      </button>
                      <button
                        onClick={() => setVaultUnlocked(false)}
                        className="px-3 py-1.5 text-xs bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl hover:bg-rose-100 font-medium"
                      >
                        ล็อกห้อง
                      </button>
                    </div>
                  </div>

                  {/* Change PIN Box */}
                  {isChangePinOpen && (
                    <form onSubmit={handleChangePin} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">ตั้งรหัส PIN ใหม่</h4>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPinValue}
                          onChange={(e) => setNewPinValue(e.target.value)}
                          placeholder="ใส่รหัส PIN ใหม่ (อย่างน้อย 4 หลัก)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                        />
                        <button
                          type="submit"
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl"
                        >
                          บันทึก PIN ใหม่
                        </button>
                      </div>
                    </form>
                  )}

                  {/* Add Vault Item Form */}
                  <form onSubmit={handleAddVaultItem} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">เพิ่มรายการอีเมล / บัญชีใหม่</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newVaultItem.label}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, label: e.target.value })}
                        placeholder="ชื่อบัญชี (เช่น Gmail งานนอก)"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        required
                        value={newVaultItem.emailOrId}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, emailOrId: e.target.value })}
                        placeholder="อีเมล หรือ Username"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                      <input
                        type="text"
                        value={newVaultItem.note}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, note: e.target.value })}
                        placeholder="หมายเหตุ / วัตถุประสงค์"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> บันทึกรายการ
                    </button>
                  </form>

                  {/* Vault Items List */}
                  <div className="space-y-2">
                    {vaultItems.map((item) => (
                      <div
                        key={item.id}
                        className="bg-white dark:bg-slate-900 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2 shadow-sm"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 dark:text-white">{item.label || 'ไม่มีชื่อกำกับ'}</span>
                            {item.note && (
                              <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                {item.note}
                              </span>
                            )}
                          </div>
                          <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 truncate select-all">
                            {item.emailOrId}
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => copyToClipboard(item.emailOrId, item.id)}
                            className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors"
                          >
                            {copyFeedback === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                            <span>{copyFeedback === item.id ? 'คัดลอกแล้ว!' : 'คัดลอก'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteVaultItem(item.id)}
                            className="p-1.5 rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB 6: MESSAGES & HIRE INQUIRIES (Requirement 1)
             ======================================================== */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-emerald-500" />
                    <span>กล่องข้อความจ้างงาน & รูปภาพแนบ</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    ข้อความและรูปถ่ายหน้างานที่ลูกค้าส่งผ่านแบบฟอร์ม (กด "เปิดดูรายละเอียด" เพื่อดูข้อมูลครบถ้วน)
                  </p>
                </div>
                {unreadMessagesCount > 0 && (
                  <span className="px-3 py-1 rounded-full bg-rose-500 text-white text-xs font-bold animate-pulse">
                    {unreadMessagesCount} ข้อความใหม่
                  </span>
                )}
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  ยังไม่มีข้อความจ้างงานใหม่
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((msg) => (
                    <div key={msg.id} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-sm text-slate-900 dark:text-white">{msg.name}</span>
                            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                              msg.status === 'unread' 
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300' 
                                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                            }`}>
                              {msg.status === 'unread' ? '🔔 ข้อความใหม่ / ยังไม่ได้ติดต่อ' : 'ติดต่อแล้ว'}
                            </span>
                          </div>
                          <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-4">
                            {msg.phone && <span>เบอร์โทร: <b className="text-slate-800 dark:text-slate-200">{msg.phone}</b></span>}
                            {msg.lineId && <span>LINE: <b className="text-slate-800 dark:text-slate-200">{msg.lineId}</b></span>}
                            {msg.email && <span>อีเมล: <b>{msg.email}</b></span>}
                            <span>ประเภท: <b>{msg.projectType}</b></span>
                            {msg.budget && <span>งบประมาณ: <b>{msg.budget}</b></span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedMessage(msg)}
                            className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white flex items-center gap-1.5 shadow"
                          >
                            <Eye className="w-3.5 h-3.5" /> เปิดดูรายละเอียด
                          </button>
                          <button
                            onClick={() => handleToggleMessage(msg.id, msg.status)}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
                          >
                            {msg.status === 'unread' ? 'ทำเครื่องหมายว่าติดต่อแล้ว' : 'ตั้งเป็นยังไม่ติดต่อ'}
                          </button>
                          <button
                            onClick={() => handleDeleteMessage(msg.id)}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl"
                            title="ลบข้อความ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl line-clamp-2">
                        {msg.message || 'ไม่มีรายละเอียดเพิ่มเติม'}
                      </p>

                      {/* Attached Customer Photos thumbnails */}
                      {msg.images && msg.images.length > 0 && (
                        <div>
                          <div className="text-[11px] font-semibold text-slate-500 mb-1.5 flex items-center gap-1">
                            <ImageIcon className="w-3.5 h-3.5" /> รูปภาพที่ลูกค้าแนบมา ({msg.images.length} ภาพ):
                          </div>
                          <div className="flex gap-2 overflow-x-auto pb-1">
                            {msg.images.map((imgUrl, i) => (
                              <div
                                key={i}
                                onClick={() => setZoomPhotoUrl(imgUrl)}
                                className="block relative aspect-square w-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer hover:opacity-90 group"
                              >
                                <img src={imgUrl} alt="" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
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
              TAB 7: SETTINGS & FULL PROFILE EDITOR (Requirements 3 & 4)
             ======================================================== */}
          {activeTab === 'settings' && profile && (
            <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">การตั้งค่าโปรไฟล์ & ปรับแต่งหน้าเว็บ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  แก้ไขข้อมูลส่วนตัว เบอร์โทร LINE อีเมล รูปโปรไฟล์ ภาพปก และข้อความส่วนต่างๆ ของเว็บไซต์
                </p>
              </div>

              {/* Profile Details (ชื่อ, ตำแหน่ง, ประวัติ, ข้อมูลติดต่อ) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-500" /> ข้อมูลโปรไฟล์ส่วนตัว (Profile Information)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="ยุทธการ คำกลอน"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ตำแหน่ง / สโลแกน</label>
                    <input
                      type="text"
                      value={profile.title || ''}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="เขียนแบบบ้าน 3D SketchUp • ถอดแบบก่อสร้าง AutoCAD"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">คำอธิบายตัวเอง (Bio)</label>
                  <textarea
                    rows={3}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    placeholder="เขียนอธิบายความเชี่ยวชาญ ประสบการณ์ทำงาน..."
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">เบอร์โทรศัพท์หลัก</label>
                    <input
                      type="text"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="064-303-2859"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">เบอร์โทรศัพท์สำรอง</label>
                    <input
                      type="text"
                      value={profile.altPhone || ''}
                      onChange={(e) => setProfile({ ...profile, altPhone: e.target.value })}
                      placeholder="096-203-3005"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">อีเมล</label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      placeholder="yutthakan@example.com"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">LINE ID</label>
                    <input
                      type="text"
                      value={profile.lineId || ''}
                      onChange={(e) => setProfile({ ...profile, lineId: e.target.value })}
                      placeholder="ไอดีไลน์สำหรับติดต่อ"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              {/* Photos & Cover uploads with explicit delete (Requirement 4) */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  รูปภาพโปรไฟล์และภาพปก (Avatar & Cover Image)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Profile Avatar */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <label className="block text-xs font-semibold">รูปโปรไฟล์ (Avatar)</label>
                    <div className="flex items-center gap-3">
                      {profile.avatar ? (
                        <img src={profile.avatar} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow" />
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          ไม่มีรูป
                        </div>
                      )}
                      <div className="flex flex-col gap-1.5">
                        <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl cursor-pointer font-medium text-center shadow-sm">
                          ลงรูปใหม่ / เปลี่ยนรูป
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleAvatarUpload}
                          />
                        </label>
                        {profile.avatar && (
                          <button
                            type="button"
                            onClick={handleRemoveAvatar}
                            className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl text-xs hover:bg-rose-100 font-medium"
                          >
                            ลบรูปโปรไฟล์
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Cover Banner */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <label className="block text-xs font-semibold">ภาพปกหน้าแรก (Cover Banner)</label>
                    <div className="space-y-2">
                      {profile.coverImage ? (
                        <img src={profile.coverImage} alt="Cover" className="w-full h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700" />
                      ) : (
                        <div className="w-full h-16 rounded-xl bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 text-xs">
                          ไม่มีภาพปก
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <label className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl cursor-pointer font-medium text-center shadow-sm">
                          ลงภาพปกใหม่ / เปลี่ยน
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleCoverUpload}
                          />
                        </label>
                        {profile.coverImage && (
                          <button
                            type="button"
                            onClick={handleRemoveCover}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-xl text-xs hover:bg-rose-100 font-medium"
                          >
                            ลบภาพปก
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Work Status Badge Settings */}
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

              {/* Customizable Website Texts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  ปรับแต่งข้อความส่วนติดต่อและแบบฟอร์ม
                </h4>

                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    ข้อความป้ายหัวข้อส่วนติดต่อ
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
                    หัวข้อหลักส่วนติดต่อ
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
                    คำอธิบายแบบฟอร์มส่งรายละเอียดจ้างงาน
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

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-600/30 transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงทั้งหมด
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              TAB 8: SYSTEM STATUS & MONGODB
             ======================================================== */}
          {activeTab === 'system' && (
            <div className="max-w-3xl space-y-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">สถานะระบบ & ฐานข้อมูล MongoDB Atlas</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  ระบบออกแบบให้ทำงานออนไลน์ 24 ชั่วโมง รันต่อเนื่องได้ฟรี 10–20 ปี
                </p>
              </div>

              {systemStatus && (
                <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4 text-xs">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                    <span className="font-semibold text-slate-700 dark:text-slate-300">สถานะเซิร์ฟเวอร์</span>
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      {systemStatus.database?.status || 'Online'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Database Type</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.type}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Database Name</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">จำนวนผลงานในระบบ</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.counts?.projects || 0} รายการ</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">จำนวนข้อความจ้างงาน</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.counts?.messages || 0} ข้อความ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          MODAL: MESSAGE DETAIL MODAL (Requirement 1)
         ======================================================== */}
      {selectedMessage && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-500" /> รายละเอียดข้อความจ้างงาน
              </h3>
              <button onClick={() => setSelectedMessage(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{selectedMessage.name}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                    selectedMessage.status === 'unread' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {selectedMessage.status === 'unread' ? 'ยังไม่ได้ติดต่อ' : 'ติดต่อแล้ว'}
                  </span>
                </div>
                <div className="text-slate-500 text-[11px] space-y-1">
                  <div>ประเภทงาน: <b className="text-slate-800 dark:text-slate-200">{selectedMessage.projectType || 'ไม่ระบุ'}</b></div>
                  {selectedMessage.budget && <div>งบประมาณ: <b className="text-slate-800 dark:text-slate-200">{selectedMessage.budget}</b></div>}
                  {selectedMessage.targetDate && <div>กำหนดส่งงาน: <b>{selectedMessage.targetDate}</b></div>}
                </div>
              </div>

              {/* Quick Contact Buttons */}
              <div className="grid grid-cols-3 gap-2">
                {selectedMessage.phone ? (
                  <a
                    href={`tel:${selectedMessage.phone}`}
                    className="p-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex flex-col items-center justify-center gap-1 text-center shadow"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>โทรหาลูกค้า</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">{selectedMessage.phone}</span>
                  </a>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center text-center text-[10px]">
                    ไม่มีเบอร์โทร
                  </div>
                )}

                {selectedMessage.lineId ? (
                  <a
                    href={`https://line.me/R/ti/p/~${selectedMessage.lineId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#06C755] hover:opacity-90 text-white font-semibold flex flex-col items-center justify-center gap-1 text-center shadow"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>ทัก LINE</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">{selectedMessage.lineId}</span>
                  </a>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center text-center text-[10px]">
                    ไม่มี LINE
                  </div>
                )}

                {selectedMessage.email ? (
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex flex-col items-center justify-center gap-1 text-center shadow"
                  >
                    <Send className="w-4 h-4" />
                    <span>ส่งอีเมล</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">{selectedMessage.email}</span>
                  </a>
                ) : (
                  <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex flex-col items-center justify-center text-center text-[10px]">
                    ไม่มีอีเมล
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ข้อความรายละเอียดงาน</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message || 'ไม่มีข้อความเพิ่มเติม'}
                </div>
              </div>

              {/* Photos & Lightbox */}
              {selectedMessage.images && selectedMessage.images.length > 0 && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
                    รูปภาพที่ลูกค้าแนบมา ({selectedMessage.images.length} ภาพ) - กดเพื่อดูภาพใหญ่
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {selectedMessage.images.map((img, i) => (
                      <div
                        key={i}
                        onClick={() => setZoomPhotoUrl(img)}
                        className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group"
                      >
                        <img src={img} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                          <ZoomIn className="w-5 h-5 text-white" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/40">
              <button
                type="button"
                onClick={() => handleDeleteMessage(selectedMessage.id)}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl font-medium"
              >
                ลบข้อความนี้
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleToggleMessage(selectedMessage.id, selectedMessage.status)}
                  className="px-3 py-1.5 text-xs rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium"
                >
                  {selectedMessage.status === 'unread' ? 'ทำเครื่องหมายว่าติดต่อแล้ว' : 'ตั้งเป็นยังไม่ติดต่อ'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-1.5 text-xs bg-slate-900 text-white dark:bg-white dark:text-slate-900 rounded-xl font-semibold"
                >
                  ปิด
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PHOTO ZOOM LIGHTBOX
         ======================================================== */}
      {zoomPhotoUrl && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <button
              onClick={() => setZoomPhotoUrl(null)}
              className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300"
            >
              <X className="w-7 h-7" />
            </button>
            <img src={zoomPhotoUrl} alt="Zoom" className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl" />
            <div className="mt-3 flex items-center gap-3">
              <a
                href={zoomPhotoUrl}
                download="site_photo.jpg"
                className="px-4 py-2 bg-white/20 hover:bg-white/30 text-white text-xs rounded-xl backdrop-blur-sm flex items-center gap-1.5"
              >
                <Download className="w-4 h-4" /> ดาวน์โหลดรูปภาพต้นฉบับ
              </a>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: REBAR ADD/EDIT MODAL
         ======================================================== */}
      {isRebarEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-500" />
                {editingRebarItem ? 'แก้ไขรายการถอดเหล็กเส้น' : 'เพิ่มรายการถอดเหล็กเส้น (BBS)'}
              </h3>
              <button onClick={() => setIsRebarEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveRebar} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ชื่อชิ้นงาน / ตำแหน่ง (เช่น คาน B1, เสา C1)</label>
                <input
                  type="text"
                  required
                  value={rebarForm.label}
                  onChange={(e) => setRebarForm({ ...rebarForm, label: e.target.value })}
                  placeholder="เช่น เหล็กเสริมพิเศษ คาน B1 ชั้น 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ชนิดเหล็กเส้น (มอก.)</label>
                  <select
                    value={rebarForm.rebarType}
                    onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value="DB12">DB12 (0.888 kg/m)</option>
                    <option value="DB16">DB16 (1.580 kg/m)</option>
                    <option value="DB20">DB20 (2.470 kg/m)</option>
                    <option value="DB25">DB25 (3.850 kg/m)</option>
                    <option value="DB28">DB28 (4.830 kg/m)</option>
                    <option value="DB32">DB32 (6.310 kg/m)</option>
                    <option value="RB6">RB6 (0.222 kg/m)</option>
                    <option value="RB9">RB9 (0.499 kg/m)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ความยาวมาตรฐาน (เมตร)</label>
                  <select
                    value={rebarForm.standardLength}
                    onChange={(e) => setRebarForm({ ...rebarForm, standardLength: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  >
                    <option value={12}>12.00 เมตร (มาตรฐาน)</option>
                    <option value={10}>10.00 เมตร</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">ความยาวตัด (เมตร)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    max={rebarForm.standardLength}
                    required
                    value={rebarForm.cutLength}
                    onChange={(e) => setRebarForm({ ...rebarForm, cutLength: Number(e.target.value) })}
                    placeholder="เช่น 6.00"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">จำนวนชิ้นที่ต้องการ</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rebarForm.quantity}
                    onChange={(e) => setRebarForm({ ...rebarForm, quantity: Number(e.target.value) })}
                    placeholder="เช่น 10"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 rounded-xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                  📊 คำนวณผลลัพธ์อัตโนมัติ (Live Calculation):
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                  <div>ตัดได้ต่อเส้นเต็ม: <b>{currentCalc.piecesPerBar} ท่อน</b></div>
                  <div>ต้องใช้เส้นมาตรฐาน: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{currentCalc.standardBarsNeeded} เส้น</b></div>
                  <div>เศษเหลือต่อเส้น: <b className="text-amber-600">{currentCalc.offcutPerBar} ม.</b></div>
                  <div>เศษสูญเปล่า: <b>{currentCalc.scrapPercent}%</b></div>
                  <div className="col-span-2">น้ำหนักเหล็กใช้จริง: <b className="text-indigo-600 dark:text-indigo-400">{currentCalc.totalWeightKg} กก.</b></div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">หมายเหตุเพิ่มเติม</label>
                <input
                  type="text"
                  value={rebarForm.note}
                  onChange={(e) => setRebarForm({ ...rebarForm, note: e.target.value })}
                  placeholder="เช่น งอปลาย 90 องศา, เหล็กเสริมบน"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRebarEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-100"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-md"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: PROJECT EDITOR
         ======================================================== */}
      {isEditorOpen && editingProject && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingProject.id ? 'แก้ไขข้อมูลผลงาน' : 'เพิ่มผลงานใหม่'}
              </h3>
              <button onClick={() => setIsEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">ชื่อผลงาน</label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">หมวดหมู่</label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    {categories.map((c, i) => (
                      <option key={i} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">คำอธิบายผลงาน</label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Photo Upload with Ultra Compression */}
              <div>
                <label className="block text-xs font-semibold mb-1">รูปภาพผลงาน (ระบบบีบอัดให้เล็กที่สุดอัตโนมัติ)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    setCompressing(true);
                    try {
                      const compressed = await Promise.all(
                        files.map(f => compressUltraCompact(f, 1920, 1080, 0.82))
                      );
                      setEditingProject(prev => ({
                        ...prev,
                        images: [...(prev.images || []), ...compressed]
                      }));
                    } catch (err) {
                      alert('บีบอัดรูปไม่สำเร็จ: ' + err.message);
                    } finally {
                      setCompressing(false);
                    }
                  }}
                  className="text-xs"
                />
                {compressing && <p className="text-emerald-600 text-[11px] mt-1">กำลังบีบอัดรูปภาพ...</p>}

                {editingProject.images && editingProject.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {editingProject.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingProject(prev => ({
                            ...prev,
                            images: prev.images.filter((_, idx) => idx !== i)
                          }))}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 text-white rounded-xl font-semibold"
                >
                  บันทึกผลงาน
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: SITE LOG EDITOR
         ======================================================== */}
      {isSiteLogEditorOpen && editingSiteLog && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                {editingSiteLog.id ? 'แก้ไขบันทึกตรวจงาน' : 'เพิ่มบันทึกตรวจงานก่อสร้างใหม่'}
              </h3>
              <button onClick={() => setIsSiteLogEditorOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveSiteLog} className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">หัวข้อบันทึกงาน</label>
                  <input
                    type="text"
                    required
                    value={editingSiteLog.title}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, title: e.target.value })}
                    placeholder="เช่น ตรวจสอบรอยร้าวผนังห้องโถง"
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">หมวดหมู่งาน</label>
                  <select
                    value={editingSiteLog.category}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, category: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  >
                    <option value="งานโครงสร้าง">งานโครงสร้าง</option>
                    <option value="งานสถาปัตย์">งานสถาปัตย์</option>
                    <option value="งานระบบไฟฟ้า-ประปา">งานระบบไฟฟ้า-ประปา</option>
                    <option value="งานตรวจแก้งาน (Defect)">งานตรวจแก้งาน (Defect)</option>
                    <option value="การส่งมอบงาน">การส่งมอบงาน</option>
                  </select>
                </div>
              </div>

              {/* Date, Time, Location */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">วันที่ทำงาน</label>
                  <input
                    type="date"
                    value={editingSiteLog.workDate}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, workDate: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">เวลา</label>
                  <input
                    type="time"
                    value={editingSiteLog.workTime}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, workTime: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">ชื่อสถานที่</label>
                  <input
                    type="text"
                    value={editingSiteLog.locationName}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, locationName: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* GPS Coordinates & Map Link */}
              <div>
                <label className="block text-xs font-semibold mb-1">พิกัด GPS แผนที่</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={editingSiteLog.gpsLocation}
                    onChange={(e) => setEditingSiteLog({ ...editingSiteLog, gpsLocation: e.target.value })}
                    placeholder="เช่น 13.7563, 100.5018"
                    className="flex-1 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                  <button
                    type="button"
                    onClick={handleGetCurrentGPS}
                    className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center gap-1"
                  >
                    <Navigation className="w-3.5 h-3.5" />
                    <span>{gpsLoading ? 'กำลังดึง...' : 'ปักหมุดตำแหน่งฉัน'}</span>
                  </button>
                </div>
              </div>

              {/* Dimensions */}
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">กว้าง (ซม./ม.)</label>
                  <input
                    type="text"
                    value={editingSiteLog.dimensions?.width || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      dimensions: { ...(editingSiteLog.dimensions || {}), width: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">ยาว (ซม./ม.)</label>
                  <input
                    type="text"
                    value={editingSiteLog.dimensions?.length || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      dimensions: { ...(editingSiteLog.dimensions || {}), length: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">หนา / ลึก</label>
                  <input
                    type="text"
                    value={editingSiteLog.dimensions?.thickness || ''}
                    onChange={(e) => setEditingSiteLog({
                      ...editingSiteLog,
                      dimensions: { ...(editingSiteLog.dimensions || {}), thickness: e.target.value }
                    })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Description & Action Taken */}
              <div>
                <label className="block text-xs font-semibold mb-1">รายละเอียดการตรวจพบ</label>
                <textarea
                  rows={2}
                  value={editingSiteLog.description}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">แผนการแก้ไข / ดำเนินการ</label>
                <input
                  type="text"
                  value={editingSiteLog.actionTaken}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, actionTaken: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Photos upload */}
              <div>
                <label className="block text-xs font-semibold mb-1">รูปถ่ายหน้างาน (บีบอัดอัตโนมัติ)</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={async (e) => {
                    const files = Array.from(e.target.files || []);
                    if (!files.length) return;
                    try {
                      const compressed = await Promise.all(
                        files.map(f => compressUltraCompact(f, 1600, 1200, 0.8))
                      );
                      setEditingSiteLog(prev => ({
                        ...prev,
                        images: [...(prev.images || []), ...compressed]
                      }));
                    } catch (err) {
                      alert('บีบอัดรูปไม่สำเร็จ: ' + err.message);
                    }
                  }}
                  className="text-xs"
                />

                {editingSiteLog.images && editingSiteLog.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {editingSiteLog.images.map((img, i) => (
                      <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 group">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => setEditingSiteLog(prev => ({
                            ...prev,
                            images: prev.images.filter((_, idx) => idx !== i)
                          }))}
                          className="absolute top-1 right-1 p-1 bg-black/60 rounded-full text-white opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Public Toggle (Requirement 12) */}
              <label className="flex items-center gap-2 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editingSiteLog.isPublic}
                  onChange={(e) => setEditingSiteLog({ ...editingSiteLog, isPublic: e.target.checked })}
                  className="rounded text-emerald-600 w-4 h-4"
                />
                <span className="font-semibold text-xs text-slate-800 dark:text-slate-200">
                  เปิดให้ผู้ชมเว็บไซต์เห็นและเขียนข้อเสนอแนะ / กดติชมได้
                </span>
              </label>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsSiteLogEditorOpen(false)}
                  className="px-4 py-2 border rounded-xl"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white rounded-xl font-semibold"
                >
                  บันทึกรายการ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
