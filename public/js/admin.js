document.addEventListener('DOMContentLoaded', () => {
  // Estado dos Agendamentos
  let currentStatus = '';
  let searchQuery = '';
  let searchTimeout = null;
  let currentPage = 1;
  const pageLimit = 10;
  let totalPages = 1;

  // Elementos do DOM - Global & Autenticacao
  const userDisplay = document.getElementById('user-display');
  const btnLogout = document.getElementById('btn-logout');
  const toastContainer = document.getElementById('toast-container');

  // Elementos do DOM - Navegacao entre Modulos
  const tabNavAgendamentos = document.getElementById('tab-nav-agendamentos');
  const tabNavOpcoes = document.getElementById('tab-nav-opcoes');
  const viewAgendamentos = document.getElementById('view-agendamentos');
  const viewOpcoes = document.getElementById('view-opcoes');

  // Elementos do DOM - Metricas e Filtros de Agendamento
  const statTotal = document.getElementById('stat-total');
  const statPendentes = document.getElementById('stat-pendentes');
  const statConfirmados = document.getElementById('stat-confirmados');
  const statCancelados = document.getElementById('stat-cancelados');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('search-input');
  const tbody = document.getElementById('agendamentos-tbody');
  const emptyState = document.getElementById('empty-state');

  // Elementos do DOM - Paginacao
  const paginationInfo = document.getElementById('pagination-info');
  const pageCurrentIndicator = document.getElementById('page-current-indicator');
  const btnPagePrev = document.getElementById('btn-page-prev');
  const btnPageNext = document.getElementById('btn-page-next');

  // Elementos do DOM - Gestao de Servicos & Opcoes
  const opcoesTbody = document.getElementById('opcoes-tbody');
  const opcoesEmptyState = document.getElementById('opcoes-empty-state');
  const btnNovaOpcao = document.getElementById('btn-nova-opcao');
  const modalOpcao = document.getElementById('modal-opcao');
  const modalOpcaoClose = document.getElementById('modal-opcao-close');
  const modalOpcaoCancel = document.getElementById('modal-opcao-cancel');
  const modalOpcaoTitle = document.getElementById('modal-opcao-title');
  const formOpcao = document.getElementById('form-opcao');
  const inputOpcaoId = document.getElementById('opcao-id');
  const inputOpcaoTitulo = document.getElementById('opcao-titulo');
  const inputOpcaoDescricao = document.getElementById('opcao-descricao');
  const inputOpcaoPreco = document.getElementById('opcao-preco');
  const inputOpcaoDuracao = document.getElementById('opcao-duracao');
  const inputOpcaoAtivo = document.getElementById('opcao-ativo');
  const btnSaveOpcao = document.getElementById('btn-save-opcao');

  // Sistema de Toast Feedback (Zero emojis)
  function showToast(message, type = 'success') {
    if (!toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Formatacao de Data (YYYY-MM-DD para DD/MM/YYYY)
  function formatDate(dateStr) {
    if (!dateStr) return '-';
    const parts = String(dateStr).split('T')[0].split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
  }

  // Formatacao de Data e Hora Completa (ISO para DD/MM/YYYY HH:mm)
  function formatDateTime(dateStr) {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch {
      return dateStr;
    }
  }

  // Sanitizacao para WhatsApp
  function formatPhoneForWhatsApp(phone) {
    if (!phone) return '';
    const numeric = phone.replace(/\D/g, '');
    if (numeric.length === 10 || numeric.length === 11) {
      return `55${numeric}`;
    }
    return numeric;
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // =========================================================================
  // AUTENTICACAO & NAVEGACAO
  // =========================================================================

  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok || !data.autenticado) {
        window.location.href = '/login';
        return false;
      }

      if (data.usuario && userDisplay) {
        userDisplay.innerHTML = `Ola, <strong>${escapeHtml(data.usuario.nome || data.usuario.email)}</strong>`;
      }
      return true;
    } catch (err) {
      console.error('[AUTH CHECK ERROR]', err);
      window.location.href = '/login';
      return false;
    }
  }

  if (btnLogout) {
    btnLogout.addEventListener('click', async () => {
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
      } catch (err) {
        console.error('[LOGOUT ERROR]', err);
        window.location.href = '/login';
      }
    });
  }

  // Alternancia de Modulos (Agendamentos vs Servicos)
  function switchModule(view) {
    if (view === 'agendamentos') {
      tabNavAgendamentos.classList.add('active');
      tabNavOpcoes.classList.remove('active');
      viewAgendamentos.style.display = 'block';
      viewOpcoes.style.display = 'none';
      loadStats();
      loadAgendamentos();
    } else if (view === 'opcoes') {
      tabNavAgendamentos.classList.remove('active');
      tabNavOpcoes.classList.add('active');
      viewAgendamentos.style.display = 'none';
      viewOpcoes.style.display = 'block';
      loadOpcoes();
    }
  }

  if (tabNavAgendamentos && tabNavOpcoes) {
    tabNavAgendamentos.addEventListener('click', () => switchModule('agendamentos'));
    tabNavOpcoes.addEventListener('click', () => switchModule('opcoes'));
  }

  // =========================================================================
  // MODULO: AGENDAMENTOS VIP
  // =========================================================================

  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.sucesso && data.stats) {
        if (statTotal) statTotal.textContent = data.stats.total;
        if (statPendentes) statPendentes.textContent = data.stats.pendentes;
        if (statConfirmados) statConfirmados.textContent = data.stats.confirmados;
        if (statCancelados) statCancelados.textContent = data.stats.cancelados;
      }
    } catch (err) {
      console.error('[STATS LOAD ERROR]', err);
    }
  }

  async function loadAgendamentos() {
    try {
      const params = new URLSearchParams();
      if (currentStatus) params.append('status', currentStatus);
      if (searchQuery) params.append('busca', searchQuery);
      params.append('page', currentPage);
      params.append('limit', pageLimit);

      const url = `/api/admin/agendamentos?${params.toString()}`;
      const res = await fetch(url);

      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await res.json();

      if (!data.sucesso || !data.agendamentos || data.agendamentos.length === 0) {
        tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        updatePaginationUI(0, 0, 1);
        return;
      }

      if (emptyState) emptyState.style.display = 'none';
      renderTable(data.agendamentos);

      const total = data.totalRecords !== undefined ? data.totalRecords : data.total || data.agendamentos.length;
      totalPages = data.totalPages !== undefined ? data.totalPages : Math.ceil(total / pageLimit) || 1;
      updatePaginationUI(total, data.agendamentos.length, totalPages);
    } catch (err) {
      console.error('[AGENDAMENTOS LOAD ERROR]', err);
      showToast('Erro ao carregar lista de agendamentos.', 'error');
    }
  }

  function updatePaginationUI(totalRecords, displayedCount, maxPages) {
    if (!paginationInfo || !btnPagePrev || !btnPageNext) return;

    totalPages = Math.max(1, maxPages);
    if (pageCurrentIndicator) pageCurrentIndicator.textContent = currentPage;

    if (totalRecords === 0) {
      paginationInfo.textContent = 'Nenhum agendamento para exibir';
      btnPagePrev.disabled = true;
      btnPageNext.disabled = true;
      return;
    }

    paginationInfo.textContent = `Pagina ${currentPage} de ${totalPages} (${totalRecords} solicitacoes no total)`;
    btnPagePrev.disabled = currentPage <= 1;
    btnPageNext.disabled = currentPage >= totalPages;
  }

  if (btnPagePrev) {
    btnPagePrev.addEventListener('click', () => {
      if (currentPage > 1) {
        currentPage--;
        loadAgendamentos();
      }
    });
  }

  if (btnPageNext) {
    btnPageNext.addEventListener('click', () => {
      if (currentPage < totalPages) {
        currentPage++;
        loadAgendamentos();
      }
    });
  }

  function renderTable(items) {
    tbody.innerHTML = items
      .map((item) => {
        const formattedDate = formatDate(item.data);
        const waPhone = formatPhoneForWhatsApp(item.telefone);
        const waMessage = encodeURIComponent(
          `Ola, ${item.nome}! Aqui e da equipe Puro Luxo Grife. Referente a sua solicitacao de ${item.tipo} para o dia ${formattedDate} as ${item.horario}.`
        );
        const waUrl = `https://wa.me/${waPhone}?text=${waMessage}`;

        let statusBadgeClass = 'badge-pendente';
        let statusLabel = 'Pendente';

        if (item.status === 'confirmado') {
          statusBadgeClass = 'badge-confirmado';
          statusLabel = 'Confirmado';
        } else if (item.status === 'cancelado') {
          statusBadgeClass = 'badge-cancelado';
          statusLabel = 'Cancelado';
        }

        const atualizadoFormatado = item.atualizado_em ? formatDateTime(item.atualizado_em) : '-';

        return `
          <tr data-id="${item.id}">
            <td>
              <strong style="color: var(--text-primary); font-size: 14px;">${formattedDate}</strong><br>
              <span style="color: var(--text-secondary); font-size: 12px;">Horario: ${item.horario}</span>
            </td>
            <td>
              <strong style="color: var(--text-primary);">${escapeHtml(item.nome)}</strong><br>
              <span style="color: var(--text-secondary); font-size: 12px;">${escapeHtml(item.email)}</span><br>
              <span style="color: var(--text-muted); font-size: 12px;">${escapeHtml(item.telefone)}</span>
            </td>
            <td>
              <span style="color: var(--accent-gold); font-weight: 500;">${escapeHtml(item.tipo)}</span>
            </td>
            <td>
              <span style="color: var(--text-secondary); font-size: 12px;">${escapeHtml(item.observacoes || 'Nenhuma')}</span>
            </td>
            <td>
              <span class="badge ${statusBadgeClass}">${statusLabel}</span>
            </td>
            <td>
              <span style="color: var(--text-muted); font-size: 11px;">${atualizadoFormatado}</span>
            </td>
            <td>
              <div class="actions-cell">
                <a href="${waUrl}" target="_blank" rel="noopener" class="action-btn btn-whatsapp" title="Abrir conversa no WhatsApp">
                  WhatsApp
                </a>

                ${
                  item.status !== 'confirmado'
                    ? `<button type="button" class="action-btn btn-action-confirm" data-action="status" data-status="confirmado" data-id="${item.id}">Confirmar</button>`
                    : ''
                }

                ${
                  item.status !== 'cancelado'
                    ? `<button type="button" class="action-btn btn-action-cancel" data-action="status" data-status="cancelado" data-id="${item.id}">Cancelar</button>`
                    : ''
                }

                ${
                  item.status !== 'pendente'
                    ? `<button type="button" class="action-btn btn-secondary" data-action="status" data-status="pendente" data-id="${item.id}">Pendente</button>`
                    : ''
                }

                <button type="button" class="action-btn btn-action-delete" data-action="delete" data-id="${item.id}" title="Excluir agendamento">
                  Excluir
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Delegacao de eventos na tabela de agendamentos
  if (tbody) {
    tbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-action]');
      if (!btn) return;
      e.preventDefault();

      const action = btn.getAttribute('data-action');
      const id = btn.getAttribute('data-id');

      const originalHtml = btn.innerHTML;
      btn.disabled = true;
      btn.innerHTML = '<span>...</span>';

      try {
        if (action === 'status') {
          const status = btn.getAttribute('data-status');
          await updateItemStatus(id, status);
        } else if (action === 'delete') {
          await deleteItem(id);
        }
      } finally {
        if (btn && btn.isConnected) {
          btn.disabled = false;
          btn.innerHTML = originalHtml;
        }
      }
    });
  }

  async function updateItemStatus(id, status) {
    try {
      const res = await fetch(`/api/admin/agendamentos/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        showToast(data.mensagem || 'Falha ao atualizar status.', 'error');
        return;
      }

      showToast(`Status atualizado para '${status}'.`, 'success');
      loadStats();
      loadAgendamentos();
    } catch (err) {
      console.error('[STATUS UPDATE ERROR]', err);
      showToast('Erro de conexao ao atualizar status.', 'error');
    }
  }

  async function deleteItem(id) {
    if (!confirm('Deseja realmente excluir este registro de agendamento?')) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/agendamentos/${id}`, {
        method: 'DELETE',
      });

      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        showToast(data.mensagem || 'Falha ao excluir registro.', 'error');
        return;
      }

      showToast('Agendamento excluido com sucesso.', 'success');
      loadStats();
      loadAgendamentos();
    } catch (err) {
      console.error('[DELETE ERROR]', err);
      showToast('Erro ao excluir agendamento.', 'error');
    }
  }

  // Filtros por Tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.getAttribute('data-status');
      currentPage = 1;
      loadAgendamentos();
    });
  });

  // Busca com Debounce
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchQuery = e.target.value;
        currentPage = 1;
        loadAgendamentos();
      }, 300);
    });
  }

  // =========================================================================
  // MODULO: GESTAO DE SERVICOS & OPCOES (CRUD)
  // =========================================================================

  let opcoesData = [];

  async function loadOpcoes() {
    if (!opcoesTbody) return;
    try {
      const res = await fetch('/api/admin/opcoes');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (!data.sucesso || !data.opcoes || data.opcoes.length === 0) {
        opcoesTbody.innerHTML = '';
        if (opcoesEmptyState) opcoesEmptyState.style.display = 'block';
        opcoesData = [];
        return;
      }

      if (opcoesEmptyState) opcoesEmptyState.style.display = 'none';
      opcoesData = data.opcoes;
      renderOpcoesTable(opcoesData);
    } catch (err) {
      console.error('[OPCOES LOAD ERROR]', err);
      showToast('Erro ao carregar lista de servicos.', 'error');
    }
  }

  function renderOpcoesTable(opcoes) {
    opcoesTbody.innerHTML = opcoes
      .map((op) => {
        const isAtivo = op.ativo === 1 || op.ativo === true;
        const statusBadge = isAtivo
          ? '<span class="badge badge-confirmado">Ativo</span>'
          : '<span class="badge badge-inativo">Inativo</span>';

        const toggleBtnLabel = isAtivo ? 'Desativar' : 'Ativar';
        const toggleBtnClass = isAtivo ? 'btn-action-cancel' : 'btn-action-confirm';

        return `
          <tr data-opcao-id="${op.id}">
            <td style="color: var(--text-muted); font-size: 13px;">#${op.id}</td>
            <td>
              <strong style="color: var(--text-primary); font-size: 14px;">${escapeHtml(op.titulo)}</strong><br>
              <span style="color: var(--text-secondary); font-size: 12px;">${escapeHtml(op.descricao || 'Sem descricao')}</span>
            </td>
            <td>
              <span style="color: var(--text-secondary); font-size: 13px;">${escapeHtml(op.duracao || '-')}</span>
            </td>
            <td>
              <span style="color: var(--accent-gold); font-weight: 600; font-size: 13px;">${escapeHtml(op.preco || '-')}</span>
            </td>
            <td>${statusBadge}</td>
            <td>
              <div class="actions-cell">
                <button type="button" class="action-btn btn-secondary" data-opcao-action="edit" data-id="${op.id}">
                  Editar
                </button>
                <button type="button" class="action-btn ${toggleBtnClass}" data-opcao-action="toggle" data-id="${op.id}">
                  ${toggleBtnLabel}
                </button>
              </div>
            </td>
          </tr>
        `;
      })
      .join('');
  }

  // Delegacao de cliques na tabela de opcoes
  if (opcoesTbody) {
    opcoesTbody.addEventListener('click', async (e) => {
      const btn = e.target.closest('button[data-opcao-action]');
      if (!btn) return;
      e.preventDefault();

      const action = btn.getAttribute('data-opcao-action');
      const id = btn.getAttribute('data-id');

      if (action === 'edit') {
        const op = opcoesData.find((o) => String(o.id) === String(id));
        if (op) openModalOpcao(op);
      } else if (action === 'toggle') {
        await toggleOpcao(id, btn);
      }
    });
  }

  async function toggleOpcao(id, btn) {
    const originalText = btn.textContent;
    btn.disabled = true;
    btn.textContent = '...';

    try {
      const res = await fetch(`/api/admin/opcoes/${id}/toggle`, { method: 'PATCH' });
      const data = await res.json();
      if (!res.ok || !data.sucesso) {
        showToast(data.mensagem || 'Falha ao alterar status da opcao.', 'error');
        return;
      }

      showToast(data.mensagem || 'Status da opcao atualizado com sucesso.', 'success');
      loadOpcoes();
    } catch (err) {
      console.error('[TOGGLE OPCAO ERROR]', err);
      showToast('Erro ao atualizar status da opcao.', 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  // Abertura e Fechamento do Modal de Opcao
  function openModalOpcao(op = null) {
    if (!modalOpcao) return;

    if (op) {
      modalOpcaoTitle.textContent = 'Editar Servico VIP';
      inputOpcaoId.value = op.id;
      inputOpcaoTitulo.value = op.titulo || '';
      inputOpcaoDescricao.value = op.descricao || '';
      inputOpcaoPreco.value = op.preco || '';
      inputOpcaoDuracao.value = op.duracao || '';
      inputOpcaoAtivo.checked = op.ativo === 1 || op.ativo === true;
    } else {
      modalOpcaoTitle.textContent = 'Novo Servico VIP';
      inputOpcaoId.value = '';
      formOpcao.reset();
      inputOpcaoAtivo.checked = true;
    }

    modalOpcao.classList.add('is-open');
    modalOpcao.setAttribute('aria-hidden', 'false');
  }

  function closeModalOpcao() {
    if (!modalOpcao) return;
    modalOpcao.classList.remove('is-open');
    modalOpcao.setAttribute('aria-hidden', 'true');
    formOpcao.reset();
  }

  if (btnNovaOpcao) {
    btnNovaOpcao.addEventListener('click', () => openModalOpcao(null));
  }

  if (modalOpcaoClose) {
    modalOpcaoClose.addEventListener('click', closeModalOpcao);
  }

  if (modalOpcaoCancel) {
    modalOpcaoCancel.addEventListener('click', closeModalOpcao);
  }

  if (modalOpcao) {
    modalOpcao.addEventListener('click', (e) => {
      if (e.target === modalOpcao) closeModalOpcao();
    });
  }

  // Submissao do Formulario de Servico (Criar / Editar)
  if (formOpcao) {
    formOpcao.addEventListener('submit', async (e) => {
      e.preventDefault();

      const id = inputOpcaoId.value;
      const titulo = inputOpcaoTitulo.value.trim();
      const descricao = inputOpcaoDescricao.value.trim();
      const preco = inputOpcaoPreco.value.trim();
      const duracao = inputOpcaoDuracao.value.trim();
      const ativo = inputOpcaoAtivo.checked;

      if (!titulo) {
        showToast('Informe o titulo do servico.', 'error');
        return;
      }

      btnSaveOpcao.disabled = true;
      btnSaveOpcao.textContent = 'Salvando...';

      try {
        const method = id ? 'PUT' : 'POST';
        const url = id ? `/api/admin/opcoes/${id}` : '/api/admin/opcoes';

        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ titulo, descricao, preco, duracao, ativo }),
        });

        const data = await res.json();

        if (!res.ok || !data.sucesso) {
          showToast(data.mensagem || 'Falha ao salvar servico.', 'error');
          return;
        }

        showToast(data.mensagem || 'Servico salvo com sucesso.', 'success');
        closeModalOpcao();
        loadOpcoes();
      } catch (err) {
        console.error('[SAVE OPCAO ERROR]', err);
        showToast('Erro de conexao ao salvar servico.', 'error');
      } finally {
        btnSaveOpcao.disabled = false;
        btnSaveOpcao.textContent = 'Salvar Servico';
      }
    });
  }

  // =========================================================================
  // INICIALIZACAO
  // =========================================================================
  checkAuth().then((authenticated) => {
    if (authenticated) {
      loadStats();
      loadAgendamentos();
    }
  });
});
