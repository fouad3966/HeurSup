const express = require('express');
const router = express.Router();
const { creerPeriodeTravail, modifierPeriodeTravail, supprimerPeriodeTravail,getAllPeriodesTravail ,getPeriodesGroupedByEnseignant, getOpenPeriodeTravail} = require('../controllers/PeriodeTravailController');
const verifyToken = require('../middleware/auth');

router.post('/periodes-travail', verifyToken, creerPeriodeTravail);
router.put('/periodes-travail/:id', verifyToken, modifierPeriodeTravail);
router.delete('/periodes-travail/:id', verifyToken, supprimerPeriodeTravail);
router.get('/periods/all',verifyToken,getAllPeriodesTravail)
router.get('/periods/byTeacher',verifyToken,getPeriodesGroupedByEnseignant)

// Added singular routes for frontend compatibility
router.get('/periode-travail/open', verifyToken, getOpenPeriodeTravail);
router.post('/periode-travail', verifyToken, creerPeriodeTravail);

module.exports = router;
