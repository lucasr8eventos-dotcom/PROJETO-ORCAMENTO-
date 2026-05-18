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

// Importa lib/jwt para garantir validação de JWT_SECRET na inicialização
import './lib/jwt';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, 'pdfs'))) fs.mkdirSync(path.join(UPLOAD_DIR, 'pdfs'), { recursive: true });

// CORS: lista branca via ALLOWED_ORIGINS (separada por vírgula). Sem a variável,
// permite tudo (compatível com dev/single-tenant). Em prod multi-cliente, defina.
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

// Helmet: desabilita headers que bloqueiam requisições cross-origin (API pública com CORS próprio)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true); // server-to-server, curl, Postman
    if (allowedOrigins.length === 0) return cb(null, true); // lista vazia = aberto (dev)
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} não permitida`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Rotas
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

// Tratamento de erros (incluindo CORS bloqueado)
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.message?.includes('Origin') && err.message.includes('não permitida')) {
    res.status(403).json({ erro: err.message });
    return;
  }
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
  console.log(`OpSuite API rodando na porta ${PORT}`);
  if (allowedOrigins.length > 0) console.log(`CORS restrito a: ${allowedOrigins.join(', ')}`);
  else console.log('CORS: aberto (defina ALLOWED_ORIGINS para restringir em produção)');
  seedAdmin();
});
