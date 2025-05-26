const express = require('express');
const router = express.Router();
const { creerGrade, modifierGrade, supprimerGrade } = require('../controllers/GradeController');
const verifyToken = require('../middleware/auth');

router.post('/grades', verifyToken, creerGrade);
router.put('/grades/:id', verifyToken, modifierGrade);
router.delete('/grades/:id', verifyToken, supprimerGrade);

module.exports = router;
