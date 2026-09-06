const express = require('express');
const session = require('express-session');
const path = require('path');
const helmet = require('helmet');
const cors = require('cors');
require('dotenv').config();

const { testConnection } = require('./src/config/db');
const { initDb } = require('./src/scripts/initDb');
const { requirePageAuth, requireGuest } = require('./src/middleware/auth');
const { apiLimiter } = require('./src/utils/rateLimiter');

const authRoutes = require('./src/routes/authRoutes');
const agendamentoRoutes = require('./src/routes/agendamentoRoutes');
const adminRoutes = require('./src/routes/adminRoutes');

const app = express();
const PORT = parseInt(process.env.PORT || '3000', 10);

// Configuracao de seguranca de cabecalhos HTTP com Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com", "data:"],
        imgSrc: ["'self'", "data:", "https:", "http:"],
        mediaSrc: ["'self'", "data:", "blob:"],
        connectSrc: ["'self'"],
      },
    },
    crossOriginEmbedderPolicy: false,
  })
);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Configuracao de sessao segura (HTTP-only)
app.use(
  session({
    name: 'puroluxo.sid',
    secret: process.env.SESSION_SECRET || 'puro_luxo_grife_super_secret_session_key_2026',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000, // 24 horas
    },
  })
);

// Rate limiter global da API
app.use('/api', apiLimiter);

// Middleware de normalizacao e anti-obfuscacao de rotas
// Garante que caminhos obscurecidos (como zpdasda/admin ou zpdasda/login) e .html sejam redirecionados para as rotas canonicas limpas
app.use((req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }

  const urlPath = req.path.replace(/\/+$/, '');
  const query = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';

  if ((urlPath.endsWith('/admin') || urlPath.endsWith('/admin.html')) && req.path !== '/admin') {
    return res.redirect(301, `/admin${query}`);
  }

  if ((urlPath.endsWith('/login') || urlPath.endsWith('/login.html')) && req.path !== '/login') {
    return res.redirect(301, `/login${query}`);
  }

  next();
});

// Arquivos estaticos
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname)));

// Rotas de paginas HTML
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/login', requireGuest, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/admin', requirePageAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Rotas da API REST
app.use('/api/auth', authRoutes);
app.use('/api/agendamentos', agendamentoRoutes);
app.use('/api/admin', adminRoutes);

// Health check da aplicacao e status do banco de dados
app.get('/api/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.status(dbStatus.success ? 200 : 503).json({
    status: dbStatus.success ? 'online' : 'database_unavailable',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Tratamento de rotas inexistentes (404)
app.use((req, res) => {
  if (req.accepts('html')) {
    res.status(404).sendFile(path.join(__dirname, 'index.html'));
  } else {
    res.status(404).json({ sucesso: false, mensagem: 'Recurso nao encontrado.' });
  }
});

// Tratamento global de erros (500)
app.use((err, req, res, next) => {
  console.error('[SERVER UNCAUGHT ERROR]', err);
  res.status(500).json({
    sucesso: false,
    mensagem: 'Erro interno no servidor.',
  });
});

// Inicializacao do servidor e checagem de banco
async function startServer() {
  const dbCheck = await testConnection();
  if (dbCheck.success) {
    console.log('[DATABASE] Conexao com PostgreSQL estabelecida com sucesso.');
    try {
      await initDb();
    } catch (e) {
      console.warn('[DATABASE] Aviso durante a verificacao inicial de tabelas:', e.message);
    }
  } else {
    console.warn('[DATABASE WARNING] Nao foi possivel conectar ao PostgreSQL no momento: ' + dbCheck.error);
    console.warn('[DATABASE WARNING] Verifique se o servico PostgreSQL ou container Docker esta ativo (docker compose up -d).');
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Servidor Puro Luxo Grife rodando em http://localhost:${PORT}`);
  });
}

startServer();

module.exports = app;
