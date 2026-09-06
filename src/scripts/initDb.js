const { query, testConnection } = require('../config/db');
require('dotenv').config();

async function initDb() {
  console.log('[DATABASE INIT] Preparando tabelas do banco de dados...');

  try {
    const status = await testConnection();

    if (status.engine === 'PostgreSQL') {
      const createTablesSql = `
        -- Tabela de usuarios administradores
        CREATE TABLE IF NOT EXISTS usuarios (
          id SERIAL PRIMARY KEY,
          nome VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          senha_hash VARCHAR(255) NOT NULL,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Tabela de opcoes / servicos oferecidos (gerenciada dinamicamente pelo painel)
        CREATE TABLE IF NOT EXISTS opcoes (
          id SERIAL PRIMARY KEY,
          titulo VARCHAR(255) NOT NULL,
          descricao TEXT,
          preco VARCHAR(50),
          duracao VARCHAR(50),
          ativa BOOLEAN NOT NULL DEFAULT true,
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
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
          criado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        -- Garante a coluna atualizado_em caso a tabela tenha sido criada em versao anterior
        ALTER TABLE agendamentos ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

        -- Indices para otimizacao de consultas e ordenacao por data
        CREATE INDEX IF NOT EXISTS idx_agendamentos_data ON agendamentos (data DESC);
        CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos (status);
        CREATE INDEX IF NOT EXISTS idx_agendamentos_email_hash ON agendamentos (email_hash);
        CREATE INDEX IF NOT EXISTS idx_agendamentos_criado_em ON agendamentos (criado_em DESC);
        CREATE INDEX IF NOT EXISTS idx_opcoes_ativa ON opcoes (ativa);
      `;

      await query(createTablesSql);
    } else {
      // Modo SQLite (Fallback local)
      await query(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          senha_hash TEXT NOT NULL,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS opcoes (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          titulo TEXT NOT NULL,
          descricao TEXT,
          preco TEXT,
          duracao TEXT,
          ativa INTEGER NOT NULL DEFAULT 1,
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      await query(`
        CREATE TABLE IF NOT EXISTS agendamentos (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          nome TEXT NOT NULL,
          email_encrypted TEXT NOT NULL,
          email_hash TEXT NOT NULL,
          telefone TEXT NOT NULL,
          tipo TEXT NOT NULL,
          data TEXT NOT NULL,
          horario TEXT NOT NULL,
          observacoes TEXT,
          status TEXT NOT NULL DEFAULT 'pendente',
          criado_em DATETIME DEFAULT CURRENT_TIMESTAMP,
          atualizado_em DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      try {
        await query('ALTER TABLE agendamentos ADD COLUMN atualizado_em DATETIME');
        await query("UPDATE agendamentos SET atualizado_em = criado_em WHERE atualizado_em IS NULL");
      } catch (e) {
        // Coluna ja existe no SQLite, prossegue normalmente
      }
    }

    console.log('[DATABASE INIT] Tabelas e indices prontos.');
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
