-- AlterTable: adiciona coluna editavel na tabela vendas
ALTER TABLE "vendas" ADD COLUMN "editavel" BOOLEAN NOT NULL DEFAULT false;
