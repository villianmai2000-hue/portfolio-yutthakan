;;; =========================================================================
;;; AutoLISP: Yutthakan Rebar Cut List & BBS Real-Time Sync for AutoCAD v2.5
;;; สถาปนิกและผู้เชี่ยวชาญ: ยุทธการ คำกลอน
;;; ออกแบบรองรับ Dynamic Input, Prompt Selection, และ Auto-Sync Real-Time
;;; =========================================================================
(vl-load-com)

;;; ฟังก์ชันช่วยแยกข้อความ (String Split) ป้องกันข้อผิดพลาดใน AutoCAD
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
  (princ "\nคำสั่งปลั๊กอินถอดเหล็กเส้นและคลังเศษ (BBS System v2.5):")
  (princ "\n  REBAR_SYNC     - ส่งข้อมูลตัดเหล็กจาก CAD ขึ้นเว็บ Real-Time (6 ขั้นตอน)")
  (princ "\n  REBAR_DRAW     - วาดตาราง BBS สวยงามลงใน Drawing อัตโนมัติ")
  (princ "\n  REBAR_OFFCUTS  - ตรวจสอบรายการเศษเหล็กคงเหลือสะสมใน CAD")
  (princ "\n  REBAR_WEB      - เปิดหน้าเว็บจัดการเหล็กเส้นบน Web Browser")
  (princ "\n=======================================================\n")
  (princ)
)

;;; เปิดหน้าต่างเว็บ
(defun c:REBAR_WEB ()
  (command "_.BROWSER" "https://portfolio-yutthakan.onrender.com/#admin")
  (princ "\nกำลังเปิดหน้าต่างจัดการเหล็กเส้นบนเว็บ...")
  (princ)
)

;;; ตัวแปรหน่วยความจำเซสชัน: กลุ่มและชื่อโครงสร้างที่เคยใช้ใน Drawing นี้
(if (null *rebar-groups*)  (setq *rebar-groups*  (list "ฐานรากทั่วไป" "งานเสา" "งานคาน" "งานพื้น" "งานผนัง")))
(if (null *rebar-members*) (setq *rebar-members* (list "เสา C1" "เสา C2" "คาน B1" "คาน B2" "ฐานราก F1" "พื้น S1")))

;;; --- ฟังก์ชันเลือกจากรายการหรือพิมพ์ใหม่ (รองรับ Dynamic Input คลิกลูกศรลงได้ 100%) ---
(defun rebar-pick-or-new (lst prompt-title / i kwStr promptStr ans chosen new-val)
  (princ "\n----------------------------------------")
  (princ (strcat "\n--- " prompt-title " ---"))
  (setq i 1)
  (setq kwStr "0 O New")
  (foreach item lst
    (princ (strcat "\n  [" (itoa i) "] " item))
    (setq kwStr (strcat kwStr " " (itoa i)))
    (setq i (1+ i))
  )
  (princ "\n  [0] พิมพ์ชื่อใหม่ (กด [0] หรือ [O])")
  (princ "\n----------------------------------------")

  ;; ตั้งค่า Keyword ให้ Dynamic Input สามารถกดคลิกลูกศรลง (Down Arrow) เลือกได้
  (initget kwStr)
  (setq promptStr (strcat "\nเลือก [1-" (itoa (length lst)) " หรือ 0=พิมพ์ใหม่] <1>: "))
  (setq ans (getkword promptStr))

  ;; ถ้ากด Enter ให้เลือกรายการแรกเป็นค่าเริ่มต้น
  (if (null ans) (setq ans "1"))

  (if (or (= ans "0") (= (strcase ans) "O") (= (strcase ans) "NEW"))
    (progn
      (setq new-val "")
      ;; วนลูปถามจนกว่าผู้ใช้จะพิมพ์ข้อความจริง ป้องกันปัญหากด Enter แล้วข้อความหาย
      (while (= new-val "")
        (setq new-val (getstring T (strcat "\nพิมพ์" prompt-title "ใหม่: ")))
        (setq new-val (vl-string-trim " \t\r\n" new-val))
        (if (= new-val "")
          (princ "\n[!] กรุณาพิมพ์ชื่อ (ห้ามเว้นว่าง): ")
        )
      )
      (setq chosen new-val)
    )
    (progn
      (setq chosen (nth (1- (atoi ans)) lst))
    )
  )
  chosen
)

;;; =========================================================================
;;; คำสั่งหลัก REBAR_SYNC: ถอดเหล็กเส้น 6 ขั้นตอนตามลำดับเดิม ซิงก์ขึ้นเว็บ Real-Time
;;; =========================================================================
(defun c:REBAR_SYNC (/ olderr grp member barIdx bartype stdIdx stdlen cut qty useOffcut offcutId http payload url res err)
  (setq olderr *error*)
  (defun *error* (msg)
    (if (and msg (/= msg "Function cancelled") (/= msg "quit / exit abort"))
      (princ (strcat "\n[แจ้งเตือนระบบ]: " msg))
    )
    (princ "\n[ยกเลิกคำสั่ง REBAR_SYNC เรียบร้อย]")
    (setq *error* olderr)
    (princ)
  )

  (princ "\n=======================================================")
  (princ "\n  ระบบบันทึกถอดเหล็กเส้น (BBS) v2.5 - ยุทธการ คำกลอน")
  (princ "\n=======================================================")

  ;;; ขั้น 1: เลือกกลุ่ม/หมวดงาน หรือพิมพ์ชื่อใหม่
  (setq grp (rebar-pick-or-new *rebar-groups* "กลุ่ม/หมวดงาน (เช่น ฐานรากF1, เสาC1)"))
  (if (not (member grp *rebar-groups*))
    (setq *rebar-groups* (append *rebar-groups* (list grp)))
  )
  (princ (strcat "\n[✓] กลุ่ม/หมวดงาน: " grp))

  ;;; ขั้น 2: ระบุชื่อส่วนโครงสร้าง หรือพิมพ์ชื่อใหม่
  (setq member (rebar-pick-or-new *rebar-members* "ชื่อส่วนโครงสร้าง (เช่น เสาC1, คานB1, ฐานรากF1)"))
  (if (not (member member *rebar-members*))
    (setq *rebar-members* (append *rebar-members* (list member)))
  )
  (princ (strcat "\n[✓] ชิ้นส่วนโครงสร้าง: " member))

  ;;; ขั้น 3: เลือกขนาดเหล็ก (มอก.24-2559 + เหล็กบีม มอก.1227-2558 หรือคลังเศษ)
  (princ "\n-------------------------------------------------------")
  (princ "\n--- ขั้นที่ 3: เลือกขนาดเหล็ก (มอก. + เหล็กบีม) ---")
  (princ "\n  เหล็กกลมผิวเรียบ (RB):  [1]=RB6   [2]=RB9   [3]=RB10  [4]=RB12")
  (princ "\n  เหล็กข้ออ้อย (DB):      [5]=DB10  [6]=DB12  [7]=DB16  [8]=DB20  [9]=DB25  [10]=DB28  [11]=DB32  [12]=DB40")
  (princ "\n  เหล็กบีม H-Beam มอก.:   [13]=H-100x50 [14]=H-100x100 [15]=H-125x125 [16]=H-150x75 [17]=H-150x150 [18]=H-200x100 [19]=H-200x200 [20]=H-250x250 [21]=H-300x300")
  (princ "\n  คลังเศษเหล็กสะสม:       [99]=เลือกดึงเศษในระบบมาใช้")
  (princ "\n-------------------------------------------------------")

  (initget "1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 99 RB6 RB9 RB10 RB12 DB10 DB12 DB16 DB20 DB25 DB28 DB32 DB40")
  (setq barIdx (getkword "\nเลือกขนาดเหล็ก [1-21 หรือ 99=ดึงเศษ] <8=DB20>: "))
  (if (null barIdx) (setq barIdx "8"))

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
      (princ "\n-------------------------------------------------------")
      (princ "\n--- ขั้นที่ 4: ความยาวเหล็กมาตรฐานที่เลือกมาตัด ---")
      (princ "\n  [1] 6.0 เมตร   [2] 10.0 เมตร   [3] 12.0 เมตร   [0] กำหนดความยาวเอง")
      (princ "\n-------------------------------------------------------")
      (initget "1 2 3 0 6 10 12")
      (setq stdIdx (getkword "\nเลือกความยาวมาตรฐาน [1=6m/2=10m/3=12m/0=กำหนดเอง] <3>: "))
      (if (null stdIdx) (setq stdIdx "3"))
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
  (princ "\n-------------------------------------------------------")
  (princ "\n--- ขั้นที่ 5: ความยาวที่ตัดใช้งานจริง ---")
  (initget 4)
  (setq cut (getdist "\nระบุความยาวตัดใช้งานจริง (ม.) หรือคลิกวัด 2 จุดในแบบ <6.0>: "))
  (if (or (null cut) (<= cut 0)) (setq cut 6.0))
  (princ (strcat "\n[✓] ความยาวตัดใช้งานจริง: " (rtos cut 2 2) " ม."))

  ;;; ขั้น 6: ระบุจำนวนท่อนที่ต้องการตัด
  (princ "\n-------------------------------------------------------")
  (princ "\n--- ขั้นที่ 6: จำนวนท่อนที่ต้องการตัด ---")
  (initget 6)
  (setq qty (getint "\nระบุจำนวนท่อนที่ต้องการตัด (ท่อน) <1>: "))
  (if (or (null qty) (<= qty 0)) (setq qty 1))
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
      (setq url "https://portfolio-yutthakan.onrender.com/api/rebar")
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

(princ "\n[สำเร็จ] โหลดปลั๊กอิน Yutthakan Rebar Sync v2.5 เรียบร้อย! พิมพ์ REBAR_SYNC เพื่อเริ่มใช้งาน หรือพิมพ์ REBAR_HELP เพื่อดูคำสั่ง")
(princ)
