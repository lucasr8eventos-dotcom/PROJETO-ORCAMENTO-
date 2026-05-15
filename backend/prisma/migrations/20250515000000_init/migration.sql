-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "senha" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'operador',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TEXT NOT NULL,
    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "clientes" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "telefone" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "cpf" TEXT NOT NULL,
    "endereco" TEXT NOT NULL,
    "criadoEm" TEXT NOT NULL,
    CONSTRAINT "clientes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "preco" DOUBLE PRECISION NOT NULL,
    "unidade" TEXT NOT NULL,
    "estoque" INTEGER,
    "tipo" TEXT NOT NULL DEFAULT 'produto',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamentos" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'rascunho',
    "desconto" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "impostos" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "observacoes" TEXT NOT NULL,
    "criadoEm" TEXT NOT NULL,
    "validade" TEXT NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    CONSTRAINT "orcamentos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "orcamento_itens" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "periodo" TEXT,
    CONSTRAINT "orcamento_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "orcamentoId" TEXT,
    "orcamentoNumero" TEXT NOT NULL,
    "clienteId" TEXT,
    "clienteNome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "desconto" DOUBLE PRECISION NOT NULL,
    "impostos" DOUBLE PRECISION NOT NULL,
    "subtotal" DOUBLE PRECISION NOT NULL,
    "total" DOUBLE PRECISION NOT NULL,
    "observacoes" TEXT NOT NULL,
    "criadoEm" TEXT NOT NULL,
    "situacao" TEXT NOT NULL DEFAULT 'pendente',
    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pagamentos_venda" (
    "id" TEXT NOT NULL,
    "vendaId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "valor" DOUBLE PRECISION NOT NULL,
    "vencimento" TEXT NOT NULL,
    "pago" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "pagamentos_venda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ordens_servico" (
    "id" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "vendaId" TEXT,
    "vendaNumero" TEXT NOT NULL,
    "orcamentoNumero" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "clienteNome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "enderecoEvento" TEXT NOT NULL,
    "dataMontagem" TEXT NOT NULL,
    "dataRetirada" TEXT NOT NULL,
    "horarioInicio" TEXT NOT NULL,
    "horarioFim" TEXT NOT NULL,
    "equipe" TEXT NOT NULL,
    "motorista" TEXT NOT NULL,
    "observacoesOperacionais" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pendente',
    "criadoEm" TEXT NOT NULL,
    CONSTRAINT "ordens_servico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "os_itens" (
    "id" TEXT NOT NULL,
    "osId" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "quantidade" DOUBLE PRECISION NOT NULL,
    "valorUnitario" DOUBLE PRECISION NOT NULL,
    "periodo" TEXT,
    CONSTRAINT "os_itens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "eventos" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "data" TEXT NOT NULL,
    "horaInicio" TEXT NOT NULL,
    "horaFim" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "concluido" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "eventos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pdf_arquivos" (
    "id" TEXT NOT NULL,
    "orcamentoId" TEXT NOT NULL,
    "orcamentoNumero" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "versao" INTEGER NOT NULL DEFAULT 1,
    "criadoEm" TEXT NOT NULL,
    CONSTRAINT "pdf_arquivos_pkey" PRIMARY KEY ("id")
);

-- CreateUniqueIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
CREATE UNIQUE INDEX "orcamentos_numero_key" ON "orcamentos"("numero");
CREATE UNIQUE INDEX "vendas_numero_key" ON "vendas"("numero");
CREATE UNIQUE INDEX "ordens_servico_numero_key" ON "ordens_servico"("numero");

-- AddForeignKey
ALTER TABLE "orcamentos" ADD CONSTRAINT "orcamentos_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "orcamento_itens" ADD CONSTRAINT "orcamento_itens_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "clientes"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "pagamentos_venda" ADD CONSTRAINT "pagamentos_venda_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ordens_servico" ADD CONSTRAINT "ordens_servico_vendaId_fkey" FOREIGN KEY ("vendaId") REFERENCES "vendas"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "os_itens" ADD CONSTRAINT "os_itens_osId_fkey" FOREIGN KEY ("osId") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "pdf_arquivos" ADD CONSTRAINT "pdf_arquivos_orcamentoId_fkey" FOREIGN KEY ("orcamentoId") REFERENCES "orcamentos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
