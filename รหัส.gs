/** WebApp - ระบบรับสมัครนักเรียน Version3.1-2022 (สร้างไฟล์ PDF)
 * พัฒนาโดย นายจิรศักดิ์ จิรสาโรช E-mail: niddeaw.n@gmail.com Tel : 0806393969
 * สร้างเมื่อ 23 พฤศจิกายน 2564
 * อัพเดท
 * - 16 มกราคม 2565 : สร้างไฟล์ PDF
 * - 13 มกราคม 2565 : อัพเดทโค้ด เซ็ตชื่อไฟล์รูปภาพ เพิ่ม Loading Overlay
 * - 8 มกราคม 2565 : ลบข้อมูลซ้ำ แก้ไข error ต่างๆ และการบันทึกค่า input radio

 */
var sheetID = '1lS0qq7ckfvM3KXgGPD5J9zLVx7mwbJCV5P7EyZiJbC8';// ID ของชีต
var sheetName = "data";// ชื่อชีต
var SCRIPT_PROP = PropertiesService.getScriptProperties();

function setup() {
  var doc = SpreadsheetApp.getActiveSpreadsheet();
  SCRIPT_PROP.setProperty(sheetID, doc.getId())
}

/** เรียกหน้าเพจ HTML */
function doGet(e) {
  Logger.log(Utilities.jsonStringify(e));
  if (!e.parameter.page) {
    return HtmlService.createTemplateFromFile('index').evaluate()
      .setTitle('ระบบรับสมัครนักเรียน')
      .addMetaTag('viewport', 'width=device-width , initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
  }
  return HtmlService.createTemplateFromFile(e.parameter['page']).evaluate()
    .setTitle('ระบบรับสมัครนักเรียน')
    .addMetaTag('viewport', 'width=device-width , initial-scale=1')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
}

/** เรียก URL */
function getUrl() {
  var url = ScriptApp.getService().getUrl();
  return url;
}

/** ดึงไฟล์ */
function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

/** บันทึกข้อมูลลงชีต */
function uploadFile(files, service, reg_type, prefix, name, lastname, birthday, idcard, race, nationality, religion, house_no, village_no, village, road, alley, district, amphoe, province, zipcode, student_phone, school, district1, amphoe1, province1, zipcode1, gpa, school_type, disability, father, father_occupation, father_phone, mother, mother_occupation, mother_phone, parent, parent_occupation, parent_phone, relationship) {
  try {
    var folder = DriveApp.getFolderById('1yf-dPIdIrfNIOz7GbmXQJ4VwyfBF3u8d'); // ID โฟลเดอร์เก็บไฟล์ภาพที่อัพโหลด
    let images = [];
    Object.keys(files).forEach((key) => {
      let file = files[key];
      let data = file.dataURL;
      let filename = file.name;
      contentType = data.substring(5, data.indexOf(";"));
      bytes = Utilities.base64Decode(data.substr(data.indexOf("base64,") + 7));
      (blob = Utilities.newBlob(bytes, contentType, filename)), (file = folder.createFile(blob)), Logger.log(contentType);
      let fileId = file.getId();
      file.setName(prefix + name + " " + lastname) // เซ็ตชื่อไฟล์ภาพตามที่กำหนดเอง
      images.push("https://drive.google.com/uc?id=" + fileId);
    });

    var lock = LockService.getPublicLock();
    lock.waitLock(30000);

    var doc = SpreadsheetApp.openById(sheetID); // ID Sheet
    var sheet = doc.getSheetByName(sheetName); // ชื่อ Sheet

    sheet.appendRow([new Date(), service, reg_type, prefix, name, lastname, birthday, idcard, race, nationality, religion, house_no, village_no, village, road, alley, district, amphoe, province, zipcode, "'" + student_phone, school, district1, amphoe1, province1, zipcode1, gpa, school_type, disability, father, father_occupation, "'" + father_phone, mother, mother_occupation, "'" + mother_phone, parent, parent_occupation, "'" + parent_phone, relationship, ...images]);

    deleteRow();
    runPDF();
    return "success";

  } catch (f) {
    return f.toString();
  } finally {
    lock.releaseLock();
  }
}

/** ส่วนของการกำหนดค่า ลบข้อมูลซ้ำ, PDF */
var ss = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0]
var slideID = '1Hvi22855wugxNDK7XZMcEHOee1riGejb-dc5TvzJLBU' // ID สไลด์
var pdfFolder = DriveApp.getFolderById('1ivf6cVupGn36cjNK_wyHcHtvrcB82r6d') // ID โฟลเดอร์ PDF

/** ฟังก์ชั่นลบข้อมูลซ้ำ */
function deleteRow() {
  var name = ss.getRange(ss.getLastRow(), 8).getValue() // คอลัมภ์ที่ต้องการตรวจสอบค่าซ้ำ
  var lastRow = ss.getLastRow()
  var i = 2
  var nameChk = ss.getRange(2, 8).getValue()
  while (name !== nameChk) {
    i++
    var nameChk = ss.getRange(i, 8).getValue()
  }
  if (i < lastRow) {
    ss.deleteRow(i)
  }
}

/** ฟังก์ชั่นสร้างไฟล์ PDF */
function runPDF() {
  var data = ss.getRange(ss.getLastRow(), 1, 1, ss.getLastColumn()).getDisplayValues()[0]
  let copyFile = DriveApp.getFileById(slideID).makeCopy(), // คัดลอกไฟล์สำเนาจากสไลด์
    copyID = copyFile.getId(), // คัดลอกไอดี
    copyDoc = SlidesApp.openById(copyID) // ไฟล์ก๊อปปี้

  let headerRow = ss.getRange(1, 1, 1, ss.getLastColumn()).getValues(), // ส่วนเฮดเดอร์ของแถว
    item = ss.getRange(ss.getLastRow(), 1, 1, ss.getLastColumn()).getDisplayValues(), // ข้อมูลแถวล่าสุด
    columnIndex = 0 // Index คอลัมภ์เริ่มต้น
  // Logger.log(headerRow)

  // ส่วนแทนที่ใน PDF ให้แสดงวันเดือนปี ภาษาไทย
  var date = data[6].split("/")
  // Logger.log(date)
  var birthday = Number(date[0]) // วันเกิดรูปแบบตัวเลข
  var mounthText = ["", "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม"]
  var mounthThai = mounthText[Number(date[1])]
  var yearThai = Number(date[2])
  var dateThai = data[6] = birthday + " " + mounthThai + " พ.ศ." + yearThai
  Logger.log(dateThai)

  // ส่วนแทนที่ข้อความทั้งหมด
  for (; columnIndex < headerRow[0].length; columnIndex++) {
    if (columnIndex == 6) {
      copyDoc.replaceAllText('{' + headerRow[0][columnIndex] + '}', birthday + " " + mounthThai + " พ.ศ." + yearThai)
    } else {
      copyDoc.replaceAllText('{' + headerRow[0][columnIndex] + '}', item[0][columnIndex]) // แทนที่ส่วนที่เป็นข้อความทั้งหมด
    }
  }

  // กำหนดตัวแปรอเรย์รูปภาพ Split เพื่อแยกเอาไอดีภาพ
  var dataImage0 = data[39].split("=") // ข้อมูลรูปภาพ Index ที่...
  var image0 = DriveApp.getFileById(dataImage0[1]) // รูปภาพ
  var img0 = copyDoc.getSlides()[0].getImages()[1] // ลำดับของรูปภาพ Index ที่...
  // Logger.log(img0)

  img0.replace(image0, false) // แทนที่รูปภาพจากสำเนา

  copyDoc.saveAndClose() // บันทึกและปิดไฟล์ก๊อปปี้

  // ส่วนการสร้างไฟล์ PDF
  var newFile = pdfFolder.createFile(copyFile.getAs(MimeType.PDF)) // สร้างไฟล์ใหม่เป็น PDF
  var pdfName = newFile.setName(item[0][1] + ' - ' + item[0][2] + '_' + item[0][3] + item[0][4] + ' ' + item[0][5]) // ตั้งชื่อไฟล์ใหม่
  var pdfView = newFile.getUrl() // สร้างลิงค์ PDF แบบวิว

  // ส่วนการแทรกข้อมูลลงในชีต
  ss.getRange(ss.getLastRow(), ss.getLastColumn()).setValue(pdfView) // เซ็ตลิงค์ไฟล์ PDF ลงในคอลัมภ์ที่...

  copyFile.setTrashed(true) // ลบไฟล์สำเนาลงถังขยะ
}


/** ค้นหาข้อมูล */
function getCode(code) {
  var ss = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  var data = ss.getRange(1, 1, ss.getLastRow(), ss.getLastColumn()).getDisplayValues(); // ให้แสดงค่าข้อมูลตามที่ Display

  var stdCodesList = data.map(function (r) {
    return r[7];
  }); // Index คอลัมภ์ที่จะค้นหา *อย่าลืมกำหนดรูปแบบทั้งคอลัมภ์ให้เป็นข้อความ
  var stdList = data.map(function (r) {
    return [`
<table class="table table-striped table-hover">
  <thead class="thead-dark">
        <tr>
        <th class="card-panel light-blue lighten-1" scope="col" colspan="4"><h4 class="prompt white-text"><center>ข้อมูลของนักเรียน</center></h4></th>
        </tr>
        </thead>
</tr>
<tr>
        <td><b>ชื่อ - นามสกุล</b></td>
        <td>${r[3]}${r[4]} ${r[5]}</td>
<td style="width: 50%; text-align: center; height: 100px;" rowspan="5" colspan="2"><img src=${r[39]} height="180" width="150"></td>
</tr>
        <tr>
        <td><b>เลขบัตรประชาชน</b></td>
        <td>${r[7]}</td>
        </tr>
        <tr>
        <td><b>เกิดวันที่</b></td>
        <td>${r[6]}</td>
        </tr>
        <tr>
        <td><b>เขตพื้นที่บริการ</b></td>
        <td>${r[1]}</td>
        </tr>   
        <tr>
        <td><b>เข้าเรียนระดับ</b></td>
        <td>${r[2]}</td>
        </tr>   
<td><b>ความพิการ</b></td>
<td>${r[28]}</td>
<td><b>ชื่อ-สกุล บิดา</b></td>
<td>${r[29]}</td>
</tr>

<td><b>โรงเรียนเดิม</b></td>
<td>${r[21]}</td>
<td><b>เบอร์โทรบิดา</b></td>
<td>${r[31]}</td>
</tr>

<td><b>ตำบล</b></td>
<td>${r[22]}</td>
<td><b>ชื่อ-สกุล มารดา</b></td>
<td>${r[32]}</td>
</tr>

<td><b>อำเภอ</b></td>
<td>${r[23]}</td>
<td><b>เบอร์โทรมารดา</b></td>
<td>${r[34]}</b</td>
</tr>

<td><b>จังหวัด</b></td>
<td>${r[24]}</td>
<td><b>ชื่อ-สกุล ผู้ปกครอง</b></td>
<td>${r[35]}</td>
</tr>

<td><b>โทรศัพท์มือถือที่สามารถติดต่อได้</b></td>
<td>${r[20]}</td>
<td><b>เบอร์โทรผู้ปกครอง</b></td>
<td>${r[37]}</td>
</tr>

<td><b>เลขที่ใบสมัคร</b></td>
<td>${r[41]}</td>
<td><b>ดาวน์โหลดใบสมัคร</b></td>
<td><a href='${r[40]}' target='_blank'><img src='https://drive.google.com/uc?id=1A4tDXusjwPeZDGJiOxW9rBdQneFlcS1R'width='150'></a></td>
</tr>

</tbody>
</table>          
        `];

  });
  var position = stdCodesList.indexOf(code);
  if (position > -1) {
    return stdList[position];
  } else {
    return "*ไม่พบข้อมูล";
  }
}

