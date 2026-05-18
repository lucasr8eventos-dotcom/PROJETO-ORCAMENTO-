import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, apenasAdmin, AuthRequest } from '../middleware/auth';
import { validar, eventoSchema } from '../lib/validacao';

const router = Router();
router.use(autenticar);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const eventos = await prisma.evento.findMany({ orderBy: { data: 'asc' } });
  res.json(eventos);
});

router.get('/:id', async (req: AuthRequest, res: Response) => {
  const e = await prisma.evento.findUnique({ where: { id: req.params.id } });
  if (!e) { res.status(404).json({ erro: 'Evento não encontrado' }); return; }
  res.json(e);
});

router.post('/', validar(eventoSchema), async (req: AuthRequest, res: Response) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao, concluido } = req.body;
  const e = await prisma.evento.create({
    data: { titulo, data, horaInicio, horaFim, tipo, descricao, concluido },
  });
  res.status(201).json(e);
});

router.put('/:id', validar(eventoSchema), async (req: AuthRequest, res: Response) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao, concluido } = req.body;
  try {
    const e = await prisma.evento.update({
      where: { id: req.params.id },
      data: { titulo, data, horaInicio, horaFim, tipo, descricao, concluido },
    });
    res.json(e);
  } catch { res.status(404).json({ erro: 'Evento não encontrado' }); }
});

router.patch('/:id/toggle', async (req: AuthRequest, res: Response) => {
  const ev = await prisma.evento.findUnique({ where: { id: req.params.id } });
  if (!ev) { res.status(404).json({ erro: 'Evento não encontrado' }); return; }
  const e = await prisma.evento.update({
    where: { id: req.params.id }, data: { concluido: !ev.concluido },
  });
  res.json(e);
});

router.delete('/:id', apenasAdmin, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.evento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Evento não encontrado' }); }
});

export default router;
