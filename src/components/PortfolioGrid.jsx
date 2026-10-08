import React, { useState, useMemo } from 'react';
import { Search, Filter, Layers, ExternalLink, Calendar, MapPin, FileDown, Eye, Image as ImageIcon } from 'lucide-react';

export default function PortfolioGrid({ projects = [], categories = [], onSelectProject }) {
  const [selectedCategory, setSelectedCategory] = useState('ทั้งหมด');
  const [searchQuery, setSearchQuery] = useState('');

  // รวมหมวดหมู่ที่มีทั้งหมด เริ่มต้นด้วย 'ทั้งหมด'
  const allCategories = useMemo(() => {
    const list = categories && categories.length > 0 ? categories : [
      'งานเขียนแบบ AutoCAD (.dwg)',
      '3D SketchUp & Render (.skp)',
      'ปลั๊กอิน & สคริปต์ SketchUp (.rbz)',
      'งานก่อสร้างและควบคุมงานจริง',
      'เอกสารแบบแปลน & สเปก (PDF)'
    ];
    return ['ทั้งหมด', ...list];
  }, [categories]);

  const filteredProjects = useMemo(() => {
    return projects.filter(p => {
      const matchCategory = selectedCategory === 'ทั้งหมด' || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch = !q || 
        p.title?.toLowerCase().includes(q) || 
        p.description?.toLowerCase().includes(q) ||
        p.tags?.some(t => t.toLowerCase().includes(q));
      return matchCategory && matchSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <section id="portfolio" className="py-12 sm:py-16 bg-slate-50/50 dark:bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold uppercase tracking-wider">
              <Layers className="w-4 h-4" /> แฟ้มสะสมผลงาน
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white mt-1">
              ผลงานสถาปัตยกรรม & โมเดล 3D ล่าสุด
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              รวบรวมแบบก่อสร้าง AutoCAD, ไฟล์โมเดล SketchUp, งานเรนเดอร์ และปลั๊กอินสคริปต์
            </p>
          </div>

          {/* Search Input */}
          <div className="relative w-full md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="ค้นหาชื่อผลงาน, แท็ก..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
            />
          </div>
        </div>

        {/* Dynamic Category Pills (ข้อกำหนด 4) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 scrollbar-none">
          {allCategories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-medium whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:border-emerald-500/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Layers className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <h3 className="text-base font-medium text-slate-700 dark:text-slate-300">ยังไม่พบผลงานในหมวดหมู่นี้</h3>
            <p className="text-xs text-slate-400 mt-1">ลองเปลี่ยนคำค้นหาหรือเลือกหมวดหมู่อื่นดูครับ</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            {filteredProjects.map((project) => (
              <div
                key={project.id}
                onClick={() => onSelectProject(project)}
                className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-800 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col"
              >
                {/* Image Container */}
                <div className="relative aspect-[16/10] overflow-hidden bg-slate-100 dark:bg-slate-800">
                  <img
                    src={project.coverImage || project.images?.[0] || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80'}
                    alt={project.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                    <span className="text-xs text-white font-medium flex items-center gap-1.5 bg-emerald-600/90 px-3 py-1 rounded-lg backdrop-blur-sm">
                      <Eye className="w-3.5 h-3.5" /> คลิกเพื่อดูรูปขยายและไฟล์แนบ
                    </span>
                  </div>

                  {/* Category Badge */}
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-lg bg-slate-950/75 backdrop-blur-md text-white text-xs font-medium border border-white/10">
                      {project.category}
                    </span>
                  </div>

                  {/* Multi-image indicator */}
                  {project.images && project.images.length > 1 && (
                    <div className="absolute top-3 right-3 bg-slate-950/75 backdrop-blur-md px-2 py-0.5 rounded-lg border border-white/10 text-[11px] text-white flex items-center gap-1">
                      <ImageIcon className="w-3 h-3 text-emerald-400" />
                      {project.images.length} รูป
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    {/* Meta info */}
                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-2">
                      {project.year && (
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-emerald-500" /> {project.year}
                        </span>
                      )}
                      {project.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3.5 h-3.5 text-emerald-500" /> {project.location}
                        </span>
                      )}
                    </div>

                    <h3 className="font-bold text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {project.title}
                    </h3>

                    <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed">
                      {project.description}
                    </p>
                  </div>

                  {/* Attached Files & Tags Footer */}
                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between gap-2">
                    {/* File Indicators */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {project.files && project.files.length > 0 ? (
                        project.files.map((file, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 font-mono text-[10px] font-bold border border-emerald-200/50 dark:border-emerald-800/50"
                          >
                            .{file.type || 'file'}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-400">รูปภาพผลงาน</span>
                      )}
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectProject(project);
                      }}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform"
                    >
                      เปิดดู <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>

                </div>

              </div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
