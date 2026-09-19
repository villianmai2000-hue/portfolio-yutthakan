import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { DataService, DEFAULT_OWNER } from './db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'yutthakan_secret_key_portfolio_2026_mai';

const otpStore = new Map();

export async function loginHandler(req, res) {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    const user = await DataService.getUserByUsername(username.trim());
    if (!user) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    const isDirectMatch = (password === DEFAULT_OWNER.passwordPlain);

    if (!isMatch && !isDirectMatch) {
      return res.status(401).json({ error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const token = jwt.sign(
      { username: user.username, role: user.role || 'admin', name: user.name },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.json({
      success: true,
      token,
      user: {
        username: user.username,
        name: user.name,
        role: user.role || 'admin'
      }
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
}

export async function requestOtpHandler(req, res) {
  try {
    const { contact } = req.body;
    if (!contact) {
      return res.status(400).json({ error: 'กรุณาระบุเบอร์โทรศัพท์หรืออีเมลที่ผูกไว้' });
    }

    const profile = await DataService.getProfile();
    const cleanContact = contact.trim().toLowerCase().replace(/[-\s]/g, '');
    const cleanOwnerPhone = (profile.phone || '').replace(/[-\s]/g, '');
    const cleanOwnerAltPhone = (profile.altPhone || '').replace(/[-\s]/g, '');
    const cleanOwnerEmail = (profile.email || '').toLowerCase().trim();

    const isMatched = 
      cleanContact === cleanOwnerPhone ||
      cleanContact === cleanOwnerAltPhone ||
      cleanContact === cleanOwnerEmail ||
      cleanContact === 'ยุทธการ คำกลอน' ||
      cleanContact.includes('0643032859') ||
      cleanContact.includes('0962033005');

    if (!isMatched) {
      return res.status(404).json({ error: 'ไม่พบบัญชีที่ผูกกับเบอร์โทรหรืออีเมลนี้' });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expireAt = Date.now() + 10 * 60 * 1000;

    otpStore.set(DEFAULT_OWNER.username, { otp, expireAt, contact });
    console.log(`🔑 [OTP Code] รหัส OTP สำหรับรีเซ็ตรหัสผ่านของคุณยุทธการ: ${otp}`);

    return res.json({
      success: true,
      message: 'สร้างรหัส OTP สำเร็จแล้ว (รหัสมีอายุ 10 นาที)',
      testOtp: otp,
      targetContact: contact
    });
  } catch (err) {
    console.error('OTP request error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการขอรหัส OTP' });
  }
}

export async function verifyOtpAndResetHandler(req, res) {
  try {
    const { otp, newPassword } = req.body;
    if (!otp || !newPassword) {
      return res.status(400).json({ error: 'กรุณากรอกรหัส OTP และรหัสผ่านใหม่' });
    }

    const record = otpStore.get(DEFAULT_OWNER.username);
    if (!record) {
      return res.status(400).json({ error: 'ยังไม่มีการขอรหัส OTP หรือรหัสหมดอายุแล้ว' });
    }

    if (Date.now() > record.expireAt) {
      otpStore.delete(DEFAULT_OWNER.username);
      return res.status(400).json({ error: 'รหัส OTP หมดอายุแล้ว กรุณาขอใหม่อีกครั้ง' });
    }

    if (record.otp !== otp.trim()) {
      return res.status(400).json({ error: 'รหัส OTP ไม่ถูกต้อง' });
    }

    const hashed = await bcrypt.hash(newPassword.trim(), 10);
    await DataService.updateUserPassword(DEFAULT_OWNER.username, hashed);
    otpStore.delete(DEFAULT_OWNER.username);

    return res.json({
      success: true,
      message: 'เปลี่ยนรหัสผ่านใหม่สำเร็จแล้ว สามารถเข้าสู่ระบบด้วยรหัสผ่านใหม่ได้ทันที'
    });
  } catch (err) {
    console.error('Verify OTP error:', err);
    return res.status(500).json({ error: 'เกิดข้อผิดพลาดในการรีเซ็ตรหัสผ่าน' });
  }
}

export function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนทำรายการ' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'เซสชันหมดอายุหรือไม่ถูกต้อง กรุณาเข้าสู่ระบบใหม่' });
  }
}
