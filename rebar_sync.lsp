;;; =========================================================================
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
(setq *rebar-groups*  (list "เหล็กเสริมเสา" "F1-C1 NO.1" "งานเสา" "งานคาน" "ฐานรากทั่วไป" "โครงหลังคา"))
(setq *rebar-members* (list "เสา C1" "เสา C2" "คาน B1" "คาน B2" "ฐานราก F1" "เพลท P1" "แป C1"))

;;; ดึงข้อมูลหมวดและชิ้นส่วนล่าสุดจากระบบ
(defun rebar-fetch-latest-metadata (/ http url res raw items spl i itm g m)
  (setq http (vlax-create-object "MSXML2.ServerXMLHTTP.6.0"))
  (if (null http) (setq http (vlax-create-object "MSXML2.XMLHTTP")))
  (if (null http) (setq http (vlax-create-object "WinHttp.WinHttpRequest.5.1")))
  (if http
    (progn
      (setq url "https://portfolio-yutthakan.onrender.com/api/rebar")
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
      (setq url "https://portfolio-yutthakan.onrender.com/api/rebar")
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
      (setq stdIdx (getstring T "\nความยาวมาตรฐานเหล็กเส้นที่ขาย [1]=10.0m, [2]=12.0m <2>: "))
      (cond
        ((= stdIdx "1") (setq stdlen 10.0))
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
;;; คำสั่ง SYNC_CONCRETE (คิดปริมาณปูนคอนกรีต คิว m³)
;;; =========================================================================
(defun c:SYNC_CONCRETE (/ grp member strIdx strength w l d qty waste netVol totVol payload)
  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกคิดปริมาณปูนคอนกรีต (m³) - ยุทธการ คำกลอน")
  (princ "\n=======================================================")
  (rebar-fetch-latest-metadata)
  (setq grp (rebar-select-or-new *rebar-groups* "ขั้นที่ 1: กลุ่ม / หมวดงาน"))
  (setq member (rebar-select-or-new *rebar-members* "ขั้นที่ 2: ชื่อส่วนโครงสร้าง"))

  (princ "\n--- ขั้นที่ 3: เลือกกำลังอัดคอนกรีต (Compressive Strength) ---")
  (princ "\n  [1]=240 ksc (มาตรฐานทั่วไป)")
  (princ "\n  [2]=280 ksc (เสา คาน อาคาร)")
  (princ "\n  [3]=300 ksc (ช่วงยาว ไร้คาน)")
  (princ "\n  [4]=350 ksc (ถนน โรงงาน)")
  (princ "\n  [5]=400 ksc (กำลังอัดสูง)")
  (setq strIdx (getstring T "\nเลือกกำลังอัด [1-5] หรือพิมพ์เอง <1>: "))
  (setq strIdx (vl-string-trim " \t\r\n" strIdx))
  (cond
    ((or (= strIdx "") (= strIdx "1")) (setq strength "240 ksc"))
    ((= strIdx "2") (setq strength "280 ksc"))
    ((= strIdx "3") (setq strength "300 ksc"))
    ((= strIdx "4") (setq strength "350 ksc"))
    ((= strIdx "5") (setq strength "400 ksc"))
    (t (setq strength strIdx))
  )

  (setq w (getreal "\nความกว้างของชิ้นส่วน (เมตร) <0.50>: "))
  (if (null w) (setq w 0.50))

  (setq l (getreal "\nความยาวของชิ้นส่วน (เมตร) <4.00>: "))
  (if (null l) (setq l 4.00))

  (setq d (getreal "\nความลึก/หนา/สูงของชิ้นส่วน (เมตร) <0.50>: "))
  (if (null d) (setq d 0.50))

  (setq qty (getint "\nจำนวนชิ้นส่วน (จุด / ฐาน / ต้น) <1>: "))
  (if (null qty) (setq qty 1))

  (setq waste (getreal "\nเปอร์เซ็นต์เผื่อเท Slump Loss (%) <5.0>: "))
  (if (null waste) (setq waste 5.0))

  (setq netVol (* w l d qty))
  (setq totVol (+ netVol (* netVol (/ waste 100.0))))

  (princ (strcat "\n[ผลคำนวณ]: ปริมาตรสุทธิ " (rtos netVol 2 3) " คิว | เผื่อเท " (rtos waste 2 1) "% | รวมสั่ง: " (rtos totVol 2 3) " คิว"))

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

  (rebar-send-json payload (strcat "[" grp "] " member " (" strength " ปริมาตร " (rtos totVol 2 2) " คิว)"))
  (princ)
)


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
  (command "_.BROWSER" "https://portfolio-yutthakan.onrender.com/#admin-rebar")
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
      (setq url "https://portfolio-yutthakan.onrender.com/api/rebar/offcuts")
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
          (setq url "https://portfolio-yutthakan.onrender.com/api/rebar/export/bbs.csv")
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
