import React, { useState } from 'react';
import { Evento } from '../types';
import { Btn, FormField, Input, Select, Textarea, Modal } from './ui';
import {
  format, addDays, startOfWeek, isSameDay,
  startOfMonth, endOfMonth, eachDayOfInterval,
  addMonths, subMonths, isSameMonth, endOfWeek,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';

interface Props {
  eventos: Evento[];
  onSalvar: (e: Evento) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const tipoConfig = {
  evento:  { label: 'Evento',  bg: 'var(--blue-bg)',   border: 'var(--blue-mid)', text: 'var(--blue)' },
  reuniao: { label: 'Reunião', bg: 'var(--green-bg)',  border: 'var(--green-mid)', text: 'var(--green)' },
  entrega: { label: 'Entrega', bg: 'var(--amber-bg)',  border: '#EF9F27', text: 'var(--amber)' },
  outro:   { label: 'Outro',   bg: 'var(--surface3)',  border: 'var(--border2)', text: 'var(--text2)' },
};

const empty = (): Evento => ({
  id: '', titulo: '', data: format(new Date(), 'yyyy-MM-dd'),
  horaInicio: '09:00', horaFim: '10:00', tipo: 'evento', descricao: '', concluido: false,
});

type Vista = 'semana' | 'mes';
type Filtro = 'todos' | 'pendentes' | 'concluidos';

const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Agenda({ eventos, onSalvar, onDelete, onToggle }: Props) {
  const [vista, setVista] = useState<Vista>('mes');
  const [semana, setSemana] = useState(startOfWeek(new Date(), { weekStartsOn: 0 }));
  const [mes, setMes] = useState(startOfMonth(new Date()));
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Evento>(empty());
  const [filtro, setFiltro] = useState<Filtro>('todos');

  const dias = Array.from({ length: 7 }, (_, i) => addDays(semana, i));

  const eventosFiltrados = filtro === 'pendentes'
    ? eventos.filter(e => !e.concluido)
    : filtro === 'concluidos'
    ? eventos.filter(e => e.concluido)
    : eventos;

  const abrirNovo = (data?: string) => {
    setForm({ ...empty(), data: data || format(new Date(), 'yyyy-MM-dd') });
    setModal(true);
  };

  const salvar = () => {
    if (!form.titulo.trim()) return alert('Título obrigatório');
    onSalvar({ ...form, id: form.id || uuid() });
    setModal(false);
  };

  const irHoje = () => {
    setSemana(startOfWeek(new Date(), { weekStartsOn: 0 }));
    setMes(startOfMonth(new Date()));
  };

  const totalPendentes = eventos.filter(e => !e.concluido).length;
  const totalConcluidos = eventos.filter(e => e.concluido).length;

  const tabStyle = (t: Filtro): React.CSSProperties => ({
    padding: '7px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: "'Inter',sans-serif",
    fontWeight: filtro === t ? 600 : 400,
    background: filtro === t ? 'var(--text)' : 'var(--surface)',
    color: filtro === t ? '#fff' : 'var(--text2)',
    transition: 'all .15s',
  });

  const vistaTabStyle = (v: Vista): React.CSSProperties => ({
    padding: '6px 14px', borderRadius: 7, border: 'none', cursor: 'pointer',
    fontSize: 13, fontFamily: "'Inter',sans-serif",
    fontWeight: vista === v ? 600 : 400,
    background: vista === v ? 'var(--text)' : 'transparent',
    color: vista === v ? '#fff' : 'var(--text2)',
    transition: 'all .15s',
  });

  // ─── Vista Mensal ───────────────────────────────────────────────────────────

  const renderMes = () => {
    const inicioGrid = startOfWeek(startOfMonth(mes), { weekStartsOn: 0 });
    const fimGrid    = endOfWeek(endOfMonth(mes), { weekStartsOn: 0 });
    const todosDias  = eachDayOfInterval({ start: inicioGrid, end: fimGrid });
    const semanas: Date[][] = [];
    for (let i = 0; i < todosDias.length; i += 7) semanas.push(todosDias.slice(i, i + 7));

    return (
      <div>
        {/* Cabeçalho dias da semana */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3, marginBottom: 3 }}>
          {DIAS_SEMANA.map(d => (
            <div key={d} style={{ textAlign: 'center', fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', padding: '6px 0' }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grade de semanas */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {semanas.map((semanaRow, si) => (
            <div key={si} style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 3 }}>
              {semanaRow.map(dia => {
                const diaStr      = format(dia, 'yyyy-MM-dd');
                const isHoje      = isSameDay(dia, new Date());
                const isMesAtual  = isSameMonth(dia, mes);
                const evDia       = eventosFiltrados.filter(e => e.data === diaStr);
                const MAX_VISIBLE = 3;
                const overflow    = evDia.length - MAX_VISIBLE;

                return (
                  <div
                    key={diaStr}
                    onClick={() => abrirNovo(diaStr)}
                    style={{
                      minHeight: 96,
                      background: isHoje ? 'var(--blue-bg)' : 'var(--surface)',
                      border: `1px solid ${isHoje ? 'var(--blue-mid)' : 'var(--border)'}`,
                      borderRadius: 9,
                      padding: '7px 8px 6px',
                      cursor: 'pointer',
                      opacity: isMesAtual ? 1 : 0.4,
                      transition: 'background .12s',
                    }}
                    onMouseEnter={e => { if (!isHoje) e.currentTarget.style.background = 'var(--surface2)'; }}
                    onMouseLeave={e => { if (!isHoje) e.currentTarget.style.background = 'var(--surface)'; }}
                  >
                    {/* Número do dia */}
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                      width: 24, height: 24, borderRadius: '50%', marginBottom: 4,
                      background: isHoje ? 'var(--blue)' : 'transparent',
                      fontSize: 12.5, fontWeight: isHoje ? 700 : 500,
                      color: isHoje ? '#fff' : 'var(--text)',
                    }}>
                      {format(dia, 'd')}
                    </div>

                    {/* Eventos do dia */}
                    {evDia.slice(0, MAX_VISIBLE).map(ev => {
                      const cfg = tipoConfig[ev.tipo] || tipoConfig.outro;
                      return (
                        <div
                          key={ev.id}
                          onClick={e => { e.stopPropagation(); setForm({ ...ev }); setModal(true); }}
                          title={`${ev.horaInicio}–${ev.horaFim} · ${ev.titulo}`}
                          style={{
                            fontSize: 11, padding: '2px 6px', borderRadius: 4, marginBottom: 2,
                            background: ev.concluido ? 'var(--surface2)' : cfg.bg,
                            color: ev.concluido ? 'var(--text3)' : cfg.text,
                            borderLeft: `2px solid ${ev.concluido ? 'var(--border2)' : cfg.border}`,
                            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                            textDecoration: ev.concluido ? 'line-through' : 'none',
                            cursor: 'pointer', lineHeight: '1.5',
                          }}
                        >
                          {ev.horaInicio} {ev.titulo}
                        </div>
                      );
                    })}
                    {overflow > 0 && (
                      <div style={{ fontSize: 10.5, color: 'var(--text3)', marginTop: 1 }}>
                        +{overflow} mais
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // ─── Vista Semanal ──────────────────────────────────────────────────────────

  const renderSemana = () => (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {dias.map(dia => {
        const diaStr = format(dia, 'yyyy-MM-dd');
        const evDia  = eventosFiltrados.filter(e => e.data === diaStr);
        const isHoje = isSameDay(dia, new Date());

        if (filtro !== 'todos' && evDia.length === 0) return null;

        return (
          <div key={diaStr} style={{ display: 'flex', gap: 16 }}>
            <div style={{ width: 52, flexShrink: 0, textAlign: 'center', paddingTop: 4 }}>
              <div style={{
                fontSize: 22, fontFamily: "'Outfit',sans-serif", fontWeight: 700, lineHeight: 1,
                color: isHoje ? 'var(--blue)' : 'var(--text)',
              }}>
                {format(dia, 'd')}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', marginTop: 2 }}>
                {format(dia, 'EEE', { locale: ptBR })}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              {evDia.length === 0 ? (
                <div
                  onClick={() => abrirNovo(diaStr)}
                  style={{ height: 40, border: '1.5px dashed var(--border)', borderRadius: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', fontSize: 13, transition: 'all .15s' }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--border2)'; e.currentTarget.style.background = 'var(--surface2)'; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'transparent'; }}
                >
                  + Adicionar evento
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {evDia.map(ev => {
                    const cfg = tipoConfig[ev.tipo] || tipoConfig.outro;
                    return (
                      <div key={ev.id} style={{ padding: '10px 14px', borderRadius: 9, background: ev.concluido ? 'var(--surface2)' : cfg.bg, borderLeft: `3px solid ${ev.concluido ? 'var(--border2)' : cfg.border}`, display: 'flex', alignItems: 'center', gap: 10, opacity: ev.concluido ? 0.7 : 1, transition: 'opacity .15s' }}>
                        <button
                          onClick={e => { e.stopPropagation(); onToggle(ev.id); }}
                          title={ev.concluido ? 'Marcar como pendente' : 'Marcar como concluído'}
                          style={{ width: 22, height: 22, borderRadius: '50%', border: `2px solid ${ev.concluido ? 'var(--green)' : 'var(--border2)'}`, background: ev.concluido ? 'var(--green)' : 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 11, color: '#fff', fontWeight: 700 }}>
                          {ev.concluido ? '✓' : ''}
                        </button>
                        <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => { setForm({ ...ev }); setModal(true); }}>
                          <div style={{ fontSize: 13.5, fontWeight: 500, color: 'var(--text)', marginBottom: 2, textDecoration: ev.concluido ? 'line-through' : 'none' }}>{ev.titulo}</div>
                          <div style={{ fontSize: 12, color: 'var(--text2)', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span>🕐 {ev.horaInicio} – {ev.horaFim}</span>
                            <span style={{ padding: '1px 7px', borderRadius: 20, background: cfg.bg, color: cfg.text, fontSize: 11, fontWeight: 500 }}>{cfg.label}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {filtro === 'todos' && (
                    <div onClick={() => abrirNovo(diaStr)} style={{ height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text3)', fontSize: 12 }}>
                      + evento
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  // ─── Navegação ──────────────────────────────────────────────────────────────

  const labelNavegacao = vista === 'mes'
    ? format(mes, "MMMM 'de' yyyy", { locale: ptBR })
    : `${format(semana, 'd')} – ${format(addDays(semana, 6), "d 'de' MMMM", { locale: ptBR })}`;

  const navAnterior = () => vista === 'mes'
    ? setMes(m => subMonths(m, 1))
    : setSemana(d => addDays(d, -7));

  const navProximo = () => vista === 'mes'
    ? setMes(m => addMonths(m, 1))
    : setSemana(d => addDays(d, 7));

  const navStyle: React.CSSProperties = {
    width: 34, height: 34, borderRadius: 9, border: '1px solid var(--border)',
    background: 'var(--surface)', cursor: 'pointer', display: 'flex',
    alignItems: 'center', justifyContent: 'center', color: 'var(--text)', fontSize: 16,
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div>
      {/* Barra superior */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 10 }}>
        {/* Navegação */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={navAnterior} style={navStyle}>←</button>
          <span style={{ fontFamily: "'Outfit',sans-serif", fontSize: 15, fontWeight: 600, minWidth: 210, textAlign: 'center', textTransform: 'capitalize' }}>
            {labelNavegacao}
          </span>
          <button onClick={navProximo} style={navStyle}>→</button>
          <button
            onClick={irHoje}
            style={{ padding: '7px 12px', borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text2)' }}
          >
            Hoje
          </button>
        </div>

        {/* Toggle de vista + botão novo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', gap: 2, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9, padding: 4 }}>
            <button style={vistaTabStyle('semana')} onClick={() => setVista('semana')}>Semana</button>
            <button style={vistaTabStyle('mes')} onClick={() => setVista('mes')}>Mês</button>
          </div>
          <Btn variant="primary" icon={<span>+</span>} onClick={() => abrirNovo()}>Novo evento</Btn>
        </div>
      </div>

      {/* Filtros (apenas na vista semanal) */}
      {vista === 'semana' && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 20, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: 6, width: 'fit-content' }}>
          <button style={tabStyle('todos')} onClick={() => setFiltro('todos')}>Todos ({eventos.length})</button>
          <button style={tabStyle('pendentes')} onClick={() => setFiltro('pendentes')}>Não concluídos ({totalPendentes})</button>
          <button style={tabStyle('concluidos')} onClick={() => setFiltro('concluidos')}>Concluídos ({totalConcluidos})</button>
        </div>
      )}

      {/* Contadores rápidos na vista mensal */}
      {vista === 'mes' && (
        <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
          {(['todos', 'pendentes', 'concluidos'] as Filtro[]).map(t => {
            const count = t === 'pendentes' ? totalPendentes : t === 'concluidos' ? totalConcluidos : eventos.length;
            const label = t === 'pendentes' ? 'Não concluídos' : t === 'concluidos' ? 'Concluídos' : 'Total';
            const isAtivo = filtro === t;
            return (
              <button
                key={t}
                onClick={() => setFiltro(t)}
                style={{ padding: '6px 14px', borderRadius: 20, border: `1px solid ${isAtivo ? 'var(--text)' : 'var(--border)'}`, background: isAtivo ? 'var(--text)' : 'var(--surface)', color: isAtivo ? '#fff' : 'var(--text2)', fontSize: 12.5, cursor: 'pointer', fontWeight: isAtivo ? 600 : 400, transition: 'all .15s' }}
              >
                {label} · <strong>{count}</strong>
              </button>
            );
          })}
        </div>
      )}

      {/* Grade */}
      {vista === 'mes' ? renderMes() : renderSemana()}

      {/* Modal */}
      <Modal open={modal} onClose={() => setModal(false)} title={form.id ? 'Editar evento' : 'Novo evento'}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 14 }}>
          <FormField label="Título *" style={{ gridColumn: 'span 2' }}>
            <Input value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })} placeholder="Ex: Montagem evento..." />
          </FormField>
          <FormField label="Data">
            <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} />
          </FormField>
          <FormField label="Tipo">
            <Select value={form.tipo} onChange={e => setForm({ ...form, tipo: e.target.value as any })}>
              {Object.entries(tipoConfig).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </Select>
          </FormField>
          <FormField label="Início">
            <Input type="time" value={form.horaInicio} onChange={e => setForm({ ...form, horaInicio: e.target.value })} />
          </FormField>
          <FormField label="Fim">
            <Input type="time" value={form.horaFim} onChange={e => setForm({ ...form, horaFim: e.target.value })} />
          </FormField>
          <FormField label="Descrição" style={{ gridColumn: 'span 2' }}>
            <Textarea rows={3} value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} placeholder="Detalhes adicionais..." />
          </FormField>
        </div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          {form.id && <Btn variant="danger" onClick={() => { onDelete(form.id); setModal(false); }}>Excluir</Btn>}
          <Btn onClick={() => setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvar}>{form.id ? 'Salvar' : 'Criar evento'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
