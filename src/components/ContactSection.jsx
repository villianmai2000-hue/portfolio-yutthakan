import React, { useState } from 'react';
import { 
  Phone, MessageCircle, Mail, MapPin, Send, CheckCircle2, 
  Sparkles, Clock, AlertCircle, Briefcase, FileCode2, Image as ImageIcon,
  X, UploadCloud
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressUltraCompact, formatBytes } from '../utils/compressor.js';

export default function ContactSection({ profile, prefilledProject }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    lineId: '',
    projectType: prefilledProject ? `จ้างงานแบบ: ${prefilledProject}` : 'ออกแบบบ้าน / อาคารพักอาศัย',
    budget: '',
    message: '',
    images: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);

  const isNameHidden = profile?.hidePublicName;
  const isPhoneHidden = profile?.hidePublicPhone;
  const isEmailHidden = profile?.hidePublicEmail;

  // จัดการอัปโหลดและบีบอัดภาพหน้างานของลูกค้าให้มีขนาดจิ๋วที่สุด (WebP ~30-50KB)
  const handleCustomerImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    try {
      setUploadingImage(true);
      const newImages = [...formData.images];

      for (const file of files) {
        if (newImages.length >= 5) {
          alert('แนบภาพได้สูงสุด 5 ภาพครับ');
          break;
        }
        // บีบอัดด้วยระดับ Ultra Compact
        const res = await compressUltraCompact(file);
        
        // ลองส่งเข้าเก็บในเซิร์ฟเวอร์
        let finalUrl = res.dataUrl;
        try {
          const uploadRes = await api.uploadFilePublic({
            name: 'inquiry_' + file.name,
            type: 'webp',
            mimeType: 'image/webp',
            dataBase64: res.dataUrl,
            size: res.compressedSizeBytes
          });
          if (uploadRes?.url) {
            finalUrl = uploadRes.url;
          }
        } catch (uploadErr) {
          console.warn('Fallback base64 directly:', uploadErr);
        }

        newImages.push({
          url: finalUrl,
          name: file.name,
          sizeText: res.compressedSizeText
        });
      }

      setFormData(prev => ({ ...prev, images: newImages }));
    } catch (err) {
      alert('ไม่สามารถอัปโหลดภาพได้: ' + err.message);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData(prev => ({
      ...prev,
      images: prev.images.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    if (!formData.name || (!formData.phone && !formData.lineId)) {
      setErrorMessage('กรุณาระบุชื่อ และเบอร์โทรหรือ LINE ID เพื่อให้สามารถติดต่อกลับได้ครับ');
      return;
    }

    try {
      setIsSubmitting(true);
      // เตรียม payload ให้พร้อมเก็บเข้า MongoDB Atlas
      const payload = {
        name: formData.name,
        phone: formData.phone,
        lineId: formData.lineId,
        projectType: formData.projectType,
        budget: formData.budget,
        message: formData.message,
        images: formData.images.map(img => img.url)
      };

      await api.submitContact(payload);
      setSubmitSuccess(true);
      setFormData({
        name: '',
        phone: '',
        lineId: '',
        projectType: 'ออกแบบบ้าน / อาคารพักอาศัย',
        budget: '',
        message: '',
        images: []
      });
    } catch (err) {
      setErrorMessage(err.message || 'เกิดข้อผิดพลาดในการส่งข้อมูล กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="contact" className="py-16 sm:py-24 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading - ปรับแต่งได้ตามข้อกำหนด 5 & 9 */}
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" /> {profile?.contactBadgeText || 'ติดต่อจ้างงาน & ปรึกษาแบบ'}
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
            {profile?.contactTitle || 'ยินดีให้คำปรึกษาและร่วมงานกับคุณ'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-slate-600 dark:text-slate-400">
            {profile?.contactSubtitle || 'พร้อมรับงานออกแบบสถาปัตยกรรม เขียนแบบ AutoCAD โมเดล 3D SketchUp และเขียนโปรแกรมปลั๊กอิน'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Info: Contact Cards (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            
            {/* LINE Official Card */}
            <a
              href={profile?.socials?.line || "https://line.me/ti/p/~0643032859"}
              target="_blank"
              rel="noopener noreferrer"
              className="p-5 rounded-2xl bg-gradient-to-br from-[#06C755]/10 to-emerald-500/10 border border-[#06C755]/30 hover:border-[#06C755] transition-all group flex items-center gap-4 shadow-sm"
            >
              <div className="w-12 h-12 rounded-xl bg-[#06C755] flex items-center justify-center text-white text-xl shadow-md group-hover:scale-105 transition-transform flex-shrink-0">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div className="truncate">
                <div className="text-xs text-slate-500 dark:text-slate-400">LINE ทักแชทด่วน (เร็วที่สุด)</div>
                <div className="text-base sm:text-lg font-bold text-slate-900 dark:text-white group-hover:text-[#06C755] transition-colors">
                  {profile?.lineId ? `LINE ID: ${profile.lineId}` : 'LINE Chat'}
                </div>
                <div className="text-xs text-[#06C755] font-medium">กดที่นี่เพื่อเพิ่มเพื่อนคุยงานได้ทันที</div>
              </div>
            </a>

            {/* Direct Phone Card (แสดงเฉพาะเมื่อไม่ได้ซ่อนเบอร์) */}
            {!isPhoneHidden && (profile?.phone || profile?.altPhone) && (
              <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-md flex-shrink-0">
                  <Phone className="w-6 h-6" />
                </div>
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">ติดต่อสายตรง (โทรศัพท์)</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                    {profile?.phone && (
                      <a href={`tel:${profile.phone}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {profile.phone}
                      </a>
                    )}
                    {profile?.altPhone && (
                      <a href={`tel:${profile.altPhone}`} className="text-sm sm:text-base font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors">
                        {profile.altPhone}
                      </a>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">รับสายทุกวัน เวลา 08:00 - 20:00 น.</div>
                </div>
              </div>
            )}

            {/* Email & Location Card */}
            <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 space-y-3">
              {!isEmailHidden && profile?.email && (
                <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                  <Mail className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span className="truncate">{profile.email}</span>
                </div>
              )}
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                <MapPin className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>รับงานทั่วประเทศไทย (บริการออนไลน์ & นัดดูหน้างาน)</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700 dark:text-slate-300 text-xs sm:text-sm">
                <Clock className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                <span>ส่งมอบไฟล์งานตรงเวลา พร้อมไฟล์ต้นฉบับ CAD/SKP</span>
              </div>
            </div>

          </div>

          {/* Right Form: Hire Me Form (7 cols) */}
          <div className="lg:col-span-7 bg-slate-50 dark:bg-slate-800/50 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-emerald-500" /> แบบฟอร์มส่งรายละเอียดจ้างงาน
            </h3>
            {/* คำอธิบายแบบฟอร์ม - ปรับแต่งได้ตามข้อกำหนด 6 */}
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-6 leading-relaxed">
              {profile?.hireFormDesc || 'กรอกข้อมูลเบื้องต้นด้านล่าง จะติดต่อกลับเพื่อให้คำปรึกษาและประเมินราคาโดยเร็วที่สุดครับ สามารถลงรูปได้และบีบอัดให้เล็กที่สุด'}
            </p>

            {submitSuccess ? (
              <div className="p-6 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 rounded-2xl text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 dark:text-emerald-400 mx-auto" />
                <h4 className="text-base font-bold text-slate-900 dark:text-white">ส่งข้อมูลเรียบร้อยแล้ว!</h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300">
                  ขอบคุณที่สนใจผลงานครับ ได้รับข้อมูลเรียบร้อยแล้วและจะติดต่อกลับโดยเร็วที่สุดครับ
                </p>
                <button
                  onClick={() => setSubmitSuccess(false)}
                  className="mt-3 px-4 py-2 bg-emerald-600 text-white text-xs font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                >
                  ส่งข้อความใหม่
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {errorMessage && (
                  <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 rounded-xl text-rose-600 dark:text-rose-300 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ชื่อผู้ติดต่อ / หน่วยงาน <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="เช่น คุณสมชาย หรือ บริษัท ช่างไทย จำกัด"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      เบอร์โทรศัพท์ <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      placeholder="เช่น 081-234-5678"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      LINE ID (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      value={formData.lineId}
                      onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                      placeholder="เช่น somchai_line"
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      ประเภทงานที่ต้องการ
                    </label>
                    <select
                      value={formData.projectType}
                      onChange={(e) => setFormData({ ...formData, projectType: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                    >
                      <option value="ออกแบบบ้าน / อาคารพักอาศัย">ออกแบบบ้าน / อาคารพักอาศัย</option>
                      <option value="งานเขียนแบบก่อสร้าง AutoCAD (.dwg)">งานเขียนแบบก่อสร้าง AutoCAD (.dwg)</option>
                      <option value="โมเดล 3D SketchUp (.skp) & เรนเดอร์">โมเดล 3D SketchUp (.skp) & เรนเดอร์</option>
                      <option value="เขียนโปรแกรมปลั๊กอิน / สคริปต์ SketchUp">เขียนโปรแกรมปลั๊กอิน / สคริปต์ SketchUp</option>
                      <option value="ถอดแบบประเมินราคา BOQ">ถอดแบบประเมินราคา BOQ</option>
                      <option value="งานอื่นๆ">งานอื่นๆ</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    งบประมาณโดยประมาณ (ถ้ามี)
                  </label>
                  <input
                    type="text"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    placeholder="เช่น 15,000 - 30,000 บาท หรือ ตามตกลง"
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    รายละเอียดงาน / ข้อกำหนดที่ต้องการ
                  </label>
                  <textarea
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="ระบุขนาดพื้นที่, จำนวนชั้น, สไตล์ที่ชอบ, หรือระยะเวลาที่ต้องการส่งมอบงาน..."
                    className="w-full px-3.5 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500/50 outline-none resize-none"
                  />
                </div>

                {/* ส่วนแนบรูปภาพหน้างาน / แบบอ้างอิง พร้อมระบบย่ออัตโนมัติ (ข้อกำหนด 6) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> แนบรูปภาพหน้างาน / ภาพอ้างอิง (บีบอัดอัตโนมัติ)
                    </span>
                    <span className="text-[11px] text-slate-400 font-normal">สูงสุด 5 ภาพ (WebP จิ๋ว คมชัด)</span>
                  </label>

                  {/* Thumbnail Previews */}
                  {formData.images.length > 0 && (
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2.5 mb-2.5">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 group bg-slate-100 dark:bg-slate-800">
                          <img src={img.url} alt={`แนบ ${idx + 1}`} className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => handleRemoveImage(idx)}
                            className="absolute top-1 right-1 p-1 rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-700 transition-colors"
                            title="ลบรูปนี้"
                          >
                            <X className="w-3 h-3" />
                          </button>
                          <span className="absolute bottom-1 inset-x-1 text-[9px] bg-slate-900/80 text-white text-center rounded px-1 truncate">
                            {img.sizeText || 'WebP'}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Upload button */}
                  {formData.images.length < 5 && (
                    <label className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-900 cursor-pointer transition-colors text-xs text-slate-600 dark:text-slate-300 ${uploadingImage ? 'opacity-50 pointer-events-none' : ''}`}>
                      <UploadCloud className="w-4 h-4 text-emerald-500" />
                      <span>{uploadingImage ? 'กำลังย่อขนาดภาพ...' : 'คลิกเพื่อเลือกภาพแนบหน้างาน (ย่ออัตโนมัติ)'}</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleCustomerImageUpload}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || uploadingImage}
                  className="w-full py-3 px-6 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold shadow-md shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>กำลังส่งข้อมูล...</span>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      <span>ส่งรายละเอียดจ้างงาน</span>
                    </>
                  )}
                </button>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
}
