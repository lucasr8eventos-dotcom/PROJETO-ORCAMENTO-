import React, { useState, useMemo, useEffect } from 'react';
import { Venda, PagamentoVenda, SituacaoVenda } from '../types';
import { fmtMoeda } from './ui';
import { calcularSituacaoVenda } from '../data';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';
import Relatorio from './Relatorio';

interface Props {
  vendas: Venda[];
  userRole: 'admin' | 'operacional';
  onSalvar: (v: Venda) => void | Promise<void>;
  onDelete: (id: string) => void;
  onVerOS: (vendaId: string) => void;
  detalheInicial?: string | null;
}

function badgeSituacao(s: SituacaoVenda) {
  const map: Record<SituacaoVenda, { label: string; color: string; bg: string }> = {
    pendente:  { label: 'Pendente',  color: 'var(--amber)',  bg: 'rgba(245,158,11,0.1)' },
    parcial:   { label: 'Parcial',   color: 'var(--blue)',   bg: 'rgba(59,130,246,0.1)' },
    quitado:   { label: 'Quitado',   color: 'var(--green)',  bg: 'rgba(16,185,129,0.1)' },
    cancelado: { label: 'Cancelado', color: 'var(--red)',    bg: 'rgba(239,68,68,0.1)'  },
  };
  const { label, color, bg } = map[s];
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: '3px 10px', borderRadius: 20 }}>
      {label}
    </span>
  );
}

const hoje = () => format(new Date(), 'yyyy-MM-dd');

export default function Vendas({ vendas, userRole, onSalvar, onDelete, onVerOS, detalheInicial }: Props) {
  const isAdmin = userRole === 'admin';
  const [filtro, setFiltro] = useState<SituacaoVenda | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [detalheId, setDetalheId] = useState<string | null>(detalheInicial ?? null);
  useEffect(() => { if (detalheInicial) setDetalheId(detalheInicial); }, [detalheInicial]);
  const [editPag, setEditPag] = useState<Partial<PagamentoVenda>>({});
  const [showAddPag, setShowAddPag] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ top: 0, right: 0 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [editVendaId, setEditVendaId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ contato: string; observacoes: string }>({ contato: '', observacoes: '' });
  const [showRelatorio, setShowRelatorio] = useState(false);

  const openMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuPos({ top: rect.bottom + 4, right: window.innerWidth - rect.right });
    setMenuOpen(menuOpen === id ? null : id);
  };

  const filtradas = useMemo(() => vendas.filter(v => {
    if (filtro === 'pendente' && v.situacao !== 'pendente' && v.situacao !== 'parcial') return false;
    if (filtro !== 'todos' && filtro !== 'pendente' && v.situacao !== filtro) return false;
    if (busca) {
      const q = busca.toLowerCase();
      return v.clienteNome.toLowerCase().includes(q) || v.numero.toLowerCase().includes(q) || v.orcamentoNumero.toLowerCase().includes(q);
    }
    return true;
  }), [vendas, filtro, busca]);

  const totalGeral     = vendas.reduce((s, v) => s + v.total, 0);
  const totalQuitado   = vendas.filter(v => v.situacao === 'quitado').reduce((s, v) => s + v.total, 0);
  const totalPendente  = vendas.filter(v => v.situacao === 'pendente' || v.situacao === 'parcial').reduce((s, v) => s + v.total, 0);

  const detalhe = vendas.find(v => v.id === detalheId);

  const salvarPagamento = () => {
    if (!detalhe || !editPag.descricao || !editPag.valor || !editPag.vencimento) return;
    const pag: PagamentoVenda = {
      id: editPag.id || uuid(),
      descricao: editPag.descricao,
      valor: Number(editPag.valor),
      vencimento: editPag.vencimento,
      pago: editPag.pago || false,
      pagoEm: editPag.pagoEm,
    };
    const pagamentos = editPag.id
      ? detalhe.pagamentos.map(p => p.id === pag.id ? pag : p)
      : [...detalhe.pagamentos, pag];
    const situacao = calcularSituacaoVenda(pagamentos, detalhe.total);
    onSalvar({ ...detalhe, pagamentos, situacao });
    setEditPag({});
    setShowAddPag(false);
  };

  const togglePago = (venda: Venda, pagId: string) => {
    const pagamentos = venda.pagamentos.map(p =>
      p.id === pagId ? { ...p, pago: !p.pago, pagoEm: !p.pago ? hoje() : undefined } : p
    );
    onSalvar({ ...venda, pagamentos, situacao: calcularSituacaoVenda(pagamentos, venda.total) });
  };

  const removerPagamento = (pagId: string) => {
    if (!detalhe) return;
    const pagamentos = detalhe.pagamentos.filter(p => p.id !== pagId);
    onSalvar({ ...detalhe, pagamentos, situacao: calcularSituacaoVenda(pagamentos, detalhe.total) });
  };

  const cardStyle = (f: SituacaoVenda | 'todos'): React.CSSProperties => ({
    flex: 1, padding: '14px 18px', borderRadius: 12,
    border: filtro === f ? '1px solid var(--blue)' : '1px solid var(--border)',
    background: filtro === f ? 'rgba(59,130,246,0.06)' : 'var(--surface)',
    cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
    boxShadow: filtro === f ? '0 0 0 2px rgba(59,130,246,0.12)' : 'none',
  });

  const inp: React.CSSProperties = {
    width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
    fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div>
      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 340, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar venda, cliente ou orçamento..."
            style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', background: 'transparent', width: '100%' }} />
          {busca && <button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>×</button>}
        </div>
        <button onClick={() => setShowRelatorio(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: "'Inter',sans-serif", color: 'var(--text)', whiteSpace: 'nowrap' }}>
          📊 Relatório
        </button>
      </div>

      {/* Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <button style={cardStyle('todos')} onClick={() => setFiltro('todos')}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Total vendas ({vendas.length})</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--blue)' }}>{fmtMoeda(totalGeral)}</div>
        </button>
        <button style={cardStyle('pendente')} onClick={() => setFiltro(filtro === 'pendente' ? 'todos' : 'pendente')}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>A receber ({vendas.filter(v => v.situacao === 'pendente' || v.situacao === 'parcial').length})</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--amber)' }}>{fmtMoeda(totalPendente)}</div>
        </button>
        <button style={cardStyle('quitado')} onClick={() => setFiltro(filtro === 'quitado' ? 'todos' : 'quitado')}>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 6 }}>Quitado ({vendas.filter(v => v.situacao === 'quitado').length})</div>
          <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 20, fontWeight: 700, color: 'var(--green)' }}>{fmtMoeda(totalQuitado)}</div>
        </button>
      </div>

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {filtradas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
            {vendas.length === 0 ? 'Nenhuma venda gerada ainda. Aprove um orçamento para criar a primeira venda.' : 'Nenhuma venda encontrada.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[['DATA','data'],['NÚMERO','numero'],['CLIENTE','cliente'],['ORÇAMENTO','orcamento'],['VALOR','valor'],['SITUAÇÃO','situacao'],['','acoes']].map(([label, key]) => (
                    <th key={key} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.7px', padding: '12px 16px', whiteSpace: 'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(v => (
                  <tr key={v.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => setDetalheId(v.id)}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {format(new Date(v.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{v.numero}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{v.clienteNome}</div>
                      {v.contato && <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{v.contato}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text3)' }}>{v.orcamentoNumero}</td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>{fmtMoeda(v.total)}</td>
                    <td style={{ padding: '12px 16px' }}>{badgeSituacao(v.situacao)}</td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <button onClick={e => openMenu(v.id, e)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', whiteSpace: 'nowrap' }}>
                        Ações <span style={{ fontSize: 10 }}>▼</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Menu de ações */}
      {menuOpen && (() => {
        const vMenu = vendas.find(x => x.id === menuOpen);
        const podeEditar = isAdmin || vMenu?.editavel;
        const menuBtn = (onClick: () => void, label: string, color?: string, disabled?: boolean): React.ReactNode => (
          <button onClick={disabled ? undefined : onClick}
            style={{ display: 'block', width: '100%', textAlign: 'left', padding: '8px 12px', border: 'none', background: 'none', cursor: disabled ? 'default' : 'pointer', fontSize: 13, borderRadius: 7, color: disabled ? 'var(--text3)' : (color || 'var(--text)'), opacity: disabled ? 0.6 : 1 }}
            onMouseEnter={e => { if (!disabled) e.currentTarget.style.background = 'var(--surface2)'; }}
            onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
            {label}
          </button>
        );
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(null)} />
            <div style={{ position: 'fixed', top: menuPos.top, right: menuPos.right, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, zIndex: 50, minWidth: 210, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
              {menuBtn(() => { setDetalheId(menuOpen); setMenuOpen(null); }, '📋 Ver detalhes / pagamentos')}
              {menuBtn(() => {
                if (!podeEditar) return;
                const v = vendas.find(x => x.id === menuOpen);
                if (v) { setEditForm({ contato: v.contato, observacoes: v.observacoes }); setEditVendaId(menuOpen); }
                setMenuOpen(null);
              }, podeEditar ? '✏️ Editar venda' : '🔒 Editar venda (bloqueado)', undefined, !podeEditar)}
              {menuBtn(() => { onVerOS(menuOpen); setMenuOpen(null); }, '🔧 Ver Ordem de Serviço')}
              {isAdmin && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  {menuBtn(() => {
                    const v = vendas.find(x => x.id === menuOpen);
                    if (v) onSalvar({ ...v, editavel: !v.editavel });
                    setMenuOpen(null);
                  }, vMenu?.editavel ? '🔒 Bloquear edição' : '🔓 Liberar edição para operacional')}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  {menuBtn(() => {
                    const v = vendas.find(x => x.id === menuOpen);
                    if (v && v.situacao !== 'cancelado') onSalvar({ ...v, situacao: 'cancelado' });
                    setMenuOpen(null);
                  }, '🚫 Cancelar venda', 'var(--amber)')}
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  {menuBtn(() => { setConfirmDelete(menuOpen); setMenuOpen(null); }, '🗑️ Excluir venda', 'var(--red)')}
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* Modal de detalhe / pagamentos */}
      {detalhe && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setDetalheId(null); setShowAddPag(false); setEditPag({}); } }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 700, maxHeight: '90vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            {/* Header */}
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18 }}>{detalhe.numero}</span>
                  {badgeSituacao(detalhe.situacao)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text2)' }}>{detalhe.clienteNome}{detalhe.contato ? ` · ${detalhe.contato}` : ''}</div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>Orçamento: {detalhe.orcamentoNumero} · Criado em {format(new Date(detalhe.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</div>
              </div>
              <button onClick={() => { setDetalheId(null); setShowAddPag(false); setEditPag({}); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>

            <div style={{ padding: '18px 24px' }}>
              {/* Itens */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.8px', marginBottom: 10 }}>ITENS CONTRATADOS</div>
                <div style={{ background: 'var(--bg)', borderRadius: 10, overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {detalhe.itens.map((item, i) => (
                    <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', borderBottom: i < detalhe.itens.length - 1 ? '1px solid var(--border)' : 'none' }}>
                      <div>
                        <div style={{ fontSize: 13, color: 'var(--text)' }}>{item.descricao}</div>
                        <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{item.quantidade}× {fmtMoeda(item.valorUnitario)}{item.periodo ? ` · ${item.periodo}` : ''}</div>
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{fmtMoeda(item.quantidade * item.valorUnitario)}</div>
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 24, padding: '10px 14px', fontSize: 13 }}>
                  {detalhe.desconto > 0 && <span style={{ color: 'var(--text3)' }}>Desconto {detalhe.desconto}%</span>}
                  {detalhe.impostos > 0 && <span style={{ color: 'var(--text3)' }}>Impostos {detalhe.impostos}%</span>}
                  <span style={{ fontWeight: 700, color: 'var(--text)', fontSize: 15 }}>Total: {fmtMoeda(detalhe.total)}</span>
                </div>
              </div>

              {/* Pagamentos */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.8px' }}>PAGAMENTOS</div>
                  {isAdmin && (
                    <button onClick={() => { setShowAddPag(true); setEditPag({ vencimento: hoje() }); }}
                      style={{ padding: '5px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 12, fontFamily: "'Inter',sans-serif", color: 'var(--text)' }}>
                      + Adicionar
                    </button>
                  )}
                </div>

                {/* Formulário de novo pagamento */}
                {showAddPag && (
                  <div style={{ background: 'var(--bg)', borderRadius: 10, padding: 14, marginBottom: 12, border: '1px solid var(--border)' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px', gap: 8, marginBottom: 8 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Descrição</div>
                        <input value={editPag.descricao || ''} onChange={e => setEditPag(p => ({ ...p, descricao: e.target.value }))}
                          placeholder="Ex: Sinal 50%, 1ª parcela..." style={inp} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Valor (R$)</div>
                        <input type="number" value={editPag.valor || ''} onChange={e => setEditPag(p => ({ ...p, valor: Number(e.target.value) }))}
                          placeholder="0,00" style={inp} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Vencimento</div>
                        <input type="date" value={editPag.vencimento || ''} onChange={e => setEditPag(p => ({ ...p, vencimento: e.target.value }))} style={inp} />
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button onClick={() => { setShowAddPag(false); setEditPag({}); }}
                        style={{ padding: '7px 14px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>Cancelar</button>
                      <button onClick={salvarPagamento}
                        style={{ padding: '7px 14px', borderRadius: 8, border: 'none', background: 'var(--text)', color: '#fff', cursor: 'pointer', fontSize: 13 }}>Salvar</button>
                    </div>
                  </div>
                )}

                {detalhe.pagamentos.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text3)', fontSize: 13, background: 'var(--bg)', borderRadius: 10 }}>
                    Nenhum pagamento registrado. Adicione sinal, parcelas ou pagamento total.
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {detalhe.pagamentos.map(pag => (
                      <div key={pag.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: pag.pago ? 'rgba(16,185,129,0.05)' : 'var(--bg)', borderRadius: 10, border: `1px solid ${pag.pago ? 'rgba(16,185,129,0.2)' : 'var(--border)'}` }}>
                        <button onClick={() => isAdmin && togglePago(detalhe, pag.id)}
                          style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${pag.pago ? 'var(--green)' : 'var(--border)'}`, background: pag.pago ? 'var(--green)' : 'transparent', cursor: isAdmin ? 'pointer' : 'default', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {pag.pago && <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', textDecoration: pag.pago ? 'line-through' : 'none' }}>{pag.descricao}</div>
                          <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>
                            Vencimento: {format(new Date(pag.vencimento + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                            {pag.pagoEm && ` · Pago em ${format(new Date(pag.pagoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}`}
                          </div>
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 700, color: pag.pago ? 'var(--green)' : 'var(--text)', whiteSpace: 'nowrap' }}>{fmtMoeda(pag.valor)}</div>
                        {isAdmin && (
                          <button onClick={() => removerPagamento(pag.id)}
                            style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
                        )}
                      </div>
                    ))}
                    {/* Resumo financeiro */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 20, padding: '10px 14px 0', fontSize: 12.5, color: 'var(--text3)' }}>
                      <span>Total pago: <strong style={{ color: 'var(--green)' }}>{fmtMoeda(detalhe.pagamentos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0))}</strong></span>
                      <span>Restante: <strong style={{ color: 'var(--amber)' }}>{fmtMoeda(detalhe.total - detalhe.pagamentos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0))}</strong></span>
                    </div>
                  </div>
                )}
              </div>

              {/* Observações */}
              {detalhe.observacoes && (
                <div style={{ marginTop: 18, padding: '12px 14px', background: 'var(--bg)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>OBSERVAÇÕES</div>
                  <div style={{ fontSize: 13, color: 'var(--text2)', whiteSpace: 'pre-wrap' }}>{detalhe.observacoes}</div>
                </div>
              )}

              {/* Botão ver OS */}
              <div style={{ marginTop: 18, display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => { setDetalheId(null); onVerOS(detalhe.id); }}
                  style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                  🔧 Ver Ordem de Serviço
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edição da venda */}
      {editVendaId && (() => {
        const v = vendas.find(x => x.id === editVendaId);
        if (!v) return null;
        return (
          <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
            onClick={e => { if (e.target === e.currentTarget) setEditVendaId(null); }}>
            <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 480, boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
              <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 17 }}>Editar venda</div>
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>{v.numero} · {v.clienteNome}</div>
                </div>
                <button onClick={() => setEditVendaId(null)}
                  style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
              </div>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ padding: '10px 14px', background: 'rgba(59,130,246,0.06)', borderRadius: 9, border: '1px solid rgba(59,130,246,0.15)', fontSize: 12.5, color: 'var(--blue)' }}>
                  ℹ️ Itens e valores refletem o orçamento aprovado e não podem ser alterados.
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.4px' }}>CONTATO</div>
                  <input value={editForm.contato} onChange={e => setEditForm(f => ({ ...f, contato: e.target.value }))}
                    placeholder="Nome do contato" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.4px' }}>OBSERVAÇÕES</div>
                  <textarea value={editForm.observacoes} onChange={e => setEditForm(f => ({ ...f, observacoes: e.target.value }))}
                    placeholder="Condições, anotações internas..." rows={4}
                    style={{ ...inp, resize: 'vertical' as const, lineHeight: 1.6 }} />
                </div>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 4 }}>
                  <button onClick={() => setEditVendaId(null)}
                    style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>Cancelar</button>
                  <button onClick={() => { onSalvar({ ...v, contato: editForm.contato, observacoes: editForm.observacoes }); setEditVendaId(null); }}
                    style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--text)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salvar</button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Excluir venda?</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Esta ação não pode ser desfeita. A Ordem de Serviço vinculada também será removida.</div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirmDelete(null)}
                style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text)' }}>Cancelar</button>
              <button onClick={() => { onDelete(confirmDelete); setConfirmDelete(null); }}
                style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--red)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Excluir</button>
            </div>
          </div>
        </div>
      )}

      {showRelatorio && (
        <Relatorio tipo="vendas" vendas={vendas} onFechar={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}
