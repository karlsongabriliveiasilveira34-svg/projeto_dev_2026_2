document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('login-form');
  const emailInput = document.getElementById('email');
  const senhaInput = document.getElementById('senha');
  const btnSubmit = document.getElementById('btn-submit');
  const alertBox = document.getElementById('login-alert');

  function showAlert(message, type = 'error') {
    alertBox.textContent = message;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = 'block';
  }

  function hideAlert() {
    alertBox.style.display = 'none';
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    hideAlert();

    const email = emailInput.value.trim();
    const senha = senhaInput.value;

    if (!email || !senha) {
      showAlert('Preencha o e-mail e a senha.');
      return;
    }

    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Autenticando...';

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, senha }),
      });

      const data = await response.json();

      if (!response.ok || !data.sucesso) {
        showAlert(data.mensagem || 'Falha na autenticacao. Verifique suas credenciais.');
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Acessar Painel';
        return;
      }

      showAlert('Autenticado com sucesso. Redirecionando...', 'success');
      setTimeout(() => {
        window.location.href = '/admin';
      }, 500);
    } catch (err) {
      console.error('[LOGIN NETWORK ERROR]', err);
      showAlert('Nao foi possivel conectar ao servidor. Tente novamente em instantes.');
      btnSubmit.disabled = false;
      btnSubmit.textContent = 'Acessar Painel';
    }
  });
});
