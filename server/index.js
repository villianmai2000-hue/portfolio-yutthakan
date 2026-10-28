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
  (princ "\\nคำสั่งปลั๊กอินถอดเหล็กเส้นและคลังเศษ (BBS System):")
  (princ "\\n  REBAR_SYNC     - ส่งข้อมูลตัดเหล็กจาก CAD ขึ้นเว็บ Real-Time")
  (princ "\\n  REBAR_DRAW     - วาดตาราง BBS สวยงามลงใน Drawing อัตโนมัติ")
  (princ "\\n  REBAR_OFFCUTS  - ดึงรายการเศษเหล็กคงเหลือสะสมมาดูใน CAD")
  (princ "\\n  REBAR_WEB      - เปิดหน้าเว็บจัดการเหล็กเส้นบน Web Browser")
  (princ "\\n=======================================================\\n")
  (princ)
)

(defun c:REBAR_WEB ()
  (command "_.BROWSER" "${baseUrl}/#admin")
  (princ "\\nกำลังเปิดหน้าต่างจัดการเหล็กเส้นบนเว็บ...")
  (princ)
)

;; ส่งข้อมูลชิ้นงานจาก AutoCAD ขึ้นเว็บ พร้อมระบุสถานที่นำเศษไปใช้
(defun c:REBAR_SYNC (/ member bar cut qty usedfor http payload res url)
  (princ "\\n=== ส่งข้อมูลการตัดเหล็กเส้นจาก AutoCAD ขึ้นระบบเว็บ Real-Time ===")
  (setq member (getstring T "\\nระบุชื่อชิ้นส่วนโครงสร้าง (เช่น เสา C1 หรือ คาน B1): "))
  (if (= member "") (setq member "ชิ้นส่วนทั่วไป"))
  (setq bar (getstring "\\nระบุขนาดเหล็ก (เช่น DB20, DB16, DB12, RB9, RB6) [DB20]: "))
  (if (= bar "") (setq bar "DB20"))
  (setq cut (getreal "\\nระบุความยาวที่ตัดใช้ (เมตร เช่น 6.0): "))
  (if (null cut) (setq cut 6.0))
  (setq qty (getint "\\nระบุจำนวนท่อนที่ต้องการตัด (ท่อน) [1]: "))
  (if (null qty) (setq qty 1))
  (setq usedfor (getstring T "\\nระบุเศษนำไปใช้ที่ไหน (เช่น นำไปเสริมคาน B2 หรือกด Enter ข้าม): "))

  (setq payload (strcat
    "{\\"label\\":\\"" member
    "\\",\\"member\\":\\"" member
    "\\",\\"rebarType\\":\\"" bar
    "\\",\\"barType\\":\\"" bar
    "\\",\\"standardLength\\":12.0,\\"cutLength\\":" (rtos cut 2 2)
    ",\\"quantity\\":" (itoa qty)
    ",\\"usedFor\\":\\"" usedfor "\\"}"
  ))

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
      (princ (strcat "\\n[สำเร็จ!] บันทึก " member " (" bar " ตัด " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน) ขึ้นหน้าเว็บเรียบร้อยแล้ว!"))
      (if (/= usedfor "")
        (princ (strcat "\\n[บันทึกเศษ] ระบุเศษนำไปใช้ที่: " usedfor))
      )
    )
    (princ "\\nไม่สามารถสร้าง COM Object สำหรับส่ง HTTP ได้")
  )
  (princ)
)

;; วาดตาราง BBS สวยงามลงใน Drawing
(defun c:REBAR_DRAW (/ pt http url csvText lines rowIdx y startX colWidths line cols x cleanCol cIdx)
  (setq pt (getpoint "\\nคลิกตำแหน่งจุดเริ่มต้นที่จะวางตาราง Bar Bending Schedule (BBS): "))
  (if pt
    (progn
      (princ "\\nกำลังดาวน์โหลดข้อมูลตารางเหล็กเส้นจากเซิร์ฟเวอร์...")
      (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
      (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
      (if http
        (progn
          (setq url "${baseUrl}/api/rebar/export/bbs.csv")
          (vlax-invoke-method http 'open "GET" url :vlax-false)
          (vl-catch-all-apply 'vlax-invoke-method (list http 'send))
          (setq csvText (vlax-get-property http 'responseText))
          (vlax-release-object http)

          (if (and csvText (/= csvText ""))
            (progn
              (setq startX (car pt))
              (setq y (cadr pt))
              (setq colWidths '(1.2 3.8 2.2 2.2 2.0 1.8 2.2 2.2 2.2 2.2 2.4 2.2 4.0))

              ;; Title Header
              (command "_.TEXT" (list startX (+ y 1.2) 0.0) 0.5 0 "ตารางถอดเหล็กเสริมโครงสร้าง (BAR BENDING SCHEDULE - BBS)")
              (command "_.TEXT" (list startX (+ y 0.5) 0.0) 0.28 0 "ผู้ออกแบบ & ควบคุมงาน: ยุทธการ คำกลอน (Auto-Sync Real-Time)")

              ;; Parse CSV lines
              (setq lines (vl-string-split "\\n" csvText))
              (setq rowIdx 0)
              (foreach line lines
                (if (/= (vl-string-trim " \\r\\t" line) "")
                  (progn
                    (setq cols (vl-string-split "," line))
                    (setq x startX)
                    (setq cIdx 0)
                    (foreach col cols
                      (setq cleanCol (vl-string-trim " \\\"\\r" col))
                      (command "_.TEXT" (list (+ x 0.15) (- y (* rowIdx 0.7) 0.45) 0.0) (if (= rowIdx 0) 0.28 0.22) 0 cleanCol)
                      (setq x (+ x (nth (min cIdx (1- (length colWidths))) colWidths)))
                      (setq cIdx (1+ cIdx))
                    )
                    ;; Draw horizontal line below row
                    (command "_.LINE" (list startX (- y (* rowIdx 0.7) 0.65) 0.0) (list x (- y (* rowIdx 0.7) 0.65) 0.0) "")
                    (setq rowIdx (1+ rowIdx))
                  )
                )
              )
              ;; Draw top horizontal line
              (command "_.LINE" (list startX y 0.0) (list x y 0.0) "")
              (princ (strcat "\\n[สำเร็จ] สร้างตาราง Bar Bending Schedule จำนวน " (itoa rowIdx) " แถว ลงใน Drawing เรียบร้อย!"))
            )
            (princ "\\nไม่สามารถดึงข้อมูลตารางเหล็กได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือเซิร์ฟเวอร์")
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
          bar_type = item['barType'] || item['rebarType'] || 'DB20'
          diameter_mm = bar_type.gsub(/\\D/, '').to_f
          diameter_mm = 20.0 if diameter_mm == 0
          radius = (diameter_mm / 2.0).mm

          cut_length = (item['cutLength'] || 6.0).to_f.m
          offcut_length = (item['offcutPerBar'] || 0.0).to_f.m
          qty = (item['quantity'] || 1).to_i

          qty.times do |q_idx|
            center_point = Geom::Point3d.new(origin_x.m, (q_idx * 0.25).m, 0)
            circle = model.entities.add_circle(center_point, Geom::Vector3d.new(0, 0, 1), radius)
            face = model.entities.add_face(circle)
            face.pushpull(cut_length) if face
          end
          origin_x += 0.5
        end

        model.commit_operation
        UI.messagebox("สร้างโมเดล 3D เหล็กเส้นตามตาราง BBS สำเร็จเรียบร้อย!")
      else
        UI.messagebox("ไม่สามารถดึงข้อมูลจาก Server ได้")
      end
    rescue => e
      UI.messagebox("เกิดข้อผิดพลาด: #{e.message}")
    end
  end
end

if !defined?(@yutthakan_menu_loaded)
  plugins_menu = UI.menu("Plugins")
  rebar_menu = plugins_menu.add_submenu("ถอดเหล็กเส้น (BBS)")
  rebar_menu.add_item("เปิดหน้าต่าง Live Sync Web") { YutthakanRebarSync.open_live_dialog }
  rebar_menu.add_item("สร้างโมเดล 3D เหล็กเส้นจริง") { YutthakanRebarSync.draw_3d_rebars }
  @yutthakan_menu_loaded = true
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
    let csv = 'ลำดับ,ชิ้นส่วนโครงสร้าง,ขนาดเหล็ก,ความยาวมาตรฐาน (ม.),ความยาวตัด (ม.),จำนวน (ท่อน),ได้ท่อน/เส้น,สั่งเส้นเต็ม (เส้น),เศษเหลือ/เส้น (ม.),รวมความยาวตัด (ม.),รวมเศษเหลือ (ม.),น้ำหนักต่อเมตร (กก./ม.),น้ำหนักรวม (กก.),% เศษสูญเสีย,เศษนำไปใช้ที่ไหน\n';
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
      const usedFor = it.usedFor || it.note || '';

      csv += `${idx + 1},"${label}","${type}",${stdLen},${cutLen},${qty},${pieces},${bars},${offcut},${totalCut},${totalOffcut},${unitW},${totalW},${waste}%,"${usedFor}"\n`;
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
