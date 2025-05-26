const prisma = require("../prisma/prisma");
const ExcelJS = require("exceljs");
const path = require("path");
const { getTeacherSuppHoursInPeriod } = require("./SuppHoursController");

function formatGrade(gradeRaw) {
  switch ((gradeRaw || "").toUpperCase()) {
    case "MCA": return "M.C.A";
    case "MCB": return "M.C.B";
    case "MAA": return "M.A.A";
    case "PROF": return "PROF";
    case "PROFESSEUR": return "Professeur";
    default: return gradeRaw || "";
  }
}

const SHEETS = [
  { name: "Perm Banc", typeCompte: "Bancaire", vacataire: false, startRow: 11 },
  { name: "Permanent CCP", typeCompte: "Postal", vacataire: false, startRow: 10 },
  { name: "Vacataire Banque ", typeCompte: "Bancaire", vacataire: true, startRow: 17 },
  { name: "Vacataire CCP", typeCompte: "Postal", vacataire: true, startRow: 15 }
];


async function exportSuppHoursXLSX(req, res) {
  try {
    const { startDate, endDate } = req.body;
    if (!startDate || !endDate) {
      return res.status(400).json({ message: "startDate and endDate required" });
    }
    console.log(`[Export] For period ${startDate} -> ${endDate}`);

    const templatePath = path.join(__dirname, "../templates/List.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);

    for (const sheetInfo of SHEETS) {
      const worksheet = workbook.getWorksheet(sheetInfo.name);
      if (!worksheet) {
        console.warn(`[Warn] Sheet not found in template: ${sheetInfo.name}`);
        continue;
      }

      // Get teachers for this category
      const teachers = await prisma.enseignant.findMany({
        where: { typeCompte: sheetInfo.typeCompte, vacataire: sheetInfo.vacataire }
      });
      console.log(`[Sheet: ${sheetInfo.name}] Teachers detected: ${teachers.length}`);

let rowPointer = sheetInfo.startRow;

      for (const teacher of teachers) {
        // Get all work periods for the teacher (linked through periodeTravailEnseignant)
        const workPeriods = await prisma.periodeTravailEnseignant.findMany({
          where: { enseignantId: teacher.id },
          include: { periodeTravail: true }
        });

        // For each work period, find the grade that was active during the period
        for (const work of workPeriods) {
          const period = work.periodeTravail;
          if (!period) continue;
          // Ensure the period overlaps with the export interval
          const periodStart = new Date(Math.max(new Date(period.dateDebut).getTime(), new Date(startDate).getTime()));
          const periodEnd = new Date(Math.min(new Date(period.dateFin).getTime(), new Date(endDate).getTime()));
          if (periodEnd < periodStart) continue; // No overlap

          // Find the grade assigned to this teacher for this period
          const gradePeriod = await prisma.enseignantGrade.findFirst({
            where: {
              enseignantId: teacher.id,
              dateDebut: { lte: periodEnd },
              OR: [
                { dateFin: null },
                { dateFin: { gte: periodStart } }
              ]
            },
            include: { grade: true },
            orderBy: { dateDebut: "desc" }
          });

          const grade = formatGrade(gradePeriod?.grade?.nom);
          let prixUnitaire = 0;
          if (grade === "Professeur" || grade === "PROF") prixUnitaire = 960;
          else if (grade === "M.C.A") prixUnitaire = 840;
          else if (grade === "M.C.B") prixUnitaire = 750;
          else if (grade === "M.A.A") prixUnitaire = 750;


          // Get supplementary hours for (teacher, periodStart, periodEnd)
          const reqFake = {
            params: { teacherId: teacher.id.toString() },
            body: {
              startDate: periodStart.toISOString().split('T')[0],
              endDate: periodEnd.toISOString().split('T')[0]
            }
          };
          const resFake = {
            status: () => ({ json: (x) => x }),
            json: (x) => x
          };
          const result = await getTeacherSuppHoursInPeriod(reqFake, resFake);
          let hours = result?.data?.periodTotal || 0;
          if (hours > 0 && hours < 1) hours = 1; // always round up
          else hours = Math.ceil(hours);
          // Print to console what is being written
          console.log({
            n: rowPointer - 10,
            beneficiaire: `${teacher.nom} ${teacher.prenom}`,
            compte: teacher.numeroCompte || "",
            grade,
            prixUnitaire,
            hours,
            periode: `du ${periodStart.toISOString().slice(0, 10)} au ${periodEnd.toISOString().slice(0, 10)}`
          });

          // Fill the Excel row
          const row = worksheet.getRow(rowPointer);
          row.getCell(1).value = rowPointer - 10; // N°
          row.getCell(2).value = `${teacher.nom} ${teacher.prenom}`;
          row.getCell(3).value = teacher.numeroCompte || "";
          row.getCell(4).value = grade;
          row.getCell(5).value = prixUnitaire;
          row.getCell(6).value = hours;
          row.getCell(7).value = { formula: `E${rowPointer}*F${rowPointer}` }; // Montant total
          row.getCell(8).value = 0;
          row.getCell(9).value = { formula: "H" + rowPointer };
          row.getCell(10).value = { formula: "H" + rowPointer };
          row.getCell(11).value = { formula: "H" + rowPointer };
          row.getCell(12).value = `du ${periodStart.toISOString().slice(0, 10)} au ${periodEnd.toISOString().slice(0, 10)}`;
          row.commit();
          rowPointer++;
        }
      }
    }

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=Etat_de_paiement_des_HS.xlsx");
    await workbook.xlsx.write(res);

    res.end();
  } catch (error) {
    console.error("Error exporting XLSX:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
}

async function exportTeacherSuppHoursXLSX(req, res) {
  try {
    const teacherId = req.params.teacherId;
    const { periodStart } = req.body;

    if (!teacherId || !periodStart) {
      return res.status(400).json({ message: "teacherId (param) and periodStart (body) required" });
    }

    // Calculate the 4 months
    const start = new Date(periodStart);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 4);
    end.setDate(end.getDate() - 1);

    // Build months info
    const months = [];
    for (let i = 0; i < 4; i++) {
      const d = new Date(start);
      d.setMonth(d.getMonth() + i);
      const year = d.getFullYear();
      const month = d.getMonth();
      const lastDay = new Date(year, month + 1, 0).getDate();
      months.push({
        year: year,
        month: month,
        label: d.toLocaleString("ar-EG", { month: "long" }),
        startISO: `${year}-${String(month + 1).padStart(2, "0")}-01`,
        endISO: `${year}-${String(month + 1).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`
      });
    }

    // ----------- LOAD THE TEMPLATE ----------
    const templatePath = path.join(__dirname, "../templates/PROF.xlsx");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(templatePath);
    const worksheet = workbook.getWorksheet(1); // or by name if you have named it

    // Name/info at row 11, 12 (use B, C for Arabic-friendly look)
    worksheet.getCell("B11").value = "الإسم:";
    worksheet.getCell("C11").value = "";
    worksheet.getCell("E11").value = "الدرجة:";
    worksheet.getCell("F11").value = "";
    worksheet.getCell("B12").value = "نوع الحساب:";
    worksheet.getCell("C12").value = "";
    worksheet.getCell("E12").value = "رقم الحساب:";
    worksheet.getCell("F12").value = "";

    let rowPointer = 14; // Start table below info

    // Fetch all teacher data (for the entire 4 months)
    const reqFake = {
      params: { teacherId: teacherId.toString() },
      body: {
        startDate: months[0].startISO,
        endDate: months[3].endISO
      }
    };
    const resFake = { status: () => ({ json: (x) => x }), json: (x) => x };
    const dataResult = await getTeacherSuppHoursInPeriod(reqFake, resFake);

    if (!dataResult || !dataResult.data) {
      return res.status(404).json({ message: "No supplementary hour data found for this teacher and period." });
    }
    const info = dataResult.data;

    // Fill teacher info
    worksheet.getCell("C11").value = info.teacherName || "";
    worksheet.getCell("F11").value = info.grade || "";
    worksheet.getCell("C12").value = info.typeCompte || "";
    worksheet.getCell("F12").value = info.numeroCompte || "";

    let grandTotal = 0;

    for (let m = 0; m < 4; m++) {
      // Month title, bold, right-aligned
      worksheet.mergeCells(`D${rowPointer}:F${rowPointer}`);
      worksheet.getCell(`D${rowPointer}`).value = `شهر ${months[m].label}`;
      worksheet.getCell(`D${rowPointer}`).alignment = { horizontal: 'center' };
      worksheet.getCell(`D${rowPointer}`).font = { bold: true, size: 14 };
      rowPointer++;

      // Table headers (Arabic, right to left)
      worksheet.getCell(`D${rowPointer}`).value = "الأسبوع";
      worksheet.getCell(`E${rowPointer}`).value = "الأيام";
      worksheet.getCell(`F${rowPointer}`).value = "عدد الساعات";
      worksheet.getRow(rowPointer).font = { bold: true };
      rowPointer++;

      // Data rows for weeks
      const thisMonthDates = info.sessionsDates.filter(dateStr => {
        const d = new Date(dateStr);
        return d.getFullYear() === months[m].year && d.getMonth() === months[m].month;
      });
      const weeks = groupDatesByWeek_Saturday(thisMonthDates);

      let monthTotal = 0;
      for (let w = 0; w < 6; w++) {
        let weekDates = weeks[w] || [];
        let hours = "0.0";
        let dayNums = "";
        if (weekDates.length) {
          weekDates.sort((a, b) => a - b);
          const weekStart = weekDates[0];
          const weekEnd = weekDates[weekDates.length - 1];
          const reqWeek = {
            params: { teacherId: teacherId.toString() },
            body: {
              startDate: weekStart.toISOString().slice(0, 10),
              endDate: weekEnd.toISOString().slice(0, 10)
            }
          };
          const resWeek = { status: () => ({ json: (x) => x }), json: (x) => x };
          const weekResult = await getTeacherSuppHoursInPeriod(reqWeek, resWeek);
          hours = weekResult?.data?.periodTotal ? Number(weekResult.data.periodTotal).toFixed(1) : "0.0";
          monthTotal += parseFloat(hours);
          dayNums = weekDates.map(d => String(d.getDate()).padStart(2, "0")).join(", ");
        }
        worksheet.getCell(`D${rowPointer}`).value = `الأسبوع ${w + 1}`;
        worksheet.getCell(`E${rowPointer}`).value = `[${dayNums}]`;
        worksheet.getCell(`F${rowPointer}`).value = hours;

        // Add borders to the table row (all cells)
        for (const col of ["D", "E", "F"]) {
          worksheet.getCell(`${col}${rowPointer}`).border = {
            top: { style: "thin" },
            left: { style: "thin" },
            bottom: { style: "thin" },
            right: { style: "thin" }
          };
        }
        rowPointer++;
      }

      // Monthly total row
      worksheet.getCell(`D${rowPointer}`).value = "المجموع:";
      worksheet.getCell(`F${rowPointer}`).value = monthTotal === 0 ? "" : monthTotal + " ساعة";
      worksheet.getCell(`D${rowPointer}`).font = { bold: true };
      worksheet.getCell(`F${rowPointer}`).font = { bold: true };

      // Add borders to the total row
      for (const col of ["D", "E", "F"]) {
        worksheet.getCell(`${col}${rowPointer}`).border = {
          top: { style: "medium" },
          left: { style: "thin" },
          bottom: { style: "medium" },
          right: { style: "thin" }
        };
      }
      grandTotal += monthTotal;
      rowPointer += 2; // space before next month
    }

    // Grand total at the end
    worksheet.getCell(`D${rowPointer}`).value = "المجموع الكلي:";
    worksheet.getCell(`F${rowPointer}`).value = grandTotal === 0 ? "" : grandTotal.toFixed(1) + " ساعة";
    worksheet.getCell(`D${rowPointer}`).font = { bold: true, size: 12 };
    worksheet.getCell(`F${rowPointer}`).font = { bold: true, size: 12 };

    // Style columns
    worksheet.columns = [
      { key: "A", width: 2 },
      { key: "B", width: 16 },
      { key: "C", width: 28 },
      { key: "D", width: 16 },
      { key: "E", width: 36 },
      { key: "F", width: 14 },
    ];

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", "attachment; filename=teacher_supp_hours_arabic.xlsx");
    await workbook.xlsx.write(res);
    res.end();

  } catch (error) {
    console.error("Export error:", error);
    res.status(500).json({ message: "Export failed", error: error.message });
  }
}







function groupDatesByWeek_Saturday(dates) {
  // dates: array of ISO strings
  dates.sort();
  const result = {};
  for (const dateStr of dates) {
    const d = new Date(dateStr);
    // Find previous Saturday
    const day = d.getDay(); // 0=Sunday, 6=Saturday
    const sat = new Date(d);
    sat.setDate(d.getDate() - ((day + 1) % 7));
    const satKey = sat.toISOString().slice(0, 10);
    if (!result[satKey]) result[satKey] = [];
    result[satKey].push(d);
  }
  // Convert to array of weeks (sorted by Saturday)
  return Object.entries(result)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([sat, arr]) => arr);
}



module.exports = { exportSuppHoursXLSX ,exportTeacherSuppHoursXLSX };
