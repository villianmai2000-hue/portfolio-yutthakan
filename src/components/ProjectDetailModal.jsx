import React, { useState, useEffect } from 'react';
import { 
  X, ChevronLeft, ChevronRight, Calendar, MapPin, Maximize2, 
  Download, FileText, Box, Layers, ArrowUpRight, MessageSquare 
} from 'lucide-react';

export default function ProjectDetailModal({ project, onClose, onHireForProject }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState(null);

  useEffect(() => {
    setActiveImageIndex(0);
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (fullscreenImage) setFullscreenImage(null);
        else onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [project, fullscreenImage, onClose]);

  if (!project) return null;

  const images = project.images && project.images.length > 0 
    ? project.images 
    : [project.coverImage || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'];

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      
      {/* Modal Card */}
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div>
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300">
              {project.category}
            </span>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white mt-1">
              {project.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body Scrollable */}
        <div className="overflow-y-auto p-4 sm:p-6 space-y-6">
          
          {/* Main Image Slider / Carousel */}
          <div className="relative aspect-[16/9] sm:aspect-[21/10] bg-slate-950 rounded-2xl overflow-hidden shadow-inner group">
            <img
              src={images[activeImageIndex]}
              alt={`${project.title} - รูปที่ ${activeImageIndex + 1}`}
              className="w-full h-full object-contain cursor-zoom-in"
              onClick={() => setFullscreenImage(images[activeImageIndex])}
            />

            {/* Navigation Arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
                  aria-label="รูปก่อนหน้า"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-full bg-slate-900/70 hover:bg-slate-900 text-white backdrop-blur-sm transition-all opacity-80 hover:opacity-100"
                  aria-label="รูปถัดไป"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}

            {/* Counter and Fullscreen Trigger */}
            <div className="absolute bottom-3 right-3 flex items-center gap-2">
              <span className="px-3 py-1 rounded-lg bg-slate-900/80 backdrop-blur-sm text-xs text-white border border-white/10 font-medium">
                {activeImageIndex + 1} / {images.length}
              </span>
              <button
                onClick={() => setFullscreenImage(images[activeImageIndex])}
                className="p-1.5 rounded-lg bg-slate-900/80 backdrop-blur-sm text-white hover:bg-emerald-600 transition-colors"
                title="ดูเต็มจอ"
              >
                <Maximize2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Thumbnail Strip (เลื่อนดูรูปได้) */}
          {images.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-14 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${
                    activeImageIndex === idx
                      ? 'border-emerald-500 scale-105 shadow-md'
                      : 'border-transparent opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="thumb" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {/* Specifications & Description */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Description (2 cols) */}
            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                รายละเอียดผลงาน
              </h3>
              <p className="text-sm sm:text-base text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
                {project.description}
              </p>

              {/* Tags */}
              {project.tags && project.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 pt-2">
                  {project.tags.map((tag, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-medium"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Project Specs Box (1 col) */}
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-slate-800 space-y-3">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                ข้อมูลโปรเจกต์
              </h4>
              
              <div className="space-y-2.5 text-xs sm:text-sm">
                {project.year && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">ปีที่สร้าง</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{project.year}</span>
                  </div>
                )}
                {project.location && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">สถานที่</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{project.location}</span>
                  </div>
                )}
                {project.area && (
                  <div className="flex justify-between py-1 border-b border-slate-200/60 dark:border-slate-700/60">
                    <span className="text-slate-500">ขนาดพื้นที่ / เวอร์ชัน</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{project.area}</span>
                  </div>
                )}
              </div>

              {/* Hire button */}
              <button
                onClick={() => {
                  onClose();
                  onHireForProject(project.title);
                }}
                className="w-full mt-4 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold transition-colors flex items-center justify-center gap-2 shadow-sm"
              >
                <MessageSquare className="w-4 h-4" />
                <span>สนใจจ้างงานสไตล์นี้</span>
              </button>
            </div>

          </div>

          {/* Attached Files Section (CAD, SketchUp, PDF, Plugins) */}
          {project.files && project.files.length > 0 && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-2">
                <FileDown className="w-4 h-4 text-emerald-500" /> ไฟล์งานแนบสำหรับดาวน์โหลด
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {project.files.map((file, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 hover:border-emerald-500/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-300 font-mono text-xs font-bold flex-shrink-0">
                        .{file.type || 'file'}
                      </div>
                      <div className="truncate">
                        <div className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white truncate">
                          {file.name}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {file.size || 'ไฟล์แนบ'}
                        </div>
                      </div>
                    </div>

                    <a
                      href={file.url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-white dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-emerald-600 hover:text-white transition-colors flex-shrink-0 shadow-sm"
                      title="ดาวน์โหลด / เปิดดู"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

      </div>

      {/* Fullscreen Zoom Lightbox */}
      {fullscreenImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4 cursor-zoom-out animate-fadeIn"
          onClick={() => setFullscreenImage(null)}
        >
          <button
            onClick={() => setFullscreenImage(null)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={fullscreenImage}
            alt="Fullscreen view"
            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
          />
        </div>
      )}

    </div>
  );
}
