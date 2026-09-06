# Puro Luxo Grife - Sistema de Agendamento VIP e Painel de Gestão

Sistema web completo para curadoria e agendamento de atendimentos exclusivos de moda masculina de alto padrão da **Puro Luxo Grife** (Montes Claros - MG), com persistência em banco de dados (**PostgreSQL** com fallback transparente para **SQLite** local), criptografia de dados sensíveis (**AES-256-GCM**), proteção por **Rate Limiting**, módulo de gestão dinâmica de serviços e painel administrativo protegido por autenticação de sessão.

Projeto desenvolvido para o desafio técnico da **Mupi Systems** (`mupisystems/projeto_estagio_2026_2`).

---

## 1. Visão Geral e Funcionalidades

### Página Pública (Visitante / Cliente):
- Apresentação editorial com curadoria, lookbook e coleções exclusivas da grife.
- Formulário interativo de solicitação de agendamento VIP com opções carregadas dinamicamente do banco de dados.
- Bloqueio de seleção de datas retroativas no cliente e no servidor.
- Máscara de telefone brasileira em tempo real `(38) 99999-9999` e validação de e-mail.
- Confirmação visual imediata através de modal desacoplado com resumo do agendamento e link direto para atendimento no WhatsApp da loja.
- Todos os agendamentos são persistidos no banco com status inicial **pendente**.

### Painel Administrativo (Gestão / Admin):
- Rota protegida `/admin` (redireciona visitantes não autenticados para `/login`).
- **Navegação Modular:** Alternância fluida entre a visualização de **Agendamentos VIP** e **Serviços & Opções**.
- **Dashboard de Métricas em Tempo Real:** Indicadores automáticos de Total de Solicitações, Pendentes, Confirmados e Cancelados.
- **Tabela Paginada de Agendamentos:** Controle de paginação com indicador da página atual e total de páginas, com ordenação por data.
- **Rastreamento de Alterações (`atualizado_em`):** Visualização do registro temporal da última alteração de status.
- **Ações Rápidas de Status:** Transição imediata entre *Confirmado*, *Cancelado* e *Pendente*.
- **Atendimento WhatsApp com 1 Clique:** Botão dedicado que abre a conversa no WhatsApp do cliente com mensagem profissional pré-formatada.
- **Filtros e Busca em Tempo Real:** Filtro rápido por status e campo de busca com debounce por nome, telefone ou serviço.
- **Gestão de Serviços & Opções (Requisito 10):**
  - Cadastro de novos serviços através de modal administrativo.
  - Edição de título, descrição, valor e duração estimada.
  - Alternância de visibilidade (*Ativar / Desativar*) que reflete instantaneamente no formulário da página inicial.

### Segurança e Privacidade:
- Criptografia de e-mails em repouso no banco de dados via algoritmo **AES-256-GCM** (conformidade com privacidade e LGPD).
- Blind Index com HMAC-SHA256 para buscas confidenciais sem expor a base.
- Proteção contra ataques de força bruta e spam com **Rate Limiting**.
- Senhas protegidas com hash criptográfico **bcrypt** com salt rounds.
- Proteção de cabeçalhos HTTP com **Helmet** e sessões com cookies seguros `HttpOnly` e `SameSite=Lax`.
- Normalização de segurança contra URLs mascaradas (`/zpdasda/admin` -> `/admin`, `/zpdasda/login` -> `/login`).

---

## 2. Tecnologias Utilizadas

- **Backend:** Node.js, Express.js
- **Banco de Dados:** PostgreSQL (driver nativo `pg` com pool de conexões) com fallback automático para SQLite (`sqlite3`)
- **Segurança & Autenticação:** `bcryptjs`, `express-session`, `express-rate-limit`, `helmet`, `crypto` (AES-256-GCM)
- **Frontend:** HTML5 Semântico, Vanilla CSS Moderno, Vanilla JavaScript Assíncrono (sem dependências de build)
- **Testes Automatizados:** Test runner nativo em Node.js com cobertura de rotas, segurança e regras de negócio
- **Orquestração de Containers:** Docker Compose

---

## 3. Pré-requisitos

- **Node.js:** Versão 18.0.0 ou superior ([Download Node.js](https://nodejs.org/))
- **PostgreSQL (Opcional):** Caso não queira utilizar PostgreSQL ou Docker, a aplicação inicializa automaticamente com SQLite local sem necessidade de nenhuma configuração adicional.

---

## 4. Passo a Passo para Rodar a Aplicação

### Passo 1: Clonar o repositório e acessar o diretório
```bash
git clone <url-do-seu-fork>
cd "amostra purogrife"
```

### Passo 2: Instalar as dependências
```bash
npm install
```

### Passo 3: Configurar as variáveis de ambiente
Copie o arquivo `.env.example` para `.env` (o arquivo padrão já vem pronto para execução imediata):
```bash
cp .env.example .env
```

### Passo 4: Subir o Banco de Dados

**Opção A (Com Docker Compose - PostgreSQL):**
```bash
docker compose up -d
```

**Opção B (Sem Docker / Fallback Automático com SQLite):**
Não é necessário rodar nenhum comando! O sistema detecta a ausência do PostgreSQL e ativa o banco SQLite local (`database.sqlite`) de forma 100% transparente.

### Passo 5: Inicializar o Banco e Popular Dados
Execute o script de inicialização e semeamento:
```bash
npm run db:init
npm run db:seed
```

### Passo 6: Iniciar o Servidor
```bash
npm start
```
Ou para modo de desenvolvimento:
```bash
npm run dev
```

A aplicação estará disponível em:
**http://localhost:3000**

---

## 5. Execução dos Testes Automatizados

O projeto inclui uma suíte completa de testes automatizados ponta a ponta que valida segurança, validações de formulário, criação de agendamentos, autenticação administrativa, paginação e o gerenciamento de serviços:

```bash
npm test
```

*Todos os 33 testes são executados e exibem um relatório limpo no terminal.*

---

## 6. Credenciais de Acesso ao Painel Administrativo

- **URL de Login:** [http://localhost:3000/login](http://localhost:3000/login)
- **Painel:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **E-mail:** `admin@puroluxo.com`
- **Senha:** `admin123`

---

## 7. Scripts Disponíveis no `package.json`

| Comando | Descrição |
| :--- | :--- |
| `npm start` | Inicia o servidor Express na porta configurada (padrão: 3000). |
| `npm run dev` | Inicia o servidor em modo de desenvolvimento. |
| `npm test` | Executa a suíte de testes automatizados ponta a ponta. |
| `npm run db:init` | Prepara as tabelas e índices no banco de dados. |
| `npm run db:seed` | Insere o usuário administrador padrão e dados iniciais de demonstração. |

---

## 8. Estrutura de Pastas

```
├── .env.example               # Modelo de configuração de ambiente
├── docker-compose.yml         # Container PostgreSQL para execução local
├── package.json               # Dependências e scripts de execução
├── server.js                  # Ponto de entrada do servidor Express
├── index.html                 # Página pública com agendamento VIP
├── styles.css                 # Estilos da landing page pública
├── script.js                  # Lógica pública e carregamento dinâmico de opções
├── DECISOES.md                # Respostas ao edital, decisões técnicas e uso de IA
├── README.md                  # Documentação completa do projeto
├── tests/
│   └── runTests.js            # Bateria oficial de testes automatizados
├── public/
│   ├── admin.html             # Painel de gestão (Agendamentos e Serviços)
│   ├── login.html             # Tela de autenticação administrativa
│   ├── css/
│   │   └── admin.css          # Estilos do painel de gestão e tela de login
│   └── js/
│       ├── admin.js           # Lógica do painel (paginação, métricas, CRUD de opções)
│       └── login.js           # Lógica de autenticação e redirecionamento
└── src/
    ├── config/
    │   └── db.js              # Gerenciador dual PostgreSQL / SQLite
    ├── controllers/
    │   ├── agendamentoController.js # CRUD, paginação e métricas de agendamentos
    │   ├── authController.js        # Autenticação e controle de sessão
    │   └── opcaoController.js       # CRUD e controle de ativação de serviços
    ├── middleware/
    │   └── auth.js            # Guards de sessão para rotas e páginas
    ├── routes/
    │   ├── adminRoutes.js     # Rotas protegidas de gestão
    │   ├── agendamentoRoutes.js # Rota pública de agendamento
    │   ├── authRoutes.js      # Rotas de login e logout
    │   └── opcaoRoutes.js     # Rota pública de catálogo de opções
    ├── scripts/
    │   ├── initDb.js          # Criação de esquemas e tabelas
    │   └── seed.js            # Semeamento de administrador e serviços VIP
    └── utils/
        ├── crypto.js          # Criptografia AES-256-GCM e blind indexing
        └── rateLimiter.js     # Limitadores de taxa para segurança de endpoints
```
