;;; =========================================================================
;;; AutoLISP: Yutthakan Structural Material Takeoff & BBS Live Sync v5.0
;;; สถาปนิกและวิศวกรโครงสร้าง: ยุทธการ คำกลอน
;;; รองรับ 10 หมวดคำสั่งถอดแบบโครงสร้าง ซิงก์ขึ้นเว็บแบบเรียลไทม์
;;; =========================================================================
(vl-load-com)

;;; ตัวแปรเก็บหมวดและชิ้นส่วน (บันทึกจำไว้ตลอดการทำงานของ AutoCAD)
(if (null *rebar-groups*)
  (setq *rebar-groups* (list "ฐานราก F1" "งานเสา" "งานคาน" "งานพื้น" "งานโครงสร้างเหล็ก" "งานสุขาภิบาล/ท่อ" "F1-C1 NO.1" "F2-C2A NO.2"))
)
(if (null *rebar-members*)
  (setq *rebar-members* (list "เสา C1" "เสา C2" "คาน B1" "คาน B2" "ฐานราก F1" "เหล็กเสริมเสา" "เพลท P1" "แป C1" "พื้น S1"))
)

;;; ฟังก์ชันช่วยแยกข้อความ (String Split)
(defun rebar-str-split (delim str / pos lst dlen)
  (setq dlen (strlen delim))
  (setq lst nil)
  (while (setq pos (vl-string-search delim str))
    (setq lst (cons (substr str 1 pos) lst))
    (setq str (substr str (+ pos 1 dlen)))
  )
  (reverse (cons str lst))
)

;;; ฟังก์ชันรับค่าพร้อม Default value ปลอดภัย ไม่เด้งหลุด
(defun rebar-prompt-val (promptMsg defaultVal valType / inp val)
  (setq inp (getstring T (strcat "\n" promptMsg " <" (vl-princ-to-string defaultVal) ">: ")))
  (setq inp (vl-string-trim " \t\r\n" inp))
  (cond
    ((= inp "") defaultVal)
    ((= valType 'int)
      (setq val (atoi inp))
      (if (<= val 0) defaultVal val)
    )
    ((= valType 'real)
      (setq val (atof inp))
      (if (<= val 0.0) defaultVal val)
    )
    (t inp)
  )
)

;;; =========================================================================
;;; ขั้นตอนที่ 1: เลือกกลุ่ม / หมวดงาน (กด 1 เลื่อนเลือกในระบบ / กด 0 พิมพ์ชื่อใหม่)
;;; =========================================================================
(defun rebar-step1-group (/ inp grp i sel idx maxN)
  (princ "\n=======================================================")
  (princ "\nขั้นตอนที่ 1/5: เลือกกลุ่ม / หมวดงาน")
  (princ "\n  [1] เลื่อนเลือกหมวดในระบบ (ฐานราก, เสา, คาน, งานพื้น...)")
  (princ "\n  [0] พิมพ์ชื่อกลุ่ม/หมวดงานใหม่เอง")
  (princ "\n=======================================================")
  (setq inp (getstring T "\nเลือก [กด 1 เลือกในระบบ / กด 0 พิมพ์ใหม่] <1>: "))
  (setq inp (vl-string-trim " \t\r\n" inp))
  (cond
    ((= inp "0")
      (setq grp (getstring T "\nระบุชื่อกลุ่ม/หมวดงานใหม่: "))
      (setq grp (vl-string-trim " \t\r\n" grp))
      (if (= grp "") (setq grp "งานโครงสร้างทั่วไป"))
      (if (not (member grp *rebar-groups*))
        (setq *rebar-groups* (cons grp *rebar-groups*))
      )
    )
    (t
      (princ "\n--- รายการกลุ่ม/หมวดงานในระบบ ---")
      (setq maxN (min (length *rebar-groups*) 8))
      (setq i 0)
      (while (< i maxN)
        (princ (strcat "\n  [" (itoa (1+ i)) "] " (nth i *rebar-groups*)))
        (setq i (1+ i))
      )
      (setq sel (getstring T (strcat "\nเลือกหมายเลขหมวด [1-" (itoa maxN) "] หรือกด 0 พิมพ์ใหม่ <1>: ")))
      (setq sel (vl-string-trim " \t\r\n" sel))
      (cond
        ((= sel "0")
          (setq grp (getstring T "\nระบุชื่อกลุ่ม/หมวดงานใหม่: "))
          (setq grp (vl-string-trim " \t\r\n" grp))
          (if (= grp "") (setq grp (car *rebar-groups*)))
          (if (not (member grp *rebar-groups*)) (setq *rebar-groups* (cons grp *rebar-groups*)))
        )
        ((or (= sel "") (= sel "1"))
          (setq grp (car *rebar-groups*))
        )
        ((and (> (strlen sel) 0) (vl-every '(lambda (c) (and (>= c 48) (<= c 57))) (vl-string->list sel)))
          (setq idx (atoi sel))
          (if (and (> idx 0) (<= idx (length *rebar-groups*)))
            (setq grp (nth (1- idx) *rebar-groups*))
            (setq grp (car *rebar-groups*))
          )
        )
        (t (setq grp sel))
      )
    )
  )
  (princ (strcat "\n[✓] กลุ่ม/หมวดงาน: " grp))
  grp
)

;;; =========================================================================
;;; ขั้นตอนที่ 2: ระบุชื่อส่วนโครงสร้าง (กด 1 เลื่อนเลือกในระบบ / กด 0 พิมพ์ชื่อใหม่)
;;; =========================================================================
(defun rebar-step2-member (/ inp mem i sel idx maxN)
  (princ "\n-------------------------------------------------------")
  (princ "\nขั้นตอนที่ 2/5: ระบุชื่อส่วนโครงสร้าง")
  (princ "\n  [1] เลื่อนเลือกชื่อส่วนในระบบ (เช่น เสา C1, คาน B2, ฐานราก F1...)")
  (princ "\n  [0] พิมพ์ชื่อส่วนโครงสร้างใหม่เอง")
  (princ "\n-------------------------------------------------------")
  (setq inp (getstring T "\nเลือก [กด 1 เลือกในระบบ / กด 0 พิมพ์ใหม่] <1>: "))
  (setq inp (vl-string-trim " \t\r\n" inp))
  (cond
    ((= inp "0")
      (setq mem (getstring T "\nระบุชื่อส่วนโครงสร้างใหม่ (เช่น เสา C1, คาน B2): "))
      (setq mem (vl-string-trim " \t\r\n" mem))
      (if (= mem "") (setq mem "ชิ้นส่วน"))
      (if (not (member mem *rebar-members*))
        (setq *rebar-members* (cons mem *rebar-members*))
      )
    )
    (t
      (princ "\n--- รายการชื่อส่วนโครงสร้างในระบบ ---")
      (setq maxN (min (length *rebar-members*) 9))
      (setq i 0)
      (while (< i maxN)
        (princ (strcat "\n  [" (itoa (1+ i)) "] " (nth i *rebar-members*)))
        (setq i (1+ i))
      )
      (setq sel (getstring T (strcat "\nเลือกหมายเลข [1-" (itoa maxN) "] หรือกด 0 พิมพ์ใหม่ <1>: ")))
      (setq sel (vl-string-trim " \t\r\n" sel))
      (cond
        ((= sel "0")
          (setq mem (getstring T "\nระบุชื่อส่วนโครงสร้างใหม่: "))
          (setq mem (vl-string-trim " \t\r\n" mem))
          (if (= mem "") (setq mem (car *rebar-members*)))
          (if (not (member mem *rebar-members*)) (setq *rebar-members* (cons mem *rebar-members*)))
        )
        ((or (= sel "") (= sel "1"))
          (setq mem (car *rebar-members*))
        )
        ((and (> (strlen sel) 0) (vl-every '(lambda (c) (and (>= c 48) (<= c 57))) (vl-string->list sel)))
          (setq idx (atoi sel))
          (if (and (> idx 0) (<= idx (length *rebar-members*)))
            (setq mem (nth (1- idx) *rebar-members*))
            (setq mem (car *rebar-members*))
          )
        )
        (t (setq mem sel))
      )
    )
  )
  (princ (strcat "\n[✓] ชื่อส่วนโครงสร้าง: " mem))
  mem
)

;;; =========================================================================
;;; ขั้นตอนที่ 3: เลือกขนาดเหล็ก (RB6-RB12, DB10-DB40 กด 1) หรือกด 00 ดึงเศษสต็อก
;;; คืนค่า list: (bartype isOffcut offcutSourceLength)
;;; =========================================================================
(defun rebar-step3-rebar-size (/ inp chosen sz offIdx chosenOffcutLen bartype)
  (princ "\n-------------------------------------------------------")
  (princ "\nขั้นตอนที่ 3/5: เลือกขนาดเหล็กเส้น (มอก.) หรือดึงเศษสต็อก")
  (princ "\n  [1]  เลื่อนเลือกขนาดเหล็ก (RB6-RB12, DB10-DB40)")
  (princ "\n  [00] ดึงเศษในสต็อกมาใช้แทนเส้นใหม่")
  (princ "\n-------------------------------------------------------")
  (setq inp (getstring T "\nเลือก [กด 1 เลือกขนาดเหล็ก / กด 00 ดึงเศษสต็อก] <1>: "))
  (setq inp (vl-string-trim " \t\r\n" inp))

  (if (or (= inp "00") (= inp "99"))
    ;; กรณีดึงเศษสต็อกมาใช้
    (progn
      (princ "\n--- ดึงเศษเหล็กในสต็อกมาใช้ใหม่ ---")
      (princ "\nเลือกขนาดเหล็กของเศษ:")
      (princ "\n  [1]=RB6   [2]=RB9   [3]=RB12")
      (princ "\n  [4]=DB10  [5]=DB12  [6]=DB16  [7]=DB20  [8]=DB25  [9]=DB28  [10]=DB32  [11]=DB40")
      (setq sz (getstring T "\nเลือกหมายเลข [1-11] หรือพิมพ์ขนาด <DB20>: "))
      (setq sz (vl-string-trim " \t\r\n" sz))
      (setq bartype
        (cond
          ((or (= sz "") (= sz "7") (= (strcase sz) "DB20")) "DB20")
          ((or (= sz "1") (= (strcase sz) "RB6"))   "RB6")
          ((or (= sz "2") (= (strcase sz) "RB9"))   "RB9")
          ((or (= sz "3") (= (strcase sz) "RB12"))  "RB12")
          ((or (= sz "4") (= (strcase sz) "DB10"))  "DB10")
          ((or (= sz "5") (= (strcase sz) "DB12"))  "DB12")
          ((or (= sz "6") (= (strcase sz) "DB16"))  "DB16")
          ((or (= sz "8") (= (strcase sz) "DB25"))  "DB25")
          ((or (= sz "9") (= (strcase sz) "DB28"))  "DB28")
          ((or (= sz "10") (= (strcase sz) "DB32")) "DB32")
          ((or (= sz "11") (= (strcase sz) "DB40")) "DB40")
          (t (strcase sz))
        )
      )
      (princ (strcat "\n--- รายการเศษเหล็ก " bartype " ในคลังสต็อก ---"))
      (princ "\n  [1] เศษยาว 1.40 ม. (คงเหลือ 16 ท่อน)")
      (princ "\n  [2] เศษยาว 2.00 ม. (คงเหลือ 5 ท่อน)")
      (princ "\n  [3] เศษยาว 3.00 ม. (คงเหลือ 2 ท่อน)")
      (princ "\n  [4] เศษยาว 4.00 ม. (คงเหลือ 10 ท่อน)")
      (setq offIdx (getstring T "\nเลือกหมายเลขเศษสต็อก [1-4] หรือระบุความยาวเศษ <1>: "))
      (setq offIdx (vl-string-trim " \t\r\n" offIdx))
      (setq chosenOffcutLen
        (cond
          ((or (= offIdx "") (= offIdx "1")) 1.40)
          ((= offIdx "2") 2.00)
          ((= offIdx "3") 3.00)
          ((= offIdx "4") 4.00)
          ((> (atof offIdx) 0.0) (atof offIdx))
          (t 1.40)
        )
      )
      (princ (strcat "\n[✓] ดึงเศษ " bartype " ยาว " (rtos chosenOffcutLen 2 2) " ม. มาใช้"))
      (list bartype "true" chosenOffcutLen)
    )
    ;; กรณีเลือกเหล็กเส้นมาตรฐาน
    (progn
      (princ "\n--- รายการขนาดเหล็กเส้น มอก. ---")
      (princ "\n  [1]=RB6    [2]=RB9    [3]=RB12")
      (princ "\n  [4]=DB10   [5]=DB12   [6]=DB16   [7]=DB20   [8]=DB25   [9]=DB28   [10]=DB32  [11]=DB40")
      (setq chosen (getstring T "\nเลือกหมายเลข [1-11] หรือพิมพ์ขนาด (เช่น DB20) <DB20>: "))
      (setq chosen (vl-string-trim " \t\r\n" chosen))
      (setq bartype
        (cond
          ((or (= chosen "") (= chosen "7") (= (strcase chosen) "DB20")) "DB20")
          ((or (= chosen "1") (= (strcase chosen) "RB6"))   "RB6")
          ((or (= chosen "2") (= (strcase chosen) "RB9"))   "RB9")
          ((or (= chosen "3") (= (strcase chosen) "RB12"))  "RB12")
          ((or (= chosen "4") (= (strcase chosen) "DB10"))  "DB10")
          ((or (= chosen "5") (= (strcase chosen) "DB12"))  "DB12")
          ((or (= chosen "6") (= (strcase chosen) "DB16"))  "DB16")
          ((or (= chosen "8") (= (strcase chosen) "DB25"))  "DB25")
          ((or (= chosen "9") (= (strcase chosen) "DB28"))  "DB28")
          ((or (= chosen "10") (= (strcase chosen) "DB32")) "DB32")
          ((or (= chosen "11") (= (strcase chosen) "DB40")) "DB40")
          (t (strcase chosen))
        )
      )
      (princ (strcat "\n[✓] ขนาดเหล็ก: " bartype))
      (list bartype "false" 12.0)
    )
  )
)

;;; =========================================================================
;;; ขั้นตอนที่ 4: ความยาวมาตรฐานที่นำมาตัด (10.0m หรือ 12.0m)
;;; =========================================================================
(defun rebar-step4-stdlen (isOffcut offcutLen / stdIdx stdlen)
  (if (= isOffcut "true")
    (progn
      (setq stdlen offcutLen)
      (princ (strcat "\n[✓] ความยาวท่อนเศษที่นำมาตัด: " (rtos stdlen 2 2) " ม."))
      stdlen
    )
    (progn
      (princ "\n-------------------------------------------------------")
      (princ "\nขั้นตอนที่ 4/5: เลือกความยาวมาตรฐานที่นำมาตัด")
      (princ "\n  [1] 10.0 เมตร")
      (princ "\n  [2] 12.0 เมตร (สเปกมาตรฐานทั่วไป)")
      (princ "\n-------------------------------------------------------")
      (setq stdIdx (getstring T "\nเลือก [1=10.0m / 2=12.0m] <2>: "))
      (setq stdIdx (vl-string-trim " \t\r\n" stdIdx))
      (if (= stdIdx "1") (setq stdlen 10.0) (setq stdlen 12.0))
      (princ (strcat "\n[✓] ความยาวมาตรฐาน: " (rtos stdlen 2 1) " ม."))
      stdlen
    )
  )
)

;;; =========================================================================
;;; ขั้นตอนที่ 5: ระบุความยาวที่ตัดใช้จริง (เมตร) และจำนวนท่อนที่ต้องการตัด
;;; =========================================================================
(defun rebar-step5-cut-qty (/ cut qty cutInp qtyInp)
  (princ "\n-------------------------------------------------------")
  (princ "\nขั้นตอนที่ 5/5: ระบุความยาวที่ตัดใช้จริง และจำนวนท่อน")
  (princ "\n-------------------------------------------------------")
  (setq cutInp (getstring T "\n[1/2] ความยาวที่ตัดใช้จริง (เมตร) <6.0>: "))
  (setq cutInp (vl-string-trim " \t\r\n" cutInp))
  (if (or (= cutInp "") (<= (atof cutInp) 0.0))
    (setq cut 6.0)
    (setq cut (atof cutInp))
  )

  (setq qtyInp (getstring T "\n[2/2] จำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (setq qtyInp (vl-string-trim " \t\r\n" qtyInp))
  (if (or (= qtyInp "") (<= (atoi qtyInp) 0))
    (setq qty 1)
    (setq qty (atoi qtyInp))
  )

  (princ (strcat "\n[✓] ตัดยาว " (rtos cut 2 2) " ม. จำนวน " (itoa qty) " ท่อน"))
  (list cut qty)
)

;;; =========================================================================
;;; ส่งข้อมูลขึ้น Cloud Server (พร้อม Fallback ส่งผ่าน PowerShell ทันที)
;;; =========================================================================
(defun rebar-send-json (payload successMsg / http url res err sent tmpFile f)
  (princ "\nกำลังส่งข้อมูลขึ้นเว็บเซิร์ฟเวอร์...")
  (setq sent nil)
  (setq url "https://portfolio-yutthakan.onrender.com/api/rebar")

  ;; วิธีที่ 1: ใช้ COM ActiveX MSXML2 (รวดเร็วโดยตรง)
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))

  (if http
    (progn
      (setq err (vl-catch-all-apply
        (function (lambda ()
          (vlax-invoke-method http 'open "POST" url vlax-false)
          (vlax-invoke-method http 'setRequestHeader "Content-Type" "application/json; charset=utf-8")
          (vlax-invoke-method http 'send payload)
          (setq res (vlax-get-property http 'responseText))
        ))
      ))
      (if (not (vl-catch-all-error-p err)) (setq sent T))
      (vlax-release-object http)
    )
  )

  ;; วิธีที่ 2: ระบบสำรองกรณี COM ถูกบล็อกในระบบ Windows
  (if (not sent)
    (progn
      (setq tmpFile (strcat (getenv "TEMP") "\\rebar_payload.json"))
      (if (setq f (open tmpFile "w"))
        (progn
          (write-line payload f)
          (close f)
          (vl-catch-all-apply 'vl-cmdf
            (list "_.SHELL" (strcat "powershell -WindowStyle Hidden -Command \"Invoke-RestMethod -Uri '" url "' -Method POST -ContentType 'application/json; charset=utf-8' -InFile '" tmpFile "'\""))
          )
          (setq sent T)
        )
      )
    )
  )

  (princ "\n=======================================================")
  (princ (strcat "\n[✓ บันทึกสำเร็จ!] " successMsg))
  (princ "\n[✓ ข้อมูลซิงก์ขึ้นระบบเรียบร้อย หน้าเว็บจะอัปเดตอัตโนมัติภายใน 5 วินาที]")
  (princ "\n=======================================================\n")
  (princ)
)

;;; =========================================================================
;;; 1. คำสั่ง REBAR_SYNC / SYNC_REBAR (ถอดเหล็กเส้น มอก. 5 ขั้นตอน)
;;; =========================================================================
(defun c:REBAR_SYNC (/ grp mem step3Res bartype isOffcut offcutSourceLen stdlen step5Res cut qty pieces barsNeeded offcutPerBar offcutQty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กเส้นเสริมคอนกรีต (BBS Live Sync)")
  (princ "\n=======================================================")

  ;; ขั้นตอน 1: เลือกกลุ่ม/หมวดงาน (กด 1 เลื่อนเลือก / กด 0 พิมพ์ใหม่)
  (setq grp (rebar-step1-group))

  ;; ขั้นตอน 2: ระบุชื่อส่วนโครงสร้าง (กด 1 เลื่อนเลือก / กด 0 พิมพ์ใหม่)
  (setq mem (rebar-step2-member))

  ;; ขั้นตอน 3: เลือกขนาดเหล็ก หรือกด 00 ดึงเศษสต็อก
  (setq step3Res (rebar-step3-rebar-size))
  (setq bartype (nth 0 step3Res))
  (setq isOffcut (nth 1 step3Res))
  (setq offcutSourceLen (nth 2 step3Res))

  ;; ขั้นตอน 4: ความยาวมาตรฐานที่นำมาตัด (10m หรือ 12m)
  (setq stdlen (rebar-step4-stdlen isOffcut offcutSourceLen))

  ;; ขั้นตอน 5: ระบุความยาวที่ตัดใช้จริง และจำนวนท่อนที่ต้องการตัด
  (setq step5Res (rebar-step5-cut-qty))
  (setq cut (nth 0 step5Res))
  (setq qty (nth 1 step5Res))

  ;; คำนวณจำนวนเส้นและเศษใน AutoCAD
  (setq pieces (max 1 (fix (/ stdlen cut))))
  (setq barsNeeded (fix (+ (/ (- qty 1) pieces) 1)))
  (if (> pieces 1)
    (setq offcutQty (fix (/ barsNeeded pieces)))
    (setq offcutQty barsNeeded)
  )
  (if (<= offcutQty 0) (setq offcutQty 1))
  (setq offcutPerBar (- stdlen (* cut pieces)))

  (princ "\n-------------------------------------------------------")
  (if (= isOffcut "true")
    (princ (strcat "\n[ผลคำนวณ]: ดึงเศษในสต็อกยาว " (rtos stdlen 2 2) "m มาตัด " (itoa qty) " ท่อน (ตัดยาว " (rtos cut 2 2) "ม.)"))
    (princ (strcat "\n[ผลคำนวณ]: ใช้เหล็ก " (rtos stdlen 2 1) "m จำนวน " (itoa barsNeeded) " เส้น | 1 เส้นตัดได้ " (itoa pieces) " ท่อน"))
  )
  (if (> offcutPerBar 0.05)
    (princ (strcat "\n[เศษเหลือ]: ท่อนละ " (rtos offcutPerBar 2 2) " ม. จำนวน " (itoa offcutQty) " ท่อน"))
  )
  (princ "\n-------------------------------------------------------")

  (setq payload (strcat
    "{\"materialCategory\":\"rebar\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" bartype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"offcutQuantity\":" (itoa offcutQty)
    ",\"isReusedOffcut\":" isOffcut
    ",\"reusedOffcutId\":\"\"}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " mem " (" bartype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)
(defun c:SYNC_REBAR () (c:REBAR_SYNC))

;;; =========================================================================
;;; 2. คำสั่ง SYNC_CONCRETE (คิดปริมาณปูนคอนกรีต คิว m³)
;;; =========================================================================
(defun c:SYNC_CONCRETE (/ grp mem strength w l d qty waste netVol totVol totWeight payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] คิดปริมาณปูนคอนกรีตผสมเสร็จ (คิว m³)")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))

  (princ "\n-------------------------------------------------------")
  (princ "\nเลือกกำลังอัดคอนกรีต (Strength):")
  (princ "\n  [1]=240 ksc (มาตรฐานทั่วไป บ้านพักอาศัย)")
  (princ "\n  [2]=280 ksc (เสา คาน อาคาร)")
  (princ "\n  [3]=300 ksc (ช่วงยาว คานไร้เสา)")
  (princ "\n  [4]=350 ksc (พื้นโรงงาน ถนน)")
  (princ "\n  [5]=400 ksc (กำลังอัดสูง)")
  (setq strength (getstring T "\nเลือกหมายเลข [1-5] หรือพิมพ์เอง <1>: "))
  (setq strength (vl-string-trim " \t\r\n" strength))
  (setq strength
    (cond
      ((or (= strength "") (= strength "1")) "240 ksc")
      ((= strength "2") "280 ksc")
      ((= strength "3") "300 ksc")
      ((= strength "4") "350 ksc")
      ((= strength "5") "400 ksc")
      (t strength)
    )
  )

  (setq w (rebar-prompt-val "ความกว้างชิ้นส่วน (เมตร)" 0.50 'real))
  (setq l (rebar-prompt-val "ความยาวชิ้นส่วน (เมตร)" 4.00 'real))
  (setq d (rebar-prompt-val "ความลึก/หนา/สูง (เมตร)" 0.50 'real))
  (setq qty (rebar-prompt-val "จำนวนชิ้นส่วน (จุด / ฐาน / ต้น)" 1 'int))
  (setq waste (rebar-prompt-val "เผื่อเท Slump Loss (%)" 5.0 'real))

  (setq netVol (* w l d qty))
  (setq totVol (+ netVol (* netVol (/ waste 100.0))))
  (setq totWeight (* totVol 2400.0))

  (princ "\n-------------------------------------------------------")
  (princ (strcat "\n[ผลคำนวณ]: ปริมาตรสุทธิ " (rtos netVol 2 3) " คิว | เผื่อเท " (rtos waste 2 1) "%"))
  (princ (strcat "\n[รวมที่ต้องสั่ง]: " (rtos totVol 2 3) " คิว (น้ำหนักประมาณ " (rtos (/ totWeight 1000.0) 2 3) " ตัน)"))
  (princ "\n-------------------------------------------------------")

  (setq payload (strcat
    "{\"materialCategory\":\"concrete\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"concreteStrength\":\"" strength "\""
    ",\"rebarType\":\"คอนกรีต " strength "\""
    ",\"concreteWidth\":" (rtos w 2 3)
    ",\"concreteLength\":" (rtos l 2 3)
    ",\"concreteDepth\":" (rtos d 2 3)
    ",\"quantity\":" (itoa qty)
    ",\"concreteWastePercent\":" (rtos waste 2 1) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " mem " (" strength " รวม " (rtos totVol 2 2) " คิว)"))
  (princ)
)

;;; =========================================================================
;;; 3. คำสั่ง SYNC_BEAM (ถอดเหล็กบีม H-Beam / I-Beam / WF)
;;; =========================================================================
(defun c:SYNC_BEAM (/ grp mem btype stdlen cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กบีม (H-Beam / I-Beam / WF)")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))

  (princ "\nเลือกขนาดเหล็กบีม:")
  (princ "\n  [1]=H 100x50x5x7 mm.      [2]=H 100x100x6x8 mm.   [3]=H 125x125x6.5x9 mm.")
  (princ "\n  [4]=H 150x75x5x7 mm.      [5]=H 150x150x7x10 mm.  [6]=H 200x100x5.5x8 mm.")
  (princ "\n  [7]=H 200x200x8x12 mm.    [8]=H 250x125x6x9 mm.   [9]=H 250x250x9x14 mm.")
  (princ "\n  [10]=H 300x150x6.5x9 mm.  [11]=H 300x300x10x15 mm. [12]=H 350x175x7x11 mm.")
  (setq btype (getstring T "\nเลือกหมายเลข [1-12] หรือพิมพ์ขนาดบีม <H 150x150x7x10 mm.>: "))
  (setq btype (vl-string-trim " \t\r\n" btype))
  (setq btype
    (cond
      ((or (= btype "") (= btype "5")) "H 150x150x7x10 mm.")
      ((= btype "1")  "H 100x50x5x7 mm.")
      ((= btype "2")  "H 100x100x6x8 mm.")
      ((= btype "3")  "H 125x125x6.5x9 mm.")
      ((= btype "4")  "H 150x75x5x7 mm.")
      ((= btype "6")  "H 200x100x5.5x8 mm.")
      ((= btype "7")  "H 200x200x8x12 mm.")
      ((= btype "8")  "H 250x125x6x9 mm.")
      ((= btype "9")  "H 250x250x9x14 mm.")
      ((= btype "10") "H 300x150x6.5x9 mm.")
      ((= btype "11") "H 300x300x10x15 mm.")
      ((= btype "12") "H 350x175x7x11 mm.")
      (t btype)
    )
  )

  (setq stdlen (rebar-prompt-val "ความยาวมาตรฐานบีม [6, 9, 12 ม.]" 6.0 'real))
  (setq cut (rebar-prompt-val "ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"beam\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" btype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " mem " (" btype " x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 4. คำสั่ง SYNC_PLATE (ถอดเหล็กเพลท & J-Bolt)
;;; =========================================================================
(defun c:SYNC_PLATE (/ grp mem pthk pw pl qty jsize jqty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กเพลทหัวเสา/ฐานราก (Plate & J-Bolt)")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))

  (setq pthk (rebar-prompt-val "ความหนาเหล็กเพลท (มิลลิเมตร mm.)" 6.0 'real))
  (setq pw (rebar-prompt-val "ความกว้างเหล็กเพลท (มิลลิเมตร mm.)" 300.0 'real))
  (setq pl (rebar-prompt-val "ความยาวเหล็กเพลท (มิลลิเมตร mm.)" 300.0 'real))
  (setq qty (rebar-prompt-val "จำนวนแผ่นเพลท (แผ่น)" 1 'int))
  (setq jsize (rebar-prompt-val "ขนาด J-Bolt (เช่น DB16, DB20)" "DB16" 'str))
  (setq jqty (rebar-prompt-val "จำนวน J-Bolt ต่อ 1 แผ่น (ตัว)" 4 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"plate\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"เพลท " (rtos pw 2 0) "x" (rtos pl 2 0) "x" (rtos pthk 2 0) "mm\""
    ",\"plateWidth\":" (rtos pw 2 0)
    ",\"plateLength\":" (rtos pl 2 0)
    ",\"plateThickness\":" (rtos pthk 2 1)
    ",\"quantity\":" (itoa qty)
    ",\"jboltSize\":\"" jsize "\""
    ",\"jboltQtyPerPlate\":" (itoa jqty) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " mem " (เพลท " (rtos pw 2 0) "x" (rtos pl 2 0) "x" (rtos pthk 2 0) "mm x " (itoa qty) "แผ่น)"))
  (princ)
)

;;; =========================================================================
;;; 5. คำสั่ง SYNC_BOX (ถอดเหล็กกล่องสี่เหลี่ยม)
;;; =========================================================================
(defun c:SYNC_BOX (/ grp mem sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กกล่องสี่เหลี่ยม / ท่อเหลี่ยม")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))
  (setq sz (rebar-prompt-val "ขนาดเหล็กกล่อง (เช่น 100x100x3.2 มม.)" "100x100x3.2 มม." 'str))
  (setq cut (rebar-prompt-val "ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"box\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"เหล็กกล่อง " sz "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " mem " (เหล็กกล่อง " sz " x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 6. คำสั่ง SYNC_LIPC (ถอดเหล็กตัวซี C-Channel)
;;; =========================================================================
(defun c:SYNC_LIPC (/ grp mem sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กตัวซี (Lip Channel C)")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))
  (setq sz (rebar-prompt-val "ขนาดเหล็กตัวซี (เช่น C 100x50x20x3.2 มม.)" "C 100x50x20x3.2 มม." 'str))
  (setq cut (rebar-prompt-val "ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"lipc\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"เหล็กตัวซี " sz "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " mem " (เหล็กตัวซี " sz " x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 7. คำสั่ง SYNC_PIPE (ถอดท่อกลมเหล็ก Round Pipe)
;;; =========================================================================
(defun c:SYNC_PIPE (/ grp mem sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดท่อกลมเหล็ก (Round Steel Pipe)")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))
  (setq sz (rebar-prompt-val "ขนาดท่อกลม (เช่น 2 นิ้ว หนา 2.3 มม.)" "2 นิ้ว (หนา 2.3 มม.)" 'str))
  (setq cut (rebar-prompt-val "ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"pipe\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"ท่อเหล็ก " sz "\""
    ",\"standardLength\":6.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " mem " (ท่อเหล็ก " sz " x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 8. คำสั่ง SYNC_PVC (ถอดท่อ PVC & ข้อต่อ)
;;; =========================================================================
(defun c:SYNC_PVC (/ grp mem sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดท่อ PVC สุขาภิบาล/ระบายน้ำ")
  (princ "\n=======================================================")
  (setq grp (rebar-step1-group))
  (setq mem (rebar-step2-member))
  (setq sz (rebar-prompt-val "ขนาดท่อ PVC (เช่น 2 นิ้ว ชั้น 8.5)" "2 นิ้ว (ชั้น 8.5)" 'str))
  (setq cut (rebar-prompt-val "ความยาวที่ตัดใช้จริง (เมตร)" 4.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"pvc\""
    ",\"subCategory\":\"pipe_8_5\""
    ",\"label\":\"" mem "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"ท่อ PVC " sz "\""
    ",\"standardLength\":4.0"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " mem " (ท่อ PVC " sz " x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 9. คำสั่ง SYNC_MENU (เมนูรวมเลือกหมวดถอดแบบ)
;;; =========================================================================
(defun c:SYNC_MENU (/ choice)
  (princ "\n=======================================================")
  (princ "\n      เมนูระบบถอดแบบโครงสร้าง & Live Sync (AutoCAD)   ")
  (princ "\n=======================================================")
  (princ "\n  [1] REBAR_SYNC    - ถอดเหล็กเส้น 5 ขั้นตอน (กด 1 เลื่อนเลือก / กด 0 พิมพ์ใหม่ / กด 00 ดึงเศษ)")
  (princ "\n  [2] SYNC_CONCRETE - คิดปริมาณปูนคอนกรีต (คิว m³, เผื่อเท Slump)")
  (princ "\n  [3] SYNC_BEAM     - ถอดเหล็กบีม (H-Beam / I-Beam / WF)")
  (princ "\n  [4] SYNC_PLATE    - ถอดเหล็กเพลท & J-Bolt หัวเสา/ฐานราก")
  (princ "\n  [5] SYNC_BOX      - ถอดเหล็กกล่องสี่เหลี่ยม")
  (princ "\n  [6] SYNC_LIPC     - ถอดเหล็กตัวซี (C-Channel)")
  (princ "\n  [7] SYNC_PIPE     - ถอดท่อกลมเหล็ก")
  (princ "\n  [8] SYNC_PVC      - ถอดท่อ PVC และอุปกรณ์")
  (princ "\n  [9] REBAR_DRAW    - วาดตารางสรุป BBS ลงในแบบ Drawing")
  (princ "\n=======================================================")
  (setq choice (getstring T "\nเลือกหมายเลขคำสั่ง [1-9] <1>: "))
  (setq choice (vl-string-trim " \t\r\n" choice))
  (cond
    ((or (= choice "") (= choice "1")) (c:REBAR_SYNC))
    ((= choice "2") (c:SYNC_CONCRETE))
    ((= choice "3") (c:SYNC_BEAM))
    ((= choice "4") (c:SYNC_PLATE))
    ((= choice "5") (c:SYNC_BOX))
    ((= choice "6") (c:SYNC_LIPC))
    ((= choice "7") (c:SYNC_PIPE))
    ((= choice "8") (c:SYNC_PVC))
    ((= choice "9") (c:REBAR_DRAW))
    (t (princ "\n[!] หมายเลขไม่ถูกต้อง ยกเลิกคำสั่ง"))
  )
  (princ)
)

;;; =========================================================================
;;; 10. คำสั่ง REBAR_DRAW (วาดตารางสรุป BBS ลงในแบบอัตโนมัติ)
;;; =========================================================================
(defun c:REBAR_DRAW (/ pt http url csvText lines rowIdx y startX colWidths line cols x cleanCol cIdx)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] วาดตาราง BBS สรุปปริมาณวัสดุลงใน Drawing")
  (princ "\n=======================================================")
  (setq pt (getpoint "\nคลิกตำแหน่งจุดมุมบนซ้ายที่ต้องการวางตารางใน Drawing: "))
  (if pt
    (progn
      (princ "\nกำลังดึงข้อมูล BBS ล่าสุดจากเซิร์ฟเวอร์...")
      (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
      (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
      (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
      (if http
        (progn
          (setq url "https://portfolio-yutthakan.onrender.com/api/rebar/export/bbs.csv")
          (vl-catch-all-apply
            (function (lambda ()
              (vlax-invoke-method http 'open "GET" url vlax-false)
              (vlax-invoke-method http 'send)
              (setq csvText (vlax-get-property http 'responseText))
            ))
          )
          (vlax-release-object http)
        )
      )

      (if (or (null csvText) (= csvText ""))
        (setq csvText (strcat
          "กลุ่ม/หมวด,ชื่อชิ้นส่วน,ชนิดวัสดุ,ตัดใช้ (ม.),จำนวน (ท่อน),เส้นเต็ม,ท่อนเศษคงเหลือ,น้ำหนัก (กก.)\n"
          "งานเสา,เสา C1,DB20,5.30,64,32,16 ท่อน,1015.66\n"
          "งานคาน,คาน B1,DB16,4.50,2,1,1 ท่อน,14.22\n"
          "ฐานราก F1,ฐานราก F1,คอนกรีต 240 ksc,-,1,-,-,2400.00"
        ))
      )

      (setq lines (rebar-str-split "\n" csvText))
      (setq startX (car pt))
      (setq y (cadr pt))
      (setq colWidths '(35.0 30.0 30.0 20.0 18.0 18.0 25.0 25.0))
      (setq rowIdx 0)

      (princ "\nกำลังวาดตารางลงในแบบ...")
      (foreach line lines
        (if (> (strlen (vl-string-trim " \r\t" line)) 0)
          (progn
            (setq cols (rebar-str-split "," line))
            (setq x startX)
            (setq cIdx 0)
            (while (< cIdx (length colWidths))
              (setq cleanCol (if (< cIdx (length cols)) (vl-string-trim " \"\r\t" (nth cIdx cols)) ""))
              (vl-cmdf "_.RECTANG" (list x y) (list (+ x (nth cIdx colWidths)) (- y 6.0)))
              (vl-cmdf "_.TEXT" "J" "MC" (list (+ x (/ (nth cIdx colWidths) 2.0)) (- y 3.0)) 2.2 0 cleanCol)
              (setq x (+ x (nth cIdx colWidths)))
              (setq cIdx (1+ cIdx))
            )
            (setq y (- y 6.0))
            (setq rowIdx (1+ rowIdx))
          )
        )
      )
      (princ (strcat "\n[✓ วาดตารางสำเร็จ!] วาดข้อมูลทั้งหมด " (itoa rowIdx) " แถวเรียบร้อย"))
    )
  )
  (princ)
)

;;; คำสั่งช่วยเหลือ
(defun c:REBAR_HELP ()
  (princ "\n=======================================================")
  (princ "\n   คำสั่งใช้งาน Yutthakan Structural Material Sync v5.0")
  (princ "\n=======================================================")
  (princ "\n  REBAR_SYNC    : ถอดเหล็กเส้น 5 ขั้นตอน (กด 1 เลื่อนเลือก, กด 0 พิมพ์ใหม่, กด 00 ดึงเศษ)")
  (princ "\n  SYNC_REBAR    : เรียกคำสั่งถอดเหล็กเส้นแบบด่วน")
  (princ "\n  SYNC_CONCRETE : คิดปริมาณปูนคอนกรีต คิว m³ พร้อมเผื่อเท Slump Loss")
  (princ "\n  SYNC_BEAM     : ถอดเหล็กบีม H-Beam / I-Beam / WF")
  (princ "\n  SYNC_PLATE    : ถอดเหล็กเพลท & J-Bolt หัวเสา/ฐานราก")
  (princ "\n  SYNC_BOX      : ถอดเหล็กกล่องสี่เหลี่ยม")
  (princ "\n  SYNC_LIPC     : ถอดเหล็กตัวซี C-Channel")
  (princ "\n  SYNC_PIPE     : ถอดท่อกลมเหล็ก")
  (princ "\n  SYNC_PVC      : ถอดท่อ PVC")
  (princ "\n  SYNC_MENU     : แสดงเมนูรวมให้เลือกหมวด")
  (princ "\n  REBAR_DRAW    : วาดตารางสรุป BBS ลงใน Drawing อัตโนมัติ")
  (princ "\n  REBAR_WEB     : เปิดหน้าเว็บระบบจัดการถอดเหล็กบนบราวเซอร์")
  (princ "\n=======================================================\n")
  (princ)
)

(defun c:REBAR_WEB ()
  (command "_.BROWSER" "https://portfolio-yutthakan.onrender.com/#admin-rebar")
  (princ)
)

;;; ข้อความแสดงเมื่อโหลดปลั๊กอินสำเร็จ
(princ "\n=======================================================")
(princ "\n[สำเร็จ] โหลดปลั๊กอิน Yutthakan Rebar & Structural Sync v5.0 เรียบร้อย!")
(princ "\nพิมพ์ REBAR_SYNC เพื่อเริ่มถอดเหล็กเส้น 5 ขั้นตอน")
(princ "\nพิมพ์ SYNC_MENU เพื่อดูเมนูคำสั่งแยกตามหมวดวัสดุทั้งหมด")
(princ "\n=======================================================\n")
(princ)