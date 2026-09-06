const { Pool } = require('pg');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const bcrypt = require('bcryptjs');
require('dotenv').config();

let pgPool = null;
let sqliteDb = null;
let isUsingPg = false;
let dbInitialized = false;

// Tentativa de configuracao do PostgreSQL
const connectionString = process.env.DATABASE_URL;
const pgConfig = connectionString
  ? {
      connectionString,
      connectionTimeoutMillis: 2000,
      ssl: process.env.NODE_ENV === 'production' && !connectionString.includes('localhost')
        ? { rejectUnauthorized: false }
        : false,
    }
  : {
      user: process.env.PGUSER || 'postgres',
      host: process.env.PGHOST || 'localhost',
      database: process.env.PGDATABASE || 'puroluxo_db',
      password: process.env.PGPASSWORD || 'postgrespassword',
      port: parseInt(process.env.PGPORT || '5432', 10),
      connectionTimeoutMillis: 2000,
    };

function initSqliteFallback() {
  if (sqliteDb) return sqliteDb;

  const dbPath = path.join(__dirname, '..', '..', 'database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath);

  sqliteDb.serialize(() => {
    sqliteDb.run(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nome TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        senha_hash TEXT NOT NULL,
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    sqliteDb.run(`
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
        criado_em DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Criar admin padrao no fallback se nao existir
    const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@puroluxo.com').trim().toLowerCase();
    const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
    const adminName = process.env.ADMIN_DEFAULT_NAME || 'Administrador Puro Luxo';

    sqliteDb.get('SELECT id FROM usuarios WHERE email = ?', [adminEmail], (err, row) => {
      if (!row) {
        const salt = bcrypt.genSaltSync(10);
        const hash = bcrypt.hashSync(adminPass, salt);
        sqliteDb.run(
          'INSERT INTO usuarios (nome, email, senha_hash) VALUES (?, ?, ?)',
          [adminName, adminEmail, hash],
          () => {
            console.log('[DATABASE] Usuario administrador pronto no banco local.');
          }
        );
      }
    });
  });

  return sqliteDb;
}

async function testConnection() {
  try {
    if (!pgPool) {
      pgPool = new Pool(pgConfig);
      pgPool.on('error', () => {
        isUsingPg = false;
      });
    }

    const res = await pgPool.query('SELECT NOW() as current_time');
    isUsingPg = true;
    return { success: true, engine: 'PostgreSQL', timestamp: res.rows[0].current_time };
  } catch (error) {
    isUsingPg = false;
    initSqliteFallback();
    return { success: true, engine: 'SQLite (Fallback Local Ativo)', error: error.message };
  }
}

async function query(text, params = []) {
  // Se ainda nao testou conexao com PostgreSQL, testa agora
  if (!dbInitialized) {
    await testConnection();
    dbInitialized = true;
  }

  if (isUsingPg && pgPool) {
    try {
      const res = await pgPool.query(text, params);
      return res;
    } catch (pgErr) {
      console.warn('[DATABASE] Falha temporaria no PostgreSQL, alternando para armazenamento local...');
      isUsingPg = false;
      initSqliteFallback();
    }
  }

  // Fallback SQLite
  const db = initSqliteFallback();

  return new Promise((resolve, reject) => {
    let sqliteSql = text
      .replace(/\$(\d+)/g, '?')
      .replace(/RETURNING .*/gi, '')
      .replace(/NOW\(\)/gi, "datetime('now')")
      .replace(/ILIKE/gi, 'LIKE')
      .replace(/FILTER\s*\(\s*WHERE\s*status\s*=\s*'pendente'\s*\)/gi, "AND status = 'pendente'")
      .trim();

    // Tratamento de contadores de metricas para SQLite
    if (/COUNT\(\*\)\s*FILTER/i.test(text)) {
      sqliteSql = `
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN status = 'pendente' THEN 1 ELSE 0 END) AS pendentes,
          SUM(CASE WHEN status = 'confirmado' THEN 1 ELSE 0 END) AS confirmados,
          SUM(CASE WHEN status = 'cancelado' THEN 1 ELSE 0 END) AS cancelados
        FROM agendamentos;
      `;
    }

    const isSelect = /^\s*SELECT/i.test(sqliteSql);
    const isInsert = /^\s*INSERT/i.test(sqliteSql);
    const isUpdate = /^\s*UPDATE/i.test(sqliteSql);
    const isDelete = /^\s*DELETE/i.test(sqliteSql);

    if (isSelect) {
      db.all(sqliteSql, params, (err, rows) => {
        if (err) return reject(err);
        resolve({
          rows: rows || [],
          rowCount: (rows && rows.length) || 0,
        });
      });
    } else if (isInsert) {
      db.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        const lastID = this.lastID;
        // Retorna o registro recem inserido
        db.get('SELECT * FROM agendamentos WHERE id = ?', [lastID], (getErr, row) => {
          resolve({
            rows: row ? [row] : [{ id: lastID }],
            rowCount: 1,
          });
        });
      });
    } else if (isUpdate || isDelete) {
      db.run(sqliteSql, params, function (err) {
        if (err) return reject(err);
        const changes = this.changes;
        if (changes === 0) {
          return resolve({ rows: [], rowCount: 0 });
        }
        if (isUpdate) {
          const targetId = params[params.length - 1];
          db.get('SELECT * FROM agendamentos WHERE id = ?', [targetId], (getErr, row) => {
            resolve({
              rows: row ? [row] : [{ id: targetId }],
              rowCount: changes,
            });
          });
        } else {
          resolve({
            rows: [{ id: params[params.length - 1] }],
            rowCount: changes,
          });
        }
      });
    } else {
      db.exec(sqliteSql, (err) => {
        if (err) return reject(err);
        resolve({ rows: [], rowCount: 0 });
      });
    }
  });
}

module.exports = {
  query,
  testConnection,
  initSqliteFallback,
};
