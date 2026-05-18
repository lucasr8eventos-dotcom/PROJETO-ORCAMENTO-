import React, { useState, useMemo, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { Orcamento, Venda, OrdemServico, SituacaoVenda, OSStatus, OrcamentoStatus } from '../types';
import { fmtMoeda } from './ui';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import cfg from '../config';

type Tipo = 'orcamentos' | 'vendas' | 'ordens';

interface Props {
  tipo: Tipo;
  orcamentos?: Orcamento[];
  vendas?: Venda[];
  ordens?: OrdemServico[];
  onFechar: () => void;
}

const tituloTipo: Record<Tipo, string> = {
  orcamentos: 'Relatório de Orçamentos',
  vendas: 'Relatório de Vendas',
  ordens: 'Relatório de Ordens de Serviço',
};

const statusOrcLabel: Record<OrcamentoStatus, string> = {
  aprovado: 'Aprovado', enviado: 'Enviado', aguardando: 'Aguardando',
  recusado: 'Recusado', rascunho: 'Rascunho',
};

const statusVendaLabel: Record<SituacaoVenda, string> = {
  pendente: 'Pendente', parcial: 'Parcial', quitado: 'Quitado', cancelado: 'Cancelado',
};

const statusOSLabel: Record<OSStatus, string> = {
  pendente: 'Pendente', em_andamento: 'Em andamento', concluida: 'Concluída', cancelada: 'Cancelada',
};

function MetricCard({ label, value, sub, color }: { label: string; value: string; sub?: string; color?: string }) {
  return (
    <div style={{ background: '#f3f4f6', borderRadius: 8, padding: '12px 14px', flex: '1 1 130px', minWidth: 0 }}>
      <div style={{ fontSize: 9.5, fontWeight: 700, color: '#9ca3af', letterSpacing: '0.8px', marginBottom: 5, textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 19, color: color || '#111', lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return (
    <th style={{
      textAlign: right ? 'right' : 'left', padding: '8px 12px', fontSize: 10.5,
      fontWeight: 600, color: '#374151', letterSpacing: '0.4px',
      background: '#f3f4f6', borderBottom: '2px solid #e5e7eb', whiteSpace: 'nowrap',
    }}>
      {children}
    </th>
  );
}

function Td({ children, right, muted, bold }: { children: React.ReactNode; right?: boolean; muted?: boolean; bold?: boolean }) {
  return (
    <td style={{
      textAlign: right ? 'right' : 'left', padding: '9px 12px', fontSize: 12.5,
      color: muted ? '#9ca3af' : '#111', fontWeight: bold ? 600 : 400,
      borderBottom: '1px solid #f3f4f6', verticalAlign: 'middle',
    }}>
      {children}
    </td>
  );
}

export default function Relatorio({ tipo, orcamentos = [], vendas = [], ordens = [], onFechar }: Props) {
  const [mes, setMes] = useState(startOfMonth(new Date()));

  // Adiciona/remove classe no body para o CSS de print isolar o relatório
  useEffect(() => {
    document.body.classList.add('imprimindo');
    return () => document.body.classList.remove('imprimindo');
  }, []);

  const ini = startOfMonth(mes);
  const fim = endOfMonth(mes);

  const periodoLabel = format(mes, "MMMM 'de' yyyy", { locale: ptBR }).replace(/^\w/, c => c.toUpperCase());
  const emissaoLabel = format(new Date(), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });

  const orcsPeriodo = useMemo(() =>
    orcamentos.filter(o => { const d = new Date(o.criadoEm + 'T12:00:00'); return d >= ini && d <= fim; }),
    [orcamentos, ini, fim]
  );

  const vendasPeriodo = useMemo(() =>
    vendas.filter(v => { const d = new Date(v.criadoEm + 'T12:00:00'); return d >= ini && d <= fim; }),
    [vendas, ini, fim]
  );

  const ordensPeriodo = useMemo(() =>
    ordens.filter(o => { const d = new Date(o.criadoEm + 'T12:00:00'); return d >= ini && d <= fim; }),
    [ordens, ini, fim]
  );

  const renderOrcamentos = () => {
    const aprovados = orcsPeriodo.filter(o => o.status === 'aprovado');
    const recusados = orcsPeriodo.filter(o => o.status === 'recusado');
    const previstos = orcsPeriodo.filter(o => o.status === 'enviado' || o.status === 'aguardando' || o.status === 'rascunho');
    const taxa = orcsPeriodo.length ? Math.round(aprovados.length / orcsPeriodo.length * 100) : 0;
    return (
      <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          <MetricCard label="Total emitidos" value={String(orcsPeriodo.length)} sub={fmtMoeda(orcsPeriodo.reduce((s, o) => s + o.total, 0))} color="#1d4ed8" />
          <MetricCard label="Aprovados" value={String(aprovados.length)} sub={fmtMoeda(aprovados.reduce((s, o) => s + o.total, 0))} color="#059669" />
          <MetricCard label="Previstos" value={String(previstos.length)} sub={fmtMoeda(previstos.reduce((s, o) => s + o.total, 0))} color="#d97706" />
          <MetricCard label="Recusados" value={String(recusados.length)} sub={fmtMoeda(recusados.reduce((s, o) => s + o.total, 0))} color="#dc2626" />
          <MetricCard label="Taxa de conversão" value={`${taxa}%`} sub={`${aprovados.length} de ${orcsPeriodo.length}`} color="#6d28d9" />
        </div>
        {orcsPeriodo.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhum orçamento neste período.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><Th>NÚMERO</Th><Th>CLIENTE</Th><Th>CONTATO</Th><Th>STATUS</Th><Th right>VALOR</Th><Th>DATA</Th></tr>
            </thead>
            <tbody>
              {orcsPeriodo.map(o => (
                <tr key={o.id}>
                  <Td bold>{o.numero}</Td>
                  <Td>{o.clienteNome}</Td>
                  <Td muted>{o.contato || '—'}</Td>
                  <Td>{statusOrcLabel[o.status]}</Td>
                  <Td right bold>{fmtMoeda(o.total)}</Td>
                  <Td muted>{format(new Date(o.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</Td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={4} style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#374151' }}>TOTAL</td>
                <Td right bold>{fmtMoeda(orcsPeriodo.reduce((s, o) => s + o.total, 0))}</Td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </>
    );
  };

  const renderVendas = () => {
    const quitadas  = vendasPeriodo.filter(v => v.situacao === 'quitado');
    const pendentes = vendasPeriodo.filter(v => v.situacao === 'pendente' || v.situacao === 'parcial');
    const canceladas = vendasPeriodo.filter(v => v.situacao === 'cancelado');
    const totalRecebido = vendasPeriodo.reduce((s, v) => s + v.pagamentos.filter(p => p.pago).reduce((a, p) => a + p.valor, 0), 0);
    const totalGeral = vendasPeriodo.reduce((s, v) => s + v.total, 0);
    const pctRecebido = totalGeral > 0 ? Math.round(totalRecebido / totalGeral * 100) : 0;
    return (
      <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          <MetricCard label="Total vendas" value={String(vendasPeriodo.length)} sub={fmtMoeda(totalGeral)} color="#1d4ed8" />
          <MetricCard label="Recebido" value={fmtMoeda(totalRecebido)} sub={`${pctRecebido}% do total`} color="#059669" />
          <MetricCard label="A receber" value={fmtMoeda(totalGeral - totalRecebido)} sub={`${pendentes.length} venda(s)`} color="#d97706" />
          <MetricCard label="Quitadas" value={String(quitadas.length)} color="#059669" />
          <MetricCard label="Canceladas" value={String(canceladas.length)} color="#dc2626" />
        </div>
        {vendasPeriodo.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhuma venda neste período.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><Th>NÚMERO</Th><Th>CLIENTE</Th><Th>ORÇAMENTO</Th><Th>SITUAÇÃO</Th><Th right>VALOR</Th><Th right>RECEBIDO</Th><Th>DATA</Th></tr>
            </thead>
            <tbody>
              {vendasPeriodo.map(v => {
                const recebido = v.pagamentos.filter(p => p.pago).reduce((s, p) => s + p.valor, 0);
                return (
                  <tr key={v.id}>
                    <Td bold>{v.numero}</Td>
                    <Td>{v.clienteNome}</Td>
                    <Td muted>{v.orcamentoNumero}</Td>
                    <Td>{statusVendaLabel[v.situacao]}</Td>
                    <Td right bold>{fmtMoeda(v.total)}</Td>
                    <Td right>{fmtMoeda(recebido)}</Td>
                    <Td muted>{format(new Date(v.criadoEm + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR })}</Td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: '2px solid #e5e7eb', background: '#f9fafb' }}>
                <td colSpan={4} style={{ padding: '10px 12px', fontSize: 12.5, fontWeight: 700, color: '#374151' }}>TOTAL</td>
                <Td right bold>{fmtMoeda(totalGeral)}</Td>
                <Td right bold>{fmtMoeda(totalRecebido)}</Td>
                <td />
              </tr>
            </tfoot>
          </table>
        )}
      </>
    );
  };

  const renderOrdens = () => {
    const pendentes  = ordensPeriodo.filter(o => o.status === 'pendente');
    const andamento  = ordensPeriodo.filter(o => o.status === 'em_andamento');
    const concluidas = ordensPeriodo.filter(o => o.status === 'concluida');
    const canceladas = ordensPeriodo.filter(o => o.status === 'cancelada');
    return (
      <>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 22 }}>
          <MetricCard label="Total OS" value={String(ordensPeriodo.length)} color="#1d4ed8" />
          <MetricCard label="Pendentes" value={String(pendentes.length)} color="#d97706" />
          <MetricCard label="Em andamento" value={String(andamento.length)} color="#2563eb" />
          <MetricCard label="Concluídas" value={String(concluidas.length)} color="#059669" />
          <MetricCard label="Canceladas" value={String(canceladas.length)} color="#dc2626" />
        </div>
        {ordensPeriodo.length === 0 ? (
          <div style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: 14 }}>Nenhuma OS neste período.</div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr><Th>NÚMERO OS</Th><Th>CLIENTE</Th><Th>VENDA</Th><Th>STATUS</Th><Th>MONTAGEM</Th><Th>RETIRADA</Th><Th>EQUIPE</Th></tr>
            </thead>
            <tbody>
              {ordensPeriodo.map(o => (
                <tr key={o.id}>
                  <Td bold>{o.numero}</Td>
                  <Td>{o.clienteNome}</Td>
                  <Td muted>{o.vendaNumero}</Td>
                  <Td>{statusOSLabel[o.status]}</Td>
                  <Td muted>{o.dataMontagem ? format(new Date(o.dataMontagem + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</Td>
                  <Td muted>{o.dataRetirada ? format(new Date(o.dataRetirada + 'T12:00:00'), 'dd/MM/yyyy', { locale: ptBR }) : '—'}</Td>
                  <Td muted>{o.equipe || '—'}</Td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </>
    );
  };

  const content = (
    <div
      className="relatorio-impressao"
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}
      onClick={e => { if (e.target === e.currentTarget) onFechar(); }}
    >
      <div
        className="relatorio-caixa"
        style={{ background: '#fff', color: '#111', borderRadius: 16, width: '100%', maxWidth: 860, maxHeight: '95vh', overflowY: 'auto', boxShadow: '0 20px 60px rgba(0,0,0,0.3)', fontFamily: "'Inter',sans-serif" }}
      >
        {/* Barra de controle — não imprime */}
        <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid #e5e7eb', background: '#f9fafb', borderRadius: '16px 16px 0 0', gap: 12, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>📊 {tituloTipo[tipo]}</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#fff', border: '1px solid #e5e7eb', borderRadius: 8, padding: '4px 8px' }}>
              <button onClick={() => setMes(m => subMonths(m, 1))}
                style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', color: '#374151', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>←</button>
              <span style={{ fontSize: 13, fontWeight: 600, color: '#374151', minWidth: 160, textAlign: 'center' }}>{periodoLabel}</span>
              <button onClick={() => setMes(m => addMonths(m, 1))}
                style={{ width: 26, height: 26, border: 'none', background: 'none', cursor: 'pointer', color: '#374151', fontSize: 15, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>→</button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => window.print()}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", display: 'flex', alignItems: 'center', gap: 6 }}>
              🖨️ Imprimir / PDF
            </button>
            <button onClick={onFechar}
              style={{ padding: '7px 16px', borderRadius: 8, border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif" }}>
              Fechar
            </button>
          </div>
        </div>

        {/* Conteúdo imprimível */}
        <div style={{ padding: '28px 36px' }}>
          {/* Cabeçalho */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 22 }}>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 22, letterSpacing: '-0.4px', color: '#111' }}>{tituloTipo[tipo]}</div>
              <div style={{ fontSize: 13.5, color: '#6b7280', marginTop: 3 }}>Período: {periodoLabel}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#1d4ed8' }}>{cfg.nome}</div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Emitido em {emissaoLabel}</div>
            </div>
          </div>

          <div style={{ height: 2, background: '#e5e7eb', marginBottom: 22, borderRadius: 2 }} />

          {tipo === 'orcamentos' && renderOrcamentos()}
          {tipo === 'vendas'     && renderVendas()}
          {tipo === 'ordens'     && renderOrdens()}

          {/* Rodapé */}
          <div style={{ marginTop: 28, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', justifyContent: 'space-between', fontSize: 11, color: '#9ca3af' }}>
            <span>{cfg.nome} — {cfg.tagline}</span>
            <span>{tituloTipo[tipo]} · {periodoLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(content, document.body);
}
