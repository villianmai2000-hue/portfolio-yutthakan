import React, { useState } from 'react';
import { 
  Phone, MessageCircle, Download, CheckCircle2, Award, Briefcase, 
  FileCode2, Sparkles, ArrowRight, ClipboardList, Edit3, Camera, 
  Image as ImageIcon, X, Check, Save, UserCheck, Shield
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressUltraCompact } from '../utils/compressor.js';

export default function HeroProfile({ 
  profile, 
  currentUser,
  onProfileUpdated,
  onScrollToContact, 
  onScrollToPortfolio, 
  onScrollToSiteLogs 
}) {
  const [isQuickEditOpen, setIsQuickEditOpen] = useState(false);
  const [editForm, setEditForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  if (!profile) return null;

  const displayName = profile.name || 'ยุทธการ คำกลอน';
  const workStatus = profile.workStatus || { status: 'available', text: 'พร้อมรับงานทันที', showPublic: true };

  const handleOpenEdit = () => {
    setEditForm({
      name: profile.name || '',
      title: profile.title || '',
      bio: profile.bio || '',
      phone: profile.phone || '',
      altPhone: profile.altPhone || '',
      email: profile.email || '',
      lineId: profile.lineId || '',
      avatar: profile.avatar || '',
      cover: profile.cover || profile.coverImage || '',
      contactBadgeText: profile.contactBadgeText || 'ติดต่อจ้างงาน & ปรึกษาแบบ'
    });
    setIsQuickEditOpen(true);
    setSaveSuccess(false);
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = await api.updateProfile({
        ...profile,
        ...editForm
      });
      if (onProfileUpdated) onProfileUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => {
        setIsQuickEditOpen(false);
        setSaveSuccess(false);
      }, 1000);
    } catch (err) {
      alert('บันทึกข้อมูลไม่สำเร็จ: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressUltraCompact(file, 400, 400, 0.85);
      setEditForm(prev => ({ ...prev, avatar: dataUrl }));
    } catch (err) {
      alert('บีบอัดรูปไม่สำเร็จ: ' + err.message);
    }
  };

  const handleCoverFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressUltraCompact(file, 1600, 600, 0.82);
      setEditForm(prev => ({ ...prev, cover: dataUrl }));
    } catch (err) {
      alert('บีบอัดภาพปกไม่สำเร็จ: ' + err.message);
    }
  };

  const avatarUrl = typeof profile.avatar === 'string' ? profile.avatar : (profile.avatar?.dataUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80');
  const coverUrl = typeof profile.cover === 'string' ? profile.cover : (typeof profile.coverImage === 'string' ? profile.coverImage : 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80');

  return (
    <section id="home" className="relative pt-6 pb-14 sm:pb-20 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-emerald-50/70 dark:from-emerald-950/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Cover Banner */}
        <div className="relative w-full h-48 sm:h-72 md:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />
          
          {/* Owner Fast Edit Button for Cover */}
          {currentUser && (
            <button
              onClick={handleOpenEdit}
              className="absolute top-4 left-4 sm:top-6 sm:left-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-900/80 hover:bg-slate-900 text-white text-xs backdrop-blur-md border border-slate-700 shadow transition-all"
            >
              <Camera className="w-3.5 h-3.5 text-emerald-400" />
              <span>เปลี่ยนภาพปก (เจ้าของ)</span>
            </button>
          )}

          {/* Work Status Badge on Cover */}
          {workStatus.showPublic !== false && (
            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-slate-700/80 text-xs text-white shadow-lg">
              <span className={`w-2.5 h-2.5 rounded-full ${
                workStatus.status === 'busy' ? 'bg-amber-400' :
                workStatus.status === 'in_progress' ? 'bg-blue-400' : 'bg-emerald-400 animate-ping'
              }`} />
              <span className={`w-2.5 h-2.5 rounded-full -ml-4 ${
                workStatus.status === 'busy' ? 'bg-amber-500' :
                workStatus.status === 'in_progress' ? 'bg-blue-500' : 'bg-emerald-500'
              }`} />
              <span className="font-medium">{workStatus.text || 'พร้อมรับงานออกแบบ & เขียนแบบ'}</span>
            </div>
          )}
        </div>

        {/* Profile Info Overlay Container */}
        <div className="relative -mt-16 sm:-mt-24 px-4 sm:px-8">
          <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200/80 dark:border-slate-800 transition-colors">
            
            <div className="flex flex-col md:flex-row gap-6 md:gap-8 items-start">
              
              {/* Profile Avatar with Owner quick button */}
              <div className="relative mx-auto md:mx-0 -mt-14 sm:-mt-20 flex-shrink-0 group">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-100 dark:bg-slate-800 ring-4 ring-emerald-500/20">
                  <img
                    src={avatarUrl}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {currentUser && (
                  <button
                    onClick={handleOpenEdit}
                    className="absolute bottom-1 right-1 p-2 rounded-xl bg-emerald-600 text-white shadow-lg hover:bg-emerald-500 transition-transform hover:scale-110"
                    title="เปลี่ยนรูปโปรไฟล์ (เจ้าของ)"
                  >
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Identity & Bio */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-center md:justify-start gap-2">
                      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                        {displayName}
                      </h1>
                      {currentUser && (
                        <button
                          onClick={handleOpenEdit}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-300 text-xs font-semibold flex items-center gap-1 border border-emerald-300 dark:border-emerald-800 hover:bg-emerald-100 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>แก้ไขโปรไฟล์หน้าเว็บ</span>
                        </button>
                      )}
                    </div>
                    <p className="text-sm sm:text-base text-emerald-600 dark:text-emerald-400 font-medium mt-1 flex items-center justify-center md:justify-start gap-1.5">
                      <Sparkles className="w-4 h-4" />
                      {profile.title}
                    </p>
                  </div>

                  {/* Primary CTA Buttons */}
                  <div className="flex flex-wrap items-center justify-center md:justify-end gap-2.5">
                    <button
                      onClick={onScrollToContact}
                      className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/25 transition-all flex items-center gap-2 group"
                    >
                      <Briefcase className="w-4 h-4" />
                      <span>{profile.contactBadgeText || 'จ้างงาน / ส่งรายละเอียด'}</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>

                    {/* LINE Button */}
                    <a
                      href={profile.socials?.line || "https://line.me/ti/p/~0643032859"}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2.5 rounded-xl bg-[#06C755] hover:bg-[#05b34c] text-white text-sm font-semibold shadow-sm transition-all flex items-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>แชท LINE คุยงาน</span>
                    </a>

                    {/* Direct Phone button */}
                    {profile.phone && (
                      <a
                        href={`tel:${profile.phone}`}
                        className="p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 transition-colors"
                        title={`โทร ${profile.phone}`}
                      >
                        <Phone className="w-4 h-4 text-emerald-500" />
                      </a>
                    )}
                  </div>
                </div>

                {/* Professional Bio */}
                <p className="mt-4 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                  {profile.bio}
                </p>

                {/* Contact Quick Pills */}
                <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2.5 text-xs text-slate-600 dark:text-slate-400">
                  {profile.phone && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>เบอร์ติดต่อ: <b className="text-slate-900 dark:text-white">{profile.phone}</b></span>
                    </div>
                  )}
                  {profile.altPhone && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <Phone className="w-3.5 h-3.5 text-emerald-500" />
                      <span>เบอร์สำรอง: <b className="text-slate-900 dark:text-white">{profile.altPhone}</b></span>
                    </div>
                  )}
                  {profile.lineId && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                      <MessageCircle className="w-3.5 h-3.5 text-[#06C755]" />
                      <span>LINE: <b className="text-slate-900 dark:text-white">{profile.lineId}</b></span>
                    </div>
                  )}
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>

      {/* ========================================================
          FRONT-END DIRECT PROFILE EDIT MODAL (เจ้าของแก้ไขได้ทันที)
         ======================================================== */}
      {isQuickEditOpen && editForm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-3">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-500" />
                <span>แก้ไขโปรไฟล์หน้าเว็บ (เฉพาะเจ้าของ)</span>
              </h3>
              <button onClick={() => setIsQuickEditOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* Avatar & Cover Pickers */}
              <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-200 dark:border-slate-700">
                <div>
                  <label className="block text-[11px] font-semibold mb-1">รูปโปรไฟล์ (Avatar)</label>
                  <div className="flex items-center gap-2">
                    <img src={editForm.avatar || avatarUrl} alt="" className="w-12 h-12 rounded-xl object-cover border" />
                    <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] cursor-pointer">
                      เปลี่ยนรูป
                      <input type="file" accept="image/*" className="hidden" onChange={handleAvatarFile} />
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-semibold mb-1">ภาพปก (Cover)</label>
                  <div className="flex items-center gap-2">
                    <img src={editForm.cover || coverUrl} alt="" className="w-16 h-10 rounded-lg object-cover border" />
                    <label className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] cursor-pointer">
                      เปลี่ยนภาพปก
                      <input type="file" accept="image/*" className="hidden" onChange={handleCoverFile} />
                    </label>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">ชื่อ-นามสกุล</label>
                  <input
                    type="text"
                    required
                    value={editForm.name}
                    onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">ตำแหน่ง / สโลแกน</label>
                  <input
                    type="text"
                    value={editForm.title}
                    onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold mb-1">ประวัติ Bio แนะนำตัว</label>
                <textarea
                  rows={3}
                  value={editForm.bio}
                  onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์หลัก</label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์สำรอง</label>
                  <input
                    type="text"
                    value={editForm.altPhone}
                    onChange={(e) => setEditForm({ ...editForm, altPhone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold mb-1">LINE ID</label>
                  <input
                    type="text"
                    value={editForm.lineId}
                    onChange={(e) => setEditForm({ ...editForm, lineId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold mb-1">อีเมล</label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-3 flex items-center justify-between border-t border-slate-100 dark:border-slate-800">
                {saveSuccess ? (
                  <span className="text-emerald-600 font-bold flex items-center gap-1">
                    <Check className="w-4 h-4" /> บันทึกโปรไฟล์เรียบร้อยแล้ว!
                  </span>
                ) : <span />}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsQuickEditOpen(false)}
                    className="px-4 py-2 border rounded-xl"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-semibold flex items-center gap-1.5 shadow"
                  >
                    <Save className="w-4 h-4" />
                    <span>{saving ? 'กำลังบันทึก...' : 'บันทึกทันที'}</span>
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

    </section>
  );
}
