# 🌐 คู่มือการติดตั้งและผูกระบบ GitHub + MongoDB Atlas + Vercel
## เว็บไซต์พอร์ตโฟลิโอ ยุทธการ คำกลอน (ออกแบบใช้งานระยะยาว 10–20 ปี)

ระบบนี้ถูกออกแบบขึ้นเป็นพิเศษสำหรับคุณ **ยุทธการ คำกลอน** เพื่อรวบรวมและจัดแสดงผลงานสถาปัตยกรรม เขียนแบบ AutoCAD, 3D SketchUp Model, เรนเดอร์ Enscape/V-Ray, ปลั๊กอิน และเอกสารแบบแปลน โดยรันออนไลน์ตลอด 24 ชั่วโมง **ฟรีตลอดชีพ** ไม่ต้องเปิดคอมพิวเตอร์ทิ้งไว้

---

## 🍃 ขั้นตอนที่ 1: สร้างฐานข้อมูลคลาวด์บน MongoDB Atlas Cloud (ฟรี 512 MB ตลอดชีพ)

1. เข้าเว็บไซต์ **[mongodb.com/cloud/atlas/register](https://www.mongodb.com/cloud/atlas/register)**
   - สมัครสมาชิก (สามารถกด Sign up with Google ได้)
2. เมื่อเข้าสู่ระบบ ให้เลือกสร้างคลัสเตอร์แบบ **M0 (Free)** 
   - เลือก Region: **Singapore (ap-southeast-1)** (ใกล้ประเทศไทย เร็วที่สุด)
   - กดปุ่ม **Create Deployment**
3. **สร้างผู้ใช้ฐานข้อมูล (Database User)**:
   - ไปที่เมนูด้านซ้าย **Security** -> **Database Access**
   - กดปุ่ม **Add New Database User**
   - Authentication Method: เลือก **Password**
   - ตั้ง **Username** (เช่น `admin_mai`)
   - ตั้ง **Password** (เช่น `Mai2000Pass!`) *(จดรหัสนี้ไว้)*
   - Database User Privileges: เลือก **Built-in Role: Read and write to any database**
   - กด **Add User**
4. **เปิดสิทธิ์การเข้าถึงจากอินเทอร์เน็ต (Network Access)**:
   - ไปที่เมนูด้านซ้าย **Security** -> **Network Access**
   - กดปุ่ม **Add IP Address**
   - คลิกปุ่ม **ALLOW ACCESS FROM ANYWHERE** (IP จะขึ้นเป็น `0.0.0.0/0`)
   - กด **Confirm**
5. **คัดลอกรหัสเชื่อมต่อ (Connection String)**:
   - ไปที่เมนูด้านซ้าย **Deployment** -> **Database**
   - ตรงคลัสเตอร์ของคุณ กดปุ่ม **Connect**
   - เลือกหัวข้อ **Drivers** (Driver: `Node.js`)
   - คัดลอก Connection String ที่ได้ ซึ่งจะมีหน้าตาแบบนี้:
     ```text
     mongodb+srv://admin_mai:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
     ```
   - ให้แทนที่คำว่า `<password>` ด้วยรหัสผ่านที่คุณตั้งไว้ในข้อ 3 เช่น:
     ```text
     mongodb+srv://admin_mai:Mai2000Pass!@cluster0.xxxxx.mongodb.net/portfolio?retryWrites=true&w=majority
     ```
   *(เก็บข้อความนี้ไว้ เพื่อนำไปใส่ใน Vercel)*

---

## 🐙 ขั้นตอนที่ 2: สร้าง Repository บน GitHub และส่งโค้ดขึ้นคลาวด์

1. เข้าเว็บไซต์ **[github.com](https://github.com)** ล็อกอินบัญชีของคุณ (`villianmai2000-hue`)
2. กดปุ่มเครื่องหมายบวก **"+"** มุมขวาบน -> เลือก **"New repository"**
   - **Repository name**: ตั้งชื่อ เช่น `portfolio-yutthakan` หรือ `my-portfolio`
   - เลือกเป็น **Public** (หรือ Private ก็ได้)
   - ไม่ต้องติ๊กช่อง Add a README file
   - กดปุ่มสีเขียว **"Create repository"**
3. ที่เครื่องคอมพิวเตอร์ของคุณ:
   - เปิดโฟลเดอร์ `d:\ใหม่\ใหม่เอง\เว็บฝากผลงานตน`
   - เปิดโปรแกรม Terminal / PowerShell หรือดับเบิลคลิกไฟล์ `upload_to_github.bat`
   - หากทำผ่านคำสั่ง ให้พิมพ์ตามนี้:
     ```bash
     git init
     git branch -M main
     git remote add origin https://github.com/villianmai2000-hue/ชื่อเรโปที่คุณสร้าง.git
     git add .
     git commit -m "Initial portfolio release"
     git push -u origin main
     ```

---

## 🚀 ขั้นตอนที่ 3: นำเว็บไซต์ขึ้น Vercel (รันออนไลน์ตลอด 24 ชั่วโมง ฟรีตลอดชีพ)

1. เข้าเว็บไซต์ **[vercel.com](https://vercel.com)**
   - ล็อกอินด้วยบัญชี **GitHub** ของคุณ
2. ที่หน้าแดชบอร์ด กดปุ่ม **"Add New..."** -> เลือก **"Project"**
3. ค้นหาชื่อ Repository ของคุณ (เช่น `portfolio-yutthakan`) แล้วกดปุ่ม **"Import"**
4. ในหน้าตั้งค่าโปรเจกต์ (Configure Project):
   - **Framework Preset**: ระบบจะเลือกเป็น **Vite** อัตโนมัติ
   - **Root Directory**: ปล่อยว่างไว้ (`./`)
5. **ใส่ตัวแปรสภาพแวดล้อม (Environment Variables)** *(สำคัญมาก)*:
   - ขยายหัวข้อ **Environment Variables** แล้วกดเพิ่มตัวแปรดังนี้:
     - **Key**: `MONGODB_URI`
       - **Value**: วาง Connection String จาก MongoDB Atlas (จากขั้นตอนที่ 1)
     - **Key**: `JWT_SECRET`
       - **Value**: `yutthakan_secret_key_portfolio_2026_mai`
     - **Key**: `ADMIN_NAME`
       - **Value**: `ยุทธการ คำกลอน`
     - **Key**: `ADMIN_PHONE`
       - **Value**: `0643032859`
     - **Key**: `ADMIN_LINE_ID`
       - **Value**: `0643032859`
6. กดปุ่มสีน้ำเงิน **"Deploy"**
7. รอระบบประมวลผลประมาณ 1–2 นาที
   - 🎉 **สำเร็จ 100%!** คุณจะได้ลิงก์เว็บไซต์จริงระดับสากล เช่น:
     `https://portfolio-yutthakan.vercel.app`
   - คุณสามารถนำลิงก์นี้ไปใส่ในโปรไฟล์ Facebook, นามบัตร, หรือส่งให้ลูกค้าเปิดดูผลงานได้ทันทีทั่วโลก!

---

## 🔑 ข้อมูลการเข้าสู่ระบบหลังบ้าน (Owner Credentials)

- **ชื่อผู้ใช้**: `ยุทธการ คำกลอน`
- **รหัสผ่านเริ่มต้น**: `0962033005Maiiam2000`
- **เบอร์โทรศัพท์ที่ผูกไว้**: `0643032859` และ `0962033005`
- **LINE ID สำหรับรับงาน**: `0643032859`
- **ระบบกู้รหัสผ่าน (OTP)**: หากลืมรหัสผ่าน ให้กดปุ่ม "ลืมรหัสผ่าน? ขอรหัส OTP" ที่หน้าต่างล็อกอิน ระบุเบอร์โทรศัพท์ ระบบจะสร้างรหัสยืนยัน OTP 6 หลัก เพื่อให้คุณตั้งรหัสผ่านใหม่ได้ทันที

---

## 💡 กลยุทธ์การใช้งานยาวนาน 10–20 ปีอย่างคุ้มค่า (คำแนะนำ)

1. **ระบบบีบอัดรูปภาพอัจฉริยะ (WebP Compression)**:
   - ทุกครั้งที่คุณอัปโหลดรูปภาพผลงานในหลังบ้าน ระบบจะบีบอัดและแปลงเป็น WebP อัตโนมัติ
   - ภาพขนาด 5–10MB จะถูกย่อเหลือเพียง **100–300KB** ทำให้โควต้าฟรี 512MB ของ MongoDB Atlas สามารถเก็บรูปภาพได้มากกว่า **2,000–5,000 รูป** ใช้งานได้นานนับสิบปีโดยไม่ต้องจ่ายเงิน
2. **ไฟล์ขนาดใหญ่ (AutoCAD .dwg, SketchUp .skp, ปลั๊กอิน .rbz, PDF เล่มหนา)**:
   - ไฟล์ 3D หรือ CAD ที่มีขนาด 20MB–100MB+ แนะนำให้อัปโหลดเก็บไว้ใน **Google Drive** หรือ **Cloudflare R2 (ฟรี 10GB ตลอดชีพ)** แล้วนำลิงก์ดาวน์โหลดมาใส่ในช่องไฟล์แนบของผลงาน
   - ข้อดี: หน้าเว็บจะเปิดเร็วระดับเสี้ยววินาที ลูกค้ากดโหลดไฟล์ได้เต็มสปีด และฐานข้อมูลของคุณจะไม่เต็มแน่นอน
3. **การสำรองข้อมูล (Offline Backup)**:
   - ในหน้าจัดการหลังบ้าน แท็บ "ฐานข้อมูล & สำรองข้อมูลระยะยาว" คุณสามารถกดปุ่ม **"ดาวน์โหลดสำรองข้อมูลทั้งหมด (.json)"** ได้ทุกเมื่อ เพื่อเก็บไฟล์ข้อมูลผลงานทั้งหมดสำรองไว้ในคอมพิวเตอร์ ปลอดภัย 100% ต่อให้เกิดเหตุการณ์ไม่คาดฝัน
