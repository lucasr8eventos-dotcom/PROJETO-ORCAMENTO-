import React, { useState, useMemo } from 'react';
import { Orcamento, OrcamentoStatus, Cliente, Venda } from '../types';
import { StatusBadge, fmtMoeda } from './ui';
import { gerarPDF } from '../pdfGenerator';
import { pdfsApi } from '../api';
import { loadConfig } from './Configuracoes';
import { format, addMonths, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Relatorio from './Relatorio';

interface Props {
  orcamentos: Orcamento[];
  clientes: Cliente[];
  vendas: Venda[];
  onNovo: () => void;
  onEditar: (o: Orcamento) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: OrcamentoStatus) => void;
  onDuplicar: (o: Orcamento) => void;
  onVerVenda?: (vendaId: string) => void;
  onToast?: (msg: string) => void;
}

type FiltroCard = 'todos' | 'previstos' | 'aprovado' | 'recusado';

const isPrevistos = (s: OrcamentoStatus) => s === 'aguardando' || s === 'enviado' || s === 'rascunho';

export default function Orcamentos({ orcamentos, clientes, vendas, onNovo, onEditar, onDelete, onStatusChange, onDuplicar, onVerVenda, onToast }: Props) {
  const [periodo, setPeriodo] = useState(startOfMonth(new Date()));
  const [busca, setBusca] = useState('');
  const [filtroCard, setFiltroCard] = useState<FiltroCard>('todos');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState<{ top?: number; bottom?: number; right: number }>({ right: 0 });
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [showRelatorio, setShowRelatorio] = useState(false);
  const [pdfLoadingId, setPdfLoadingId] = useState<string | null>(null);

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

  const inicioMes = startOfMonth(periodo);
  const fimMes = endOfMonth(periodo);

  const doPeriodo = useMemo(() => orcamentos.filter(o => {
    const d = new Date(o.criadoEm + 'T12:00:00');
    return d >= inicioMes && d <= fimMes;
  }), [orcamentos, inicioMes, fimMes]);

  const filtered = useMemo(() => {
    return doPeriodo.filter(o => {
      if (filtroCard === 'previstos' && !isPrevistos(o.status)) return false;
      if (filtroCard === 'aprovado' && o.status !== 'aprovado') return false;
      if (filtroCard === 'recusado' && o.status !== 'recusado') return false;
      if (busca) {
        const q = busca.toLowerCase();
        if (!o.clienteNome.toLowerCase().includes(q) && !o.numero.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [doPeriodo, filtroCard, busca]);

  const totalRecusados   = doPeriodo.filter(o => o.status === 'recusado').length;
  const totalPrevistos   = doPeriodo.filter(o => isPrevistos(o.status)).length;
  const totalAprovados   = doPeriodo.filter(o => o.status === 'aprovado').length;
  const valorRecusados   = doPeriodo.filter(o => o.status === 'recusado').reduce((s, o) => s + o.total, 0);
  const valorPrevistos   = doPeriodo.filter(o => isPrevistos(o.status)).reduce((s, o) => s + o.total, 0);
  const valorAprovados   = doPeriodo.filter(o => o.status === 'aprovado').reduce((s, o) => s + o.total, 0);
  const valorTotal       = doPeriodo.reduce((s, o) => s + o.total, 0);

  const cardBase: React.CSSProperties = {
    flex: 1, padding: '16px 20px', borderRadius: 12, border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', transition: 'all .15s', textAlign: 'left',
  };

  const cardAtivo = (f: FiltroCard): React.CSSProperties => filtroCard === f
    ? { ...cardBase, borderColor: 'var(--blue)', boxShadow: '0 0 0 2px rgba(59,130,246,0.15)' }
    : cardBase;

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:10,marginBottom:18,flexWrap:'wrap' }}>
        <div style={{ display:'flex',alignItems:'center',gap:6,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'6px 10px' }}>
          <button onClick={()=>setPeriodo(p=>subMonths(p,1))}
            style={{ width:28,height:28,borderRadius:7,border:'none',background:'none',cursor:'pointer',color:'var(--text)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>←</button>
          <span style={{ fontFamily:"'Outfit',sans-serif",fontWeight:600,fontSize:14,minWidth:140,textAlign:'center',color:'var(--text)' }}>
            {format(periodo,"MMMM 'de' yyyy",{locale:ptBR}).replace(/^\w/,c=>c.toUpperCase())}
          </span>
          <button onClick={()=>setPeriodo(p=>addMonths(p,1))}
            style={{ width:28,height:28,borderRadius:7,border:'none',background:'none',cursor:'pointer',color:'var(--text)',fontSize:16,display:'flex',alignItems:'center',justifyContent:'center' }}>→</button>
        </div>

        <div style={{ flex:1,minWidth:200,maxWidth:340,display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente ou número..."
            style={{ border:'none',outline:'none',fontSize:13,fontFamily:"'Inter',sans-serif",color:'var(--text)',background:'transparent',width:'100%' }} />
          {busca && <button onClick={()=>setBusca('')} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16,padding:0 }}>×</button>}
        </div>

        <div style={{ marginLeft:'auto',display:'flex',gap:8 }}>
          <button onClick={() => setShowRelatorio(true)}
            style={{ display:'flex',alignItems:'center',gap:6,padding:'9px 16px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:13.5,fontWeight:500,fontFamily:"'Inter',sans-serif",color:'var(--text)' }}>
            📊 Relatório
          </button>
          <button onClick={onNovo}
            style={{ display:'flex',alignItems:'center',gap:7,padding:'9px 16px',borderRadius:10,background:'var(--text)',color:'#fff',border:'none',cursor:'pointer',fontSize:13.5,fontWeight:500,fontFamily:"'Inter',sans-serif",whiteSpace:'nowrap' }}>
            + Novo orçamento
          </button>
        </div>
      </div>

      <div style={{ display:'flex',gap:12,marginBottom:20,flexWrap:'wrap' }}>
        <button style={cardAtivo('recusado')} onClick={()=>setFiltroCard(filtroCard==='recusado'?'todos':'recusado')}>
          <div style={{ fontSize:12,color:'var(--text3)',marginBottom:6 }}>Recusados ({totalRecusados})</div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:700,color:'var(--red)' }}>{fmtMoeda(valorRecusados)}</div>
        </button>
        <button style={cardAtivo('previstos')} onClick={()=>setFiltroCard(filtroCard==='previstos'?'todos':'previstos')} title="Orçamentos em Rascunho, Enviados ou Aguardando resposta — receita potencial ainda não confirmada">
          <div style={{ fontSize:12,color:'var(--text3)',marginBottom:6 }}>Previstos ({totalPrevistos}) <span style={{ fontSize:10,opacity:0.6 }}>ℹ</span></div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:700,color:'var(--amber)' }}>{fmtMoeda(valorPrevistos)}</div>
        </button>
        <button style={cardAtivo('aprovado')} onClick={()=>setFiltroCard(filtroCard==='aprovado'?'todos':'aprovado')}>
          <div style={{ fontSize:12,color:'var(--text3)',marginBottom:6 }}>Aprovados ({totalAprovados})</div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:700,color:'var(--green)' }}>{fmtMoeda(valorAprovados)}</div>
        </button>
        <button style={cardAtivo('todos')} onClick={()=>setFiltroCard('todos')}>
          <div style={{ fontSize:12,color:'var(--text3)',marginBottom:6 }}>Total do período ({doPeriodo.length})</div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:20,fontWeight:700,color:'var(--blue)' }}>{fmtMoeda(valorTotal)}</div>
        </button>
      </div>

      <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,overflow:'hidden' }}>
        {filtered.length === 0 ? (
          <div style={{ padding:48,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhum orçamento encontrado neste período</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr style={{ borderBottom:'1px solid var(--border)' }}>
                  {[['DATA','data'],['NÚMERO','numero'],['CLIENTE','cliente'],['VALOR','valor'],['SITUAÇÃO','situacao'],['','pdf'],['','acoes']].map(([label, key])=>(
                    <th key={key} style={{ textAlign:'left',fontSize:10.5,fontWeight:500,color:'var(--text3)',letterSpacing:'0.7px',padding:'12px 16px',whiteSpace:'nowrap' }}>{label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}
                    style={{ borderBottom:'1px solid var(--border)',transition:'background .1s' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                  >
                    <td style={{ padding:'12px 16px',fontSize:13,color:'var(--text2)',whiteSpace:'nowrap',cursor:'pointer' }} onClick={()=>onEditar(o)}>
                      {format(new Date(o.criadoEm+'T12:00:00'),'dd/MM/yyyy',{locale:ptBR})}
                    </td>
                    <td style={{ padding:'12px 16px',cursor:'pointer' }} onClick={()=>onEditar(o)}>
                      <div style={{ fontSize:13,fontWeight:600,color:'var(--blue)' }}>{o.numero}</div>
                    </td>
                    <td style={{ padding:'12px 16px',cursor:'pointer' }} onClick={()=>onEditar(o)}>
                      <div style={{ fontSize:13,fontWeight:500,color:'var(--text)' }}>{o.clienteNome}</div>
                      {o.contato && <div style={{ fontSize:11.5,color:'var(--text3)' }}>{o.contato}</div>}
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:13,fontWeight:600,whiteSpace:'nowrap',cursor:'pointer' }} onClick={()=>onEditar(o)}>
                      {fmtMoeda(o.total)}
                    </td>
                    <td style={{ padding:'12px 16px',cursor:'pointer' }} onClick={()=>onEditar(o)}>
                      <div style={{ display:'flex',alignItems:'center',gap:7 }}>
                        <StatusBadge status={o.status} />
                        {(() => { const v = vendas.find(x => x.orcamentoId === o.id); return v ? (
                          <button
                            title="Ver venda gerada"
                            onClick={e => { e.stopPropagation(); onVerVenda?.(v.id); }}
                            style={{ fontSize:11,fontWeight:600,color:'var(--green)',background:'var(--green-bg)',padding:'2px 7px',borderRadius:20,border:'none',cursor:'pointer' }}>
                            💰 {v.numero}
                          </button>
                        ) : null; })()}
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button
                        onClick={async e => {
                          e.stopPropagation();
                          setPdfLoadingId(o.id);
                          try {
                            const b64 = gerarPDF(o, loadConfig(), clientes.find(c=>c.id===o.clienteId));
                            if (b64) {
                              try { await pdfsApi.uploadBase64(o.id, o.numero, b64); } catch {}
                              onToast?.(`✅ PDF ${o.numero} gerado!`);
                            }
                          } finally { setPdfLoadingId(null); }
                        }}
                        disabled={pdfLoadingId === o.id}
                        title="Gerar PDF"
                        style={{ width:32,height:32,borderRadius:8,border:'1px solid var(--border)',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color: pdfLoadingId===o.id ? 'var(--text3)' : 'var(--text2)',opacity: pdfLoadingId===o.id ? 0.5 : 1 }}>
                        {pdfLoadingId === o.id
                          ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeDasharray="28" strokeDashoffset="28"><animate attributeName="stroke-dashoffset" values="28;0" dur="0.8s" repeatCount="indefinite"/></path></svg>
                          : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>}
                      </button>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button onClick={e=>openMenu(o.id, e)}
                        style={{ display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:13,fontFamily:"'Inter',sans-serif",color:'var(--text)',whiteSpace:'nowrap' }}>
                        Ações <span style={{ fontSize:10 }}>▼</span>
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
        const oAtual = orcamentos.find(x => x.id === menuOpen);
        const statusOpts: { s: OrcamentoStatus; label: string; dot: string }[] = [
          { s: 'rascunho',   label: 'Rascunho',   dot: '#9ca3af' },
          { s: 'enviado',    label: 'Enviado',     dot: 'var(--blue)' },
          { s: 'aguardando', label: 'Aguardando',  dot: 'var(--amber)' },
          { s: 'aprovado',   label: 'Aprovado',    dot: 'var(--green)' },
          { s: 'recusado',   label: 'Recusado',    dot: 'var(--red)' },
        ];
        return (
          <>
            <div style={{ position:'fixed',inset:0,zIndex:40 }} onClick={()=>setMenuOpen(null)} />
            <div style={{ position:'fixed',top:menuPos.top,bottom:menuPos.bottom,right:menuPos.right,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:4,zIndex:50,minWidth:210,boxShadow:'0 4px 20px rgba(0,0,0,0.12)' }}>
              <div style={{ padding:'6px 12px 2px',fontSize:10.5,fontWeight:600,color:'var(--text3)',letterSpacing:'0.5px' }}>STATUS</div>
              {statusOpts.map(({ s, label, dot }) => {
                const isAtual = oAtual?.status === s;
                return (
                  <button key={s} onClick={() => { if (oAtual) onStatusChange(oAtual.id, s); setMenuOpen(null); }}
                    style={{ display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'7px 12px',border:'none',background: isAtual ? 'var(--surface2)' : 'none',cursor:'pointer',fontSize:13,borderRadius:7,color: isAtual ? 'var(--text)' : 'var(--text)',fontWeight: isAtual ? 600 : 400 }}
                    onMouseEnter={e => { if (!isAtual) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={e => { if (!isAtual) e.currentTarget.style.background = 'transparent'; }}>
                    <span style={{ width:8,height:8,borderRadius:'50%',background:dot,flexShrink:0 }} />
                    {label}
                    {isAtual && <span style={{ marginLeft:'auto',fontSize:11,color:'var(--text3)' }}>✓ atual</span>}
                  </button>
                );
              })}
              <div style={{ borderTop:'1px solid var(--border)',margin:'4px 0' }} />
              <div style={{ padding:'6px 12px 2px',fontSize:10.5,fontWeight:600,color:'var(--text3)',letterSpacing:'0.5px' }}>AÇÕES</div>
              <button onClick={()=>{if(oAtual)onEditar(oAtual);setMenuOpen(null);}}
                style={{ display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'7px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--text)' }}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                ✏️ Editar orçamento
              </button>
              <button onClick={()=>{if(oAtual)onDuplicar(oAtual);setMenuOpen(null);}}
                style={{ display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'7px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--text)' }}
                onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                📋 Duplicar orçamento
              </button>
              <div style={{ borderTop:'1px solid var(--border)',margin:'4px 0' }} />
              <button onClick={()=>{ setConfirmDelete(menuOpen); setMenuOpen(null); }}
                style={{ display:'flex',alignItems:'center',gap:8,width:'100%',textAlign:'left',padding:'7px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--red)' }}
                onMouseEnter={e=>(e.currentTarget.style.background='rgba(239,68,68,0.08)')}
                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                🗑️ Excluir orçamento
              </button>
            </div>
          </>
        );
      })()}

      {confirmDelete && (() => {
        const temVenda = vendas.some(v => v.orcamentoId === confirmDelete);
        const orc = orcamentos.find(o => o.id === confirmDelete);
        return (
          <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:300,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
            <div style={{ background:'var(--surface)',borderRadius:14,padding:28,maxWidth:400,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.25)',textAlign:'center' }}>
              <div style={{ fontSize:32,marginBottom:12 }}>🗑️</div>
              <div style={{ fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:18,marginBottom:8 }}>Excluir orçamento?</div>
              <div style={{ fontSize:13,color:'var(--text3)',marginBottom: temVenda ? 12 : 24 }}>
                {orc?.numero} · {orc?.clienteNome}
              </div>
              {temVenda && (
                <div style={{ padding:'10px 14px',background:'rgba(245,158,11,0.08)',border:'1px solid rgba(245,158,11,0.25)',borderRadius:9,marginBottom:20,fontSize:12.5,color:'var(--amber)',textAlign:'left' }}>
                  ⚠️ Este orçamento já gerou uma venda. A exclusão do orçamento <strong>não remove</strong> a venda e a OS vinculadas.
                </div>
              )}
              <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
                <button onClick={()=>setConfirmDelete(null)}
                  style={{ padding:'9px 20px',borderRadius:9,border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:13,color:'var(--text)' }}>Cancelar</button>
                <button onClick={()=>{ onDelete(confirmDelete!); setConfirmDelete(null); }}
                  style={{ padding:'9px 20px',borderRadius:9,border:'none',background:'var(--red)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600 }}>Excluir</button>
              </div>
            </div>
          </div>
        );
      })()}

      {showRelatorio && (
        <Relatorio tipo="orcamentos" orcamentos={orcamentos} onFechar={() => setShowRelatorio(false)} />
      )}
    </div>
  );
}