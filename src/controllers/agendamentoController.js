const { query } = require('../config/db');
const { encrypt, decrypt, hashBlindIndex } = require('../utils/crypto');

const SERVICOS_PERMITIDOS = [
  'Consultoria de Imagem & Estilo',
  'Prova Privada & Ajuste Sob Medida',
  'Curadoria de Colecao / Personal Shopper',
  'Atendimento VIP Online (Envios)',
];

const STATUS_PERMITIDOS = ['pendente', 'confirmado', 'cancelado'];

/**
 * Cria um novo agendamento (publico)
 */
async function create(req, res) {
  try {
    const { nome, email, telefone, tipo, data, horario, observacoes } = req.body;

    // Validacao dos campos obrigatorios
    if (!nome || !email || !telefone || !tipo || !data || !horario) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Preencha todos os campos obrigatorios para prosseguir.',
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Informe um endereco de e-mail valido.',
      });
    }

    const nomeFormatado = nome.trim();
    const emailLimpo = email.trim().toLowerCase();
    const telefoneFormatado = telefone.trim();
    const tipoEscolhido = tipo.trim();
    const dataFormatada = data.trim();
    const horarioFormatado = horario.trim();
    const obsFormatada = observacoes ? observacoes.trim() : '';

    // Validacao do formato e impedimento de datas passadas
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dataFormatada)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Informe uma data valida no formato AAAA-MM-DD.',
      });
    }

    const todayStr = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo' }).format(new Date());
    if (dataFormatada < todayStr) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Nao e permitido realizar agendamentos para datas passadas. Por favor, escolha uma data a partir de hoje.',
      });
    }

    // Criptografia simetrica do e-mail (AES-256-GCM) para protecao em repouso
    const emailEncrypted = encrypt(emailLimpo);
    const emailHash = hashBlindIndex(emailLimpo);

    const insertSql = `
      INSERT INTO agendamentos 
        (nome, email_encrypted, email_hash, telefone, tipo, data, horario, observacoes, status, criado_em, atualizado_em)
      VALUES 
        ($1, $2, $3, $4, $5, $6, $7, $8, 'pendente', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING id, nome, tipo, data, horario, status, criado_em, atualizado_em;
    `;

    const result = await query(insertSql, [
      nomeFormatado,
      emailEncrypted,
      emailHash,
      telefoneFormatado,
      tipoEscolhido,
      dataFormatada,
      horarioFormatado,
      obsFormatada,
    ]);

    const novoAgendamento = result.rows[0];

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Solicitacao de atendimento VIP enviada com sucesso.',
      agendamento: {
        id: novoAgendamento.id,
        nome: novoAgendamento.nome,
        tipo: novoAgendamento.tipo,
        data: novoAgendamento.data,
        horario: novoAgendamento.horario,
        status: novoAgendamento.status,
        criado_em: novoAgendamento.criado_em,
        atualizado_em: novoAgendamento.atualizado_em,
      },
    });
  } catch (error) {
    console.error('[AGENDAMENTO CREATE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Ocorreu um erro interno ao processar seu agendamento. Tente novamente em instantes.',
    });
  }
}

/**
 * Lista todos os agendamentos com filtros e ordenacao por data (restrito ao admin)
 */
async function list(req, res) {
  try {
    const { status, busca, page, limit } = req.query;

    const currentPage = Math.max(1, parseInt(page || '1', 10));
    const perPage = Math.min(50, Math.max(1, parseInt(limit || '8', 10)));
    const offset = (currentPage - 1) * perPage;

    let whereClause = ' WHERE 1=1';
    const params = [];

    if (status && STATUS_PERMITIDOS.includes(status)) {
      params.push(status);
      whereClause += ` AND status = $${params.length}`;
    }

    if (busca && busca.trim().length > 0) {
      const termo = `%${busca.trim()}%`;
      const searchHash = hashBlindIndex(busca.trim());
      params.push(termo);
      const termoIndex = params.length;
      params.push(searchHash);
      const hashIndex = params.length;

      whereClause += ` AND (nome ILIKE $${termoIndex} OR telefone ILIKE $${termoIndex} OR tipo ILIKE $${termoIndex} OR observacoes ILIKE $${termoIndex} OR email_hash = $${hashIndex})`;
    }

    // 1. Contagem total de registros com base nos filtros
    const countSql = `SELECT COUNT(*) as total FROM agendamentos${whereClause}`;
    const countRes = await query(countSql, params);
    const total = parseInt(countRes.rows[0].total, 10);
    const totalPages = Math.ceil(total / perPage) || 1;

    // 2. Consulta paginada ordenada por data
    const queryParams = [...params];
    queryParams.push(perPage);
    const limitIndex = queryParams.length;
    queryParams.push(offset);
    const offsetIndex = queryParams.length;

    const sql = `
      SELECT * FROM agendamentos 
      ${whereClause} 
      ORDER BY data DESC, horario DESC, criado_em DESC 
      LIMIT $${limitIndex} OFFSET $${offsetIndex}
    `;

    const result = await query(sql, queryParams);

    // Descriptografa os e-mails apenas na memoria para a visualizacao do administrador
    const agendamentos = result.rows.map((row) => ({
      id: row.id,
      nome: row.nome,
      email: decrypt(row.email_encrypted),
      telefone: row.telefone,
      tipo: row.tipo,
      data: row.data instanceof Date ? row.data.toISOString().split('T')[0] : row.data,
      horario: row.horario,
      observacoes: row.observacoes,
      status: row.status,
      criado_em: row.criado_em,
      atualizado_em: row.atualizado_em,
    }));

    return res.status(200).json({
      sucesso: true,
      total,
      totalRecords: total,
      totalPages,
      currentPage,
      limit: perPage,
      agendamentos,
    });
  } catch (error) {
    console.error('[AGENDAMENTO LIST ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao consultar a lista de agendamentos.',
    });
  }
}

/**
 * Retorna contadores e metricas de agendamentos para os cards do painel
 */
async function getStats(req, res) {
  try {
    const statsSql = `
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pendente') AS pendentes,
        COUNT(*) FILTER (WHERE status = 'confirmado') AS confirmados,
        COUNT(*) FILTER (WHERE status = 'cancelado') AS cancelados
      FROM agendamentos;
    `;

    const result = await query(statsSql);
    const row = result.rows[0];

    return res.status(200).json({
      sucesso: true,
      stats: {
        total: parseInt(row.total || 0, 10),
        pendentes: parseInt(row.pendentes || 0, 10),
        confirmados: parseInt(row.confirmados || 0, 10),
        cancelados: parseInt(row.cancelados || 0, 10),
      },
    });
  } catch (error) {
    console.error('[AGENDAMENTO STATS ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao carregar estatisticas do painel.',
    });
  }
}

/**
 * Atualiza o status de um agendamento (pendente, confirmado, cancelado)
 */
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !STATUS_PERMITIDOS.includes(status)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Status invalido. Os valores permitidos sao: pendente, confirmado ou cancelado.',
      });
    }

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de agendamento invalido.',
      });
    }

    const updateSql = `
      UPDATE agendamentos 
      SET status = $1, atualizado_em = CURRENT_TIMESTAMP 
      WHERE id = $2 
      RETURNING id, nome, status, atualizado_em;
    `;

    const result = await query(updateSql, [status, idNum]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Registro de agendamento nao encontrado.',
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: `Status atualizado para '${status}' com sucesso.`,
      agendamento: result.rows[0],
    });
  } catch (error) {
    console.error('[AGENDAMENTO UPDATE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar o status do agendamento.',
    });
  }
}

/**
 * Remove um agendamento
 */
async function remove(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de agendamento invalido.',
      });
    }

    const deleteSql = 'DELETE FROM agendamentos WHERE id = $1 RETURNING id;';
    const result = await query(deleteSql, [idNum]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Registro nao encontrado para remocao.',
      });
    }

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Registro removido com sucesso.',
    });
  } catch (error) {
    console.error('[AGENDAMENTO DELETE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao remover o agendamento.',
    });
  }
}

module.exports = {
  create,
  list,
  getStats,
  updateStatus,
  remove,
};
