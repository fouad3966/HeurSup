const express = require('express');
const router = express.Router();
const { creerPeriodeTravailEnseignant, supprimerPeriodeTravailEnseignant, obtenirToutesLesPeriodesTravailEnseignant } = require('../controllers/PeriodeTravailEnseignantController');
const verifyToken = require('../middleware/auth');

router.post('/periode-travail-enseignants', verifyToken, creerPeriodeTravailEnseignant);
router.get('/periode-travail-enseignants', verifyToken, obtenirToutesLesPeriodesTravailEnseignant);
router.delete('/periode-travail-enseignants/:id', verifyToken, supprimerPeriodeTravailEnseignant);

module.exports = router;
