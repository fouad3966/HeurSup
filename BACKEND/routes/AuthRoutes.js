const express = require('express');
const router = express.Router();
const { register, login,getAdmin } = require('../controllers/AuthController');
const verifyToken = require('../middleware/auth');

router.post('/admin/register', register);
router.post('/admin/login', login);
router.get('/admin/:id',verifyToken, getAdmin);

module.exports = router;
