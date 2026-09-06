document.addEventListener('DOMContentLoaded', () => {
  let currentStatus = '';
  let searchQuery = '';
  let searchTimeout = null;

  // Elementos do DOM
  const userDisplay = document.getElementById('user-display');
  const btnLogout = document.getElementById('btn-logout');
  const statTotal = document.getElementById('stat-total');
  const statPendentes = document.getElementById('stat-pendentes');
  const statConfirmados = document.getElementById('stat-confirmados');
  const statCancelados = document.getElementById('stat-cancelados');
  const tabButtons = document.querySelectorAll('.tab-btn');
  const searchInput = document.getElementById('search-input');
  const tbody = document.getElementById('agendamentos-tbody');
  const emptyState = document.getElementById('empty-state');
  const toastContainer = document.getElementById('toast-container');

  // Sistema de Toast
  function showToast(message, type = 'success') {
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
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return dateStr;
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

  // Verificacao de Autenticacao
  async function checkAuth() {
    try {
      const response = await fetch('/api/auth/me');
      const data = await response.json();

      if (!response.ok || !data.autenticado) {
        window.location.href = '/login';
        return false;
      }

      if (data.usuario) {
        userDisplay.innerHTML = `Ola, <strong>${data.usuario.nome || data.usuario.email}</strong>`;
      }
      return true;
    } catch (err) {
      console.error('[AUTH CHECK ERROR]', err);
      window.location.href = '/login';
      return false;
    }
  }

  // Logout
  btnLogout.addEventListener('click', async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      window.location.href = '/login';
    } catch (err) {
      console.error('[LOGOUT ERROR]', err);
      window.location.href = '/login';
    }
  });

  // Carregar Metricas dos Cards
  async function loadStats() {
    try {
      const res = await fetch('/api/admin/stats');
      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }
      const data = await res.json();
      if (data.sucesso && data.stats) {
        statTotal.textContent = data.stats.total;
        statPendentes.textContent = data.stats.pendentes;
        statConfirmados.textContent = data.stats.confirmados;
        statCancelados.textContent = data.stats.cancelados;
      }
    } catch (err) {
      console.error('[STATS LOAD ERROR]', err);
    }
  }

  // Carregar Lista de Agendamentos
  async function loadAgendamentos() {
    try {
      const params = new URLSearchParams();
      if (currentStatus) params.append('status', currentStatus);
      if (searchQuery) params.append('busca', searchQuery);

      const url = `/api/admin/agendamentos?${params.toString()}`;
      const res = await fetch(url);

      if (res.status === 401) {
        window.location.href = '/login';
        return;
      }

      const data = await res.json();

      if (!data.sucesso || !data.agendamentos || data.agendamentos.length === 0) {
        tbody.innerHTML = '';
        emptyState.style.display = 'block';
        return;
      }

      emptyState.style.display = 'none';
      renderTable(data.agendamentos);
    } catch (err) {
      console.error('[AGENDAMENTOS LOAD ERROR]', err);
      showToast('Erro ao carregar lista de agendamentos.', 'error');
    }
  }

  // Renderizar Linhas da Tabela
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

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Delegacao de eventos para cliques em botoes da tabela
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

  // Atualizar Status (Global para o escopo do window)
  window.updateItemStatus = async (id, status) => {
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
  };

  // Excluir Registro
  window.deleteItem = async (id) => {
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
  };

  // Filtros por Tabs
  tabButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      currentStatus = btn.getAttribute('data-status');
      loadAgendamentos();
    });
  });

  // Busca com Debounce
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
      searchQuery = e.target.value;
      loadAgendamentos();
    }, 300);
  });

  // Inicializacao
  checkAuth().then((authenticated) => {
    if (authenticated) {
      loadStats();
      loadAgendamentos();
    }
  });
});
