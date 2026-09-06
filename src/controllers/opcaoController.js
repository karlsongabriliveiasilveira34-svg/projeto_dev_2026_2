const { query } = require('../config/db');

/**
 * Lista apenas as opcoes ativas para exibicao na pagina publica e formulario
 */
async function listPublic(req, res) {
  try {
    const result = await query(
      'SELECT id, titulo, descricao, preco, duracao FROM opcoes WHERE ativa = true ORDER BY id ASC'
    );

    return res.status(200).json({
      sucesso: true,
      opcoes: result.rows,
    });
  } catch (error) {
    console.error('[OPCOES PUBLIC LIST ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao consultar servicos disponiveis.',
    });
  }
}

/**
 * Lista todas as opcoes (ativas e inativas) para o painel administrativo
 */
async function listAdmin(req, res) {
  try {
    const result = await query(
      'SELECT id, titulo, descricao, preco, duracao, ativa, criado_em, atualizado_em FROM opcoes ORDER BY id ASC'
    );

    const opcoesFormatadas = (result.rows || []).map((row) => ({
      ...row,
      ativo: row.ativa === 1 || row.ativa === true,
      ativa: row.ativa === 1 || row.ativa === true,
    }));

    return res.status(200).json({
      sucesso: true,
      total: opcoesFormatadas.length,
      opcoes: opcoesFormatadas,
    });
  } catch (error) {
    console.error('[OPCOES ADMIN LIST ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao carregar lista de servicos no painel.',
    });
  }
}

/**
 * Cria uma nova opcao de servico
 */
async function create(req, res) {
  try {
    const { titulo, descricao, preco, duracao } = req.body;

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'O titulo do servico e obrigatorio.',
      });
    }

    const cleanTitulo = titulo.trim();
    const cleanDesc = descricao ? descricao.trim() : '';
    const cleanPreco = preco && preco.trim() ? preco.trim() : 'Sob Consulta';
    const cleanDuracao = duracao && duracao.trim() ? duracao.trim() : '1h 00min';

    const insertSql = `
      INSERT INTO opcoes (titulo, descricao, preco, duracao, ativa)
      VALUES ($1, $2, $3, $4, true)
      RETURNING id, titulo, descricao, preco, duracao, ativa, criado_em, atualizado_em;
    `;

    const result = await query(insertSql, [cleanTitulo, cleanDesc, cleanPreco, cleanDuracao]);

    const createdRow = result.rows[0];
    const isAtiva = createdRow.ativa === 1 || createdRow.ativa === true;

    return res.status(201).json({
      sucesso: true,
      mensagem: 'Servico cadastrado com sucesso.',
      opcao: {
        ...createdRow,
        ativo: isAtiva,
        ativa: isAtiva,
      },
    });
  } catch (error) {
    console.error('[OPCAO CREATE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao cadastrar servico.',
    });
  }
}

/**
 * Atualiza os dados de uma opcao existente
 */
async function update(req, res) {
  try {
    const { id } = req.params;
    const { titulo, descricao, preco, duracao } = req.body;

    const idNum = parseInt(id, 10);
    if (isNaN(idNum)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de servico invalido.',
      });
    }

    if (!titulo || typeof titulo !== 'string' || titulo.trim().length === 0) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'O titulo do servico e obrigatorio.',
      });
    }

    const cleanTitulo = titulo.trim();
    const cleanDesc = descricao ? descricao.trim() : '';
    const cleanPreco = preco && preco.trim() ? preco.trim() : 'Sob Consulta';
    const cleanDuracao = duracao && duracao.trim() ? duracao.trim() : '1h 00min';

    const updateSql = `
      UPDATE opcoes
      SET titulo = $1, descricao = $2, preco = $3, duracao = $4, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $5
      RETURNING id, titulo, descricao, preco, duracao, ativa, criado_em, atualizado_em;
    `;

    const result = await query(updateSql, [cleanTitulo, cleanDesc, cleanPreco, cleanDuracao, idNum]);

    if (!result.rows || result.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Servico nao encontrado.',
      });
    }

    const updatedRow = result.rows[0];
    const isAtiva = updatedRow.ativa === 1 || updatedRow.ativa === true;

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Servico atualizado com sucesso.',
      opcao: {
        ...updatedRow,
        ativo: isAtiva,
        ativa: isAtiva,
      },
    });
  } catch (error) {
    console.error('[OPCAO UPDATE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao atualizar servico.',
    });
  }
}

/**
 * Alterna o status de ativacao (ativa / inativa) de uma opcao
 */
async function toggle(req, res) {
  try {
    const { id } = req.params;
    const idNum = parseInt(id, 10);

    if (isNaN(idNum)) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'ID de servico invalido.',
      });
    }

    // Busca o status atual
    const findSql = 'SELECT id, ativa FROM opcoes WHERE id = $1';
    const findRes = await query(findSql, [idNum]);

    if (!findRes.rows || findRes.rows.length === 0) {
      return res.status(404).json({
        sucesso: false,
        mensagem: 'Servico nao encontrado.',
      });
    }

    const isCurrentAtiva = findRes.rows[0].ativa === 1 || findRes.rows[0].ativa === true;
    const novoStatus = isCurrentAtiva ? false : true;

    const toggleSql = `
      UPDATE opcoes
      SET ativa = $1, atualizado_em = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING id, titulo, ativa, atualizado_em;
    `;

    const result = await query(toggleSql, [novoStatus, idNum]);
    const updatedRow = result.rows[0];
    const finalAtiva = updatedRow.ativa === 1 || updatedRow.ativa === true;

    return res.status(200).json({
      sucesso: true,
      mensagem: `Servico ${finalAtiva ? 'ativado' : 'desativado'} com sucesso.`,
      opcao: {
        ...updatedRow,
        ativo: finalAtiva,
        ativa: finalAtiva,
      },
    });
  } catch (error) {
    console.error('[OPCAO TOGGLE ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro ao alternar status do servico.',
    });
  }
}

module.exports = {
  listPublic,
  listAdmin,
  create,
  update,
  toggle,
};
