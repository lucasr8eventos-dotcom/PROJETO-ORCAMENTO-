import { Orcamento, Venda } from './types';

export function calcularSituacaoVenda(pagamentos: Venda['pagamentos'], totalVenda?: number): Venda['situacao'] {
  if (!pagamentos.length) return 'pendente';
  const totalPago = pagamentos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
  const totalRef = totalVenda ?? pagamentos.reduce((s, p) => s + p.valor, 0);
  if (totalPago === 0) return 'pendente';
  if (totalPago >= totalRef) return 'quitado';
  return 'parcial';
}

export function calcularTotais(orc: Pick<Orcamento, 'itens' | 'desconto' | 'impostos'>): { subtotal: number; total: number } {
  const subtotal = orc.itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const descontoVal = subtotal * orc.desconto / 100;
  const impostosVal = (subtotal - descontoVal) * orc.impostos / 100;
  return { subtotal, total: subtotal - descontoVal + impostosVal };
}

export function loadData<T>(key: string, defaults: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaults;
  } catch { return defaults; }
}

export function saveData<T>(key: string, data: T): void {
  localStorage.setItem(key, JSON.stringify(data));
}
