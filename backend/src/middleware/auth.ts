import { Request, Response, NextFunction, RequestHandler } from 'express';
import jwt from 'jsonwebtoken';
import JWT_SECRET from '../lib/jwt';

export interface AuthRequest extends Request {
  userId?: string;
  userRole?: string;
}

export function autenticar(req: AuthRequest, res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ erro: 'Token não fornecido' });
    return;
  }
  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: string; role: string };
    req.userId = payload.id;
    req.userRole = payload.role;
    next();
  } catch {
    res.status(401).json({ erro: 'Token inválido ou expirado' });
  }
}

export function apenasAdmin(req: AuthRequest, res: Response, next: NextFunction) {
  if (req.userRole !== 'admin') {
    res.status(403).json({ erro: 'Acesso restrito a administradores' });
    return;
  }
  next();
}

// Wrapper para capturar erros de handlers async e encaminhar ao error handler global
export function asyncHandler(fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<any>): RequestHandler {
  return (req, res, next) => fn(req as AuthRequest, res, next).catch(next);
}
