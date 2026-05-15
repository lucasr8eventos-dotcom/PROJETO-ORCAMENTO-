import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();

router.post('/login', async (req: Request, res: Response) => {
  const { email, senha } = req.body;
  if (!email || !senha) { res.status(400).json({ erro: 'E-mail e senha obrigatórios' }); return; }

  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  if (!usuario) { res.status(401).json({ erro: 'E-mail não encontrado' }); return; }
  if (!usuario.ativo) { res.status(401).json({ erro: 'Usuário inativo. Contate o administrador.' }); return; }

  const ok = await bcrypt.compare(senha, usuario.senha);
  if (!ok) { res.status(401).json({ erro: 'Senha incorreta' }); return; }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: '12h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
});

router.get('/me', autenticar, async (req: AuthRequest, res: Response) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });
  if (!usuario) { res.status(404).json({ erro: 'Usuário não encontrado' }); return; }
  res.json(usuario);
});

export default router;
