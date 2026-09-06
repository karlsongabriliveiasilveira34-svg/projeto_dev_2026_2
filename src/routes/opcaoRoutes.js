const express = require('express');
const router = express.Router();
const opcaoController = require('../controllers/opcaoController');

// Lista opcoes ativas publicamente para o formulario de agendamento
router.get('/', opcaoController.listPublic);

module.exports = router;
