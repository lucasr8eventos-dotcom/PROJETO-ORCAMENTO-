import { Router } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, usuarioCreateSchema, usuarioUpdateSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);
router.use(apenasAdmin);

router.get('/', asyncHandler(async (_req, res) => {
  const usuarios = await prisma.usuario.findMany({
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    orderBy: { nome: 'asc' },
  });
  res.json(usuarios);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const u = await prisma.usuario.findUnique({
    where: { id: req.params.id },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });
  if (!u) { res.status(404).json({ erro: 'Usuário não encontrado' }); return; }
  res.json(u);
}));

router.post('/', validar(usuarioCreateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { nome, email, senha, role } = req.body;
  const existe = await prisma.usuario.findUnique({ where: { email } });
  if (existe) { res.status(409).json({ erro: 'E-mail já cadastrado' }); return; }

  const hash = await bcrypt.hash(senha, 10);
  const u = await prisma.usuario.create({
    data: { nome, email, senha: hash, role: role || 'operacional', ativo: true, criadoEm: new Date().toISOString().slice(0, 10) },
    select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
  });
  res.status(201).json(u);
}));

router.put('/:id', validar(usuarioUpdateSchema), asyncHandler(async (req: AuthRequest, res) => {
  const { nome, email, senha, role, ativo } = req.body;
  const data: any = { nome, email };
  if (role !== undefined) data.role = role;
  if (ativo !== undefined) data.ativo = ativo;
  if (senha) data.senha = await bcrypt.hash(senha, 10);

  try {
    const u = await prisma.usuario.update({
      where: { id: req.params.id },
      data,
      select: { id: true, nome: true, email: true, role: true, ativo: true, criadoEm: true },
    });
    res.json(u);
  } catch { res.status(404).json({ erro: 'Usuário não encontrado' }); }
}));

router.delete('/:id', asyncHandler(async (req: AuthRequest, res) => {
  if (req.params.id === req.userId) {
    res.status(400).json({ erro: 'Não é possível excluir o próprio usuário' });
    return;
  }
  try {
    await prisma.usuario.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Usuário não encontrado' }); }
}));

export default router;
