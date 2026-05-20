import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { OrdemServico as OS, OSStatus } from '../types';
import { fmtMoeda } from './ui';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Relatorio from './Relatorio';
import cfg from '../config';

interface Props {
  ordens: OS[];
  userRole: 'admin' | 'operacional';
  onSalvar: (os: OS) => void;
  onDelete: (id: string) => void;
  filtroVendaId?: string | null;
  onLimparFiltro?: () => void;
}

const statusMap: Record<OSStatus, { label: string; color: string; bg: string }> = {
  pendente:     { label: 'Pendente',      color: 'var(--amber)',  bg: 'rgba(245,158,11,0.1)' },
  em_andamento: { label: 'Em andamento',  color: 'var(--blue)',   bg: 'rgba(59,130,246,0.1)' },
  concluida:    { label: 'Concluída',     color: 'var(--green)',  bg: 'rgba(16,185,129,0.1)' },
  cancelada:    { label: 'Cancelada',     color: 'var(--red)',    bg: 'rgba(239,68,68,0.1)'  },
};

function BadgeOS({ status }: { status: OSStatus }) {
  const { label, color, bg } = statusMap[status];
  return (
    <span style={{ fontSize: 12, fontWeight: 600, color, background: bg, padding: '3px 10px', borderRadius: 20 }}>
      {label}
    </span>
  );
}

const inp: React.CSSProperties = {
  width: '100%', padding: '9px 12px', borderRadius: 9, border: '1px solid var(--border)',
  background: 'var(--surface)', color: 'var(--text)', fontSize: 13,
  fontFamily: "'Inter',sans-serif", outline: 'none', boxSizing: 'border-box',
};

const textareaStyle: React.CSSProperties = {
  ...inp, resize: 'vertical' as const, minHeight: 72,
};

function OsPrintModal({ osPrint, onClose, statusMap }: { osPrint: OS; onClose: () => void; statusMap: Record<OSStatus, { label: string; color: string; bg: string }> }) {
  useEffect(() => {
    document.body.classList.add('imprimindo');
    return () => document.body.classList.remove('imprimindo');
  }, []);

  return (
    <div className="os-impressao-overlay"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="os-impressao-caixa"
        style={{ background: '#fff', color: '#111', borderRadius: 16, width: '100%', maxWidth: 720, maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: "'Inter',sans-serif" }}>
        {/* Barra de ações (não imprime) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb' }} className="no-print">
          <span style={{ fontWeight: 600, fontSize: 14 }}>Visualização da OS · {osPrint.numero}</span>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>🖨️ Imprimir</button>
            <button onClick={onClose}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13 }}>Fechar</button>
          </div>
        </div>

        {/* Conteúdo imprimível */}
        <div style={{ padding: '28px 36px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 26, letterSpacing: '-0.5px', color: '#111' }}>ORDEM DE SERVIÇO</div>
              <div style={{ fontSize: 15, color: '#6b7280', marginTop: 2 }}>{cfg.nome} · {cfg.tagline}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 24, color: '#1d4ed8' }}>{osPrint.numero}</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                Emitida em {format(new Date(osPrint.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
              </div>
              <div style={{ marginTop: 6 }}>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, background: statusMap[osPrint.status].bg, color: statusMap[osPrint.status].color }}>
                  {statusMap[osPrint.status].label.toUpperCase()}
                </span>
              </div>
            </div>
          </div>

          <div style={{ height: 2, background: '#e5e7eb', marginBottom: 24, borderRadius: 2 }} />

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 22 }}>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', marginBottom: 8 }}>CLIENTE</div>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{osPrint.clienteNome}</div>
              {osPrint.contato && <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>Contato: {osPrint.contato}</div>}
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>Ref. {osPrint.orcamentoNumero} · {osPrint.vendaNumero}</div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', marginBottom: 8 }}>LOCAL DO EVENTO</div>
              <div style={{ fontSize: 13, color: osPrint.enderecoEvento ? '#111' : '#9ca3af', fontStyle: osPrint.enderecoEvento ? 'normal' : 'italic' }}>
                {osPrint.enderecoEvento || 'Não informado'}
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', marginBottom: 8 }}>DATAS E HORÁRIOS</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>Montagem: </span>
                  <strong>{osPrint.dataMontagem ? format(new Date(osPrint.dataMontagem + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>Retirada: </span>
                  <strong>{osPrint.dataRetirada ? format(new Date(osPrint.dataRetirada + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</strong>
                </div>
                <div style={{ fontSize: 13, color: '#374151' }}>
                  <span style={{ color: '#9ca3af', fontSize: 11 }}>Horário: </span>
                  <strong>{osPrint.horarioInicio || '—'}{osPrint.horarioFim ? ` às ${osPrint.horarioFim}` : ''}</strong>
                </div>
              </div>
            </div>
            <div style={{ background: '#f9fafb', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', marginBottom: 8 }}>EQUIPE OPERACIONAL</div>
              <div style={{ fontSize: 13, color: osPrint.equipe ? '#111' : '#9ca3af', fontStyle: osPrint.equipe ? 'normal' : 'italic', marginBottom: 6 }}>
                {osPrint.equipe || 'Não informado'}
              </div>
              <div style={{ fontSize: 12, color: '#374151' }}>
                <span style={{ color: '#9ca3af', fontSize: 11 }}>Motorista: </span>
                <span style={{ color: osPrint.motorista ? '#111' : '#9ca3af', fontStyle: osPrint.motorista ? 'normal' : 'italic' }}>
                  {osPrint.motorista || 'Não informado'}
                </span>
              </div>
            </div>
          </div>

          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: '#9ca3af', letterSpacing: '1px', marginBottom: 10 }}>MATERIAIS / ITENS LOCADOS</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: '#f3f4f6' }}>
                  <th style={{ textAlign: 'left', padding: '8px 12px', fontWeight: 600, color: '#374151', fontSize: 11 }}>DESCRIÇÃO</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151', fontSize: 11 }}>QTD</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#374151', fontSize: 11 }}>VALOR UNIT.</th>
                  <th style={{ textAlign: 'center', padding: '8px 12px', fontWeight: 600, color: '#374151', fontSize: 11 }}>PERÍODO</th>
                  <th style={{ textAlign: 'right', padding: '8px 12px', fontWeight: 600, color: '#374151', fontSize: 11 }}>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {osPrint.itens.map(item => (
                  <tr key={item.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '10px 12px', color: '#111', fontWeight: 500 }}>{item.descricao}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#374151' }}>{item.quantidade}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', color: '#374151' }}>{fmtMoeda(item.valorUnitario)}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'center', color: '#6b7280' }}>{item.periodo || '—'}</td>
                    <td style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#111' }}>{fmtMoeda(item.quantidade * item.valorUnitario)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {osPrint.observacoesOperacionais && (
            <div style={{ background: '#fffbeb', borderRadius: 10, padding: '14px 16px', marginBottom: 20, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#92400e', letterSpacing: '1px', marginBottom: 6 }}>⚠️ OBSERVAÇÕES OPERACIONAIS</div>
              <div style={{ fontSize: 13, color: '#78350f', lineHeight: 1.6 }}>{osPrint.observacoesOperacionais}</div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginTop: 32 }}>
            {['Responsável Operacional', 'Motorista', 'Cliente / Responsável'].map(label => (
              <div key={label} style={{ textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #d1d5db', paddingTop: 8, marginTop: 32 }}>
                  <div style={{ fontSize: 11, color: '#9ca3af' }}>{label}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
            <span>{cfg.nome} — {cfg.tagline}</span>
            <span>{osPrint.numero} · {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: ptBR })}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdemServico({ ordens, userRole, onSalvar, onDelete, filtroVendaId, onLimparFiltro }: Props) {
  const isAdmin = userRole === 'admin';
  const [filtroStatus, setFiltroStatus] = useState<OSStatus | 'todos'>('todos');
  const [busca, setBusca] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [printId, setPrintId] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [form, setForm] = useState<Partial<OS>>({});
  const [showRelatorio, setShowRelatorio] = useState(false);

  const openMenu = (id: string, e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 300) {
      setMenuPos({ bottom: window.innerHeight - rect.top + 4, right });
    } else {
      setMenuPos({ top: rect.bottom + 4, right });
    }
    setMenuOpen(menuOpen === id ? null : id);
  };

  const abrirEdicao = (os: OS) => {
    setForm({ ...os });
    setEditId(os.id);
  };

  const filtradas = useMemo(() => {
    let list = ordens;
    if (filtroVendaId) list = list.filter(o => o.vendaId === filtroVendaId);
    if (filtroStatus !== 'todos') list = list.filter(o => o.status === filtroStatus);
    if (busca) {
      const q = busca.toLowerCase();
      list = list.filter(o =>
        o.clienteNome.toLowerCase().includes(q) ||
        o.numero.toLowerCase().includes(q) ||
        o.vendaNumero.toLowerCase().includes(q)
      );
    }
    return list;
  }, [ordens, filtroVendaId, filtroStatus, busca]);

  const cardStyle = (f: OSStatus | 'todos'): React.CSSProperties => ({
    flex: 1, padding: '14px 18px', borderRadius: 12,
    border: filtroStatus === f ? '1px solid var(--blue)' : '1px solid var(--border)',
    background: filtroStatus === f ? 'rgba(59,130,246,0.06)' : 'var(--surface)',
    cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
    boxShadow: filtroStatus === f ? '0 0 0 2px rgba(59,130,246,0.12)' : 'none',
  });

  const salvar = () => {
    if (!form.id) return;
    const os = ordens.find(o => o.id === form.id);
    if (!os) return;
    onSalvar({ ...os, ...form } as OS);
    setEditId(null);
    setForm({});
  };

  const osPrint = ordens.find(o => o.id === printId);

  return (
    <div>
      {/* Alerta de filtro por venda */}
      {filtroVendaId && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 16px', background: 'rgba(59,130,246,0.08)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 10, marginBottom: 16, fontSize: 13 }}>
          <span style={{ color: 'var(--blue)' }}>🔍 Filtrando OS por venda selecionada</span>
          <button onClick={onLimparFiltro} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--blue)', fontWeight: 600, fontSize: 13 }}>Limpar filtro</button>
        </div>
      )}

      {/* Topo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, maxWidth: 340, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e => setBusca(e.target.value)} placeholder="Buscar OS, cliente ou venda..."
            style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', background: 'transparent', width: '100%' }} />
          {busca && <button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, padding: 0 }}>×</button>}
        </div>
        <button onClick={() => setShowRelatorio(true)}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 16px', borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: "'Inter',sans-serif", color: 'var(--text)', whiteSpace: 'nowrap' }}>
          📊 Relatório
        </button>
      </div>

      {/* Cards — contagens baseadas na lista com filtro de venda aplicado */}
      {(() => {
        const base = filtroVendaId ? ordens.filter(o => o.vendaId === filtroVendaId) : ordens;
        return (
          <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
            <button style={cardStyle('todos')} onClick={() => setFiltroStatus('todos')}>
              <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>Total ({base.length})</div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, color: 'var(--text)' }}>Todas as OS</div>
            </button>
            {(['pendente', 'em_andamento', 'concluida', 'cancelada'] as OSStatus[]).map(s => (
              <button key={s} style={cardStyle(s)} onClick={() => setFiltroStatus(filtroStatus === s ? 'todos' : s)}>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 4 }}>{statusMap[s].label} ({base.filter(o => o.status === s).length})</div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, color: statusMap[s].color }}>
                  {base.filter(o => o.status === s).length === 0 ? '—' : base.filter(o => o.status === s).length + ' OS'}
                </div>
              </button>
            ))}
          </div>
        );
      })()}

      {/* Tabela */}
      <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' }}>
        {filtradas.length === 0 ? (
          <div style={{ padding: 48, textAlign: 'center', color: 'var(--text3)', fontSize: 14 }}>
            {ordens.length === 0 ? 'Nenhuma OS gerada ainda. As ordens de serviço são criadas automaticamente ao aprovar um orçamento.' : 'Nenhuma OS encontrada.'}
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {[['DATA','data'],['NÚMERO OS','numero'],['CLIENTE','cliente'],['VENDA','venda'],['EVENTO','evento'],['STATUS','status'],['','acoes']].map(([label, key]) => (
                    <th key={key} style={{ textAlign: 'left', fontSize: 10.5, fontWeight: 500, color: 'var(--text3)', letterSpacing: '0.7px', padding: '12px 16px', whiteSpace: 'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtradas.map(os => (
                  <tr key={os.id}
                    style={{ borderBottom: '1px solid var(--border)', transition: 'background .1s', cursor: 'pointer' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    onClick={() => abrirEdicao(os)}
                  >
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text2)', whiteSpace: 'nowrap' }}>
                      {format(new Date(os.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--blue)' }}>{os.numero}</div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>{os.clienteNome}</div>
                      {os.contato && <div style={{ fontSize: 11.5, color: 'var(--text3)' }}>{os.contato}</div>}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text3)' }}>{os.vendaNumero}</td>
                    <td style={{ padding: '12px 16px' }}>
                      {os.enderecoEvento ? (
                        <div style={{ fontSize: 12.5, color: 'var(--text2)', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{os.enderecoEvento}</div>
                      ) : (
                        <span style={{ fontSize: 12, color: 'var(--text3)', fontStyle: 'italic' }}>Não informado</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px' }}><BadgeOS status={os.status} /></td>
                    <td style={{ padding: '12px 16px' }} onClick={e => e.stopPropagation()}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button onClick={() => setPrintId(os.id)} title="Imprimir OS"
                          style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text2)' }}>
                          🖨️
                        </button>
                        <button onClick={e => openMenu(os.id, e)}
                          style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', whiteSpace: 'nowrap' }}>
                          Ações <span style={{ fontSize: 10 }}>▼</span>
                        </button>
                      </div>
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
        const osAtual = ordens.find(o => o.id === menuOpen);
        return (
          <>
            <div style={{ position: 'fixed', inset: 0, zIndex: 40 }} onClick={() => setMenuOpen(null)} />
            <div style={{ position: 'fixed', top: menuPos.top, bottom: menuPos.bottom, right: menuPos.right, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 4, zIndex: 50, minWidth: 210, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' }}>
              <div style={{ padding: '6px 12px 2px', fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.5px' }}>STATUS</div>
              {(['pendente', 'em_andamento', 'concluida', 'cancelada'] as OSStatus[]).map(s => {
                const isAtual = osAtual?.status === s;
                return (
                  <button key={s} onClick={() => { if (osAtual) onSalvar({ ...osAtual, status: s }); setMenuOpen(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: isAtual ? 'var(--surface2)' : 'none', cursor: 'pointer', fontSize: 13, borderRadius: 7, color: 'var(--text)', fontWeight: isAtual ? 600 : 400 }}
                    onMouseEnter={e => { if (!isAtual) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={e => { if (!isAtual) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: statusMap[s].color, flexShrink: 0 }} />
                    {statusMap[s].label}
                    {isAtual && <span style={{ marginLeft: 'auto', fontSize: 11, color: 'var(--text3)' }}>✓ atual</span>}
                  </button>
                );
              })}
              <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
              <div style={{ padding: '6px 12px 2px', fontSize: 10.5, fontWeight: 600, color: 'var(--text3)', letterSpacing: '0.5px' }}>AÇÕES</div>
              <button onClick={() => { if (osAtual) abrirEdicao(osAtual); setMenuOpen(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, borderRadius: 7, color: 'var(--text)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                ✏️ Editar OS
              </button>
              <button onClick={() => { setPrintId(menuOpen); setMenuOpen(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, borderRadius: 7, color: 'var(--text)' }}
                onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                🖨️ Imprimir OS
              </button>
              {isAdmin && (
                <>
                  <div style={{ borderTop: '1px solid var(--border)', margin: '4px 0' }} />
                  <button onClick={() => { setConfirmDelete(menuOpen); setMenuOpen(null); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', textAlign: 'left', padding: '7px 12px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 13, borderRadius: 7, color: 'var(--red)' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(239,68,68,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                    🗑️ Excluir OS
                  </button>
                </>
              )}
            </div>
          </>
        );
      })()}

      {/* Modal de edição */}
      {editId && form.id && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
          onClick={e => { if (e.target === e.currentTarget) { setEditId(null); setForm({}); } }}>
          <div style={{ background: 'var(--surface)', borderRadius: 16, width: '100%', maxWidth: 680, maxHeight: '92vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.25)' }}>
            <div style={{ padding: '22px 24px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 2 }}>Editar {form.numero}</div>
                <div style={{ fontSize: 13, color: 'var(--text3)' }}>{form.clienteNome}</div>
              </div>
              <button onClick={() => { setEditId(null); setForm({}); }}
                style={{ width: 32, height: 32, borderRadius: 8, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>×</button>
            </div>

            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Status */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6, letterSpacing: '0.5px' }}>STATUS DA EXECUÇÃO</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {(['pendente', 'em_andamento', 'concluida', 'cancelada'] as OSStatus[]).map(s => (
                    <button key={s} onClick={() => setForm(f => ({ ...f, status: s }))}
                      style={{ padding: '7px 14px', borderRadius: 9, border: `1px solid ${form.status === s ? statusMap[s].color : 'var(--border)'}`, background: form.status === s ? statusMap[s].bg : 'transparent', color: form.status === s ? statusMap[s].color : 'var(--text2)', cursor: 'pointer', fontSize: 13, fontWeight: form.status === s ? 600 : 400 }}>
                      {statusMap[s].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Endereço do evento */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>ENDEREÇO DO EVENTO</div>
                <input value={form.enderecoEvento || ''} onChange={e => setForm(f => ({ ...f, enderecoEvento: e.target.value }))}
                  placeholder="Rua, número, bairro, cidade..." style={inp} />
              </div>

              {/* Datas e horários */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>DATA DE MONTAGEM</div>
                  <input type="date" value={form.dataMontagem || ''} onChange={e => setForm(f => ({ ...f, dataMontagem: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>DATA DE RETIRADA</div>
                  <input type="date" value={form.dataRetirada || ''} onChange={e => setForm(f => ({ ...f, dataRetirada: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>HORÁRIO INÍCIO</div>
                  <input type="time" value={form.horarioInicio || ''} onChange={e => setForm(f => ({ ...f, horarioInicio: e.target.value }))} style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>HORÁRIO FIM</div>
                  <input type="time" value={form.horarioFim || ''} onChange={e => setForm(f => ({ ...f, horarioFim: e.target.value }))} style={inp} />
                </div>
              </div>

              {/* Equipe e Motorista */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>EQUIPE RESPONSÁVEL</div>
                  <input value={form.equipe || ''} onChange={e => setForm(f => ({ ...f, equipe: e.target.value }))}
                    placeholder="Nomes separados por vírgula" style={inp} />
                </div>
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>MOTORISTA</div>
                  <input value={form.motorista || ''} onChange={e => setForm(f => ({ ...f, motorista: e.target.value }))}
                    placeholder="Nome do motorista" style={inp} />
                </div>
              </div>

              {/* Observações operacionais */}
              <div>
                <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 6 }}>OBSERVAÇÕES OPERACIONAIS</div>
                <textarea value={form.observacoesOperacionais || ''} onChange={e => setForm(f => ({ ...f, observacoesOperacionais: e.target.value }))}
                  placeholder="Instruções para a equipe, cuidados especiais, pontos de atenção..." style={textareaStyle} />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', paddingTop: 4 }}>
                <button onClick={() => { setEditId(null); setForm({}); }}
                  style={{ padding: '9px 20px', borderRadius: 9, border: '1px solid var(--border)', background: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--text2)' }}>Cancelar</button>
                <button onClick={salvar}
                  style={{ padding: '9px 20px', borderRadius: 9, border: 'none', background: 'var(--text)', color: '#fff', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>Salvar OS</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de impressão / visualização da OS — renderizado via portal para print correto */}
      {osPrint && ReactDOM.createPortal(
        <OsPrintModal osPrint={osPrint} onClose={() => setPrintId(null)} statusMap={statusMap} />,
        document.body
      )}

      {/* Confirm delete */}
      {confirmDelete && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', zIndex: 400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ background: 'var(--surface)', borderRadius: 14, padding: 28, maxWidth: 380, width: '100%', boxShadow: '0 20px 60px rgba(0,0,0,0.25)', textAlign: 'center' }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>🗑️</div>
            <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 18, marginBottom: 8 }}>Excluir OS?</div>
            <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 24 }}>Esta ação não pode ser desfeita.</div>
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
        <Relatorio tipo="ordens" ordens={ordens} onFechar={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}
