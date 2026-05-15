import express from 'express';
import cors from 'cors';
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

const app = express();
const PORT = process.env.PORT || 3001;
const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';

// Garante que o diretório de uploads existe
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
if (!fs.existsSync(path.join(UPLOAD_DIR, 'pdfs'))) fs.mkdirSync(path.join(UPLOAD_DIR, 'pdfs'), { recursive: true });

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true }));

// Serve PDFs estaticamente
app.use('/uploads', express.static(path.resolve(UPLOAD_DIR)));

// Rotas
app.use('/api/auth',          authRoutes);
app.use('/api/clientes',      clientesRoutes);
app.use('/api/produtos',      produtosRoutes);
app.use('/api/orcamentos',    orcamentosRoutes);
app.use('/api/vendas',        vendasRoutes);
app.use('/api/ordens-servico', ordensServicoRoutes);
app.use('/api/eventos',       eventosRoutes);
app.use('/api/usuarios',      usuariosRoutes);
app.use('/api/pdfs',          pdfsRoutes);

app.get('/api/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.listen(PORT, () => {
  console.log(`OpSuite API rodando na porta ${PORT}`);
});
