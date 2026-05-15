# Como configurar para um novo cliente

## 1. Clone o repositório

```bash
git clone https://github.com/vini-lima0/PROJETO-ORCAMENTO- nome-do-cliente
cd nome-do-cliente
git remote set-url origin https://github.com/SEU-ORG/nome-do-cliente
git push -u origin main
```

## 2. Configure as variáveis no Railway

### Serviço Frontend (variáveis de ambiente):

| Variável | Descrição | Exemplo |
|---|---|---|
| `REACT_APP_EMPRESA_NOME` | Nome exibido no sistema | `Construtora Silva` |
| `REACT_APP_EMPRESA_SIGLA` | Sigla (2-3 letras) para o ícone | `CS` |
| `REACT_APP_EMPRESA_TAGLINE` | Subtítulo da tela de login | `Gestão de Obras` |
| `REACT_APP_COR_NAVBAR` | Cor da barra lateral (hex) | `#1a3c5e` |
| `REACT_APP_COR_DESTAQUE` | Cor de destaque/links (hex) | `#2563eb` |
| `REACT_APP_API_URL` | URL do backend Railway | `https://xxx.up.railway.app` |

### Serviço Backend (variáveis de ambiente):

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | String de conexão PostgreSQL (gerada pelo Railway) |
| `JWT_SECRET` | String aleatória longa e secreta |
| `PORT` | Deixe vazio (Railway define automaticamente) |

## 3. Altere o usuário administrador padrão

No arquivo `backend/prisma/seed.ts`, altere:
```typescript
email: 'admin@EMPRESA.com'
senha: 'senha-inicial-forte'
nome: 'Administrador'
```

## 4. Deploy

Faça push para `main` — Railway detecta e faz deploy automaticamente.

O primeiro login usa as credenciais definidas no seed.
Após o deploy, o cliente cria seus próprios usuários em Configurações → Usuários.

## Tempo estimado por cliente: 15–30 minutos
