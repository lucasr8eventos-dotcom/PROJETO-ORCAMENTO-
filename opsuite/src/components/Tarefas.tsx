import React, { useState } from 'react';
import { Tarefa } from '../types';
import { Card, Btn, FormField, Input, Select, Modal, Tabs } from './ui';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Props {
  tarefas: Tarefa[];
  onSalvar: (t: Tarefa) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const prioridadeConfig = {
  alta:  { bg: 'var(--red-bg)',   color: 'var(--red)',   label: 'Alta' },
  media: { bg: 'var(--amber-bg)', color: 'var(--amber)', label: 'Média' },
  baixa: { bg: 'var(--green-bg)', color: 'var(--green)', label: 'Baixa' },
};

const tabs = [{ id:'pendentes',label:'Pendentes' },{ id:'concluidas',label:'Concluídas' },{ id:'todas',label:'Todas' }];

const empty = (): Tarefa => ({
  id:'', titulo:'', prioridade:'media', concluida:false, responsavel:'Admin', prazo: format(new Date(),'yyyy-MM-dd'),
});

export default function Tarefas({ tarefas, onSalvar, onDelete, onToggle }: Props) {
  const [tab, setTab] = useState('pendentes');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Tarefa>(empty());

  const filtered = tarefas.filter(t => {
    if (tab === 'pendentes') return !t.concluida;
    if (tab === 'concluidas') return t.concluida;
    return true;
  }).sort((a,b) => {
    const order = { alta:0, media:1, baixa:2 };
    if (a.concluida !== b.concluida) return a.concluida ? 1 : -1;
    return (order[a.prioridade]||1) - (order[b.prioridade]||1);
  });

  const salvar = () => {
    if (!form.titulo) return alert('Título obrigatório');
    onSalvar({ ...form, id: form.id || uuid() });
    setModal(false);
  };

  return (
    <div>
      <div style={{ display:'flex',gap:10,alignItems:'center',marginBottom:20,flexWrap:'wrap' }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <Btn variant="primary" icon={<span>+</span>} onClick={()=>{setForm(empty());setModal(true);}} style={{ marginLeft:'auto' }}>Nova tarefa</Btn>
      </div>

      {filtered.length === 0 ? (
        <Card><div style={{ padding:24,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhuma tarefa aqui</div></Card>
      ) : (
        <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
          {filtered.map(t => {
            const pc = prioridadeConfig[t.prioridade];
            return (
              <div key={t.id} style={{
                background:'var(--surface)', border:'1px solid var(--border)', borderRadius:12,
                padding:'14px 18px', display:'flex', alignItems:'center', gap:12,
                opacity: t.concluida ? 0.55 : 1, transition:'opacity .2s',
              }}>
                {/* Checkbox */}
                <div
                  onClick={()=>onToggle(t.id)}
                  style={{
                    width:22, height:22, borderRadius:'50%', flexShrink:0, cursor:'pointer',
                    border: t.concluida ? 'none' : '2px solid var(--border2)',
                    background: t.concluida ? 'var(--green)' : 'transparent',
                    display:'flex', alignItems:'center', justifyContent:'center',
                    transition:'all .15s',
                  }}
                >
                  {t.concluida && <span style={{ color:'#fff', fontSize:12 }}>✓</span>}
                </div>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:13.5, fontWeight:500, color:'var(--text)', textDecoration:t.concluida?'line-through':'none', marginBottom:3 }}>{t.titulo}</div>
                  <div style={{ fontSize:12, color:'var(--text2)', display:'flex', gap:12 }}>
                    <span>👤 {t.responsavel}</span>
                    <span>📅 {format(new Date(t.prazo+'T12:00:00'),'dd/MM/yyyy',{locale:ptBR})}</span>
                  </div>
                </div>

                <span style={{ fontSize:11.5, padding:'3px 10px', borderRadius:20, background:pc.bg, color:pc.color, fontWeight:500, whiteSpace:'nowrap' }}>{pc.label}</span>

                <button
                  onClick={()=>{setForm({...t});setModal(true);}}
                  style={{ width:30,height:30,borderRadius:8,border:'1px solid var(--border)',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text2)',fontSize:14,flexShrink:0 }}
                >✏️</button>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={modal} onClose={()=>setModal(false)} title={form.id ? 'Editar tarefa' : 'Nova tarefa'}>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <FormField label="Título *"><Input value={form.titulo} onChange={e=>setForm({...form,titulo:e.target.value})} placeholder="Descreva a tarefa..." /></FormField>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
            <FormField label="Prioridade">
              <Select value={form.prioridade} onChange={e=>setForm({...form,prioridade:e.target.value as 'alta'|'media'|'baixa'})}>
                <option value="alta">Alta</option>
                <option value="media">Média</option>
                <option value="baixa">Baixa</option>
              </Select>
            </FormField>
            <FormField label="Prazo"><Input type="date" value={form.prazo} onChange={e=>setForm({...form,prazo:e.target.value})} /></FormField>
            <FormField label="Responsável"><Input value={form.responsavel} onChange={e=>setForm({...form,responsavel:e.target.value})} placeholder="Nome ou equipe" /></FormField>
          </div>
          <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
            {form.id && <Btn variant="danger" onClick={()=>{onDelete(form.id);setModal(false);}}>Excluir</Btn>}
            <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
            <Btn variant="primary" onClick={salvar}>{form.id ? 'Salvar' : 'Criar tarefa'}</Btn>
          </div>
        </div>
      </Modal>
    </div>
  );
}
