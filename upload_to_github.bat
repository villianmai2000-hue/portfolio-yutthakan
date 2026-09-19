@echo off
chcp 65001 >nul
title ส่งโค้ดขึ้น GitHub - เว็บฝากผลงานตน (ยุทธการ คำกลอน)
color 0B
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
cd /d "%~dp0"

echo ======================================================================
echo   📤 ส่งโค้ดขึ้น GitHub อัตโนมัติ (Portfolio GitHub Sync)
echo ======================================================================
echo.

git remote get-url origin >nul 2>&1
if %errorlevel% neq 0 (
  echo ℹ️ ยังไม่พบการเชื่อมต่อกับ GitHub Repository
  echo.
  echo ขั้นตอน:
  echo 1. เข้าเว็บ https://github.com/new สร้าง Repository ใหม่ (เช่น portfolio-yutthakan)
  echo 2. นำลิงก์ Repository มาวางด้านล่างนี้ (เช่น https://github.com/villianmai2000-hue/portfolio-yutthakan.git)
  echo.
  set /p REPO_URL=">> วางลิงก์ GitHub Repo ที่นี่: "
  
  if not "%REPO_URL%"=="" (
    git remote add origin %REPO_URL%
    echo ✅ ผูกกับ GitHub เรียบร้อยแล้ว!
  ) else (
    echo ❌ ไม่ได้ระบุลิงก์ ยกเลิกการทำงาน
    pause
    exit /b 1
  )
)

echo [1/3] กำลังเตรียมไฟล์ทั้งหมด...
git add .

echo [2/3] บันทึกการเปลี่ยนแปลง (Commit)...
git commit -m "Update portfolio: modern showcase with direct MongoDB Atlas WebP storage" >nul 2>&1

echo [3/3] กำลังส่งไฟล์ขึ้น GitHub...
git push -u origin main

if %errorlevel% equ 0 (
  echo.
  echo ======================================================================
  echo   🎉 ส่งโค้ดขึ้น GitHub สำเร็จเรียบร้อยแล้ว 100%!
  echo   ตอนนี้คุณสามารถเข้า Vercel.com เพื่อกด Deploy ได้ทันทีครับ
  echo ======================================================================
) else (
  echo.
  echo ⚠️ เกิดข้อผิดพลาดในการส่ง กรุณาตรวจสอบว่าคุณล็อกอิน GitHub บนเครื่องนี้แล้วหรือยัง
)

echo.
pause

