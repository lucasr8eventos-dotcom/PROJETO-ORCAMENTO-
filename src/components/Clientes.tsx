import React, { useState } from 'react';
import { Cliente } from '../types';
import { Card, Avatar, Btn, FormField, Input, Modal } from './ui';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';

interface Props {
  clientes: Cliente[];
  onSalvar: (c: Cliente) => void;
  onDelete: (id: string) => void;
}

const empty = (): Cliente => ({
  id: '', nome: '', email: '', telefone: '', empresa: '', cnpj: '', cpf: '', endereco: '',
  criadoEm: format(new Date(), 'yyyy-MM-dd'),
});

export default function Clientes({ clientes, onSalvar, onDelete }: Props) {
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Cliente>(empty());

  const filtered = clientes.filter(c =>
    c.nome.toLowerCase().includes(busca.toLowerCase()) ||
    c.email.toLowerCase().includes(busca.toLowerCase()) ||
    c.empresa.toLowerCase().includes(busca.toLowerCase())
  );

  const abrirNovo = () => { setForm(empty()); setModal(true); };
  const abrirEditar = (c: Cliente) => { setForm({ ...c }); setModal(true); };

  const salvar = () => {
    if (!form.nome) return alert('Nome obrigatório');
    onSalvar({ ...form, id: form.id || uuid() });
    setModal(false);
  };

  return (
    <div>
      <div style={{ display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap' }}>
        <div style={{ flex:1,maxWidth:320,display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px' }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar cliente..." style={{ border:'none',outline:'none',fontSize:13,fontFamily:"'Inter',sans-serif",color:'var(--text)',background:'transparent',width:'100%' }} />
        </div>
        <Btn variant="primary" icon={<span>+</span>} onClick={abrirNovo}>Novo cliente</Btn>
      </div>

      <Card style={{ padding: 0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding:48,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhum cliente encontrado</div>
        ) : filtered.map((c, idx) => (
          <div key={c.id}
            onClick={()=>abrirEditar(c)}
            style={{ display:'flex',alignItems:'center',gap:14,padding:'14px 20px',cursor:'pointer',borderBottom: idx < filtered.length-1 ? '1px solid var(--border)' : 'none' }}
            onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
            onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
          >
            <Avatar name={c.nome} />
            <div style={{ flex:1,minWidth:0 }}>
              <div style={{ fontSize:14,fontWeight:600,color:'var(--text)',marginBottom:2 }}>{c.nome}</div>
              <div style={{ fontSize:12.5,color:'var(--text2)',display:'flex',gap:14,flexWrap:'wrap' }}>
                <span>📧 {c.email}</span>
                <span>📞 {c.telefone}</span>
                {c.cnpj && <span>🏢 {c.cnpj}</span>}
              </div>
            </div>
            <div style={{ textAlign:'right',flexShrink:0 }}>
              <div style={{ fontSize:11,color:'var(--text3)',marginBottom:2 }}>Desde {format(new Date(c.criadoEm+'T12:00:00'),'MM/yyyy')}</div>
            </div>
          </div>
        ))}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title={form.id ? 'Editar cliente' : 'Novo cliente'}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <FormField label="Nome *"><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Nome completo ou razão social" /></FormField>
          <FormField label="E-mail"><Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@empresa.com" /></FormField>
          <FormField label="Telefone"><Input value={form.telefone} onChange={e=>setForm({...form,telefone:e.target.value})} placeholder="(11) 99999-9999" /></FormField>
          <FormField label="CNPJ"><Input value={form.cnpj} onChange={e=>setForm({...form,cnpj:e.target.value})} placeholder="00.000.000/0001-00" /></FormField>
          <FormField label="CPF"><Input value={form.cpf||''} onChange={e=>setForm({...form,cpf:e.target.value})} placeholder="000.000.000-00" /></FormField>
        </div>
        <FormField label="Endereço" style={{ marginBottom:14 }}><Input value={form.endereco} onChange={e=>setForm({...form,endereco:e.target.value})} placeholder="Rua, número, cidade/estado" /></FormField>
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          {form.id && <Btn variant="danger" onClick={()=>{onDelete(form.id);setModal(false);}}>Excluir</Btn>}
          <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvar}>{form.id ? 'Salvar alterações' : 'Criar cliente'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
