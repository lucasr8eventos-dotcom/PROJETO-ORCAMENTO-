import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(autenticar);
router.use(apenasAdmin);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    orderBy: { nome: 'asc' },
  });
  res.json(usuarios);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const u = await prisma.usuario.findUnique({
    where: { id: req.params.id },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });
  if (!u) { res.status(404).json({ erro: 'Usuário não encontrado' }); return; }
  res.json(u);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { nome, email, senha, role } = req.body;
  if (!nome || !email || !senha) {
    res.status(400).json({ erro: 'Nome, e-mail e senha são obrigatórios' }); return;
  }
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) { res.status(409).json({ erro: 'E-mail já cadastrado' }); return; }

  const hash = await bcrypt.hash(senha, 10);
  const u = await prisma.usuario.create({
    data: { nome, email, senha: hash, role: role || 'operador', ativo: true, criadoEm: new Date().toISOString().slice(0, 10) },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });
  res.status(201).json(u);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { nome, email, senha, role, ativo } = req.body;
  if (!nome || !email) { res.status(400).json({ erro: 'Nome e e-mail são obrigatórios' }); return; }

  const data: any = { nome, email, role: role || 'operador', ativo: ativo !== false };
  if (senha) data.senha = await bcrypt.hash(senha, 10);

  try {
    const u = await prisma.usuario.update({
      where: { id: req.params.id },
      data,
      select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    });
    res.json(u);
  } catch { res.status(404).json({ erro: 'Usuário não encontrado' }); }
});

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Usuário não encontrado' }); }
});

export default router;
