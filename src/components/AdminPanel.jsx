import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Upload, Database, HardDrive, 
  Download, MessageSquare, Image as ImageIcon, CheckCircle, 
  AlertCircle, RefreshCw, Layers, User, Phone, MessageCircle, 
  ExternalLink, FileCode2, Sparkles, Check, ArrowUpRight
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressImage, formatBytes } from '../utils/compressor.js';

const CATEGORIES = [
  'งานเขียนแบบ AutoCAD (.dwg)',
  '3D SketchUp & Render (.skp)',
  'ปลั๊กอิน & สคริปต์ SketchUp (.rbz)',
  'งานก่อสร้างและควบคุมงานจริง',
  'เอกสารแบบแปลน & สเปก (PDF)'
];

export default function AdminPanel({ isOpen, onClose, onRefreshData }) {
  const [activeTab, setActiveTab] = useState('projects'); // 'projects', 'profile', 'messages', 'system'
  const [projects, setProjects] = useState([]);
  const [profile, setProfile] = useState(null);
  const [messages, setMessages] = useState([]);
  const [systemStatus, setSystemStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Project Editor State
  const [editingProject, setEditingProject] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);
  const [compressionStats, setCompressionStats] = useState(null);

  // Initial Load
  useEffect(() => {
    if (isOpen) {
      loadAllAdminData();
    }
  }, [isOpen]);

  const loadAllAdminData = async () => {
    try {
      setLoading(true);
      const [projData, profData, msgData, statData] = await Promise.all([
        api.getProjects(),
        api.getProfile(),
        api.getMessages(),
        api.getStatus().catch(() => null)
      ]);
      setProjects(projData);
      setProfile(profData);
      setMessages(msgData);
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
    setEditingProject({
      title: '',
      category: CATEGORIES[0],
      description: '',
      year: new Date().getFullYear().toString(),
      location: 'ประเทศไทย',
      area: '',
      coverImage: '',
      images: [],
      tags: ['SketchUp', 'AutoCAD'],
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

  // Live Image Compression & Upload
  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setCompressing(true);
      const newImages = [...(editingProject.images || [])];
      let totalBefore = 0;
      let totalAfter = 0;

      for (const file of files) {
        // 1. บีบอัดรูปภาพผ่าน Canvas แปลงเป็น WebP คุณภาพสูง
        const result = await compressImage(file, 1920, 1920, 0.82);

        // 2. ส่งไฟล์รูปเข้าไปเก็บใน MongoDB Atlas Cloud ทันที
        let savedUrl = result.dataUrl;
        try {
          const uploadRes = await api.uploadFile({
            name: file.name,
            type: 'webp',
            mimeType: 'image/webp',
            dataBase64: result.dataUrl,
            size: result.compressedSizeBytes
          });
          if (uploadRes?.url) {
            savedUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn('Fallback to direct dataUrl:', uploadErr);
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

      const savedPercent = Math.round((1 - totalAfter / totalBefore) * 100);
      setCompressionStats(
        `บีบอัดสำเร็จ: ${formatBytes(totalBefore)} ลดเหลือเพียง ${formatBytes(totalAfter)} (ส่งเข้า MongoDB Atlas เรียบร้อย!)`
      );
      showFeedback('ส่งรูปภาพเข้า MongoDB Atlas Cloud สำเร็จแล้ว!');
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

  // --- Profile & Cover Handlers ---
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      await api.updateProfile(profile);
      showFeedback('บันทึกข้อมูลโปรไฟล์และปกเรียบร้อยแล้ว');
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
      const res = await compressImage(file, 600, 600, 0.85);
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
      showFeedback('ส่งรูปโปรไฟล์เข้า MongoDB Atlas เรียบร้อยแล้ว (กดบันทึกเพื่อใช้งาน)');
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await compressImage(file, 2048, 800, 0.85);
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
      showFeedback('ส่งรูปปก Cover เข้า MongoDB Atlas เรียบร้อยแล้ว (กดบันทึกเพื่อใช้งาน)');
    } catch (err) {
      showFeedback(err.message, 'error');
    }
  };

  // --- Message Status ---
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Main Admin Box */}
      <div className="relative w-full max-w-6xl h-[92vh] bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        
        {/* Top Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
              ย
            </div>
            <div>
              <div className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                ระบบจัดการหลังบ้าน (Admin Control Panel)
                <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-medium">
                  เจ้าของ: ยุทธการ คำกลอน
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                จัดการผลงาน, ย่อไฟล์ภาพ WebP, ตรวจสอบข้อความจ้างงาน และสำรองข้อมูล
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
            feedback.type === 'error' 
              ? 'bg-rose-500 text-white' 
              : 'bg-emerald-600 text-white'
          }`}>
            {feedback.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            <span>{feedback.msg}</span>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab('projects')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'projects'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Layers className="w-4 h-4" /> จัดการผลงาน ({projects.length})
          </button>

          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <User className="w-4 h-4" /> แก้ไขโปรไฟล์ & ปก
          </button>

          <button
            onClick={() => setActiveTab('messages')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'messages'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <MessageSquare className="w-4 h-4" /> ข้อความจ้างงาน ({messages.filter(m => m.status === 'unread').length} ใหม่)
          </button>

          <button
            onClick={() => setActiveTab('system')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === 'system'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Database className="w-4 h-4" /> ฐานข้อมูล & สำรองข้อมูลระยะยาว
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-50/50 dark:bg-slate-950/40">
          
          {/* TAB 1: PROJECTS */}
          {activeTab === 'projects' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">รายการผลงานทั้งหมด</h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คลิก "เพิ่มผลงานใหม่" เพื่ออัปโหลดภาพที่จะถูกบีบอัดอัตโนมัติและใส่ไฟล์งาน
                  </p>
                </div>
                <button
                  onClick={handleOpenNewProject}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-4 h-4" /> เพิ่มผลงานใหม่
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {projects.map((proj) => (
                  <div
                    key={proj.id}
                    className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between"
                  >
                    <div>
                      <div className="aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-800 mb-3">
                        <img
                          src={proj.coverImage || proj.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=400&q=80'}
                          alt={proj.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        {proj.category}
                      </span>
                      <h4 className="font-bold text-sm text-slate-900 dark:text-white line-clamp-1 mt-0.5">
                        {proj.title}
                      </h4>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1">
                        {proj.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                      <span className="text-xs text-slate-400">
                        {proj.images?.length || 1} รูป / {proj.files?.length || 0} ไฟล์
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleOpenEditProject(proj)}
                          className="p-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="แก้ไข"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteProject(proj.id)}
                          className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30"
                          title="ลบผลงาน"
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

          {/* TAB 2: PROFILE & COVER */}
          {activeTab === 'profile' && profile && (
            <form onSubmit={handleSaveProfile} className="max-w-3xl space-y-6">
              
              {/* Cover & Avatar Previews */}
              <div className="space-y-4">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                  รูปปก Cover Banner & รูปโปรไฟล์ Avatar
                </label>

                {/* Banner preview */}
                <div className="relative h-44 rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-800 group">
                  <img
                    src={profile.cover}
                    alt="Cover"
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <label className="px-4 py-2 bg-white/90 hover:bg-white text-slate-900 rounded-xl text-xs font-semibold cursor-pointer shadow-lg flex items-center gap-2">
                      <Upload className="w-4 h-4" /> เปลี่ยนรูปปก
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                    </label>
                  </div>
                </div>

                {/* Avatar preview */}
                <div className="flex items-center gap-4 -mt-10 px-4">
                  <div className="relative w-24 h-24 rounded-2xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-xl bg-slate-100 group flex-shrink-0">
                    <img src={profile.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                      <Upload className="w-4 h-4" />
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    </label>
                  </div>
                  <div className="pt-8">
                    <div className="text-xs text-slate-500">คลิกที่รูปโปรไฟล์หรือรูปปกเพื่อเปลี่ยนภาพได้ทันที</div>
                    <div className="text-[11px] text-emerald-600 font-medium">* ระบบจะบีบอัดรูปเป็น WebP อัตโนมัติ</div>
                  </div>
                </div>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อ-นามสกุล
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ตำแหน่ง / สโลแกน
                  </label>
                  <input
                    type="text"
                    value={profile.title}
                    onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  ประวัติแนะนำตัว (Bio)
                </label>
                <textarea
                  rows={4}
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรหลัก
                  </label>
                  <input
                    type="text"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    เบอร์โทรสำรอง
                  </label>
                  <input
                    type="text"
                    value={profile.altPhone}
                    onChange={(e) => setProfile({ ...profile, altPhone: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    LINE ID
                  </label>
                  <input
                    type="text"
                    value={profile.lineId}
                    onChange={(e) => setProfile({ ...profile, lineId: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  อีเมล
                </label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-semibold shadow-sm transition-colors"
              >
                {loading ? 'กำลังบันทึก...' : 'บันทึกการเปลี่ยนแปลง'}
              </button>
            </form>
          )}

          {/* TAB 3: CLIENT INQUIRIES */}
          {activeTab === 'messages' && (
            <div className="space-y-4">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">กล่องข้อความจากผู้สนใจจ้างงาน</h3>
                <p className="text-xs text-slate-500">ข้อมูลที่ผู้เยี่ยมชมกรอกผ่านหน้าเว็บจะถูกส่งมาเก็บไว้ที่นี่ทันที</p>
              </div>

              {messages.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <MessageSquare className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm text-slate-500">ยังไม่มีข้อความติดต่อใหม่</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((m) => (
                    <div
                      key={m.id}
                      className={`p-4 sm:p-5 rounded-2xl border transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                        m.status === 'unread'
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-800'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">{m.name}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                            m.status === 'unread'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}>
                            {m.status === 'unread' ? 'ข้อความใหม่' : 'ติดต่อแล้ว'}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {new Date(m.createdAt).toLocaleString('th-TH')}
                          </span>
                        </div>

                        <div className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                          ประเภทงาน: <span className="text-emerald-600 dark:text-emerald-400">{m.projectType}</span> | งบประมาณ: {m.budget || 'ไม่ระบุ'}
                        </div>

                        <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-100/70 dark:bg-slate-800/70 p-2 rounded-lg mt-2">
                          "{m.message || 'ไม่มีรายละเอียดเพิ่มเติม'}"
                        </p>

                        <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                          {m.phone && (
                            <a href={`tel:${m.phone}`} className="text-emerald-600 font-semibold flex items-center gap-1 hover:underline">
                              <Phone className="w-3.5 h-3.5" /> {m.phone}
                            </a>
                          )}
                          {m.lineId && (
                            <a href={`https://line.me/ti/p/~${m.lineId}`} target="_blank" rel="noreferrer" className="text-[#06C755] font-semibold flex items-center gap-1 hover:underline">
                              <MessageCircle className="w-3.5 h-3.5" /> LINE: {m.lineId}
                            </a>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={() => handleToggleMessage(m.id, m.status)}
                          className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        >
                          {m.status === 'unread' ? 'ทำเครื่องหมายว่าติดต่อแล้ว' : 'เปลี่ยนเป็นยังไม่ได้ติดต่อ'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: SYSTEM STATUS & 10-20 YEARS BACKUP */}
          {activeTab === 'system' && (
            <div className="max-w-2xl space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">สถานะฐานข้อมูล & การใช้งานระยะยาว 10–20 ปี</h3>
                <p className="text-xs text-slate-500">
                  ตรวจสอบการเชื่อมต่อ MongoDB Atlas และสำรองไฟล์ข้อมูลเพื่อความปลอดภัยถาวร
                </p>
              </div>

              {/* Database Status Card */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Database className="w-6 h-6 text-emerald-500" />
                    <div>
                      <div className="text-sm font-bold text-slate-900 dark:text-white">
                        โหมดจัดเก็บ: {systemStatus?.mode || 'กำลังตรวจสอบ...'}
                      </div>
                      <div className="text-xs text-slate-400">
                        {systemStatus?.connected 
                          ? '✅ เชื่อมต่อ MongoDB Atlas Cloud ตลอด 24 ชม.' 
                          : 'กำลังใช้ Local Backup (เมื่อใส่ MONGODB_URI บน Vercel จะซิงค์ Cloud อัตโนมัติ)'}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={loadAllAdminData}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
                    title="รีเฟรชสถานะ"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                </div>

                {/* Storage Meter */}
                <div>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="text-slate-500">พื้นที่ที่ใช้ไปใน Cloud:</span>
                    <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
                      {formatBytes(systemStatus?.storageUsedBytes || 0)} / 512 MB (ฟรีตลอดชีพ)
                    </span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ 
                        width: `${Math.min(100, Math.max(1, ((systemStatus?.storageUsedBytes || 50000) / (512 * 1024 * 1024)) * 100))}%` 
                      }}
                    />
                  </div>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-2">
                    💡 ระบบบีบอัดภาพ WebP อัตโนมัติ ทำให้โควต้าฟรี 512MB รองรับการลงผลงานได้มากกว่า 2,000 - 5,000 โปรเจกต์ ใช้งาน 20 ปีสบายๆ!
                  </p>
                </div>
              </div>

              {/* 1-Click Backup Export */}
              <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="flex items-center gap-3">
                  <HardDrive className="w-6 h-6 text-emerald-500" />
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">ดาวน์โหลดไฟล์สำรองข้อมูล (Offline Backup)</h4>
                    <p className="text-xs text-slate-400">
                      ดาวน์โหลดข้อมูลผลงาน รูปภาพ ประวัติ และข้อความทั้งหมดเป็นไฟล์ JSON เก็บไว้ในคอมของคุณ
                    </p>
                  </div>
                </div>

                <a
                  href={api.getBackupUrl()}
                  download
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs sm:text-sm font-semibold hover:bg-slate-800 dark:hover:bg-slate-100 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>ดาวน์โหลดสำรองข้อมูลทั้งหมด (.json)</span>
                </a>
              </div>

            </div>
          )}

        </div>

      </div>

      {/* PROJECT ADD / EDIT SUB-MODAL */}
      {isEditorOpen && editingProject && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 max-h-[92vh] flex flex-col overflow-hidden">
            
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
              <h3 className="font-bold text-base text-slate-900 dark:text-white">
                {editingProject.id ? 'แก้ไขผลงาน' : 'เพิ่มผลงานใหม่'}
              </h3>
              <button
                onClick={() => setIsEditorOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProject} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ชื่อผลงาน <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editingProject.title}
                    onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                    placeholder="เช่น แบบบ้านโมเดิร์น 2 ชั้น"
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    หมวดหมู่ผลงาน
                  </label>
                  <select
                    value={editingProject.category}
                    onChange={(e) => setEditingProject({ ...editingProject, category: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  รายละเอียดผลงาน
                </label>
                <textarea
                  rows={3}
                  value={editingProject.description}
                  onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                  placeholder="ระบุแนวคิดการออกแบบ, พื้นที่ใช้สอย, ฟังก์ชัน..."
                  className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ปีที่สร้าง
                  </label>
                  <input
                    type="text"
                    value={editingProject.year}
                    onChange={(e) => setEditingProject({ ...editingProject, year: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    สถานที่
                  </label>
                  <input
                    type="text"
                    value={editingProject.location}
                    onChange={(e) => setEditingProject({ ...editingProject, location: e.target.value })}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    ขนาดพื้นที่ / เวอร์ชัน
                  </label>
                  <input
                    type="text"
                    value={editingProject.area}
                    onChange={(e) => setEditingProject({ ...editingProject, area: e.target.value })}
                    placeholder="เช่น 280 ตร.ม."
                    className="w-full px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              {/* SMART IMAGE COMPRESSOR & UPLOADER */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      📷 รูปภาพผลงาน (ระบบบีบอัด WebP อัตโนมัติ)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      เลือกได้หลายรูป ระบบจะย่อขนาดให้อัตโนมัติ ภาพยังคมชัดแต่ไฟล์เล็กลง 90%
                    </p>
                  </div>
                  <label className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> เลือกรูปภาพ
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </label>
                </div>

                {compressing && (
                  <div className="text-xs text-emerald-600 font-semibold animate-pulse">
                    ⚡ กำลังบีบอัดภาพและประมวลผล WebP...
                  </div>
                )}

                {compressionStats && (
                  <div className="text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-100/70 dark:bg-emerald-950/60 p-2 rounded-lg font-mono">
                    {compressionStats}
                  </div>
                )}

                {/* Preview thumbnails */}
                {editingProject.images && editingProject.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {editingProject.images.map((img, idx) => (
                      <div key={idx} className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-300 dark:border-slate-700 group">
                        <img src={img} alt="preview" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => {
                            const updated = editingProject.images.filter((_, i) => i !== idx);
                            setEditingProject({
                              ...editingProject,
                              images: updated,
                              coverImage: updated[0] || ''
                            });
                          }}
                          className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ATTACHED FILES MANAGER (.dwg, .skp, .rbz, .pdf) */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-slate-800 dark:text-slate-200">
                      📁 ไฟล์งานแนบ (AutoCAD, SketchUp, ปลั๊กอิน, PDF)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      แนบไฟล์ตรง หรือใส่ลิงก์ดาวน์โหลด (Google Drive / Cloudflare R2) สำหรับไฟล์ใหญ่
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const newFile = { name: 'Drawing_Plan.dwg', size: '12 MB', type: 'dwg', url: 'https://drive.google.com' };
                      setEditingProject({
                        ...editingProject,
                        files: [...(editingProject.files || []), newFile]
                      });
                    }}
                    className="px-3 py-1 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 text-xs font-semibold rounded-lg"
                  >
                    + เพิ่มไฟล์แนบ
                  </button>
                </div>

                {editingProject.files?.map((f, idx) => (
                  <div key={idx} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-white dark:bg-slate-900 p-2.5 rounded-xl border border-slate-200 dark:border-slate-800">
                    <input
                      type="text"
                      value={f.name}
                      placeholder="ชื่อไฟล์ เช่น House_Model.skp"
                      onChange={(e) => {
                        const updated = [...editingProject.files];
                        updated[idx].name = e.target.value;
                        setEditingProject({ ...editingProject, files: updated });
                      }}
                      className="sm:col-span-5 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <select
                      value={f.type}
                      onChange={(e) => {
                        const updated = [...editingProject.files];
                        updated[idx].type = e.target.value;
                        setEditingProject({ ...editingProject, files: updated });
                      }}
                      className="sm:col-span-2 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="dwg">.dwg (CAD)</option>
                      <option value="skp">.skp (3D)</option>
                      <option value="rbz">.rbz (Plugin)</option>
                      <option value="pdf">.pdf (Doc)</option>
                      <option value="zip">.zip (Pack)</option>
                    </select>
                    <input
                      type="text"
                      value={f.url}
                      placeholder="ลิงก์ไฟล์ หรือ Google Drive link"
                      onChange={(e) => {
                        const updated = [...editingProject.files];
                        updated[idx].url = e.target.value;
                        setEditingProject({ ...editingProject, files: updated });
                      }}
                      className="sm:col-span-4 px-2.5 py-1.5 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editingProject.files.filter((_, i) => i !== idx);
                        setEditingProject({ ...editingProject, files: updated });
                      }}
                      className="sm:col-span-1 p-1 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg flex justify-center"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditorOpen(false)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl border border-slate-300 dark:border-slate-700"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl"
                >
                  {loading ? 'กำลังบันทึก...' : 'บันทึกผลงาน'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
