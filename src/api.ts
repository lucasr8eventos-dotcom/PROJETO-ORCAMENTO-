import cfg from './config';

// Vazio = mesma origem (backend serve frontend). Em dev/CRA, REACT_APP_API_URL aponta para o backend local.
const API_BASE = process.env.REACT_APP_API_URL ?? '';

function token() { return localStorage.getItem(cfg.tokenKey) || ''; }

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token()}`,
      ...(init?.headers ?? {}),
    },
  });
  if (res.status === 204) return undefined as T;
  if (res.status === 401 && path !== '/api/auth/login') {
    localStorage.removeItem(cfg.tokenKey);
    window.location.reload();
    return undefined as T;
  }
  const text = await res.text();
  let data: any;
  try { data = JSON.parse(text); } catch { throw new Error(`Erro ${res.status}: resposta inesperada do servidor`); }
  if (!res.ok) throw new Error(data.erro || `Erro ${res.status}`);
  return data as T;
}

const get  = <T>(path: string) => req<T>(path);
const post = <T>(path: string, body: unknown) => req<T>(path, { method: 'POST', body: JSON.stringify(body) });
const put  = <T>(path: string, body: unknown) => req<T>(path, { method: 'PUT',  body: JSON.stringify(body) });
const patch = <T>(path: string, body: unknown) => req<T>(path, { method: 'PATCH', body: JSON.stringify(body) });
const del  = (path: string) => req<void>(path, { method: 'DELETE' });

export const authApi = {
  login: (email: string, senha: string) =>
    post<{ token: string; usuario: { id: string; nome: string; email: string; role: string } }>(
      '/api/auth/login', { email, senha }
    ),
  me: () => get<{ id: string; nome: string; email: string; role: string; ativo: boolean }>('/api/auth/me'),
};

export const clientesApi = {
  listar: () => get<any[]>('/api/clientes'),
  criar:    (d: any) => post<any>('/api/clientes', d),
  atualizar:(id: string, d: any) => put<any>(`/api/clientes/${id}`, d),
  deletar:  (id: string) => del(`/api/clientes/${id}`),
};

export const produtosApi = {
  listar: () => get<any[]>('/api/produtos'),
  criar:    (d: any) => post<any>('/api/produtos', d),
  atualizar:(id: string, d: any) => put<any>(`/api/produtos/${id}`, d),
  deletar:  (id: string) => del(`/api/produtos/${id}`),
};

export const orcamentosApi = {
  listar: () => get<any[]>('/api/orcamentos'),
  criar:    (d: any) => post<any>('/api/orcamentos', d),
  atualizar:(id: string, d: any) => put<any>(`/api/orcamentos/${id}`, d),
  status:   (id: string, status: string) => patch<any>(`/api/orcamentos/${id}/status`, { status }),
  deletar:  (id: string) => del(`/api/orcamentos/${id}`),
};

export const vendasApi = {
  listar: () => get<any[]>('/api/vendas'),
  criar:  (d: any) => post<any>('/api/vendas', d),
  atualizar: (id: string, d: any) => put<any>(`/api/vendas/${id}`, d),
  adicionarPagamento: (vendaId: string, d: any) => post<any>(`/api/vendas/${vendaId}/pagamentos`, d),
  togglePagamento:    (pgId: string, pago: boolean) => patch<any>(`/api/vendas/pagamentos/${pgId}`, { pago }),
  deletar: (id: string) => del(`/api/vendas/${id}`),
};

export const ordensApi = {
  listar: (vendaId?: string) =>
    get<any[]>(`/api/ordens-servico${vendaId ? `?vendaId=${vendaId}` : ''}`),
  criar:    (d: any) => post<any>('/api/ordens-servico', d),
  atualizar:(id: string, d: any) => put<any>(`/api/ordens-servico/${id}`, d),
  deletar:  (id: string) => del(`/api/ordens-servico/${id}`),
};

export const eventosApi = {
  listar: () => get<any[]>('/api/eventos'),
  criar:    (d: any) => post<any>('/api/eventos', d),
  atualizar:(id: string, d: any) => put<any>(`/api/eventos/${id}`, d),
  toggle:   (id: string) => patch<any>(`/api/eventos/${id}/toggle`, {}),
  deletar:  (id: string) => del(`/api/eventos/${id}`),
};

export const usuariosApi = {
  listar: () => get<any[]>('/api/usuarios'),
  criar:    (d: any) => post<any>('/api/usuarios', d),
  atualizar:(id: string, d: any) => put<any>(`/api/usuarios/${id}`, d),
  deletar:  (id: string) => del(`/api/usuarios/${id}`),
};

export const pdfsApi = {
  listar: (orcamentoId: string) => get<any[]>(`/api/pdfs?orcamentoId=${orcamentoId}`),
  uploadBase64: (orcamentoId: string, orcamentoNumero: string, base64: string, versao = 1) =>
    post<any>('/api/pdfs/base64', { orcamentoId, orcamentoNumero, base64, versao }),
  deletar: (id: string) => del(`/api/pdfs/${id}`),
};
