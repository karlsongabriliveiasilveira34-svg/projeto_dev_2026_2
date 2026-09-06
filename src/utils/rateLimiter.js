const rateLimit = require('express-rate-limit');
require('dotenv').config();

const isDev = process.env.NODE_ENV === 'development';

/**
 * Rate Limiter para envios publicos de agendamento
 */
const bookingLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 100 : 20, // limite flexivel em desenvolvimento
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Limite de agendamentos excedido temporariamente para este endereco de rede. Aguarde alguns minutos e tente novamente.',
  },
});

/**
 * Rate Limiter para tentativas de login
 */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: isDev ? 100 : 10,
  skipSuccessfulRequests: true,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas tentativas incorretas de login. Acesso temporariamente bloqueado por 15 minutos para protecao.',
  },
});

/**
 * Rate Limiter global para a API
 */
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isDev ? 1000 : 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    sucesso: false,
    mensagem: 'Muitas requisicoes originadas deste IP. Aguarde antes de realizar novas consultas.',
  },
});

module.exports = {
  bookingLimiter,
  loginLimiter,
  apiLimiter,
};
