const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const { requireApiAuth } = require('../middleware/auth');

// Todas as rotas administrativas exigem sessao autenticada
router.use(requireApiAuth);

// Listagem de agendamentos com filtros e ordenacao por data
router.get('/agendamentos', agendamentoController.list);

// Metricas e contadores para os cards do dashboard
router.get('/stats', agendamentoController.getStats);

// Alteracao de status (pendente, confirmado, cancelado)
router.patch('/agendamentos/:id/status', agendamentoController.updateStatus);

// Remocao de agendamento
router.delete('/agendamentos/:id', agendamentoController.remove);

module.exports = router;
