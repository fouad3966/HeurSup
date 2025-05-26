const express = require('express');
const router = express.Router();
const { creerPeriodeTravail, modifierPeriodeTravail, supprimerPeriodeTravail,getAllPeriodesTravail ,getPeriodesGroupedByEnseignant} = require('../controllers/PeriodeTravailController');
const verifyToken = require('../middleware/auth');

router.post('/periodes-travail', verifyToken, creerPeriodeTravail);
router.put('/periodes-travail/:id', verifyToken, modifierPeriodeTravail);
router.delete('/periodes-travail/:id', verifyToken, supprimerPeriodeTravail);
router.get('/periods/all',verifyToken,getAllPeriodesTravail)
router.get('/periods/byTeacher',verifyToken,getPeriodesGroupedByEnseignant)

module.exports = router;
