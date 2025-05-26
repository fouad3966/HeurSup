const express = require('express');
const router = express.Router();
const { creerEnseignantGrade, mettreAJourEnseignantGrade, supprimerEnseignantGrade, obtenirTousLesEnseignantGrades } = require('../controllers/EnseignantGradeController');
const verifyToken = require('../middleware/auth');

router.post('/enseignant-grades', verifyToken, creerEnseignantGrade);
router.get('/enseignant-grades', verifyToken, obtenirTousLesEnseignantGrades);
router.put('/enseignant-grades/:id', verifyToken, mettreAJourEnseignantGrade);
router.delete('/enseignant-grades/:id', verifyToken, supprimerEnseignantGrade);

module.exports = router;
