import React, { useState, useMemo } from 'react';
import { Orcamento, OrcamentoStatus } from '../types';
import { Card, StatusBadge, Btn, Tabs, fmtMoeda } from './ui';
import { gerarPDF } from '../pdfGenerator';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const tabs = [
  { id: 'todos', label: 'Todos' },
  { id: 'aprovado', label: 'Aprovados' },
  { id: 'aguardando', label: 'Aguardando' },
  { id: 'enviado', label: 'Enviados' },
  { id: 'recusado', label: 'Recusados' },
  { id: 'rascunho', label: 'Rascunhos' },
];

const months = ['Todos os meses','Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

interface Props {
  orcamentos: Orcamento[];
  onNovo: () => void;
  onEditar: (o: Orcamento) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: OrcamentoStatus) => void;
}

export default function Orcamentos({ orcamentos, onNovo, onEditar, onDelete, onStatusChange }: Props) {
  const [tab, setTab] = useState('todos');
  const [busca, setBusca] = useState('');
  const [mes, setMes] = useState('0');
  const [menuOpen, setMenuOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return orcamentos.filter(o => {
      if (tab !== 'todos' && o.status !== tab) return false;
      if (busca && !o.clienteNome.toLowerCase().includes(busca.toLowerCase()) && !o.numero.toLowerCase().includes(busca.toLowerCase())) return false;
      if (mes !== '0') {
        const m = new Date(o.criadoEm + 'T12:00:00').getMonth() + 1;
        if (String(m) !== mes) return false;
      }
      return true;
    });
  }, [orcamentos, tab, busca, mes]);

  const tabsWithCount = tabs.map(t => ({
    ...t,
    label: t.id === 'todos' ? `Todos (${orcamentos.length})` : `${t.label} (${orcamentos.filter(o=>o.status===t.id).length})`,
  }));

  return (
    <div>
      <div style={{ display:'flex',gap:10,marginBottom:18,flexWrap:'wrap',alignItems:'center' }}>
        <Tabs tabs={tabsWithCount} active={tab} onChange={setTab} />
        <div style={{ marginLeft:'auto',display:'flex',gap:10 }}>
          <Btn variant="primary" icon={<span>+</span>} onClick={onNovo}>Novo orçamento</Btn>
        </div>
      </div>

      <div style={{ display:'flex',gap:10,marginBottom:16,flexWrap:'wrap' }}>
        <select value={mes} onChange={e=>setMes(e.target.value)} style={{ padding:'8px 12px',border:'1px solid var(--border)',borderRadius:10,fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',background:'var(--surface)',outline:'none',cursor:'pointer' }}>
          {months.map((m,i) => <option key={i} value={String(i)}>{m}</option>)}
        </select>
        <div style={{ flex:1,maxWidth:320,display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente ou número..." style={{ border:'none',outline:'none',fontSize:13,fontFamily:"'DM Sans',sans-serif",color:'var(--text)',background:'transparent',width:'100%' }} />
        </div>
      </div>

      <Card style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding:48,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhum orçamento encontrado</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr>{['NÚMERO','CLIENTE','SERVIÇO / ITENS','VALOR','CRIADO','VALIDADE','STATUS',''].map(h=>(
                  <th key={h} style={{ textAlign:'left',fontSize:10.5,fontWeight:500,color:'var(--text3)',letterSpacing:'0.7px',padding:'12px 14px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    style={{ cursor:'pointer', position:'relative' }}
                  >
                    <td style={{ padding:'11px 14px',fontWeight:600,color:'var(--blue)',fontSize:13,whiteSpace:'nowrap' }} onClick={()=>onEditar(o)}>#{o.numero}</td>
                    <td style={{ padding:'11px 14px',fontSize:13,maxWidth:160,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap' }} onClick={()=>onEditar(o)}>{o.clienteNome}</td>
                    <td style={{ padding:'11px 14px',fontSize:12.5,color:'var(--text2)' }} onClick={()=>onEditar(o)}>{o.itens.length} {o.itens.length === 1 ? 'item' : 'itens'}</td>
                    <td style={{ padding:'11px 14px',fontSize:13,fontWeight:600,whiteSpace:'nowrap' }} onClick={()=>onEditar(o)}>{fmtMoeda(o.total)}</td>
                    <td style={{ padding:'11px 14px',fontSize:12.5,color:'var(--text2)',whiteSpace:'nowrap' }} onClick={()=>onEditar(o)}>{format(new Date(o.criadoEm+'T12:00:00'),'dd/MM/yy',{locale:ptBR})}</td>
                    <td style={{ padding:'11px 14px',fontSize:12.5,color:'var(--text2)',whiteSpace:'nowrap' }} onClick={()=>onEditar(o)}>{format(new Date(o.validade+'T12:00:00'),'dd/MM/yy',{locale:ptBR})}</td>
                    <td style={{ padding:'11px 14px' }}><StatusBadge status={o.status} /></td>
                    <td style={{ padding:'11px 14px' }}>
                      <div style={{ display:'flex',gap:6,position:'relative' }}>
                        <button onClick={()=>gerarPDF(o)} title="Gerar PDF" style={{ width:30,height:30,borderRadius:8,border:'1px solid var(--border)',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)' }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>
                        </button>
                        <div style={{ position:'relative' }}>
                          <button onClick={()=>setMenuOpen(menuOpen===o.id?null:o.id)} style={{ width:30,height:30,borderRadius:8,border:'1px solid var(--border)',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)',fontSize:16 }}>⋯</button>
                          {menuOpen===o.id && (
                            <div style={{ position:'absolute',right:0,top:34,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:4,zIndex:50,minWidth:180,boxShadow:'0 4px 16px rgba(0,0,0,0.1)' }}>
                              {(['enviado','aprovado','aguardando','recusado'] as OrcamentoStatus[]).map(s=>(
                                <button key={s} onClick={()=>{onStatusChange(o.id,s);setMenuOpen(null);}} style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--text)' }}
                                  onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                                  onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                                >Marcar como {s}</button>
                              ))}
                              <div style={{ borderTop:'1px solid var(--border)',margin:'4px 0' }} />
                              <button onClick={()=>{onEditar(o);setMenuOpen(null);}} style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--text)' }}
                                onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                              >Editar orçamento</button>
                              <button onClick={()=>{onDelete(o.id);setMenuOpen(null);}} style={{ display:'block',width:'100%',textAlign:'left',padding:'8px 12px',border:'none',background:'none',cursor:'pointer',fontSize:13,borderRadius:7,color:'var(--red)' }}
                                onMouseEnter={e=>(e.currentTarget.style.background='var(--red-bg)')}
                                onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                              >Excluir</button>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {menuOpen && <div style={{ position:'fixed',inset:0,zIndex:40 }} onClick={()=>setMenuOpen(null)} />}
    </div>
  );
}
