import { Router, Request } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import prisma from '../lib/prisma';
import JWT_SECRET from '../lib/jwt';
import { autenticar, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, loginSchema } from '../lib/validacao';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { erro: 'Muitas tentativas de login. Tente novamente em 15 minutos.' },
});

router.post('/login', loginLimiter, validar(loginSchema), asyncHandler(async (req: Request, res) => {
  const { email, senha } = req.body;

  const usuario = await prisma.usuario.findUnique({ where: { email: email.toLowerCase() } });
  const ERRO_GENERICO = 'E-mail ou senha incorretos';

  if (!usuario) {
    await bcrypt.hash(senha, 10);
    res.status(401).json({ erro: ERRO_GENERICO });
    return;
  }
  if (!usuario.ativo) { res.status(401).json({ erro: 'Usuário inativo. Contate o administrador.' }); return; }

  const ok = await bcrypt.compare(senha, usuario.senha);
  if (!ok) { res.status(401).json({ erro: ERRO_GENERICO }); return; }

  const token = jwt.sign(
    { id: usuario.id, role: usuario.role },
    JWT_SECRET,
    { expiresIn: '12h' }
  );

  res.json({
    token,
    usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email, role: usuario.role },
  });
}));

router.get('/me', autenticar, asyncHandler(async (req: AuthRequest, res) => {
  const usuario = await prisma.usuario.findUnique({
    where: { id: req.userId },
    select: { id: true, nome: true, email: true, role: true, ativo: true },
  });
  if (!usuario) { res.status(404).json({ erro: 'Usuário não encontrado' }); return; }
  res.json(usuario);
}));

export default router;
