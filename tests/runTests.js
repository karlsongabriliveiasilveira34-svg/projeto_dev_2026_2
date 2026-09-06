/**
 * PURO LUXO GRIFE - SUITE DE TESTES AUTOMATIZADOS
 * 
 * Executa testes end-to-end e de integracao validando:
 * 1. Seguranca e normalizacao de rotas (/login, /admin, mascaras /zpdasda)
 * 2. Validacao e criacao de agendamentos no formulario publico
 * 3. Protecao de rotas administrativas e controle de sessao
 * 4. Paginacao e atualizacao de status com tracking de atualizado_em
 * 5. Gestao de servicos/opcoes (CRUD e toggle de visibilidade)
 */

const http = require('http');

const PORT = process.env.PORT || 3000;
const BASE_URL = `http://localhost:${PORT}`;

let passedTests = 0;
let failedTests = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`  [FALHA] ${message}`);
    failedTests++;
    throw new Error(message);
  } else {
    console.log(`  [OK] ${message}`);
    passedTests++;
  }
}

async function request(path, options = {}) {
  const url = `${BASE_URL}${path}`;
  const headers = options.headers || {};
  let body = options.body;

  if (body && typeof body === 'object') {
    body = JSON.stringify(body);
    headers['Content-Type'] = 'application/json';
  }

  const fetchOptions = {
    method: options.method || 'GET',
    headers,
    body,
    redirect: options.redirect || 'manual',
  };

  const response = await fetch(url, fetchOptions);
  let json = null;
  let text = '';

  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      json = await response.json();
    } catch (e) {
      // ignore json parse error
    }
  } else {
    text = await response.text();
  }

  return {
    status: response.status,
    headers: response.headers,
    json,
    text,
  };
}

async function runAllTests() {
  console.log('\n===============================================================');
  console.log('  INICIANDO BATERIA DE TESTES - PURO LUXO GRIFE');
  console.log(`  Alvo: ${BASE_URL}`);
  console.log('===============================================================\n');

  let sessionCookie = '';
  let createdAgendamentoId = null;
  let createdOpcaoId = null;

  // -------------------------------------------------------------
  // TESTES 1: Rotas Publicas e Normalizacao de Seguranca
  // -------------------------------------------------------------
  console.log('[GRUPO 1] Rotas Publicas e Seguranca');
  
  const homeRes = await request('/');
  assert(homeRes.status === 200, 'GET / deve responder status 200');

  const loginPageRes = await request('/login');
  assert(loginPageRes.status === 200, 'GET /login deve responder status 200');

  const adminNoAuthRes = await request('/admin');
  assert(
    adminNoAuthRes.status === 302 && adminNoAuthRes.headers.get('location') === '/login',
    'GET /admin sem autenticacao deve redirecionar 302 para /login'
  );

  const maskAdminRes = await request('/zpdasda/admin');
  assert(
    maskAdminRes.status === 301 && maskAdminRes.headers.get('location') === '/admin',
    'GET /zpdasda/admin deve normalizar com 301 para /admin'
  );

  const maskLoginRes = await request('/zpdasda/login');
  assert(
    maskLoginRes.status === 301 && maskLoginRes.headers.get('location') === '/login',
    'GET /zpdasda/login deve normalizar com 301 para /login'
  );

  const adminHtmlRes = await request('/admin.html');
  assert(
    adminHtmlRes.status === 301 && adminHtmlRes.headers.get('location') === '/admin',
    'GET /admin.html deve normalizar com 301 para /admin'
  );

  // -------------------------------------------------------------
  // TESTES 2: Formulario de Agendamento e Validacoes
  // -------------------------------------------------------------
  console.log('\n[GRUPO 2] Formulario e API de Agendamento Publico');

  const invalidEmptyRes = await request('/api/agendamentos', {
    method: 'POST',
    body: {},
  });
  assert(invalidEmptyRes.status === 400 && invalidEmptyRes.json.sucesso === false, 'POST /api/agendamentos vazio deve retornar 400');

  const invalidEmailRes = await request('/api/agendamentos', {
    method: 'POST',
    body: {
      nome: 'Teste Invalido',
      email: 'email_sem_arroba',
      telefone: '(38) 99999-9999',
      tipo: 'Consultoria de Imagem & Estilo',
      data: '2026-12-31',
      horario: '15:00',
    },
  });
  assert(invalidEmailRes.status === 400 && invalidEmailRes.json.sucesso === false, 'POST com email invalido deve retornar 400');

  const invalidPastDateRes = await request('/api/agendamentos', {
    method: 'POST',
    body: {
      nome: 'Cliente Retroativo',
      email: 'cliente@exemplo.com',
      telefone: '(38) 99999-9999',
      tipo: 'Consultoria de Imagem & Estilo',
      data: '2020-01-01',
      horario: '15:00',
    },
  });
  assert(invalidPastDateRes.status === 400 && invalidPastDateRes.json.sucesso === false, 'POST com data passada deve retornar 400');

  const validBookingRes = await request('/api/agendamentos', {
    method: 'POST',
    body: {
      nome: 'Carlos Eduardo Silveira',
      email: 'carlos.silveira@exemplo.com',
      telefone: '(38) 98888-7777',
      tipo: 'Consultoria de Imagem & Estilo',
      data: '2026-10-15',
      horario: '16:00',
      observacoes: 'Preferencia por costumes italianos e alfaiataria fina',
    },
  });
  assert(validBookingRes.status === 201 && validBookingRes.json.sucesso === true, 'POST de agendamento valido deve retornar 201');
  assert(validBookingRes.json.agendamento.status === 'pendente', 'Novo agendamento deve iniciar com status pendente');
  createdAgendamentoId = validBookingRes.json.agendamento.id;

  // -------------------------------------------------------------
  // TESTES 3: API Publica de Opcoes
  // -------------------------------------------------------------
  console.log('\n[GRUPO 3] Catalogo Publico de Opcoes de Atendimento');

  const publicOpcoesRes = await request('/api/opcoes');
  assert(publicOpcoesRes.status === 200 && publicOpcoesRes.json.sucesso === true, 'GET /api/opcoes deve responder 200');
  assert(Array.isArray(publicOpcoesRes.json.opcoes) && publicOpcoesRes.json.opcoes.length > 0, 'Catalogo de opcoes deve conter itens ativos');

  // -------------------------------------------------------------
  // TESTES 4: Autenticacao Administrativa e Sessao
  // -------------------------------------------------------------
  console.log('\n[GRUPO 4] Autenticacao e Protecao de Rotas Administrativas');

  const adminAgendamentosNoAuth = await request('/api/admin/agendamentos');
  assert(adminAgendamentosNoAuth.status === 401, 'GET /api/admin/agendamentos sem cookie deve responder 401');

  const loginFailRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@puroluxo.com', senha: 'senha_incorreta' },
  });
  assert(loginFailRes.status === 401 && loginFailRes.json.sucesso === false, 'Login com senha incorreta deve retornar 401');

  const loginSuccessRes = await request('/api/auth/login', {
    method: 'POST',
    body: { email: 'admin@puroluxo.com', senha: 'admin123' },
  });
  assert(loginSuccessRes.status === 200 && loginSuccessRes.json.sucesso === true, 'Login do admin com credenciais validas deve retornar 200');
  
  const rawSetCookie = loginSuccessRes.headers.get('set-cookie');
  assert(Boolean(rawSetCookie && rawSetCookie.includes('puroluxo.sid')), 'Resposta de login deve definir cookie de sessao puroluxo.sid');
  sessionCookie = rawSetCookie.split(';')[0];

  const authMeRes = await request('/api/auth/me', {
    headers: { Cookie: sessionCookie },
  });
  assert(authMeRes.status === 200 && authMeRes.json.autenticado === true, 'GET /api/auth/me autenticado deve retornar autenticado: true');

  // -------------------------------------------------------------
  // TESTES 5: Operacoes do Painel (Paginacao, Status, atualizado_em)
  // -------------------------------------------------------------
  console.log('\n[GRUPO 5] Operacoes Administrativas e Paginacao');

  const adminListRes = await request('/api/admin/agendamentos?page=1&limit=5', {
    headers: { Cookie: sessionCookie },
  });
  assert(adminListRes.status === 200 && adminListRes.json.sucesso === true, 'GET /api/admin/agendamentos deve retornar 200 com sessao');
  assert(adminListRes.json.currentPage === 1, 'Paginacao deve indicar currentPage = 1');
  assert(adminListRes.json.totalPages >= 1, 'Paginacao deve indicar totalPages >= 1');
  assert(adminListRes.json.totalRecords >= 1, 'Paginacao deve indicar totalRecords >= 1');

  const statsRes = await request('/api/admin/stats', {
    headers: { Cookie: sessionCookie },
  });
  assert(statsRes.status === 200 && statsRes.json.sucesso === true, 'GET /api/admin/stats deve retornar metricas');
  assert(statsRes.json.stats.total >= 1, 'Metricas devem conter total >= 1');

  const updateStatusRes = await request(`/api/admin/agendamentos/${createdAgendamentoId}/status`, {
    method: 'PATCH',
    headers: { Cookie: sessionCookie },
    body: { status: 'confirmado' },
  });
  assert(updateStatusRes.status === 200 && updateStatusRes.json.sucesso === true, 'PATCH de status para confirmado deve retornar 200');
  assert(updateStatusRes.json.agendamento.status === 'confirmado', 'Registro deve refletir status confirmado');
  assert(Boolean(updateStatusRes.json.agendamento.atualizado_em), 'Registro deve atualizar timestamp atualizado_em');

  // -------------------------------------------------------------
  // TESTES 6: Gestao de Servicos e Opcoes (CRUD + Toggle)
  // -------------------------------------------------------------
  console.log('\n[GRUPO 6] Gestao de Servicos & Opcoes (Requisito 10)');

  const adminOpcoesRes = await request('/api/admin/opcoes', {
    headers: { Cookie: sessionCookie },
  });
  assert(adminOpcoesRes.status === 200 && adminOpcoesRes.json.sucesso === true, 'GET /api/admin/opcoes deve listar servicos para admin');

  const newOpcaoRes = await request('/api/admin/opcoes', {
    method: 'POST',
    headers: { Cookie: sessionCookie },
    body: {
      titulo: 'Atendimento Sob Demanda Teste',
      descricao: 'Servico de teste criado na suite automatizada',
      preco: 'R$ 150,00',
      duracao: '30min',
      ativo: true,
    },
  });
  assert(newOpcaoRes.status === 201 && newOpcaoRes.json.sucesso === true, 'POST /api/admin/opcoes deve criar novo servico');
  createdOpcaoId = newOpcaoRes.json.opcao.id;

  const toggleOpcaoRes = await request(`/api/admin/opcoes/${createdOpcaoId}/toggle`, {
    method: 'PATCH',
    headers: { Cookie: sessionCookie },
  });
  assert(toggleOpcaoRes.status === 200 && toggleOpcaoRes.json.sucesso === true, 'PATCH /api/admin/opcoes/:id/toggle deve alternar status');
  assert(toggleOpcaoRes.json.opcao.ativo === 0 || toggleOpcaoRes.json.opcao.ativo === false, 'Opcao desativada deve ter ativo = false/0');

  // Valida que a opcao desativada NAO aparece no catalogo publico
  const publicAfterToggleRes = await request('/api/opcoes');
  const findDeactivated = publicAfterToggleRes.json.opcoes.find((o) => o.id === createdOpcaoId);
  assert(findDeactivated === undefined, 'Opcao desativada NAO deve aparecer no formulario publico');

  // Reativa para integridade
  await request(`/api/admin/opcoes/${createdOpcaoId}/toggle`, {
    method: 'PATCH',
    headers: { Cookie: sessionCookie },
  });

  // Limpa agendamento de teste criado
  if (createdAgendamentoId) {
    const deleteRes = await request(`/api/admin/agendamentos/${createdAgendamentoId}`, {
      method: 'DELETE',
      headers: { Cookie: sessionCookie },
    });
    assert(deleteRes.status === 200 && deleteRes.json.sucesso === true, 'DELETE /api/admin/agendamentos/:id deve excluir registro de teste');
  }

  // -------------------------------------------------------------
  // RELATORIO FINAL
  // -------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`  BATERIA CONCLUIDA: ${passedTests} aprovados | ${failedTests} falhas`);
  console.log('===============================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runAllTests().catch((err) => {
  console.error('\n[ERRO CRITICO NA EXECUCAO DOS TESTES]', err);
  process.exit(1);
});
