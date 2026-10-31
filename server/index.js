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
  let groups = ['เหล็กเสริมเสา', 'F1-C1 NO.1', 'งานเสา', 'งานคาน', 'ฐานรากทั่วไป', 'โครงหลังคา'];
  let members = ['เสา C1', 'เสา C2', 'คาน B1', 'คาน B2', 'ฐานราก F1', 'เพลท P1', 'แป C1'];
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
;;; AutoLISP: Yutthakan Structural Material Takeoff & BBS Live Sync v4.0
;;; สถาปนิกและวิศวกรโครงสร้าง: ยุทธการ คำกลอน
;;; รองรับ 7 หมวดวัสดุแยกคำสั่งชัดเจน:
;;;   SYNC_REBAR, SYNC_BEAM, SYNC_PLATE, SYNC_BOX, SYNC_LIPC, SYNC_PIPE, SYNC_PVC
;;;   และคำสั่งรวม SYNC_MENU / REBAR_SYNC
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

;;; ตัวแปรเก็บหมวดและชิ้นส่วนเริ่มต้น
(setq *rebar-groups*  (list ${groupsLsp}))
(setq *rebar-members* (list ${membersLsp}))

;;; ดึงข้อมูลหมวดและชิ้นส่วนล่าสุดจากระบบ
(defun rebar-fetch-latest-metadata (/ http url res raw items spl i itm g m)
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
  (if http
    (progn
      (setq url "${baseUrl}/api/rebar")
      (vl-catch-all-apply 'vlax-invoke-method (list http 'open "GET" url :vlax-false))
      (if (not (vl-catch-all-error-p (vl-catch-all-apply 'vlax-invoke-method (list http 'send))))
        (progn
          (setq res (vlax-get-property http 'responseText))
          (if (and res (/= res ""))
            (progn
              (setq spl (rebar-str-split "{" res))
              (foreach itm spl
                (if (vl-string-search "\"group\":\"" itm)
                  (progn
                    (setq g (substr itm (+ (vl-string-search "\"group\":\"" itm) 10)))
                    (if (vl-string-search "\"" g)
                      (setq g (substr g 1 (vl-string-search "\"" g)))
                    )
                    (if (and g (/= g "") (not (member g *rebar-groups*)))
                      (setq *rebar-groups* (append *rebar-groups* (list g)))
                    )
                  )
                )
                (if (vl-string-search "\"label\":\"" itm)
                  (progn
                    (setq m (substr itm (+ (vl-string-search "\"label\":\"" itm) 10)))
                    (if (vl-string-search "\"" m)
                      (setq m (substr m 1 (vl-string-search "\"" m)))
                    )
                    (if (and m (/= m "") (not (member m *rebar-members*)))
                      (setq *rebar-members* (append *rebar-members* (list m)))
                    )
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

;;; ฟังก์ชันเลือกรายการที่มีในระบบ หรือพิมพ์ชื่อใหม่
(defun rebar-select-or-new (lst title / idx chosen inp maxN outVal i item)
  (princ (strcat "\n--- " title " ---"))
  (princ "\nรายการที่มีในระบบปัจจุบัน:")
  (setq maxN (min (length lst) 15))
  (setq i 0)
  (while (< i maxN)
    (princ (strcat "\n  [" (itoa (1+ i)) "] " (nth i lst)))
    (setq i (1+ i))
  )
  (princ "\n  [N] พิมพ์ชื่อใหม่")
  (setq outVal nil)
  (while (null outVal)
    (setq inp (getstring T "\nเลือกหมายเลข หรือพิมพ์ชื่อใหม่ <1>: "))
    (setq inp (vl-string-trim " \t\r\n" inp))
    (cond
      ((or (= inp "") (= inp "1"))
        (setq outVal (if (> (length lst) 0) (car lst) "งานโครงสร้างทั่วไป"))
      )
      ((and (setq idx (atoi inp)) (> idx 0) (<= idx (length lst)))
        (setq outVal (nth (1- idx) lst))
      )
      ((or (= (strcase inp) "N") (= (strcase inp) "NEW"))
        (setq outVal "")
        (while (= outVal "")
          (setq outVal (getstring T "\nพิมพ์ชื่อใหม่ที่ต้องการเพิ่ม: "))
          (setq outVal (vl-string-trim " \t\r\n" outVal))
        )
      )
      (t
        (setq outVal inp)
      )
    )
  )
  (princ (strcat "\n[✓] เลือก: " outVal))
  outVal
)

;;; ส่งข้อมูลขึ้น Cloud Server
(defun rebar-send-json (payload successMsg / http url res err)
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
          (princ (strcat "\n[✓ บันทึกสำเร็จ!] " successMsg))
          (princ "\n[✓ ข้อมูลซิงก์ขึ้นระบบเรียบร้อย หน้าเว็บจะอัปเดตอัตโนมัติภายใน 5 วินาที]")
          (princ "\n=======================================================\n")
        )
      )
      (vlax-release-object http)
    )
    (princ "\n[ข้อผิดพลาด] ไม่สามารถสร้างตัวเชื่อมต่อ HTTP ใน Windows ได้")
  )
)

;;; =========================================================================
;;; 1. คำสั่ง SYNC_REBAR (ถอดเหล็กเส้น มอก. RB/DB)
;;; =========================================================================
(defun c:SYNC_REBAR (/ grp member barIdx bartype stdIdx stdlen cut qty useOffcut offcutId payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กเส้น (BBS) - ยุทธการ คำกลอน")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2: ชื่อส่วนโครงสร้าง"))

  (princ "\n--- ขั้นที่ 3: เลือกขนาดเหล็กเส้น (มอก.) ---")
  (princ "\n  [1]=RB6   [2]=RB9   [3]=RB10  [4]=RB12")
  (princ "\n  [5]=DB10  [6]=DB12  [7]=DB16  [8]=DB20  [9]=DB25  [10]=DB28  [11]=DB32  [12]=DB40")
  (princ "\n  [99]=เลือกดึงเศษในคลังสต็อกมาใช้")
  (setq barIdx (getstring T "\nเลือกหมายเลข [1-12 หรือ 99] หรือพิมพ์ขนาด <DB20>: "))
  (setq barIdx (vl-string-trim " \t\r\n" barIdx))
  (if (= barIdx "") (setq barIdx "DB20"))

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
    ((= barIdx "99")
      (setq useOffcut "true")
      (setq bartype (getstring T "\nระบุขนาดเศษเหล็กที่ต้องการ (เช่น DB20) <DB20>: "))
      (if (= (vl-string-trim " " bartype) "") (setq bartype "DB20"))
    )
    (t (setq bartype (strcase barIdx)))
  )

  (if (= useOffcut "true")
    (setq stdlen 12.0)
    (progn
      (setq stdIdx (getstring T "\nความยาวมาตรฐาน [1]=6.0m, [2]=10.0m, [3]=12.0m <3>: "))
      (cond
        ((= stdIdx "1") (setq stdlen 6.0))
        ((= stdIdx "2") (setq stdlen 10.0))
        (t (setq stdlen 12.0))
      )
    )
  )

  (setq cut nil)
  (while (or (null cut) (<= cut 0) (> cut stdlen))
    (setq cut (getreal (strcat "\nระบุความยาวที่ตัดใช้จริง (เมตร) ไม่เกิน " (rtos stdlen 2 2) "m <6.0>: ")))
    (if (null cut) (setq cut 6.0))
  )

  (setq qty nil)
  (while (or (null qty) (<= qty 0))
    (setq qty (getint "\nระบุจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
    (if (null qty) (setq qty 1))
  )

  (setq payload (strcat
    "{\"materialCategory\":\"rebar\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" bartype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":" useOffcut
    ",\"reusedOffcutId\":\"" offcutId "\"}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" bartype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)
(defun c:REBAR_SYNC () (c:SYNC_REBAR))

;;; =========================================================================
;;; 2. คำสั่ง SYNC_BEAM (ถอดเหล็กบีม H-Beam / I-Beam / WF)
;;; =========================================================================
(defun c:SYNC_BEAM (/ grp member btype stdlen cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กบีม (H-Beam/I-Beam/WF) - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานเหล็กบีม"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อชิ้นส่วนโครงสร้าง"))

  (princ "\n--- เลือกขนาดเหล็กบีมยอดนิยม หรือพิมพ์ขนาดตามต้องการ ---")
  (princ "\n  [1]=H 100x50x5x7 mm.      [2]=H 100x100x6x8 mm.   [3]=H 125x125x6.5x9 mm.")
  (princ "\n  [4]=H 150x75x5x7 mm.      [5]=H 150x150x7x10 mm.  [6]=H 200x100x5.5x8 mm.")
  (princ "\n  [7]=H 200x200x8x12 mm.    [8]=H 250x125x6x9 mm.   [9]=H 250x250x9x14 mm.")
  (princ "\n  [10]=H 300x150x6.5x9 mm.  [11]=H 300x300x10x15 mm. [12]=H 350x175x7x11 mm.")
  (setq btype (getstring T "\nเลือกหมายเลข [1-12] หรือพิมพ์ขนาดเหล็กบีม <H 150x150x7x10 mm.>: "))
  (setq btype (vl-string-trim " \t\r\n" btype))
  (cond
    ((or (= btype "") (= btype "5")) (setq btype "H 150x150x7x10 mm."))
    ((= btype "1") (setq btype "H 100x50x5x7 mm."))
    ((= btype "2") (setq btype "H 100x100x6x8 mm."))
    ((= btype "3") (setq btype "H 125x125x6.5x9 mm."))
    ((= btype "4") (setq btype "H 150x75x5x7 mm."))
    ((= btype "6") (setq btype "H 200x100x5.5x8 mm."))
    ((= btype "7") (setq btype "H 200x200x8x12 mm."))
    ((= btype "8") (setq btype "H 250x125x6x9 mm."))
    ((= btype "9") (setq btype "H 250x250x9x14 mm."))
    ((= btype "10") (setq btype "H 300x150x6.5x9 mm."))
    ((= btype "11") (setq btype "H 300x300x10x15 mm."))
    ((= btype "12") (setq btype "H 350x175x7x11 mm."))
  )

  (setq stdlen 6.0)
  (setq cut (getreal "\nความยาวที่ตัดใช้จริง (เมตร) <6.0>: "))
  (if (null cut) (setq cut 6.0))

  (setq qty (getint "\nจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (if (null qty) (setq qty 1))

  (setq payload (strcat
    "{\"materialCategory\":\"beam\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" btype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":false}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" btype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 3. คำสั่ง SYNC_PLATE (ถอดเหล็กเพลท Plate & J-Bolt)
;;; =========================================================================
(defun c:SYNC_PLATE (/ grp member w l th qty jsz jlen jqty nqty wqty autoW payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กเพลท & J-Bolt - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานเหล็กเพลท"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อชิ้นส่วนเพลท"))

  (setq w (getint "\nความกว้างแผ่นเพลท (มม.) <300>: "))
  (if (null w) (setq w 300))
  (setq l (getint "\nความยาวแผ่นเพลท (มม.) <300>: "))
  (if (null l) (setq l 300))
  (setq th (getreal "\nความหนาแผ่นเพลท (มม.) <6.0>: "))
  (if (null th) (setq th 6.0))

  (setq qty (getint "\nจำนวนแผ่นเพลทที่ต้องการ (แผ่น) <1>: "))
  (if (null qty) (setq qty 1))

  (setq jsz (getstring T "\nขนาดเหล็ก J-Bolt (เช่น DB16, DB20, RB16) <DB16>: "))
  (if (= (vl-string-trim " " jsz) "") (setq jsz "DB16"))
  (setq jlen (getreal "\nความยาว J-Bolt ต่อตัว (เมตร) <0.40>: "))
  (if (null jlen) (setq jlen 0.40))
  (setq jqty (getint "\nจำนวน J-Bolt ต่อ 1 แผ่นเพลท <4>: "))
  (if (null jqty) (setq jqty 4))

  (setq nqty (getint "\nจำนวนหัวน็อตต่อแผ่น <4>: "))
  (if (null nqty) (setq nqty 4))
  (setq wqty (getint "\nจำนวนแหวนรองต่อแผ่น <4>: "))
  (if (null wqty) (setq wqty 4))

  (setq autoW (* (/ (float w) 1000.0) (/ (float l) 1000.0) th 7.85))

  (setq payload (strcat
    "{\"materialCategory\":\"plate\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"plateWidth\":" (itoa w)
    ",\"plateLength\":" (itoa l)
    ",\"plateThickness\":" (rtos th 2 1)
    ",\"plateWeightKg\":" (rtos autoW 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"jboltSize\":\"" jsz "\""
    ",\"jboltLength\":" (rtos jlen 2 2)
    ",\"jboltQtyPerPlate\":" (itoa jqty)
    ",\"nutQtyPerPlate\":" (itoa nqty)
    ",\"washerQtyPerPlate\":" (itoa wqty)
    ",\"rebarType\":\"เพลท " (itoa w) "x" (itoa l) "x" (rtos th 2 1) "mm\"}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (เพลท " (itoa w) "x" (itoa l) "x" (rtos th 2 1) "mm " (itoa qty) "แผ่น + J-Bolt " (itoa (* jqty qty)) "ตัว)"))
  (princ)
)

;;; =========================================================================
;;; 4. คำสั่ง SYNC_BOX (เหล็กกล่องสี่เหลี่ยม / แบน)
;;; =========================================================================
(defun c:SYNC_BOX (/ grp member boxType cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กกล่อง (Square/Rect Tube) - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานเหล็กกล่อง"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อชิ้นส่วน"))

  (princ "\n--- ขนาดเหล็กกล่องยอดนิยม หรือพิมพ์ขนาด ---")
  (princ "\n  [1]=SHS 50x50x2.3 mm.    [2]=SHS 75x75x3.2 mm.   [3]=SHS 100x100x3.2 mm.")
  (princ "\n  [4]=RHS 75x38x2.3 mm.    [5]=RHS 100x50x3.2 mm.  [6]=RHS 150x50x3.2 mm.")
  (setq boxType (getstring T "\nเลือกหมายเลข [1-6] หรือพิมพ์ขนาด <SHS 50x50x2.3 mm.>: "))
  (setq boxType (vl-string-trim " \t\r\n" boxType))
  (cond
    ((or (= boxType "") (= boxType "1")) (setq boxType "SHS 50x50x2.3 mm."))
    ((= boxType "2") (setq boxType "SHS 75x75x3.2 mm."))
    ((= boxType "3") (setq boxType "SHS 100x100x3.2 mm."))
    ((= boxType "4") (setq boxType "RHS 75x38x2.3 mm."))
    ((= boxType "5") (setq boxType "RHS 100x50x3.2 mm."))
    ((= boxType "6") (setq boxType "RHS 150x50x3.2 mm."))
  )

  (setq cut (getreal "\nความยาวที่ตัดใช้จริง (เมตร) <6.0>: "))
  (if (null cut) (setq cut 6.0))
  (setq qty (getint "\nจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (if (null qty) (setq qty 1))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" boxType "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":false}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" boxType " " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 5. คำสั่ง SYNC_LIPC (เหล็กตัวซี C)
;;; =========================================================================
(defun c:SYNC_LIPC (/ grp member cType cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กตัวซี C (Lip Channel) - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานเหล็กตัวซี"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อชิ้นส่วนแป/คาน"))

  (princ "\n--- ขนาดเหล็กตัวซี C ยอดนิยม หรือพิมพ์ขนาด ---")
  (princ "\n  [1]=C 75x45x15x2.3 mm.    [2]=C 100x50x20x2.3 mm.  [3]=C 100x50x20x3.2 mm.")
  (princ "\n  [4]=C 125x50x20x3.2 mm.   [5]=C 150x50x20x3.2 mm.  [6]=C 200x75x20x3.2 mm.")
  (setq cType (getstring T "\nเลือกหมายเลข [1-6] หรือพิมพ์ขนาด <C 100x50x20x3.2 mm.>: "))
  (setq cType (vl-string-trim " \t\r\n" cType))
  (cond
    ((or (= cType "") (= cType "3")) (setq cType "C 100x50x20x3.2 mm."))
    ((= cType "1") (setq cType "C 75x45x15x2.3 mm."))
    ((= cType "2") (setq cType "C 100x50x20x2.3 mm."))
    ((= cType "4") (setq cType "C 125x50x20x3.2 mm."))
    ((= cType "5") (setq cType "C 150x50x20x3.2 mm."))
    ((= cType "6") (setq cType "C 200x75x20x3.2 mm."))
  )

  (setq cut (getreal "\nความยาวที่ตัดใช้จริง (เมตร) <6.0>: "))
  (if (null cut) (setq cut 6.0))
  (setq qty (getint "\nจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (if (null qty) (setq qty 1))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" cType "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":false}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" cType " " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 6. คำสั่ง SYNC_PIPE (ท่อกลมดำ)
;;; =========================================================================
(defun c:SYNC_PIPE (/ grp member pipeType cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดท่อกลมดำ (Round Steel Pipe) - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานท่อกลมดำ"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อชิ้นส่วน"))

  (princ "\n--- ขนาดท่อกลมดำยอดนิยม หรือพิมพ์ขนาด ---")
  (princ "\n  [1]=PIPE 1-1/2\" (48.6x2.3 mm.)  [2]=PIPE 2\" (60.5x2.3 mm.)  [3]=PIPE 2-1/2\" (76.3x2.8 mm.)")
  (princ "\n  [4]=PIPE 3\" (89.1x3.2 mm.)      [5]=PIPE 4\" (114.3x3.5 mm.) [6]=PIPE 6\" (165.2x4.5 mm.)")
  (setq pipeType (getstring T "\nเลือกหมายเลข [1-6] หรือพิมพ์ขนาด <PIPE 2\" (60.5x2.3 mm.)>: "))
  (setq pipeType (vl-string-trim " \t\r\n" pipeType))
  (cond
    ((or (= pipeType "") (= pipeType "2")) (setq pipeType "PIPE 2\" (60.5x2.3 mm.)"))
    ((= pipeType "1") (setq pipeType "PIPE 1-1/2\" (48.6x2.3 mm.)"))
    ((= pipeType "3") (setq pipeType "PIPE 2-1/2\" (76.3x2.8 mm.)"))
    ((= pipeType "4") (setq pipeType "PIPE 3\" (89.1x3.2 mm.)"))
    ((= pipeType "5") (setq pipeType "PIPE 4\" (114.3x3.5 mm.)"))
    ((= pipeType "6") (setq pipeType "PIPE 6\" (165.2x4.5 mm.)"))
  )

  (setq cut (getreal "\nความยาวที่ตัดใช้จริง (เมตร) <6.0>: "))
  (if (null cut) (setq cut 6.0))
  (setq qty (getint "\nจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (if (null qty) (setq qty 1))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" pipeType "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"isReusedOffcut\":false}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" pipeType " " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 7. คำสั่ง SYNC_PVC (ท่อ PVC & ข้อต่อ-วาล์ว)
;;; =========================================================================
(defun c:SYNC_PVC (/ grp member subChoice pvcType cut qty isFitting payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดท่อ PVC & ข้อต่อ-วาล์ว - ยุทธการ")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "หมวดงานท่อ PVC"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อแนวท่อ/จุดติดตั้ง"))

  (setq subChoice (getstring T "\nเลือกประเภท [1]=ท่อ PVC ชั้น 8.5, [2]=ท่อ PVC ชั้น 13.5, [3]=ข้อต่อ/วาล์ว <1>: "))
  (setq isFitting "false")
  (cond
    ((= subChoice "2")
      (setq pvcType (getstring T "\nขนาดท่อ PVC 13.5 (เช่น 1/2\", 3/4\", 1\", 2\", 3\", 4\") <2\">: "))
      (if (= (vl-string-trim " " pvcType) "") (setq pvcType "2\""))
      (setq pvcType (strcat "PVC 13.5 " pvcType))
    )
    ((= subChoice "3")
      (setq isFitting "true")
      (setq pvcType (getstring T "\nระบุชนิดข้อต่อ/วาล์วและขนาด (เช่น ข้องอ 90 2\", สามทาง 4\") <ข้อต่อตรง 2\">: "))
      (if (= (vl-string-trim " " pvcType) "") (setq pvcType "ข้อต่อตรง 2\""))
    )
    (t
      (setq pvcType (getstring T "\nขนาดท่อ PVC 8.5 (เช่น 1/2\", 3/4\", 1\", 2\", 3\", 4\") <2\">: "))
      (if (= (vl-string-trim " " pvcType) "") (setq pvcType "2\""))
      (setq pvcType (strcat "PVC 8.5 " pvcType))
    )
  )

  (if (= isFitting "true")
    (progn
      (setq cut 0.0)
      (setq qty (getint "\nจำนวนข้อต่อ/อุปกรณ์ที่ต้องการ (ชิ้น) <1>: "))
      (if (null qty) (setq qty 1))
      (setq payload (strcat
        "{\"materialCategory\":\"pvc\""
        ",\"pvcType\":\"fitting\""
        ",\"label\":\"" member "\""
        ",\"group\":\"" grp "\""
        ",\"rebarType\":\"" pvcType "\""
        ",\"quantity\":" (itoa qty)
        ",\"isReusedOffcut\":false}"
      ))
    )
    (progn
      (setq cut (getreal "\nความยาวท่อที่ตัดใช้ (เมตร) <4.0>: "))
      (if (null cut) (setq cut 4.0))
      (setq qty (getint "\nจำนวนท่อนท่อที่ต้องการตัด (ท่อน) <1>: "))
      (if (null qty) (setq qty 1))
      (setq payload (strcat
        "{\"materialCategory\":\"pvc\""
        ",\"pvcType\":\"pipe\""
        ",\"label\":\"" member "\""
        ",\"group\":\"" grp "\""
        ",\"rebarType\":\"" pvcType "\""
        ",\"standardLength\":4.0"
        ",\"cutLength\":" (rtos cut 2 2)
        ",\"quantity\":" (itoa qty)
        ",\"isReusedOffcut\":false}"
      ))
    )
  )

  (rebar-send-json payload (strcat "[" grp "] " member " (" pvcType " " (itoa qty) "ชิ้น)"))
  (princ)
)

;;; =========================================================================
;;; 8. คำสั่ง SYNC_MENU (เมนูรวมเลือกหมวดงาน)
;;; =========================================================================
(defun c:SYNC_MENU (/ choice)
  (princ "\n=======================================================")
  (princ "\n  เมนูระบบถอดวัสดุโครงสร้าง & Live Sync - ยุทธการ คำกลอน")
  (princ "\n=======================================================")
  (princ "\n  [1] SYNC_REBAR - ถอดเหล็กเส้น (มอก. RB/DB + คลังเศษ)")
  (princ "\n  [2] SYNC_BEAM  - ถอดเหล็กบีม (H-Beam / I-Beam / WF)")
  (princ "\n  [3] SYNC_PLATE - ถอดเหล็กเพลท & J-Bolt (Base Plate)")
  (princ "\n  [4] SYNC_BOX   - ถอดเหล็กกล่องสี่เหลี่ยม / แบน")
  (princ "\n  [5] SYNC_LIPC  - ถอดเหล็กตัวซี C (Lip Channel)")
  (princ "\n  [6] SYNC_PIPE  - ถอดท่อกลมดำ (Round Steel Pipe)")
  (princ "\n  [7] SYNC_PVC   - ถอดท่อ PVC & ข้อต่อ-วาล์ว")
  (princ "\n  [8] REBAR_DRAW - วาดตาราง BBS สวยงามลง Drawing")
  (princ "\n  [9] REBAR_WEB  - เปิดหน้าเว็บจัดการคลังเศษและสต็อก")
  (princ "\n=======================================================")
  (setq choice (getstring T "\nเลือกหมวดงาน [1-9] <1>: "))
  (setq choice (vl-string-trim " \t\r\n" choice))
  (cond
    ((or (= choice "") (= choice "1")) (c:SYNC_REBAR))
    ((= choice "2") (c:SYNC_BEAM))
    ((= choice "3") (c:SYNC_PLATE))
    ((= choice "4") (c:SYNC_BOX))
    ((= choice "5") (c:SYNC_LIPC))
    ((= choice "6") (c:SYNC_PIPE))
    ((= choice "7") (c:SYNC_PVC))
    ((= choice "8") (c:REBAR_DRAW))
    ((= choice "9") (c:REBAR_WEB))
    (t (princ "\nเลือกไม่ถูกต้อง ยกเลิกคำสั่ง"))
  )
  (princ)
)

;;; คำแนะนำการใช้งาน
(defun c:REBAR_HELP ()
  (princ "\n=======================================================")
  (princ "\nคำสั่งระบบถอดวัสดุโครงสร้างและคลังเศษ (v4.0):")
  (princ "\n  SYNC_MENU      - เมนูรวมเลือกหมวดงานทั้งหมด")
  (princ "\n  SYNC_REBAR     - ถอดเหล็กเส้น (RB/DB) และดึงเศษในสต็อก")
  (princ "\n  SYNC_BEAM      - ถอดเหล็กบีม (H-Beam, I-Beam, WF)")
  (princ "\n  SYNC_PLATE     - ถอดเหล็กเพลท + J-Bolt + น็อต-แหวน")
  (princ "\n  SYNC_BOX       - ถอดเหล็กกล่องสี่เหลี่ยม / แบน")
  (princ "\n  SYNC_LIPC      - ถอดเหล็กตัวซี C")
  (princ "\n  SYNC_PIPE      - ถอดท่อกลมดำ")
  (princ "\n  SYNC_PVC       - ถอดท่อ PVC & ข้อต่อ")
  (princ "\n  REBAR_DRAW     - วาดตาราง BBS ลงใน Drawing อัตโนมัติ")
  (princ "\n  REBAR_OFFCUTS  - ตรวจสอบรายการเศษเหล็กคงเหลือสะสม")
  (princ "\n  REBAR_WEB      - เปิดหน้าเว็บจัดการวัสดุบน Web Browser")
  (princ "\n=======================================================\n")
  (princ)
)

(defun c:REBAR_WEB ()
  (command "_.BROWSER" "${baseUrl}/#admin-rebar")
  (princ "\nกำลังเปิดหน้าต่างจัดการเหล็กเส้นบนเว็บ...")
  (princ)
)

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

              (command "_.TEXT" (list startX (+ y 1.2) 0.0) 0.5 0 "ตารางถอดเหล็กเสริมโครงสร้าง (BAR BENDING SCHEDULE - BBS)")
              (command "_.TEXT" (list startX (+ y 0.5) 0.0) 0.28 0 "ผู้ออกแบบ & ควบคุมงาน: ยุทธการ คำกลอน (Auto-Sync Real-Time)")

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
                    (command "_.LINE" (list startX (- y (* rowIdx 0.7) 0.65) 0.0) (list x (- y (* rowIdx 0.7) 0.65) 0.0) "")
                    (setq rowIdx (1+ rowIdx))
                  )
                )
              )
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

(princ "\n[สำเร็จ] โหลดปลั๊กอิน Yutthakan Structural Sync v4.0 เรียบร้อย!")
(princ "\nพิมพ์คำสั่ง SYNC_MENU, SYNC_REBAR, SYNC_BEAM, SYNC_PLATE, SYNC_BOX, SYNC_LIPC, SYNC_PIPE, SYNC_PVC")
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
