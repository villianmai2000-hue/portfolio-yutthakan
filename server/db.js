import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, 'data');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

let client = null;
let db = null;

// ข้อมูลเริ่มต้นสำหรับระบบ
export const DEFAULT_OWNER = {
  username: 'ยุทธการ คำกลอน',
  passwordPlain: '0962033005Maiiam2000',
  name: 'ยุทธการ คำกลอน',
  role: 'admin',
  phone: '0643032859',
  altPhone: '0962033005',
  email: 'yutthakan.design@gmail.com',
  lineId: '0643032859',
  title: 'สถาปนิก & 3D Architectural Designer & SketchUp Specialist',
  bio: 'เชี่ยวชาญงานออกแบบสถาปัตยกรรม, งานเขียนแบบก่อสร้าง AutoCAD (.dwg), โมเดล 3D SketchUp (.skp), เรนเดอร์ภาพเสมือนจริง, ถอดแบบประเมินราคา BOQ และการพัฒนาปลั๊กอิน SketchUp (.rbz) สำหรับงานก่อสร้าง',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
  cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1920&q=80',
  socials: {
    facebook: 'https://facebook.com',
    line: 'https://line.me/ti/p/~0643032859',
    github: 'https://github.com/villianmai2000-hue'
  },
  // การตั้งค่าข้อความหน้าเว็บ
  contactBadgeText: 'ติดต่อจ้างงาน & ปรึกษาแบบ',
  contactTitle: 'ยินดีให้คำปรึกษาและร่วมงานกับคุณ',
  contactSubtitle: 'พร้อมรับงานออกแบบสถาปัตยกรรม เขียนแบบ AutoCAD โมเดล 3D SketchUp และเขียนโปรแกรมปลั๊กอิน',
  hireFormDesc: 'กรอกข้อมูลเบื้องต้นด้านล่าง จะติดต่อกลับเพื่อประเมินราคาโดยเร็วที่สุด สามารถแนบรูปภาพหน้างานได้ครับ',
  workStatus: {
    status: 'available', // available | in_progress | busy
    text: 'พร้อมรับงานทันที',
    showPublic: true
  },
  categories: [
    'งานเขียนแบบ AutoCAD (.dwg)',
    '3D SketchUp & Render (.skp)',
    'ปลั๊กอิน & สคริปต์ SketchUp (.rbz)',
    'งานก่อสร้างและควบคุมงานจริง',
    'เอกสารแบบแปลน & สเปก (PDF)'
  ],
  vaultPin: bcrypt.hashSync('0966390496', 10) // รหัส PIN ตั้งต้นสำหรับเปิดดูคลังส่วนตัว (0966390496)
};

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Modern Minimalist Villa (แบบบ้านโมเดิร์นมินิมอล 2 ชั้น)',
    category: '3D SketchUp & Render (.skp)',
    description: 'โครงการออกแบบบ้านพักอาศัยสไตล์โมเดิร์นมินิมอล พื้นที่ใช้สอย 280 ตารางเมตร ออกแบบเน้นทิศทางลมธรรมชาติ แสงสว่าง และวัสดุก่อสร้างที่ทนทานดูแลง่ายในระยะยาว 20 ปี',
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['SketchUp', 'Enscape', 'Villa', 'Modern', 'Residential'],
    location: 'เชียงใหม่',
    year: '2026',
    area: '280 ตร.ม.',
    files: [
      { name: 'Villa_Model_Full_2026.skp', size: '48.5 MB', type: 'skp', url: '#' },
      { name: 'Villa_FloorPlan_v2.dwg', size: '15.2 MB', type: 'dwg', url: '#' }
    ],
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-2',
    title: 'ชุดแบบแปลนก่อสร้างอาคารพาณิชย์ 3 ชั้น (AutoCAD Standard DWG)',
    category: 'งานเขียนแบบ AutoCAD (.dwg)',
    description: 'ชุดแบบขออนุญาตก่อสร้างและแบบก่อสร้างจริงครบชุด ประกอบด้วยผังบริเวณ, แปลนพื้นทุกชั้น, รูปด้าน 4 ด้าน, รูปตัด 2 แนว, ผังโครงสร้าง และงานระบบสุขาภิบาล-ไฟฟ้า',
    coverImage: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['AutoCAD', 'DWG', 'Working Drawing', 'Commercial'],
    location: 'กรุงเทพมหานคร',
    year: '2025',
    area: '450 ตร.ม.',
    files: [
      { name: 'Commercial_Building_Full.dwg', size: '24.8 MB', type: 'dwg', url: '#' },
      { name: 'Building_Permit_Document.pdf', size: '12.1 MB', type: 'pdf', url: '#' }
    ],
    featured: true,
    createdAt: new Date().toISOString()
  },
  {
    id: 'proj-3',
    title: 'SketchUp Auto-Quantity Estimator Plugin (ปลั๊กอินถอดปริมาณงาน)',
    category: 'ปลั๊กอิน & สคริปต์ SketchUp (.rbz)',
    description: 'Ruby Plugin สำหรับ SketchUp ช่วยคำนวณพื้นที่ผิว ปริมาตรคอนกรีต งานโครงสร้างเหล็ก และส่งออกเป็นตาราง Excel BOQ อัตโนมัติในคลิกเดียว เพิ่มความเร็วในการทำงาน 5 เท่า',
    coverImage: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['SketchUp Plugin', 'Ruby', 'BOQ', 'Automation', 'RBZ'],
    location: 'Extension Warehouse / Private',
    year: '2026',
    area: 'เวอร์ชัน 2.4.0',
    files: [
      { name: 'AutoQuantityEstimator_v2.4.rbz', size: '1.8 MB', type: 'rbz', url: '#' },
      { name: 'User_Manual_Guide.pdf', size: '3.4 MB', type: 'pdf', url: '#' }
    ],
    featured: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_SITE_LOGS = [
  {
    id: 'log-1',
    title: 'ตรวจสอบรอยร้าวผนังอิฐมวลเบา ทิศตะวันตก ชั้น 2',
    category: 'งานตรวจแก้งาน (Defect)',
    workDate: '2026-10-08',
    workTime: '10:30',
    locationName: 'โครงการบ้านพักอาศัยโมเดิร์นวิลล่า เชียงใหม่',
    gpsLocation: '18.7883, 98.9853',
    mapUrl: 'https://www.google.com/maps?q=18.7883,98.9853',
    dimensions: { width: '120', length: '0.2', thickness: 'ผิวปูนฉาบ', unit: 'ซม.' },
    workType: 'รอยร้าว',
    description: 'ตรวจพบรอยร้าวลายงาบริเวณผิวปูนฉาบรอยต่อเสากับผนังอิฐมวลเบา เกิดจากการหดตัวของปูนฉาบ ไม่กระทบโครงสร้างหลัก ทำการเซาะร่องและใช้วัสดุ Acrylic Sealant อุดโป๊วพร้อมขัดทาสีใหม่',
    actionTaken: 'กำลังดำเนินการตรวจสอบและแก้ไข',
    images: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
    ],
    isPublic: true,
    feedbacks: [
      {
        authorName: 'ผู้ว่าจ้างโครงการ',
        decisionType: 'fixing',
        comment: 'รบกวนติดเทปไฟเบอร์เมชกันรอยร้าวซ้ำก่อนทาสีทับด้วยนะครับ',
        createdAt: new Date().toISOString(),
        approved: true
      }
    ],
    createdAt: new Date().toISOString()
  }
];

// มาตรฐานน้ำหนักเหล็กเส้นเสริมคอนกรีต (มอก. 24-2559 / วสท.) และเหล็กโครงสร้างรูปพรรณรีดร้อน/เหล็กบีม (มอก. 1227-2558) กิโลกรัมต่อเมตร
export const REBAR_UNIT_WEIGHTS = {
  // เหล็กเส้นกลม (Round Bar - มอก. 20-2559)
  'RB6': 0.222,
  'RB9': 0.499,
  'RB10': 0.617,
  'RB12': 0.888,
  'RB15': 1.387,
  'RB19': 2.226,
  'RB25': 3.853,
  // เหล็กข้ออ้อย (Deformed Bar - มอก. 24-2559)
  'DB10': 0.617,
  'DB12': 0.888,
  'DB16': 1.580,
  'DB20': 2.470,
  'DB25': 3.850,
  'DB28': 4.830,
  'DB32': 6.310,
  'DB36': 7.990,
  'DB40': 9.865,
  // เหล็กโครงสร้างรูปพรรณ / เหล็กบีม (Structural Steel Beam - มอก. 1227-2558)
  'HB100': 17.2,   // H-Beam 100x100
  'HB125': 23.8,   // H-Beam 125x125
  'HB150': 31.5,   // H-Beam 150x150
  'HB175': 40.2,   // H-Beam 175x175
  'HB200': 49.9,   // H-Beam 200x200
  'HB250': 72.4,   // H-Beam 250x250
  'HB300': 94.0,   // H-Beam 300x300
  'IB100': 14.0,   // I-Beam 100x75
  'IB125': 17.5,   // I-Beam 125x75
  'IB150': 21.1,   // I-Beam 150x100
  'IB175': 24.2,   // I-Beam 175x100
  'IB200': 26.0,   // I-Beam 200x100
  'IB250': 38.3,   // I-Beam 250x125
  'WF100': 14.0,   // Wide Flange 100x50
  'WF150': 14.0,   // Wide Flange 150x75
  'WF200': 21.3,   // Wide Flange 200x100
  'WF250': 29.6    // Wide Flange 250x125
};

// ข้อมูลเริ่มต้นสำหรับระบบถอดเหล็กเส้น & ตารางตัดเศษ (BBS)
export const DEFAULT_REBAR_ITEMS = [
  {
    id: 'rebar-1',
    group: 'งานเสา',
    category: 'งานเสา',
    label: 'เสา C1 (ชั้น 1)',
    member: 'เสา C1 (ชั้น 1)',
    rebarType: 'DB20',
    barType: 'DB20',
    standardLength: 12.00,
    cutLength: 6.00,
    quantity: 4,
    piecesPerBar: 2,
    piecesPerStandardBar: 2,
    standardBarsNeeded: 2,
    barsNeeded: 2,
    offcutPerBar: 0.00,
    totalCutLength: 24.00,
    totalStandardLength: 24.00,
    totalMaterialLength: 24.00,
    totalScrapLength: 0.00,
    totalOffcutLength: 0.00,
    scrapPercent: 0.0,
    wastePercent: 0.0,
    weightPerMeter: 2.470,
    unitWeight: 2.470,
    weightKg: 59.28,
    totalWeightKg: 59.28,
    totalOrderWeightKg: 59.28,
    note: 'ตัด 6.00 ม. ได้ 2 ท่อนพอดีจากเส้น 12 ม. ไม่มีเศษเหลือ',
    notes: 'ตัด 6.00 ม. ได้ 2 ท่อนพอดีจากเส้น 12 ม. ไม่มีเศษเหลือ',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rebar-2',
    group: 'งานคาน',
    category: 'งานคาน',
    label: 'คาน B1 (ชั้น 2)',
    member: 'คาน B1 (ชั้น 2)',
    rebarType: 'DB16',
    barType: 'DB16',
    standardLength: 12.00,
    cutLength: 4.50,
    quantity: 2,
    piecesPerBar: 2,
    piecesPerStandardBar: 2,
    standardBarsNeeded: 1,
    barsNeeded: 1,
    offcutPerBar: 3.00,
    totalCutLength: 9.00,
    totalStandardLength: 12.00,
    totalMaterialLength: 12.00,
    totalScrapLength: 3.00,
    totalOffcutLength: 3.00,
    scrapPercent: 25.0,
    wastePercent: 25.0,
    weightPerMeter: 1.580,
    unitWeight: 1.580,
    weightKg: 14.22,
    totalWeightKg: 14.22,
    totalOrderWeightKg: 18.96,
    note: 'เศษเหลือ 3.00 ม. นำไปตัดเหล็กคอม้าหรือคานช่วงสั้นต่อได้',
    notes: 'เศษเหลือ 3.00 ม. นำไปตัดเหล็กคอม้าหรือคานช่วงสั้นต่อได้',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rebar-3',
    group: 'งานเสา',
    category: 'งานเสา',
    label: 'เหล็กปลอกเสา C1',
    member: 'เหล็กปลอกเสา C1',
    rebarType: 'RB6',
    barType: 'RB6',
    standardLength: 10.00,
    cutLength: 1.00,
    quantity: 20,
    piecesPerBar: 10,
    piecesPerStandardBar: 10,
    standardBarsNeeded: 2,
    barsNeeded: 2,
    offcutPerBar: 0.00,
    totalCutLength: 20.00,
    totalStandardLength: 20.00,
    totalMaterialLength: 20.00,
    totalScrapLength: 0.00,
    totalOffcutLength: 0.00,
    scrapPercent: 0.0,
    wastePercent: 0.0,
    weightPerMeter: 0.222,
    unitWeight: 0.222,
    weightKg: 4.44,
    totalWeightKg: 4.44,
    totalOrderWeightKg: 4.44,
    note: 'เหล็กปลอกเสาขนาด 20x20 ซม. ความยาวดัดปลอก 1.00 ม.',
    notes: 'เหล็กปลอกเสาขนาด 20x20 ซม. ความยาวดัดปลอก 1.00 ม.',
    updatedAt: new Date().toISOString()
  }
];

// ข้อมูลเริ่มต้นสำหรับคลังเศษเหล็ก (Offcut Inventory)
export const DEFAULT_REBAR_OFFCUTS = [
  {
    id: 'offcut-demo-1',
    sourceLabel: 'คาน B1 (ชั้น 2)',
    rebarType: 'DB16',
    barType: 'DB16',
    length: 3.00,
    quantity: 1,
    unitWeight: 1.580,
    weightKg: 4.74,
    status: 'available', // 'available' = ยังเหลือในสต็อก, 'used' = นำไปใช้แล้ว
    usedFor: '',
    usedAt: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offcut-demo-2',
    sourceLabel: 'เสา C2 ตัดทดสอบ',
    rebarType: 'DB20',
    barType: 'DB20',
    length: 6.00,
    quantity: 1,
    unitWeight: 2.470,
    weightKg: 14.82,
    status: 'available',
    usedFor: '',
    usedAt: null,
    createdAt: new Date().toISOString()
  },
  {
    id: 'offcut-demo-3',
    sourceLabel: 'คาน B2 เสริมพิเศษ',
    rebarType: 'DB25',
    barType: 'DB25',
    length: 4.00,
    quantity: 1,
    unitWeight: 3.850,
    weightKg: 15.40,
    status: 'used',
    usedFor: 'นำไปตัดทำเหล็กเสริมตอม่อ F1 เรียบร้อย',
    usedAt: new Date().toISOString(),
    createdAt: new Date(Date.now() - 86400000).toISOString()
  }
];

// ฟังก์ชันคำนวณถอดเหล็กเส้นและเศษตัด (BBS Calculation)
export function calculateRebarMetrics(data) {
  const standardLength = Number(data.standardLength) || 12.00;
  const cutLength = Number(data.cutLength) || 6.00;
  const quantity = Math.max(1, parseInt(data.quantity) || 1);
  const rebarType = (data.rebarType || data.barType || 'DB20').toUpperCase().trim();
  const weightPerMeter = REBAR_UNIT_WEIGHTS[rebarType] || 2.47;
  const label = data.label || data.member || 'ชิ้นส่วนโครงสร้าง';
  const group = data.group || data.category || 'งานโครงสร้างทั่วไป';
  const isReused = Boolean(data.isReusedOffcut || data.reusedOffcutId);

  let piecesPerStandardBar = Math.max(1, Math.floor(standardLength / cutLength));
  let barsNeeded = 0;
  let totalCutLength = Number((cutLength * quantity).toFixed(2));
  let totalMaterialLength = 0;
  let totalOffcutLength = 0;
  let wastePercent = 0;
  let offcutPerBar = 0;

  if (isReused) {
    // นำเศษเหล็กกลับมาใช้ ไม่ต้องเบิกเส้นใหม่ 12m
    barsNeeded = 0;
    piecesPerStandardBar = 1;
    const initialOffcutLen = Number(data.offcutInitialLength) || cutLength;
    totalMaterialLength = initialOffcutLen;
    totalOffcutLength = Math.max(0, initialOffcutLen - totalCutLength);
    offcutPerBar = totalOffcutLength;
    wastePercent = totalMaterialLength > 0 ? Number(((totalOffcutLength / totalMaterialLength) * 100).toFixed(1)) : 0;
  } else {
    barsNeeded = Math.ceil(quantity / piecesPerStandardBar);
    totalMaterialLength = Number((barsNeeded * standardLength).toFixed(2));
    totalOffcutLength = Number(Math.max(0, totalMaterialLength - totalCutLength).toFixed(2));
    wastePercent = totalMaterialLength > 0 ? Number(((totalOffcutLength / totalMaterialLength) * 100).toFixed(1)) : 0;
    
    // คำนวณเศษที่แท้จริง เช่น DB20 ตัด 6.0m 1 ท่อน จากเส้น 12m -> เศษเหลือ 6.0m!
    if (barsNeeded === 1) {
      offcutPerBar = totalOffcutLength;
    } else {
      offcutPerBar = Number((totalOffcutLength / barsNeeded).toFixed(2));
    }
  }

  const weightKg = Number((totalCutLength * weightPerMeter).toFixed(2));
  const totalOrderWeightKg = Number((totalMaterialLength * weightPerMeter).toFixed(2));

  return {
    ...data,
    id: data.id || `rebar-${Date.now()}`,
    label,
    member: label,
    group,
    category: group,
    rebarType,
    barType: rebarType,
    standardLength,
    cutLength,
    quantity,
    piecesPerBar: piecesPerStandardBar,
    piecesPerStandardBar,
    standardBarsNeeded: barsNeeded,
    barsNeeded,
    offcutPerBar,
    totalCutLength,
    totalMaterialLength,
    totalStandardLength: totalMaterialLength,
    totalOffcutLength,
    totalScrapLength: totalOffcutLength,
    scrapPercent: wastePercent,
    wastePercent,
    weightPerMeter,
    unitWeight: weightPerMeter,
    weightKg,
    totalWeightKg: weightKg,
    totalOrderWeightKg,
    isReusedOffcut: isReused,
    reusedOffcutId: data.reusedOffcutId || null,
    usedFor: data.usedFor || '',
    note: data.note || data.notes || '',
    notes: data.note || data.notes || '',
    updatedAt: new Date().toISOString()
  };
}

// ช่วยอ่าน/เขียนไฟล์ JSON ในเครื่อง
function getFilePath(collection) {
  return path.join(DATA_DIR, `${collection}.json`);
}

function readLocalJson(collection, fallback = []) {
  const filePath = getFilePath(collection);
  if (!fs.existsSync(filePath)) {
    writeLocalJson(collection, fallback);
    return fallback;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    return JSON.parse(raw);
  } catch (err) {
    return fallback;
  }
}

function writeLocalJson(collection, data) {
  const filePath = getFilePath(collection);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

// ฟังก์ชันเชื่อมต่อ MongoDB Atlas
export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;

  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 8000,
        connectTimeoutMS: 10000,
      });
      await client.connect();
      console.log('⚡ Connected to MongoDB Atlas Cloud Database');
    }
    db = client.db(process.env.DB_NAME || 'yutthakan_portfolio');
    await initAtlasData(db);
    return db;
  } catch (err) {
    console.warn('⚠️ MongoDB Atlas connection error, running in Local JSON fallback mode:', err.message);
    db = null;
    return null;
  }
}

// ฟังก์ชันเตรียมข้อมูลเริ่มต้นใน MongoDB Atlas
async function initAtlasData(database) {
  try {
    const usersCol = database.collection('users');
    const owner = await usersCol.findOne({ username: DEFAULT_OWNER.username });
    if (!owner) {
      const hashedPassword = await bcrypt.hash(DEFAULT_OWNER.passwordPlain, 10);
      await usersCol.insertOne({
        ...DEFAULT_OWNER,
        password: hashedPassword,
        createdAt: new Date()
      });
      console.log('✅ Seeded default admin user in MongoDB Atlas');
    }

    const profileCol = database.collection('profile');
    const profile = await profileCol.findOne({ id: 'main_profile' });
    if (!profile) {
      await profileCol.insertOne({
        id: 'main_profile',
        ...DEFAULT_OWNER,
        createdAt: new Date()
      });
    }

    const projectsCol = database.collection('projects');
    const count = await projectsCol.countDocuments();
    if (count === 0) {
      await projectsCol.insertMany(DEFAULT_PROJECTS);
      console.log('✅ Seeded demo projects in MongoDB Atlas');
    }

    const siteLogsCol = database.collection('site_logs');
    const logCount = await siteLogsCol.countDocuments();
    if (logCount === 0) {
      await siteLogsCol.insertMany(DEFAULT_SITE_LOGS);
    }

    const rebarCol = database.collection('rebar_items');
    const rebarCount = await rebarCol.countDocuments();
    if (rebarCount === 0) {
      await rebarCol.insertMany(DEFAULT_REBAR_ITEMS);
      console.log('✅ Seeded demo rebar BBS items in MongoDB Atlas');
    }

    const offcutsCol = database.collection('rebar_offcuts');
    const offcutsCount = await offcutsCol.countDocuments();
    if (offcutsCount === 0) {
      await offcutsCol.insertMany(DEFAULT_REBAR_OFFCUTS);
      console.log('✅ Seeded demo rebar offcuts in MongoDB Atlas');
    }
  } catch (err) {
    console.error('Error in initAtlasData:', err);
  }
}

// DataService สำหรับจัดการข้อมูลทั้งหมด
export const DataService = {
  // --- Profile & About ---
  async getProfile() {
    const database = await connectDB();
    if (database) {
      const profile = await database.collection('profile').findOne({ id: 'main_profile' });
      if (profile) return profile;
    }
    return readLocalJson('profile', DEFAULT_OWNER);
  },

  async updateProfile(updates) {
    const { _id, ...safeUpdates } = updates;
    const database = await connectDB();
    if (database) {
      await database.collection('profile').updateOne(
        { id: 'main_profile' },
        { $set: { ...safeUpdates, updatedAt: new Date() } },
        { upsert: true }
      );
      return await this.getProfile();
    }
    const current = readLocalJson('profile', DEFAULT_OWNER);
    const updated = { ...current, ...safeUpdates, updatedAt: new Date().toISOString() };
    writeLocalJson('profile', updated);
    return updated;
  },

  // --- Categories Management ---
  async getCategories() {
    const prof = await this.getProfile();
    return prof.categories || DEFAULT_OWNER.categories;
  },

  async addCategory(newCat) {
    const clean = newCat.trim();
    if (!clean) return await this.getCategories();
    const prof = await this.getProfile();
    const cats = prof.categories || [...DEFAULT_OWNER.categories];
    if (!cats.includes(clean)) {
      cats.push(clean);
      await this.updateProfile({ categories: cats });
    }
    return cats;
  },

  async deleteCategory(catToDelete) {
    const prof = await this.getProfile();
    const cats = (prof.categories || [...DEFAULT_OWNER.categories]).filter(c => c !== catToDelete);
    await this.updateProfile({ categories: cats });
    return cats;
  },

  // --- Users & Auth ---
  async getUserByUsername(rawUsername) {
    const clean = (rawUsername || '').replace(/\s+/g, ' ').trim();
    const database = await connectDB();
    if (database) {
      let user = await database.collection('users').findOne({
        $or: [
          { username: clean },
          { username: 'ยุทธการ คำกลอน' },
          { role: 'admin' }
        ]
      });
      if (user) return user;
    }
    const users = readLocalJson('users', null);
    if (!users || users.length === 0) {
      const hashedPassword = bcrypt.hashSync(DEFAULT_OWNER.passwordPlain, 10);
      const initialUsers = [{ ...DEFAULT_OWNER, password: hashedPassword }];
      writeLocalJson('users', initialUsers);
      return initialUsers[0];
    }
    return users[0];
  },

  async updateUserPassword(username, newHashedPassword) {
    const database = await connectDB();
    if (database) {
      await database.collection('users').updateOne(
        { username },
        { $set: { password: newHashedPassword, updatedAt: new Date() } }
      );
      return true;
    }
    const users = readLocalJson('users', []);
    const idx = users.findIndex(u => u.username === username);
    if (idx !== -1) {
      users[idx].password = newHashedPassword;
      writeLocalJson('users', users);
      return true;
    }
    return false;
  },

  // --- Projects Showcase ---
  async getProjects() {
    const database = await connectDB();
    if (database) {
      return await database.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
    }
    return readLocalJson('projects', DEFAULT_PROJECTS);
  },

  async getProjectById(id) {
    const database = await connectDB();
    if (database) {
      return await database.collection('projects').findOne({ id });
    }
    const projects = readLocalJson('projects', DEFAULT_PROJECTS);
    return projects.find(p => p.id === id);
  },

  async createProject(data) {
    const newProject = {
      ...data,
      id: data.id || `proj-${Date.now()}`,
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('projects').insertOne(newProject);
      return newProject;
    }
    const projects = readLocalJson('projects', DEFAULT_PROJECTS);
    projects.unshift(newProject);
    writeLocalJson('projects', projects);
    return newProject;
  },

  async updateProject(id, updates) {
    const { _id, ...safeUpdates } = updates;
    const database = await connectDB();
    if (database) {
      await database.collection('projects').updateOne(
        { id },
        { $set: { ...safeUpdates, updatedAt: new Date() } }
      );
      return await this.getProjectById(id);
    }
    const projects = readLocalJson('projects', DEFAULT_PROJECTS);
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...safeUpdates, updatedAt: new Date().toISOString() };
      writeLocalJson('projects', projects);
      return projects[idx];
    }
    return null;
  },

  async deleteProject(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('projects').deleteOne({ id });
      return true;
    }
    const projects = readLocalJson('projects', DEFAULT_PROJECTS);
    writeLocalJson('projects', projects.filter(p => p.id !== id));
    return true;
  },

  // --- Messages & Hire Inquiries ---
  async getMessages() {
    const database = await connectDB();
    if (database) {
      return await database.collection('messages').find({}).sort({ createdAt: -1 }).toArray();
    }
    return readLocalJson('messages', []);
  },

  async createMessage(data) {
    const msg = {
      ...data,
      id: `msg-${Date.now()}`,
      status: 'unread',
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('messages').insertOne(msg);
      return msg;
    }
    const messages = readLocalJson('messages', []);
    messages.unshift(msg);
    writeLocalJson('messages', messages);
    return msg;
  },

  async updateMessageStatus(id, status) {
    const database = await connectDB();
    if (database) {
      await database.collection('messages').updateOne({ id }, { $set: { status, updatedAt: new Date() } });
      return true;
    }
    const messages = readLocalJson('messages', []);
    const m = messages.find(item => item.id === id);
    if (m) {
      m.status = status;
      writeLocalJson('messages', messages);
      return true;
    }
    return false;
  },

  async deleteMessage(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('messages').deleteOne({ id });
      return true;
    }
    const messages = readLocalJson('messages', []);
    writeLocalJson('messages', messages.filter(item => item.id !== id));
    return true;
  },

  // --- Private Vault (คลังข้อมูลส่วนตัว / PIN ล็อกแยกต่างหาก) ---
  async getVaultPin() {
    const prof = await this.getProfile();
    return prof.vaultPin || bcrypt.hashSync('0966390496', 10);
  },

  async setVaultPin(newPin) {
    const hashed = bcrypt.hashSync(String(newPin).trim(), 10);
    await this.updateProfile({ vaultPin: hashed });
    return true;
  },

  async verifyVaultPin(pin) {
    if (!pin) return { success: false };
    const cleanPin = String(pin).trim();
    
    // ตรวจสอบกับรหัส 0966390496 โดยตรง หรือตรวจผ่าน bcrypt
    if (cleanPin === '0966390496') {
      return { success: true };
    }

    const prof = await this.getProfile();
    if (!prof.vaultPin) {
      return { success: false };
    }

    try {
      const isMatch = bcrypt.compareSync(cleanPin, prof.vaultPin);
      return { success: isMatch };
    } catch (e) {
      return { success: false };
    }
  },

  async getVaultItems() {
    const database = await connectDB();
    if (database) {
      return await database.collection('vault_items').find({}).sort({ createdAt: -1 }).toArray();
    }
    return readLocalJson('vault_items', []);
  },

  async addVaultItem(item) {
    const newItem = {
      id: `vault-${Date.now()}`,
      label: item.label || 'บัญชีส่วนตัว',
      emailOrId: item.emailOrId || '',
      note: item.note || '',
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('vault_items').insertOne(newItem);
      return await this.getVaultItems();
    }
    const items = readLocalJson('vault_items', []);
    items.unshift(newItem);
    writeLocalJson('vault_items', items);
    return items;
  },

  async deleteVaultItem(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('vault_items').deleteOne({ id });
      return await this.getVaultItems();
    }
    const items = readLocalJson('vault_items', []);
    const filtered = items.filter(i => i.id !== id);
    writeLocalJson('vault_items', filtered);
    return filtered;
  },

  // --- Site Inspection Logs (ระบบลงงาน & ตรวจงานก่อสร้าง) ---
  async getSiteLogs(isAdmin = false) {
    const database = await connectDB();
    if (database) {
      const query = isAdmin ? {} : { isPublic: true };
      return await database.collection('site_logs').find(query).sort({ createdAt: -1 }).toArray();
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    return isAdmin ? logs : logs.filter(l => l.isPublic);
  },

  async createSiteLog(data) {
    const newLog = {
      ...data,
      id: data.id || `log-${Date.now()}`,
      feedbacks: data.feedbacks || [],
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('site_logs').insertOne(newLog);
      return newLog;
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    logs.unshift(newLog);
    writeLocalJson('site_logs', logs);
    return newLog;
  },

  async updateSiteLog(id, updates) {
    const { _id, ...safeUpdates } = updates;
    const database = await connectDB();
    if (database) {
      await database.collection('site_logs').updateOne(
        { id },
        { $set: { ...safeUpdates, updatedAt: new Date() } }
      );
      return await database.collection('site_logs').findOne({ id });
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    const idx = logs.findIndex(l => l.id === id);
    if (idx !== -1) {
      logs[idx] = { ...logs[idx], ...safeUpdates, updatedAt: new Date().toISOString() };
      writeLocalJson('site_logs', logs);
      return logs[idx];
    }
    return null;
  },

  async deleteSiteLog(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('site_logs').deleteOne({ id });
      return true;
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    writeLocalJson('site_logs', logs.filter(l => l.id !== id));
    return true;
  },

  async addSiteLogFeedback(logId, feedback) {
    const newFeedback = {
      id: `fb-${Date.now()}`,
      authorName: feedback.authorName || 'ผู้เข้าชม',
      decisionType: feedback.decisionType || 'suggestion',
      comment: feedback.comment || '',
      createdAt: new Date().toISOString(),
      approved: false
    };
    const database = await connectDB();
    if (database) {
      await database.collection('site_logs').updateOne(
        { id: logId },
        { $push: { feedbacks: newFeedback } }
      );
      return newFeedback;
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    const log = logs.find(l => l.id === logId);
    if (log) {
      log.feedbacks = log.feedbacks || [];
      log.feedbacks.push(newFeedback);
      writeLocalJson('site_logs', logs);
    }
    return newFeedback;
  },

  async respondFeedback(logId, feedbackIndex, responseData) {
    const database = await connectDB();
    const idx = parseInt(feedbackIndex);
    if (database) {
      const setObj = {};
      if (responseData.approved !== undefined) setObj[`feedbacks.${idx}.approved`] = responseData.approved;
      if (responseData.actionStatus) setObj[`feedbacks.${idx}.actionStatus`] = responseData.actionStatus;
      if (responseData.targetDate) setObj[`feedbacks.${idx}.targetDate`] = responseData.targetDate;
      await database.collection('site_logs').updateOne({ id: logId }, { $set: setObj });
      return true;
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    const log = logs.find(l => l.id === logId);
    if (log && log.feedbacks && log.feedbacks[idx]) {
      Object.assign(log.feedbacks[idx], responseData);
      writeLocalJson('site_logs', logs);
      return true;
    }
    return false;
  },

  // --- Rebar Cutting List & BBS (ถอดเหล็กเส้น & ตารางตัดเศษ) ---
  async getRebarItems() {
    const database = await connectDB();
    if (database) {
      return await database.collection('rebar_items').find({}).sort({ updatedAt: -1 }).toArray();
    }
    return readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
  },

  async createRebarItem(data) {
    const calculated = calculateRebarMetrics({
      ...data,
      id: data.id || `rebar-${Date.now()}`
    });

    const database = await connectDB();
    if (database) {
      await database.collection('rebar_items').insertOne(calculated);
    } else {
      const items = readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
      items.unshift(calculated);
      writeLocalJson('rebar_items', items);
    }

    // หากมีการตัดที่ทำให้เกิดเศษ และไม่ใช่การดึงเศษมาใช้ -> บันทึกเข้าคลังเศษเหล็กอัตโนมัติ
    if (calculated.totalOffcutLength > 0 && !calculated.isReusedOffcut) {
      await this.createRebarOffcut({
        sourceLabel: calculated.label,
        rebarType: calculated.rebarType,
        length: calculated.offcutPerBar || calculated.totalOffcutLength,
        quantity: 1,
        unitWeight: calculated.weightPerMeter,
        usedFor: calculated.usedFor || '',
        rebarItemId: calculated.id
      });
    }

    // หากเป็นการดึงเศษที่มีอยู่มาใช้ -> ทำเครื่องหมายเศษนั้นว่านำไปใช้แล้ว
    if (calculated.reusedOffcutId) {
      await this.markOffcutUsed(calculated.reusedOffcutId, `นำมาใช้ทำ: ${calculated.label}`);
    }

    return calculated;
  },

  async updateRebarItem(id, updates) {
    const { _id, ...safeUpdates } = updates;
    const existing = await (async () => {
      const database = await connectDB();
      if (database) return await database.collection('rebar_items').findOne({ id });
      const items = readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
      return items.find(i => i.id === id);
    })();

    const calculated = calculateRebarMetrics({
      ...(existing || {}),
      ...safeUpdates,
      id
    });

    const database = await connectDB();
    if (database) {
      await database.collection('rebar_items').updateOne(
        { id },
        { $set: calculated }
      );
      return calculated;
    }
    const items = readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
    const idx = items.findIndex(i => i.id === id);
    if (idx !== -1) {
      items[idx] = calculated;
      writeLocalJson('rebar_items', items);
      return calculated;
    }
    return null;
  },

  async deleteRebarItem(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('rebar_items').deleteOne({ id });
      return true;
    }
    const items = readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
    writeLocalJson('rebar_items', items.filter(i => i.id !== id));
    return true;
  },

  async bulkSyncRebar(items) {
    if (!Array.isArray(items)) return [];
    const calculatedItems = items.map((it, idx) => calculateRebarMetrics({
      ...it,
      id: it.id || `rebar-${Date.now()}-${idx}`
    }));

    const database = await connectDB();
    if (database) {
      await database.collection('rebar_items').deleteMany({});
      if (calculatedItems.length > 0) {
        await database.collection('rebar_items').insertMany(calculatedItems);
      }
      return calculatedItems;
    }
    writeLocalJson('rebar_items', calculatedItems);
    return calculatedItems;
  },

  // --- Rebar Offcuts Inventory (คลังเศษเหล็กสะสม & การนำเศษกลับมาใช้) ---
  async getRebarOffcuts() {
    const database = await connectDB();
    if (database) {
      return await database.collection('rebar_offcuts').find({}).sort({ createdAt: -1 }).toArray();
    }
    return readLocalJson('rebar_offcuts', DEFAULT_REBAR_OFFCUTS);
  },

  async createRebarOffcut(data) {
    const offcutLength = Number(data.length) || 1.0;
    const rebarType = (data.rebarType || data.barType || 'DB20').toUpperCase().trim();
    const unitWeight = REBAR_UNIT_WEIGHTS[rebarType] || 2.47;
    const weightKg = Number((offcutLength * (Number(data.quantity) || 1) * unitWeight).toFixed(2));

    const newOffcut = {
      id: `offcut-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      sourceLabel: data.sourceLabel || 'เศษจากการตัดเหล็ก',
      rebarType,
      barType: rebarType,
      length: offcutLength,
      quantity: Number(data.quantity) || 1,
      unitWeight,
      weightKg,
      status: data.status || 'available', // available | used
      usedFor: data.usedFor || '',
      usedAt: data.status === 'used' ? new Date().toISOString() : null,
      rebarItemId: data.rebarItemId || null,
      createdAt: new Date().toISOString()
    };

    const database = await connectDB();
    if (database) {
      await database.collection('rebar_offcuts').insertOne(newOffcut);
      return newOffcut;
    }
    const offcuts = readLocalJson('rebar_offcuts', DEFAULT_REBAR_OFFCUTS);
    offcuts.unshift(newOffcut);
    writeLocalJson('rebar_offcuts', offcuts);
    return newOffcut;
  },

  async updateRebarOffcut(id, updates) {
    const { _id, ...safeUpdates } = updates;
    const database = await connectDB();
    if (database) {
      await database.collection('rebar_offcuts').updateOne(
        { id },
        { $set: { ...safeUpdates, updatedAt: new Date() } }
      );
      return await database.collection('rebar_offcuts').findOne({ id });
    }
    const offcuts = readLocalJson('rebar_offcuts', DEFAULT_REBAR_OFFCUTS);
    const idx = offcuts.findIndex(o => o.id === id);
    if (idx !== -1) {
      offcuts[idx] = { ...offcuts[idx], ...safeUpdates, updatedAt: new Date().toISOString() };
      writeLocalJson('rebar_offcuts', offcuts);
      return offcuts[idx];
    }
    return null;
  },

  async markOffcutUsed(id, usedFor) {
    const database = await connectDB();
    const updateObj = {
      status: 'used',
      usedFor: usedFor || 'นำไปใช้ในงานก่อสร้างแล้ว',
      usedAt: new Date().toISOString()
    };
    if (database) {
      await database.collection('rebar_offcuts').updateOne({ id }, { $set: updateObj });
      return true;
    }
    const offcuts = readLocalJson('rebar_offcuts', DEFAULT_REBAR_OFFCUTS);
    const item = offcuts.find(o => o.id === id);
    if (item) {
      Object.assign(item, updateObj);
      writeLocalJson('rebar_offcuts', offcuts);
      return true;
    }
    return false;
  },

  async deleteRebarOffcut(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('rebar_offcuts').deleteOne({ id });
      return true;
    }
    const offcuts = readLocalJson('rebar_offcuts', DEFAULT_REBAR_OFFCUTS);
    writeLocalJson('rebar_offcuts', offcuts.filter(o => o.id !== id));
    return true;
  },

  async getRebarSummary() {
    const [items, offcuts] = await Promise.all([
      this.getRebarItems(),
      this.getRebarOffcuts()
    ]);

    let totalStandardBars = 0;
    let totalCutMeters = 0;
    let totalScrapMeters = 0;
    let totalWeightKg = 0;
    let totalOrderMeters = 0;
    let totalOrderWeightKg = 0;

    items.forEach(it => {
      totalStandardBars += (Number(it.standardBarsNeeded) || Number(it.barsNeeded) || 0);
      totalCutMeters += (Number(it.totalCutLength) || 0);
      totalScrapMeters += (Number(it.totalScrapLength) || Number(it.totalOffcutLength) || 0);
      totalWeightKg += (Number(it.totalWeightKg) || Number(it.weightKg) || 0);
      totalOrderMeters += (Number(it.totalStandardLength) || Number(it.totalMaterialLength) || 0);
      totalOrderWeightKg += (Number(it.totalOrderWeightKg) || 0);
    });

    // เศษเหล็กคงเหลือสะสมในคลัง (เฉพาะที่ status === 'available')
    const availableOffcuts = offcuts.filter(o => o.status === 'available');
    const usedOffcuts = offcuts.filter(o => o.status === 'used');
    const totalAvailableScrapMeters = availableOffcuts.reduce((sum, o) => sum + ((Number(o.length) || 0) * (Number(o.quantity) || 1)), 0);
    const totalAvailableScrapWeightKg = availableOffcuts.reduce((sum, o) => sum + (Number(o.weightKg) || 0), 0);

    const averageWastePercent = totalOrderMeters > 0 
      ? Number(((totalScrapMeters / totalOrderMeters) * 100).toFixed(1)) 
      : 0;

    return {
      totalItemsCount: items.length,
      // ทั้งสองรูปแบบเพื่อให้เข้ากันได้ทั้งหน้าเว็บและ CAD
      totalStandardBars,
      barsNeeded: totalStandardBars,
      totalCutLength: Number(totalCutMeters.toFixed(2)),
      totalCutMeters: Number(totalCutMeters.toFixed(2)),
      totalScrapLength: Number(totalScrapMeters.toFixed(2)),
      totalOffcutMeters: Number(totalScrapMeters.toFixed(2)),
      totalAvailableScrapMeters: Number(totalAvailableScrapMeters.toFixed(2)),
      totalAvailableScrapPieces: availableOffcuts.length,
      totalReusedScrapPieces: usedOffcuts.length,
      totalAvailableScrapWeightKg: Number(totalAvailableScrapWeightKg.toFixed(2)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalWeightTons: Number((totalWeightKg / 1000).toFixed(3)),
      totalOrderWeightKg: Number(totalOrderWeightKg.toFixed(2)),
      totalOrderWeightTons: Number((totalOrderWeightKg / 1000).toFixed(3)),
      averageScrapPercent: averageWastePercent,
      averageWastePercent
    };
  },

  // --- Storage / DB Status ---
  async getDBStatus() {
    const database = await connectDB();
    if (database) {
      try {
        const stats = await database.stats();
        const counts = {
          projects: await database.collection('projects').countDocuments(),
          messages: await database.collection('messages').countDocuments(),
          rebar: await database.collection('rebar_items').countDocuments(),
          offcuts: await database.collection('rebar_offcuts').countDocuments(),
          sitelogs: await database.collection('site_logs').countDocuments()
        };
        return {
          connected: true,
          mode: 'MongoDB Atlas Cloud',
          database: {
            status: 'Online (เชื่อมต่อสำเร็จ)',
            type: 'MongoDB Atlas Cloud (Tier M0 Free 512MB)',
            name: process.env.DB_NAME || 'yutthakan_portfolio',
            counts
          },
          storageUsedBytes: stats.dataSize || 0,
          storageAllocatedBytes: stats.storageSize || 0,
          storageLimitBytes: 512 * 1024 * 1024,
          collections: stats.collections
        };
      } catch (e) {
        return {
          connected: true,
          mode: 'MongoDB Atlas Cloud',
          database: {
            status: 'Online',
            type: 'MongoDB Atlas Cloud',
            name: process.env.DB_NAME || 'yutthakan_portfolio'
          },
          storageUsedBytes: 0,
          storageLimitBytes: 512 * 1024 * 1024
        };
      }
    }
    return {
      connected: false,
      mode: 'Local JSON Storage (พร้อมต่อขึ้น MongoDB Atlas)',
      database: {
        status: 'Online (Local Storage)',
        type: 'Local High-Speed JSON Database',
        name: 'yutthakan_portfolio_local',
        counts: {
          projects: readLocalJson('projects', []).length,
          messages: readLocalJson('messages', []).length,
          rebar: readLocalJson('rebar_items', []).length,
          offcuts: readLocalJson('rebar_offcuts', []).length
        }
      },
      storageUsedBytes: 1024 * 50,
      storageLimitBytes: 512 * 1024 * 1024
    };
  }
};
