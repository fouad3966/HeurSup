const express = require('express');
const router = express.Router();
const { creerJourFerie, supprimerJourFerie, obtenirTousLesJoursFeries } = require('../controllers/JourFerieController');
const verifyToken = require('../middleware/auth');

router.post('/jours-feries', verifyToken, creerJourFerie);
router.get('/jours-feries', verifyToken, obtenirTousLesJoursFeries);
router.delete('/jours-feries/:id', verifyToken, supprimerJourFerie);

module.exports = router;
