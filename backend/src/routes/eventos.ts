import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, asyncHandler, AuthRequest } from '../middleware/auth';
import { validar, eventoSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', asyncHandler(async (_req, res) => {
  const eventos = await prisma.evento.findMany({ orderBy: { data: 'asc' } });
  res.json(eventos);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const e = await prisma.evento.findUnique({ where: { id: req.params.id } });
  if (!e) { res.status(404).json({ erro: 'Evento não encontrado' }); return; }
  res.json(e);
}));

router.post('/', validar(eventoSchema), asyncHandler(async (req, res) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao, concluido } = req.body;
  const e = await prisma.evento.create({
    data: { titulo, data, horaInicio, horaFim, tipo, descricao, concluido },
  });
  res.status(201).json(e);
}));

router.put('/:id', validar(eventoSchema), asyncHandler(async (req, res) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao, concluido } = req.body;
  try {
    const e = await prisma.evento.update({
      where: { id: req.params.id },
      data: { titulo, data, horaInicio, horaFim, tipo, descricao, concluido },
    });
    res.json(e);
  } catch { res.status(404).json({ erro: 'Evento não encontrado' }); }
}));

router.patch('/:id/toggle', asyncHandler(async (req, res) => {
  const ev = await prisma.evento.findUnique({ where: { id: req.params.id } });
  if (!ev) { res.status(404).json({ erro: 'Evento não encontrado' }); return; }
  const e = await prisma.evento.update({
    where: { id: req.params.id }, data: { concluido: !ev.concluido },
  });
  res.json(e);
}));

router.delete('/:id', apenasAdmin, asyncHandler(async (req, res) => {
  try {
    await prisma.evento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Evento não encontrado' }); }
}));

export default router;
