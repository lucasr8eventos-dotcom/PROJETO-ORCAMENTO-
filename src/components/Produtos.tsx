import React, { useState } from 'react';
import { Produto } from '../types';
import { Card, Btn, FormField, Input, Select, Modal, Tabs, fmtMoeda, CurrencyInput } from './ui';
import { v4 as uuid } from 'uuid';

interface Props {
  produtos: Produto[];
  onSalvar: (p: Produto) => void;
  onDelete: (id: string) => void;
}

const tabs = [
  { id: 'todos', label: 'Todos' },
  { id: 'produto', label: 'Produtos' },
  { id: 'servico', label: 'Serviços' },
];

const empty = (): Produto => ({
  id: '', nome: '', categoria: '', preco: 0, unidade: 'unidade', estoque: null, tipo: 'produto', ativo: true,
});

export default function Produtos({ produtos, onSalvar, onDelete }: Props) {
  const [tab, setTab] = useState('todos');
  const [busca, setBusca] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Produto>(empty());

  const filtered = produtos.filter(p => {
    if (tab !== 'todos' && p.tipo !== tab) return false;
    if (busca && !p.nome.toLowerCase().includes(busca.toLowerCase()) && !p.categoria.toLowerCase().includes(busca.toLowerCase())) return false;
    return true;
  });

  const abrirNovo = () => { setForm(empty()); setModal(true); };
  const abrirEditar = (p: Produto) => { setForm({ ...p }); setModal(true); };

  const salvar = () => {
    const nome = form.nome.trim();
    if (!nome) return alert('Nome obrigatório');
    onSalvar({ ...form, nome, id: form.id || uuid() });
    setModal(false);
  };

  return (
    <div>
      <div style={{ display:'flex',gap:10,marginBottom:18,alignItems:'center',flexWrap:'wrap' }}>
        <Tabs tabs={tabs} active={tab} onChange={setTab} />
        <div style={{ marginLeft:'auto',display:'flex',gap:10 }}>
          <div style={{ display:'flex',alignItems:'center',gap:8,background:'var(--surface)',border:'1px solid var(--border)',borderRadius:10,padding:'8px 12px' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input value={busca} onChange={e=>setBusca(e.target.value)} placeholder="Buscar..." style={{ border:'none',outline:'none',fontSize:13,fontFamily:"'Inter',sans-serif",color:'var(--text)',background:'transparent',width:150 }} />
          </div>
          <Btn variant="primary" icon={<span>+</span>} onClick={abrirNovo}>Novo item</Btn>
        </div>
      </div>

      <Card style={{ padding:0 }}>
        {filtered.length === 0 ? (
          <div style={{ padding:48,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhum item encontrado</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr>{[['NOME','nome'],['CATEGORIA','categoria'],['TIPO','tipo'],['PREÇO','preco'],['UNIDADE','unidade'],['ESTOQUE','estoque'],['STATUS','status'],['','acoes']].map(([label,key])=>(
                  <th key={key} style={{ textAlign:'left',fontSize:10.5,fontWeight:500,color:'var(--text3)',letterSpacing:'0.7px',padding:'12px 16px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{label}</th>
                ))}</tr>
              </thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id} style={{ cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    onClick={()=>abrirEditar(p)}
                  >
                    <td style={{ padding:'11px 16px',fontSize:13,fontWeight:600 }}>{p.nome}</td>
                    <td style={{ padding:'11px 16px',fontSize:13,color:'var(--text2)' }}>{p.categoria}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ fontSize:11.5,padding:'3px 8px',borderRadius:20,background: p.tipo==='servico' ? 'var(--teal-bg)' : 'var(--blue-bg)',color: p.tipo==='servico' ? 'var(--teal)' : 'var(--blue)',fontWeight:500 }}>
                        {p.tipo === 'servico' ? 'Serviço' : 'Produto'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 16px',fontSize:13,fontWeight:600 }}>
                      {p.preco === 0
                        ? <span title="Preço não definido" style={{ color:'var(--amber)',display:'inline-flex',alignItems:'center',gap:4 }}>⚠️ {fmtMoeda(p.preco)}</span>
                        : fmtMoeda(p.preco)}
                    </td>
                    <td style={{ padding:'11px 16px',fontSize:12.5,color:'var(--text2)' }}>/{p.unidade}</td>
                    <td style={{ padding:'11px 16px',fontSize:13 }}>{p.estoque !== null ? `${p.estoque} unid.` : '—'}</td>
                    <td style={{ padding:'11px 16px' }}>
                      <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:500,
                        background: p.ativo ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: p.ativo ? 'var(--green)' : 'var(--red)' }}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor'}} />
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding:'11px 16px' }}>
                      <button style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16 }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title={form.id ? 'Editar item' : 'Novo produto / serviço'}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <FormField label="Nome *"><Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Ex: Projetor HD 4K" /></FormField>
          <FormField label="Categoria"><Input value={form.categoria} onChange={e=>setForm({...form,categoria:e.target.value})} placeholder="Ex: Vídeo, Áudio, Serviço..." /></FormField>
          <FormField label="Tipo">
            <Select value={form.tipo} onChange={e=>setForm({...form,tipo:e.target.value as 'produto'|'servico',estoque:e.target.value==='servico'?null:form.estoque||0})}>
              <option value="produto">Produto</option>
              <option value="servico">Serviço</option>
            </Select>
          </FormField>
          <FormField label="Unidade">
            <Select value={form.unidade} onChange={e=>setForm({...form,unidade:e.target.value})}>
              <option value="unidade">unidade</option>
              <option value="diária">diária</option>
              <option value="metro">metro</option>
              <option value="hora">hora</option>
              <option value="m²">m²</option>
              <option value="m³">m³</option>
              <option value="pacote">pacote</option>
              <option value="lote">lote</option>
              <option value="serviço">serviço</option>
              <option value="mensal">mensal</option>
              <option value="outros">outros</option>
            </Select>
          </FormField>
          <FormField label="Preço"><CurrencyInput value={form.preco} onChange={v=>setForm({...form,preco:v})} /></FormField>
          {form.tipo === 'produto' && (
            <FormField label="Estoque"><Input type="number" value={form.estoque??0} min={0} onChange={e=>setForm({...form,estoque:parseInt(e.target.value)||0})} /></FormField>
          )}
          <FormField label="Status">
            <Select value={form.ativo?'1':'0'} onChange={e=>setForm({...form,ativo:e.target.value==='1'})}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </Select>
          </FormField>
        </div>
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          {form.id && <Btn variant="danger" onClick={()=>{onDelete(form.id);setModal(false);}}>Excluir</Btn>}
          <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvar}>{form.id ? 'Salvar' : 'Criar item'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
