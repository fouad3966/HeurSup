const express = require("express");
const router = express.Router();
const SuppHoursController = require("../controllers/SuppHoursController");
const { exportSuppHoursXLSX,exportTeacherSuppHoursXLSX } = require("../controllers/ExportController");
const verifyToken = require('../middleware/auth');

// POST for exporting XLSX (pass period in body)
router.post("/suppHours/export-xlsx", exportSuppHoursXLSX);

// Get supplementary hour sessions for a teacher
router.get("/calculate/:teacherId", SuppHoursController.getSupplementaryHourSessions);
router.get("/suppHours/:teacherId", SuppHoursController.getTeacherSuppHours);
router.post("/suppHoursCalculate/:teacherId", SuppHoursController.getTeacherSuppHoursInPeriod); // Changed to POST since it uses req.body
router.get("/suppHours/:teacherId/byPeriod", verifyToken, SuppHoursController.getTeacherSuppHoursByPeriod);
router.get("/suppHours/:teacherId/weeklyByMonth", verifyToken, SuppHoursController.getTeacherWeeklyHoursByMonth); // Unique path for weekly hours
router.post('/export/teacher-xlsx/:teacherId', exportTeacherSuppHoursXLSX);
module.exports = router;