const express = require('express');
const router = express.Router();
const agendamentoController = require('../controllers/agendamentoController');
const opcaoController = require('../controllers/opcaoController');
const { requireApiAuth } = require('../middleware/auth');

// Todas as rotas administrativas exigem sessao autenticada
router.use(requireApiAuth);

// Listagem de agendamentos com filtros, busca e paginacao
router.get('/agendamentos', agendamentoController.list);

// Metricas e contadores para os cards do dashboard
router.get('/stats', agendamentoController.getStats);

// Alteracao de status (pendente, confirmado, cancelado)
router.patch('/agendamentos/:id/status', agendamentoController.updateStatus);

// Remocao de agendamento
router.delete('/agendamentos/:id', agendamentoController.remove);

// Gestao de Opcoes de Servicos (Requisito 10 do edital Mupi Systems)
router.get('/opcoes', opcaoController.listAdmin);
router.post('/opcoes', opcaoController.create);
router.put('/opcoes/:id', opcaoController.update);
router.patch('/opcoes/:id/toggle', opcaoController.toggle);

module.exports = router;
