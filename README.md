# Puro Luxo Grife - Sistema de Agendamento VIP e Painel de Gestao

Sistema web completo para curadoria e agendamento de atendimentos exclusivos de moda masculina de alto padrao da **Puro Luxo Grife** (Montes Claros - MG), com persistencia em **PostgreSQL**, criptografia de dados sensiveis (**AES-256-GCM**), protecao por **Rate Limiting** e painel administrativo protegido por autenticacao de sessao.

Projeto desenvolvido para o desafio tecnico `mupisystems/projeto_estagio_2026_2`.

---

## 1. Visao Geral e Funcionalidades

### Pagina Publica (Visitante / Cliente):
- Apresentacao editorial de curadoria, lookbook e colecoes da Puro Luxo Grife.
- Formulario interativo de solicitacao de agendamento VIP com selecao de servicos, data, horario e observacoes.
- Mascara de telefone em tempo real e validacao de dados.
- Confirmacao visual imediata via modal com resumo do agendamento e link direto para contato no WhatsApp da loja.
- O registro e persistido no PostgreSQL com status inicial `pendente`.

### Painel Administrativo (Gestao / Admin):
- Rota protegida `/admin` (redireciona visitantes nao autenticados para `/login`).
- Dashboard com cards de metricas em tempo real (Total de Solicitacoes, Pendentes, Confirmados, Cancelados).
- Tabela de registros ordenada por data, com status visualmente destacado por badges coloridas.
- Acoes rapidas de alteracao de status: Confirmar, Cancelar ou reabrir como Pendente.
- Acao Direta no WhatsApp: botao que abre a conversa no WhatsApp do cliente com mensagem personalizada pre-formatada.
- Filtros por status e campo de busca dinamico em tempo real por nome, telefone ou servico.
- Encerramento seguro de sessao (Logout).

### Seguranca e Privacidade:
- Criptografia de e-mails em repouso no PostgreSQL via algoritmo **AES-256-GCM** (conformidade com privacidade e LGPD).
- Blind Index com HMAC-SHA256 para permitir buscas confidenciais sem descriptografar a base inteira.
- Protecao contra abuso e spam via **Rate Limiting** no formulario publico e na tela de login.
- Senhas de administradores protegidas com hash criptografico **bcrypt**.
- Protecao de cabecalhos HTTP com **Helmet** e sessoes HTTP-only.

---

## 2. Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL (Driver nativo `pg` com connection pooling)
- **Seguranca & Autenticacao:** `bcryptjs`, `express-session`, `express-rate-limit`, `helmet`, `crypto` (AES-256-GCM)
- **Frontend:** HTML5 Semantico, Vanilla CSS Moderno, Vanilla JavaScript Assincrono
- **Orquestracao de Containers:** Docker Compose

---

## 3. Pre-requisitos

- **Node.js:** Versao 18.0.0 ou superior ([Download Node.js](https://nodejs.org/))
- **PostgreSQL:** Instancia local ativa **OU** Docker / Docker Desktop para subir o container PostgreSQL fornecido.

---

## 4. Passo a Passo para Rodar a Aplicacao

### Passo 1: Clonar o repositorio e entrar na pasta
```bash
git clone <url-do-seu-fork>
cd "amostra purogrife"
```

### Passo 2: Instalar as dependencias
```bash
npm install
```

### Passo 3: Configurar as variaveis de ambiente
Copie o arquivo `.env.example` para `.env` (o `.env` padrao ja vem pre-configurado para ambiente local/Docker):
```bash
cp .env.example .env
```

### Passo 4: Subir o PostgreSQL

**Opcao A (Recomendada - Docker Compose):**
```bash
docker compose up -d
```
*O container PostgreSQL sera iniciado na porta 5432 com o banco `puroluxo_db`.*

**Opcao B (PostgreSQL ja instalado na maquina):**
Certifique-se de que o PostgreSQL esta em execucao e configure as credenciais no arquivo `.env`.

### Passo 5: Inicializar o Banco e Popular Dados de Teste
Execute o script de seed para criar as tabelas, o usuario administrador e registros iniciais:
```bash
npm run db:seed
```

### Passo 6: Iniciar o Servidor
```bash
npm start
```

A aplicacao estara disponivel em:
**http://localhost:3000**

---

## 5. Credenciais de Acesso ao Painel Administrativo

- **URL de Login:** [http://localhost:3000/login](http://localhost:3000/login)
- **E-mail:** `admin@puroluxo.com`
- **Senha:** `admin123`

---

## 6. Scripts Disponiveis

| Comando | Descricao |
| :--- | :--- |
| `npm start` | Inicia o servidor Express em modo de producao/padrao. |
| `npm run dev` | Inicia o servidor Express para desenvolvimento local. |
| `npm run db:init` | Executa a criacao das tabelas e indices no PostgreSQL. |
| `npm run db:seed` | Cria as tabelas, o usuario admin inicial e insere agendamentos de exemplo. |

---

## 7. Estrutura de Pastas

```
├── .env.example               # Modelo de configuracao de ambiente
├── docker-compose.yml         # Container PostgreSQL para execucao local
├── package.json               # Dependencias e scripts de execucao
├── server.js                  # Ponto de entrada do servidor Express
├── index.html                 # Pagina publica com formulario de agendamento VIP
├── styles.css                 # Estilos da landing page publica
├── script.js                  # Comportamentos da landing page e envio do formulario
├── DECISOES.md                # Registro de decisoes tecnicas e uso de IA
├── README.md                  # Documentacao de execucao e instalacao
├── public/
│   ├── admin.html             # Painel de gestao de agendamentos
│   ├── login.html             # Tela de autenticacao de administrador
│   ├── css/
│   │   └── admin.css          # Estilos do painel de gestao e tela de login
│   └── js/
│       ├── admin.js           # Logica assincrona do painel (metricas, filtros, acoes)
│       └── login.js           # Logica de autenticacao e redirecionamento
└── src/
    ├── config/
    │   └── db.js              # Pool de conexao PostgreSQL
    ├── controllers/
    │   ├── agendamentoController.js # CRUD e metricas de agendamentos
    │   └── authController.js        # Autenticacao e controle de sessao
    ├── middleware/
    │   └── auth.js            # Guards de sessao para rotas e paginas
    ├── routes/
    │   ├── adminRoutes.js     # Rotas protegidas de gestao
    │   ├── agendamentoRoutes.js # Rota publica de agendamento
    │   └── authRoutes.js      # Rotas de login e logout
    ├── scripts/
    │   ├── initDb.js          # Criacao de esquemas e tabelas
    │   └── seed.js            # Semeamento de administrador e dados de teste
    └── utils/
        ├── crypto.js          # Criptografia AES-256-GCM e blind indexing
        └── rateLimiter.js     # Limitadores de taxa para seguranca de endpoints
```
