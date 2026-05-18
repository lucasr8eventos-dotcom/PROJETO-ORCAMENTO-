import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

import authRoutes from './routes/auth';
import clientesRoutes from './routes/clientes';
import produtosRoutes from './routes/produtos';
import orcamentosRoutes from './routes/orcamentos';
import vendasRoutes from './routes/vendas';
import ordensServicoRoutes from './routes/ordens-servico';
import eventosRoutes from './routes/eventos';
import usuariosRoutes from './routes/usuarios';
import pdfsRoutes from './routes/pdfs';

import './lib/jwt';

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, 'pdfs'))) fs.mkdirSync(path.join(UPLOAD_DIR, 'pdfs'), { recursive: true });

const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',').map(s => s.trim()).filter(Boolean);

app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: false,
  crossOriginOpenerPolicy: false,
  crossOriginEmbedderPolicy: false,
}));
app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (allowedOrigins.length === 0) return cb(null, true);
    if (allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`Origin ${origin} não permitida`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

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

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err?.message?.includes('Origin') && err.message.includes('não permitida')) {
    res.status(403).json({ erro: err.message });
    return;
  }
  console.error('Erro não tratado:', err);
  res.status(500).json({ erro: 'Erro interno do servidor' });
});

app.listen(PORT, () => {
  console.log(`OpSuite API rodando na porta ${PORT}`);
  if (allowedOrigins.length > 0) console.log(`CORS restrito a: ${allowedOrigins.join(', ')}`);
  else console.log('CORS: aberto (defina ALLOWED_ORIGINS para restringir em produção)');
});
