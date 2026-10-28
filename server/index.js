import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { DataService, connectDB, DEFAULT_OWNER } from './db.js';
import { loginHandler, requestOtpHandler, verifyOtpAndResetHandler, requireAdmin } from './auth.js';
import jwt from 'jsonwebtoken';

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
    status: 'online',
    app: 'Yutthakan Portfolio & Architectural Management API',
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

// Categories Management (เพิ่ม/ลบ หมวดหมู่ผลงาน)
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
      return res.status(400).json({ error: 'กรุณากรอกชื่อหมวดหมู่' });
    }
    const categories = await DataService.addCategory(category);
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:name', requireAdmin, async (req, res) => {
  try {
    const categories = await DataService.deleteCategory(req.params.name);
    res.json(categories);
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

// Hire Me Messages (รองรับรูปถ่ายที่ลูกค้าแนบมา)
app.post('/api/contact', async (req, res) => {
  try {
    const { name, phone, lineId, projectType, budget, message, images } = req.body;
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
      images: Array.isArray(images) ? images : [],
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

app.delete('/api/contact/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteMessage(req.params.id);
    res.json({ success: true, message: 'ลบข้อความเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Private Vault (คลังข้อมูลส่วนตัว / อีเมลกันลืม ป้องกันด้วยรหัส PIN แยก) ---
app.post('/api/vault/verify-pin', requireAdmin, async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin) return res.status(400).json({ error: 'กรุณากรอกรหัส PIN' });
    const result = await DataService.verifyVaultPin(pin);
    res.json(result);
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
    if (!updated) return res.status(404).json({ error: 'ไม่พบบันทึกงานนี้' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/site-logs/:id', requireAdmin, async (req, res) => {
  try {
    await DataService.deleteSiteLog(req.params.id);
    res.json({ success: true, message: 'ลบบันทึกงานเรียบร้อย' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้ชมเว็ปไซต์ส่ง Feedback / ข้อเสนอแนะ / ติ๊กแก้ไขทิศทาง
app.post('/api/site-logs/:id/feedback', async (req, res) => {
  try {
    const feedback = await DataService.addSiteLogFeedback(req.params.id, req.body);
    res.status(201).json({ success: true, feedback });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แอดมินกดรับเรื่อง และกำหนดสถานะ / วันที่เสร็จ
app.put('/api/site-logs/:id/acknowledge', requireAdmin, async (req, res) => {
  try {
    const updated = await DataService.acknowledgeSiteLogFeedback(req.params.id, req.body);
    res.json({ success: true, log: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// File Upload & Serving Endpoint
app.post('/api/upload', requireAdmin, async (req, res) => {
  try {
    const { name, type, mimeType, dataBase64, size } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลไฟล์รูป' });
    }
    const saved = await DataService.saveFile({ name, type, mimeType, dataBase64, size });
    res.status(201).json({ success: true, message: 'ส่งไฟล์เข้า MongoDB Atlas สำเร็จ!', ...saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Public image upload สำหรับลูกค้าส่งรูปแนบใบจ้างงาน หรือรายงานหน้างาน
app.post('/api/upload-public', async (req, res) => {
  try {
    const { name, type, mimeType, dataBase64, size } = req.body;
    if (!dataBase64) {
      return res.status(400).json({ error: 'ไม่พบข้อมูลไฟล์รูป' });
    }
    // ตรวจสอบขนาดไม่ให้เกิน 3MB ต่อรูป
    if (size && size > 3 * 1024 * 1024) {
      return res.status(400).json({ error: 'ไฟล์ภาพขนาดใหญ่เกินไป' });
    }
    const saved = await DataService.saveFile({ name, type: type || 'webp', mimeType: mimeType || 'image/webp', dataBase64, size });
    res.status(201).json({ success: true, ...saved });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/files/:id', async (req, res) => {
  try {
    const file = await DataService.getFile(req.params.id);
    if (!file) return res.status(404).json({ error: 'ไม่พบไฟล์นี้ในระบบ' });

    let base64Data = file.dataBase64;
    let mime = file.mimeType || 'image/webp';
    if (base64Data.startsWith('data:')) {
      const parts = base64Data.split(',');
      const match = parts[0].match(/:(.*?);/);
      if (match) mime = match[1];
      base64Data = parts[1];
    }
    const imgBuffer = Buffer.from(base64Data, 'base64');
    res.setHeader('Content-Type', mime);
    res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    res.send(imgBuffer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- Rebar Cutting List & Real-time Two-Way Sync (AutoCAD & SketchUp) ---
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

// Download AutoCAD AutoLISP Plugin (.lsp)
app.get('/api/rebar/plugin/autocad.lsp', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const lspContent = `;;; =========================================================================
;;; AutoLISP: Yutthakan Rebar Cut List & BBS Real-Time Sync for AutoCAD
;;; สถาปนิกและผู้เชี่ยวชาญ: ยุทธการ คำกลอน
;;; =========================================================================
(vl-load-com)

(defun c:REBAR_HELP ()
  (princ "\\n=======================================================")
  (princ "\\nคำสั่งปลั๊กอินถอดเหล็กเส้น (Bar Bending Schedule - BBS):")
  (princ "\\n  REBAR_SYNC - ส่งข้อมูลเหล็กขึ้นเว็บไซต์ Real-Time ทันที")
  (princ "\\n  REBAR_DRAW - ดึงข้อมูลเหล็กจากระบบ Cloud มาวาดตารางลง DWG")
  (princ "\\n  REBAR_WEB  - เปิดหน้าเว็บจัดการเหล็กเส้นบน Web Browser")
  (princ "\\n=======================================================\\n")
  (princ)
)

(defun c:REBAR_WEB ()
  (command "_.BROWSER" "${baseUrl}/#admin")
  (princ "\\nกำลังเปิดหน้าต่างจัดการเหล็กเส้นบนเว็บ...")
  (princ)
)

;; ส่งข้อมูลชิ้นงานจาก AutoCAD ขึ้นเว็บ
(defun c:REBAR_SYNC (/ member bar cut qty url http payload res)
  (princ "\\n=== ส่งข้อมูลการตัดเหล็กเส้นจาก AutoCAD ขึ้นระบบเว็บ Real-Time ===")
  (setq member (getstring T "\\nระบุชื่อชิ้นส่วนโครงสร้าง (เช่น เสา C1 หรือ คาน B1): "))
  (if (= member "") (setq member "ชิ้นส่วนทั่วไป"))
  (setq bar (getstring "\\nระบุขนาดเหล็ก (เช่น DB20, DB16, DB12, RB9, RB6): "))
  (if (= bar "") (setq bar "DB20"))
  (setq cut (getreal "\\nระบุความยาวที่ตัดใช้ (เมตร เช่น 6.0): "))
  (if (null cut) (setq cut 6.0))
  (setq qty (getint "\\nระบุจำนวนท่อนที่ต้องการตัด (ท่อน): "))
  (if (null qty) (setq qty 1))

  (setq payload (strcat "{\\"member\\":\\"" member "\\",\\"barType\\":\\"" bar "\\",\\"standardLength\\":12.0,\\"cutLength\\":" (rtos cut 2 2) ",\\"quantity\\":" (itoa qty) "}"))

  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if http
    (progn
      (setq url "${baseUrl}/api/rebar")
      (vlax-invoke-method http 'open "POST" url :vlax-false)
      (vlax-invoke-method http 'setRequestHeader "Content-Type" "application/json")
      (vl-catch-all-apply 'vlax-invoke-method (list http 'send payload))
      (setq res (vlax-get-property http 'responseText))
      (vlax-release-object http)
      (princ (strcat "\\n[สำเร็จ!] ส่งข้อมูล " member " (" bar " ตัด " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน) ขึ้นหน้าเว็บเรียบร้อยแล้ว!"))
    )
    (princ "\\nไม่สามารถสร้าง COM Object สำหรับส่ง HTTP ได้")
  )
  (princ)
)

;; ดึงข้อมูลมาวาดตารางลง DWG
(defun c:REBAR_DRAW (/ pt http url json)
  (setq pt (getpoint "\\nคลิกตำแหน่งที่ต้องการวางตาราง Bar Bending Schedule (BBS): "))
  (if pt
    (progn
      (princ "\\nกำลังเชื่อมต่อดึงข้อมูลตารางเหล็กเส้นจากระบบ Cloud...")
      (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
      (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
      (if http
        (progn
          (setq url "${baseUrl}/api/rebar")
          (vlax-invoke-method http 'open "GET" url :vlax-false)
          (vlax-invoke-method http 'setRequestHeader "Content-Type" "application/json")
          (vl-catch-all-apply 'vlax-invoke-method (list http 'send))
          (setq json (vlax-get-property http 'responseText))
          (vlax-release-object http)
          (if (and json (/= json ""))
            (progn
              (command "_.TEXT" pt 0.35 0 "=== ตารางถอดเหล็กเสริม (Bar Bending Schedule - BBS) ===")
              (command "_.TEXT" (polar pt (* 1.5 pi) 0.6) 0.22 0 "ซิงค์ Real-Time กับระบบพอร์ตโฟลิโอ: ยุทธการ คำกลอน")
              (princ (strcat "\\n[สำเร็จ] วาดตาราง BBS ที่พิกัด " (vl-princ-to-string pt) " เรียบร้อย!"))
            )
            (princ "\\nไม่สามารถดึงข้อมูลได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือเซิร์ฟเวอร์")
          )
        )
      )
    )
  )
  (princ)
)

(princ "\\n[สำเร็จ] โหลดปลั๊กอิน Yutthakan Rebar Sync เรียบร้อย! พิมพ์ REBAR_HELP เพื่อดูคำสั่ง")
(princ)
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rebar_sync.lsp"');
  res.send(lspContent);
});

// Download SketchUp Ruby Plugin (.rb)
app.get('/api/rebar/plugin/sketchup.rb', (req, res) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  const rbContent = `# =========================================================================
# SketchUp Ruby Extension: Yutthakan Rebar BBS Live Sync
# พัฒนาสำหรับคุณยุทธการ คำกลอน (SketchUp Specialist)
# =========================================================================
require 'sketchup.rb'
require 'net/http'
require 'json'
require 'uri'

module YutthakanRebarSync
  API_BASE_URL = '${baseUrl}/api/rebar'
  WEB_UI_URL   = '${baseUrl}/#admin'

  # 1. เปิดหน้าต่าง Live Sync (HtmlDialog) ฝังใน SketchUp
  def self.open_live_dialog
    options = {
      dialog_title: "ถอดเหล็กเส้น & Live Sync - ยุทธการ คำกลอน",
      preferences_key: "YutthakanRebarDialog",
      scrollable: true,
      resizable: true,
      width: 1050,
      height: 720,
      min_width: 800,
      min_height: 500
    }
    dialog = UI::HtmlDialog.new(options)
    dialog.set_url(WEB_UI_URL)
    dialog.show
  end

  # 2. วาดโมเดล 3D เหล็กเส้นทรงกระบอกตามขนาดและความยาวจริงใน SketchUp
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
          bar_type = item['barType'] || 'DB20'
          diameter_mm = bar_type.gsub(/\\D/, '').to_f
          diameter_mm = 20.0 if diameter_mm == 0
          radius = (diameter_mm / 2.0).mm

          cut_length = (item['cutLength'] || 6.0).to_f.m
          offcut_length = (item['offcutPerBar'] || 0.0).to_f.m

          group = model.active_entities.add_group
          group.name = "#{item['member']} - #{bar_type} (ตัด #{item['cutLength']}ม.)"

          # วาดท่อนตัดใช้งาน (สีเขียว Emerald)
          circle = group.entities.add_circle([origin_x, 0, 0], [0, 1, 0], radius, 16)
          face = group.entities.add_face(circle)
          face.pushpull(-cut_length)

          mat_cut = model.materials["Rebar_Cut"] || model.materials.add("Rebar_Cut")
          mat_cut.color = Sketchup::Color.new(16, 185, 129)
          group.material = mat_cut

          # วาดเศษเหล็กที่เหลือต่อท้าย (สีส้ม Amber) ถ้ามี
          if offcut_length > 0
            off_group = model.active_entities.add_group
            off_group.name = "เศษเหลือ #{bar_type} (#{item['offcutPerBar']}ม.)"
            off_circle = off_group.entities.add_circle([origin_x, cut_length + 0.1.m, 0], [0, 1, 0], radius, 16)
            off_face = off_group.entities.add_face(off_circle)
            off_face.pushpull(-offcut_length)

            mat_off = model.materials["Rebar_Offcut"] || model.materials.add("Rebar_Offcut")
            mat_off.color = Sketchup::Color.new(245, 158, 11)
            off_group.material = mat_off
          end

          origin_x += 0.5.m
        end

        UI.messagebox("สร้างโมเดล 3D เหล็กเส้นสำเร็จจำนวน #{items.length} รายการ!")
      else
        UI.messagebox("ไม่สามารถดึงข้อมูลจากเซิร์ฟเวอร์ได้")
      end
    rescue => e
      UI.messagebox("เกิดข้อผิดพลาด: #{e.message}")
    end

    model.commit_operation
  end

  unless file_loaded?(__FILE__)
    menu = UI.menu('Plugins').add_submenu('ระบบถอดเหล็กเส้น (ยุทธการ)')
    menu.add_item('เปิดหน้าต่าง Live Sync (HtmlDialog)') { open_live_dialog }
    menu.add_item('สร้างโมเดล 3D เหล็กเส้นจริงใน SketchUp') { draw_3d_rebars }
    file_loaded(__FILE__)
  end
end
`;

  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="rebar_live_sync.rb"');
  res.send(rbContent);
});

// Export CSV for Excel, BOQ, or AutoCAD DataLink
app.get('/api/rebar/export/bbs.csv', async (req, res) => {
  try {
    const items = await DataService.getRebarItems();
    let csv = 'ลำดับ,ชิ้นส่วนโครงสร้าง,ขนาดเหล็ก,ความยาวมาตรฐาน (ม.),ความยาวตัด (ม.),จำนวน (ท่อน),ได้ท่อน/เส้น,สั่งเส้นเต็ม (เส้น),เศษเหลือ/เส้น (ม.),รวมความยาวตัด (ม.),รวมเศษเหลือ (ม.),น้ำหนักต่อเมตร (กก./ม.),น้ำหนักรวม (กก.),% เศษสูญเสีย,หมายเหตุ\n';
    items.forEach((it, idx) => {
      csv += `${idx + 1},"${it.member}","${it.barType}",${it.standardLength},${it.cutLength},${it.quantity},${it.piecesPerStandardBar},${it.barsNeeded},${it.offcutPerBar},${it.totalCutLength},${it.totalOffcutLength},${it.weightPerMeter},${it.weightKg},${it.wastePercent}%,"${it.notes || ''}"\n`;
    });
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="rebar_bbs_${Date.now()}.csv"`);
    res.send('\uFEFF' + csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// System Status & Backup
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
    const siteLogs = await DataService.getSiteLogs(true);
    const vaultItems = await DataService.getVaultItems();
    const backupData = {
      exportDate: new Date().toISOString(),
      appName: 'Yutthakan Portfolio & Architectural Management',
      profile,
      projects,
      messages,
      siteLogs,
      vaultItems
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
