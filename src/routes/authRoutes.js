const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { loginLimiter } = require('../utils/rateLimiter');

// Login de administrador protegido por Rate Limiting
router.post('/login', loginLimiter, authController.login);

// Logout e encerramento de sessao
router.post('/logout', authController.logout);

// Verificacao do status da sessao
router.get('/me', authController.getSessionUser);

module.exports = router;
