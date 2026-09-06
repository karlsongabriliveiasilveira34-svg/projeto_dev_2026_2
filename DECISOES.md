# Registro de Decisoes Tecnicas e Metodologia (DECISOES.md)

Este documento detalha as decisoes arquiteturais, trade-offs de engenharia, funcionalidades extras adicionadas, escopo cortado conscientemente e o processo de utilizacao de Inteligencia Artificial no desenvolvimento do projeto **Puro Luxo Grife**.

---

## 1. Tema Escolhido e Dominio de Negocio

- **Negocio:** Puro Luxo Grife (Curadoria e Moda Masculina de Alto Padrao em Montes Claros - MG).
- **Conceito do "Registro":** Agendamento de Atendimento VIP & Consultoria de Estilo.
- **Justificativa:** Em vez de utilizar um tema generico ou abstrato de tutorial, foi escolhido um caso de uso real de comercio e consultoria de vestuario masculino de luxo. A experiencia de atendimento exclusivo exige agendamento previo de horarios, definicao da intencao do cliente (consultoria, ajuste sob medida ou compra assistida) e contato agil por parte da equipe para confirmacao.

---

## 2. Escolha da Stack e Arquitetura

### Tecnologias Escolhidas:
- **Backend:** Node.js com Express.js
- **Banco de Dados:** PostgreSQL (Driver nativo `pg` com pool de conexoes)
- **Seguranca & Privacidade:** Criptografia simetrica AES-256-GCM (`crypto`), Blind Index HMAC-SHA256, `bcryptjs`, `express-rate-limit`, `helmet` e `express-session`
- **Frontend:** HTML5 Semantico, Vanilla CSS e Vanilla JavaScript Moderno (sem dependencias de build/transpilers)
- **Orquestracao:** Docker Compose para provisionamento instantaneo do banco de dados

### Ganhos da Escolha:
1. **Zero Friccao de Build:** O projeto nao necessita de etapas demoradas de build de frontend (Webpack, Vite ou Next.js), rodando diretamente com `npm start`.
2. **Robustez e Integridade com PostgreSQL:** O PostgreSQL garante controle transacional rigido, tipos de dados precisos e indices eficientes em relacao a bancos NoSQL ou em memoria.
3. **Privacidade e Conformidade por Padrao:** Criptografia AES-256-GCM garante que dados sensiveis (como e-mails de clientes) fiquem ilegiveis mesmo em caso de vazamento direto da base de dados.
4. **Facilidade de Avaliacao:** A utilizacao de `docker-compose.yml` permite que qualquer membro da banca avaliadora suba o banco com um unico comando (`docker compose up -d`).

### Perdas / Trade-offs:
1. **Necessidade de Servico de Banco de Dados:** Diferente de um SQLite em arquivo unico, o PostgreSQL exige um processo ou container ativo, o que requer uma etapa previa de subida de servico documentada no `README.md`.
2. **Sem Reatividade de Framework:** A interface utiliza manipulacao direta do DOM (Vanilla JS), o que exigiu estruturacao cuidadosa de funcoes modulares para manter o codigo limpo sem a ajuda de estados reativos como React ou Vue.

---

## 3. O Que Adicionamos Alem do Que Foi Pedido

1. **Acao "WhatsApp com 1 Clique" no Painel:**
   - No painel administrativo, cada agendamento possui um botao que gera o link oficial do WhatsApp com mensagem de atendimento pre-formatada contendo o nome do cliente, o servico solicitado, a data e o horario, permitindo que a equipe inicie o atendimento com um unico toque.
2. **Criptografia Simetrica AES-256-GCM para E-mails:**
   - Os e-mails dos clientes sao criptografados em repouso no PostgreSQL com vetor de inicializacao (IV) unico e tag de autenticacao de 16 bytes. A aplicacao descriptografa os dados estritamente em memoria no backend quando o administrador autenticado visualiza a listagem.
3. **Blind Index Determinictico para Buscas (HMAC-SHA256):**
   - Foi criada uma coluna indexada com hash deterministico do e-mail, permitindo que buscas pelo e-mail exato continuem funcionando sem necessidade de descriptografar toda a tabela no banco.
4. **Protecao por Rate Limiting:**
   - Adicionada protecao contra spam e ataques de forca bruta nos endpoints de envio de formulario e na tela de login administrativo (`express-rate-limit`).
5. **Dashboard com Cards de Metricas no Painel:**
   - Contadores em tempo real para Total de Agendamentos, Pendentes, Confirmados e Cancelados.
6. **Filtros por Status e Busca em Tempo Real:**
   - Alternancia rapida entre status (Todos, Pendentes, Confirmados, Cancelados) e busca com debounce.

---

## 4. O Que Decidimos NAO Fazer e Por Que

1. **Envio Real de E-mails/SMS via APIs Pagas (SendGrid/Twilio):**
   - *Motivo:* Exigiria que o avaliador criasse contas em servicos terceiros e configurasse chaves secretas de API pagas no `.env` para conseguir testar a aplicacao. Foi substituido pelo acionamento direto via link oficial do WhatsApp, que e gratuito, instantaneo e funciona perfeitamente em qualquer maquina.
2. **Frontend SPA Complexo (React / Next.js / Angular):**
   - *Motivo:* A landing page publica e o painel ja possuem desempenho excepcional e controle total com Vanilla JS e CSS. Introduzir um toolchain pesado apenas aumentaria o tempo de instalacao e a complexidade de execucao do teste sem agregar valor funcional ao negocio.

---

## 5. Dificuldades Encontradas

- **Criptografia com Busca Dinamica:** A implementacao de criptografia simetrica (AES-256-GCM) com IV aleatorio impede o uso direto de clausulas SQL `LIKE` ou `ILIKE` no campo de e-mail. Para contornar essa limitacao sem expor os dados, foi estruturado um mecanismo de *Blind Index* (hash HMAC SHA-256) armazenado em coluna indexada paralela para buscas exatas, complementado com filtragem em memoria dos demais campos textuais.

---

## 6. Utilizacao de Inteligencia Artificial

### 1. O que foi delegado para a IA e o que foi feito/decidido a mao:
- **Delegado para a IA:** Geracao do boilerplate inicial das rotas REST no Express, definicao da sintaxe dos comandos SQL no script de migracao e estruturacao das classes de criptografia usando os modulos nativos do Node.js.
- **Feito/Decidido a Mao:** Toda a arquitetura do dominio de negocio (Puro Luxo Grife), a decisao de manter a identidade visual de alto padrao existente (serifas elegantes e tons escuros com dourado), a criacao da acao de contato rapido via WhatsApp, a regra de proibicao total de emojis para manter o tom sofisticado e a escolha do modelo de dados seguro com blind indexing.

### 2. Situacao em que a IA deu uma sugestao inadequada e o que foi feito no lugar:
- A IA inicialmente sugeriu armazenar o banco de dados em um SQLite local para simplificar a execucao. No entanto, para atender aos requisitos de conformidade corporativa e robustez transacional com PostgreSQL solicitado pelo projeto, a sugestao foi recusada. Em vez disso, foi estruturado um ambiente com PostgreSQL utilizando Docker Compose (`docker-compose.yml`) e driver nativo `pg`, garantindo tanto a robustez do PostgreSQL quanto a facilidade de execucao local para o avaliador.

### 3. Decisao tomada contra a sugestao da IA:
- A IA sugeriu integrar servicos externos de envio de e-mail transacional (Nodemailer com SMTP ou SendGrid) e bibliotecas externas de componentes visuais pesadas. A decisao tomada foi rejeitar essas dependencias externas desnecessarias, mantendo o sistema 100% autocontido, sem custos, sem dependencia de chaves privadas externas e com o acionamento direto dos clientes via WhatsApp Web.
