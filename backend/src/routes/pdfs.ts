import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma';
import { autenticar, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, pdfBase64Schema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

const uploadDir = process.env.UPLOAD_DIR
  ? path.join(process.env.UPLOAD_DIR, 'pdfs')
  : path.join(process.cwd(), 'uploads', 'pdfs');
fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, _file, cb) => cb(null, `${uuidv4()}.pdf`),
});
const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') cb(null, true);
    else cb(new Error('Apenas arquivos PDF são permitidos'));
  },
});

function apiUrl() {
  return process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
}

router.get('/', asyncHandler(async (req, res) => {
  const { orcamentoId } = req.query;
  const pdfs = await prisma.pdfArquivo.findMany({
    where: orcamentoId ? { orcamentoId: String(orcamentoId) } : undefined,
    orderBy: { criadoEm: 'desc' },
  });
  res.json(pdfs);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const pdf = await prisma.pdfArquivo.findUnique({ where: { id: req.params.id } });
  if (!pdf) { res.status(404).json({ erro: 'PDF não encontrado' }); return; }
  res.json(pdf);
}));

router.get('/:id/download', asyncHandler(async (req, res) => {
  const pdf = await prisma.pdfArquivo.findUnique({ where: { id: req.params.id } });
  if (!pdf) { res.status(404).json({ erro: 'PDF não encontrado' }); return; }
  const filepath = path.join(uploadDir, pdf.nomeArquivo);
  if (!fs.existsSync(filepath)) { res.status(404).json({ erro: 'Arquivo não encontrado no servidor' }); return; }
  const safeName = `${pdf.orcamentoNumero || 'orcamento'}.pdf`.replace(/[^A-Za-z0-9._-]/g, '_');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="${safeName}"`);
  fs.createReadStream(filepath).pipe(res);
}));

router.post('/upload', upload.single('pdf'), asyncHandler(async (req: AuthRequest, res: Response) => {
  if (!req.file) { res.status(400).json({ erro: 'Arquivo PDF obrigatório' }); return; }
  const { orcamentoId, orcamentoNumero, versao } = req.body;
  if (!orcamentoId) { res.status(400).json({ erro: 'orcamentoId obrigatório' }); return; }

  const pdf = await prisma.pdfArquivo.create({
    data: {
      orcamentoId, orcamentoNumero: orcamentoNumero || '',
      versao: Number(versao) || 1,
      nomeArquivo: req.file.filename,
      url: '',
      criadoEm: new Date().toISOString().slice(0, 10),
    },
  });
  const urlFinal = `${apiUrl()}/api/pdfs/${pdf.id}/download`;
  const atualizado = await prisma.pdfArquivo.update({
    where: { id: pdf.id }, data: { url: urlFinal },
  });
  res.status(201).json(atualizado);
}));

router.post('/base64', validar(pdfBase64Schema), asyncHandler(async (req, res) => {
  const { orcamentoId, orcamentoNumero, versao, base64 } = req.body;
  const buffer = Buffer.from(base64.replace(/^data:application\/pdf;base64,/, ''), 'base64');
  const filename = `${uuidv4()}.pdf`;
  const filepath = path.join(uploadDir, filename);
  try {
    fs.writeFileSync(filepath, buffer);
  } catch (e: any) {
    res.status(500).json({ erro: 'Falha ao salvar arquivo PDF no servidor' });
    return;
  }
  const pdf = await prisma.pdfArquivo.create({
    data: {
      orcamentoId, orcamentoNumero: orcamentoNumero || '',
      versao: Number(versao) || 1,
      nomeArquivo: filename,
      url: '',
      criadoEm: new Date().toISOString().slice(0, 10),
    },
  });
  const urlFinal = `${apiUrl()}/api/pdfs/${pdf.id}/download`;
  const atualizado = await prisma.pdfArquivo.update({
    where: { id: pdf.id }, data: { url: urlFinal },
  });
  res.status(201).json(atualizado);
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  try {
    const pdf = await prisma.pdfArquivo.findUnique({ where: { id: req.params.id } });
    if (!pdf) { res.status(404).json({ erro: 'PDF não encontrado' }); return; }
    const filepath = path.join(uploadDir, pdf.nomeArquivo);
    if (fs.existsSync(filepath)) fs.unlinkSync(filepath);
    await prisma.pdfArquivo.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'PDF não encontrado' }); }
}));

export default router;
