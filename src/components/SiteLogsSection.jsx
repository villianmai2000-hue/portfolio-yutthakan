import React, { useState } from 'react';
import { 
  ClipboardCheck, MapPin, Calendar, Clock, Ruler, AlertTriangle, 
  CheckCircle, MessageSquare, Send, ChevronDown, ChevronUp, ExternalLink,
  Sparkles, CheckCheck
} from 'lucide-react';
import { api } from '../utils/api.js';

export default function SiteLogsSection({ siteLogs = [], onRefreshLogs }) {
  const [expandedLogId, setExpandedLogId] = useState(null);
  const [feedbackForms, setFeedbackForms] = useState({});
  const [submittingId, setSubmittingId] = useState(null);
  const [successMsg, setSuccessMsg] = useState({});

  if (!siteLogs || siteLogs.length === 0) {
    return null; // ซ่อนถ้าไม่มีบันทึกที่เปิดสาธารณะ
  }

  const handleFeedbackChange = (logId, field, val) => {
    setFeedbackForms(prev => ({
      ...prev,
      [logId]: {
        ...(prev[logId] || { clientName: '', directionOrVote: 'ให้ผ่าน', comment: '' }),
        [field]: val
      }
    }));
  };

  const handleSubmitFeedback = async (e, logId) => {
    e.preventDefault();
    const data = feedbackForms[logId] || { clientName: 'ผู้ตรวจงาน', directionOrVote: 'ให้ผ่าน', comment: '' };
    if (!data.comment && !data.directionOrVote) {
      alert('กรุณาเลือกความเห็นหรือระบุข้อเสนอแนะ');
      return;
    }

    try {
      setSubmittingId(logId);
      await api.submitSiteFeedback(logId, data);
      setSuccessMsg(prev => ({ ...prev, [logId]: 'ส่งข้อเสนอแนะเรียบร้อย! หลังบ้านได้รับการแจ้งเตือนแล้วครับ' }));
      // รีเซ็ตฟอร์ม
      setFeedbackForms(prev => ({
        ...prev,
        [logId]: { clientName: '', directionOrVote: 'ให้ผ่าน', comment: '' }
      }));
      if (onRefreshLogs) onRefreshLogs();
      setTimeout(() => {
        setSuccessMsg(prev => ({ ...prev, [logId]: null }));
      }, 5000);
    } catch (err) {
      alert('เกิดข้อผิดพลาด: ' + err.message);
    } finally {
      setSubmittingId(null);
    }
  };

  return (
    <section id="sitelogs" className="py-14 sm:py-20 bg-slate-100/70 dark:bg-slate-900/40 border-t border-slate-200 dark:border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="max-w-3xl mx-auto text-center mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            <ClipboardCheck className="w-3.5 h-3.5" /> ระบบตรวจงาน & รายงานหน้างานก่อสร้าง
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
            บันทึกการตรวจงาน & รายงานความคืบหน้า
          </h2>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
            อัปเดตงานจริงหน้างาน การวัดขนาด รอยร้าว และการแก้ไข ผู้ว่าจ้างสามารถส่งข้อเสนอแนะและตรวจรับงานได้ที่นี่
          </p>
        </div>

        {/* Logs List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {siteLogs.map((log) => {
            const isExpanded = expandedLogId === log.id;
            const formState = feedbackForms[log.id] || { clientName: '', directionOrVote: 'ให้ผ่าน', comment: '' };
            const feedbacks = log.feedbackList || [];

            return (
              <div 
                key={log.id}
                className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {/* Image showcase */}
                  {log.images && log.images.length > 0 && (
                    <div className="relative aspect-[16/9] bg-slate-900 overflow-hidden group">
                      <img 
                        src={log.images[0]} 
                        alt={log.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 left-3 flex gap-2">
                        <span className="px-2.5 py-1 rounded-lg bg-blue-600/90 text-white text-xs font-semibold backdrop-blur-sm shadow">
                          {log.category || 'ตรวจงานก่อสร้าง'}
                        </span>
                        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold backdrop-blur-sm shadow ${
                          log.status === 'completed' ? 'bg-emerald-600 text-white' :
                          log.status === 'in_progress' ? 'bg-amber-600 text-white' : 'bg-slate-900/80 text-white'
                        }`}>
                          {log.status === 'completed' ? '✓ งานเรียบร้อยแล้ว' :
                           log.status === 'in_progress' ? '⚙ กำลังดำเนินงาน' : 'รับเรื่องแล้ว'}
                        </span>
                      </div>
                      {log.images.length > 1 && (
                        <div className="absolute bottom-3 right-3 px-2 py-0.5 rounded-lg bg-slate-950/80 text-white text-[11px] backdrop-blur-sm">
                          +{log.images.length - 1} รูปเพิ่มเติม
                        </div>
                      )}
                    </div>
                  )}

                  {/* Body Content */}
                  <div className="p-6">
                    {/* Meta bar: Date, Time, Location */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mb-3">
                      <span className="flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                        <Calendar className="w-3.5 h-3.5 text-blue-500" /> {log.date || 'วันนี้'}
                      </span>
                      {log.time && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-blue-500" /> {log.time} น.
                        </span>
                      )}
                      {log.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-500" /> {log.location}
                        </span>
                      )}
                      {log.gps?.lat && log.gps?.lng && (
                        <a
                          href={`https://www.google.com/maps?q=${log.gps.lat},${log.gps.lng}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          <ExternalLink className="w-3 h-3" /> ดูพิกัดแผนที่ GPS
                        </a>
                      )}
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                      {log.title}
                    </h3>

                    {/* Measurements Box (กว้าง x ยาว x หนา/ลึก) */}
                    {log.measurements && (log.measurements.width || log.measurements.length || log.measurements.thickness) && (
                      <div className="mb-4 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800 text-xs">
                        <div className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                          <Ruler className="w-3.5 h-3.5 text-blue-500" /> การวัดขนาดหน้างาน:
                        </div>
                        <div className="grid grid-cols-3 gap-2 text-center">
                          <div className="bg-white dark:bg-slate-900 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">กว้าง</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{log.measurements.width || '-'}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">ยาว</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{log.measurements.length || '-'}</span>
                          </div>
                          <div className="bg-white dark:bg-slate-900 py-1 px-2 rounded-lg border border-slate-200 dark:border-slate-700">
                            <span className="text-[10px] text-slate-400 block">หนา / ลึก</span>
                            <span className="font-bold text-slate-800 dark:text-slate-200">{log.measurements.thickness || '-'}</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
                      {log.description}
                    </p>

                    {/* Admin Status Note (การรับเรื่อง / ความคืบหน้า) */}
                    {log.statusNote && (
                      <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 mb-4 text-xs text-emerald-800 dark:text-emerald-300 flex items-start gap-2">
                        <CheckCheck className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">อัปเดตจากเจ้าของงาน: {log.statusNote}</span>
                          {log.estimatedCompletionDate && (
                            <span className="text-[11px] text-emerald-700 dark:text-emerald-400">
                              กำหนดเสร็จประมาณ: {log.estimatedCompletionDate}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Previous Feedback items */}
                    {feedbacks.length > 0 && (
                      <div className="space-y-2 mb-4 border-t border-slate-100 dark:border-slate-800 pt-3">
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                          ข้อเสนอแนะจากผู้ตรวจงาน ({feedbacks.length})
                        </div>
                        {feedbacks.slice(-3).map((fb, i) => (
                          <div key={i} className="text-xs p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 border border-slate-200/60 dark:border-slate-800 flex items-start justify-between gap-2">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 dark:text-slate-200">{fb.clientName || 'ผู้ตรวจ'}</span>
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  fb.directionOrVote === 'ให้ผ่าน' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                                  fb.directionOrVote === 'งานเรียบร้อย' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                                  'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                }`}>
                                  {fb.directionOrVote}
                                </span>
                              </div>
                              <p className="text-slate-600 dark:text-slate-300 mt-1">{fb.comment}</p>
                            </div>
                            {fb.acknowledgedByAdmin && (
                              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300 font-medium whitespace-nowrap">
                                เจ้าของรับเรื่องแล้ว ✓
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Interactive Feedback / Direction Drawer (ข้อกำหนด 12) */}
                <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950/50 border-t border-slate-200 dark:border-slate-800">
                  {successMsg[log.id] ? (
                    <div className="p-3 bg-emerald-100 dark:bg-emerald-950 border border-emerald-300 dark:border-emerald-800 rounded-xl text-emerald-800 dark:text-emerald-200 text-xs text-center font-medium">
                      {successMsg[log.id]}
                    </div>
                  ) : (
                    <form onSubmit={(e) => handleSubmitFeedback(e, log.id)} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-blue-500" /> แสดงความเห็น / ทิศทางการแก้ไข
                        </span>
                        <span className="text-[11px] text-slate-400">แจ้งเตือนแอดมินทันที</span>
                      </div>

                      {/* Direction / Vote Options */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['งานเรียบร้อย', 'กำลังแก้ไข', 'ให้ผ่าน', 'ต้องแก้ไขเพิ่ม'].map(option => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => handleFeedbackChange(log.id, 'directionOrVote', option)}
                            className={`py-1.5 px-2 rounded-xl text-xs font-medium border text-center transition-all ${
                              formState.directionOrVote === option
                                ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                                : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-800 hover:border-blue-400'
                            }`}
                          >
                            {option}
                          </button>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={formState.clientName}
                          onChange={(e) => handleFeedbackChange(log.id, 'clientName', e.target.value)}
                          placeholder="ชื่อผู้ตรวจ / ผู้ว่าจ้าง"
                          className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                        <input
                          type="text"
                          value={formState.comment}
                          onChange={(e) => handleFeedbackChange(log.id, 'comment', e.target.value)}
                          placeholder="ข้อเสนอแนะ เช่น แก้ไขไปทางทิศไหน หรือโป๊วซ้ำ..."
                          className="sm:col-span-2 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={submittingId === log.id}
                        className="w-full py-2 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                      >
                        {submittingId === log.id ? 'กำลังส่ง...' : (
                          <>
                            <Send className="w-3.5 h-3.5" /> ส่งข้อเสนอแนะถึงคุณยุทธการ
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>

              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
