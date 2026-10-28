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
  vaultPin: null // รหัส PIN สำหรับเปิดดูคลังส่วนตัว (รหัสแยกต่างหาก)
};

const DEFAULT_PROJECTS = [
  {
    id: 'proj-1',
    title: 'Modern Minimalist Villa (แบบบ้านโมเดิร์นมินิมอล 2 ชั้น)',
    category: '3D SketchUp & Render (.skp)',
    description: 'งานออกแบบบ้านพักอาศัยสไตล์โมเดิร์น 2 ชั้น พื้นที่ใช้สอย 280 ตร.ม. 3 ห้องนอน 4 ห้องน้ำ พร้อมสระว่ายน้ำ จัดวางทิศทางลมและแสงธรรมชาติอย่างลงตัว',
    coverImage: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1200&q=80'
    ],
    tags: ['SketchUp', 'Enscape', 'Residential', '3D Model'],
    location: 'เชียงใหม่, ประเทศไทย',
    year: '2025',
    area: '280 ตร.ม.',
    files: [
      { name: 'Modern_Villa_Model.skp', size: '14.2 MB', type: 'skp', url: '#' },
      { name: 'Architectural_Drawings.pdf', size: '8.5 MB', type: 'pdf', url: '#' }
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
    category: 'ตรวจรอยร้าว',
    date: '2026-10-08',
    time: '10:30',
    location: 'โครงการบ้านพักอาศัยโมเดิร์นวิลล่า เชียงใหม่',
    gps: { lat: 18.7883, lng: 98.9853, address: 'เชียงใหม่, ประเทศไทย' },
    measurements: { width: '120 ซม.', length: '0.2 มม.', thickness: 'ผิวปูนฉาบ', unit: 'ซม.' },
    description: 'ตรวจพบรอยร้าวลายงาบริเวณผิวปูนฉาบรอยต่อเสากับผนังอิฐมวลเบา เกิดจากการหดตัวของปูนฉาบ ไม่กระทบโครงสร้างหลัก ทำการเซาะร่องและใช้วัสดุ Acrylic Sealant อุดโป๊วพร้อมขัดทาสีใหม่',
    images: [
      'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=800&q=80'
    ],
    isPublic: true,
    status: 'acknowledged', // pending | acknowledged | in_progress | completed
    statusNote: 'หลังบ้านรับเรื่องแล้ว ช่างกำลังเข้าสกัดโป๊วรอยต่อ',
    estimatedCompletionDate: '2026-10-15',
    feedbackList: [
      {
        id: 'fb-1',
        clientName: 'ผู้ว่าจ้างโครงการ',
        directionOrVote: 'กำลังแก้ไข',
        comment: 'รบกวนติดเทปไฟเบอร์เมชกันรอยร้าวซ้ำก่อนทาสีทับด้วยนะครับ',
        createdAt: new Date().toISOString(),
        acknowledgedByAdmin: true
      }
    ],
    createdAt: new Date().toISOString()
  }
];

// มาตรฐานน้ำหนักเหล็กเส้นเสริมคอนกรีต (มอก. 24-2559 / วสท.) กิโลกรัมต่อเมตร
export const REBAR_UNIT_WEIGHTS = {
  'RB6': 0.222,
  'RB9': 0.499,
  'DB10': 0.617,
  'DB12': 0.888,
  'DB16': 1.580,
  'DB20': 2.470,
  'DB25': 3.850,
  'DB28': 4.830,
  'DB32': 6.310
};

// ข้อมูลเริ่มต้นสำหรับระบบถอดเหล็กเส้น & ตารางตัดเศษ (BBS)
export const DEFAULT_REBAR_ITEMS = [
  {
    id: 'rebar-1',
    member: 'เสา C1 (ชั้น 1)',
    barType: 'DB20',
    standardLength: 12.00,
    cutLength: 6.00,
    quantity: 4,
    piecesPerStandardBar: 2,
    barsNeeded: 2,
    offcutPerBar: 0.00,
    totalCutLength: 24.00,
    totalMaterialLength: 24.00,
    totalOffcutLength: 0.00,
    wastePercent: 0.0,
    weightPerMeter: 2.470,
    weightKg: 59.28,
    totalOrderWeightKg: 59.28,
    notes: 'ตัด 6.00 ม. ได้ 2 ท่อนพอดีจากเส้น 12 ม. ไม่มีเศษเหลือ',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rebar-2',
    member: 'คาน B1 (ชั้น 2)',
    barType: 'DB16',
    standardLength: 12.00,
    cutLength: 4.50,
    quantity: 2,
    piecesPerStandardBar: 2,
    barsNeeded: 1,
    offcutPerBar: 3.00,
    totalCutLength: 9.00,
    totalMaterialLength: 12.00,
    totalOffcutLength: 3.00,
    wastePercent: 25.0,
    weightPerMeter: 1.580,
    weightKg: 14.22,
    totalOrderWeightKg: 18.96,
    notes: 'เศษเหลือ 3.00 ม. นำไปตัดเหล็กคอม้าหรือคานช่วงสั้นต่อได้',
    updatedAt: new Date().toISOString()
  },
  {
    id: 'rebar-3',
    member: 'เหล็กปลอกเสา C1',
    barType: 'RB6',
    standardLength: 10.00,
    cutLength: 1.00,
    quantity: 20,
    piecesPerStandardBar: 10,
    barsNeeded: 2,
    offcutPerBar: 0.00,
    totalCutLength: 20.00,
    totalMaterialLength: 20.00,
    totalOffcutLength: 0.00,
    wastePercent: 0.0,
    weightPerMeter: 0.222,
    weightKg: 4.44,
    totalOrderWeightKg: 4.44,
    notes: 'เหล็กปลอกเสาขนาด 20x20 ซม. ความยาวดัดปลอก 1.00 ม.',
    updatedAt: new Date().toISOString()
  }
];

// ฟังก์ชันคำนวณถอดเหล็กเส้นและเศษตัด
export function calculateRebarMetrics(data) {
  const standardLength = Number(data.standardLength) || 12.00;
  const cutLength = Number(data.cutLength) || 6.00;
  const quantity = Math.max(1, parseInt(data.quantity) || 1);
  const barType = (data.barType || 'DB20').toUpperCase().trim();
  const weightPerMeter = REBAR_UNIT_WEIGHTS[barType] || 2.47;

  let piecesPerStandardBar = Math.floor(standardLength / cutLength);
  let barsNeeded = 1;
  let offcutPerBar = 0;
  let totalCutLength = Number((cutLength * quantity).toFixed(2));
  let totalMaterialLength = 0;
  let totalOffcutLength = 0;
  let wastePercent = 0;

  if (piecesPerStandardBar >= 1) {
    barsNeeded = Math.ceil(quantity / piecesPerStandardBar);
    offcutPerBar = Number((standardLength - (piecesPerStandardBar * cutLength)).toFixed(2));
    totalMaterialLength = Number((barsNeeded * standardLength).toFixed(2));
    totalOffcutLength = Number(Math.max(0, totalMaterialLength - totalCutLength).toFixed(2));
    wastePercent = totalMaterialLength > 0 ? Number(((totalOffcutLength / totalMaterialLength) * 100).toFixed(1)) : 0;
  } else {
    barsNeeded = Math.ceil(totalCutLength / standardLength);
    totalMaterialLength = Number((barsNeeded * standardLength).toFixed(2));
    totalOffcutLength = Number(Math.max(0, totalMaterialLength - totalCutLength).toFixed(2));
    wastePercent = totalMaterialLength > 0 ? Number(((totalOffcutLength / totalMaterialLength) * 100).toFixed(1)) : 0;
    offcutPerBar = Number((totalOffcutLength / barsNeeded).toFixed(2));
  }

  const weightKg = Number((totalCutLength * weightPerMeter).toFixed(2));
  const totalOrderWeightKg = Number((totalMaterialLength * weightPerMeter).toFixed(2));

  return {
    ...data,
    barType,
    standardLength,
    cutLength,
    quantity,
    piecesPerStandardBar: Math.max(1, piecesPerStandardBar),
    barsNeeded,
    offcutPerBar,
    totalCutLength,
    totalMaterialLength,
    totalOffcutLength,
    wastePercent,
    weightPerMeter,
    weightKg,
    totalOrderWeightKg,
    updatedAt: new Date().toISOString()
  };
}
function readLocalJson(fileName, defaultVal) {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, JSON.stringify(defaultVal, null, 2), 'utf8');
    return defaultVal;
  }
  try {
    const raw = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${fileName}.json:`, err);
    return defaultVal;
  }
}

function writeLocalJson(fileName, data) {
  const filePath = path.join(DATA_DIR, `${fileName}.json`);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

export async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri || uri.trim() === '') {
    return null;
  }

  if (db) return db;

  try {
    if (!client) {
      client = new MongoClient(uri, {
        serverSelectionTimeoutMS: 5000,
        maxPoolSize: 10
      });
      await client.connect();
      console.log('✅ Connected to MongoDB Atlas Cloud successfully!');
    }
    db = client.db('yutthakan_portfolio');
    await initAtlasData(db);
    return db;
  } catch (error) {
    console.warn('⚠️ MongoDB Atlas connection error (Using local database mode):', error.message);
    return null;
  }
}

// สร้างข้อมูลตั้งต้นใน MongoDB Atlas
async function initAtlasData(database) {
  try {
    // 1. ตรวจสอบ User
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

    // 2. ตรวจสอบ Profile
    const profileCol = database.collection('profile');
    const profile = await profileCol.findOne({ id: 'main_profile' });
    if (!profile) {
      await profileCol.insertOne({
        id: 'main_profile',
        ...DEFAULT_OWNER,
        createdAt: new Date()
      });
    }

    // 3. ตรวจสอบ Projects
    const projectsCol = database.collection('projects');
    const count = await projectsCol.countDocuments();
    if (count === 0) {
      await projectsCol.insertMany(DEFAULT_PROJECTS);
      console.log('✅ Seeded demo projects in MongoDB Atlas');
    }

    // 4. ตรวจสอบ Site Logs
    const siteLogsCol = database.collection('site_logs');
    const logCount = await siteLogsCol.countDocuments();
    if (logCount === 0) {
      await siteLogsCol.insertMany(DEFAULT_SITE_LOGS);
    }

    // 5. ตรวจสอบ Rebar Items (งานถอดเหล็กเส้น)
    const rebarCol = database.collection('rebar_items');
    const rebarCount = await rebarCol.countDocuments();
    if (rebarCount === 0) {
      await rebarCol.insertMany(DEFAULT_REBAR_ITEMS);
      console.log('✅ Seeded demo rebar BBS items in MongoDB Atlas');
    }
  } catch (e) {
    console.error('Error in initAtlasData:', e);
  }
}

// Data Access Layer (DAL)
export const DataService = {
  // --- Profile & Settings ---
  async getProfile() {
    const database = await connectDB();
    if (database) {
      const profile = await database.collection('profile').findOne({ id: 'main_profile' });
      if (profile) return profile;
    }
    return readLocalJson('profile', DEFAULT_OWNER);
  },

  async updateProfile(updates) {
    // แก้ปัญหา immutable field '_id' โดยการตัด _id ออกก่อน update
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

  // --- Categories Management (เพิ่ม/ลบ/แก้ไขหมวดหมู่) ---
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

  // --- Projects ---
  async getProjects() {
    const database = await connectDB();
    if (database) {
      const list = await database.collection('projects').find({}).sort({ createdAt: -1 }).toArray();
      return list;
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

  async createProject(projectData) {
    const newProject = {
      ...projectData,
      id: projectData.id || `proj-${Date.now()}`,
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
        { $set: { ...safeUpdates, updatedAt: new Date().toISOString() } }
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
    const filtered = projects.filter(p => p.id !== id);
    writeLocalJson('projects', filtered);
    return true;
  },

  // --- Hire Me Messages (รองรับรูปภาพที่ลูกค้าแนบมา) ---
  async getMessages() {
    const database = await connectDB();
    if (database) {
      return await database.collection('messages').find({}).sort({ createdAt: -1 }).toArray();
    }
    return readLocalJson('messages', []);
  },

  async createMessage(msg) {
    const newMsg = {
      ...msg,
      id: `msg-${Date.now()}`,
      status: 'unread',
      images: msg.images || [],
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('messages').insertOne(newMsg);
      return newMsg;
    }
    const messages = readLocalJson('messages', []);
    messages.unshift(newMsg);
    writeLocalJson('messages', messages);
    return newMsg;
  },

  async updateMessageStatus(id, status) {
    const database = await connectDB();
    if (database) {
      await database.collection('messages').updateOne({ id }, { $set: { status } });
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

  // --- Private Vault (คลังข้อมูลส่วนตัว / อีเมลกันลืม มีรหัสล็อกแยก) ---
  async getVaultPin() {
    const prof = await this.getProfile();
    return prof.vaultPin || null;
  },

  async setVaultPin(newPin) {
    const hashed = bcrypt.hashSync(newPin.trim(), 10);
    await this.updateProfile({ vaultPin: hashed });
    return true;
  },

  async verifyVaultPin(pin) {
    const prof = await this.getProfile();
    if (!prof.vaultPin) {
      // หากยังไม่เคยตั้ง PIN ให้ตั้งเป็นรหัสที่ใส่ครั้งแรกทันที
      await this.setVaultPin(pin);
      return { success: true, initialSet: true };
    }
    const isMatch = bcrypt.compareSync(pin.trim(), prof.vaultPin);
    return { success: isMatch };
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
      label: item.label || 'บันทึกส่วนตัว',
      emailOrId: item.emailOrId || '',
      note: item.note || '',
      createdAt: new Date().toISOString()
    };
    const database = await connectDB();
    if (database) {
      await database.collection('vault_items').insertOne(newItem);
      return newItem;
    }
    const items = readLocalJson('vault_items', []);
    items.unshift(newItem);
    writeLocalJson('vault_items', items);
    return newItem;
  },

  async deleteVaultItem(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('vault_items').deleteOne({ id });
      return true;
    }
    const items = readLocalJson('vault_items', []);
    writeLocalJson('vault_items', items.filter(i => i.id !== id));
    return true;
  },

  // --- Site Inspection Logs (ระบบลงงาน & ตรวจงานก่อสร้าง พร้อมพิกัด GPS และ Feedback) ---
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
      id: `log-${Date.now()}`,
      feedbackList: [],
      status: data.status || 'acknowledged',
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
        { $set: { ...safeUpdates, updatedAt: new Date().toISOString() } }
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
      clientName: feedback.clientName || 'ผู้ตรวจงาน',
      directionOrVote: feedback.directionOrVote || 'ให้ผ่าน',
      comment: feedback.comment || '',
      createdAt: new Date().toISOString(),
      acknowledgedByAdmin: false
    };
    const database = await connectDB();
    if (database) {
      await database.collection('site_logs').updateOne(
        { id: logId },
        { $push: { feedbackList: newFeedback } }
      );
      return newFeedback;
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    const log = logs.find(l => l.id === logId);
    if (log) {
      log.feedbackList = log.feedbackList || [];
      log.feedbackList.push(newFeedback);
      writeLocalJson('site_logs', logs);
    }
    return newFeedback;
  },

  async acknowledgeSiteLogFeedback(logId, statusData) {
    const database = await connectDB();
    const updateObj = {
      status: statusData.status || 'in_progress',
      statusNote: statusData.statusNote || 'รับเรื่องแล้ว กำลังดำเนินการ',
      estimatedCompletionDate: statusData.estimatedCompletionDate || '',
      updatedAt: new Date().toISOString()
    };
    if (database) {
      await database.collection('site_logs').updateOne(
        { id: logId },
        { 
          $set: updateObj,
          $set: { 'feedbackList.$[].acknowledgedByAdmin': true }
        }
      );
      return await database.collection('site_logs').findOne({ id: logId });
    }
    const logs = readLocalJson('site_logs', DEFAULT_SITE_LOGS);
    const log = logs.find(l => l.id === logId);
    if (log) {
      Object.assign(log, updateObj);
      if (log.feedbackList) {
        log.feedbackList.forEach(fb => fb.acknowledgedByAdmin = true);
      }
      writeLocalJson('site_logs', logs);
      return log;
    }
    return null;
  },

  // --- Storage / DB Status ---
  async getDBStatus() {
    const database = await connectDB();
    if (database) {
      try {
        const stats = await database.stats();
        return {
          connected: true,
          mode: 'MongoDB Atlas Cloud',
          storageUsedBytes: stats.dataSize || 0,
          storageAllocatedBytes: stats.storageSize || 0,
          storageLimitBytes: 512 * 1024 * 1024,
          collections: stats.collections
        };
      } catch (e) {
        return {
          connected: true,
          mode: 'MongoDB Atlas Cloud',
          storageUsedBytes: 0,
          storageLimitBytes: 512 * 1024 * 1024
        };
      }
    }
    return {
      connected: false,
      mode: 'Local JSON Storage (พร้อมต่อขึ้น MongoDB Atlas)',
      storageUsedBytes: 1024 * 50,
      storageLimitBytes: 512 * 1024 * 1024
    };
  },

  // --- Files & Images Storage ---
  async saveFile({ name, type, mimeType, dataBase64, size }) {
    const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
    const newFile = {
      id: fileId,
      name: name || 'unnamed_file',
      type: type || 'webp',
      mimeType: mimeType || 'image/webp',
      dataBase64,
      size: size || 0,
      createdAt: new Date().toISOString()
    };

    const database = await connectDB();
    if (database) {
      await database.collection('files').insertOne(newFile);
      return { id: fileId, url: `/api/files/${fileId}`, name, size };
    }

    const files = readLocalJson('files', []);
    files.unshift(newFile);
    writeLocalJson('files', files);
    return { id: fileId, url: `/api/files/${fileId}`, name, size };
  },

  async getFile(id) {
    const database = await connectDB();
    if (database) {
      return await database.collection('files').findOne({ id });
    }
    const files = readLocalJson('files', []);
    return files.find(f => f.id === id);
  },

  async deleteFile(id) {
    const database = await connectDB();
    if (database) {
      await database.collection('files').deleteOne({ id });
      return true;
    }
    const files = readLocalJson('files', []);
    writeLocalJson('files', files.filter(f => f.id !== id));
    return true;
  },

  // --- Rebar Cutting List & BBS (ถอดเหล็กเส้น & ตารางตัดเศษ เชื่อมต่อ AutoCAD & SketchUp) ---
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
      return calculated;
    }
    const items = readLocalJson('rebar_items', DEFAULT_REBAR_ITEMS);
    items.unshift(calculated);
    writeLocalJson('rebar_items', items);
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

  async getRebarSummary() {
    const items = await this.getRebarItems();
    const summaryByBarType = {};
    let totalCutMeters = 0;
    let totalOffcutMeters = 0;
    let totalOrderMeters = 0;
    let totalWeightKg = 0;

    items.forEach(it => {
      const type = it.barType || 'DB20';
      if (!summaryByBarType[type]) {
        summaryByBarType[type] = {
          barType: type,
          totalPieces: 0,
          totalCutMeters: 0,
          totalBarsNeeded: 0,
          totalOffcutMeters: 0,
          totalWeightKg: 0,
          weightPerMeter: it.weightPerMeter || 2.47
        };
      }
      summaryByBarType[type].totalPieces += it.quantity || 0;
      summaryByBarType[type].totalCutMeters += it.totalCutLength || 0;
      summaryByBarType[type].totalBarsNeeded += it.barsNeeded || 0;
      summaryByBarType[type].totalOffcutMeters += it.totalOffcutLength || 0;
      summaryByBarType[type].totalWeightKg += it.weightKg || 0;

      totalCutMeters += it.totalCutLength || 0;
      totalOffcutMeters += it.totalOffcutLength || 0;
      totalOrderMeters += (it.barsNeeded || 0) * (it.standardLength || 12);
      totalWeightKg += it.weightKg || 0;
    });

    const averageWastePercent = totalOrderMeters > 0 
      ? Number(((totalOffcutMeters / totalOrderMeters) * 100).toFixed(1)) 
      : 0;

    return {
      totalItemsCount: items.length,
      totalCutMeters: Number(totalCutMeters.toFixed(2)),
      totalOffcutMeters: Number(totalOffcutMeters.toFixed(2)),
      totalOrderMeters: Number(totalOrderMeters.toFixed(2)),
      totalWeightKg: Number(totalWeightKg.toFixed(2)),
      totalWeightTons: Number((totalWeightKg / 1000).toFixed(3)),
      averageWastePercent,
      summaryByBarType: Object.values(summaryByBarType)
    };
  }
};
