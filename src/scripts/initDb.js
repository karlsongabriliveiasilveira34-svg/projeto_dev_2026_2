const { query, pool } = require('../config/db');
require('dotenv').config();

async function initDb() {
  console.log('[DATABASE INIT] Iniciando preparacao das tabelas no PostgreSQL...');

  const createTablesSql = `
    -- Tabela de usuarios administradores
    CREATE TABLE IF NOT EXISTS usuarios (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      senha_hash VARCHAR(255) NOT NULL,
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Tabela de agendamentos e registros de atendimento VIP
    CREATE TABLE IF NOT EXISTS agendamentos (
      id SERIAL PRIMARY KEY,
      nome VARCHAR(255) NOT NULL,
      email_encrypted TEXT NOT NULL,
      email_hash VARCHAR(64) NOT NULL,
      telefone VARCHAR(50) NOT NULL,
      tipo VARCHAR(100) NOT NULL,
      data DATE NOT NULL,
      horario VARCHAR(20) NOT NULL,
      observacoes TEXT,
      status VARCHAR(20) NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'confirmado', 'cancelado')),
      criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );

    -- Indices para otimizacao de consultas e ordenacao por data
    CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data DESC);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos (status);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_email_hash ON agendamentos (email_hash);
    CREATE INDEX IF NOT EXISTS idx_agendamentos_criado_em ON agendamentos (criado_em DESC);
  `;

  try {
    await query(createTablesSql);
    console.log('[DATABASE INIT] Tabelas e indices criados com sucesso.');
  } catch (error) {
    console.error('[DATABASE INIT ERROR] Falha ao inicializar banco de dados:', error.message);
    throw error;
  }
}

if (require.main === module) {
  initDb()
    .then(() => {
      console.log('[DATABASE INIT] Processo concluido.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DATABASE INIT FATAL]', err.message);
      process.exit(1);
    });
}

module.exports = { initDb };
