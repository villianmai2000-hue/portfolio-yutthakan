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
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol === 'https' || req.get('x-forwarded-proto') === 'https' ? 'https' : 'http';
  const baseUrl = `${protocol}://${host}`;

  // ดึงหมวดหมู่และชิ้นส่วนที่มีอยู่ในระบบปัจจุบัน
  let groups = ['เหล็กเสริมเสา', 'F1-C1 NO.1', 'งานเสา', 'งานคาน', 'ฐานรากทั่วไป'];
  let members = ['เสา C1', 'เสา C2', 'คาน B1', 'คาน B2', 'ฐานราก F1', 'พื้น S1'];
  try {
    const items = await DataService.getRebarItems();
    const dbGroups = [...new Set(items.map(x => (x.group || x.category || '').trim()).filter(Boolean))];
    const dbMembers = [...new Set(items.map(x => (x.label || x.member || '').trim()).filter(Boolean))];
    if (dbGroups.length > 0) groups = dbGroups;
    if (dbMembers.length > 0) members = dbMembers;
  } catch (err) {
    console.error('Error fetching rebar items for lsp:', err);
  }

  const groupsLsp = groups.map(g => `"${g.replace(/"/g, '\\"')}"`).join(' ');
  const membersLsp = members.map(m => `"${m.replace(/"/g, '\\"')}"`).join(' ');

  const lspContent = `;;; =========================================================================
;;; AutoLISP: Yutthakan Rebar Cut List & BBS Real-Time Sync for AutoCAD v3.0
;;; สถาปนิกและผู้เชี่ยวชาญ: ยุทธการ คำกลอน
;;; ออกแบบรองรับการเลือกหมวดที่มีในระบบ หรือพิมพ์ชื่อใหม่ได้ 100% ต่อเนื่องไม่หลุด
;;; =========================================================================
(vl-load-com)

;;; ฟังก์ชันช่วยแยกข้อความ (String Split)
(defun rebar-str-split (delim str / pos lst dlen)
  (setq dlen (strlen delim))
  (while (setq pos (vl-string-search delim str))
    (setq lst (cons (substr str 1 pos) lst))
    (setq str (substr str (+ pos 1 dlen)))
  )
  (reverse (cons str lst))
)
(defun vl-string-split (d s) (rebar-str-split d s))

;;; แสดงคำแนะนำการใช้งาน
(defun c:REBAR_HELP ()
  (princ "\n=======================================================")
  (princ "\nคำสั่งระบบถอดเหล็กเส้นและคลังเศษ (BBS System v3.0):")
  (princ "\n  REBAR_SYNC     - ส่งข้อมูลตัดเหล็ก 6 ขั้นตอน (เลือกหมวดในระบบ หรือพิมพ์ใหม่)")
  (princ "\n  REBAR_DRAW     - วาดตาราง BBS สวยงามลงใน Drawing อัตโนมัติ")
  (princ "\n  REBAR_OFFCUTS  - ตรวจสอบรายการเศษเหล็กคงเหลือสะสมในระบบ")
  (princ "\n  REBAR_WEB      - เปิดหน้าเว็บจัดการเหล็กเส้นบน Web Browser")
  (princ "\n=======================================================\n")
  (princ)
)

;;; เปิดหน้าต่างเว็บ
(defun c:REBAR_WEB ()
  (command "_.BROWSER" "${baseUrl}/#admin")
  (princ "\nกำลังเปิดหน้าต่างจัดการเหล็กเส้นบนเว็บ...")
  (princ)
)

;;; ตัวแปรเก็บหมวดและชิ้นส่วนที่มีอยู่ในระบบ (ดึงมาจากฐานข้อมูลจริง)
(setq *rebar-groups*  (list ${groupsLsp}))
(setq *rebar-members* (list ${membersLsp}))

;;; ฟังก์ชันช่วยดึงหมวดและชิ้นส่วนล่าสุดจากระบบแบบ Real-Time ก่อนเริ่มคำสั่ง
(defun rebar-fetch-latest-metadata (/ http url res lines line parts gList mList)
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
  (if http
    (progn
      (setq url "${baseUrl}/api/rebar/metadata.txt")
      (vlax-invoke-method http 'open "GET" url :vlax-false)
      (setq err (vl-catch-all-apply 'vlax-invoke-method (list http 'send)))
      (if (not (vl-catch-all-error-p err))
        (progn
          (setq res (vlax-get-property http 'responseText))
          (if (and res (/= res "") (/= res "ERROR"))
            (progn
              (setq lines (rebar-str-split "\n" res))
              (foreach line lines
                (if (wcmatch line "GROUPS:*")
                  (progn
                    (setq parts (rebar-str-split "|" (substr line 8)))
                    (if parts (setq *rebar-groups* parts))
                  )
                )
                (if (wcmatch line "MEMBERS:*")
                  (progn
                    (setq parts (rebar-str-split "|" (substr line 9)))
                    (if parts (setq *rebar-members* parts))
                  )
                )
              )
            )
          )
        )
      )
      (vlax-release-object http)
    )
  )
)

;;; --- ฟังก์ชันเลือกจากระบบ หรือพิมพ์ชื่อใหม่ (รับประกันความต่อเนื่อง 100% ไม่หลุด ไม่ข้าม) ---
(defun rebar-select-or-new (lst title / i item ans num chosen)
  (princ "\n=======================================================")
  (princ (strcat "\n--- " title " (ที่มีอยู่ในระบบปัจจุบัน) ---"))
  (setq i 1)
  (foreach item lst
    (princ (strcat "\n  [" (itoa i) "] " item))
    (setq i (1+ i))
  )
  (princ "\n=======================================================")

  (setq ans "")
  (while (= ans "")
    (setq ans (getstring T (strcat "\nเลือกหมายเลข [1-" (itoa (length lst)) "] หรือพิมพ์ชื่อใหม่: ")))
    (setq ans (vl-string-trim " \t\r\n" ans))
    (if (= ans "")
      (princ "\n[!] กรุณาเลือกหมายเลข หรือพิมพ์ชื่อ (ห้ามเว้นว่าง): ")
    )
  )

  (setq num (atoi ans))
  ;; ถ้าผู้ใช้พิมพ์ตัวเลขที่ตรงกับรายการ ให้ดึงชื่อจากระบบ
  (if (and (> num 0) (<= num (length lst)) (numberp (read ans)))
    (progn
      (setq chosen (nth (1- num) lst))
      (princ (strcat "\n[✓ เลือกหมวดเดิมในระบบ]: " chosen))
    )
    ;; ถ้าพิมพ์ข้อความ ให้บันทึกเป็นชื่อใหม่ทันที
    (progn
      (setq chosen ans)
      (princ (strcat "\n[✓ เพิ่มชื่อใหม่]: " chosen))
    )
  )
  chosen
)

;;; =========================================================================
;;; คำสั่งหลัก: REBAR_SYNC (6 ขั้นตอนตามลำดับเดิม ต่อเนื่องสมบูรณ์ 100%)
;;; =========================================================================
(defun c:REBAR_SYNC (/ olderr grp member barIdx bartype stdIdx stdlen cut qty useOffcut offcutId http payload url res err)
  (setq olderr *error*)
  (defun *error* (msg)
    (if (and msg (/= msg "Function cancelled") (/= msg "quit / exit abort"))
      (princ (strcat "\n[แจ้งเตือน]: " msg))
    )
    (princ "\n[ยกเลิกคำสั่ง REBAR_SYNC เรียบร้อย]")
    (setq *error* olderr)
    (princ)
  )

  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กเส้น (BBS) v3.0 - ยุทธการ คำกลอน")
  (princ "\n=======================================================")

  ;; ดึงข้อมูลหมวดและชิ้นส่วนล่าสุดจากระบบก่อน
  (rebar-fetch-latest-metadata)

  ;;; ขั้น 1: เลือกกลุ่ม/หมวดงานที่มีในระบบ หรือพิมพ์ชื่อใหม่ได้
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1: กลุ่ม / หมวดงาน"))
  (if (not (member grp *rebar-groups*))
    (setq *rebar-groups* (append *rebar-groups* (list grp)))
  )

  ;;; ขั้น 2: ระบุชื่อส่วนโครงสร้างที่มีในระบบ หรือพิมพ์ชื่อใหม่ได้
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2: ชื่อส่วนโครงสร้าง"))
  (if (not (member member *rebar-members*))
    (setq *rebar-members* (append *rebar-members* (list member)))
  )

  ;;; ขั้น 3: เลือกขนาดเหล็ก (มอก. + เหล็กบีม H-Beam หรือคลังเศษ)
  (princ "\n=======================================================")
  (princ "\n--- ขั้นที่ 3: เลือกขนาดเหล็ก (มอก. + เหล็กบีม) ---")
  (princ "\n  เหล็กกลมผิวเรียบ (RB):  [1]=RB6   [2]=RB9   [3]=RB10  [4]=RB12")
  (princ "\n  เหล็กข้ออ้อย (DB):      [5]=DB10  [6]=DB12  [7]=DB16  [8]=DB20  [9]=DB25  [10]=DB28  [11]=DB32  [12]=DB40")
  (princ "\n  เหล็กบีม H-Beam มอก.:   [13]=H-100x50 [14]=H-100x100 [15]=H-125x125 [16]=H-150x75 [17]=H-150x150 [18]=H-200x100 [19]=H-200x200 [20]=H-250x250 [21]=H-300x300")
  (princ "\n  คลังเศษเหล็กสะสม:       [99]=เลือกดึงเศษในระบบมาใช้")
  (princ "\n=======================================================")

  (setq barIdx "")
  (while (= barIdx "")
    (setq barIdx (getstring T "\nเลือกหมายเลข [1-21 หรือ 99] หรือพิมพ์ขนาด (เช่น DB20, RB9) <DB20>: "))
    (setq barIdx (vl-string-trim " \t\r\n" barIdx))
    (if (= barIdx "") (setq barIdx "DB20"))
  )

  (setq useOffcut "false")
  (setq offcutId "")
  (cond
    ((or (= barIdx "1")  (= (strcase barIdx) "RB6"))  (setq bartype "RB6"))
    ((or (= barIdx "2")  (= (strcase barIdx) "RB9"))  (setq bartype "RB9"))
    ((or (= barIdx "3")  (= (strcase barIdx) "RB10")) (setq bartype "RB10"))
    ((or (= barIdx "4")  (= (strcase barIdx) "RB12")) (setq bartype "RB12"))
    ((or (= barIdx "5")  (= (strcase barIdx) "DB10")) (setq bartype "DB10"))
    ((or (= barIdx "6")  (= (strcase barIdx) "DB12")) (setq bartype "DB12"))
    ((or (= barIdx "7")  (= (strcase barIdx) "DB16")) (setq bartype "DB16"))
    ((or (= barIdx "8")  (= (strcase barIdx) "DB20")) (setq bartype "DB20"))
    ((or (= barIdx "9")  (= (strcase barIdx) "DB25")) (setq bartype "DB25"))
    ((or (= barIdx "10") (= (strcase barIdx) "DB28")) (setq bartype "DB28"))
    ((or (= barIdx "11") (= (strcase barIdx) "DB32")) (setq bartype "DB32"))
    ((or (= barIdx "12") (= (strcase barIdx) "DB40")) (setq bartype "DB40"))
    ((= barIdx "13") (setq bartype "H-100x50"))
    ((= barIdx "14") (setq bartype "H-100x100"))
    ((= barIdx "15") (setq bartype "H-125x125"))
    ((= barIdx "16") (setq bartype "H-150x75"))
    ((= barIdx "17") (setq bartype "H-150x150"))
    ((= barIdx "18") (setq bartype "H-200x100"))
    ((= barIdx "19") (setq bartype "H-200x200"))
    ((= barIdx "20") (setq bartype "H-250x250"))
    ((= barIdx "21") (setq bartype "H-300x300"))
    ((= barIdx "99")
      (progn
        (setq useOffcut "true")
        (princ "\n--- ดึงเศษเหล็กในคลังสะสม ---")
        (setq bartype (getstring T "\nระบุขนาดเศษเหล็กที่ต้องการ (เช่น DB20, DB16) <DB20>: "))
        (setq bartype (vl-string-trim " \t\r\n" bartype))
        (if (= bartype "") (setq bartype "DB20"))
        (setq offcutId (getstring T "\nกรอก ID เศษเหล็กที่เลือก (หรือกด Enter ข้าม): "))
        (setq offcutId (vl-string-trim " \t\r\n" offcutId))
      )
    )
    (t (setq bartype barIdx))
  )
  (princ (strcat "\n[✓] ขนาดเหล็กที่เลือก: " bartype))

  ;;; ขั้น 4: เลือกความยาวมาตรฐานที่นำมาตัด (6m, 10m, 12m)
  (if (= useOffcut "false")
    (progn
      (princ "\n=======================================================")
      (princ "\n--- ขั้นที่ 4: ความยาวเหล็กมาตรฐานที่นำมาตัด ---")
      (princ "\n  [1] 6.0 เมตร   [2] 10.0 เมตร   [3] 12.0 เมตร   [0] กำหนดเอง")
      (princ "\n=======================================================")
      (setq stdIdx "")
      (while (= stdIdx "")
        (setq stdIdx (getstring T "\nเลือกความยาวมาตรฐาน [1=6m / 2=10m / 3=12m / 0=กำหนดเอง] <3>: "))
        (setq stdIdx (vl-string-trim " \t\r\n" stdIdx))
        (if (= stdIdx "") (setq stdIdx "3"))
      )
      (cond
        ((or (= stdIdx "1") (= stdIdx "6"))  (setq stdlen 6.0))
        ((or (= stdIdx "2") (= stdIdx "10")) (setq stdlen 10.0))
        ((or (= stdIdx "3") (= stdIdx "12")) (setq stdlen 12.0))
        (t
          (setq stdlen (getreal "\nระบุความยาวมาตรฐานที่ต้องการ (ม.) <12.0>: "))
          (if (or (null stdlen) (<= stdlen 0)) (setq stdlen 12.0))
        )
      )
      (princ (strcat "\n[✓] ความยาวมาตรฐานที่นำมาตัด: " (rtos stdlen 2 1) " ม."))
    )
    (setq stdlen 12.0)
  )

  ;;; ขั้น 5: ระบุความยาวที่ตัดใช้งานจริง (พิมพ์ตัวเลข หรือคลิก 2 จุดวัดในแบบ)
  (princ "\n=======================================================")
  (princ "\n--- ขั้นที่ 5: ความยาวที่ตัดใช้งานจริง ---")
  (setq cut nil)
  (while (or (null cut) (<= cut 0))
    (setq cut (getdist "\nระบุความยาวตัดใช้งานจริง (ม.) หรือคลิกวัด 2 จุดในแบบ <6.0>: "))
    (if (null cut) (setq cut 6.0))
    (if (<= cut 0) (princ "\n[!] ความยาวต้องมากกว่า 0"))
  )
  (princ (strcat "\n[✓] ความยาวตัดใช้งานจริง: " (rtos cut 2 2) " ม."))

  ;;; ขั้น 6: ระบุจำนวนท่อนที่ต้องการตัด
  (princ "\n=======================================================")
  (princ "\n--- ขั้นที่ 6: จำนวนท่อนที่ต้องการตัด ---")
  (setq qty nil)
  (while (or (null qty) (<= qty 0))
    (setq qty (getint "\nระบุจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
    (if (null qty) (setq qty 1))
    (if (<= qty 0) (princ "\n[!] จำนวนต้องมากกว่า 0"))
  )
  (princ (strcat "\n[✓] จำนวนท่อนที่ตัด: " (itoa qty) " ท่อน"))

  ;;; เตรียมข้อมูล JSON ส่งขึ้นระบบ Cloud Real-Time
  (setq payload (strcat
    "{\"label\":\"" member "\""
    ",\"member\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"category\":\"" grp "\""
    ",\"rebarType\":\"" bartype "\""
    ",\"barType\":\"" bartype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":" useOffcut
    ",\"reusedOffcutId\":\"" offcutId "\"}"
  ))

  (princ "\nกำลังส่งข้อมูลขึ้นเว็บเซิร์ฟเวอร์...")
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.ServerXMLHTTP")))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP.6.0")))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))

  (if http
    (progn
      (setq url "${baseUrl}/api/rebar")
      (vlax-invoke-method http 'open "POST" url :vlax-false)
      (vlax-invoke-method http 'setRequestHeader "Content-Type" "application/json; charset=utf-8")
      (setq err (vl-catch-all-apply 'vlax-invoke-method (list http 'send payload)))
      (if (vl-catch-all-error-p err)
        (princ (strcat "\n[เกิดข้อผิดพลาดในการเชื่อมต่อ]: " (vl-catch-all-error-message err)))
        (progn
          (setq res (vlax-get-property http 'responseText))
          (princ "\n=======================================================")
          (princ (strcat "\n[✓ บันทึกสำเร็จ!] [" grp "] " member " (" bartype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
          (princ "\n[✓ ข้อมูลซิงก์ขึ้นระบบเรียบร้อย หน้าเว็บจะอัปเดตอัตโนมัติภายใน 5 วินาที]")
          (princ "\n=======================================================\n")
        )
      )
      (vlax-release-object http)
    )
    (princ "\n[ข้อผิดพลาด] ไม่สามารถสร้างตัวเชื่อมต่อ HTTP ใน Windows ได้")
  )

  (setq *error* olderr)
  (princ)
)

;;; คำสั่ง REBAR_OFFCUTS: ตรวจสอบรายการเศษเหล็กสะสมในระบบ
(defun c:REBAR_OFFCUTS (/ http url res)
  (princ "\nกำลังดึงรายการเศษเหล็กคงเหลือสะสมจากระบบ...")
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
  (if http
    (progn
      (setq url "${baseUrl}/api/rebar/offcuts")
      (vlax-invoke-method http 'open "GET" url :vlax-false)
      (vl-catch-all-apply 'vlax-invoke-method (list http 'send))
      (setq res (vlax-get-property http 'responseText))
      (vlax-release-object http)
      (princ (strcat "\n[รายการเศษเหล็กคงเหลือสะสมในระบบ]:\n" (substr res 1 (min 1500 (strlen res)))))
    )
    (princ "\n[ข้อผิดพลาด] ไม่สามารถเชื่อมต่อ HTTP ได้")
  )
  (princ)
)

;;; คำสั่ง REBAR_DRAW: วาดตาราง Bar Bending Schedule (BBS) ลงใน Drawing อัตโนมัติ
(defun c:REBAR_DRAW (/ pt http url csvText lines rowIdx y startX colWidths line cols x cleanCol cIdx)
  (setq pt (getpoint "\nคลิกตำแหน่งจุดเริ่มต้นที่จะวางตาราง Bar Bending Schedule (BBS): "))
  (if pt
    (progn
      (princ "\nกำลังดาวน์โหลดข้อมูลตารางเหล็กเส้นจากเซิร์ฟเวอร์...")
      (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
      (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
      (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
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
              (setq lines (rebar-str-split "\n" csvText))
              (setq rowIdx 0)
              (foreach line lines
                (if (/= (vl-string-trim " \r\t" line) "")
                  (progn
                    (setq cols (rebar-str-split "," line))
                    (setq x startX)
                    (setq cIdx 0)
                    (foreach col cols
                      (setq cleanCol (vl-string-trim " \"\r" col))
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
              (princ (strcat "\n[สำเร็จ] สร้างตาราง Bar Bending Schedule จำนวน " (itoa rowIdx) " แถว ลงใน Drawing เรียบร้อย!"))
            )
            (princ "\nไม่สามารถดึงข้อมูลตารางเหล็กได้ กรุณาตรวจสอบอินเทอร์เน็ตหรือเซิร์ฟเวอร์")
          )
        )
      )
    )
  )
  (princ)
)

(princ "\n[สำเร็จ] โหลดปลั๊กอิน Yutthakan Rebar Sync v3.0 เรียบร้อย! พิมพ์ REBAR_SYNC เพื่อเริ่มใช้งาน")
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
