const express = require('express');
const router = express.Router();
const { creerAbsence, mettreAJourAbsence, supprimerAbsence, getAbsencesByTeacher,countAbsences,getAbsencesByTeacherGroupedByPeriod} = require('../controllers/AbsenceController');
const verifyToken = require('../middleware/auth');

router.post('/absences', verifyToken, creerAbsence);
router.put('/absences/:id', verifyToken, mettreAJourAbsence);
router.delete('/absences/:id', verifyToken, supprimerAbsence);
router.get('/teacher/:id/absences',verifyToken,getAbsencesByTeacher)
router.get('/absences/count',verifyToken,countAbsences)
router.get('/teacher/:teacherId/absences/grouped',verifyToken,getAbsencesByTeacherGroupedByPeriod)

module.exports = router;
