const isProd = process.env.NODE_ENV === 'production';
const secret = process.env.JWT_SECRET;

if (!secret && isProd) {
  console.error('FATAL: variável de ambiente JWT_SECRET é obrigatória em produção');
  process.exit(1);
}

if (!secret) {
  console.warn('AVISO: JWT_SECRET não definido — usando segredo de desenvolvimento (NÃO USE EM PRODUÇÃO)');
}

export default secret || 'dev-only-jwt-secret-do-not-use-in-production';
