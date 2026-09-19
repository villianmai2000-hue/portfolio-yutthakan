import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DataService, connectDB } from './db.js';
import { loginHandler, requestOtpHandler, verifyOtpAndResetHandler, requireAdmin } from './auth.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
// รองรับ Payload ขนาดสูงสุด 15MB สำหรับภาพ WebP คุณภาพสูง
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Health Check
app.get('/api/health', async (req, res) => {
  const status = await DataService.getDBStatus();
  res.json({
    status: 'online',
    app: 'Yutthakan Khamklon Architectural Portfolio API',
    database: status,
    timestamp: new Date().toISOString()
  });
});

// Auth Routes
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/otp/request', requestOtpHandler);
app.post('/api/auth/otp/verify', verifyOtpAndResetHandler);

// Profile & Settings
app.get('/api/profile', async (req, res) => {
  try {
    const profile = await DataService.getProfile();
    res.json(profile);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/profile', requireAdmin, async (req, res) => {
  try {
    const updated = await DataService.updateProfile(req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Projects CRUD
app.get('/api/projects', async (req, res) => {
  try {
    const projects = await DataService.getProjects();
    res.json(projects);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await DataService.getProjectById(req.params.id);
    if (!project) return res.status(404).json({ error: 'ไม่พบโปรเจกต์นี้' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', requireAdmin, async (req, res) => {
  try {
    const created = await DataService.createProject(req.body);
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await DataService.updateProject(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'ไม่พบโปรเจกต์นี้' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteProject(req.params.id);
    res.json({ success: true, message: 'ลบผลงานเรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Hire Me Messages
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, lineId, projectType, budget, message } = req.body;
    if (!name || (!phone && !lineId)) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อ และเบอร์โทรหรือ LINE ID เพื่อให้ติดต่อกลับได้' });
    }
    const saved = await DataService.createMessage({
      name,
      phone,
      lineId,
      projectType,
      budget,
      message,
      createdAt: new Date().toISOString()
    });
    res.status(201).json({ success: true, message: 'ส่งข้อความจ้างงานเรียบร้อยแล้ว ขอบคุณที่สนใจครับ!', data: saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/contact', requireAdmin, async (req, res) => {
  try {
    const messages = await DataService.getMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contact/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await DataService.updateMessageStatus(req.params.id, status || 'contacted');
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status & Long-term Backup
app.get('/api/status', requireAdmin, async (req, res) => {
  try {
    const status = await DataService.getDBStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/backup', requireAdmin, async (req, res) => {
  try {
    const profile = await DataService.getProfile();
    const projects = await DataService.getProjects();
    const messages = await DataService.getMessages();
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: 'Yutthakan Portfolio',
      profile,
      projects,
      messages
    };
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename=portfolio_backup_${Date.now()}.json`);
    res.send(JSON.stringify(backupData, null, 2));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Static Client Serving (สำหรับ Production / Render)
const distPath = path.join(__dirname, '../dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(distPath, 'index.html'));
    }
  });
}

// เริ่มต้นเชื่อมต่อ MongoDB Atlas
connectDB().then(() => {
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 Portfolio Server running at http://localhost:${PORT}`);
    });
  }
});

export default app;
