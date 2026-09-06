# Registro de Decisões Técnicas e Metodologia (DECISOES.md)

Este documento detalha as decisões arquiteturais, respostas às perguntas obrigatórias do processo seletivo da **Mupi Systems**, trade-offs de engenharia, funcionalidades adicionais, testes automatizados e o processo de utilização de Inteligência Artificial no desenvolvimento do projeto **Puro Luxo Grife**.

---

## 1. Tema Escolhido e Domínio de Negócio

- **Negócio:** Puro Luxo Grife (Moda Masculina de Alto Padrão e Curadoria em Montes Claros - MG).
- **Conceito do "Registro":** Agendamento de Atendimento VIP & Consultoria de Imagem/Alfaiataria.
- **Conceito da "Opção Gerenciável":** Catálogo de Serviços VIP (Consultoria de Imagem, Prova Privada sob Medida, Personal Shopper e Atendimento VIP Online para Envios Nacionais).
- **Justificativa:** Em vez de utilizar um tema genérico ou abstrato de tutorial (como lista de tarefas ou blog), optou-se por um modelo de negócio real de alfaiataria e moda masculina de luxo. A experiência exige agendamento prévio, seleção dinâmica de serviços pelo cliente e triagem imediata pela equipe comercial da loja.

---

## 2. Respostas às Perguntas Obrigatórias do Edital

### Pergunta 1: *"Como fica o painel quando ainda não chegou nenhum registro?"*

**Comportamento Arquitetado e Implementado:**
1. **Cards de Métricas:** Os 4 cards de estatísticas no topo do dashboard exibem com elegância o valor numérico `0` (*Total de Solicitações: 0*, *Pendentes: 0*, *Confirmados: 0*, *Cancelados: 0*), sem quebras de layout, sem exibir `null` ou `undefined`.
2. **Componente de Estado Vazio (`empty-state`):** A tabela de agendamentos é ocultada e substituída por um componente visual refinado no design system da grife:
   - Título: *"Nenhum registro encontrado"*
   - Descrição: *"Não existem agendamentos para o filtro ou termo de busca selecionado."*
3. **Barra de Paginação:** A paginação se adapta automaticamente exibindo *"Nenhum agendamento para exibir"*, com o indicador fixado em `1` e ambos os botões de navegação (*Anterior* e *Próximo*) desabilitados (`disabled`).
4. **Resiliência a Filtros e Buscas:** Quando há registros cadastrados mas uma busca por texto ou filtro de status não retorna nenhum resultado, o mesmo estado vazio é renderizado sem recarregar a página, orientando o usuário com clareza.

### Pergunta 2: *"O que acontece com os registros de uma opção que o admin desativou?"*

**Decisão de Engenharia (Soft-Disable Pattern):**
1. **Preservação Histórica e Integridade:** Quando o administrador desativa uma opção de atendimento (ex: *"Prova Privada & Ajuste Sob Medida"*), os registros de agendamentos já realizados anteriormente com essa opção **permanecem intactos** no banco de dados e visíveis no painel administrativo com seus dados e status originais.
2. **Ocultamento no Formulário Público:** A desativação atua como um *soft-disable* no banco (`ativa = false / 0`). A API pública (`GET /api/opcoes`) filtra estritamente `WHERE ativa = true / 1`. Dessa forma, clientes na página inicial não conseguem mais selecionar ou agendar novos atendimentos para o serviço desativado.
3. **Rastreabilidade e Reativação:** No painel administrativo, na aba *"Serviços & Opções"*, a opção desativada é exibida com o badge visual cinza claro `Inativo` e o botão de ação *"Ativar"*, permitindo que a gerência reative o serviço a qualquer momento com um único clique, sem perda de histórico financeiro ou estatístico.

---

## 3. Escolha da Stack e Arquitetura

### Tecnologias Escolhidas:
- **Backend:** Node.js com Express.js (arquitetura modular em camadas: Rotas, Controladores, Middlewares, Utilitários e Configuração).
- **Banco de Dados:** PostgreSQL nativo com driver `pg` (pool de conexões otimizado) + **Fallback transparente para SQLite local** (`database.sqlite`).
- **Segurança & Privacidade:** Criptografia simétrica **AES-256-GCM** para dados sensíveis em repouso, Blind Index determinístico via HMAC-SHA256 para consultas indexadas, `bcryptjs` para senhas com salt rounds, `express-rate-limit`, `helmet` e `express-session` com cookies `HttpOnly` e `SameSite=Lax`.
- **Frontend:** HTML5 Semântico, Vanilla CSS Moderno e Vanilla JavaScript (Zero dependências de build, zero transpilers, performance máxima).
- **Diretriz de Design & Identidade Visual:** Estilo editorial de luxo (serifas *Instrument Serif*, sans-serif *Manrope*, paleta carvão/ouro `#C5A880`, SVGs monocromáticos e **política estrita de ZERO EMOJIS** para preservar o tom sóbrio de alfaiataria fina).

### Ganhos da Escolha:
1. **Zero Fricção para Avaliação:** A aplicação roda instantaneamente com `npm install` e `npm start`. Caso o avaliador não queira subir um container Docker de PostgreSQL, o sistema detecta a ausência e ativa imediatamente o SQLite local pré-configurado sem exigir nenhuma alteração manual de código ou arquivo de configuração.
2. **Conformidade de Privacidade (LGPD):** E-mails de clientes não ficam expostos em texto plano no banco de dados. Mesmo que ocorra um vazamento do arquivo de banco ou dump SQL, os dados estão protegidos por AES-256-GCM.
3. **Desempenho e Acessibilidade:** Ausência de SPAs pesadas resulta em carregamento abaixo de 200ms e transições fluidas.

### Perdas / Trade-offs:
1. **Manipulação Manual de Estado no DOM:** A escolha por Vanilla JS exigiu estruturação rigorosa de funções de renderização e delegação de eventos para garantir reatividade sem recorrer a bibliotecas de componentes como React ou Vue.

---

## 4. O Que Adicionamos Além do Que Foi Pedido

1. **Gestão Dinâmica de Opções pelo Painel (Requisito 10):**
   - Módulo completo de *"Serviços & Opções"* com listagem, criação de novas opções via modal, edição de dados (título, descrição, preço, duração) e alternância instantânea de status (*Ativar / Desativar*).
2. **Ação Direta no WhatsApp com Mensagem Personalizada:**
   - Cada linha de agendamento no painel conta com um botão oficial do WhatsApp que abre o chat do cliente já preenchido com a mensagem de boas-vindas da Puro Luxo, incluindo nome, serviço agendado, data e horário.
3. **Controle de Paginação:**
   - Navegação paginada com limites por página, indicador de página atual, cálculo de páginas totais e bloqueio de navegação nas bordas.
4. **Rastreamento de Modificação (`atualizado_em`):**
   - Cada alteração de status (para *Confirmado*, *Cancelado* ou *Pendente*) registra o timestamp exato da modificação, visível na tabela administrativa.
5. **Criptografia Simétrica + Blind Indexing:**
   - Implementação de nível de produção com AES-256-GCM para confidencialidade e HMAC-SHA256 para viabilizar buscas exatas indexadas no banco de dados.
6. **Proteção contra Força Bruta e Spam:**
   - Limitadores de requisição nos formulários públicos e nas tentativas de autenticação administrativa.

---

## 5. Estratégia de Testes Automatizados

O projeto conta com uma suíte de testes ponta a ponta implementada em `tests/runTests.js`, acionada através do comando padrão:
```bash
npm test
```

### Bateria de Testes (33 Asserções Aprovadas com 100% de Sucesso):
- **Grupo 1 (Rotas Públicas e Normalização de Segurança):**
  - Validação de status 200 em `/` e `/login`.
  - Redirecionamento 302 de usuários não autenticados de `/admin` para `/login`.
  - Normalização com redirecionamento 301 de rotas mascaradas (`/zpdasda/admin` -> `/admin`, `/zpdasda/login` -> `/login`, `/admin.html` -> `/admin`).
- **Grupo 2 (Validação e Criação de Agendamentos):**
  - Rejeição com status 400 para payloads vazios.
  - Rejeição com status 400 para e-mails sem formatação válida.
  - Rejeição com status 400 para datas passadas (bloqueio de agendamento retroativo).
  - Criação bem-sucedida (status 201) de agendamento válido, com verificação do status inicial `pendente`.
- **Grupo 3 (Catálogo de Opções de Atendimento):**
  - Verificação de resposta 200 na rota pública `/api/opcoes` e retorno dos serviços ativos.
- **Grupo 4 (Autenticação Administrativa e Sessão):**
  - Bloqueio com status 401 para requisições sem cookie nas rotas administrativas.
  - Rejeição com status 401 para credenciais incorretas.
  - Autenticação bem-sucedida com credenciais válidas e emissão do cookie `puroluxo.sid`.
  - Verificação de identidade ativa em `/api/auth/me`.
- **Grupo 5 (Operações Administrativas e Paginação):**
  - Listagem paginada (`currentPage`, `totalPages`, `totalRecords`).
  - Carregamento de métricas em `/api/admin/stats`.
  - Atualização de status para `confirmado` e validação da atualização do campo `atualizado_em`.
- **Grupo 6 (Gestão de Serviços e Opções):**
  - Listagem completa de serviços no painel admin.
  - Criação de novo serviço via `POST /api/admin/opcoes`.
  - Alternância de status via `PATCH /api/admin/opcoes/:id/toggle`.
  - Validação de que a opção desativada é imediatamente excluída da API pública `/api/opcoes`.
  - Limpeza e exclusão de registros de teste.

---

## 6. Utilização de Inteligência Artificial

### 1. O que foi delegado para a IA e o que foi feito/decidido manualmente:
- **Delegado para a IA:** Estruturação inicial do esqueleto de testes automatizados, sintaxe de consultas SQL multivariadas e auxílio na geração de código boilerplate para os endpoints do Express.
- **Feito/Decidido Manualmente:** Toda a conceituação da marca Puro Luxo Grife, a definição da política rígida de zero emojis para manter a identidade estética de alta costura, o design da experiência de WhatsApp em um clique, a arquitetura de fallback transparente PostgreSQL/SQLite e a modelagem do soft-disable para opções desativadas.

### 2. Situação em que a IA deu uma sugestão inadequada e o que foi feito no lugar:
- A IA inicialmente sugeriu usar componentes gráficos com emojis coloridos nos badges de status e toasts do painel (ex: ícones de calendário e check coloridos). A sugestão foi prontamente rejeitada por violar a estética sóbria e refinada exigida pelo nicho de moda masculina de luxo. No lugar, foram adotadas pílulas tipográficas com bordas sutis e contraste cromático elegante (verde esmeralda, âmbar e vermelho suave).

### 3. Decisão tomada contra a sugestão da IA:
- A IA sugeriu a instalação de bibliotecas externas pesadas (como TypeORM, Prisma ou Sequelize) para gerenciar o banco de dados. A decisão técnica tomada foi recusar esses frameworks volumosos e implementar um cliente com `pg` nativo e fallback leve para `sqlite3`, mantendo a aplicação ultrarrápida, de baixo consumo de memória e auditável linha por linha.
