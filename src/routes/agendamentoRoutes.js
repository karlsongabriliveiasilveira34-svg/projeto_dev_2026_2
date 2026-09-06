const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const { bookingLimiter } = require('../utils/rateLimiter');

// Envio publico de solicitacao de agendamento VIP com rate limiting
router.post('/', bookingLimiter, agendamentoController.create);

module.exports = router;
