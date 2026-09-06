const bcrypt = require('bcryptjs');
const { query } = require('../config/db');

/**
 * Realiza a autenticacao do administrador
 */
async function login(req, res) {
  try {
    const { email, senha } = req.body;

    if (!email || !senha) {
      return res.status(400).json({
        sucesso: false,
        mensagem: 'Por favor, informe o e-mail e a senha de acesso.',
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const result = await query('SELECT * FROM usuarios WHERE email = $1', [cleanEmail]);

    if (result.rows.length === 0) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais invalidas. Verifique o e-mail e a senha.',
      });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(senha, user.senha_hash);

    if (!match) {
      return res.status(401).json({
        sucesso: false,
        mensagem: 'Credenciais invalidas. Verifique o e-mail e a senha.',
      });
    }

    // Salva na sessao
    req.session.user = {
      id: user.id,
      nome: user.nome,
      email: user.email,
    };

    return res.status(200).json({
      sucesso: true,
      mensagem: 'Autenticacao realizada com sucesso.',
      usuario: {
        id: user.id,
        nome: user.nome,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('[AUTH LOGIN ERROR]', error);
    return res.status(500).json({
      sucesso: false,
      mensagem: 'Erro interno ao processar a autenticacao.',
    });
  }
}

/**
 * Encerra a sessao do administrador (logout)
 */
function logout(req, res) {
  req.session.destroy((err) => {
    if (err) {
      console.error('[AUTH LOGOUT ERROR]', err);
      return res.status(500).json({
        sucesso: false,
        mensagem: 'Nao foi possivel encerrar a sessao.',
      });
    }
    res.clearCookie('puroluxo.sid');
    res.clearCookie('connect.sid');
    return res.status(200).json({
      sucesso: true,
      mensagem: 'Sessao encerrada com sucesso.',
    });
  });
}

/**
 * Verifica o status da sessao atual
 */
function getSessionUser(req, res) {
  if (req.session && req.session.user) {
    return res.status(200).json({
      autenticado: true,
      usuario: req.session.user,
    });
  }
  return res.status(200).json({
    autenticado: false,
    usuario: null,
  });
}

module.exports = {
  login,
  logout,
  getSessionUser,
};
