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
  }
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

// ฟังก์ชันโหลดข้อมูล Local Fallback
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
  } catch (e) {
    console.error('Error in initAtlasData:', e);
  }
}

// Data Access Layer (DAL) ทำงานได้ทั้ง MongoDB Atlas และ Local JSON
export const DataService = {
  // --- Profile & Owner ---
  async getProfile() {
    const database = await connectDB();
    if (database) {
      const profile = await database.collection('profile').findOne({ id: 'main_profile' });
      if (profile) return profile;
    }
    return readLocalJson('profile', DEFAULT_OWNER);
  },

  async updateProfile(updates) {
    const database = await connectDB();
    if (database) {
      await database.collection('profile').updateOne(
        { id: 'main_profile' },
        { $set: { ...updates, updatedAt: new Date() } },
        { upsert: true }
      );
      return await this.getProfile();
    }
    const current = readLocalJson('profile', DEFAULT_OWNER);
    const updated = { ...current, ...updates, updatedAt: new Date().toISOString() };
    writeLocalJson('profile', updated);
    return updated;
  },

  // --- Users & Auth ---
  async getUserByUsername(username) {
    const database = await connectDB();
    if (database) {
      return await database.collection('users').findOne({ username });
    }
    const users = readLocalJson('users', null);
    if (!users) {
      const hashedPassword = bcrypt.hashSync(DEFAULT_OWNER.passwordPlain, 10);
      const initialUsers = [{ ...DEFAULT_OWNER, password: hashedPassword }];
      writeLocalJson('users', initialUsers);
      return initialUsers[0];
    }
    return users.find(u => u.username === username);
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
    const database = await connectDB();
    if (database) {
      await database.collection('projects').updateOne(
        { id },
        { $set: { ...updates, updatedAt: new Date().toISOString() } }
      );
      return await this.getProjectById(id);
    }
    const projects = readLocalJson('projects', DEFAULT_PROJECTS);
    const idx = projects.findIndex(p => p.id === id);
    if (idx !== -1) {
      projects[idx] = { ...projects[idx], ...updates, updatedAt: new Date().toISOString() };
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

  // --- Hire Me Messages ---
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

  // --- Storage / DB Status ---
  async getDBStatus() {
    const isAtlas = !!(process.env.MONGODB_URI && process.env.MONGODB_URI.trim());
    const database = await connectDB();
    if (database) {
      try {
        const stats = await database.stats();
        return {
          connected: true,
          mode: 'MongoDB Atlas Cloud',
          storageUsedBytes: stats.dataSize || 0,
          storageAllocatedBytes: stats.storageSize || 0,
          storageLimitBytes: 512 * 1024 * 1024, // 512 MB
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

  // --- Files & Images Storage (เก็บไฟล์รูปและเอกสารลง MongoDB Atlas ทันที) ---
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
      console.log(`📸 ส่งไฟล์รูป [${name}] เข้าไปเก็บใน MongoDB Atlas สำเร็จ! ID: ${fileId}`);
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
  }
};
