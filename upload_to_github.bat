@echo off
chcp 65001 >nul
title ส่งโค้ดขึ้น GitHub - เว็บฝากผลงานตน
color 0B
echo ========================================================
echo   📤 ส่งโค้ดขึ้น GitHub อัตโนมัติ (GitHub Sync)
echo ========================================================
echo.

if not exist .git (
  echo [1/4] กำลังเริ่มต้นระบบ Git...
  git init
  git branch -M main
)

echo [2/4] กำลังตรวจสอบและเพิ่มไฟล์ทั้งหมด...
git add .

echo [3/4] บันทึกการเปลี่ยนแปลง (Commit)...
git commit -m "Update portfolio: modern showcase with WebP compression and admin"

echo.
echo [4/4] ส่งไฟล์ขึ้น GitHub...
git push -u origin main

if %errorlevel% neq 0 (
  echo.
  echo ⚠️ หากยังไม่ได้ผูกกับ GitHub Repository ให้รันคำสั่ง:
  echo   git remote add origin https://github.com/ชื่อยูสเซอร์/ชื่อเรโป.git
  echo แล้วค่อยรันไฟล์นี้ใหม่อีกครั้งครับ!
) else (
  echo.
  echo ✅ ส่งโค้ดขึ้น GitHub สำเร็จเรียบร้อยแล้ว!
)

echo.
pause
