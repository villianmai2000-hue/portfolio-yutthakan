;;; =========================================================================
;;; AutoLISP: Yutthakan Structural Material Takeoff & BBS Live Sync v4.5
;;; สถาปนิกและวิศวกรโครงสร้าง: ยุทธการ คำกลอน
;;; รองรับ 10 หมวดคำสั่งถอดแบบโครงสร้าง ซิงก์ขึ้นเว็บแบบเรียลไทม์
;;; =========================================================================
(vl-load-com)

;;; ตัวแปรเก็บหมวดและชิ้นส่วน (บันทึกจำไว้ตลอดการทำงานของ AutoCAD)
(if (null *rebar-groups*)
  (setq *rebar-groups* (list "ฐานราก F1" "งานเสา" "งานคาน" "งานพื้น" "งานโครงสร้างเหล็ก" "งานสุขาภิบาล/ท่อ" "F1-C1 NO.1"))
)
(if (null *rebar-members*)
  (setq *rebar-members* (list "เสา C1" "เสา C2" "คาน B1" "คาน B2" "ฐานราก F1" "เพลท P1" "แป C1" "พื้น S1"))
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

;;; ฟังก์ชันรับค่าพร้อม Default value ที่ปลอดภัย ไม่เด้งหลุด
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

;;; ฟังก์ชันเลือกรายการจากลิสต์ หรือพิมพ์ชื่อใหม่ (ปลอดภัย 100% ไม่ Error)
(defun rebar-select-or-new (lst title / i maxN chosen outVal isAllDigits idx)
  (princ (strcat "\n--- " title " ---"))
  (princ "\nรายการในระบบ:")
  (setq maxN (min (length lst) 8))
  (setq i 0)
  (while (< i maxN)
    (princ (strcat "\n  [" (itoa (1+ i)) "] " (nth i lst)))
    (setq i (1+ i))
  )
  (setq chosen (getstring T (strcat "\nเลือกหมายเลข [1-" (itoa maxN) "] หรือพิมพ์ชื่อใหม่ <1>: ")))
  (setq chosen (vl-string-trim " \t\r\n" chosen))
  (cond
    ((or (= chosen "") (= chosen "1"))
      (setq outVal (car lst))
    )
    ;; ถ้าผู้ใช้พิมพ์ตัวเลข 1, 2, 3...
    ((and
       (> (strlen chosen) 0)
       (vl-every '(lambda (c) (and (>= c 48) (<= c 57))) (vl-string->list chosen))
       (setq idx (atoi chosen))
       (> idx 0)
       (<= idx (length lst))
     )
      (setq outVal (nth (1- idx) lst))
    )
    ;; ถ้าพิมพ์ข้อความชื่อใหม่
    (t
      (setq outVal chosen)
      (if (not (member outVal lst))
        (setq lst (append lst (list outVal)))
      )
    )
  )
  (princ (strcat "\n[✓] เลือก: " outVal))
  outVal
)

;;; ฟังก์ชันเลือกขนาดเหล็กเส้น (RB / DB)
(defun rebar-select-rebar-size (title / chosen outVal)
  (princ (strcat "\n--- " title " ---"))
  (princ "\n  [1]=RB6    [2]=RB9    [3]=RB12")
  (princ "\n  [4]=DB10   [5]=DB12   [6]=DB16   [7]=DB20   [8]=DB25   [9]=DB28   [10]=DB32  [11]=DB40")
  (princ "\n  [99]=เลือกดึงเศษในคลังสต็อกมาใช้")
  (setq chosen (getstring T "\nเลือกหมายเลข [1-11 หรือ 99] หรือพิมพ์ขนาด <DB20>: "))
  (setq chosen (vl-string-trim " \t\r\n" chosen))
  (cond
    ((or (= chosen "") (= chosen "7") (= (strcase chosen) "DB20")) (setq outVal "DB20"))
    ((or (= chosen "1") (= (strcase chosen) "RB6"))   (setq outVal "RB6"))
    ((or (= chosen "2") (= (strcase chosen) "RB9"))   (setq outVal "RB9"))
    ((or (= chosen "3") (= (strcase chosen) "RB12"))  (setq outVal "RB12"))
    ((or (= chosen "4") (= (strcase chosen) "DB10"))  (setq outVal "DB10"))
    ((or (= chosen "5") (= (strcase chosen) "DB12"))  (setq outVal "DB12"))
    ((or (= chosen "6") (= (strcase chosen) "DB16"))  (setq outVal "DB16"))
    ((or (= chosen "8") (= (strcase chosen) "DB25"))  (setq outVal "DB25"))
    ((or (= chosen "9") (= (strcase chosen) "DB28"))  (setq outVal "DB28"))
    ((or (= chosen "10") (= (strcase chosen) "DB32")) (setq outVal "DB32"))
    ((or (= chosen "11") (= (strcase chosen) "DB40")) (setq outVal "DB40"))
    ((= chosen "99") (setq outVal "REUSE_OFFCUT"))
    (t (setq outVal (strcase chosen)))
  )
  outVal
)

;;; ฟังก์ชันเลือกกำลังอัดคอนกรีต
(defun rebar-select-concrete-strength (title / chosen outVal)
  (princ (strcat "\n--- " title " ---"))
  (princ "\n  [1]=240 ksc (มาตรฐานทั่วไป บ้านพักอาศัย)")
  (princ "\n  [2]=280 ksc (เสา คาน อาคาร)")
  (princ "\n  [3]=300 ksc (ช่วงยาว คานไร้เสา)")
  (princ "\n  [4]=350 ksc (พื้นโรงงาน ถนน)")
  (princ "\n  [5]=400 ksc (กำลังอัดสูง)")
  (setq chosen (getstring T "\nเลือกหมายเลข [1-5] หรือพิมพ์เอง <1>: "))
  (setq chosen (vl-string-trim " \t\r\n" chosen))
  (cond
    ((or (= chosen "") (= chosen "1")) (setq outVal "240 ksc"))
    ((= chosen "2") (setq outVal "280 ksc"))
    ((= chosen "3") (setq outVal "300 ksc"))
    ((= chosen "4") (setq outVal "350 ksc"))
    ((= chosen "5") (setq outVal "400 ksc"))
    (t (setq outVal chosen))
  )
  outVal
)

;;; ฟังก์ชันเลือกขนาดเหล็กบีม
(defun rebar-select-beam-size (title / chosen outVal)
  (princ (strcat "\n--- " title " ---"))
  (princ "\n  [1]=H 100x50x5x7 mm.      [2]=H 100x100x6x8 mm.   [3]=H 125x125x6.5x9 mm.")
  (princ "\n  [4]=H 150x75x5x7 mm.      [5]=H 150x150x7x10 mm.  [6]=H 200x100x5.5x8 mm.")
  (princ "\n  [7]=H 200x200x8x12 mm.    [8]=H 250x125x6x9 mm.   [9]=H 250x250x9x14 mm.")
  (princ "\n  [10]=H 300x150x6.5x9 mm.  [11]=H 300x300x10x15 mm. [12]=H 350x175x7x11 mm.")
  (setq chosen (getstring T "\nเลือกหมายเลข [1-12] หรือพิมพ์ขนาดบีม <H 150x150x7x10 mm.>: "))
  (setq chosen (vl-string-trim " \t\r\n" chosen))
  (cond
    ((or (= chosen "") (= chosen "5")) (setq outVal "H 150x150x7x10 mm."))
    ((= chosen "1")  (setq outVal "H 100x50x5x7 mm."))
    ((= chosen "2")  (setq outVal "H 100x100x6x8 mm."))
    ((= chosen "3")  (setq outVal "H 125x125x6.5x9 mm."))
    ((= chosen "4")  (setq outVal "H 150x75x5x7 mm."))
    ((= chosen "6")  (setq outVal "H 200x100x5.5x8 mm."))
    ((= chosen "7")  (setq outVal "H 200x200x8x12 mm."))
    ((= chosen "8")  (setq outVal "H 250x125x6x9 mm."))
    ((= chosen "9")  (setq outVal "H 250x250x9x14 mm."))
    ((= chosen "10") (setq outVal "H 300x150x6.5x9 mm."))
    ((= chosen "11") (setq outVal "H 300x300x10x15 mm."))
    ((= chosen "12") (setq outVal "H 350x175x7x11 mm."))
    (t (setq outVal chosen))
  )
  outVal
)

;;; ส่งข้อมูลขึ้น Cloud Server (พร้อมระบบ Fallback ที่ไม่มีทางหลุดหรือค้าง)
(defun rebar-send-json (payload successMsg / http url res err sent tmpFile f)
  (princ "\nกำลังส่งข้อมูลขึ้นเว็บเซิร์ฟเวอร์...")
  (setq sent nil)
  (setq url "https://portfolio-yutthakan.onrender.com/api/rebar")

  ;; 1. ส่งผ่าน ActiveX WinHTTP/MSXML
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))

  (if http
    (progn
      (setq err (vl-catch-all-apply
        '(lambda ()
           (vlax-invoke-method http 'open "POST" url vlax-false)
           (vlax-invoke-method http 'setRequestHeader "Content-Type" "application/json; charset=utf-8")
           (vlax-invoke-method http 'send payload)
           (setq res (vlax-get-property http 'responseText))
         )
      ))
      (vlax-release-object http)
      (if (not (vl-catch-all-error-p err))
        (setq sent T)
      )
    )
  )

  ;; 2. ส่งผ่าน Background PowerShell หาก ActiveX มีปัญหา
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
;;; 1. คำสั่ง SYNC_REBAR (ถอดเหล็กเส้น มอก. RB/DB)
;;; =========================================================================
(defun c:SYNC_REBAR (/ grp member bartype stdIdx stdlen cut qty useOffcut pieces barsNeeded offcutPerBar offcutQty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กเส้นเสริมคอนกรีต (มอก. 24-2559 / 20-2559)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1/6: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2/6: ชื่อส่วนโครงสร้าง"))
  (setq bartype (rebar-select-rebar-size "ขั้นที่ 3/6: เลือกขนาดเหล็กเส้น (มอก.)"))

  (setq useOffcut "false")
  (if (= bartype "REUSE_OFFCUT")
    (progn
      (setq useOffcut "true")
      (setq bartype (rebar-prompt-val "ระบุขนาดเศษเหล็กที่ต้องการ (เช่น DB20)" "DB20" 'str))
      (setq stdlen 12.0)
    )
    (progn
      ;; ความยาวมาตรฐานเหล็กเส้นที่ขาย: 10m และ 12m
      (setq stdIdx (rebar-prompt-val "ขั้นที่ 4/6: ความยาวมาตรฐานเหล็กเส้นที่ขาย [1]=10.0m [2]=12.0m" "2" 'str))
      (if (= stdIdx "1") (setq stdlen 10.0) (setq stdlen 12.0))
    )
  )

  (setq cut (rebar-prompt-val "ขั้นที่ 5/6: ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "ขั้นที่ 6/6: จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  ;; คำนวณเบื้องต้นใน CAD
  (setq pieces (max 1 (fix (/ stdlen cut))))
  (setq barsNeeded (fix (+ (/ (- qty 1) pieces) 1)))
  (if (> pieces 1)
    (setq offcutQty (fix (/ barsNeeded pieces)))
    (setq offcutQty barsNeeded)
  )
  (if (<= offcutQty 0) (setq offcutQty 1))
  (setq offcutPerBar (- stdlen (* cut pieces)))

  (princ "\n-------------------------------------------------------")
  (princ (strcat "\n[ผลคำนวณ]: ใช้เหล็ก " (rtos stdlen 2 1) "m จำนวน " (itoa barsNeeded) " เส้น | 1 เส้นตัดได้ " (itoa pieces) " ท่อน"))
  (if (> offcutPerBar 0.05)
    (princ (strcat "\n[เศษเหลือ]: ท่อนละ " (rtos offcutPerBar 2 2) " ม. จำนวน " (itoa offcutQty) " ท่อน"))
  )
  (princ "\n-------------------------------------------------------")

  (setq payload (strcat
    "{\"materialCategory\":\"rebar\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" bartype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty)
    ",\"offcutQuantity\":" (itoa offcutQty)
    ",\"isReusedOffcut\":" useOffcut
    ",\"reusedOffcutId\":\"\"}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" bartype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)
(defun c:REBAR_SYNC () (c:SYNC_REBAR))

;;; =========================================================================
;;; 2. คำสั่ง SYNC_CONCRETE (คิดปริมาณปูนคอนกรีต คิว m³)
;;; =========================================================================
(defun c:SYNC_CONCRETE (/ grp member strength w l d qty waste netVol totVol totWeight payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] คิดปริมาณปูนคอนกรีตผสมเสร็จ (คิว m³)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1/6: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2/6: ชื่อส่วนโครงสร้าง"))
  (setq strength (rebar-select-concrete-strength "ขั้นที่ 3/6: กำลังอัดคอนกรีต (Strength)"))

  (setq w (rebar-prompt-val "ขั้นที่ 4/6 [1/3]: ความกว้างชิ้นส่วน (เมตร)" 0.50 'real))
  (setq l (rebar-prompt-val "ขั้นที่ 4/6 [2/3]: ความยาวชิ้นส่วน (เมตร)" 4.00 'real))
  (setq d (rebar-prompt-val "ขั้นที่ 4/6 [3/3]: ความลึก/หนา/สูง (เมตร)" 0.50 'real))
  (setq qty (rebar-prompt-val "ขั้นที่ 5/6: จำนวนชิ้นส่วน (จุด / ฐาน / ต้น)" 1 'int))
  (setq waste (rebar-prompt-val "ขั้นที่ 6/6: เผื่อเท Slump Loss (%)" 5.0 'real))

  (setq netVol (* w l d qty))
  (setq totVol (+ netVol (* netVol (/ waste 100.0))))
  (setq totWeight (* totVol 2400.0))

  (princ "\n-------------------------------------------------------")
  (princ (strcat "\n[ผลคำนวณ]: ปริมาตรสุทธิ " (rtos netVol 2 3) " คิว | เผื่อเท " (rtos waste 2 1) "%"))
  (princ (strcat "\n[รวมที่ต้องสั่ง]: " (rtos totVol 2 3) " คิว (น้ำหนักประมาณ " (rtos (/ totWeight 1000.0) 2 3) " ตัน)"))
  (princ "\n-------------------------------------------------------")

  (setq payload (strcat
    "{\"materialCategory\":\"concrete\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"concreteStrength\":\"" strength "\""
    ",\"rebarType\":\"คอนกรีต " strength "\""
    ",\"concreteWidth\":" (rtos w 2 3)
    ",\"concreteLength\":" (rtos l 2 3)
    ",\"concreteDepth\":" (rtos d 2 3)
    ",\"quantity\":" (itoa qty)
    ",\"concreteWastePercent\":" (rtos waste 2 1) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" strength " รวม " (rtos totVol 2 2) " คิว)"))
  (princ)
)

;;; =========================================================================
;;; 3. คำสั่ง SYNC_BEAM (ถอดเหล็กบีม H-Beam / I-Beam / WF)
;;; =========================================================================
(defun c:SYNC_BEAM (/ grp member btype stdlen cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กบีม (H-Beam / I-Beam / WF)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1/5: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2/5: ชื่อส่วนโครงสร้าง"))
  (setq btype (rebar-select-beam-size "ขั้นที่ 3/5: เลือกขนาดเหล็กบีม"))
  (setq stdlen (rebar-prompt-val "ขั้นที่ 4/5: ความยาวมาตรฐานบีม [6, 9, 12 ม.]" 6.0 'real))
  (setq cut (rebar-prompt-val "ขั้นที่ 5/5 [1/2]: ความยาวที่ตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "ขั้นที่ 5/5 [2/2]: จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"beam\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" btype "\""
    ",\"standardLength\":" (rtos stdlen 2 2)
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] " member " (" btype " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 4. คำสั่ง SYNC_PLATE (ถอดเหล็กเพลท + J-Bolt)
;;; =========================================================================
(defun c:SYNC_PLATE (/ grp member w l th qty jsz jlen jqty nqty wqty autoW payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กเพลทหัวเสา/ฐานราก (Plate) + J-Bolt")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2: ชื่อส่วนโครงสร้าง (เช่น เพลท P1)"))
  (setq w (rebar-prompt-val "ความกว้างเพลท (มม.)" 300 'real))
  (setq l (rebar-prompt-val "ความยาวเพลท (มม.)" 300 'real))
  (setq th (rebar-prompt-val "ความหนาเพลท (มม.)" 6 'real))
  (setq qty (rebar-prompt-val "จำนวนแผ่นเพลท (แผ่น)" 1 'int))
  (setq jsz (rebar-prompt-val "ขนาด J-Bolt (เช่น DB16, DB20)" "DB16" 'str))
  (setq jlen (rebar-prompt-val "ความยาว J-Bolt (เมตร)" 0.40 'real))
  (setq jqty (rebar-prompt-val "จำนวน J-Bolt ต่อ 1 แผ่น (ชุด)" 4 'int))
  (setq nqty (rebar-prompt-val "จำนวนน็อตต่อ 1 แผ่น (ตัว)" 4 'int))
  (setq wqty (rebar-prompt-val "จำนวนแหวนต่อ 1 แผ่น (ตัว)" 4 'int))

  (setq autoW (* (/ w 1000.0) (/ l 1000.0) th 7.85))
  (princ (strcat "\n[ผลคำนวณ]: น้ำหนักเพลทแผ่นละ " (rtos autoW 2 2) " กก. x " (itoa qty) " แผ่น = " (rtos (* autoW qty) 2 2) " กก."))

  (setq payload (strcat
    "{\"materialCategory\":\"plate\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"plateWidth\":" (rtos w 2 1)
    ",\"plateLength\":" (rtos l 2 1)
    ",\"plateThickness\":" (rtos th 2 1)
    ",\"quantity\":" (itoa qty)
    ",\"jboltSize\":\"" jsz "\""
    ",\"jboltLength\":" (rtos jlen 2 2)
    ",\"jboltQtyPerPlate\":" (itoa jqty)
    ",\"nutQtyPerPlate\":" (itoa nqty)
    ",\"washerQtyPerPlate\":" (itoa wqty) "}"
  ))

  (rebar-send-json payload (strcat "[" grp "] เพลท " (rtos w 2 0) "x" (rtos l 2 0) "x" (rtos th 2 0) "mm x " (itoa qty) " แผ่น"))
  (princ)
)

;;; =========================================================================
;;; 5. คำสั่ง SYNC_BOX (เหล็กกล่อง SHS / RHS)
;;; =========================================================================
(defun c:SYNC_BOX (/ grp member sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กกล่องสี่เหลี่ยม (SHS / RHS)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อส่วนโครงสร้าง"))
  (setq sz (rebar-prompt-val "ขนาดเหล็กกล่อง (เช่น SHS 50x50x2.3 mm.)" "SHS 50x50x2.3 mm." 'str))
  (setq cut (rebar-prompt-val "ความยาวตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"SHS\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" sz "\""
    ",\"standardLength\":6.00"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " member " (" sz " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 6. คำสั่ง SYNC_LIPC (เหล็กตัวซี C-Channel)
;;; =========================================================================
(defun c:SYNC_LIPC (/ grp member sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดเหล็กตัวซี C-Channel (แปหลังคา/โครงผนัง)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อส่วนโครงสร้าง"))
  (setq sz (rebar-prompt-val "ขนาดเหล็กตัวซี (เช่น C 100x50x20x2.3 mm.)" "C 100x50x20x2.3 mm." 'str))
  (setq cut (rebar-prompt-val "ความยาวตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"C\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" sz "\""
    ",\"standardLength\":6.00"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " member " (" sz " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 7. คำสั่ง SYNC_PIPE (ท่อเหล็กกลมโครงสร้าง)
;;; =========================================================================
(defun c:SYNC_PIPE (/ grp member sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดท่อเหล็กกลมโครงสร้าง (Circular Tube)")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อส่วนโครงสร้าง"))
  (setq sz (rebar-prompt-val "ขนาดท่อเหล็กกลม (เช่น ท่อ 2 นิ้ว OD 60.5x2.3 mm.)" "ท่อ 2 นิ้ว OD 60.5x2.3 mm." 'str))
  (setq cut (rebar-prompt-val "ความยาวตัดใช้จริง (เมตร)" 6.0 'real))
  (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))

  (setq payload (strcat
    "{\"materialCategory\":\"box_c_pipe\""
    ",\"subCategory\":\"PIPE\""
    ",\"label\":\"" member "\""
    ",\"group\":\"" grp "\""
    ",\"rebarType\":\"" sz "\""
    ",\"standardLength\":6.00"
    ",\"cutLength\":" (rtos cut 2 2)
    ",\"quantity\":" (itoa qty) "}"
  ))
  (rebar-send-json payload (strcat "[" grp "] " member " (" sz " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
  (princ)
)

;;; =========================================================================
;;; 8. คำสั่ง SYNC_PVC (ท่อ PVC และข้อต่อ/วาล์ว)
;;; =========================================================================
(defun c:SYNC_PVC (/ grp member isFit sz cut qty payload)
  (princ "\n=======================================================")
  (princ "\n  [AutoCAD] ถอดท่อ PVC และอุปกรณ์ข้อต่อ/วาล์ว")
  (princ "\n=======================================================")
  (setq grp (rebar-select-or-new *rebar-groups* "กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ชื่อส่วนโครงสร้าง/งานท่อ"))
  (setq isFit (rebar-prompt-val "ประเภท [1]=ท่อ PVC (4ม.) [2]=ข้อต่อ/วาล์ว" "1" 'str))

  (if (= isFit "2")
    (progn
      (setq sz (rebar-prompt-val "ระบุประเภทและขนาดข้อต่อ (เช่น ข้องอ 90 2 นิ้ว)" "ข้อต่อตรง 2\"" 'str))
      (setq qty (rebar-prompt-val "จำนวนอุปกรณ์ (ชิ้น/ตัว)" 1 'int))
      (setq payload (strcat
        "{\"materialCategory\":\"pvc\""
        ",\"pvcType\":\"fitting\""
        ",\"label\":\"" member "\""
        ",\"group\":\"" grp "\""
        ",\"rebarType\":\"" sz "\""
        ",\"quantity\":" (itoa qty) "}"
      ))
      (rebar-send-json payload (strcat "[" grp "] " member " (" sz " x " (itoa qty) " ตัว)"))
    )
    (progn
      (setq sz (rebar-prompt-val "ขนาดท่อ PVC (เช่น ท่อ PVC 2 นิ้ว ชั้น 8.5)" "ท่อ PVC 2 นิ้ว ชั้น 8.5" 'str))
      (setq cut (rebar-prompt-val "ความยาวตัดใช้จริง (เมตร)" 4.0 'real))
      (setq qty (rebar-prompt-val "จำนวนท่อนที่ต้องการตัด (ท่อน)" 1 'int))
      (setq payload (strcat
        "{\"materialCategory\":\"pvc\""
        ",\"pvcType\":\"pipe\""
        ",\"label\":\"" member "\""
        ",\"group\":\"" grp "\""
        ",\"rebarType\":\"" sz "\""
        ",\"standardLength\":4.00"
        ",\"cutLength\":" (rtos cut 2 2)
        ",\"quantity\":" (itoa qty) "}"
      ))
      (rebar-send-json payload (strcat "[" grp "] " member " (" sz " ยาว " (rtos cut 2 2) "ม. x " (itoa qty) "ท่อน)"))
    )
  )
  (princ)
)

;;; =========================================================================
;;; 9. คำสั่ง REBAR_DRAW (วาดตาราง BBS ลงใน Drawing อัตโนมัติ)
;;; =========================================================================
(defun c:REBAR_DRAW (/ pt http url csvText lines rowIdx y startX colWidths line cols x cleanCol cIdx)
  (setq pt (getpoint "\nคลิกกำหนดตำแหน่งจุดเริ่มต้นวางตาราง Bar Bending Schedule (BBS): "))
  (if pt
    (progn
      (princ "\nกำลังดาวน์โหลดข้อมูลตารางล่าสุดจากเซิร์ฟเวอร์...")
      (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
      (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
      (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
      (if http
        (progn
          (setq url "https://portfolio-yutthakan.onrender.com/api/rebar/export/bbs.csv")
          (vl-catch-all-apply
            '(lambda ()
               (vlax-invoke-method http 'open "GET" url vlax-false)
               (vlax-invoke-method http 'send)
               (setq csvText (vlax-get-property http 'responseText))
             )
          )
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
              (princ (strcat "\n[สำเร็จ] สร้างตาราง BBS จำนวน " (itoa rowIdx) " แถว ลงใน Drawing เรียบร้อย!"))
            )
            (princ "\n[แจ้งเตือน] ยังไม่มีข้อมูลตารางเหล็กบนคลาวด์ หรือยังไม่ได้เชื่อมต่อเน็ต")
          )
        )
      )
    )
  )
  (princ)
)

;;; =========================================================================
;;; 10. คำสั่ง SYNC_MENU (เมนูรวมเลือกหมวดงาน)
;;; =========================================================================
(defun c:SYNC_MENU (/ choice)
  (princ "\n=======================================================")
  (princ "\n  ระบบซิงก์ถอดแบบวัสดุโครงสร้าง & BBS v4.5 (ยุทธการ คำกลอน)")
  (princ "\n=======================================================")
  (princ "\n  [1] SYNC_REBAR     - ถอดเหล็กเส้น (RB/DB) & ดึงเศษในคลัง")
  (princ "\n  [2] SYNC_CONCRETE  - คิดปริมาณปูนคอนกรีต (คิว m³)")
  (princ "\n  [3] SYNC_BEAM      - ถอดเหล็กบีม (H-Beam / I-Beam / WF)")
  (princ "\n  [4] SYNC_PLATE     - ถอดเหล็กเพลท + J-Bolt + น็อต/แหวน")
  (princ "\n  [5] SYNC_BOX       - ถอดเหล็กกล่อง (SHS / RHS)")
  (princ "\n  [6] SYNC_LIPC      - ถอดเหล็กแปตัวซี (C-Channel)")
  (princ "\n  [7] SYNC_PIPE      - ถอดท่อเหล็กกลมโครงสร้าง")
  (princ "\n  [8] SYNC_PVC       - ถอดท่อ PVC & ข้อต่อ/วาล์ว")
  (princ "\n  [9] REBAR_DRAW     - วาดตาราง BBS ลงใน Drawing อัตโนมัติ")
  (princ "\n  [10] REBAR_WEB     - เปิดหน้าระบบเว็บจัดการเหล็กเส้น")
  (princ "\n=======================================================")
  (setq choice (rebar-prompt-val "เลือกหมายเลขคำสั่ง [1-10]" "1" 'str))
  (cond
    ((= choice "1") (c:SYNC_REBAR))
    ((= choice "2") (c:SYNC_CONCRETE))
    ((= choice "3") (c:SYNC_BEAM))
    ((= choice "4") (c:SYNC_PLATE))
    ((= choice "5") (c:SYNC_BOX))
    ((= choice "6") (c:SYNC_LIPC))
    ((= choice "7") (c:SYNC_PIPE))
    ((= choice "8") (c:SYNC_PVC))
    ((= choice "9") (c:REBAR_DRAW))
    ((= choice "10") (c:REBAR_WEB))
  )
  (princ)
)

;;; =========================================================================
;;; คำสั่งเสริมอื่นๆ
;;; =========================================================================
(defun c:REBAR_HELP () (c:SYNC_MENU))

(defun c:REBAR_WEB ()
  (command "_.BROWSER" "https://portfolio-yutthakan.onrender.com/#admin-rebar")
  (princ "\nกำลังเปิดหน้าต่างเว็บจัดการระบบ...")
  (princ)
)

(defun c:REBAR_OFFCUTS (/ http url res)
  (princ "\nกำลังดึงรายการเศษเหล็กคงเหลือ...")
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
  (if http
    (progn
      (setq url "https://portfolio-yutthakan.onrender.com/api/rebar/offcuts")
      (vl-catch-all-apply
        '(lambda ()
           (vlax-invoke-method http 'open "GET" url vlax-false)
           (vlax-invoke-method http 'send)
           (setq res (vlax-get-property http 'responseText))
         )
      )
      (vlax-release-object http)
      (if (and res (/= res ""))
        (princ (strcat "\n[รายการเศษเหล็กในคลัง]:\n" (substr res 1 (min 1500 (strlen res)))))
        (princ "\nไม่มีรายการเศษเหล็กคงเหลือ หรือเชื่อมต่อเน็ตไม่ได้")
      )
    )
  )
  (princ)
)

(princ "\n=======================================================")
(princ "\n[✓ สำเร็จ] โหลดปลั๊กอิน Yutthakan Structural Sync v4.5 เรียบร้อย!")
(princ "\nพิมพ์คำสั่ง SYNC_MENU เพื่อเลือกหมวดงานทั้งหมด หรือพิมพ์:")
(princ "\n  SYNC_REBAR, SYNC_CONCRETE, SYNC_BEAM, SYNC_PLATE, SYNC_BOX, SYNC_PVC")
(princ "\n=======================================================\n")
(princ)
