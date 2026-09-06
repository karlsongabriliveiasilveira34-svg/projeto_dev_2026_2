/**
 * Middleware para proteger rotas de API (retorna JSON 401 se nao autenticado)
 */
function requireApiAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({
    sucesso: false,
    mensagem: 'Acesso restrito. Efetue login para visualizar estas informacoes.',
  });
}

/**
 * Middleware para proteger rotas de visualizacao HTML (redireciona para /login)
 */
function requirePageAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  return res.redirect('/login');
}

/**
 * Redireciona usuarios ja autenticados para fora da pagina de login
 */
function requireGuest(req, res, next) {
  if (req.session && req.session.user) {
    return res.redirect('/admin');
  }
  return next();
}

module.exports = {
  requireApiAuth,
  requirePageAuth,
  requireGuest,
};
