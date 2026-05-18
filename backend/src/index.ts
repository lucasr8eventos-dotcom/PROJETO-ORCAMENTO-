import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';
import bcrypt from 'bcryptjs';

import authRoutes from './routes/auth';
import clientesRoutes from './routes/clientes';
import produtosRoutes from './routes/produtos';
import orcamentosRoutes from './routes/orcamentos';
import vendasRoutes from './routes/vendas';
import ordensServicoRoutes from './routes/ordens-servico';
import eventosRoutes from './routes/eventos';
import usuariosRoutes from './routes/usuarios';
import pdfsRoutes from './routes/pdfs';
import prisma from './lib/prisma';

// Garante validação do JWT_SECRET na inicialização
import './lib/jwt';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, 'pdfs'))) fs.mkdirSync(path.join(UPLOAD_DIR, 'pdfs'), { recursive: true });

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS de fallback (caso o frontend seja acessado em domínio diferente do backend).
// Quando frontend e backend estão na mesma origem, esses headers são ignorados pelo browser.
// Implementação manual para garantir 100% de compatibilidade com preflight de qualquer ambiente.
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  } else {
    res.setHeader('Access-Control-Allow-Origin', '*');
  }
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.setHeader('Access-Control-Max-Age', '86400');
  if (req.method === 'OPTIONS') { res.status(204).end(); return; }
  next();
});
app.use(cors()); // backup adicional

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// --- Rotas da API ---
app.use('/api/auth',           authRoutes);
app.use('/api/clientes',       clientesRoutes);
app.use('/api/produtos',       produtosRoutes);
app.use('/api/orcamentos',     orcamentosRoutes);
app.use('/api/vendas',         vendasRoutes);
app.use('/api/ordens-servico', ordensServicoRoutes);
app.use('/api/eventos',        eventosRoutes);
app.use('/api/usuarios',       usuariosRoutes);
app.use('/api/pdfs',           pdfsRoutes);
app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// --- Serve o frontend (build do React) na mesma origem ---
// Tenta vários locais possíveis para o diretório build
const candidatos = [
  path.resolve(__dirname, '../../build'),  // monorepo: backend/dist/index.js → ../../build
  path.resolve(__dirname, '../../../build'),
  path.resolve(process.cwd(), 'build'),
  path.resolve(process.cwd(), '../build'),
];
const FRONTEND_BUILD = candidatos.find(p => fs.existsSync(path.join(p, 'index.html')));

if (FRONTEND_BUILD) {
  console.log(`Servindo frontend de: ${FRONTEND_BUILD}`);
  app.use(express.static(FRONTEND_BUILD));
  // SPA fallback: qualquer rota não-API/não-uploads retorna index.html
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/uploads/')) return next();
    res.sendFile(path.join(FRONTEND_BUILD, 'index.html'));
  });
} else {
  console.warn('AVISO: build do frontend não encontrado. Servindo apenas API.');
}

// --- Tratamento de erros ---
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

async function seedAdmin() {
  try {
    const existe = await prisma.usuario.findUnique({ where: { email: 'admin@opsuite.com' } });
    if (existe) { console.log('Seed: admin já existe, pulando.'); return; }
    const hash = await bcrypt.hash('admin123', 10);
    await prisma.usuario.create({
      data: { nome: 'Administrador', email: 'admin@opsuite.com', senha: hash,
              role: 'admin', ativo: true, criadoEm: new Date().toISOString().slice(0, 10) },
    });
    console.log('Seed: usuário admin criado — admin@opsuite.com / admin123');
  } catch (e) {
    console.error('Seed: erro ao criar admin (não crítico):', e);
  }
}

app.listen(PORT, () => {
  console.log(`OpSuite rodando na porta ${PORT}`);
  seedAdmin();
});
