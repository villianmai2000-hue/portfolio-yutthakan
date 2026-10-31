import React, { useState, useEffect } from 'react';
import { 
  X, Plus, Edit2, Trash2, Upload, Database, HardDrive, 
  Download, MessageSquare, Image as ImageIcon, CheckCircle, 
  AlertCircle, RefreshCw, Layers, User, Phone, MessageCircle, 
  ExternalLink, FileCode2, Sparkles, Check, ArrowUpRight,
  Lock, KeyRound, Copy, Eye, EyeOff, ShieldCheck, MapPin, 
  Navigation, Calendar, Clock, Ruler, ClipboardList, CheckCheck,
  Tag, Settings as SettingsIcon, ShieldAlert, FolderPlus, Bell,
  FileSpreadsheet, PhoneCall, ZoomIn, Boxes, Wrench, Send,
  Recycle, CheckSquare, History, Archive
} from 'lucide-react';
import { api } from '../utils/api.js';
import { compressUltraCompact, formatBytes } from '../utils/compressor.js';
import { 
  REBAR_STANDARDS, H_BEAM_STANDARDS, I_BEAM_STANDARDS, WF_STANDARDS,
  BOX_STANDARDS, C_CHANNEL_STANDARDS, ROUND_PIPE_STANDARDS,
  PVC_85_STANDARDS, PVC_135_STANDARDS, PVC_FITTING_TYPES, PVC_PIPE_SIZES,
  UNIT_WEIGHT_LOOKUP, getUnitWeight, CONCRETE_STRENGTHS
} from '../utils/steelStandards.js';

// ตารางมาตรฐานเหล็กโครงสร้างรูปพรรณรีดร้อน H-BEAMS (มอก. 1227-2558 / TIS STANDARD)
export const H_BEAM_STANDARDS_TIS = [
  { size: '100x50', label: 'H-100x50', weight: 9.30, H: 100, B: 50, t1: 5.0, t2: 7, r: 8, area: 11.85, Ix: 187, Iy: 14.8, Zx: 37.5, Zy: 5.91 },
  { size: '100x100', label: 'H-100x100', weight: 17.2, H: 100, B: 100, t1: 6.0, t2: 8, r: 10, area: 21.90, Ix: 383, Iy: 134, Zx: 77, Zy: 27 },
  { size: '125x125', label: 'H-125x125', weight: 23.8, H: 125, B: 125, t1: 6.5, t2: 9, r: 10, area: 30.31, Ix: 847, Iy: 293, Zx: 136, Zy: 47 },
  { size: '150x75', label: 'H-150x75', weight: 14.0, H: 150, B: 75, t1: 5.0, t2: 7, r: 8, area: 17.85, Ix: 666, Iy: 50, Zx: 89, Zy: 13 },
  { size: '150x100', label: 'H-150x100', weight: 21.1, H: 148, B: 100, t1: 6.0, t2: 9, r: 11, area: 26.84, Ix: 1020, Iy: 151, Zx: 138, Zy: 30 },
  { size: '150x150', label: 'H-150x150', weight: 31.5, H: 150, B: 150, t1: 7.0, t2: 10, r: 11, area: 40.14, Ix: 1640, Iy: 563, Zx: 219, Zy: 75 },
  { size: '175x90', label: 'H-175x90', weight: 18.1, H: 175, B: 90, t1: 5.0, t2: 8, r: 9, area: 23.04, Ix: 1210, Iy: 97.5, Zx: 139, Zy: 21.7 },
  { size: '175x175', label: 'H-175x175', weight: 40.2, H: 175, B: 175, t1: 7.5, t2: 11, r: 12, area: 51.21, Ix: 2880, Iy: 984, Zx: 330, Zy: 112 },
  { size: '200x100 (18.2k)', label: 'H-200x100 (18.2k)', weight: 18.2, H: 198, B: 99, t1: 4.5, t2: 7, r: 11, area: 23.18, Ix: 1580, Iy: 114, Zx: 160, Zy: 23 },
  { size: '200x100', label: 'H-200x100', weight: 21.3, H: 200, B: 100, t1: 5.5, t2: 8, r: 11, area: 27.16, Ix: 1840, Iy: 134, Zx: 184, Zy: 27 },
  { size: '200x150', label: 'H-200x150', weight: 30.6, H: 194, B: 150, t1: 6.0, t2: 9, r: 13, area: 39.01, Ix: 2690, Iy: 507, Zx: 277, Zy: 68 },
  { size: '200x200', label: 'H-200x200', weight: 49.9, H: 200, B: 200, t1: 8.0, t2: 12, r: 13, area: 63.53, Ix: 4720, Iy: 1600, Zx: 472, Zy: 160 },
  { size: '200x200 (56.2k)', label: 'H-200x200 (56.2k)', weight: 56.2, H: 200, B: 204, t1: 12.0, t2: 12, r: 13, area: 71.53, Ix: 4980, Iy: 1700, Zx: 498, Zy: 167 },
  { size: '200x200 (65.7k)', label: 'H-200x200 (65.7k)', weight: 65.7, H: 208, B: 202, t1: 10.0, t2: 16, r: 13, area: 83.69, Ix: 6530, Iy: 2200, Zx: 628, Zy: 218 },
  { size: '250x125 (25.7k)', label: 'H-250x125 (25.7k)', weight: 25.7, H: 248, B: 124, t1: 5.0, t2: 8, r: 12, area: 32.68, Ix: 3540, Iy: 255, Zx: 285, Zy: 41 },
  { size: '250x125', label: 'H-250x125', weight: 29.6, H: 250, B: 125, t1: 6.0, t2: 9, r: 12, area: 37.66, Ix: 4050, Iy: 294, Zx: 324, Zy: 47 },
  { size: '250x175', label: 'H-250x175', weight: 44.1, H: 244, B: 175, t1: 7.0, t2: 11, r: 16, area: 56.24, Ix: 6120, Iy: 984, Zx: 502, Zy: 113 },
  { size: '250x250 (64.4k)', label: 'H-250x250 (64.4k)', weight: 64.4, H: 244, B: 252, t1: 11.0, t2: 11, r: 16, area: 82.06, Ix: 8790, Iy: 2940, Zx: 720, Zy: 233 },
  { size: '250x250 (66.5k)', label: 'H-250x250 (66.5k)', weight: 66.5, H: 248, B: 249, t1: 8.0, t2: 13, r: 16, area: 84.70, Ix: 9930, Iy: 3350, Zx: 801, Zy: 269 },
  { size: '250x250', label: 'H-250x250', weight: 72.4, H: 250, B: 250, t1: 9.0, t2: 14, r: 16, area: 92.18, Ix: 10800, Iy: 3650, Zx: 867, Zy: 292 },
  { size: '250x250 (82.2k)', label: 'H-250x250 (82.2k)', weight: 82.2, H: 250, B: 255, t1: 14.0, t2: 14, r: 16, area: 104.70, Ix: 11500, Iy: 3880, Zx: 919, Zy: 304 },
  { size: '300x150 (32k)', label: 'H-300x150 (32k)', weight: 32.0, H: 298, B: 149, t1: 5.5, t2: 8, r: 13, area: 40.80, Ix: 6320, Iy: 442, Zx: 424, Zy: 59 },
  { size: '300x150', label: 'H-300x150', weight: 36.7, H: 300, B: 150, t1: 6.5, t2: 9, r: 13, area: 46.78, Ix: 7210, Iy: 508, Zx: 481, Zy: 68 },
  { size: '300x200', label: 'H-300x200', weight: 56.8, H: 294, B: 200, t1: 8.0, t2: 12, r: 18, area: 72.38, Ix: 11300, Iy: 1600, Zx: 771, Zy: 160 },
  { size: '300x200 (65.4k)', label: 'H-300x200 (65.4k)', weight: 65.4, H: 298, B: 201, t1: 9.0, t2: 14, r: 18, area: 83.36, Ix: 13300, Iy: 1900, Zx: 893, Zy: 189 },
  { size: '300x300 (84.5k)', label: 'H-300x300 (84.5k)', weight: 84.5, H: 294, B: 302, t1: 12.0, t2: 12, r: 18, area: 107.70, Ix: 16900, Iy: 5520, Zx: 1150, Zy: 365 },
  { size: '300x300 (87k)', label: 'H-300x300 (87k)', weight: 87.0, H: 298, B: 299, t1: 9.0, t2: 14, r: 18, area: 110.80, Ix: 18800, Iy: 6240, Zx: 1270, Zy: 417 },
  { size: '300x300', label: 'H-300x300', weight: 94.0, H: 300, B: 300, t1: 10.0, t2: 15, r: 18, area: 119.80, Ix: 20400, Iy: 6750, Zx: 1360, Zy: 450 },
  { size: '300x300 (106k)', label: 'H-300x300 (106k)', weight: 106.0, H: 300, B: 305, t1: 15.0, t2: 15, r: 18, area: 134.80, Ix: 21500, Iy: 7100, Zx: 1440, Zy: 466 },
  { size: '350x175 (41.4k)', label: 'H-350x175 (41.4k)', weight: 41.4, H: 346, B: 174, t1: 6.0, t2: 9, r: 14, area: 52.68, Ix: 11100, Iy: 792, Zx: 611, Zy: 91 },
  { size: '350x175', label: 'H-350x175', weight: 49.6, H: 350, B: 175, t1: 7.0, t2: 11, r: 14, area: 63.14, Ix: 13600, Iy: 984, Zx: 775, Zy: 112 },
  { size: '350x175 (57.8k)', label: 'H-350x175 (57.8k)', weight: 57.8, H: 354, B: 176, t1: 8.0, t2: 13, r: 14, area: 73.68, Ix: 16100, Iy: 1180, Zx: 909, Zy: 134 },
  { size: '350x250 (69.2k)', label: 'H-350x250 (69.2k)', weight: 69.2, H: 336, B: 249, t1: 8.0, t2: 12, r: 20, area: 88.15, Ix: 18500, Iy: 3090, Zx: 1100, Zy: 248 },
  { size: '350x250', label: 'H-350x250', weight: 79.7, H: 340, B: 250, t1: 9.0, t2: 14, r: 20, area: 101.50, Ix: 21700, Iy: 3650, Zx: 1280, Zy: 292 },
  { size: '350x250 (106k)', label: 'H-350x250 (106k)', weight: 106.0, H: 338, B: 351, t1: 13.0, t2: 13, r: 20, area: 135.30, Ix: 28200, Iy: 9380, Zx: 1670, Zy: 534 },
  { size: '350x350 (115k)', label: 'H-350x350 (115k)', weight: 115.0, H: 344, B: 348, t1: 10.0, t2: 16, r: 20, area: 146.00, Ix: 33300, Iy: 11200, Zx: 1940, Zy: 646 },
  { size: '350x350 (131k)', label: 'H-350x350 (131k)', weight: 131.0, H: 344, B: 354, t1: 16.0, t2: 16, r: 20, area: 166.60, Ix: 35300, Iy: 11800, Zx: 2050, Zy: 669 },
  { size: '350x350', label: 'H-350x350', weight: 137.0, H: 350, B: 350, t1: 12.0, t2: 19, r: 20, area: 173.90, Ix: 40300, Iy: 13600, Zx: 2300, Zy: 776 },
  { size: '350x350 (156k)', label: 'H-350x350 (156k)', weight: 156.0, H: 350, B: 357, t1: 19.0, t2: 19, r: 20, area: 198.40, Ix: 42800, Iy: 14400, Zx: 2450, Zy: 809 }
];

// มาตรฐานน้ำหนักเหล็กเส้นเสริมคอนกรีต (มอก. 24-2559) และเหล็กรูปพรรณรีดร้อน/เหล็กบีม H-BEAMS (มอก. 1227-2558) กก./ม.
const REBAR_WEIGHTS = { ...UNIT_WEIGHT_LOOKUP,
  // เหล็กเส้นกลม (Round Bar)
  RB6: 0.222,
  RB9: 0.499,
  RB10: 0.617,
  RB12: 0.888,
  RB15: 1.387,
  RB19: 2.226,
  RB25: 3.853,
  // เหล็กข้ออ้อย (Deformed Bar)
  DB10: 0.617,
  DB12: 0.888,
  DB16: 1.580,
  DB20: 2.470,
  DB25: 3.850,
  DB28: 4.830,
  DB32: 6.310,
  DB36: 7.990,
  DB40: 9.865,
  // เหล็กโครงสร้างรูปพรรณรีดร้อน H-BEAMS (มอก. 1227-2558 ตามตารางมาตรฐานสากล)
  'H-100x50': 9.30,
  'H-100x100': 17.2,
  'H-125x125': 23.8,
  'H-150x75': 14.0,
  'H-150x100': 21.1,
  'H-150x150': 31.5,
  'H-175x90': 18.1,
  'H-175x175': 40.2,
  'H-200x100': 21.3,
  'H-200x100 (18.2k)': 18.2,
  'H-200x150': 30.6,
  'H-200x200': 49.9,
  'H-200x200 (56.2k)': 56.2,
  'H-200x200 (65.7k)': 65.7,
  'H-250x125': 29.6,
  'H-250x125 (25.7k)': 25.7,
  'H-250x175': 44.1,
  'H-250x250': 72.4,
  'H-250x250 (64.4k)': 64.4,
  'H-250x250 (66.5k)': 66.5,
  'H-250x250 (82.2k)': 82.2,
  'H-300x150': 36.7,
  'H-300x150 (32k)': 32.0,
  'H-300x200': 56.8,
  'H-300x200 (65.4k)': 65.4,
  'H-300x300': 94.0,
  'H-300x300 (84.5k)': 84.5,
  'H-300x300 (87k)': 87.0,
  'H-300x300 (106k)': 106.0,
  'H-350x175': 49.6,
  'H-350x175 (41.4k)': 41.4,
  'H-350x175 (57.8k)': 57.8,
  'H-350x250': 79.7,
  'H-350x250 (69.2k)': 69.2,
  'H-350x250 (106k)': 106.0,
  'H-350x350': 137.0,
  'H-350x350 (115k)': 115.0,
  'H-350x350 (131k)': 131.0,
  'H-350x350 (156k)': 156.0,
  // Short code aliases
  HB100: 17.2,
  HB125: 23.8,
  HB150: 31.5,
  HB175: 40.2,
  HB200: 49.9,
  HB250: 72.4,
  HB300: 94.0,
  HB350: 137.0,
  IB100: 14.0,
  IB125: 17.5,
  IB150: 21.1,
  IB175: 24.2,
  IB200: 26.0,
  IB250: 38.3,
  WF100: 14.0,
  WF150: 14.0,
  WF200: 21.3,
  WF250: 29.6
};

// ลำดับการเรียงขนาดเหล็กจากเล็กไปหามาก (ข้อกำหนด 9)
const getRebarSortRank = (barType) => {
  if (!barType) return 999;
  const t = String(barType).toUpperCase().trim();
  if (t.startsWith('RB')) {
    const n = parseFloat(t.replace('RB', '')) || 0;
    return n;
  }
  if (t.startsWith('DB')) {
    const n = parseFloat(t.replace('DB', '')) || 0;
    return 100 + n;
  }
  if (t.startsWith('H-') || t.startsWith('HB') || t.startsWith('H')) {
    const m = t.match(/\d+/);
    const n = m ? parseInt(m[0], 10) : 0;
    return 2000 + n;
  }
  if (t.startsWith('IB') || t.startsWith('I-') || t.startsWith('I')) {
    const m = t.match(/\d+/);
    const n = m ? parseInt(m[0], 10) : 0;
    return 1000 + n;
  }
  if (t.startsWith('WF')) {
    const m = t.match(/\d+/);
    const n = m ? parseInt(m[0], 10) : 0;
    return 3000 + n;
  }
  if (t.includes('เพลท') || t.startsWith('PL')) return 4000;
  if (t.includes('กล่อง') || t.includes('SHS') || t.includes('RHS')) return 6000;
  if (t.includes('C-') || t.includes('ตัวซี') || t.startsWith('C ')) return 7000;
  if (t.includes('ท่อกลม') || t.startsWith('PIPE')) return 8000;
  if (t.includes('PVC')) return 9000;
  return 5000;
};

export default function AdminPanel({ isOpen, onClose, onRefreshData, initialTab = 'projects' }) {
  // จดจำแท็บและซับแท็บเมื่อรีโหลดหน้าเว็บ (ข้อกำหนด 14, 15)
  const [activeTab, setActiveTab] = useState(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash : '';
    if (hash && hash.startsWith('#admin-')) {
      return hash.replace('#admin-', '');
    }
    return (typeof localStorage !== 'undefined' && localStorage.getItem('yutthakan_admin_tab')) || initialTab || 'rebar';
  }); 

  // Sub-tab inside Rebar: 'bbs' or 'offcuts'
  const [rebarSubTab, setRebarSubTab] = useState(() => {
    return (typeof localStorage !== 'undefined' && localStorage.getItem('yutthakan_rebar_subtab')) || 'bbs';
  }); 
  const [offcutFilter, setOffcutFilter] = useState('available'); // 'available' or 'used'

  // ฟิลเตอร์กลุ่ม/หมวด และขนาดเหล็กสำหรับตารางสรุป (ข้อกำหนด 9, 10, 11, 12)
  const [selectedRebarGroup, setSelectedRebarGroup] = useState('ทั้งหมด');
  const [selectedRebarSize, setSelectedRebarSize] = useState('ทั้งหมด');
  const [lengthViewFilter, setLengthViewFilter] = useState('all'); // 'all', '10', '12'
  const [summaryTabFilter, setSummaryTabFilter] = useState('all'); // 'all', 'rebar', 'concrete', 'beam', 'plate', 'box_c_pipe', 'pvc'
  const [showPerGroupBreakdown, setShowPerGroupBreakdown] = useState(false);

  // ซิงก์แท็บปัจจุบันลง localStorage และ URL hash ทันทีที่เปลี่ยนแท็บ
  useEffect(() => {
    if (activeTab) {
      localStorage.setItem('yutthakan_admin_tab', activeTab);
      if (window.location.hash !== `#admin-${activeTab}`) {
        window.location.hash = `#admin-${activeTab}`;
      }
    }
  }, [activeTab]);

  useEffect(() => {
    if (rebarSubTab) {
      localStorage.setItem('yutthakan_rebar_subtab', rebarSubTab);
    }
  }, [rebarSubTab]);

  useEffect(() => {
    if (initialTab && initialTab !== activeTab && !window.location.hash.startsWith('#admin-')) {
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

  // Rebar Cut List & Offcut Inventory State (Requirements 4, 5, 7, 8, 9)
  const [rebarItems, setRebarItems] = useState([]);
  const [rebarOffcuts, setRebarOffcuts] = useState([]);
  const [rebarSummary, setRebarSummary] = useState(null);
  const [rebarLoading, setRebarLoading] = useState(false);
  const [rebarAutoSync, setRebarAutoSync] = useState(true);
  const [isRebarEditorOpen, setIsRebarEditorOpen] = useState(false);
  const [editingRebarItem, setEditingRebarItem] = useState(null);
  const [rebarForm, setRebarForm] = useState({
    group: 'งานโครงสร้างทั่วไป',
    label: '',
    materialCategory: 'rebar', // 'rebar', 'concrete', 'beam', 'plate', 'box_c_pipe', 'pvc'
    concreteWidth: 0.50,
    concreteLength: 4.00,
    concreteDepth: 0.50,
    concreteStrength: '240 ksc',
    concreteWastePercent: 5.0,
    rebarType: 'DB20',
    standardLength: 12,
    cutLength: 6.0,
    quantity: 1,
    usedFor: '',
    note: '',
    isReusedOffcut: false,
    reusedOffcutId: '',
    // Category specific
    subCategory: 'H-Beam',
    customType: false,
    customSize: '',
    customWeight: '',
    plateWidth: 300,
    plateLength: 300,
    plateThickness: 6,
    plateWeightKg: 4.24,
    jboltSize: 'DB16',
    jboltLength: 0.40,
    jboltQtyPerPlate: 4,
    nutQtyPerPlate: 4,
    washerQtyPerPlate: 4,
    pvcType: 'pipe',
    fittingName: 'ข้อต่อตรง',
    fittingSize: '2"'
  });

  // Project Editor State
  const [editingProject, setEditingProject] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [compressing, setCompressing] = useState(false);

  // Category Editor State
  const [newCategoryName, setNewCategoryName] = useState('');

  // Message Detail & Lightbox State
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [zoomPhotoUrl, setZoomPhotoUrl] = useState(null);

  // Private Vault State (PIN: 0966390496)
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [vaultPinInput, setVaultPinInput] = useState('');
  const [vaultPinError, setVaultPinError] = useState('');
  const [vaultItems, setVaultItems] = useState([]);
  const [newVaultItem, setNewVaultItem] = useState({ label: '', emailOrId: '', note: '' });
  const [isChangePinOpen, setIsChangePinOpen] = useState(false);
  const [newPinValue, setNewPinValue] = useState('');
  const [copyFeedback, setCopyFeedback] = useState(null);

  // Site Log Editor State
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
        api.getProjects().catch(() => []),
        api.getProfile().catch(() => null),
        api.getMessages().catch(() => []),
        api.getCategories().catch(() => []),
        api.getSiteLogs(true).catch(() => []),
        api.getSystemStatus().catch(() => null)
      ]);
      setProjects(projs || []);
      if (prof) setProfile(prof);
      setMessages(msgs || []);
      setCategories(cats || []);
      setSiteLogs(logs || []);
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
      const [items, offcuts, summary] = await Promise.all([
        api.getRebarItems().catch(() => []),
        api.getRebarOffcuts().catch(() => []),
        api.getRebarSummary().catch(() => null)
      ]);
      setRebarItems(items || []);
      setRebarOffcuts(offcuts || []);
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
  // REBAR & OFFCUT HANDLERS (Requirements 4, 5, 7, 8, 9)
  // Added UI state for grouping and offcut type filtering
  const [groupByBase, setGroupByBase] = useState('all'); // 'all', 'foundation', 'column', etc.
  const [offcutFilterType, setOffcutFilterType] = useState(''); // e.g., 'DB20'

  // รายชื่อกลุ่ม/หมวดทั้งหมดที่มีในระบบ
  const availableRebarGroups = React.useMemo(() => {
    const groups = new Set();
    rebarItems.forEach(item => {
      const g = (item.group || item.category || '').trim();
      if (g) groups.add(g);
    });
    return Array.from(groups);
  }, [rebarItems]);

  // รายชื่อขนาดเหล็กทั้งหมดที่มีในระบบ
  const availableRebarSizes = React.useMemo(() => {
    const sizes = new Set();
    rebarItems.forEach(item => {
      const s = (item.rebarType || item.barType || '').toUpperCase().trim();
      if (s) sizes.add(s);
    });
    return Array.from(sizes).sort((a, b) => getRebarSortRank(a) - getRebarSortRank(b));
  }, [rebarItems]);

  // ฟังก์ชันคำนวณสรุปการสั่งเหล็กมาตรฐานแยกขนาด 6m / 10m / 12m และน้ำหนัก (ข้อกำหนด 9, 10, 11, 12)
  const calculateRebarSizeBreakdown = React.useCallback((items) => {
    const map = {};
    items.forEach(item => {
      const type = (item.rebarType || item.barType || 'DB20').toUpperCase().trim();
      const stdLen = Number(item.standardLength) || 12;
      const cutLen = Number(item.cutLength) || 0;
      const qty = Number(item.quantity) || 1;
      const unitWeight = REBAR_WEIGHTS[type] || 2.47;
      const barsNeeded = item.isReusedOffcut ? 0 : (item.standardBarsNeeded !== undefined ? item.standardBarsNeeded : (item.barsNeeded || 0));
      const cutMeters = cutLen * qty;
      const cutWeightKg = cutMeters * unitWeight;

      if (!map[type]) {
        map[type] = {
          type,
          bars6m: 0,
          bars10m: 0,
          bars12m: 0,
          barsOther: 0,
          totalBars: 0,
          totalCutMeters: 0,
          totalCutWeightKg: 0,
          unitWeight
        };
      }

      if (!item.isReusedOffcut) {
        if (stdLen === 6) map[type].bars6m += barsNeeded;
        else if (stdLen === 10) map[type].bars10m += barsNeeded;
        else if (stdLen === 12) map[type].bars12m += barsNeeded;
        else map[type].barsOther += barsNeeded;
        map[type].totalBars += barsNeeded;
      }

      map[type].totalCutMeters += cutMeters;
      map[type].totalCutWeightKg += cutWeightKg;
    });

    const rows = Object.values(map).sort((a, b) => getRebarSortRank(a.type) - getRebarSortRank(b.type));

    const grand = rows.reduce((acc, r) => ({
      bars6m: acc.bars6m + r.bars6m,
      bars10m: acc.bars10m + r.bars10m,
      bars12m: acc.bars12m + r.bars12m,
      barsOther: acc.barsOther + r.barsOther,
      totalBars: acc.totalBars + r.totalBars,
      totalCutMeters: acc.totalCutMeters + r.totalCutMeters,
      totalCutWeightKg: acc.totalCutWeightKg + r.totalCutWeightKg
    }), { bars6m: 0, bars10m: 0, bars12m: 0, barsOther: 0, totalBars: 0, totalCutMeters: 0, totalCutWeightKg: 0 });

    return { rows, grand };
  }, []);

  // สรุปยอดรวมทั้งหมดทั้งโครงการ (Grand Total - ข้อกำหนด 12)
  const allProjectRebarSummary = React.useMemo(() => {
    return calculateRebarSizeBreakdown(rebarItems);
  }, [rebarItems, calculateRebarSizeBreakdown]);

  // สรุปเฉพาะหมวดที่เลือก (ข้อกำหนด 11)
  const filteredCategorySummary = React.useMemo(() => {
    let list = rebarItems;
    if (selectedRebarGroup !== 'ทั้งหมด') {
      list = list.filter(item => (item.group || item.category || 'งานโครงสร้างทั่วไป') === selectedRebarGroup);
    }
    if (selectedRebarSize !== 'ทั้งหมด') {
      list = list.filter(item => (item.rebarType || item.barType || '').toUpperCase() === selectedRebarSize);
    }
    return calculateRebarSizeBreakdown(list);
  }, [rebarItems, selectedRebarGroup, selectedRebarSize, calculateRebarSizeBreakdown]);

  // สรุปแยกแต่ละหมวดหมู่วัสดุอย่างเป็นสัดส่วน ไม่รวมปนกัน (ข้อกำหนด 2)
  const categorySummaries = React.useMemo(() => {
    // 1. งานเหล็กเส้น
    const rebarList = rebarItems.filter(it => (it.materialCategory || 'rebar') === 'rebar');
    const rebarSummary = calculateRebarSizeBreakdown(rebarList);

    // 2. งานปูนคอนกรีต
    const concreteList = rebarItems.filter(it => it.materialCategory === 'concrete');
    const concreteMap = {};
    concreteList.forEach(it => {
      const key = it.concreteStrength || it.rebarType || '240 ksc';
      if (!concreteMap[key]) {
        concreteMap[key] = {
          strength: key,
          count: 0,
          netVolume: 0,
          wasteVolume: 0,
          totalVolume: 0,
          totalWeightKg: 0
        };
      }
      concreteMap[key].count += (it.quantity || 1);
      concreteMap[key].netVolume += (it.netVolume || 0);
      concreteMap[key].wasteVolume += (it.wasteVolume || 0);
      concreteMap[key].totalVolume += (it.totalVolume || 0);
      concreteMap[key].totalWeightKg += (it.totalWeightKg || 0);
    });
    const concreteRows = Object.values(concreteMap);
    const concreteGrand = concreteRows.reduce((acc, r) => ({
      count: acc.count + r.count,
      netVolume: Number((acc.netVolume + r.netVolume).toFixed(3)),
      wasteVolume: Number((acc.wasteVolume + r.wasteVolume).toFixed(3)),
      totalVolume: Number((acc.totalVolume + r.totalVolume).toFixed(3)),
      totalWeightKg: Number((acc.totalWeightKg + r.totalWeightKg).toFixed(2))
    }), { count: 0, netVolume: 0, wasteVolume: 0, totalVolume: 0, totalWeightKg: 0 });

    // 3. งานเหล็กบีม
    const beamList = rebarItems.filter(it => it.materialCategory === 'beam');
    const beamMap = {};
    beamList.forEach(it => {
      const key = it.rebarType || it.barType || 'H-Beam';
      if (!beamMap[key]) {
        beamMap[key] = { size: key, bars6m: 0, bars9m: 0, bars12m: 0, totalBars: 0, totalMeters: 0, totalWeightKg: 0 };
      }
      const bars = it.barsNeeded || 0;
      const std = Number(it.standardLength) || 6;
      if (std === 6) beamMap[key].bars6m += bars;
      else if (std === 9) beamMap[key].bars9m += bars;
      else beamMap[key].bars12m += bars;
      beamMap[key].totalBars += bars;
      beamMap[key].totalMeters += (it.totalCutLength || 0);
      beamMap[key].totalWeightKg += (it.totalWeightKg || 0);
    });
    const beamRows = Object.values(beamMap);
    const beamGrand = beamRows.reduce((acc, r) => ({
      totalBars: acc.totalBars + r.totalBars,
      totalMeters: Number((acc.totalMeters + r.totalMeters).toFixed(2)),
      totalWeightKg: Number((acc.totalWeightKg + r.totalWeightKg).toFixed(2))
    }), { totalBars: 0, totalMeters: 0, totalWeightKg: 0 });

    // 4. งานเหล็กเพลท & J-Bolt
    const plateList = rebarItems.filter(it => it.materialCategory === 'plate');
    const plateMap = {};
    plateList.forEach(it => {
      const key = it.rebarType || `${it.plateWidth}x${it.plateLength}x${it.plateThickness}mm`;
      if (!plateMap[key]) {
        plateMap[key] = {
          size: key,
          quantity: 0,
          plateWeightKg: 0,
          jboltSpec: `${it.jboltSize || 'DB16'} ยาว ${it.jboltLength || 0.4}m`,
          totalJBolts: 0,
          totalJBoltWeightKg: 0,
          totalNuts: 0,
          totalWashers: 0,
          totalWeightKg: 0
        };
      }
      plateMap[key].quantity += (it.quantity || 1);
      plateMap[key].plateWeightKg += (it.totalPlateWeightKg || 0);
      plateMap[key].totalJBolts += (it.totalJBolts || 0);
      plateMap[key].totalJBoltWeightKg += (it.totalJBoltWeightKg || 0);
      plateMap[key].totalNuts += (it.totalNuts || 0);
      plateMap[key].totalWashers += (it.totalWashers || 0);
      plateMap[key].totalWeightKg += (it.totalWeightKg || 0);
    });
    const plateRows = Object.values(plateMap);
    const plateGrand = plateRows.reduce((acc, r) => ({
      quantity: acc.quantity + r.quantity,
      plateWeightKg: Number((acc.plateWeightKg + r.plateWeightKg).toFixed(2)),
      totalJBolts: acc.totalJBolts + r.totalJBolts,
      totalJBoltWeightKg: Number((acc.totalJBoltWeightKg + r.totalJBoltWeightKg).toFixed(2)),
      totalNuts: acc.totalNuts + r.totalNuts,
      totalWashers: acc.totalWashers + r.totalWashers,
      totalWeightKg: Number((acc.totalWeightKg + r.totalWeightKg).toFixed(2))
    }), { quantity: 0, plateWeightKg: 0, totalJBolts: 0, totalJBoltWeightKg: 0, totalNuts: 0, totalWashers: 0, totalWeightKg: 0 });

    // 5. งานเหล็กรูปพรรณ (กล่อง/C/ท่อ)
    const boxList = rebarItems.filter(it => it.materialCategory === 'box_c_pipe');
    const boxMap = {};
    boxList.forEach(it => {
      const key = it.rebarType || 'เหล็กรูปพรรณ';
      if (!boxMap[key]) {
        boxMap[key] = { size: key, totalBars: 0, totalMeters: 0, totalWeightKg: 0 };
      }
      boxMap[key].totalBars += (it.barsNeeded || 0);
      boxMap[key].totalMeters += (it.totalCutLength || 0);
      boxMap[key].totalWeightKg += (it.totalWeightKg || 0);
    });
    const boxRows = Object.values(boxMap);
    const boxGrand = boxRows.reduce((acc, r) => ({
      totalBars: acc.totalBars + r.totalBars,
      totalMeters: Number((acc.totalMeters + r.totalMeters).toFixed(2)),
      totalWeightKg: Number((acc.totalWeightKg + r.totalWeightKg).toFixed(2))
    }), { totalBars: 0, totalMeters: 0, totalWeightKg: 0 });

    // 6. งานท่อ PVC & ข้อต่อ
    const pvcList = rebarItems.filter(it => it.materialCategory === 'pvc');
    const pvcMap = {};
    pvcList.forEach(it => {
      const key = it.rebarType || 'ท่อ PVC';
      const isFit = it.pvcType === 'fitting' || it.pvcType === 'valve';
      if (!pvcMap[key]) {
        pvcMap[key] = { name: key, isFitting: isFit, bars4m: 0, pieces: 0, totalMeters: 0, totalWeightKg: 0 };
      }
      if (isFit) {
        pvcMap[key].pieces += (it.quantity || 1);
      } else {
        pvcMap[key].bars4m += (it.barsNeeded || 0);
        pvcMap[key].totalMeters += (it.totalCutLength || 0);
        pvcMap[key].totalWeightKg += (it.totalWeightKg || 0);
      }
    });
    const pvcRows = Object.values(pvcMap);

    return {
      rebar: rebarSummary,
      concrete: { rows: concreteRows, grand: concreteGrand },
      beam: { rows: beamRows, grand: beamGrand },
      plate: { rows: plateRows, grand: plateGrand },
      box: { rows: boxRows, grand: boxGrand },
      pvc: { rows: pvcRows }
    };
  }, [rebarItems, calculateRebarSizeBreakdown]);

  // ========================================================
  const calculateRebarMetrics = (stdLen, cutLen, qty, type, isReused, offcutInitialLen, formExtra = {}) => {
    const category = formExtra.materialCategory || 'rebar';
    const count = Number(qty) || 1;

    // 0. หมวดงานปูนคอนกรีต (Concrete Takeoff)
    if (category === 'concrete') {
      const cW = Number(formExtra.concreteWidth) || 0.50;
      const cL = Number(formExtra.concreteLength) || 4.00;
      const cD = Number(formExtra.concreteDepth || formExtra.concreteHeight) || 0.50;
      const wastePct = Number(formExtra.concreteWastePercent !== undefined ? formExtra.concreteWastePercent : 5.0);
      const netVol = Number((cW * cL * cD * count).toFixed(3));
      const wasteVol = Number((netVol * (wastePct / 100)).toFixed(3));
      const totalVol = Number((netVol + wasteVol).toFixed(3));
      const totalWeight = Number((totalVol * 2400).toFixed(2));

      return {
        isConcrete: true,
        piecesPerBar: 0,
        standardBarsNeeded: 0,
        offcutPerBar: 0,
        offcutQuantity: 0,
        totalCutLength: 0,
        totalStandardLength: 0,
        totalScrapLength: 0,
        scrapPercent: wastePct,
        wastePercent: wastePct,
        netVolume: netVol,
        wasteVolume: wasteVol,
        totalVolume: totalVol,
        unitWeight: 2400,
        totalWeightKg: totalWeight,
        totalBarWeightKg: totalWeight
      };
    }

    // 1. หมวดงานเหล็กเพลท
    if (category === 'plate') {
      const plateWidth = Number(formExtra.plateWidth) || 300;
      const plateLength = Number(formExtra.plateLength) || 300;
      const plateThickness = Number(formExtra.plateThickness) || 6;
      const autoPlateWeight = Number(((plateWidth / 1000) * (plateLength / 1000) * plateThickness * 7.85).toFixed(2));
      const plateWeightKg = Number(formExtra.plateWeightKg) || autoPlateWeight;
      const totalPlateWeightKg = Number((plateWeightKg * count).toFixed(2));

      const jboltSize = formExtra.jboltSize || 'DB16';
      const jboltLength = Number(formExtra.jboltLength) || 0.40;
      const jboltQtyPerPlate = parseInt(formExtra.jboltQtyPerPlate) || 4;
      const totalJBolts = jboltQtyPerPlate * count;
      const jboltUnitWeight = getUnitWeight(jboltSize, 1.58);
      const totalJBoltWeightKg = Number((totalJBolts * jboltLength * jboltUnitWeight).toFixed(2));

      const nutQtyPerPlate = parseInt(formExtra.nutQtyPerPlate) || 4;
      const washerQtyPerPlate = parseInt(formExtra.washerQtyPerPlate) || 4;
      const totalWeightKg = Number((totalPlateWeightKg + totalJBoltWeightKg).toFixed(2));

      return {
        isPlate: true,
        piecesPerBar: 0,
        standardBarsNeeded: 0,
        offcutPerBar: 0,
        totalCutLength: 0,
        totalStandardLength: 0,
        totalScrapLength: 0,
        scrapPercent: 0,
        unitWeight: plateWeightKg,
        plateWeightKg,
        totalPlateWeightKg,
        totalJBolts,
        totalJBoltWeightKg,
        totalNuts: nutQtyPerPlate * count,
        totalWashers: washerQtyPerPlate * count,
        totalWeightKg,
        totalBarWeightKg: totalWeightKg
      };
    }

    // 2. หมวดงานข้อต่อ/วาล์ว PVC
    if (category === 'pvc' && (formExtra.pvcType === 'fitting' || formExtra.pvcType === 'valve')) {
      return {
        isFitting: true,
        piecesPerBar: 0,
        standardBarsNeeded: 0,
        offcutPerBar: 0,
        totalCutLength: 0,
        totalStandardLength: 0,
        totalScrapLength: 0,
        scrapPercent: 0,
        unitWeight: 0,
        totalWeightKg: 0,
        totalBarWeightKg: 0
      };
    }

    // 3. หมวดตัดเป็นท่อน (เหล็กเส้น, เหล็กบีม, กล่อง/ตัวซี/ท่อกลม, ท่อ PVC)
    const sLen = Number(stdLen) || (category === 'pvc' ? 4 : (category === 'box_c_pipe' ? 6 : 12));
    const cLen = Number(cutLen) || 1;
    const unitWeight = formExtra.customType && Number(formExtra.customWeight) 
      ? Number(formExtra.customWeight) 
      : (getUnitWeight(type, 2.47));
    const totalCutLength = Number((cLen * count).toFixed(2));

    if (isReused) {
      const initial = Number(offcutInitialLen) || cLen;
      const rem = Math.max(0, initial - totalCutLength);
      return {
        piecesPerBar: 1,
        standardBarsNeeded: 0,
        offcutPerBar: Number(rem.toFixed(2)),
        totalCutLength,
        totalStandardLength: initial,
        totalScrapLength: Number(rem.toFixed(2)),
        scrapPercent: initial > 0 ? Number(((rem / initial) * 100).toFixed(1)) : 0,
        unitWeight,
        totalWeightKg: Number((totalCutLength * unitWeight).toFixed(2)),
        totalBarWeightKg: Number((initial * unitWeight).toFixed(2))
      };
    }

    const P = Math.max(1, Math.floor(sLen / cLen));
    const standardBarsNeeded = Math.ceil(count / P);
    const totalStandardLength = Number((standardBarsNeeded * sLen).toFixed(2));
    const totalScrapLength = Number(Math.max(0, totalStandardLength - totalCutLength).toFixed(2));
    const scrapPercent = totalStandardLength > 0 ? ((totalScrapLength / totalStandardLength) * 100) : 0;

    const offcutPiecesList = [];
    let offcutPerBar = 0;
    if (count % P === 0) {
      const rFull = Number((sLen - (P * cLen)).toFixed(2));
      if (rFull > 0.05) {
        offcutPiecesList.push({ length: rFull, quantity: standardBarsNeeded });
      }
      offcutPerBar = rFull;
    } else {
      const fullBars = standardBarsNeeded - 1;
      const rFull = Number((sLen - (P * cLen)).toFixed(2));
      if (rFull > 0.05 && fullBars > 0) {
        offcutPiecesList.push({ length: rFull, quantity: fullBars });
      }
      const lastBarPieces = count - (fullBars * P);
      const rLast = Number((sLen - (lastBarPieces * cLen)).toFixed(2));
      if (rLast > 0.05) {
        offcutPiecesList.push({ length: rLast, quantity: 1 });
      }
      offcutPerBar = rFull > 0.05 ? rFull : rLast;
    }

    const offcutQuantity = offcutPiecesList.reduce((acc, o) => acc + o.quantity, 0);
    let offcutDisplay = '0 ม.';
    if (offcutPiecesList.length === 1) {
      offcutDisplay = `${offcutPiecesList[0].length} ม. (${offcutPiecesList[0].quantity} ท่อน)`;
    } else if (offcutPiecesList.length > 1) {
      offcutDisplay = offcutPiecesList.map(o => `${o.length} ม. (${o.quantity} ท่อน)`).join(' + ');
    }

    const totalWeightKg = totalCutLength * unitWeight;
    const totalBarWeightKg = totalStandardLength * unitWeight;

    return {
      piecesPerBar: P,
      standardBarsNeeded,
      offcutPerBar: Number(offcutPerBar.toFixed(2)),
      offcutQuantity,
      offcutPiecesList,
      offcutDisplay,
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
    const isPlate = rebarForm.materialCategory === 'plate';
    const isConcrete = rebarForm.materialCategory === 'concrete';
    const isFitting = rebarForm.materialCategory === 'pvc' && (rebarForm.pvcType === 'fitting' || rebarForm.pvcType === 'valve');

    if (!isPlate && !isConcrete && !isFitting && (!rebarForm.cutLength || rebarForm.cutLength <= 0)) {
      showFeedback('error', 'กรุณาระบุความยาวที่ตัดใช้ให้ถูกต้อง');
      return;
    }
    if (!rebarForm.quantity || rebarForm.quantity <= 0) {
      showFeedback('error', 'กรุณาระบุจำนวนชิ้น/ท่อนให้ถูกต้อง');
      return;
    }
    try {
      if (editingRebarItem) {
        await api.updateRebarItem(editingRebarItem.id, rebarForm);
        showFeedback('success', 'แก้ไขรายการวัสดุเรียบร้อย และซิงก์ระบบสำเร็จ');
      } else {
        await api.createRebarItem(rebarForm);
        showFeedback('success', 'เพิ่มรายการวัสดุเรียบร้อย และระบบบันทึกข้อมูลอัตโนมัติ');
      }
      setIsRebarEditorOpen(false);
      setEditingRebarItem(null);
      setRebarForm({
        group: availableRebarGroups[0] || 'งานเสา',
        label: '',
        materialCategory: 'rebar',
        rebarType: 'DB20',
        standardLength: 12,
        cutLength: 6.0,
        quantity: 1,
        usedFor: '',
        note: '',
        isReusedOffcut: false,
        reusedOffcutId: '',
        subCategory: 'H-Beam',
        customType: false,
        customSize: '',
        customWeight: '',
        plateWidth: 300,
        plateLength: 300,
        plateThickness: 6,
        plateWeightKg: 4.24,
        jboltSize: 'DB16',
        jboltLength: 0.40,
        jboltQtyPerPlate: 4,
        nutQtyPerPlate: 4,
        washerQtyPerPlate: 4,
        pvcType: 'pipe',
        fittingName: 'ข้อต่อตรง',
        fittingSize: '2"'
      });
      loadRebarData();
    } catch (err) {
      showFeedback('error', 'บันทึกรายการไม่สำเร็จ: ' + err.message);
    }
  };

  // ลบรายการเหล็กโดยไม่ออกจากหน้านั้นหรือรีเซ็ตแท็บ (ข้อกำหนด 14) และลบเศษเหล็กที่เชื่อมโยงอัตโนมัติ
  const handleDeleteRebar = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบรายการถอดเหล็กนี้? (เศษเหล็กที่เชื่อมโยงจะถูกลบออกจากคลังเศษด้วย)')) return;
    try {
      const target = rebarItems.find(it => it.id === id);
      await api.deleteRebarItem(id);
      showFeedback('success', 'ลบรายการและเศษเหล็กที่เชื่อมโยงเรียบร้อย');
      setRebarItems(prev => prev.filter(it => it.id !== id));
      if (target) {
        setRebarOffcuts(prev => prev.filter(o => o.rebarItemId !== id && o.sourceItemId !== id && (!target.label || o.sourceLabel !== target.label)));
      }
      await loadRebarData(false);
    } catch (err) {
      showFeedback('error', 'ลบไม่สำเร็จ: ' + err.message);
    }
  };

  // Offcut destination note update
  const handleUpdateOffcutNote = async (id, usedForText) => {
    try {
      await api.updateRebarOffcut(id, { usedFor: usedForText });
      showFeedback('success', 'บันทึกสถานที่นำเศษไปใช้เรียบร้อย');
      loadRebarData(false);
    } catch (err) {
      showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
    }
  };

  // Mark offcut as used (cuts it out of available inventory - Requirement 9)
  const handleMarkOffcutUsed = async (offcut) => {
    const dest = window.prompt(
      `คุณต้องการนำเศษเหล็ก ${offcut.rebarType || offcut.barType} ยาว ${offcut.length} ม. ไปใช้ที่ไหน?`,
      offcut.usedFor || 'นำไปเสริมโครงสร้าง'
    );
    if (dest === null) return;
    try {
      await api.markOffcutUsed(offcut.id, dest);
      showFeedback('success', 'ตัดยอดเศษเหล็กออกจากคลังคงเหลือเรียบร้อย!');
      loadRebarData(false);
    } catch (err) {
      showFeedback('error', 'อัปเดตไม่สำเร็จ: ' + err.message);
    }
  };

  // Restore offcut back to available
  const handleRestoreOffcut = async (id) => {
    try {
      await api.updateRebarOffcut(id, { status: 'available', usedAt: null });
      showFeedback('success', 'กู้คืนเศษเหล็กกลับเข้าคลังคงเหลือแล้ว');
      loadRebarData(false);
    } catch (err) {
      showFeedback('error', 'กู้คืนไม่สำเร็จ: ' + err.message);
    }
  };

  // ========================================================
  // VAULT HANDLERS (PIN Lock: 0966390496)
  // ========================================================
  const handleUnlockVault = async (e) => {
    e.preventDefault();
    setVaultPinError('');
    try {
      const res = await api.verifyVaultPin(vaultPinInput);
      if (!res.success) {
        setVaultPinError('รหัส PIN ไม่ถูกต้อง (กรุณากรอกรหัส 0966390496)');
        return;
      }
      setVaultItems(res.items || []);
      setVaultUnlocked(true);
      setVaultPinInput('');
    } catch (err) {
      setVaultPinError('รหัส PIN ไม่ถูกต้อง (กรุณากรอกรหัส 0966390496)');
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
  // SITE LOG HANDLERS (Fix Image Display & Upload)
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
      const updated = await api.getSiteLogs(true);
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
      const updated = await api.getSiteLogs(true);
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
      const updated = await api.getSiteLogs(true);
      setSiteLogs(updated);
      onRefreshData();
    } catch (err) {
      showFeedback('error', 'อัปเดตไม่สำเร็จ: ' + err.message);
    }
  };

  // Helper to ensure image src is always a valid string
  const getImgSrc = (img) => {
    if (!img) return '';
    if (typeof img === 'string') return img;
    if (typeof img === 'object' && img.dataUrl) return img.dataUrl;
    return '';
  };

  // ========================================================
  // SETTINGS & PROFILE HANDLERS
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
      const dataUrl = await compressUltraCompact(file, 400, 400, 0.85);
      setProfile({ ...profile, avatar: dataUrl });
      showFeedback('success', 'บีบอัดรูปโปรไฟล์พร้อมบันทึกแล้ว');
    } catch (err) {
      showFeedback('error', 'บีบอัดรูปไม่สำเร็จ: ' + err.message);
    }
  };

  const handleCoverUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      showFeedback('info', 'กำลังบีบอัดภาพปกให้เล็กที่สุดแต่คมชัด...');
      const dataUrl = await compressUltraCompact(file, 1600, 600, 0.82);
      setProfile({ ...profile, cover: dataUrl, coverImage: dataUrl });
      showFeedback('success', 'บีบอัดภาพปกพร้อมบันทึกแล้ว');
    } catch (err) {
      showFeedback('error', 'บีบอัดรูปไม่สำเร็จ: ' + err.message);
    }
  };

  // Available offcuts for reuse dropdown
  const availableOffcutsForType = rebarOffcuts.filter(
    o => o.status === 'available' && 
    (o.rebarType === rebarForm.rebarType || o.barType === rebarForm.rebarType) &&
    o.length >= (rebarForm.cutLength || 0)
  );

  const selectedOffcut = rebarOffcuts.find(o => o.id === rebarForm.reusedOffcutId);
  const currentCalc = calculateRebarMetrics(
    rebarForm.standardLength,
    rebarForm.cutLength,
    rebarForm.quantity,
    rebarForm.rebarType,
    rebarForm.isReusedOffcut,
    selectedOffcut?.length,
    rebarForm
  );

  // ฟังก์ชันลบรายการเศษเหล็กออกจากคลัง (ข้อกำหนด 6)
  const handleDeleteOffcut = async (id, e) => {
    if (e) e.stopPropagation();
    if (!window.confirm('คุณต้องการลบรายการเศษเหล็กนี้ออกจากระบบใช่หรือไม่?')) return;
    try {
      await api.deleteRebarOffcut(id);
      showFeedback('success', 'ลบรายการเศษเหล็กออกจากระบบเรียบร้อย');
      loadRebarData();
    } catch (err) {
      showFeedback('error', 'ลบเศษเหล็กไม่สำเร็จ: ' + err.message);
    }
  };

  const filteredOffcuts = rebarOffcuts.filter(o => offcutFilter === 'all' || o.status === offcutFilter);
  const unreadMessagesCount = messages.filter(m => m.status === 'unread').length;

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
                จัดการผลงาน ถอดเหล็กเส้น คลังเศษเหล็ก ตรวจหน้างาน และข้อความจ้างงาน
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

          {/* Rebar & Offcuts Main Tab */}
          <button
            onClick={() => setActiveTab('rebar')}
            className={`px-3 py-2 rounded-xl flex items-center gap-1.5 whitespace-nowrap transition-colors ${
              activeTab === 'rebar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold text-emerald-600 dark:text-emerald-400'
            }`}
          >
            <Boxes className="w-4 h-4 text-amber-500" /> ถอดเหล็กเส้น & คลังเศษ ({rebarItems.length})
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
            <Lock className="w-4 h-4" /> ข้อมูลส่วนตัว (PIN)
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
            <Database className="w-4 h-4" /> สถานะระบบ & Database
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">

          {/* ========================================================
              TAB: REBAR CUT LIST & OFFCUT INVENTORY
             ======================================================== */}
          {activeTab === 'rebar' && (
            <div className="space-y-6">
              
              {/* Header & Sub-Tab Switcher */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Boxes className="w-5 h-5 text-emerald-500" />
                    <span>งานถอดเหล็กเส้น (BBS) & ระบบคลังเศษเหล็กนำกลับมาใช้</span>
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คำนวณเส้นเต็ม เศษเหลือ นำเศษกลับมาใช้ ระบุปลายทาง และซิงก์ AutoCAD/SketchUp สองทิศทาง
                  </p>
                </div>
                
                {/* Sub-tab Pill Switcher */}
                <div className="flex items-center gap-1.5 p-1 bg-slate-200 dark:bg-slate-800 rounded-2xl">
                  <button
                    onClick={() => setRebarSubTab('bbs')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      rebarSubTab === 'bbs'
                        ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    1. ตารางตัดเหล็กเส้น (BBS)
                  </button>
                  <button
                    onClick={() => setRebarSubTab('offcuts')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      rebarSubTab === 'offcuts'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <Recycle className="w-3.5 h-3.5" />
                    <span>2. คลังเศษเหล็กสะสม ({rebarOffcuts.filter(o => o.status === 'available').length})</span>
                  </button>
                  <button
                    onClick={() => setRebarSubTab('guide')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                      rebarSubTab === 'guide'
                        ? 'bg-indigo-600 text-white shadow'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                    }`}
                  >
                    <FileCode2 className="w-3.5 h-3.5" />
                    <span>3. วิธีใช้งานใน CAD & SketchUp</span>
                  </button>
                </div>
              </div>

              {/* Sub-Tab 1: BBS Cut List */}
              {rebarSubTab === 'bbs' && (
                <div className="space-y-6">
                  {/* Summary Metric Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">เหล็กมาตรฐานที่ต้องสั่ง</div>
                      <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
                        {rebarSummary?.totalStandardBars || rebarSummary?.barsNeeded || 0} <span className="text-xs font-normal text-slate-500">เส้น</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">ความยาวตัดใช้จริง</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {rebarSummary?.totalCutLength || rebarSummary?.totalCutMeters || 0} <span className="text-xs font-normal text-slate-500">ม.</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">เศษเหล็กคงเหลือรวม</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {rebarSummary?.totalScrapLength || rebarSummary?.totalOffcutMeters || 0} <span className="text-xs font-normal text-slate-500">ม.</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">จำนวนท่อนเศษคงเหลือ</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {rebarItems.reduce((acc, itm) => {
                          const ob = itm.offcutPerBar || 0;
                          if (ob <= 0 || itm.isReusedOffcut) return acc;
                          const pcs = itm.piecesPerBar || itm.piecesPerStandardBar || 1;
                          const bn = itm.standardBarsNeeded !== undefined ? itm.standardBarsNeeded : (itm.barsNeeded || 0);
                          const q = itm.offcutQuantity !== undefined && itm.offcutQuantity !== null ? Number(itm.offcutQuantity) : (pcs > 1 ? Math.max(1, Math.floor(bn / pcs)) : bn);
                          return acc + (q || 0);
                        }, 0)} <span className="text-xs font-normal text-slate-500">ท่อน</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 sm:col-span-1">
                      <div className="text-[11px] font-semibold text-slate-500">น้ำหนักเหล็กตัดใช้</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {rebarSummary?.totalWeightTons || (rebarSummary?.totalWeightKg ? (rebarSummary.totalWeightKg / 1000).toFixed(2) : 0)} <span className="text-xs font-normal text-slate-500">ตัน</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Integration Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRebarItem(null);
                          setRebarForm({
                            group: availableRebarGroups[0] || 'งานเสา',
                            label: '',
                            materialCategory: 'rebar',
                            rebarType: 'DB20',
                            standardLength: 12,
                            cutLength: 6.0,
                            quantity: 1,
                            usedFor: '',
                            note: '',
                            isReusedOffcut: false,
                            reusedOffcutId: '',
                            subCategory: 'H-Beam',
                            customType: false,
                            customSize: '',
                            customWeight: '',
                            plateWidth: 300,
                            plateLength: 300,
                            plateThickness: 6,
                            plateWeightKg: 4.24,
                            jboltSize: 'DB16',
                            jboltLength: 0.40,
                            jboltQtyPerPlate: 4,
                            nutQtyPerPlate: 4,
                            washerQtyPerPlate: 4,
                            pvcType: 'pipe',
                            fittingName: 'ข้อต่อตรง',
                            fittingSize: '2"'
                          });
                          setIsRebarEditorOpen(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
                      >
                        <Plus className="w-4 h-4" /> เพิ่มรายการถอดเหล็ก (BBS)
                      </button>
                      <button
                        type="button"
                        onClick={() => loadRebarData(true)}
                        className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${rebarLoading ? 'animate-spin' : ''}`} /> ซิงก์ทันที
                      </button>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <a
                        href={api.getAutoCADPluginUrl()}
                        download="rebar_sync.lsp"
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> โหลดปลั๊กอิน AutoCAD (.lsp)
                      </a>
                      <a
                        href={api.getSketchUpPluginUrl()}
                        download="rebar_live_sync.rb"
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <Download className="w-3.5 h-3.5" /> โหลดปลั๊กอิน SketchUp (.rb)
                      </a>
                      <a
                        href={api.getRebarXlsxUrl()}
                        download
                        className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <FileSpreadsheet className="w-3.5 h-3.5" /> ส่งออก Excel (.xlsx)
                      </a>
                    </div>
                  </div>

                  {/* Filter Pills Bar: กลุ่ม/หมวดหมู่ & ขนาดเหล็ก (ข้อกำหนด 9, 11) */}
                  <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                          🏗️ กรองตามกลุ่ม/หมวด:
                        </span>
                        <button
                          type="button"
                          onClick={() => setSelectedRebarGroup('ทั้งหมด')}
                          className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                            selectedRebarGroup === 'ทั้งหมด'
                              ? 'bg-emerald-600 text-white shadow-sm'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                          }`}
                        >
                          ทั้งหมด ({rebarItems.length})
                        </button>
                        {availableRebarGroups.map(grp => (
                          <button
                            key={grp}
                            type="button"
                            onClick={() => setSelectedRebarGroup(grp)}
                            className={`px-3 py-1 rounded-xl text-xs font-semibold transition-all ${
                              selectedRebarGroup === grp
                                ? 'bg-emerald-600 text-white shadow-sm'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                            }`}
                          >
                            {grp}
                          </button>
                        ))}
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setShowPerGroupBreakdown(!showPerGroupBreakdown)}
                          className={`px-3 py-1 rounded-xl text-xs font-bold border transition-all ${
                            showPerGroupBreakdown
                              ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                              : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                          }`}
                        >
                          {showPerGroupBreakdown ? '📊 แสดงสรุปแบบรวม' : '📑 สรุปแยกรายหมวดหมู่ (ข้อ 11)'}
                        </button>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                        📏 กรองตามขนาดเหล็ก (เรียงเล็กไปใหญ่):
                      </span>
                      <button
                        type="button"
                        onClick={() => setSelectedRebarSize('ทั้งหมด')}
                        className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                          selectedRebarSize === 'ทั้งหมด'
                            ? 'bg-amber-500 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        ทุกขนาด
                      </button>
                      {availableRebarSizes.map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => setSelectedRebarSize(sz)}
                          className={`px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                            selectedRebarSize === sz
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                          }`}
                        >
                          {sz}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ========================================================
                      งานสรุปแยกแต่ละหมวดหมู่วัสดุ ไม่รวมกัน (ข้อกำหนด 2)
                     ======================================================== */}
                  <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
                    <span className="text-xs font-bold px-2 text-slate-700 dark:text-slate-300">
                      📑 แยกหมวดสรุปวัสดุ:
                    </span>
                    {[
                      { id: 'all', label: 'ดูทุกหมวดแยกตาราง' },
                      { id: 'rebar', icon: '🔩', label: 'เหล็กเส้น' },
                      { id: 'concrete', icon: '🧱', label: 'ปูนคอนกรีต' },
                      { id: 'beam', icon: '🏗️', label: 'เหล็กบีม' },
                      { id: 'plate', icon: '⬛', label: 'เหล็กเพลท & J-Bolt' },
                      { id: 'box_c_pipe', icon: '📦', label: 'กล่อง/C/ท่อ' },
                      { id: 'pvc', icon: '💧', label: 'ท่อ PVC & ข้อต่อ' }
                    ].map(tab => (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSummaryTabFilter(tab.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                          summaryTabFilter === tab.id
                            ? 'bg-emerald-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:text-slate-900'
                        }`}
                      >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* 1. สรุปหมวดงานเหล็กเส้น (มอก.) */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'rebar') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-gradient-to-r from-emerald-500/10 to-teal-500/10">
                        <div>
                          <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                            <span>🔩 ตารางสรุปงานเหล็กเส้นมาตรฐาน (มอก. 24-2559 / 20-2559):</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-extrabold">
                              {selectedRebarGroup === 'ทั้งหมด' ? 'ทุกหมวด' : `หมวด ${selectedRebarGroup}`}
                            </span>
                          </h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            แสดงจำนวนเส้นมาตรฐานที่ต้องสั่ง แยกตามสเปก 10m และ 12m (เรียงจากเล็กไปหามาก)
                          </p>
                        </div>
                        <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl text-xs">
                          <span className="text-[11px] px-2 font-bold text-slate-500">ดูสเปก:</span>
                          <button
                            type="button"
                            onClick={() => setLengthViewFilter('all')}
                            className={`px-2.5 py-1 rounded-lg font-bold ${lengthViewFilter === 'all' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            ทั้งหมด (10m, 12m)
                          </button>
                          <button
                            type="button"
                            onClick={() => setLengthViewFilter('10')}
                            className={`px-2.5 py-1 rounded-lg font-bold ${lengthViewFilter === '10' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            เฉพาะ 10m
                          </button>
                          <button
                            type="button"
                            onClick={() => setLengthViewFilter('12')}
                            className={`px-2.5 py-1 rounded-lg font-bold ${lengthViewFilter === '12' ? 'bg-white dark:bg-slate-900 text-emerald-600 shadow-sm' : 'text-slate-600 dark:text-slate-400'}`}
                          >
                            เฉพาะ 12m
                          </button>
                        </div>
                      </div>

                      {categorySummaries.rebar.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการเหล็กเส้นในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">ขนาดเหล็ก (มอก.)</th>
                                {(lengthViewFilter === 'all' || lengthViewFilter === '10') && (
                                  <th className="p-3 text-right text-blue-700 dark:text-blue-400">เส้น (10 ม.)</th>
                                )}
                                {(lengthViewFilter === 'all' || lengthViewFilter === '12') && (
                                  <th className="p-3 text-right text-indigo-700 dark:text-indigo-400">เส้น (12 ม.)</th>
                                )}
                                <th className="p-3 text-right font-black text-slate-900 dark:text-white">รวมจำนวนเส้น</th>
                                <th className="p-3 text-right">ความยาวตัดจริง (ม.)</th>
                                <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                                <th className="p-3 text-right text-indigo-600 dark:text-indigo-400">น้ำหนักรวม (ตัน)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.rebar.rows.map(row => (
                                <tr key={row.type} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    <span className="px-2.5 py-1 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-extrabold border border-amber-200 dark:border-amber-800/60">
                                      {row.type}
                                    </span>
                                  </td>
                                  {(lengthViewFilter === 'all' || lengthViewFilter === '10') && (
                                    <td className="p-3 text-right font-semibold text-blue-600 dark:text-blue-400">
                                      {row.bars10m > 0 ? `${row.bars10m} เส้น` : '-'}
                                    </td>
                                  )}
                                  {(lengthViewFilter === 'all' || lengthViewFilter === '12') && (
                                    <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                      {row.bars12m > 0 ? `${row.bars12m} เส้น` : '-'}
                                    </td>
                                  )}
                                  <td className="p-3 text-right font-black text-slate-900 dark:text-white text-sm">
                                    {row.totalBars} เส้น
                                  </td>
                                  <td className="p-3 text-right text-slate-700 dark:text-slate-300">
                                    {row.totalCutMeters.toFixed(2)} ม.
                                  </td>
                                  <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                                    {row.totalCutWeightKg.toFixed(2)} กก.
                                  </td>
                                  <td className="p-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                                    {(row.totalCutWeightKg / 1000).toFixed(3)} ตัน
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-slate-100/80 dark:bg-slate-800/70 font-black text-slate-900 dark:text-white border-t-2 border-slate-300 dark:border-slate-700">
                                <td className="p-3">รวมเหล็กเส้นทั้งหมด</td>
                                {(lengthViewFilter === 'all' || lengthViewFilter === '10') && (
                                  <td className="p-3 text-right text-blue-600 dark:text-blue-400">
                                    {categorySummaries.rebar.grand.bars10m} เส้น
                                  </td>
                                )}
                                {(lengthViewFilter === 'all' || lengthViewFilter === '12') && (
                                  <td className="p-3 text-right text-indigo-600 dark:text-indigo-400">
                                    {categorySummaries.rebar.grand.bars12m} เส้น
                                  </td>
                                )}
                                <td className="p-3 text-right text-sm">
                                  {categorySummaries.rebar.grand.totalBars} เส้น
                                </td>
                                <td className="p-3 text-right">
                                  {categorySummaries.rebar.grand.totalCutMeters.toFixed(2)} ม.
                                </td>
                                <td className="p-3 text-right">
                                  {categorySummaries.rebar.grand.totalCutWeightKg.toFixed(2)} กก.
                                </td>
                                <td className="p-3 text-right text-indigo-600 dark:text-indigo-400">
                                  {(categorySummaries.rebar.grand.totalCutWeightKg / 1000).toFixed(3)} ตัน
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 2. สรุปหมวดงานปูนคอนกรีต */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'concrete') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-amber-500/10 to-orange-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🧱 ตารางสรุปงานปูนคอนกรีต (ปริมาตรคิว m³):</span>
                        </h4>
                        <p className="text-[11px] text-slate-500 mt-0.5">
                          สรุปยอดสั่งปูนคอนกรีตผสมเสร็จ แยกตามระดับกำลังอัด (Strength ksc)
                        </p>
                      </div>
                      {categorySummaries.concrete.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการปูนคอนกรีตในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">กำลังอัดคอนกรีต (Strength)</th>
                                <th className="p-3 text-right">จำนวนชิ้นส่วน</th>
                                <th className="p-3 text-right">ปริมาตรสุทธิ (คิว)</th>
                                <th className="p-3 text-right">เผื่อเทรวม (คิว)</th>
                                <th className="p-3 text-right font-black text-amber-600 dark:text-amber-400">ปริมาตรรวมสั่ง (คิว)</th>
                                <th className="p-3 text-right">น้ำหนักประมาณการ (ตัน)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.concrete.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">
                                    <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 font-bold">
                                      {row.strength}
                                    </span>
                                  </td>
                                  <td className="p-3 text-right">{row.count} จุด/ชิ้น</td>
                                  <td className="p-3 text-right">{row.netVolume.toFixed(2)} คิว</td>
                                  <td className="p-3 text-right text-slate-500">+{row.wasteVolume.toFixed(2)} คิว</td>
                                  <td className="p-3 text-right font-black text-amber-600 dark:text-amber-400 text-sm">
                                    {row.totalVolume.toFixed(2)} คิว
                                  </td>
                                  <td className="p-3 text-right font-bold text-slate-700 dark:text-slate-300">
                                    {(row.totalWeightKg / 1000).toFixed(3)} ตัน
                                  </td>
                                </tr>
                              ))}
                              <tr className="bg-amber-50/80 dark:bg-amber-950/40 font-black text-slate-900 dark:text-white border-t-2 border-amber-300 dark:border-amber-700">
                                <td className="p-3">รวมปูนคอนกรีตทั้งหมด</td>
                                <td className="p-3 text-right">{categorySummaries.concrete.grand.count} จุด/ชิ้น</td>
                                <td className="p-3 text-right">{categorySummaries.concrete.grand.netVolume.toFixed(2)} คิว</td>
                                <td className="p-3 text-right">+{categorySummaries.concrete.grand.wasteVolume.toFixed(2)} คิว</td>
                                <td className="p-3 text-right text-amber-700 dark:text-amber-300 text-sm">
                                  {categorySummaries.concrete.grand.totalVolume.toFixed(2)} คิว
                                </td>
                                <td className="p-3 text-right">
                                  {(categorySummaries.concrete.grand.totalWeightKg / 1000).toFixed(3)} ตัน
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 3. สรุปหมวดงานเหล็กบีม */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'beam') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>🏗️ ตารางสรุปงานเหล็กบีม (H-Beam / I-Beam / WF):</span>
                        </h4>
                      </div>
                      {categorySummaries.beam.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการเหล็กบีมในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">ขนาดเหล็กบีม</th>
                                <th className="p-3 text-right">ท่อน (6 ม.)</th>
                                <th className="p-3 text-right">ท่อน (9 ม.)</th>
                                <th className="p-3 text-right">ท่อน (12 ม.)</th>
                                <th className="p-3 text-right font-black text-blue-600">รวมจำนวนท่อน</th>
                                <th className="p-3 text-right">ความยาวรวม (ม.)</th>
                                <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                                <th className="p-3 text-right font-bold text-blue-600">น้ำหนักรวม (ตัน)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.beam.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{row.size}</td>
                                  <td className="p-3 text-right">{row.bars6m > 0 ? `${row.bars6m} ท่อน` : '-'}</td>
                                  <td className="p-3 text-right">{row.bars9m > 0 ? `${row.bars9m} ท่อน` : '-'}</td>
                                  <td className="p-3 text-right">{row.bars12m > 0 ? `${row.bars12m} ท่อน` : '-'}</td>
                                  <td className="p-3 text-right font-black text-blue-600">{row.totalBars} ท่อน</td>
                                  <td className="p-3 text-right">{row.totalMeters.toFixed(2)} ม.</td>
                                  <td className="p-3 text-right">{row.totalWeightKg.toFixed(2)} กก.</td>
                                  <td className="p-3 text-right font-bold text-blue-600">{(row.totalWeightKg / 1000).toFixed(3)} ตัน</td>
                                </tr>
                              ))}
                              <tr className="bg-blue-50/80 dark:bg-blue-950/40 font-black text-slate-900 dark:text-white border-t-2 border-blue-300 dark:border-blue-700">
                                <td className="p-3">รวมเหล็กบีมทั้งหมด</td>
                                <td className="p-3 text-right">-</td>
                                <td className="p-3 text-right">-</td>
                                <td className="p-3 text-right">-</td>
                                <td className="p-3 text-right text-blue-700 dark:text-blue-300">{categorySummaries.beam.grand.totalBars} ท่อน</td>
                                <td className="p-3 text-right">{categorySummaries.beam.grand.totalMeters.toFixed(2)} ม.</td>
                                <td className="p-3 text-right">{categorySummaries.beam.grand.totalWeightKg.toFixed(2)} กก.</td>
                                <td className="p-3 text-right">{(categorySummaries.beam.grand.totalWeightKg / 1000).toFixed(3)} ตัน</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 4. สรุปหมวดงานเหล็กเพลท & J-Bolt */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'plate') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-purple-500/10 to-indigo-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>⬛ ตารางสรุปงานเหล็กเพลท & J-Bolt:</span>
                        </h4>
                      </div>
                      {categorySummaries.plate.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการเหล็กเพลทในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">ขนาดเพลท</th>
                                <th className="p-3 text-right">จำนวนแผ่น</th>
                                <th className="p-3 text-right">น้ำหนักเพลท (กก.)</th>
                                <th className="p-3">สเปก J-Bolt</th>
                                <th className="p-3 text-right">J-Bolt (ชุด)</th>
                                <th className="p-3 text-right">น้ำหนัก J-Bolt (กก.)</th>
                                <th className="p-3 text-right">น็อต/แหวน (ตัว)</th>
                                <th className="p-3 text-right font-black text-purple-600">น้ำหนักรวมทั้งสิ้น (กก.)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.plate.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{row.size}</td>
                                  <td className="p-3 text-right font-bold">{row.quantity} แผ่น</td>
                                  <td className="p-3 text-right">{row.plateWeightKg.toFixed(2)} กก.</td>
                                  <td className="p-3">{row.jboltSpec}</td>
                                  <td className="p-3 text-right">{row.totalJBolts} ชุด</td>
                                  <td className="p-3 text-right">{row.totalJBoltWeightKg.toFixed(2)} กก.</td>
                                  <td className="p-3 text-right">{row.totalNuts} / {row.totalWashers}</td>
                                  <td className="p-3 text-right font-black text-purple-600">{row.totalWeightKg.toFixed(2)} กก.</td>
                                </tr>
                              ))}
                              <tr className="bg-purple-50/80 dark:bg-purple-950/40 font-black text-slate-900 dark:text-white border-t-2 border-purple-300 dark:border-purple-700">
                                <td className="p-3">รวมเพลท & J-Bolt ทั้งหมด</td>
                                <td className="p-3 text-right">{categorySummaries.plate.grand.quantity} แผ่น</td>
                                <td className="p-3 text-right">{categorySummaries.plate.grand.plateWeightKg.toFixed(2)} กก.</td>
                                <td className="p-3">-</td>
                                <td className="p-3 text-right">{categorySummaries.plate.grand.totalJBolts} ชุด</td>
                                <td className="p-3 text-right">{categorySummaries.plate.grand.totalJBoltWeightKg.toFixed(2)} กก.</td>
                                <td className="p-3 text-right">{categorySummaries.plate.grand.totalNuts} / {categorySummaries.plate.grand.totalWashers}</td>
                                <td className="p-3 text-right text-purple-700 dark:text-purple-300">{categorySummaries.plate.grand.totalWeightKg.toFixed(2)} กก.</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 5. สรุปหมวดงานเหล็กรูปพรรณ (กล่อง/C/ท่อ) */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'box_c_pipe') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-orange-500/10 to-amber-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>📦 ตารางสรุปงานเหล็กรูปพรรณ (เหล็กกล่อง, ตัวซี C, ท่อกลม):</span>
                        </h4>
                      </div>
                      {categorySummaries.box.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการเหล็กรูปพรรณในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">ชนิด / ขนาดเหล็ก</th>
                                <th className="p-3 text-right">จำนวนท่อน (6 ม.)</th>
                                <th className="p-3 text-right">ความยาวรวม (ม.)</th>
                                <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                                <th className="p-3 text-right font-black text-orange-600">น้ำหนักรวม (ตัน)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.box.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{row.size}</td>
                                  <td className="p-3 text-right font-black text-orange-600">{row.totalBars} ท่อน</td>
                                  <td className="p-3 text-right">{row.totalMeters.toFixed(2)} ม.</td>
                                  <td className="p-3 text-right">{row.totalWeightKg.toFixed(2)} กก.</td>
                                  <td className="p-3 text-right font-bold text-orange-600">{(row.totalWeightKg / 1000).toFixed(3)} ตัน</td>
                                </tr>
                              ))}
                              <tr className="bg-orange-50/80 dark:bg-orange-950/40 font-black text-slate-900 dark:text-white border-t-2 border-orange-300 dark:border-orange-700">
                                <td className="p-3">รวมเหล็กรูปพรรณทั้งหมด</td>
                                <td className="p-3 text-right text-orange-700 dark:text-orange-300">{categorySummaries.box.grand.totalBars} ท่อน</td>
                                <td className="p-3 text-right">{categorySummaries.box.grand.totalMeters.toFixed(2)} ม.</td>
                                <td className="p-3 text-right">{categorySummaries.box.grand.totalWeightKg.toFixed(2)} กก.</td>
                                <td className="p-3 text-right">{(categorySummaries.box.grand.totalWeightKg / 1000).toFixed(3)} ตัน</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 6. สรุปหมวดงานท่อ PVC & ข้อต่อ */}
                  {(summaryTabFilter === 'all' || summaryTabFilter === 'pvc') && (
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                      <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-gradient-to-r from-cyan-500/10 to-blue-500/10">
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                          <span>💧 ตารางสรุปงานท่อ PVC และอุปกรณ์ข้อต่อ/วาล์ว:</span>
                        </h4>
                      </div>
                      {categorySummaries.pvc.rows.length === 0 ? (
                        <div className="p-6 text-center text-slate-400 text-xs">ไม่มีรายการท่อ PVC ในระบบ</div>
                      ) : (
                        <div className="overflow-x-auto">
                          <table className="w-full text-xs text-left">
                            <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                              <tr>
                                <th className="p-3">ชนิด / ขนาด</th>
                                <th className="p-3 text-right">จำนวนท่อน (4 ม.)</th>
                                <th className="p-3 text-right">จำนวนอุปกรณ์ (ชิ้น/ตัว)</th>
                                <th className="p-3 text-right">ความยาวรวม (ม.)</th>
                                <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                              {categorySummaries.pvc.rows.map((row, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40">
                                  <td className="p-3 font-bold text-slate-900 dark:text-white">{row.name}</td>
                                  <td className="p-3 text-right">{row.isFitting ? '-' : `${row.bars4m} ท่อน`}</td>
                                  <td className="p-3 text-right font-bold text-cyan-600">{row.isFitting ? `${row.pieces} ตัว` : '-'}</td>
                                  <td className="p-3 text-right">{row.isFitting ? '-' : `${row.totalMeters.toFixed(2)} ม.`}</td>
                                  <td className="p-3 text-right">{row.isFitting ? '-' : `${row.totalWeightKg.toFixed(2)} กก.`}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}

                  {/* ========================================================
                      ตารางรายการถอดเหล็กเส้น (BBS Cut List Table)
                      แสดงตามขนาดเหล็กจากเล็กไปหามาก (ข้อกำหนด 9)
                     ======================================================== */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300">
                          ตารางถอดเหล็กเส้นและคำนวณเศษคงเหลือ ({rebarItems.length} รายการ)
                        </h4>
                        <p className="text-[11px] text-slate-400">
                          เรียงลำดับขนาดเหล็กจากเล็กไปหามาก (RB6 &rarr; DB12 &rarr; DB20 &rarr; เหล็กบีม)
                        </p>
                      </div>
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={rebarAutoSync}
                          onChange={(e) => setRebarAutoSync(e.target.checked)}
                          className="rounded text-emerald-600 w-3.5 h-3.5"
                        />
                        <span>Auto-Sync 5s</span>
                      </label>
                    </div>

                    {rebarItems.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs">
                        ยังไม่มีรายการถอดเหล็กเส้น กดปุ่ม "เพิ่มรายการถอดเหล็ก (BBS)" ด้านบน
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
                              <th className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">ท่อนเศษ</th>
                              <th className="p-3 text-right">น้ำหนักรวม (กก.)</th>
                              <th className="p-3 text-center">ผังตัด</th>
                              <th className="p-3 text-center">จัดการ</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {[...rebarItems]
                              .filter(item => {
                                const matchGrp = selectedRebarGroup === 'ทั้งหมด' || (item.group || item.category || 'งานโครงสร้างทั่วไป') === selectedRebarGroup;
                                const matchSz = selectedRebarSize === 'ทั้งหมด' || (item.rebarType || item.barType || '').toUpperCase() === selectedRebarSize;
                                return matchGrp && matchSz;
                              })
                              .sort((a, b) => getRebarSortRank(a.rebarType || a.barType) - getRebarSortRank(b.rebarType || b.barType))
                              .map((item) => {
                                const stdLen = item.standardLength || 12;
                                const cutLen = item.cutLength || 0;
                                const cutPercent = Math.min(100, (cutLen / stdLen) * 100);
                                const pieces = item.piecesPerBar || item.piecesPerStandardBar || 1;
                                const barsNeeded = item.standardBarsNeeded !== undefined ? item.standardBarsNeeded : (item.barsNeeded || 0);
                                const offcutPerBar = item.offcutPerBar || 0;
                                const scrapPercent = item.scrapPercent !== undefined ? item.scrapPercent : (item.wastePercent || 0);
                                const weightKg = item.totalWeightKg !== undefined ? item.totalWeightKg : (item.weightKg || 0);
                                const barType = item.rebarType || item.barType || 'DB20';
                                const label = item.label || item.member || 'ชิ้นส่วน';
                                const groupName = item.group || item.category || 'งานโครงสร้างทั่วไป';

                                return (
                                  <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                    <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                      <div className="flex items-center gap-1.5 flex-wrap">
                                        <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-[10px] font-bold">
                                          {groupName}
                                        </span>
                                        {item.materialCategory === 'plate' && (
                                          <span className="px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                                            เหล็กเพลท
                                          </span>
                                        )}
                                        {item.materialCategory === 'beam' && (
                                          <span className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                                            เหล็กบีม
                                          </span>
                                        )}
                                        {item.materialCategory === 'box_c_pipe' && (
                                          <span className="px-1.5 py-0.5 rounded bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300 text-[10px] font-bold">
                                            เหล็กรูปพรรณ
                                          </span>
                                        )}
                                        {item.materialCategory === 'pvc' && (
                                          <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300 text-[10px] font-bold">
                                            ท่อ PVC
                                          </span>
                                        )}
                                        {item.isReusedOffcut && (
                                          <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-bold">
                                            ดึงเศษมาใช้
                                          </span>
                                        )}
                                        <span>{label}</span>
                                      </div>
                                      {(item.usedFor || item.note) && (
                                        <span className="block text-[10px] font-normal text-slate-400 mt-0.5">
                                          {item.usedFor || item.note}
                                        </span>
                                      )}
                                      {item.materialCategory === 'plate' && (
                                        <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-1">
                                          🔩 J-Bolt: {item.jboltSize || 'DB16'} ({item.totalJBolts || (item.quantity * (item.jboltQtyPerPlate || 4))} ตัว) | น็อต {item.totalNuts || (item.quantity * 4)} ตัว | แหวน {item.totalWashers || (item.quantity * 4)} ตัว
                                        </div>
                                      )}
                                    </td>
                                    <td className="p-3">
                                      <span className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-300 font-bold border border-amber-200 dark:border-amber-800/40">
                                        {barType}
                                      </span>
                                    </td>
                                    <td className="p-3 text-slate-500">
                                      {item.materialCategory === 'plate' ? (
                                        `เพลท ${item.plateWidth || 300}x${item.plateLength || 300}x${item.plateThickness || 6}mm`
                                      ) : item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve') ? (
                                        `ข้อต่อ ${item.fittingSize || '2"'}`
                                      ) : item.isReusedOffcut ? (
                                        'จากเศษสต็อก'
                                      ) : (
                                        `เส้นมาตรฐาน ${stdLen}m`
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                                      {item.materialCategory === 'plate' || (item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve')) ? '-' : `${cutLen} ม.`}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-slate-900 dark:text-white">
                                      {item.quantity} {item.materialCategory === 'plate' ? 'แผ่น' : 'ชิ้น'}
                                    </td>
                                    <td className="p-3 text-right font-bold text-emerald-600 dark:text-emerald-400 text-sm">
                                      {item.materialCategory === 'plate' || (item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve')) ? '-' : (
                                        <>{barsNeeded} <span className="text-[10px] font-normal text-slate-400">เส้น</span></>
                                      )}
                                    </td>
                                    <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400 text-xs">
                                      {item.materialCategory === 'plate' || (item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve')) ? '-' : (item.offcutDisplay || (offcutPerBar > 0 ? `${offcutPerBar} ม.` : '-'))}
                                    </td>
                                    <td className="p-3 text-right font-bold">
                                      {item.materialCategory === 'plate' || (item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve')) ? (
                                        <span className="text-slate-400 font-normal">-</span>
                                      ) : (() => {
                                        const offcutPieces = item.offcutQuantity !== undefined && item.offcutQuantity !== null && item.offcutQuantity !== ''
                                          ? Number(item.offcutQuantity)
                                          : (item.offcutPiecesList && item.offcutPiecesList.length > 0)
                                            ? item.offcutPiecesList.reduce((acc, o) => acc + o.quantity, 0)
                                            : ((offcutPerBar > 0 && !item.isReusedOffcut)
                                                ? (pieces > 1 ? Math.max(1, Math.floor(barsNeeded / pieces)) : barsNeeded)
                                                : 0);
                                        return offcutPieces > 0 ? (
                                          <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50">
                                            {offcutPieces} ท่อน
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-normal">-</span>
                                        );
                                      })()}
                                    </td>
                                    <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                      {weightKg} กก.
                                    </td>
                                    <td className="p-3 text-center min-w-[130px]">
                                      {item.materialCategory === 'plate' ? (
                                        <div className="text-[10px] text-purple-600 dark:text-purple-400">
                                          รวมเพลท {((item.plateWeightKg || 4.24) * item.quantity).toFixed(2)} กก.
                                        </div>
                                      ) : item.materialCategory === 'pvc' && (item.pvcType === 'fitting' || item.pvcType === 'valve') ? (
                                        <span className="text-[10px] text-cyan-600">อุปกรณ์ข้อต่อ/วาล์ว</span>
                                      ) : (
                                        <>
                                          <div className="w-full bg-slate-200 dark:bg-slate-700 h-3 rounded-full overflow-hidden flex" title={`ตัด ${pieces} ชิ้น ชิ้นละ ${cutLen}m, เศษเหลือ ${offcutPerBar}m`}>
                                            {Array.from({ length: pieces }).map((_, pIdx) => (
                                              <div
                                                key={pIdx}
                                                style={{ width: `${cutPercent}%` }}
                                                className="bg-emerald-500 border-r border-slate-950/20"
                                              />
                                            ))}
                                            {offcutPerBar > 0 && (
                                              <div className="bg-amber-400 flex-1" />
                                            )}
                                          </div>
                                          <span className="text-[9px] text-slate-400 mt-0.5 block">
                                            ตัดได้ {pieces} ท่อน/เส้น
                                          </span>
                                        </>
                                      )}
                                    </td>
                                    <td className="p-3 text-center">
                                      <div className="flex items-center justify-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingRebarItem(item);
                                            setRebarForm({
                                              group: groupName,
                                              label: label,
                                              materialCategory: item.materialCategory || 'rebar',
                                              rebarType: barType,
                                              standardLength: stdLen,
                                              cutLength: cutLen,
                                              quantity: item.quantity,
                                              usedFor: item.usedFor || '',
                                              note: item.note || '',
                                              isReusedOffcut: Boolean(item.isReusedOffcut),
                                              reusedOffcutId: item.reusedOffcutId || '',
                                              subCategory: item.subCategory || 'H-Beam',
                                              customType: Boolean(item.customType),
                                              customSize: item.customSize || '',
                                              customWeight: item.customWeight || '',
                                              plateWidth: item.plateWidth || 300,
                                              plateLength: item.plateLength || 300,
                                              plateThickness: item.plateThickness || 6,
                                              plateWeightKg: item.plateWeightKg || 4.24,
                                              jboltSize: item.jboltSize || 'DB16',
                                              jboltLength: item.jboltLength || 0.40,
                                              jboltQtyPerPlate: item.jboltQtyPerPlate || 4,
                                              nutQtyPerPlate: item.nutQtyPerPlate || 4,
                                              washerQtyPerPlate: item.washerQtyPerPlate || 4,
                                              pvcType: item.pvcType || 'pipe',
                                              fittingName: item.fittingName || 'ข้อต่อตรง',
                                              fittingSize: item.fittingSize || '2"'
                                            });
                                            setIsRebarEditorOpen(true);
                                          }}
                                          className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                                          title="แก้ไข"
                                        >
                                          <Edit2 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          type="button"
                                          onClick={(e) => handleDeleteRebar(item.id, e)}
                                          className="p-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500"
                                          title="ลบ (ไม่ออกจากหน้า)"
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

              {/* Sub-Tab 2: Offcut Rebar Inventory (Requirements 4, 5, 7, 8, 9) */}
              {rebarSubTab === 'offcuts' && (
                <div className="space-y-6">
                  {/* Offcut Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">เศษเหล็กคงเหลือพร้อมใช้</div>
                      <div className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">
                        {rebarOffcuts.filter(o => o.status === 'available').length} <span className="text-xs font-normal text-slate-500">ท่อน</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">ความยาวเศษคงเหลือสะสม</div>
                      <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">
                        {rebarSummary?.totalAvailableScrapMeters || 0} <span className="text-xs font-normal text-slate-500">ม.</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">น้ำหนักเศษคงเหลือรวม</div>
                      <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-1">
                        {rebarSummary?.totalAvailableScrapWeightKg || 0} <span className="text-xs font-normal text-slate-500">กก.</span>
                      </div>
                    </div>
                    <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
                      <div className="text-[11px] font-semibold text-slate-500">เศษที่นำกลับมาใช้แล้ว</div>
                      <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                        {rebarOffcuts.filter(o => o.status === 'used').length} <span className="text-xs font-normal text-slate-500">ท่อน</span>
                      </div>
                    </div>
                  </div>

                  {/* Filter controls */}
                  <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setOffcutFilter('available')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          offcutFilter === 'available'
                            ? 'bg-amber-500 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        ⚡ แสดงเฉพาะเศษเหล็กที่เหลืออยู่ ({rebarOffcuts.filter(o => o.status === 'available').length})
                      </button>
                      <button
                        onClick={() => setOffcutFilter('used')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                          offcutFilter === 'used'
                            ? 'bg-emerald-600 text-white shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        ✅ ประวัติเศษที่นำไปใช้แล้ว ({rebarOffcuts.filter(o => o.status === 'used').length})
                      </button>
                      <button
                        onClick={() => setOffcutFilter('all')}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          offcutFilter === 'all'
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}
                      >
                        ทั้งหมด ({rebarOffcuts.length})
                      </button>
                    </div>

                    <button
                      onClick={() => loadRebarData(true)}
                      className="px-3 py-1.5 text-xs font-semibold rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center gap-1.5"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${rebarLoading ? 'animate-spin' : ''}`} /> รีเฟรชคลัง
                    </button>
                  </div>

                  {/* Offcuts Table */}
                  <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    {filteredOffcuts.length === 0 ? (
                      <div className="p-12 text-center text-slate-400 text-xs">
                        {offcutFilter === 'available' 
                          ? 'ไม่มีเศษเหล็กคงเหลือในสต็อก (เศษทั้งหมดถูกนำไปใช้เรียบร้อยแล้ว)' 
                          : 'ไม่มีรายการเศษเหล็กในหมวดหมู่นี้'}
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-xs text-left">
                          <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200 dark:border-slate-800">
                            <tr>
                              <th className="p-3">แหล่งที่มา</th>
                              <th className="p-3">ชนิดเหล็ก</th>
                              <th className="p-3 text-right font-bold text-amber-600 dark:text-amber-400">ความยาวเศษ (ม.)</th>
                              <th className="p-3 text-right">จำนวน</th>
                              <th className="p-3 text-right">น้ำหนักเศษ (กก.)</th>
                              <th className="p-3">สถานะ</th>
                              <th className="p-3 min-w-[220px]">เศษนำไปใช้ที่ไหน (ระบุเองได้)</th>
                              <th className="p-3 text-center">จัดการตัดยอด</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {filteredOffcuts.map((offcut) => (
                              <tr key={offcut.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                                <td className="p-3 font-semibold text-slate-900 dark:text-white">
                                  {offcut.sourceLabel}
                                  <span className="block text-[10px] font-normal text-slate-400">
                                    {offcut.createdAt?.split('T')[0]}
                                  </span>
                                </td>
                                <td className="p-3">
                                  <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 font-bold text-slate-800 dark:text-slate-200">
                                    {offcut.rebarType || offcut.barType}
                                  </span>
                                </td>
                                <td className="p-3 text-right font-bold text-amber-600 dark:text-amber-400 text-sm">
                                  {offcut.length} ม.
                                </td>
                                <td className="p-3 text-right font-semibold">
                                  {offcut.quantity || 1} ท่อน
                                </td>
                                <td className="p-3 text-right font-semibold text-indigo-600 dark:text-indigo-400">
                                  {offcut.weightKg} กก.
                                </td>
                                <td className="p-3">
                                  {offcut.status === 'available' ? (
                                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-semibold text-[10px]">
                                      ยังเหลืออยู่ (พร้อมใช้)
                                    </span>
                                  ) : (
                                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-semibold text-[10px]">
                                      นำไปใช้แล้ว (ตัดยอดแล้ว)
                                    </span>
                                  )}
                                </td>
                                <td className="p-3">
                                  <div className="flex items-center gap-1.5">
                                    <input
                                      type="text"
                                      defaultValue={offcut.usedFor || ''}
                                      placeholder="เช่น นำไปเสริมคาน B2"
                                      onBlur={(e) => handleUpdateOffcutNote(offcut.id, e.target.value)}
                                      className="flex-1 px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                                    />
                                    <span className="text-[10px] text-slate-400">พิมพ์แล้วคลิกออกเพื่อบันทึก</span>
                                  </div>
                                </td>
                                <td className="p-3 text-center">
                                  {offcut.status === 'available' ? (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleMarkOffcutUsed(offcut)}
                                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1 shadow"
                                      >
                                        <CheckSquare className="w-3.5 h-3.5" />
                                        <span>นำไปใช้แล้ว</span>
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteOffcut(offcut.id, e)}
                                        className="p-1.5 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 text-rose-500 transition-colors"
                                        title="ลบรายการเศษนี้"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center gap-1.5">
                                      <button
                                        type="button"
                                        onClick={() => handleRestoreOffcut(offcut.id)}
                                        className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-slate-600 dark:text-slate-300 text-[10px] font-medium"
                                      >
                                        กู้คืน
                                      </button>
                                      <button
                                        type="button"
                                        onClick={(e) => handleDeleteOffcut(offcut.id, e)}
                                        className="px-2.5 py-1 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 dark:bg-rose-950/40 dark:hover:bg-rose-900/50 dark:text-rose-400 text-[10px] font-medium flex items-center gap-1"
                                        title="ลบรายการนี้"
                                      >
                                        <Trash2 className="w-3 h-3" /> ลบ
                                      </button>
                                    </div>
                                  )}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>
          )}

              {/* Sub-Tab 3: คู่มือและวิธีการนำไปใช้ใน AutoCAD และ SketchUp (ข้อกำหนด 2) */}
              {rebarSubTab === 'guide' && (
                <div className="space-y-6 animate-in fade-in duration-200">
                  
                  {/* Banner Header */}
                  <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-indigo-950 text-white p-6 rounded-3xl border border-indigo-800/40 shadow-xl relative overflow-hidden">
                    <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30 mb-2">
                          <Sparkles className="w-3.5 h-3.5" /> คู่มือการเชื่อมต่อ Real-Time 2 ทิศทาง
                        </div>
                        <h3 className="text-xl font-black text-white">
                          วิธีนำระบบถอดเหล็กเส้น (BBS) & เหล็กบีม ไปใช้ใน AutoCAD และ SketchUp
                        </h3>
                        <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                          เชื่อมต่อโปรแกรมเขียนแบบ AutoCAD (.dwg) และโปรแกรม 3D SketchUp (.skp) เข้ากับฐานข้อมูลบนคลาวด์ ซิงก์ข้อมูลสองทิศทางแบบอัตโนมัติภายใน 5 วินาที
                        </p>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <a
                          href={api.getAutoCADPluginUrl()}
                          download="rebar_sync.lsp"
                          className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                        >
                          <Download className="w-4 h-4" /> โหลดปลั๊กอิน AutoCAD (.lsp)
                        </a>
                        <a
                          href={api.getSketchUpPluginUrl()}
                          download="rebar_live_sync.rb"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg transition-all"
                        >
                          <Download className="w-4 h-4" /> โหลดปลั๊กอิน SketchUp (.rb)
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Section 1: AutoCAD Integration (AutoLISP) */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center font-black text-xl shadow-inner">
                        CAD
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>1. วิธีใช้งานใน AutoCAD (AutoLISP: rebar_sync.lsp)</span>
                          <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[10px] font-bold">
                            รองรับ 10 คำสั่งแยกหมวดชัดเจน
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          ส่งข้อมูลถอดแบบจาก AutoCAD ขึ้น Cloud Database Real-Time 2 ทิศทาง และสั่งวาดตาราง BBS ลงใน Drawing อัตโนมัติ
                        </p>
                      </div>
                    </div>

                    {/* Step 1: APPLOAD */}
                    <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                        <span>ขั้นตอนการติดตั้งและโหลดปลั๊กอินเข้า AutoCAD:</span>
                      </div>
                      <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
                        <li>กดปุ่มสีแดง <b>"โหลดปลั๊กอิน AutoCAD (.lsp)"</b> ด้านบนเพื่อดาวน์โหลดไฟล์ <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-rose-600">rebar_sync.lsp</code></li>
                        <li>เปิดโปรแกรม AutoCAD แล้วพิมพ์คำสั่ง <kbd className="px-2 py-0.5 bg-slate-200 dark:bg-slate-700 rounded font-mono font-bold text-slate-900 dark:text-white">APPLOAD</kbd> แล้วกด Enter</li>
                        <li>เลือกไฟล์ <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono">rebar_sync.lsp</code> แล้วกดปุ่ม <b>Load</b> (แนะนำ: ลากไฟล์เข้าใส่ไอคอนกระเป๋า <b>Startup Suite</b> เพื่อให้โหลดอัตโนมัติทุกครั้งที่เปิด AutoCAD)</li>
                        <li>ที่หน้าต่าง Command Line จะขึ้นข้อความยืนยัน: <span className="text-emerald-600 dark:text-emerald-400 font-bold">[สำเร็จ] โหลดปลั๊กอิน Yutthakan Rebar Sync เรียบร้อย!</span></li>
                      </ol>
                    </div>

                    {/* Step 2: Individual Commands */}
                    <div className="space-y-3">
                      <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-rose-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                        <span>คำสั่งถอดแบบแยกตามหมวดวัสดุ (พิมพ์สั่งการได้โดยตรง):</span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* SYNC_REBAR */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-lg border border-rose-200 dark:border-rose-900/50">
                              SYNC_REBAR (หรือ REBAR_SYNC)
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">🔩 งานเหล็กเส้น (มอก.)</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> พิมพ์คำสั่งแล้วทำตาม 5 ขั้นตอน (ซิงก์ตรงกับระบบเว็บ):
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-1 list-disc list-inside">
                            <li><b>ขั้นตอนที่ 1/5: เลือกกลุ่ม / หมวดงาน:</b> กด [1-N] หรือพิมพ์เลข NO เช่น 100 เพื่อล็อคเข้า "งานเสา NO.100" ในระบบเว็บ หรือกด 0 พิมพ์ใหม่</li>
                            <li><b>ขั้นตอนที่ 2/5: ระบุชื่อส่วนโครงสร้าง:</b> พิมพ์ชื่อชิ้นส่วนได้โดยตรง เช่น เสา C1, คาน B2 หรือกด Enter เพื่อใช้ชื่อเดิม (ไม่มีเบอร์กดและไม่บังคับ NO)</li>
                            <li><b>ขั้นตอนที่ 3/5: เลือกขนาดเหล็กเส้น:</b> พิมพ์หมายเลข [1-11], พิมพ์ขนาดเช่น DB20 หรือกด 99 ดึงเศษสต็อก</li>
                            <li><b>ขั้นตอนที่ 4/5: ความยาวมาตรฐานที่นำมาตัด:</b> เลือกความยาวมาตรฐาน [1]=10.0m หรือ [2]=12.0m</li>
                            <li><b>ขั้นตอนที่ 5/5: ระบุความยาวตัดใช้จริง และจำนวนท่อน:</b> ระบุความยาวตัดใช้จริง (ม.) และจำนวนท่อนที่ต้องการตัด คำนวณเศษจริงแยกตามท่อน</li>
                          </ul>
                        </div>

                        {/* SYNC_CONCRETE */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded-lg border border-amber-200 dark:border-amber-900/50">
                              SYNC_CONCRETE
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">🧱 งานปูนคอนกรีต</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> คิดปริมาณปูนคอนกรีตผสมเสร็จ (คิว m³):
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                            <li>เลือกกำลังอัด (240, 280, 300, 350, 400 ksc หรือพิมพ์เอง)</li>
                            <li>ระบุ กว้าง (ม.) &times; ยาว (ม.) &times; ลึก/หนา/สูง (ม.)</li>
                            <li>ระบุจำนวนชิ้นส่วน (จุด / ฐาน / ต้น)</li>
                            <li>ระบุ % เผื่อเท Slump Loss (ค่าเริ่มต้น 5.0%)</li>
                            <li>ระบบคำนวณปริมาตรสุทธิและปริมาตรรวมสั่งส่งขึ้นเว็บทันที</li>
                          </ul>
                        </div>

                        {/* SYNC_BEAM */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-lg border border-blue-200 dark:border-blue-900/50">
                              SYNC_BEAM
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">🏗️ งานเหล็กบีม</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> ถอดเหล็กโครงสร้าง H-Beam, I-Beam, Wide Flange:
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                            <li>เลือกขนาดมาตรฐานจากรายการ (เช่น H 150x150x7x10 mm.) หรือพิมพ์ขนาดเอง</li>
                            <li>เลือกความยาวมาตรฐานบีม (6m, 9m, 12m)</li>
                            <li>ระบุความยาวที่ตัดใช้งานจริง และจำนวนท่อนที่ต้องการตัด</li>
                          </ul>
                        </div>

                        {/* SYNC_PLATE */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-950/60 px-2 py-0.5 rounded-lg border border-purple-200 dark:border-purple-900/50">
                              SYNC_PLATE
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">⬛ งานเหล็กเพลท & J-Bolt</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> ถอดแผ่นเพลทหัวเสา/ฐานราก พร้อมอุปกรณ์ยึด:
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                            <li>ระบุ กว้าง &times; ยาว &times; หนา (มม.) และจำนวนแผ่น</li>
                            <li>ระบุสเปก J-Bolt (ขนาด, ความยาว, จำนวนต่อแผ่น) และน็อต/แหวน</li>
                            <li>ระบบคำนวณน้ำหนักเหล็กแผ่นและน้ำหนัก J-Bolt รวมให้อัตโนมัติ</li>
                          </ul>
                        </div>

                        {/* SYNC_BOX & LIPC & PIPE */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded-lg border border-orange-200 dark:border-orange-900/50">
                              SYNC_BOX / SYNC_LIPC / SYNC_PIPE
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">📦 งานเหล็กรูปพรรณ</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> ถอดเหล็กกล่อง, ตัวซี C, และท่อกลม:
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                            <li><code className="text-orange-600 font-bold">SYNC_BOX</code>: เหล็กกล่องสี่เหลี่ยมจัตุรัสและผืนผ้า (SHS/RHS)</li>
                            <li><code className="text-orange-600 font-bold">SYNC_LIPC</code>: เหล็กตัวซีสำหรับงานแปหลังคาและโครงผนัง</li>
                            <li><code className="text-orange-600 font-bold">SYNC_PIPE</code>: ท่อเหล็กกลมโครงสร้าง</li>
                          </ul>
                        </div>

                        {/* SYNC_PVC */}
                        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                          <div className="flex items-center justify-between">
                            <span className="font-mono font-black text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-50 dark:bg-cyan-950/60 px-2 py-0.5 rounded-lg border border-cyan-200 dark:border-cyan-900/50">
                              SYNC_PVC
                            </span>
                            <span className="text-[10px] font-bold text-slate-400">💧 งานท่อ PVC & ข้อต่อ</span>
                          </div>
                          <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                            <b>วิธีใช้:</b> ถอดท่อประปา/สุขาภิบาล และอุปกรณ์:
                          </p>
                          <ul className="text-[11px] text-slate-500 space-y-0.5 list-disc list-inside">
                            <li>เลือกขนาดท่อ PVC ชั้น 8.5 หรือชั้น 13.5 (ความยาวมาตรฐาน 4.0 ม.)</li>
                            <li>หรือเลือกหมวดข้อต่อ/วาล์ว (ระบุประเภท เช่น ข้อต่อตรง ข้องอ 90 สามทาง และขนาด)</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Drawing & Utility Commands */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      <div className="p-4 bg-emerald-50/60 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-mono font-black text-xs text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/60 px-2 py-0.5 rounded-lg">
                            REBAR_DRAW
                          </span>
                          <span className="text-[10px] font-bold text-emerald-600">📊 วาดตาราง BBS ลงในแบบ CAD</span>
                        </div>
                        <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                          <b>วิธีใช้:</b> พิมพ์คำสั่ง <kbd className="font-mono font-bold bg-white dark:bg-slate-800 px-1.5 py-0.5 rounded border border-emerald-300">REBAR_DRAW</kbd> แล้วคลิกเมาส์ 1 ครั้งที่จุดที่ต้องการวางตารางใน Drawing:
                        </p>
                        <ul className="text-[11px] text-slate-600 dark:text-slate-400 space-y-0.5 list-disc list-inside">
                          <li>AutoCAD จะดึงข้อมูลล่าสุดจาก Cloud มาวาดตาราง Bar Bending Schedule ให้ทันที</li>
                          <li>วาดเส้นกรอบตาราง (Grid Lines) สวยงาม พร้อมคอลัมน์ชื่อชิ้นส่วน ขนาดเหล็ก ความยาวตัด จำนวน เส้นเต็ม เศษเหลือ และน้ำหนักรวม</li>
                        </ul>
                      </div>

                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white">
                          ⚙️ คำสั่งช่วยเหลือและจัดการระบบใน AutoCAD:
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <code className="font-bold text-rose-600 font-mono">SYNC_MENU</code>
                            <span className="text-slate-500 text-[11px]">เปิดเมนูรวมเลือกหมวดงาน (1-9)</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <code className="font-bold text-rose-600 font-mono">REBAR_OFFCUTS</code>
                            <span className="text-slate-500 text-[11px]">เช็ครายการเศษเหล็กคงเหลือในสต็อก</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <code className="font-bold text-rose-600 font-mono">REBAR_WEB</code>
                            <span className="text-slate-500 text-[11px]">เปิดหน้าต่าง Web Browser จัดการระบบทันที</span>
                          </div>
                          <div className="flex items-center justify-between p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700">
                            <code className="font-bold text-rose-600 font-mono">REBAR_HELP</code>
                            <span className="text-slate-500 text-[11px]">แสดงคำแนะนำการใช้คำสั่งทั้งหมด</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Section 2: SketchUp Integration */}
                  <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-5">
                    <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
                      <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 flex items-center justify-center font-black text-xl shadow-inner">
                        SKP
                      </div>
                      <div>
                        <h4 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                          <span>2. วิธีใช้งานใน SketchUp (Ruby Plugin: rebar_live_sync.rb)</span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-[10px] font-bold">
                            Live Sync สองทิศทาง
                          </span>
                        </h4>
                        <p className="text-xs text-slate-500">
                          เปิดหน้าต่าง Live Sync ควบคุมในตัว, สั่งสร้างโมเดล 3D เหล็กเส้นจริงลงโมเดล และคิดปริมาตรคอนกรีตจากชิ้นงาน 3D
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                      {/* Installation */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">1</span>
                          <span>ขั้นตอนการติดตั้งปลั๊กอินเข้า SketchUp:</span>
                        </div>
                        <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
                          <li>กดปุ่มสีฟ้า <b>"โหลดปลั๊กอิน SketchUp (.rb)"</b> ด้านบน</li>
                          <li>นำไฟล์ <code className="bg-slate-200 dark:bg-slate-700 px-1.5 py-0.5 rounded font-mono font-bold text-blue-600">rebar_live_sync.rb</code> ไปวางในโฟลเดอร์ Plugins:
                            <div className="mt-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-950 font-mono text-[10px] select-all break-all text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-800">
                              %APPDATA%\SketchUp\SketchUp 2024\SketchUp\Plugins
                            </div>
                          </li>
                          <li>หรือเปิดโปรแกรม SketchUp ไปที่เมนู <b>Window &rarr; Ruby Console</b> แล้วพิมพ์คำสั่ง:
                            <div className="mt-1 p-2 rounded-xl bg-slate-200 dark:bg-slate-950 font-mono text-[11px] text-blue-600 dark:text-blue-400 border border-slate-300 dark:border-slate-800">
                              load 'rebar_live_sync.rb'
                            </div>
                          </li>
                        </ol>
                      </div>

                      {/* Commands in SketchUp */}
                      <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-2.5">
                        <div className="font-bold text-xs text-slate-900 dark:text-white flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] flex items-center justify-center font-bold">2</span>
                          <span>เมนูคำสั่งและการใช้งานใน SketchUp (Extensions &rarr; ถอดเหล็กเส้น & Live Sync):</span>
                        </div>
                        <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 pl-1 leading-relaxed">
                          <li className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                            <b className="text-blue-600 dark:text-blue-400 block mb-0.5">1. เปิดหน้าต่าง Live Sync BBS:</b>
                            เปิดหน้าต่างจัดการถอดแบบใน SketchUp สามารถดูตารางสรุป เพิ่ม/แก้ไขรายการ และดูเศษคงเหลือได้ทันที
                          </li>
                          <li className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                            <b className="text-blue-600 dark:text-blue-400 block mb-0.5">2. สร้างโมเดล 3D เหล็กเส้น & บีมจริง (Generate 3D Steel):</b>
                            ดึงข้อมูล BBS มาวาดเป็น 3D Solid Cylinder ขนาดเส้นผ่าศูนย์กลางตาม มอก. จริง (เช่น DB12 = 12mm, DB20 = 20mm) และความยาวจริงลงในโมเดล 3D ช่วยตรวจสอบระยะทาบและตำแหน่งเหล็ก
                          </li>
                          <li className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700/80">
                            <b className="text-blue-600 dark:text-blue-400 block mb-0.5">3. คิดปริมาตรคอนกรีตจากชิ้นงาน 3D (Concrete Volume from Selected):</b>
                            คลิกเลือกวัตถุ 3D Solid / Group (เช่น ฐานราก, เสา, คาน) ปลั๊กอินจะอ่านปริมาตรจริงเป็นลูกบาศก์เมตร (คิว m³) เผื่อเท 5% และส่งบันทึกเข้าสู่ระบบคลาวด์ให้อัตโนมัติ
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                </div>
              )}

          {/* ========================================================
              TAB: PROJECTS
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
                          <img src={getImgSrc(proj.images[0])} alt={proj.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
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
                              onClick={async () => {
                                if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบผลงานนี้?')) {
                                  await api.deleteProject(proj.id);
                                  showFeedback('success', 'ลบผลงานเรียบร้อย');
                                  loadAllData();
                                }
                              }}
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
              TAB: CATEGORIES
             ======================================================== */}
          {activeTab === 'categories' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">จัดการหมวดหมู่ผลงาน</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">เพิ่มหรือลบหมวดหมู่ผลงานตามต้องการ</p>
              </div>

              <form onSubmit={async (e) => {
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
              }} className="flex gap-2">
                <input
                  type="text"
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  placeholder="พิมพ์ชื่อหมวดหมู่ใหม่ เช่น อาคารพาณิชย์, ตกแต่งภายใน..."
                  className="flex-1 px-4 py-2.5 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> เพิ่มหมวดหมู่
                </button>
              </form>

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
                        onClick={async () => {
                          if (window.confirm(`คุณต้องการลบหมวดหมู่ "${cat}" ใช่หรือไม่?`)) {
                            const updated = await api.deleteCategory(cat);
                            setCategories(updated);
                            showFeedback('success', 'ลบหมวดหมู่เรียบร้อยแล้ว');
                            onRefreshData();
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500"
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
              TAB: SITE LOGS (Fix image display & upload)
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
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow"
                >
                  <Plus className="w-4 h-4" /> เพิ่มบันทึกตรวจงาน
                </button>
              </div>

              {siteLogs.length === 0 ? (
                <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-slate-400 text-xs">
                  ยังไม่มีบันทึกตรวจงาน กดปุ่ม "เพิ่มบันทึกตรวจงาน" ด้านบน
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

                      {/* Site Photos with reliable src resolution */}
                      {log.images && log.images.length > 0 && (
                        <div className="flex gap-2 overflow-x-auto pb-1">
                          {log.images.map((img, i) => {
                            const src = getImgSrc(img);
                            if (!src) return null;
                            return (
                              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer group">
                                <img
                                  src={src}
                                  alt=""
                                  onClick={() => setZoomPhotoUrl(src)}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                />
                                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                  <ZoomIn className="w-4 h-4 text-white" />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {/* Feedbacks */}
                      {log.feedbacks && log.feedbacks.length > 0 && (
                        <div className="bg-slate-50 dark:bg-slate-800/40 p-3.5 rounded-xl space-y-2 border border-slate-200 dark:border-slate-800">
                          <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                            💬 ข้อเสนอแนะจากผู้ชม ({log.feedbacks.length} รายการ):
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
                              <button
                                type="button"
                                onClick={() => handleRespondFeedback(log.id, fbIdx, fb.approved)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1 ${
                                  fb.approved
                                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-400'
                                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-emerald-600 hover:text-white'
                                }`}
                              >
                                <CheckCheck className="w-3.5 h-3.5" />
                                <span>{fb.approved ? 'รับเรื่องแล้ว (แสดงบนเว็บ)' : 'กดรับเรื่อง'}</span>
                              </button>
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
              TAB: PRIVATE VAULT (PIN: 0966390496)
             ======================================================== */}
          {activeTab === 'vault' && (
            <div className="space-y-6 max-w-3xl">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Lock className="w-5 h-5 text-emerald-500" /> ห้องเก็บอีเมล & ข้อมูลส่วนตัว (Private Vault)
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  พื้นที่ส่วนตัวป้องกันด้วยรหัสผ่าน PIN แยกต่างหาก (รหัสผ่านเข้าห้อง: <b>0966390496</b>)
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
                      (ใส่รหัสผ่านเพื่อปลดล็อกข้อมูลส่วนตัว)
                    </p>
                  </div>
                  <form onSubmit={handleUnlockVault} className="space-y-3">
                    <input
                      type="password"
                      maxLength={15}
                      value={vaultPinInput}
                      onChange={(e) => setVaultPinInput(e.target.value)}
                      placeholder="ใส่รหัส PIN เข้าห้อง"
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
                  <div className="flex items-center justify-between p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/40">
                    <div className="flex items-center gap-2 text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <ShieldCheck className="w-4 h-4 text-emerald-600" />
                      <span>ปลดล็อกห้องเก็บข้อมูลส่วนตัวแล้ว</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setIsChangePinOpen(!isChangePinOpen)}
                        className="px-3 py-1.5 text-xs bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border rounded-xl hover:bg-slate-50 font-medium"
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

                  {isChangePinOpen && (
                    <form onSubmit={handleChangePin} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">ตั้งรหัส PIN ใหม่</h4>
                      <div className="flex gap-2">
                        <input
                          type="password"
                          value={newPinValue}
                          onChange={(e) => setNewPinValue(e.target.value)}
                          placeholder="ใส่รหัส PIN ใหม่ (อย่างน้อย 4 หลัก)"
                          className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
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

                  <form onSubmit={handleAddVaultItem} className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">เพิ่มรายการอีเมล / บัญชีใหม่</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={newVaultItem.label}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, label: e.target.value })}
                        placeholder="ชื่อบัญชี (เช่น Gmail งานนอก)"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        required
                        value={newVaultItem.emailOrId}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, emailOrId: e.target.value })}
                        placeholder="อีเมล หรือ Username"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                      <input
                        type="text"
                        value={newVaultItem.note}
                        onChange={(e) => setNewVaultItem({ ...newVaultItem, note: e.target.value })}
                        placeholder="หมายเหตุ / วัตถุประสงค์"
                        className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5"
                    >
                      <Plus className="w-4 h-4" /> บันทึกรายการ
                    </button>
                  </form>

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
              TAB: MESSAGES
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
                    ข้อความและรูปถ่ายหน้างานที่ลูกค้าส่งผ่านแบบฟอร์ม
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
                            onClick={async () => {
                              const next = msg.status === 'unread' ? 'read' : 'unread';
                              await api.updateMessageStatus(msg.id, next);
                              setMessages(messages.map(m => m.id === msg.id ? { ...m, status: next } : m));
                            }}
                            className="px-3 py-1.5 text-xs font-medium rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100"
                          >
                            {msg.status === 'unread' ? 'ทำเครื่องหมายว่าติดต่อแล้ว' : 'ตั้งเป็นยังไม่ติดต่อ'}
                          </button>
                          <button
                            onClick={async () => {
                              if (window.confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) {
                                await api.deleteMessage(msg.id);
                                setMessages(messages.filter(m => m.id !== msg.id));
                                showFeedback('success', 'ลบข้อความเรียบร้อย');
                              }
                            }}
                            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl"
                            title="ลบ"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <p className="text-xs text-slate-700 dark:text-slate-300 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl line-clamp-2">
                        {msg.message || 'ไม่มีรายละเอียดเพิ่มเติม'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ========================================================
              TAB: SETTINGS & FULL PROFILE
             ======================================================== */}
          {activeTab === 'settings' && profile && (
            <form onSubmit={handleSaveSettings} className="max-w-3xl space-y-6">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">การตั้งค่าโปรไฟล์ & ปรับแต่งหน้าเว็บ</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  แก้ไขข้อมูลส่วนตัว เบอร์โทร LINE อีเมล รูปโปรไฟล์ ภาพปก และข้อความส่วนต่างๆ ของเว็บไซต์
                </p>
              </div>

              {/* Profile Details */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                  <User className="w-4 h-4 text-emerald-500" /> ข้อมูลโปรไฟล์ส่วนตัว (Profile Information)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">ชื่อ-นามสกุล</label>
                    <input
                      type="text"
                      value={profile.name || ''}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                      placeholder="ยุทธการ คำกลอน"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">ตำแหน่ง / สโลแกน</label>
                    <input
                      type="text"
                      value={profile.title || ''}
                      onChange={(e) => setProfile({ ...profile, title: e.target.value })}
                      placeholder="เขียนแบบบ้าน 3D SketchUp • ถอดแบบก่อสร้าง AutoCAD"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">คำอธิบายตัวเอง (Bio)</label>
                  <textarea
                    rows={3}
                    value={profile.bio || ''}
                    onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์หลัก</label>
                    <input
                      type="text"
                      value={profile.phone || ''}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      placeholder="064-303-2859"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">เบอร์โทรศัพท์สำรอง</label>
                    <input
                      type="text"
                      value={profile.altPhone || ''}
                      onChange={(e) => setProfile({ ...profile, altPhone: e.target.value })}
                      placeholder="096-203-3005"
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">อีเมล</label>
                    <input
                      type="email"
                      value={profile.email || ''}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1">LINE ID</label>
                    <input
                      type="text"
                      value={profile.lineId || ''}
                      onChange={(e) => setProfile({ ...profile, lineId: e.target.value })}
                      className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Photos & Cover uploads */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  รูปภาพโปรไฟล์และภาพปก (Avatar & Cover Image)
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Profile Avatar */}
                  <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 space-y-3">
                    <label className="block text-xs font-semibold">รูปโปรไฟล์ (Avatar)</label>
                    <div className="flex items-center gap-3">
                      <img src={getImgSrc(profile.avatar)} alt="Profile" className="w-14 h-14 rounded-2xl object-cover border-2 border-emerald-500 shadow" />
                      <div className="flex flex-col gap-1.5">
                        <label className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl cursor-pointer font-medium text-center shadow-sm">
                          ลงรูปใหม่ / เปลี่ยนรูป
                          <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                        </label>
                        {profile.avatar && (
                          <button
                            type="button"
                            onClick={() => setProfile({ ...profile, avatar: '' })}
                            className="px-3 py-1 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 rounded-xl text-xs hover:bg-rose-100 font-medium"
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
                      <img src={getImgSrc(profile.cover || profile.coverImage)} alt="Cover" className="w-full h-16 rounded-xl object-cover border border-slate-300 dark:border-slate-700" />
                      <div className="flex items-center gap-2">
                        <label className="flex-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs rounded-xl cursor-pointer font-medium text-center shadow-sm">
                          ลงภาพปกใหม่ / เปลี่ยน
                          <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} />
                        </label>
                        {(profile.cover || profile.coverImage) && (
                          <button
                            type="button"
                            onClick={() => setProfile({ ...profile, cover: '', coverImage: '' })}
                            className="px-3 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 border border-rose-200 rounded-xl text-xs hover:bg-rose-100 font-medium"
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
                    <label className="block text-xs font-semibold mb-1">ระดับสถานะ</label>
                    <select
                      value={profile.workStatus?.status || 'available'}
                      onChange={(e) => setProfile({
                        ...profile,
                        workStatus: { ...(profile.workStatus || {}), status: e.target.value }
                      })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    >
                      <option value="available">พร้อมรับงานทันที (สีเขียว)</option>
                      <option value="in_progress">กำลังดำเนินงาน / คิวงานแน่น (สีน้ำเงิน)</option>
                      <option value="busy">งดรับงานชั่วคราว (สีส้ม)</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold mb-1">ข้อความแสดงบนป้าย</label>
                    <input
                      type="text"
                      value={profile.workStatus?.text || ''}
                      onChange={(e) => setProfile({
                        ...profile,
                        workStatus: { ...(profile.workStatus || {}), text: e.target.value }
                      })}
                      placeholder="เช่น พร้อมรับงานออกแบบ & เขียนแบบ"
                      className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                    />
                  </div>
                </div>
              </div>

              {/* Website Texts */}
              <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  ปรับแต่งข้อความส่วนติดต่อและแบบฟอร์ม
                </h4>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    ข้อความป้ายหัวข้อส่วนติดต่อ
                  </label>
                  <input
                    type="text"
                    value={profile.contactBadgeText || ''}
                    onChange={(e) => setProfile({ ...profile, contactBadgeText: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    หัวข้อหลักส่วนติดต่อ
                  </label>
                  <input
                    type="text"
                    value={profile.contactTitle || ''}
                    onChange={(e) => setProfile({ ...profile, contactTitle: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold mb-1">
                    คำอธิบายแบบฟอร์มส่งรายละเอียดจ้างงาน
                  </label>
                  <textarea
                    rows={2}
                    value={profile.hireFormDesc || ''}
                    onChange={(e) => setProfile({ ...profile, hireFormDesc: e.target.value })}
                    className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              <div className="pt-4 flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  <CheckCircle className="w-4 h-4" /> บันทึกการเปลี่ยนแปลงทั้งหมด
                </button>
              </div>
            </form>
          )}

          {/* ========================================================
              TAB: SYSTEM STATUS
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
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.type || 'MongoDB Cloud'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Database Name</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.name || 'yutthakan_portfolio'}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">จำนวนผลงานในระบบ</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.counts?.projects || projects.length} รายการ</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">จำนวนข้อความจ้างงาน</span>
                      <span className="font-bold text-slate-800 dark:text-white">{systemStatus.database?.counts?.messages || messages.length} ข้อความ</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </div>

      {/* ========================================================
          MODAL: REBAR ADD/EDIT (With 5 Material Categories & Offcut Reuse)
         ======================================================== */}
      {isRebarEditorOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden max-h-[94vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/70 dark:bg-slate-800/40">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-2">
                <Boxes className="w-4 h-4 text-emerald-500" />
                <span>{editingRebarItem ? 'แก้ไขรายการวัสดุโครงสร้าง' : 'เพิ่มรายการถอดวัสดุโครงสร้าง (BBS & Steel Takeoff)'}</span>
              </h3>
              <button 
                type="button" 
                onClick={() => setIsRebarEditorOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Top Category Tabs (5 หมวดงานหลัก) */}
            <div className="grid grid-cols-3 sm:grid-cols-6 p-2 bg-slate-100/80 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 gap-1 text-center">
              {[
                { id: 'rebar', icon: '🔩', title: 'เหล็กเส้น', sub: 'มอก. RB/DB' },
                { id: 'concrete', icon: '🧱', title: 'ปูนคอนกรีต', sub: 'คิดปริมาณคิว' },
                { id: 'beam', icon: '🏗️', title: 'เหล็กบีม', sub: 'H/I/WF' },
                { id: 'plate', icon: '⬛', title: 'เหล็กเพลท', sub: 'Plate+J-Bolt' },
                { id: 'box_c_pipe', icon: '📦', title: 'กล่อง/C/ท่อ', sub: 'เหล็กรูปพรรณ' },
                { id: 'pvc', icon: '💧', title: 'ท่อ PVC', sub: 'ท่อ & ข้อต่อ' }
              ].map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    let defaultType = 'DB20';
                    let defaultStdLen = 12;
                    let defaultSub = 'H-Beam';
                    if (cat.id === 'concrete') {
                      defaultType = '240 ksc';
                      defaultStdLen = 0;
                    } else if (cat.id === 'beam') { 
                      defaultType = 'H 100x50x5x7 mm.'; 
                      defaultStdLen = 6; 
                      defaultSub = 'H-Beam';
                    } else if (cat.id === 'plate') { 
                      defaultType = 'เพลท 300x300x6mm'; 
                      defaultStdLen = 0;
                    } else if (cat.id === 'box_c_pipe') { 
                      defaultType = 'SHS 50x50x2.3 mm.'; 
                      defaultStdLen = 6; 
                      defaultSub = 'SHS';
                    } else if (cat.id === 'pvc') { 
                      defaultType = 'PVC 8.5 2" (55mm)'; 
                      defaultStdLen = 4; 
                      defaultSub = 'pipe_85';
                    }
                    setRebarForm({
                      ...rebarForm,
                      materialCategory: cat.id,
                      rebarType: defaultType,
                      standardLength: defaultStdLen,
                      subCategory: defaultSub,
                      isReusedOffcut: false,
                      reusedOffcutId: '',
                      customType: false
                    });
                  }}
                  className={`py-2 px-1 rounded-xl text-xs font-bold transition-all ${
                    (rebarForm.materialCategory || 'rebar') === cat.id
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-sm border border-slate-200/80 dark:border-slate-700'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <div className="text-sm">{cat.icon}</div>
                  <div className="leading-tight">{cat.title}</div>
                  <div className="text-[9px] font-normal opacity-70 hidden sm:block">{cat.sub}</div>
                </button>
              ))}
            </div>

            <form onSubmit={handleSaveRebar} className="p-5 overflow-y-auto space-y-4 text-xs">
              
              {/* กลุ่ม/หมวดงาน (Common Field) พร้อมระบบเบอร์ NO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    🏗️ กลุ่ม / หมวดงาน (เช่น ฐานราก F1, งานเสา, งานคาน, งานโครงหลังคาเหล็ก)
                  </label>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
                    ล็อคเบอร์ NO สำหรับ AutoCAD
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mb-1.5">
                  {[
                    { no: 'NO.1', name: 'ฐานราก F1' },
                    { no: 'NO.2', name: 'งานเสา' },
                    { no: 'NO.3', name: 'งานคาน' },
                    { no: 'NO.4', name: 'งานพื้น' },
                    { no: 'NO.5', name: 'งานโครงสร้างเหล็ก' },
                    { no: 'NO.6', name: 'งานสุขาภิบาล/ท่อ' }
                  ].map(item => {
                    const fullText = `${item.name} ${item.no}`;
                    const isSelected = rebarForm.group === fullText || rebarForm.group === item.name;
                    return (
                      <button
                        key={item.no}
                        type="button"
                        onClick={() => setRebarForm({ ...rebarForm, group: fullText })}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium border flex items-center gap-1 transition-all ${
                          isSelected 
                            ? 'bg-emerald-100 text-emerald-900 border-emerald-500 font-bold dark:bg-emerald-950 dark:text-emerald-300 shadow-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:border-emerald-300'
                        }`}
                      >
                        <span className="px-1 py-0.2 bg-emerald-600 text-white rounded text-[9px] font-mono font-bold">{item.no}</span>
                        <span>{item.name}</span>
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  required
                  value={rebarForm.group || ''}
                  onChange={(e) => setRebarForm({ ...rebarForm, group: e.target.value })}
                  placeholder="พิมพ์ชื่อกลุ่ม/หมวดงานใหม่ หรือเลือกจากด้านบน (เช่น ฐานราก F1 NO.1)"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold"
                />
                {/* ใต้ข้างล่าง: ล็อคเบอร์ NO หมวดงาน (พิมพ์เองได้อิสระ หรือกดปุ่มด่วน) */}
                <div className="mt-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold text-slate-700 dark:text-slate-200 text-[11px] flex items-center gap-1">
                      🏷️ ล็อคเบอร์ NO หมวด:
                    </span>
                    <input
                      type="text"
                      value={(() => {
                        const m = (rebarForm.group || '').match(/NO[\.\s].*$/i);
                        return m ? m[0] : '';
                      })()}
                      onChange={(e) => {
                        const val = e.target.value;
                        const m = (rebarForm.group || '').match(/NO[\.\s].*$/i);
                        const base = m ? (rebarForm.group || '').slice(0, m.index).trim() : (rebarForm.group || '').trim();
                        if (!val.trim()) {
                          setRebarForm({ ...rebarForm, group: base });
                        } else {
                          const formatted = /^NO[\.\s]/i.test(val.trim()) ? val.trim() : `NO.${val.trim()}`;
                          setRebarForm({ ...rebarForm, group: base ? `${base} ${formatted}` : formatted });
                        }
                      }}
                      placeholder="พิมพ์เบอร์ NO เองได้ (เช่น NO.1, NO.15, 2A)"
                      className="px-2.5 py-1 w-56 rounded-lg border border-emerald-400 dark:border-emerald-600 bg-white dark:bg-slate-900 font-mono font-bold text-emerald-700 dark:text-emerald-300 text-xs focus:ring-2 focus:ring-emerald-500/20 outline-none shadow-sm"
                    />
                    <span className="text-[10px] text-slate-400">(พิมพ์เลขหรือรหัสใดก็ได้ ระบบจะล็อคต่อท้ายชื่อหมวดอัตโนมัติ)</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-1 pt-1 border-t border-slate-200/60 dark:border-slate-700/60 text-[10px]">
                    <span className="text-slate-400 text-[10px]">ปุ่มด่วน:</span>
                    {['NO.1', 'NO.2', 'NO.3', 'NO.4', 'NO.5', 'NO.6', 'NO.7', 'NO.8', 'NO.9', 'NO.10'].map((no) => {
                      const isSelected = (rebarForm.group || '').includes(no);
                      return (
                        <button
                          key={no}
                          type="button"
                          onClick={() => {
                            const m = (rebarForm.group || '').match(/NO[\.\s].*$/i);
                            const base = m ? (rebarForm.group || '').slice(0, m.index).trim() : (rebarForm.group || '').trim();
                            setRebarForm({ ...rebarForm, group: base ? `${base} ${no}` : no });
                          }}
                          className={`px-1.5 py-0.5 rounded font-mono font-bold text-[10px] border transition-colors ${
                            isSelected
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                              : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-emerald-400'
                          }`}
                        >
                          {no}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* ชื่อส่วนโครงสร้าง (Common Field) พร้อมระบบเบอร์ NO */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    📌 ชื่อส่วนโครงสร้าง (เช่น เสา C1, คาน B2, เสา C1 ช่วงล่าง, เพลทหัวเสา P1, แปหลังคา Purlin)
                  </label>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {[
                    'เสา C1',
                    'เสา C1 ช่วงล่าง',
                    'เสา C2',
                    'คาน B1',
                    'คาน B2',
                    'ฐานราก F1',
                    'เหล็กเสริมเสา',
                    'เพลทหัวเสา P1',
                    'แปหลังคา C1',
                    'พื้นคอนกรีต S1'
                  ].map(name => {
                    const isSelected = rebarForm.label === name;
                    return (
                      <button
                        key={name}
                        type="button"
                        onClick={() => setRebarForm({ ...rebarForm, label: name })}
                        className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                          isSelected 
                            ? 'bg-indigo-600 text-white border-indigo-600 font-bold shadow-sm' 
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200/80 dark:border-slate-700 hover:border-indigo-300 hover:text-indigo-600'
                        }`}
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
                <input
                  type="text"
                  required
                  value={rebarForm.label || ''}
                  onChange={(e) => setRebarForm({ ...rebarForm, label: e.target.value })}
                  placeholder="พิมพ์ชื่อส่วนโครงสร้างใหม่ เช่น เสา C1, คาน B2 หรือ ตอม่อ F1"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-semibold text-sm"
                />
              </div>

              {/* ========================================================
                  หมวด 1: เหล็กเส้นเสริมคอนกรีต (มอก. RB/DB)
                 ======================================================== */}
              {(rebarForm.materialCategory === 'rebar' || !rebarForm.materialCategory) && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-slate-50/80 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        📐 ขนาดเหล็กเส้น (มอก. 24-2559 / 20-2559)
                      </label>
                      <select
                        value={rebarForm.rebarType}
                        onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value, reusedOffcutId: '' })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold text-slate-800 dark:text-slate-200"
                      >
                        <optgroup label="เหล็กกล้าข้ออ้อย (Deformed Bar - DB)">
                          {REBAR_STANDARDS.filter(r => (r.size || '').startsWith('DB')).map(r => (
                            <option key={r.size} value={r.size}>{r.size} ({r.weight} กก./ม.)</option>
                          ))}
                        </optgroup>
                        <optgroup label="เหล็กเส้นกลม (Round Bar - RB)">
                          {REBAR_STANDARDS.filter(r => (r.size || '').startsWith('RB')).map(r => (
                            <option key={r.size} value={r.size}>{r.size} ({r.weight} กก./ม.)</option>
                          ))}
                        </optgroup>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        📏 ความยาวมาตรฐานที่นำมาตัด
                      </label>
                      <select
                        disabled={rebarForm.isReusedOffcut}
                        value={rebarForm.standardLength}
                        onChange={(e) => setRebarForm({ ...rebarForm, standardLength: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-bold disabled:opacity-50"
                      >
                        <option value={10}>10.00 เมตร (สเปกมาตรฐาน 10m)</option>
                        <option value={12}>12.00 เมตร (สเปกมาตรฐาน 12m)</option>
                      </select>
                    </div>
                  </div>

                  {/* ดึงเศษเหล็กในสต็อกมาใช้แทนเส้นใหม่ */}
                  <div className="p-3 bg-amber-50 dark:bg-amber-950/30 rounded-xl border border-amber-200 dark:border-amber-800/40 space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarForm.isReusedOffcut}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          setRebarForm({
                            ...rebarForm,
                            isReusedOffcut: checked,
                            reusedOffcutId: checked && availableOffcutsForType[0] ? availableOffcutsForType[0].id : ''
                          });
                        }}
                        className="rounded text-amber-600 w-4 h-4"
                      />
                      <span className="font-bold text-amber-900 dark:text-amber-300 text-xs">
                        ♻️ ดึงเศษเหล็กในสต็อกมาใช้แทนเส้นใหม่ (ประหยัดค่าวัสดุ)
                      </span>
                    </label>

                    {rebarForm.isReusedOffcut && (
                      <div>
                        {availableOffcutsForType.length === 0 ? (
                          <p className="text-[11px] text-rose-500 font-medium">
                            ไม่มีเศษเหล็ก {rebarForm.rebarType} คงเหลือในสต็อกที่ยาวพอสำหรับตัด
                          </p>
                        ) : (
                          <div className="space-y-1">
                            <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                              เลือกเศษเหล็ก {rebarForm.rebarType} ในสต็อก ({availableOffcutsForType.length} รายการที่ใช้ได้):
                            </label>
                            <select
                              value={rebarForm.reusedOffcutId}
                              onChange={(e) => {
                                const off = availableOffcutsForType.find(o => o.id === e.target.value);
                                setRebarForm({
                                  ...rebarForm,
                                  reusedOffcutId: e.target.value,
                                  cutLength: off ? Math.min(rebarForm.cutLength, off.length) : rebarForm.cutLength
                                });
                              }}
                              className="w-full px-3 py-2 rounded-xl border border-amber-300 dark:border-amber-700 bg-white dark:bg-slate-900 font-semibold text-amber-800 dark:text-amber-200 text-xs"
                            >
                              {availableOffcutsForType.map(o => (
                                <option key={o.id} value={o.id}>
                                  เศษ {o.rebarType || o.barType} ยาว {o.length} ม. ({o.quantity || 1} ท่อน) จาก {o.sourceLabel}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ========================================================
                  หมวด 1.5: ปูนคอนกรีต (Concrete Takeoff)
                 ======================================================== */}
              {rebarForm.materialCategory === 'concrete' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-900 dark:text-amber-300 text-xs flex items-center gap-1.5">
                      🧱 หมวดงานปูนคอนกรีตผสมเสร็จ (คิดปริมาณคิว m³)
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarForm.customType}
                        onChange={(e) => setRebarForm({ ...rebarForm, customType: e.target.checked })}
                        className="rounded text-amber-600 w-3.5 h-3.5"
                      />
                      <span>พิมพ์สเปกเอง</span>
                    </label>
                  </div>

                  {/* กำลังอัดคอนกรีต */}
                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      กำลังอัดคอนกรีต (Compressive Strength)
                    </label>
                    {!rebarForm.customType ? (
                      <select
                        value={rebarForm.concreteStrength || '240 ksc'}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteStrength: e.target.value, rebarType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-bold text-amber-900 dark:text-amber-200 text-xs"
                      >
                        {CONCRETE_STRENGTHS.map((cs) => (
                          <option key={cs.value} value={cs.value}>
                            {cs.label}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type="text"
                        value={rebarForm.concreteStrength || ''}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteStrength: e.target.value, rebarType: e.target.value })}
                        placeholder="เช่น 280 ksc (Cylinder) ปูนทนซัลเฟต"
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-semibold"
                      />
                    )}
                  </div>

                  {/* มิติชิ้นส่วน: กว้าง x ยาว x หนา/ลึก (เมตร) */}
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        กว้าง (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={rebarForm.concreteWidth || ''}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteWidth: Number(e.target.value) })}
                        placeholder="0.50"
                        className="w-full px-2.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-semibold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        ยาว (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={rebarForm.concreteLength || ''}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteLength: Number(e.target.value) })}
                        placeholder="4.00"
                        className="w-full px-2.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-semibold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        ลึก/หนา/สูง (ม.)
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        required
                        value={rebarForm.concreteDepth || ''}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteDepth: Number(e.target.value) })}
                        placeholder="0.50"
                        className="w-full px-2.5 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-semibold text-center"
                      />
                    </div>
                  </div>

                  {/* จำนวนชิ้น/จุด และ เผื่อเท % */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        จำนวนชิ้นส่วน (จุด / ฐาน / ต้น)
                      </label>
                      <input
                        type="number"
                        min="1"
                        required
                        value={rebarForm.quantity || 1}
                        onChange={(e) => setRebarForm({ ...rebarForm, quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-bold text-center"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        เผื่อเท / Slump Loss (%)
                      </label>
                      <input
                        type="number"
                        step="0.5"
                        min="0"
                        max="20"
                        value={rebarForm.concreteWastePercent !== undefined ? rebarForm.concreteWastePercent : 5}
                        onChange={(e) => setRebarForm({ ...rebarForm, concreteWastePercent: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-amber-200 dark:border-amber-800 bg-white dark:bg-slate-900 font-bold text-center"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  หมวด 2: เหล็กบีม (H-Beam / I-Beam / Wide Flange)
                 ======================================================== */}
              {rebarForm.materialCategory === 'beam' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-900 dark:text-blue-300 text-xs flex items-center gap-1.5">
                      🏗️ หมวดงานเหล็กบีม (มอก. 1227-2558)
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-blue-700 dark:text-blue-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarForm.customType}
                        onChange={(e) => setRebarForm({ ...rebarForm, customType: e.target.checked })}
                        className="rounded text-blue-600 w-3.5 h-3.5"
                      />
                      <span>พิมพ์ขนาดเอง (Custom)</span>
                    </label>
                  </div>

                  {/* Sub-Tabs: H-Beam / I-Beam / WF */}
                  {!rebarForm.customType && (
                    <div>
                      <div className="flex gap-1.5 mb-2">
                        {['H-Beam', 'I-Beam', 'WF'].map(sub => (
                          <button
                            key={sub}
                            type="button"
                            onClick={() => {
                              let firstItem = H_BEAM_STANDARDS[0];
                              if (sub === 'I-Beam') firstItem = I_BEAM_STANDARDS[0];
                              if (sub === 'WF') firstItem = WF_STANDARDS[0];
                              setRebarForm({ 
                                ...rebarForm, 
                                subCategory: sub,
                                rebarType: firstItem.label
                              });
                            }}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                              (rebarForm.subCategory || 'H-Beam') === sub
                                ? 'bg-blue-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {sub === 'H-Beam' ? 'H-Beam (57 ขนาด)' : sub === 'I-Beam' ? 'I-Beam (16 ขนาด)' : 'Wide Flange (39 ขนาด)'}
                          </button>
                        ))}
                      </div>

                      <select
                        value={rebarForm.rebarType}
                        onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-semibold text-blue-900 dark:text-blue-100"
                      >
                        {(rebarForm.subCategory === 'I-Beam' 
                          ? I_BEAM_STANDARDS 
                          : rebarForm.subCategory === 'WF' 
                          ? WF_STANDARDS 
                          : H_BEAM_STANDARDS
                        ).map((bm, i) => (
                          <option key={i} value={bm.label}>
                            {bm.label} — {bm.weight6m} กก./6ม. ({bm.weight} กก./ม.)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Custom Beam Input */}
                  {rebarForm.customType && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          ระบุชื่อ/ขนาดเหล็กบีม
                        </label>
                        <input
                          type="text"
                          required
                          value={rebarForm.rebarType}
                          onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                          placeholder="เช่น H 200x100x5.5x8 mm."
                          className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          น้ำหนักเหล็ก (กก./เมตร)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={rebarForm.customWeight || ''}
                          onChange={(e) => setRebarForm({ ...rebarForm, customWeight: e.target.value })}
                          placeholder="เช่น 21.30"
                          className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      📏 ความยาวมาตรฐานเหล็กบีมที่นำมาตัด
                    </label>
                    <select
                      value={rebarForm.standardLength || 6}
                      onChange={(e) => setRebarForm({ ...rebarForm, standardLength: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value={6}>6.00 เมตร (สเปกมาตรฐานโรงงาน 6m)</option>
                      <option value={9}>9.00 เมตร (สเปกสั่งพิเศษ 9m)</option>
                      <option value={12}>12.00 เมตร (สเปกยาว 12m)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ========================================================
                  หมวด 3: เหล็กเพลท (Steel Plate & J-Bolt)
                 ======================================================== */}
              {rebarForm.materialCategory === 'plate' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-900/50">
                  <div className="font-bold text-purple-900 dark:text-purple-300 text-xs flex items-center gap-1.5">
                    ⬛ รายละเอียดแผ่นเพลทเหล็ก (Steel Plate Dimensions)
                  </div>

                  <div className="grid grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        ความกว้าง (มม.)
                      </label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={rebarForm.plateWidth || 300}
                        onChange={(e) => {
                          const w = Number(e.target.value);
                          const l = Number(rebarForm.plateLength || 300);
                          const t = Number(rebarForm.plateThickness || 6);
                          const autoW = Number(((w / 1000) * (l / 1000) * t * 7.85).toFixed(2));
                          setRebarForm({ 
                            ...rebarForm, 
                            plateWidth: w, 
                            plateWeightKg: autoW,
                            rebarType: `เพลท ${w}x${l}x${t}mm`
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        ความยาว (มม.)
                      </label>
                      <input
                        type="number"
                        min="10"
                        required
                        value={rebarForm.plateLength || 300}
                        onChange={(e) => {
                          const l = Number(e.target.value);
                          const w = Number(rebarForm.plateWidth || 300);
                          const t = Number(rebarForm.plateThickness || 6);
                          const autoW = Number(((w / 1000) * (l / 1000) * t * 7.85).toFixed(2));
                          setRebarForm({ 
                            ...rebarForm, 
                            plateLength: l, 
                            plateWeightKg: autoW,
                            rebarType: `เพลท ${w}x${l}x${t}mm`
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        ความหนา (มม.)
                      </label>
                      <select
                        value={rebarForm.plateThickness || 6}
                        onChange={(e) => {
                          const t = Number(e.target.value);
                          const w = Number(rebarForm.plateWidth || 300);
                          const l = Number(rebarForm.plateLength || 300);
                          const autoW = Number(((w / 1000) * (l / 1000) * t * 7.85).toFixed(2));
                          setRebarForm({ 
                            ...rebarForm, 
                            plateThickness: t, 
                            plateWeightKg: autoW,
                            rebarType: `เพลท ${w}x${l}x${t}mm`
                          });
                        }}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-bold"
                      >
                        {[4.5, 6, 9, 12, 16, 19, 20, 22, 25, 28, 32].map(th => (
                          <option key={th} value={th}>{th} มม.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      ⚖️ น้ำหนักแผ่นเพลทต่อ 1 แผ่น (คำนวณอัตโนมัติ หนา x กว้าง x ยาว x 7.85 หรือแก้ไขเองได้)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={rebarForm.plateWeightKg || ''}
                        onChange={(e) => setRebarForm({ ...rebarForm, plateWeightKg: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-slate-900 font-black text-purple-700 dark:text-purple-300"
                      />
                      <span className="font-semibold text-slate-500 whitespace-nowrap">กก./แผ่น</span>
                    </div>
                  </div>

                  {/* J-Bolt & อุปกรณ์น็อต */}
                  <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-purple-200 dark:border-purple-800/80 space-y-2.5">
                    <div className="font-bold text-slate-800 dark:text-slate-200 text-xs">
                      🔩 อุปกรณ์ประกอบ J-Bolt / Anchor Bolt & น็อต-แหวนรอง
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-semibold mb-1 text-slate-500">ขนาดเหล็ก J-Bolt</label>
                        <select
                          value={rebarForm.jboltSize || 'DB16'}
                          onChange={(e) => setRebarForm({ ...rebarForm, jboltSize: e.target.value })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        >
                          {['DB12', 'DB16', 'DB20', 'DB25', 'RB12', 'RB16', 'RB19', 'RB25'].map(sz => (
                            <option key={sz} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold mb-1 text-slate-500">ความยาวต่อตัว (ม.)</label>
                        <input
                          type="number"
                          step="0.01"
                          value={rebarForm.jboltLength || 0.40}
                          onChange={(e) => setRebarForm({ ...rebarForm, jboltLength: Number(e.target.value) })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold mb-1 text-slate-500">จำนวน J-Bolt/แผ่น</label>
                        <input
                          type="number"
                          min="0"
                          value={rebarForm.jboltQtyPerPlate || 4}
                          onChange={(e) => setRebarForm({ ...rebarForm, jboltQtyPerPlate: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                      <div>
                        <label className="block text-[10px] font-semibold mb-1 text-slate-500">หัวน็อต (Hex Nut) ต่อแผ่น</label>
                        <input
                          type="number"
                          min="0"
                          value={rebarForm.nutQtyPerPlate || 4}
                          onChange={(e) => setRebarForm({ ...rebarForm, nutQtyPerPlate: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-semibold mb-1 text-slate-500">แหวนรอง (Washer) ต่อแผ่น</label>
                        <input
                          type="number"
                          min="0"
                          value={rebarForm.washerQtyPerPlate || 4}
                          onChange={(e) => setRebarForm({ ...rebarForm, washerQtyPerPlate: parseInt(e.target.value) || 0 })}
                          className="w-full px-2 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ========================================================
                  หมวด 4: เหล็กกล่อง, เหล็กตัวซี C, ท่อกลมดำ
                 ======================================================== */}
              {rebarForm.materialCategory === 'box_c_pipe' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-orange-50/50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-orange-900 dark:text-orange-300 text-xs flex items-center gap-1.5">
                      📦 หมวดงานเหล็กกล่อง, ตัวซี C, ท่อกลมดำ
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-orange-700 dark:text-orange-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarForm.customType}
                        onChange={(e) => setRebarForm({ ...rebarForm, customType: e.target.checked })}
                        className="rounded text-orange-600 w-3.5 h-3.5"
                      />
                      <span>พิมพ์ขนาดเอง (Custom)</span>
                    </label>
                  </div>

                  {!rebarForm.customType && (
                    <div>
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {[
                          { id: 'SHS', label: 'กล่องสี่เหลี่ยม (SHS)' },
                          { id: 'RHS', label: 'กล่องแบน (RHS)' },
                          { id: 'C', label: 'เหล็กตัวซี C' },
                          { id: 'PIPE', label: 'ท่อกลมดำ' }
                        ].map(sub => (
                          <button
                            key={sub.id}
                            type="button"
                            onClick={() => {
                              let firstItem = BOX_STANDARDS.find(b => b.subType === 'SHS') || BOX_STANDARDS[0];
                              if (sub.id === 'RHS') firstItem = BOX_STANDARDS.find(b => b.subType === 'RHS');
                              if (sub.id === 'C') firstItem = C_CHANNEL_STANDARDS[0];
                              if (sub.id === 'PIPE') firstItem = ROUND_PIPE_STANDARDS[0];
                              setRebarForm({ 
                                ...rebarForm, 
                                subCategory: sub.id,
                                rebarType: firstItem.label
                              });
                            }}
                            className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              (rebarForm.subCategory || 'SHS') === sub.id
                                ? 'bg-orange-600 text-white shadow-sm'
                                : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                            }`}
                          >
                            {sub.label}
                          </button>
                        ))}
                      </div>

                      <select
                        value={rebarForm.rebarType}
                        onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 font-semibold text-orange-950 dark:text-orange-100"
                      >
                        {(rebarForm.subCategory === 'C' 
                          ? C_CHANNEL_STANDARDS 
                          : rebarForm.subCategory === 'PIPE' 
                          ? ROUND_PIPE_STANDARDS 
                          : rebarForm.subCategory === 'RHS'
                          ? BOX_STANDARDS.filter(b => b.subType === 'RHS')
                          : BOX_STANDARDS.filter(b => b.subType === 'SHS')
                        ).map((item, i) => (
                          <option key={i} value={item.label}>
                            {item.label} — {item.weight6m} กก./6ม. ({item.weight} กก./ม.)
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {rebarForm.customType && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          ระบุชื่อ/ขนาดเหล็กรูปพรรณ
                        </label>
                        <input
                          type="text"
                          required
                          value={rebarForm.rebarType}
                          onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                          placeholder="เช่น SHS 100x100x3.2 mm."
                          className="w-full px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          น้ำหนักเหล็ก (กก./เมตร)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          required
                          value={rebarForm.customWeight || ''}
                          onChange={(e) => setRebarForm({ ...rebarForm, customWeight: e.target.value })}
                          placeholder="เช่น 9.53"
                          className="w-full px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                    </div>
                  )}

                  <div>
                    <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      📏 ความยาวมาตรฐานท่อนที่นำมาตัด
                    </label>
                    <select
                      value={rebarForm.standardLength || 6}
                      onChange={(e) => setRebarForm({ ...rebarForm, standardLength: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-orange-200 dark:border-orange-800 bg-white dark:bg-slate-900 font-bold"
                    >
                      <option value={6}>6.00 เมตร (สเปกมาตรฐาน 6m)</option>
                      <option value={12}>12.00 เมตร (สเปก 12m)</option>
                    </select>
                  </div>
                </div>
              )}

              {/* ========================================================
                  หมวด 5: ท่อ PVC และข้อต่อ/วาล์ว (Class 8.5 & 13.5)
                 ======================================================== */}
              {rebarForm.materialCategory === 'pvc' && (
                <div className="space-y-3.5 p-3.5 rounded-2xl bg-cyan-50/50 dark:bg-cyan-950/20 border border-cyan-200 dark:border-cyan-900/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-cyan-900 dark:text-cyan-300 text-xs flex items-center gap-1.5">
                      💧 หมวดงานท่อ PVC และอุปกรณ์ข้อต่อ/วาล์ว
                    </span>
                    <label className="flex items-center gap-1.5 text-[11px] text-cyan-700 dark:text-cyan-400 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rebarForm.customType}
                        onChange={(e) => setRebarForm({ ...rebarForm, customType: e.target.checked })}
                        className="rounded text-cyan-600 w-3.5 h-3.5"
                      />
                      <span>พิมพ์สเปกเอง (Custom)</span>
                    </label>
                  </div>

                  <div className="flex gap-1.5 mb-2">
                    {[
                      { id: 'pipe_85', label: 'ท่อ PVC ชั้น 8.5' },
                      { id: 'pipe_135', label: 'ท่อ PVC ชั้น 13.5' },
                      { id: 'fitting', label: 'ข้อต่อและวาล์ว PVC' }
                    ].map(sub => (
                      <button
                        key={sub.id}
                        type="button"
                        onClick={() => {
                          let defaultType = PVC_85_STANDARDS[0].label;
                          let pvcType = 'pipe';
                          let stdLen = 4;
                          if (sub.id === 'pipe_135') defaultType = PVC_135_STANDARDS[0].label;
                          if (sub.id === 'fitting') {
                            defaultType = 'ข้อต่อตรง 2"';
                            pvcType = 'fitting';
                            stdLen = 0;
                          }
                          setRebarForm({ 
                            ...rebarForm, 
                            subCategory: sub.id,
                            pvcType,
                            rebarType: defaultType,
                            standardLength: stdLen
                          });
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${
                          (rebarForm.subCategory || 'pipe_85') === sub.id
                            ? 'bg-cyan-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                        }`}
                      >
                        {sub.label}
                      </button>
                    ))}
                  </div>

                  {rebarForm.customType ? (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          ระบุชื่อ/ขนาดท่อ หรือ ข้อต่อ PVC
                        </label>
                        <input
                          type="text"
                          required
                          value={rebarForm.rebarType}
                          onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                          placeholder="เช่น ท่อ PVC 2 นิ้ว ชั้น 8.5"
                          className="w-full px-3 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          น้ำหนัก (กก./เมตร หรือ กก./ชิ้น)
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          value={rebarForm.customWeight || ''}
                          onChange={(e) => setRebarForm({ ...rebarForm, customWeight: e.target.value })}
                          placeholder="เช่น 1.05"
                          className="w-full px-3 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 font-semibold"
                        />
                      </div>
                    </div>
                  ) : rebarForm.subCategory !== 'fitting' ? (
                    <div>
                      <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                        เลือกขนาดท่อ PVC (ความยาวมาตรฐาน 4.00 เมตร)
                      </label>
                      <select
                        value={rebarForm.rebarType}
                        onChange={(e) => setRebarForm({ ...rebarForm, rebarType: e.target.value })}
                        className="w-full px-3 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 font-semibold"
                      >
                        {(rebarForm.subCategory === 'pipe_135' ? PVC_135_STANDARDS : PVC_85_STANDARDS).map((p, i) => (
                          <option key={i} value={p.label}>
                            {p.size || p.label} — {p.weight4m} กก./4ม. ({p.weight} กก./ม.)
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          ประเภทข้อต่อ / อุปกรณ์ / วาล์ว
                        </label>
                        <select
                          value={rebarForm.fittingName || 'ข้อต่อตรง'}
                          onChange={(e) => {
                            const name = e.target.value;
                            const sz = rebarForm.fittingSize || '2"';
                            setRebarForm({ 
                              ...rebarForm, 
                              fittingName: name, 
                              rebarType: `${name} ${sz}` 
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 font-semibold"
                        >
                          {PVC_FITTING_TYPES.map((ft, i) => (
                            <option key={i} value={ft.name}>{ft.name}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold mb-1 text-slate-700 dark:text-slate-300">
                          ขนาดท่อที่ใช้ (นิ้ว/มม.)
                        </label>
                        <select
                          value={rebarForm.fittingSize || '2"'}
                          onChange={(e) => {
                            const sz = e.target.value;
                            const name = rebarForm.fittingName || 'ข้อต่อตรง';
                            setRebarForm({ 
                              ...rebarForm, 
                              fittingSize: sz, 
                              rebarType: `${name} ${sz}` 
                            });
                          }}
                          className="w-full px-3 py-2 rounded-xl border border-cyan-200 dark:border-cyan-800 bg-white dark:bg-slate-900 font-semibold"
                        >
                          {PVC_PIPE_SIZES.map((sz, i) => (
                            <option key={i} value={sz}>{sz}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ความยาวที่ตัดใช้ และ จำนวนท่อน (สำหรับหมวดตัดเชิงเส้น) */}
              {rebarForm.materialCategory !== 'plate' && rebarForm.materialCategory !== 'concrete' && !(rebarForm.materialCategory === 'pvc' && rebarForm.subCategory === 'fitting') && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      ความยาวที่ตัดใช้ (เมตร)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0.1"
                      max={rebarForm.isReusedOffcut && selectedOffcut ? selectedOffcut.length : rebarForm.standardLength}
                      required
                      value={rebarForm.cutLength}
                      onChange={(e) => setRebarForm({ ...rebarForm, cutLength: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                      จำนวนท่อนที่ต้องการตัด (ท่อน)
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={rebarForm.quantity}
                      onChange={(e) => setRebarForm({ ...rebarForm, quantity: Number(e.target.value) })}
                      className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold"
                    />
                  </div>
                </div>
              )}

              {/* จำนวนสำหรับหมวดเพลท และ ข้อต่อ PVC */}
              {(rebarForm.materialCategory === 'plate' || (rebarForm.materialCategory === 'pvc' && rebarForm.subCategory === 'fitting')) && (
                <div>
                  <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                    {rebarForm.materialCategory === 'plate' ? 'จำนวนแผ่นเพลทที่ต้องการ (แผ่น)' : 'จำนวนข้อต่อ/อุปกรณ์ที่ต้องการ (ชิ้น)'}
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={rebarForm.quantity}
                    onChange={(e) => setRebarForm({ ...rebarForm, quantity: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-sm"
                  />
                </div>
              )}

              {/* ปลายทางนำเศษไปใช้ / หมายเหตุ */}
              <div>
                <label className="block text-xs font-semibold mb-1 text-slate-700 dark:text-slate-300">
                  หมายเหตุ / นำเศษไปใช้ที่ไหน (เลือกใส่หรือไม่ใส่ก็ได้)
                </label>
                <input
                  type="text"
                  value={rebarForm.usedFor || ''}
                  onChange={(e) => setRebarForm({ ...rebarForm, usedFor: e.target.value })}
                  placeholder="เช่น นำเศษไปเสริมคาน B2 หรือ กดเว้นว่างได้"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Live Preview Calculation */}
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 rounded-2xl border border-emerald-200 dark:border-emerald-800/60 space-y-2">
                <div className="font-bold text-emerald-800 dark:text-emerald-300 text-xs">
                  📊 สรุปผลการคำนวณอัตโนมัติ (Live Calculation):
                </div>

                {rebarForm.materialCategory === 'concrete' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div>ปริมาตรสุทธิ: <b className="text-amber-600 dark:text-amber-400 font-bold">{currentCalc.netVolume || 0} คิว (m³)</b></div>
                    <div>เผื่อเท ({currentCalc.wastePercent || 5}%): <b>+{currentCalc.wasteVolume || 0} คิว</b></div>
                    <div className="col-span-2 bg-amber-50 dark:bg-amber-950/40 p-2 rounded-xl border border-amber-200 dark:border-amber-800">
                      ปริมาตรรวมสั่ง: <b className="text-amber-700 dark:text-amber-300 text-sm font-extrabold">{currentCalc.totalVolume || 0} คิว</b>
                      <span className="text-slate-500 ml-2">({((currentCalc.totalWeightKg || 0) / 1000).toFixed(3)} ตัน)</span>
                    </div>
                  </div>
                ) : rebarForm.materialCategory === 'plate' ? (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div>รวมแผ่นเพลท: <b className="text-purple-600 dark:text-purple-400">{rebarForm.quantity} แผ่น</b></div>
                    <div>น้ำหนักเพลทรวม: <b>{currentCalc.totalPlateWeightKg} กก.</b></div>
                    <div>รวม J-Bolt ทั้งหมด: <b className="text-indigo-600 font-bold">{currentCalc.totalJBolts} ตัว</b> ({currentCalc.totalJBoltWeightKg} กก.)</div>
                    <div>รวมหัวน็อต: <b>{currentCalc.totalNuts} ตัว</b> | แหวน: <b>{currentCalc.totalWashers} ตัว</b></div>
                    <div className="col-span-2 pt-1 border-t border-emerald-200 dark:border-emerald-800 font-bold text-emerald-800 dark:text-emerald-300">
                      น้ำหนักรวมทั้งหมด (เพลท + J-Bolt): {currentCalc.totalWeightKg} กก. ({(currentCalc.totalWeightKg / 1000).toFixed(3)} ตัน)
                    </div>
                  </div>
                ) : rebarForm.materialCategory === 'pvc' && rebarForm.subCategory === 'fitting' ? (
                  <div className="text-[11px] text-slate-700 dark:text-slate-300">
                    <div>รวมจำนวนอุปกรณ์: <b className="text-cyan-600 font-bold">{rebarForm.quantity} ชิ้น</b></div>
                    <div>ชนิดอุปกรณ์: <b>{rebarForm.rebarType}</b></div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-700 dark:text-slate-300">
                    <div>ตัดได้ต่อเส้น: <b>{currentCalc.piecesPerBar} ท่อน</b></div>
                    <div>ต้องใช้เส้นมาตรฐาน: <b className="text-emerald-600 dark:text-emerald-400 font-bold">{currentCalc.standardBarsNeeded} เส้น</b></div>
                    <div>เศษเหลือต่อเส้น: <b className="text-amber-600 font-bold">{currentCalc.offcutDisplay || `${currentCalc.offcutPerBar} ม.`}</b></div>
                    <div>จำนวนท่อนเศษที่เกิด: <b className="text-amber-600 font-bold">{currentCalc.offcutQuantity || 0} ท่อน</b></div>
                    <div className="col-span-2">
                      น้ำหนักวัสดุตัดใช้: <b className="text-indigo-600 dark:text-indigo-400">{currentCalc.totalWeightKg} กก.</b> ({(currentCalc.totalWeightKg / 1000).toFixed(3)} ตัน)
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsRebarEditorOpen(false)}
                  className="px-4 py-2 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md shadow-emerald-600/20"
                >
                  {editingRebarItem ? 'บันทึกการแก้ไข' : 'บันทึกรายการ'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: MESSAGE DETAIL MODAL
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
                </div>
              </div>

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
                ) : <div className="p-2 rounded-xl bg-slate-100 text-slate-400 text-center text-[10px]">ไม่มีเบอร์โทร</div>}

                {selectedMessage.lineId ? (
                  <a
                    href={`https://line.me/R/ti/p/~${selectedMessage.lineId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl bg-[#06C755] text-white font-semibold flex flex-col items-center justify-center gap-1 text-center shadow"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>ทัก LINE</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">{selectedMessage.lineId}</span>
                  </a>
                ) : <div className="p-2 rounded-xl bg-slate-100 text-slate-400 text-center text-[10px]">ไม่มี LINE</div>}

                {selectedMessage.email ? (
                  <a
                    href={`mailto:${selectedMessage.email}`}
                    className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold flex flex-col items-center justify-center gap-1 text-center shadow"
                  >
                    <Send className="w-4 h-4" />
                    <span>ส่งอีเมล</span>
                    <span className="text-[10px] font-normal opacity-90 truncate max-w-full">{selectedMessage.email}</span>
                  </a>
                ) : <div className="p-2 rounded-xl bg-slate-100 text-slate-400 text-center text-[10px]">ไม่มีอีเมล</div>}
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">ข้อความรายละเอียดงาน</label>
                <div className="p-3 bg-slate-50 dark:bg-slate-800 rounded-xl text-slate-800 dark:text-slate-200 whitespace-pre-wrap leading-relaxed">
                  {selectedMessage.message || 'ไม่มีข้อความเพิ่มเติม'}
                </div>
              </div>
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                type="button"
                onClick={async () => {
                  if (window.confirm('คุณต้องการลบข้อความนี้ใช่หรือไม่?')) {
                    await api.deleteMessage(selectedMessage.id);
                    setMessages(messages.filter(m => m.id !== selectedMessage.id));
                    setSelectedMessage(null);
                    showFeedback('success', 'ลบข้อความเรียบร้อย');
                  }
                }}
                className="px-3 py-1.5 text-xs text-rose-600 hover:bg-rose-50 rounded-xl font-medium"
              >
                ลบข้อความนี้
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
            <div className="mt-3">
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

              {/* GPS Coordinates */}
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

              {/* Photos upload with Ultra Compression returning String dataUrl */}
              <div>
                <label className="block text-xs font-semibold mb-1">รูปถ่ายหน้างาน (บีบอัดอัตโนมัติ)</label>
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
                        files.map(f => compressUltraCompact(f, 1600, 1200, 0.8))
                      );
                      setEditingSiteLog(prev => ({
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

                {editingSiteLog.images && editingSiteLog.images.length > 0 && (
                  <div className="flex gap-2 overflow-x-auto pt-2">
                    {editingSiteLog.images.map((img, i) => {
                      const src = getImgSrc(img);
                      return (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
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
                      );
                    })}
                  </div>
                )}
              </div>

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

            <form onSubmit={async (e) => {
              e.preventDefault();
              try {
                const payload = {
                  ...editingProject,
                  coverImage: getImgSrc(editingProject.coverImage) || getImgSrc(editingProject.images?.[0]) || '',
                  images: (editingProject.images || []).map(img => getImgSrc(img)).filter(Boolean)
                };
                if (editingProject.id) {
                  await api.updateProject(editingProject.id, payload);
                  showFeedback('success', 'แก้ไขผลงานเรียบร้อยแล้ว');
                } else {
                  await api.createProject(payload);
                  showFeedback('success', 'เพิ่มผลงานใหม่เรียบร้อยแล้ว');
                }
                setIsEditorOpen(false);
                setEditingProject(null);
                loadAllData();
              } catch (err) {
                showFeedback('error', 'บันทึกไม่สำเร็จ: ' + err.message);
              }
            }} className="p-5 overflow-y-auto space-y-4 text-xs">
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

              <div>
                <label className="block text-xs font-semibold mb-1">รูปภาพผลงาน (บีบอัดอัตโนมัติ)</label>
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
                      setEditingProject(prev => {
                        const nextImages = [...(prev.images || []), ...compressed];
                        return {
                          ...prev,
                          images: nextImages,
                          coverImage: prev.coverImage || nextImages[0] || ''
                        };
                      });
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
                    {editingProject.images.map((img, i) => {
                      const src = getImgSrc(img);
                      return (
                        <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border flex-shrink-0 group">
                          <img src={src} alt="" className="w-full h-full object-cover" />
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
                      );
                    })}
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

    </div>
  );
}
