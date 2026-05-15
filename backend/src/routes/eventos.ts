import { Router, Response } from 'express';
import prisma from '../lib/prisma';
import { autenticar, AuthRequest } from '../middleware/auth';

const router = Router();
router.use(autenticar);

router.get('/', async (_req: AuthRequest, res: Response) => {
  const eventos = await prisma.evento.findMany({ orderBy: { data: 'asc' } });
  res.json(eventos);
});

router.post('/', async (req: AuthRequest, res: Response) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao } = req.body;
  if (!titulo) { res.status(400).json({ erro: 'Título obrigatório' }); return; }
  const e = await prisma.evento.create({
    data: { titulo, data: data || '', horaInicio: horaInicio || '', horaFim: horaFim || '',
            tipo: tipo || 'evento', descricao: descricao || '', concluido: false },
  });
  res.status(201).json(e);
});

router.put('/:id', async (req: AuthRequest, res: Response) => {
  const { titulo, data, horaInicio, horaFim, tipo, descricao, concluido } = req.body;
  try {
    const e = await prisma.evento.update({
      where: { id: req.params.id },
      data: { titulo, data, horaInicio, horaFim, tipo, descricao, concluido: concluido === true },
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

router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    await prisma.evento.delete({ where: { id: req.params.id } });
    res.status(204).send();
  } catch { res.status(404).json({ erro: 'Evento não encontrado' }); }
});

export default router;
