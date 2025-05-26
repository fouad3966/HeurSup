const express = require('express');
const router = express.Router();
const { createSession, getAllSessions, getSessionById, updateSession, deleteSession, getSessionByTeacherID, } = require('../controllers/SessionController.js');
const verifyToken = require('../middleware/auth');

router.post('/sessions', verifyToken, createSession);
router.get('/sessions', verifyToken, getAllSessions);
router.get('/sessions/:id', verifyToken, getSessionById);
router.put('/sessions/:id', verifyToken, updateSession);
router.delete('/sessions/:id', verifyToken, deleteSession);
router.get('/sessions/teacher/:teacherId', verifyToken, getSessionByTeacherID);


module.exports = router;
