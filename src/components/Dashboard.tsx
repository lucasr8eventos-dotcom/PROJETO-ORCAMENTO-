import React, { useMemo } from 'react';
import { Orcamento } from '../types';
import { Card, CardHeader, StatusBadge, fmtMoeda } from './ui';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, getMonth, getYear, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MONTH_NAMES = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

interface Props {
  orcamentos: Orcamento[];
  onVerOrcamentos: () => void;
  onEditar: (o: Orcamento) => void;
}

const isPrevistos = (s: string) => s === 'aguardando' || s === 'enviado' || s === 'rascunho';

export default function Dashboard({ orcamentos, onVerOrcamentos, onEditar }: Props) {
  const doMes = useMemo(() => {
    const ini = startOfMonth(new Date());
    const fim = endOfMonth(new Date());
    return orcamentos.filter(o => {
      const d = new Date(o.criadoEm + 'T12:00:00');
      return d >= ini && d <= fim;
    });
  }, [orcamentos]);

  const stats = useMemo(() => {
    const aprovados = orcamentos.filter(o => o.status === 'aprovado');
    const ticketMedio = aprovados.length ? aprovados.reduce((s, o) => s + o.total, 0) / aprovados.length : 0;
    return { ticketMedio };
  }, [orcamentos]);

  const monthData = useMemo(() => {
    const currentYear = getYear(new Date());
    const map: Record<number, { emitido: number; aprovado: number }> = {};
    orcamentos.forEach(o => {
      const d = new Date(o.criadoEm + 'T12:00:00');
      if (getYear(d) !== currentYear) return;
      const m = getMonth(d);
      if (!map[m]) map[m] = { emitido: 0, aprovado: 0 };
      map[m].emitido += o.total;
      if (o.status === 'aprovado') map[m].aprovado += o.total;
    });
    const months = Object.keys(map).map(Number).sort((a, b) => a - b);
    return months.map(m => ({ mes: MONTH_NAMES[m], emitido: map[m].emitido, aprovado: map[m].aprovado }));
  }, [orcamentos]);

  const recentes = [...orcamentos]
    .sort((a, b) => new Date(b.criadoEm).getTime() - new Date(a.criadoEm).getTime())
    .slice(0, 6);

  return (
    <div>
      {/* Cards de resumo do mês */}
      <div style={{ display:'flex',gap:12,marginBottom:22,flexWrap:'wrap' }}>
        {[
          { label: 'Recusados',      count: doMes.filter(o=>o.status==='recusado').length,       valor: doMes.filter(o=>o.status==='recusado').reduce((s,o)=>s+o.total,0),       cor: 'var(--red)' },
          { label: 'Previstos',      count: doMes.filter(o=>isPrevistos(o.status)).length,        valor: doMes.filter(o=>isPrevistos(o.status)).reduce((s,o)=>s+o.total,0),        cor: 'var(--amber)' },
          { label: 'Aprovados',      count: doMes.filter(o=>o.status==='aprovado').length,        valor: doMes.filter(o=>o.status==='aprovado').reduce((s,o)=>s+o.total,0),        cor: 'var(--green)' },
          { label: 'Total do mês',   count: doMes.length,                                         valor: doMes.reduce((s,o)=>s+o.total,0),                                         cor: 'var(--blue)' },
        ].map(card => (
          <div key={card.label} onClick={onVerOrcamentos} style={{ flex:1,minWidth:160,padding:'16px 20px',borderRadius:12,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',transition:'box-shadow .15s' }}
            onMouseEnter={e=>(e.currentTarget.style.boxShadow='0 0 0 2px var(--border2)')}
            onMouseLeave={e=>(e.currentTarget.style.boxShadow='none')}>
            <div style={{ fontSize:12,color:'var(--text3)',marginBottom:8 }}>{card.label} ({card.count})</div>
            <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:700,color:card.cor }}>{fmtMoeda(card.valor)}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 16 }}>
        <Card>
          <CardHeader title="Receita mensal 2026" />
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={monthData} barGap={4} barSize={16}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="mes" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: 'var(--text3)' }} axisLine={false} tickLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: any) => fmtMoeda(Number(v))} contentStyle={{ borderRadius: 8, border: '1px solid var(--border)', fontSize: 12 }} />
              <Bar dataKey="emitido" fill="var(--surface3)" radius={[3,3,0,0]} name="Emitido" />
              <Bar dataKey="aprovado" fill="var(--blue-mid)" radius={[3,3,0,0]} name="Aprovado" />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display: 'flex', gap: 14, marginTop: 8 }}>
            {[['var(--surface3)','Emitido'],['var(--blue-mid)','Aprovado']].map(([c,l])=>(
              <div key={l} style={{ display:'flex',alignItems:'center',gap:5,fontSize:11.5,color:'var(--text2)' }}>
                <div style={{ width:8,height:8,borderRadius:'50%',background:c }} />{l}
              </div>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Taxa de conversão" />
          {[
            { label: 'Aprovados', pct: orcamentos.length ? Math.round(orcamentos.filter(o=>o.status==='aprovado').length/orcamentos.length*100) : 0, color: 'var(--green)' },
            { label: 'Previstos', pct: orcamentos.length ? Math.round(orcamentos.filter(o=>isPrevistos(o.status)).length/orcamentos.length*100) : 0, color: 'var(--amber)' },
            { label: 'Recusados', pct: orcamentos.length ? Math.round(orcamentos.filter(o=>o.status==='recusado').length/orcamentos.length*100) : 0, color: 'var(--red)' },
          ].map(r => (
            <div key={r.label} style={{ display:'flex',alignItems:'center',marginBottom:14 }}>
              <span style={{ fontSize:12.5,color:'var(--text2)',width:80,flexShrink:0 }}>{r.label}</span>
              <div style={{ flex:1,height:6,background:'var(--surface2)',borderRadius:3,margin:'0 12px' }}>
                <div style={{ width:`${r.pct}%`,height:'100%',borderRadius:3,background:r.color,transition:'width .4s' }} />
              </div>
              <span style={{ fontSize:12.5,fontWeight:500,minWidth:32,textAlign:'right' }}>{r.pct}%</span>
            </div>
          ))}
          <div style={{ borderTop:'1px solid var(--border)',marginTop:4,paddingTop:14 }}>
            <div style={{ fontSize:11,color:'var(--text3)',marginBottom:5 }}>Ticket médio aprovados</div>
            <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:24,fontWeight:700 }}>{fmtMoeda(stats.ticketMedio || 0)}</div>
          </div>
        </Card>
      </div>

      <Card style={{ padding: 0 }}>
        <div style={{ padding: '18px 20px 14px', display:'flex',alignItems:'center',justifyContent:'space-between' }}>
          <span style={{ fontFamily:"'Outfit',sans-serif",fontSize:14.5,fontWeight:600 }}>Últimos orçamentos</span>
          <button onClick={onVerOrcamentos} style={{ background:'none',border:'none',cursor:'pointer',color:'var(--blue)',fontSize:13,fontWeight:500 }}>Ver todos →</button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width:'100%',borderCollapse:'collapse' }}>
            <thead>
              <tr>{['NÚMERO','CLIENTE','VALOR','DATA','VALIDADE','STATUS'].map(h=>(
                <th key={h} style={{ textAlign:'left',fontSize:11,fontWeight:500,color:'var(--text3)',letterSpacing:'0.7px',padding:'0 14px 10px',borderBottom:'1px solid var(--border)' }}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {recentes.map(o => (
                <tr key={o.id} onClick={()=>onEditar(o)} style={{ cursor:'pointer' }} onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                  <td style={{ padding:'11px 14px',fontWeight:500,color:'var(--blue)',fontSize:13 }}>#{o.numero}</td>
                  <td style={{ padding:'11px 14px',fontSize:13 }}>{o.clienteNome}</td>
                  <td style={{ padding:'11px 14px',fontSize:13,fontWeight:500 }}>{fmtMoeda(o.total)}</td>
                  <td style={{ padding:'11px 14px',fontSize:12.5,color:'var(--text2)' }}>{format(new Date(o.criadoEm+'T12:00:00'),'dd/MM',{locale:ptBR})}</td>
                  <td style={{ padding:'11px 14px',fontSize:12.5,color:'var(--text2)' }}>{format(new Date(o.validade+'T12:00:00'),'dd/MM',{locale:ptBR})}</td>
                  <td style={{ padding:'11px 14px' }}><StatusBadge status={o.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
