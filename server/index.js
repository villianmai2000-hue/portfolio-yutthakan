import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DataService, connectDB, DEFAULT_OWNER } from './db.js';
import { loginHandler, requestOtpHandler, verifyOtpAndResetHandler, requireAdmin } from './auth.js';
import jwt from 'jsonwebtoken';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'yutthakan_secret_key_portfolio_2026_mai';

app.use(cors());
// รองรับ Payload ขนาด 20MB สำหรับภาพ WebP บีบอัด
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Helper ตรวจสอบ Admin แบบ Optional (สำหรับ API ที่ดูได้ทั้งผู้เข้าชมและแอดมิน)
function isOptionalAdmin(req) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) return false;
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded && decoded.role === 'admin';
  } catch (e) {
    return false;
  }
}

// Health Check
app.get('/api/health', async (req, res) => {
  const status = await DataService.getDBStatus();
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: status.mode
  });
});

// Authentication Routes
app.post('/api/auth/login', loginHandler);
app.post('/api/auth/otp/request', requestOtpHandler);
app.post('/api/auth/otp/verify', verifyOtpAndResetHandler);

// Profile & Personal Information
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

// Categories Management
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await DataService.getCategories();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', requireAdmin, async (req, res) => {
  try {
    const { category } = req.body;
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'กรุณาระบุชื่อหมวดหมู่' });
    }
    const categories = await DataService.addCategory(category.trim());
    res.status(201).json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:name', requireAdmin, async (req, res) => {
  try {
    const categories = await DataService.deleteCategory(decodeURIComponent(req.params.name));
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Projects Showcase
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
    if (!project) return res.status(404).json({ error: 'ไม่พบผลงานนี้' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/projects', requireAdmin, async (req, res) => {
  try {
    const project = await DataService.createProject(req.body);
    res.status(201).json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    const project = await DataService.updateProject(req.params.id, req.body);
    if (!project) return res.status(404).json({ error: 'ไม่พบผลงานนี้' });
    res.json(project);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/projects/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteProject(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Contact & Messages (Client Inquiries)
app.get('/api/contact', requireAdmin, async (req, res) => {
  try {
    const messages = await DataService.getMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, message } = req.body;
    if (!name || (!phone && !req.body.lineId && !req.body.email)) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อและช่องทางติดต่อ (เบอร์โทร, LINE หรืออีเมล)' });
    }
    const newMessage = await DataService.createMessage(req.body);
    res.status(201).json({
      success: true,
      message: 'ส่งข้อความติดต่อเรียบร้อยแล้ว คุณยุทธการจะติดต่อกลับโดยเร็วที่สุดครับ',
      data: newMessage
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/contact/:id', requireAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    await DataService.updateMessageStatus(req.params.id, status);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/contact/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteMessage(req.params.id);
    res.json({ success: true, message: 'ลบข้อความจ้างงานเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Private Vault (คลังข้อมูลส่วนตัว / PIN ล็อกแยก 0966390496) ---
app.post('/api/vault/verify-pin', requireAdmin, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'กรุณากรอกรหัส PIN' });
    const result = await DataService.verifyVaultPin(pin);
    if (!result.success) {
      return res.status(401).json({ error: 'รหัส PIN ไม่ถูกต้อง' });
    }
    const items = await DataService.getVaultItems();
    res.json({ success: true, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vault/set-pin', requireAdmin, async (req, res) => {
  try {
    const { newPin } = req.body;
    if (!newPin || newPin.trim().length < 4) {
      return res.status(400).json({ error: 'รหัส PIN ต้องมีความยาวอย่างน้อย 4 ตัวอักษร/ตัวเลข' });
    }
    await DataService.setVaultPin(newPin);
    res.json({ success: true, message: 'ตั้งรหัส PIN ใหม่เรียบร้อยแล้ว' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/vault/items', requireAdmin, async (req, res) => {
  try {
    const items = await DataService.getVaultItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vault/items', requireAdmin, async (req, res) => {
  try {
    const item = await DataService.addVaultItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/vault/items/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteVaultItem(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Site Logs & Construction Inspection (ระบบลงงาน & ตรวจงานก่อสร้าง) ---
app.get('/api/site-logs', async (req, res) => {
  try {
    const isAdmin = isOptionalAdmin(req);
    const logs = await DataService.getSiteLogs(isAdmin);
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/site-logs', requireAdmin, async (req, res) => {
  try {
    const log = await DataService.createSiteLog(req.body);
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/site-logs/:id', requireAdmin, async (req, res) => {
  try {
    const updated = await DataService.updateSiteLog(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'ไม่พบบันทึกนี้' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/site-logs/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteSiteLog(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/site-logs/:id/feedback', async (req, res) => {
  try {
    const feedback = await DataService.addSiteLogFeedback(req.params.id, req.body);
    res.status(201).json({ success: true, data: feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/site-logs/:id/feedback/:index/respond', requireAdmin, async (req, res) => {
  try {
    await DataService.respondFeedback(req.params.id, req.params.index, req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Rebar Cutting List & BBS (ถอดเหล็กเส้น & ตารางตัดเศษ) ---
app.get('/api/rebar', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/rebar/summary', async (req, res) => {
  try {
    const summary = await DataService.getRebarSummary();
    res.json(summary);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงรายการหมวดหมู่และชื่อชิ้นส่วนที่มีอยู่ในระบบทั้งหมด (สำหรับ AutoCAD & ปลั๊กอิน)
// รายชื่อกลุ่ม/หมวดงานทั้งหมดในระบบ ส่งให้ AutoCAD ซิงก์ข้อมูลตรงกัน
app.get('/api/rebar/groups.txt', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    const groups = [...new Set(items.map(x => (x.group || x.category || '').trim()).filter(Boolean))];
    const defaultGroups = ['งานเสา NO.100', 'F1-C1 NO.1', 'F2-C2A NO.2', 'ฐานราก F1', 'งานเสา', 'งานคาน', 'งานพื้น', 'งานโครงสร้างเหล็ก', 'งานสุขาภิบาล/ท่อ'];
    const merged = [...new Set([...groups, ...defaultGroups])];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(merged.join('\n'));
  } catch (err) {
    res.status(500).send('ERROR');
  }
});

app.get('/api/rebar/metadata.txt', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    const groups = [...new Set(items.map(x => (x.group || x.category || '').trim()).filter(Boolean))];
    const members = [...new Set(items.map(x => (x.label || x.member || '').trim()).filter(Boolean))];
    const finalGroups = groups.length > 0 ? groups : ['เหล็กเสริมเสา', 'F1-C1 NO.1', 'งานเสา', 'งานคาน', 'ฐานรากทั่วไป'];
    const finalMembers = members.length > 0 ? members : ['เสา C1', 'เสา C2', 'คาน B1', 'คาน B2', 'ฐานราก F1', 'พื้น S1'];
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`GROUPS:${finalGroups.join('|')}\nMEMBERS:${finalMembers.join('|')}`);
  } catch (err) {
    res.status(500).send('ERROR');
  }
});

app.get('/api/rebar/groups', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    const groups = [...new Set(items.map(x => (x.group || x.category || '').trim()).filter(Boolean))];
    const members = [...new Set(items.map(x => (x.label || x.member || '').trim()).filter(Boolean))];
    res.json({
      groups: groups.length > 0 ? groups : ['เหล็กเสริมเสา', 'F1-C1 NO.1', 'งานเสา', 'งานคาน', 'ฐานรากทั่วไป'],
      members: members.length > 0 ? members : ['เสา C1', 'เสา C2', 'คาน B1', 'คาน B2', 'ฐานราก F1', 'พื้น S1']
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rebar', async (req, res) => {
  try {
    const item = await DataService.createRebarItem(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rebar/:id', async (req, res) => {
  try {
    const updated = await DataService.updateRebarItem(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'ไม่พบรายการเหล็กเส้นนี้' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rebar/:id', async (req, res) => {
  try {
    await DataService.deleteRebarItem(req.params.id);
    res.json({ success: true, message: 'ลบรายการเหล็กเส้นเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rebar/sync', async (req, res) => {
  try {
    const { items } = req.body;
    const synced = await DataService.bulkSyncRebar(items);
    res.json({ success: true, message: 'ซิงค์ข้อมูลเหล็กเส้นเรียบร้อย', count: synced.length, items: synced });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Rebar Offcuts API (คลังเศษเหล็กสะสม & การนำเศษกลับมาใช้) ---
app.get('/api/rebar/offcuts', async (req, res) => {
  try {
    const offcuts = await DataService.getRebarOffcuts();
    res.json(offcuts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/rebar/offcuts/:id', async (req, res) => {
  try {
    const updated = await DataService.updateRebarOffcut(req.params.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/rebar/offcuts/:id/use', async (req, res) => {
  try {
    const { usedFor } = req.body;
    const ok = await DataService.markOffcutUsed(req.params.id, usedFor);
    res.json({ success: ok });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/rebar/offcuts/:id', async (req, res) => {
  try {
    await DataService.deleteRebarOffcut(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Download AutoCAD AutoLISP Plugin (.lsp)
app.get('/api/rebar/plugin/autocad.lsp', async (req, res) => {
  try {
    const host = req.get('host') || 'portfolio-yutthakan.onrender.com';
    const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
    const baseUrl = `${protocol}://${host}`;

    const lspFilePath = path.join(__dirname, '../rebar_sync.lsp');
    let lspContent = '';
    if (fs.existsSync(lspFilePath)) {
      lspContent = fs.readFileSync(lspFilePath, 'utf8');
    } else {
      const altPath = path.join(process.cwd(), 'rebar_sync.lsp');
      if (fs.existsSync(altPath)) {
        lspContent = fs.readFileSync(altPath, 'utf8');
      }
    }

    if (!lspContent) {
      return res.status(500).send(';; rebar_sync.lsp not found on server');
    }

    // อัปเดต URL เซิร์ฟเวอร์ให้ตรงกับ Host ปัจจุบันอัตโนมัติ
    lspContent = lspContent.replace(/https:\/\/portfolio-yutthakan\.onrender\.com/g, baseUrl);

    // ดึงหมวดหมู่และชิ้นส่วนที่มีอยู่ในระบบปัจจุบันมาใส่ใน LISP
    try {
      const items = await DataService.getRebarItems();
      const dbGroups = [...new Set(items.map(x => (x.group || x.category || '').trim()).filter(Boolean))];
      const dbMembers = [...new Set(items.map(x => (x.label || x.member || '').trim()).filter(Boolean))];
      if (dbGroups.length > 0) {
        const groupsLsp = dbGroups.map(g => `"${g.replace(/"/g, '\\"')}"`).join(' ');
        lspContent = lspContent.replace(/\(setq \*rebar-groups\* \(list [^)]+\)\)/, `(setq *rebar-groups* (list ${groupsLsp}))`);
      }
      if (dbMembers.length > 0) {
        const membersLsp = dbMembers.map(m => `"${m.replace(/"/g, '\\"')}"`).join(' ');
        lspContent = lspContent.replace(/\(setq \*rebar-members\* \(list [^)]+\)\)/, `(setq *rebar-members* (list ${membersLsp}))`);
      }
    } catch (err) {
      console.warn('Could not inject dynamic groups/members:', err.message);
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="rebar_sync.lsp"');
    res.send(lspContent);
  } catch (err) {
    console.error('Error serving autocad.lsp:', err);
    res.status(500).send(';; Error generating lsp file');
  }
});

// Download SketchUp Ruby Plugin (.rb)
app.get('/api/rebar/plugin/sketchup.rb', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const rbContent = `# =========================================================================
# SketchUp Ruby Extension: Yutthakan Structural Material Live Sync v4.0
# พัฒนาสำหรับคุณยุทธการ คำกลอน (SketchUp & BBS Specialist)
# มีเมนูย่อยแยกตามหมวดวัสดุ 7 หมวดอย่างชัดเจน
# =========================================================================
require 'sketchup.rb'
require 'net/http'
require 'json'
require 'uri'

module YutthakanStructuralSync
  API_BASE_URL = '${baseUrl}/api/rebar'
  WEB_UI_URL   = '${baseUrl}/#admin-rebar'

  # 1. เปิดหน้าต่าง Live Sync Web Dialog
  def self.open_live_dialog
    options = {
      dialog_title: "ระบบจัดการวัสดุโครงสร้าง & Live Sync - ยุทธการ คำกลอน",
      preferences_key: "YutthakanMaterialDialog",
      scrollable: true,
      resizable: true,
      width: 1100,
      height: 750,
      min_width: 850,
      min_height: 550
    }
    dialog = UI::HtmlDialog.new(options)
    dialog.set_url(WEB_UI_URL)
    dialog.show
  end

  # 2. ป้อนข้อมูลถอดวัสดุด่วนตามหมวด
  def self.quick_takeoff(category_name, default_type, default_len)
    prompts = ["กลุ่ม/หมวดงาน:", "ชื่อส่วนโครงสร้าง:", "ขนาดวัสดุ:", "ความยาวตัดใช้ (ม.):", "จำนวน (ท่อน/ชิ้น):"]
    defaults = ["งานโครงสร้างทั่วไป", "ชิ้นส่วน", default_type, default_len.to_s, "1"]
    input = UI.inputbox(prompts, defaults, "ถอดวัสดุ: #{category_name}")
    return unless input

    grp, mem, btype, cut, qty = input
    payload = {
      materialCategory: category_name,
      group: grp,
      label: mem,
      rebarType: btype,
      cutLength: cut.to_f,
      quantity: qty.to_i
    }

    uri = URI.parse(API_BASE_URL)
    http = Net::HTTP.new(uri.host, uri.port)
    http.use_ssl = (uri.scheme == 'https')
    request = Net::HTTP::Post.new(uri.request_uri, { 'Content-Type' => 'application/json' })
    request.body = payload.to_json

    response = http.request(request)
    if response.is_a?(Net::HTTPSuccess)
      UI.messagebox("บันทึก [#{category_name}] #{mem} (#{btype}) ขึ้นระบบเรียบร้อย!")
    else
      UI.messagebox("เกิดข้อผิดพลาดในการส่งข้อมูล: #{response.message}")
    end
  rescue => e
    UI.messagebox("เกิดข้อผิดพลาด: #{e.message}")
  end

  # 3. วาดโมเดล 3D เหล็กเส้นจริงตามตาราง BBS ใน SketchUp
  def self.draw_3d_rebars
    model = Sketchup.active_model
    model.start_operation("สร้าง 3D เหล็กเส้นจริง", true)

    begin
      uri = URI.parse(API_BASE_URL)
      response = Net::HTTP.get_response(uri)
      if response.is_a?(Net::HTTPSuccess)
        items = JSON.parse(response.body)
        origin_x = 0

        items.each do |item|
          cat = item['materialCategory'] || 'rebar'
          bar_type = item['barType'] || item['rebarType'] || 'DB20'
          cut_length = (item['cutLength'] || 6.0).to_f.m
          qty = (item['quantity'] || 1).to_i

          if cat == 'plate'
            w = ((item['plateWidth'] || 300).to_f / 1000.0).m
            l = ((item['plateLength'] || 300).to_f / 1000.0).m
            th = ((item['plateThickness'] || 6).to_f / 1000.0).m
            qty.times do |q_idx|
              pts = [
                Geom::Point3d.new(origin_x.m, (q_idx * 0.5).m, 0),
                Geom::Point3d.new(origin_x.m + w, (q_idx * 0.5).m, 0),
                Geom::Point3d.new(origin_x.m + w, (q_idx * 0.5).m + l, 0),
                Geom::Point3d.new(origin_x.m, (q_idx * 0.5).m + l, 0)
              ]
              face = model.entities.add_face(pts)
              face.pushpull(th) if face
            end
            origin_x += (w.to_m + 0.3)
          else
            diameter_mm = bar_type.gsub(/\D/, '').to_f
            diameter_mm = 20.0 if diameter_mm == 0
            radius = (diameter_mm / 2.0).mm

            qty.times do |q_idx|
              center_point = Geom::Point3d.new(origin_x.m, (q_idx * 0.25).m, 0)
              circle = model.entities.add_circle(center_point, Geom::Vector3d.new(0, 0, 1), radius)
              face = model.entities.add_face(circle)
              face.pushpull(cut_length) if face
            end
            origin_x += 0.5
          end
        end

        model.commit_operation
        UI.messagebox("สร้างโมเดล 3D วัสดุจริงตามตารางสำเร็จเรียบร้อย!")
      else
        UI.messagebox("ไม่สามารถดึงข้อมูลจาก Server ได้")
      end
    rescue => e
      UI.messagebox("เกิดข้อผิดพลาด: #{e.message}")
    end
  end
end

if !defined?(@yutthakan_structural_menu_loaded)
  plugins_menu = UI.menu("Plugins")
  main_menu = plugins_menu.add_submenu("ระบบถอดวัสดุโครงสร้าง & Live Sync (ยุทธการ)")

  main_menu.add_item("1. ถอดเหล็กเส้น (Rebar)") { YutthakanStructuralSync.quick_takeoff('rebar', 'DB20', 6.0) }
  main_menu.add_item("2. ถอดเหล็กบีม (H-Beam / I-Beam / WF)") { YutthakanStructuralSync.quick_takeoff('beam', 'H 150x150x7x10 mm.', 6.0) }
  main_menu.add_item("3. ถอดเหล็กเพลท & J-Bolt (Steel Plate)") { YutthakanStructuralSync.quick_takeoff('plate', 'เพลท 300x300x6mm', 0) }
  main_menu.add_item("4. ถอดเหล็กกล่อง / ตัวซี C / ท่อกลม") { YutthakanStructuralSync.quick_takeoff('box_c_pipe', 'SHS 50x50x2.3 mm.', 6.0) }
  main_menu.add_item("5. ถอดท่อ PVC & ข้อต่อ-วาล์ว") { YutthakanStructuralSync.quick_takeoff('pvc', 'PVC 8.5 2"', 4.0) }
  main_menu.add_separator
  main_menu.add_item("6. สร้างโมเดล 3D วัสดุจริงใน SketchUp") { YutthakanStructuralSync.draw_3d_rebars }
  main_menu.add_item("7. เปิดหน้าต่าง Live Sync Web (คลังเศษ & ตารางรวม)") { YutthakanStructuralSync.open_live_dialog }

  @yutthakan_structural_menu_loaded = true
end
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rebar_live_sync.rb"');
  res.send(rbContent);
});

// ========================================================
// Export Excel (XLSX) – ตารางสรุปถอดเหล็กเส้น BBS ครบสมบูรณ์
// ========================================================
app.get('/api/rebar/export/bbs.xlsx', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();

    // ── Helper ──
    const n = (v, d = 2) => parseFloat((+v || 0).toFixed(d));
    const pct = (v) => `${n(v, 1)}%`;

    // ── Sheet 1: รายการถอดเหล็กทั้งหมด ──
    const detailHeaders = [
      'ลำดับ', 'หมวด / กลุ่ม', 'ชื่อชิ้นส่วนโครงสร้าง', 'ชนิดเหล็ก (มอก.)',
      'ขนาดเหล็ก', 'ความยาวมาตรฐาน (ม.)', 'ความยาวตัดใช้ (ม.)',
      'จำนวนที่ต้องการ (ท่อน)', 'ได้ท่อน/เส้น', 'สั่งเส้นเต็ม (เส้น)',
      'เศษเหลือ/เส้น (ม.)', 'รวมความยาวตัดจริง (ม.)', 'รวมเศษเหลือ (ม.)',
      'น้ำหนักต่อเมตร (กก./ม.)', 'น้ำหนักรวม (กก.)', '% เศษสูญเสีย'
    ];

    const detailRows = items.map((it, i) => [
      i + 1,
      it.group || it.category || '-',
      it.label || it.member || '-',
      it.steelType || (((it.rebarType || it.barType || '').startsWith('H-') || (it.rebarType || it.barType || '').startsWith('WF')) ? 'เหล็กบีม (มอก.1227)' : ((it.rebarType || it.barType || '').startsWith('RB') ? 'เหล็กกลม (มอก.20)' : 'เหล็กข้ออ้อย (มอก.24)')),
      it.rebarType || it.barType || '-',
      n(it.standardLength || 12),
      n(it.cutLength || 0),
      it.quantity || 1,
      it.piecesPerBar || it.piecesPerStandardBar || 1,
      it.standardBarsNeeded !== undefined ? it.standardBarsNeeded : (it.barsNeeded || 0),
      n(it.offcutPerBar || 0),
      n(it.totalCutLength || 0),
      n(it.totalScrapLength !== undefined ? it.totalScrapLength : (it.totalOffcutLength || 0)),
      n(it.unitWeight || it.weightPerMeter || 2.47),
      n(it.totalWeightKg !== undefined ? it.totalWeightKg : (it.weightKg || 0)),
      pct(it.scrapPercent !== undefined ? it.scrapPercent : (it.wastePercent || 0))
    ]);

    const ws1 = XLSX.utils.aoa_to_sheet([detailHeaders, ...detailRows]);

    // กำหนดความกว้างคอลัมน์ sheet 1
    ws1['!cols'] = [
      { wch: 6 }, { wch: 18 }, { wch: 28 }, { wch: 22 }, { wch: 12 },
      { wch: 20 }, { wch: 18 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
      { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 22 }, { wch: 18 }, { wch: 16 }
    ];

    // ── Sheet 2: ตารางสรุป (แยกขนาดเหล็ก) ──
    // จัดกลุ่มตามขนาดเหล็ก
    const summaryMap = {};
    items.forEach(it => {
      const type = it.rebarType || it.barType || 'DB20';
      if (!summaryMap[type]) {
        summaryMap[type] = { type, bars6: 0, bars10: 0, bars12: 0, totalBars: 0, totalCutLength: 0, totalWeight: 0 };
      }
      const stdLen = +(it.standardLength || 12);
      const bars = it.standardBarsNeeded !== undefined ? +it.standardBarsNeeded : +(it.barsNeeded || 0);
      if (stdLen <= 6) summaryMap[type].bars6 += bars;
      else if (stdLen <= 10) summaryMap[type].bars10 += bars;
      else summaryMap[type].bars12 += bars;
      summaryMap[type].totalBars += bars;
      summaryMap[type].totalCutLength += +(it.totalCutLength || 0);
      summaryMap[type].totalWeight += +(it.totalWeightKg !== undefined ? it.totalWeightKg : (it.weightKg || 0));
    });

    const summaryHeaders = [
      'ขนาดเหล็ก (มอก.)', 'เส้น 6.0 ม.', 'เส้น 10.0 ม.', 'เส้น 12.0 ม.',
      'รวมจำนวนเส้น', 'ความยาวตัดจริง (ม.)', 'น้ำหนักรวม (กก.)', 'น้ำหนักรวม (ตัน)'
    ];

    // เรียงขนาดเหล็ก: RB < DB < H-Beam
    const sortedTypes = Object.keys(summaryMap).sort((a, b) => {
      const rank = (t) => t.startsWith('RB') ? 0 : t.startsWith('DB') ? 1 : 2;
      if (rank(a) !== rank(b)) return rank(a) - rank(b);
      const num = (t) => parseFloat(t.replace(/[^0-9.]/g, '')) || 0;
      return num(a) - num(b);
    });

    const summaryRows = sortedTypes.map(type => {
      const s = summaryMap[type];
      return [
        type,
        s.bars6 || '-',
        s.bars10 || '-',
        s.bars12 || '-',
        s.totalBars,
        n(s.totalCutLength),
        n(s.totalWeight),
        n(s.totalWeight / 1000, 3)
      ];
    });

    // แถวรวมทั้งหมด
    const totalBars = Object.values(summaryMap).reduce((a, s) => a + s.totalBars, 0);
    const totalCutLen = Object.values(summaryMap).reduce((a, s) => a + s.totalCutLength, 0);
    const totalWeight = Object.values(summaryMap).reduce((a, s) => a + s.totalWeight, 0);
    const summaryTotalRow = ['รวมทั้งหมดทั้งโครงการ', '-', '-', '-', totalBars, n(totalCutLen), n(totalWeight), n(totalWeight / 1000, 3)];

    const ws2 = XLSX.utils.aoa_to_sheet([
      ['ตารางสรุปรวมทั้งโครงการ (GRAND TOTAL – ทุกหมวดหมู่)'],
      [`ส่งออกเมื่อ: ${new Date().toLocaleString('th-TH')}`],
      [],
      summaryHeaders,
      ...summaryRows,
      [],
      summaryTotalRow
    ]);

    ws2['!cols'] = [
      { wch: 24 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
      { wch: 16 }, { wch: 22 }, { wch: 18 }, { wch: 16 }
    ];

    // ── Sheet 3: ตารางสรุปรายหมวด ──
    const groupMap = {};
    items.forEach(it => {
      const grp = it.group || it.category || 'ไม่ระบุหมวด';
      if (!groupMap[grp]) groupMap[grp] = [];
      groupMap[grp].push(it);
    });

    const ws3Rows = [
      ['ตารางสรุปแยกหมวด / กลุ่มโครงสร้าง'],
      [`ส่งออกเมื่อ: ${new Date().toLocaleString('th-TH')}`],
      []
    ];

    Object.entries(groupMap).forEach(([grp, grpItems]) => {
      ws3Rows.push([`【 ${grp} 】`, '', '', '', '', '', '', '']);
      ws3Rows.push(['ขนาดเหล็ก', 'จำนวนเส้น', 'ความยาวรวม (ม.)', 'น้ำหนักรวม (กก.)', 'น้ำหนักรวม (ตัน)', '', '', '']);

      // จัดกลุ่มตามขนาดใน group
      const subMap = {};
      grpItems.forEach(it => {
        const type = it.rebarType || it.barType || 'DB20';
        if (!subMap[type]) subMap[type] = { bars: 0, len: 0, weight: 0 };
        const bars = it.standardBarsNeeded !== undefined ? +it.standardBarsNeeded : +(it.barsNeeded || 0);
        subMap[type].bars += bars;
        subMap[type].len += +(it.totalCutLength || 0);
        subMap[type].weight += +(it.totalWeightKg !== undefined ? it.totalWeightKg : (it.weightKg || 0));
      });

      Object.entries(subMap).forEach(([type, s]) => {
        ws3Rows.push([type, s.bars, n(s.len), n(s.weight), n(s.weight / 1000, 3), '', '', '']);
      });
      ws3Rows.push(['', '', '', '', '', '', '', '']);
    });

    const ws3 = XLSX.utils.aoa_to_sheet(ws3Rows);
    ws3['!cols'] = [
      { wch: 22 }, { wch: 14 }, { wch: 20 }, { wch: 18 }, { wch: 16 }, { wch: 8 }, { wch: 8 }, { wch: 8 }
    ];

    // ── สร้าง Workbook ──
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws1, 'รายการถอดเหล็กทั้งหมด');
    XLSX.utils.book_append_sheet(wb, ws2, 'สรุปรวม GRAND TOTAL');
    XLSX.utils.book_append_sheet(wb, ws3, 'สรุปแยกหมวด');

    const xlsxBuffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    const fileName = `รายการถอดเหล็ก_BBS_${new Date().toISOString().slice(0, 10)}.xlsx`;
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(fileName)}`);
    res.send(xlsxBuffer);
  } catch (err) {
    console.error('[Export XLSX Error]', err);
    res.status(500).json({ error: err.message });
  }
});

// Export CSV (legacy – ยังคงไว้เพื่อ AutoCAD DataLink)
app.get('/api/rebar/export/bbs.csv', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    let csv = 'ลำดับ,ชิ้นส่วนโครงสร้าง,ขนาดเหล็ก,ความยาวมาตรฐาน (ม.),ความยาวตัด (ม.),จำนวน (ท่อน),ได้ท่อน/เส้น,สั่งเส้นเต็ม (เส้น),เศษเหลือ/เส้น (ม.),รวมความยาวตัด (ม.),รวมเศษเหลือ (ม.),น้ำหนักต่อเมตร (กก./ม.),น้ำหนักรวม (กก.),% เศษสูญเสีย\n';
    items.forEach((it, idx) => {
      const label = it.label || it.member || '-';
      const type = it.rebarType || it.barType || 'DB20';
      const stdLen = it.standardLength || 12;
      const cutLen = it.cutLength || 0;
      const qty = it.quantity || 1;
      const pieces = it.piecesPerBar || it.piecesPerStandardBar || 1;
      const bars = it.standardBarsNeeded !== undefined ? it.standardBarsNeeded : (it.barsNeeded || 0);
      const offcut = it.offcutPerBar || 0;
      const totalCut = it.totalCutLength || 0;
      const totalOffcut = it.totalScrapLength !== undefined ? it.totalScrapLength : (it.totalOffcutLength || 0);
      const unitW = it.unitWeight || it.weightPerMeter || 2.47;
      const totalW = it.totalWeightKg !== undefined ? it.totalWeightKg : (it.weightKg || 0);
      const waste = it.scrapPercent !== undefined ? it.scrapPercent : (it.wastePercent || 0);
      csv += `${idx + 1},"${label}","${type}",${stdLen},${cutLen},${qty},${pieces},${bars},${offcut},${totalCut},${totalOffcut},${unitW},${totalW},${waste}%\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rebar_bbs_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status & Backup
app.get('/api/status', async (req, res) => {
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
    const siteLogs = await DataService.getSiteLogs(true);
    const vaultItems = await DataService.getVaultItems();
    const rebarItems = await DataService.getRebarItems();
    const rebarOffcuts = await DataService.getRebarOffcuts();
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: 'Yutthakan Portfolio & Architectural Management',
      profile,
      projects,
      messages,
      siteLogs,
      vaultItems,
      rebarItems,
      rebarOffcuts
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
  if (!process.env.VERCEL) {
    app.listen(PORT, () => {
      console.log(`🚀 Portfolio Server running at port ${PORT}`);
    });
  }
});

export default app;
