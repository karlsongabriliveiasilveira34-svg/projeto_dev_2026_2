const bcrypt = require('bcryptjs');
const { query, pool } = require('../config/db');
const { initDb } = require('./initDb');
const { encrypt, hashBlindIndex } = require('../utils/crypto');
require('dotenv').config();

async function seed() {
  await initDb();
  console.log('[DATABASE SEED] Iniciando semeamento de dados...');

  // 1. Criar usuario administrador padrao se nao existir
  const adminEmail = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@puroluxo.com').trim().toLowerCase();
  const adminPass = process.env.ADMIN_DEFAULT_PASSWORD || 'admin123';
  const adminName = process.env.ADMIN_DEFAULT_NAME || 'Administrador Puro Luxo';

  const checkAdmin = await query('SELECT id FROM usuarios WHERE email = $1', [adminEmail]);

  if (checkAdmin.rows.length === 0) {
    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(adminPass, salt);

    await query(
      'INSERT INTO usuarios (nome, email, senha_hash) VALUES ($1, $2, $3)',
      [adminName, adminEmail, senhaHash]
    );
    console.log(`[DATABASE SEED] Usuario administrador criado: ${adminEmail}`);
  } else {
    console.log(`[DATABASE SEED] Usuario administrador ja existe: ${adminEmail}`);
  }

  // 2. Criar opcoes de servicos VIP oferecidos (minimo 3 exigido pelo edital)
  const checkOpcoes = await query('SELECT COUNT(*) as total FROM opcoes');
  const countOpcoes = parseInt(checkOpcoes.rows[0].total, 10);

  if (countOpcoes === 0) {
    const opcoesIniciais = [
      {
        titulo: 'Consultoria de Imagem & Estilo',
        descricao: 'Analise de perfil, proporcao e composicao de looks exclusivos com alfaiataria fina.',
        preco: 'R$ 350,00',
        duracao: '1h 30min',
        ativa: true,
      },
      {
        titulo: 'Prova Privada & Ajuste Sob Medida',
        descricao: 'Atendimento reservado na loja com alfaiate para provas e ajustes milimetricos de caimento.',
        preco: 'R$ 280,00',
        duracao: '1h 00min',
        ativa: true,
      },
      {
        titulo: 'Curadoria de Colecao / Personal Shopper',
        descricao: 'Selecao guiada dos principais lancamentos e pecas raras da grife com consultor VIP dedicado.',
        preco: 'R$ 450,00',
        duracao: '2h 00min',
        ativa: true,
      },
      {
        titulo: 'Atendimento VIP Online (Envios Nacionais)',
        descricao: 'Videochamada exclusiva para clientes de outras cidades com curadoria e envio assegurado para todo o Brasil.',
        preco: 'Cortesia',
        duracao: '45min',
        ativa: true,
      },
    ];

    for (const op of opcoesIniciais) {
      await query(
        'INSERT INTO opcoes (titulo, descricao, preco, duracao, ativa) VALUES ($1, $2, $3, $4, $5)',
        [op.titulo, op.descricao, op.preco, op.duracao, op.ativa]
      );
    }
    console.log(`[DATABASE SEED] ${opcoesIniciais.length} opcoes de servicos VIP criadas com sucesso.`);
  } else {
    console.log(`[DATABASE SEED] Tabela opcoes ja contem ${countOpcoes} registros.`);
  }

  // 3. Criar agendamentos de exemplo se tabela estiver vazia
  const checkAgendamentos = await query('SELECT COUNT(*) as total FROM agendamentos');
  const count = parseInt(checkAgendamentos.rows[0].total, 10);

  if (count === 0) {
    const sampleData = [
      {
        nome: 'Carlos Eduardo Mendes',
        email: 'carlos.mendes@email.com',
        telefone: '(38) 99876-5432',
        tipo: 'Consultoria de Imagem & Estilo',
        data: '2026-09-05',
        horario: '15:00',
        observacoes: 'Interesse em composicoes formais para evento corporativo de gala.',
        status: 'pendente'
      },
      {
        nome: 'Rodrigo Silveira Ramos',
        email: 'rodrigo.ramos@empresa.com.br',
        telefone: '(38) 99123-4567',
        tipo: 'Prova Privada & Ajuste Sob Medida',
        data: '2026-09-03',
        horario: '10:30',
        observacoes: 'Ajuste de costume completo e selecao de camisaria italiana.',
        status: 'confirmado'
      },
      {
        nome: 'Marcos Vinicius Tavares',
        email: 'marcos.tavares@adv.br',
        telefone: '(38) 98844-3322',
        tipo: 'Curadoria de Colecao / Personal Shopper',
        data: '2026-09-08',
        horario: '17:00',
        observacoes: 'Renovacao de guarda-roupa executivo primavera/verao.',
        status: 'pendente'
      },
      {
        nome: 'Guilherme Albuquerque',
        email: 'g.albuquerque@gmail.com',
        telefone: '(31) 98765-1122',
        tipo: 'Atendimento VIP Online (Envios)',
        data: '2026-09-02',
        horario: '14:00',
        observacoes: 'Cliente de Belo Horizonte solicitando envio de catalogo exclusivo.',
        status: 'confirmado'
      },
      {
        nome: 'Lucas Fontes Nogueira',
        email: 'lucas.fontes@outlook.com',
        telefone: '(38) 99911-2233',
        tipo: 'Prova Privada & Ajuste Sob Medida',
        data: '2026-08-30',
        horario: '16:00',
        observacoes: 'Cliente desmarcou devido a viagem inesperada.',
        status: 'cancelado'
      }
    ];

    for (const item of sampleData) {
      const emailEncrypted = encrypt(item.email);
      const emailHash = hashBlindIndex(item.email);

      await query(
        `INSERT INTO agendamentos (nome, email_encrypted, email_hash, telefone, tipo, data, horario, observacoes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          item.nome,
          emailEncrypted,
          emailHash,
          item.telefone,
          item.tipo,
          item.data,
          item.horario,
          item.observacoes,
          item.status
        ]
      );
    }
    console.log(`[DATABASE SEED] ${sampleData.length} agendamentos de exemplo inseridos.`);
  } else {
    console.log(`[DATABASE SEED] Tabela de agendamentos ja contem ${count} registros.`);
  }

  console.log('[DATABASE SEED] Semeamento finalizado com sucesso.');
}

if (require.main === module) {
  seed()
    .then(() => {
      process.exit(0);
    })
    .catch((err) => {
      console.error('[DATABASE SEED ERROR]', err.message);
      process.exit(1);
    });
}

module.exports = { seed };
