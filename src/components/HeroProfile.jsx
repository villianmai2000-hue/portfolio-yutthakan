import React from 'react';
import { Phone, MessageCircle, Download, CheckCircle2, Award, Briefcase, FileCode2, Sparkles, ArrowRight, ClipboardList } from 'lucide-react';

export default function HeroProfile({ profile, onScrollToContact, onScrollToPortfolio, onScrollToSiteLogs }) {
  if (!profile) return null;

  const isNameHidden = profile.hidePublicName;
  const isPhoneHidden = profile.hidePublicPhone;
  const displayName = isNameHidden ? 'สถาปัตยกรรม & ออกแบบโมเดล 3D' : profile.name;
  const workStatus = profile.workStatus || { status: 'available', text: 'พร้อมรับงานทันที', showPublic: true };

  return (
    <section id="home" className="relative pt-6 pb-14 sm:pb-20 overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 inset-x-0 h-80 bg-gradient-to-b from-emerald-50/70 dark:from-emerald-950/20 to-transparent pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Cover Banner with Architectural Design */}
        <div className="relative w-full h-48 sm:h-72 md:h-80 rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl border border-slate-200 dark:border-slate-800 bg-slate-900 group">
          <img
            src={profile.cover || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80'}
            alt="Cover"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/40 to-transparent" />
          
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
              
              {/* Profile Avatar */}
              <div className="relative mx-auto md:mx-0 -mt-14 sm:-mt-20 flex-shrink-0">
                <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl sm:rounded-3xl overflow-hidden border-4 border-white dark:border-slate-900 shadow-2xl bg-slate-100 dark:bg-slate-800 ring-4 ring-emerald-500/20">
                  <img
                    src={profile.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Identity & Bio */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 dark:text-white">
                      {displayName}
                    </h1>
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

                    {/* Direct Phone button only if not hidden */}
                    {!isPhoneHidden && profile.phone && (
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

                {/* Bio text */}
                <p className="mt-4 text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-4xl">
                  {profile.bio}
                </p>

                {/* Skill Badges & Architectural Formats */}
                <div className="mt-5 flex flex-wrap items-center justify-center md:justify-start gap-2">
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> AutoCAD (.dwg)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> 3D SketchUp (.skp)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> เรนเดอร์ Enscape & V-Ray
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <FileCode2 className="w-3.5 h-3.5 text-emerald-500" /> SketchUp Ruby Plugins (.rbz)
                  </span>
                  <span className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium border border-slate-200 dark:border-slate-700 flex items-center gap-1.5">
                    <Award className="w-3.5 h-3.5 text-emerald-500" /> เอกสารแบบแปลน PDF & BOQ
                  </span>
                </div>

              </div>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
