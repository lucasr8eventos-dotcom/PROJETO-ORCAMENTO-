-- Corrige usuários criados antes da migration 20250518 que ficaram com role='operador' (default inicial errado).
-- 'operador' era o default incorreto; o valor correto para usuários não-admin é 'operacional'.
UPDATE "usuarios" SET "role" = 'operacional' WHERE "role" = 'operador';
