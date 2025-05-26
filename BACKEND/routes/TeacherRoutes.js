const express = require('express');
const router = express.Router();
const { creerEnseignant, mettreAJourEnseignant, supprimerEnseignant, obtenirTousLesEnseignants,listerEnseignantsParGrade,getEnseignantsParPeriode } = require('../controllers/TeacherController');
const verifyToken = require('../middleware/auth');
const upload = require('../middleware/multer');


router.post('/teachers/', verifyToken,upload.single('image'), creerEnseignant);
router.get('/teachers/', verifyToken, obtenirTousLesEnseignants);
router.get('/teachers/byGrade',verifyToken,listerEnseignantsParGrade)
router.put('/teachers/:id', verifyToken, upload.single('image'),mettreAJourEnseignant);
router.delete('/teachers/:id', verifyToken, supprimerEnseignant);
router.get('/teachers/byPeriod',verifyToken,getEnseignantsParPeriode)

module.exports = router;
