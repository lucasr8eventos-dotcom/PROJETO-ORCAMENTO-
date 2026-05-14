import React, { useState, useRef, useEffect } from 'react';
import { Orcamento, LineItem, OrcamentoStatus, Cliente, Produto } from '../types';
import { Card, FormField, Input, Select, Textarea, Btn, StatusBadge, fmtMoeda, Modal, CurrencyInput, CpfCnpjInput, TelefoneInput, DataInput } from './ui';
import { gerarPDF } from '../pdfGenerator';
import { loadConfig } from './Configuracoes';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';


function ClienteSearch({ clientes, value, onChange }: { clientes: Cliente[]; value: string; onChange: (id: string) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = clientes.find(c => c.id === value);
  const q = query.toLowerCase();
  const filtered = q
    ? clientes.filter(c => c.nome.toLowerCase().includes(q) || c.cnpj.includes(q) || c.email.toLowerCase().includes(q))
    : clientes;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <input
        value={open ? query : selected?.nome || ''}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => { setQuery(''); setOpen(true); }}
        placeholder="Buscar por nome, CNPJ..."
        style={{ padding:'9px 12px', border:'1px solid var(--border)', borderRadius:10, fontSize:13.5, fontFamily:"'Inter',sans-serif", color:'var(--text)', background:'var(--surface)', outline:'none', width:'100%' }}
      />
      {open && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, zIndex:200, maxHeight:220, overflowY:'auto', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
          {filtered.length === 0 ? (
            <div style={{ padding:12, fontSize:13, color:'var(--text3)', textAlign:'center' }}>Nenhum cliente encontrado</div>
          ) : filtered.slice(0, 8).map((c, idx) => (
            <div key={c.id}
              onMouseDown={() => { onChange(c.id); setOpen(false); setQuery(''); }}
              style={{ padding:'10px 12px', fontSize:13, cursor:'pointer', borderBottom: idx < Math.min(filtered.length, 8) - 1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight:500, color:'var(--text)' }}>{c.nome}</div>
              {c.cnpj && <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:1 }}>{c.cnpj}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function newLine(): LineItem {
  return { id: uuid(), descricao: '', quantidade: 1, valorUnitario: 0, periodo: '' };
}

function ProdutoSearch({ produtos, onSelect }: { produtos: Produto[]; onSelect: (p: Produto) => void }) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const ativos = produtos.filter(p => p.ativo);
  const filtered = query
    ? ativos.filter(p => p.nome.toLowerCase().includes(query.toLowerCase()) || p.categoria.toLowerCase().includes(query.toLowerCase()))
    : ativos;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} style={{ position:'relative' }}>
      <input
        value={query}
        onChange={e => setQuery(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder="Buscar no catálogo..."
        style={{ padding:'7px 10px', border:'1px solid var(--border)', borderRadius:9, fontSize:12.5, fontFamily:"'Inter',sans-serif", color:'var(--text2)', background:'var(--surface)', cursor:'text', outline:'none', width:200 }}
      />
      {open && filtered.length > 0 && (
        <div style={{ position:'absolute', top:'calc(100% + 4px)', right:0, background:'var(--surface)', border:'1px solid var(--border)', borderRadius:10, zIndex:200, minWidth:260, maxHeight:220, overflowY:'auto', boxShadow:'0 4px 16px rgba(0,0,0,0.12)' }}>
          {filtered.slice(0, 10).map((p, idx) => (
            <div key={p.id}
              onMouseDown={() => { onSelect(p); setQuery(''); setOpen(false); }}
              style={{ padding:'9px 12px', fontSize:13, cursor:'pointer', borderBottom: idx < Math.min(filtered.length,10)-1 ? '1px solid var(--border)' : 'none' }}
              onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
              onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
            >
              <div style={{ fontWeight:500, color:'var(--text)' }}>{p.nome}</div>
              <div style={{ fontSize:11.5, color:'var(--text3)', marginTop:1 }}>{fmtMoeda(p.preco)} / {p.unidade}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

const emptyCliente = (): Cliente => ({
  id: '', nome: '', email: '', telefone: '', empresa: '', cnpj: '', endereco: '',
  criadoEm: format(new Date(), 'yyyy-MM-dd'),
});

interface Props {
  orcamento?: Orcamento | null;
  clientes: Cliente[];
  produtos: Produto[];
  onSalvar: (o: Orcamento) => void;
  onCancelar: () => void;
  onSalvarCliente: (c: Cliente) => void;
  proximoNumero: string;
}

export default function NovoOrcamento({ orcamento, clientes, produtos, onSalvar, onCancelar, onSalvarCliente, proximoNumero }: Props) {
  const isEdit = !!orcamento;
  const hoje = new Date();

  const [clienteId, setClienteId] = useState(orcamento?.clienteId || '');
  const [contato, setContato] = useState(orcamento?.contato || '');
  const [status, setStatus] = useState<OrcamentoStatus>(orcamento?.status || 'rascunho');
  const [itens, setItens] = useState<LineItem[]>(orcamento?.itens || [newLine()]);
  const [desconto, setDesconto] = useState(orcamento?.desconto ?? 0);
  const [impostos, setImpostos] = useState(orcamento?.impostos ?? 0);
  const [observacoes, setObservacoes] = useState(orcamento?.observacoes || '');
  const [validade, setValidade] = useState(orcamento?.validade || format(addDays(hoje, 14), 'yyyy-MM-dd'));

  const [novoClienteModal, setNovoClienteModal] = useState(false);
  const [novoClienteForm, setNovoClienteForm] = useState<Cliente>(emptyCliente());

  const subtotal = itens.reduce((s, i) => s + i.quantidade * i.valorUnitario, 0);
  const descontoVal = subtotal * desconto / 100;
  const impostosVal = (subtotal - descontoVal) * impostos / 100;
  const total = subtotal - descontoVal + impostosVal;

  const clienteSelecionado = clientes.find(c => c.id === clienteId);

  const updateItem = (id: string, field: keyof LineItem, value: any) => {
    setItens(prev => prev.map(i => i.id === id ? { ...i, [field]: value } : i));
  };

  const removeItem = (id: string) => {
    if (itens.length > 1) setItens(prev => prev.filter(i => i.id !== id));
  };


  const handleSalvar = (novoStatus?: OrcamentoStatus) => {
    if (!clienteId) { alert('Selecione um cliente.'); return; }
    const orc: Orcamento = {
      id: orcamento?.id || uuid(),
      numero: orcamento?.numero || proximoNumero,
      clienteId,
      clienteNome: clienteSelecionado?.nome || '',
      contato,
      status: novoStatus || status,
      itens,
      desconto,
      impostos,
      observacoes,
      criadoEm: orcamento?.criadoEm || format(hoje, 'yyyy-MM-dd'),
      validade,
      subtotal,
      total,
    };
    onSalvar(orc);
  };

  const salvarNovoCliente = () => {
    if (!novoClienteForm.nome) { alert('Nome obrigatório'); return; }
    const novo = { ...novoClienteForm, id: uuid() };
    onSalvarCliente(novo);
    setClienteId(novo.id);
    setContato(novo.nome);
    setNovoClienteModal(false);
    setNovoClienteForm(emptyCliente());
  };

  return (
    <div>
      <div style={{ display:'flex',alignItems:'center',gap:12,marginBottom:22,flexWrap:'wrap' }}>
        <button onClick={onCancelar} style={{ width:36,height:36,borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text)',fontSize:18 }}>←</button>
        <div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700 }}>{isEdit ? 'Editar Orçamento' : 'Novo Orçamento'}</div>
          <div style={{ fontSize:12,color:'var(--text2)' }}>#{isEdit ? orcamento!.numero : proximoNumero} · {format(hoje, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</div>
        </div>
        <StatusBadge status={status} />
        <div style={{ marginLeft:'auto',display:'flex',gap:8,flexWrap:'wrap' }}>
          {orcamento && <Btn onClick={()=>gerarPDF(orcamento, loadConfig(), clientes.find(c=>c.id===orcamento.clienteId))} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>}>PDF</Btn>}
          <Btn onClick={()=>handleSalvar('enviado')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>}>Enviar</Btn>
          <Btn variant="primary" onClick={()=>handleSalvar()}>Salvar orçamento</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:16 }}>Dados do cliente</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14 }}>
          <FormField label="Cliente *">
            <div style={{ display:'flex',gap:8 }}>
              <div style={{ flex:1 }}>
                <ClienteSearch
                  clientes={clientes}
                  value={clienteId}
                  onChange={id => { setClienteId(id); const c = clientes.find(x => x.id === id); if (c) setContato(c.nome); }}
                />
              </div>
              <button
                onClick={() => { setNovoClienteForm(emptyCliente()); setNovoClienteModal(true); }}
                title="Cadastrar novo cliente"
                style={{ flexShrink:0,height:40,padding:'0 12px',borderRadius:10,border:'1px solid var(--border)',background:'var(--surface)',cursor:'pointer',fontSize:13,color:'var(--text2)',whiteSpace:'nowrap',display:'flex',alignItems:'center',gap:5 }}
              >
                + Novo
              </button>
            </div>
          </FormField>
          <FormField label="Contato">
            <Input value={contato} onChange={e=>setContato(e.target.value)} placeholder="Nome do contato" />
          </FormField>
          <FormField label="Validade do orçamento">
            <DataInput value={validade} onChange={setValidade} />
          </FormField>
          <FormField label="Status">
            <Select value={status} onChange={e=>setStatus(e.target.value as OrcamentoStatus)}>
              <option value="rascunho">Rascunho</option>
              <option value="enviado">Enviado</option>
              <option value="aguardando">Aguardando resposta</option>
              <option value="aprovado">Aprovado</option>
              <option value="recusado">Recusado</option>
            </Select>
          </FormField>
        </div>
        {clienteSelecionado && (
          <div style={{ marginTop:12,padding:'10px 14px',background:'var(--surface2)',borderRadius:9,fontSize:12.5,color:'var(--text2)',display:'flex',gap:20,flexWrap:'wrap' }}>
            <span>📧 {clienteSelecionado.email}</span>
            <span>📞 {clienteSelecionado.telefone}</span>
            <span>🏢 {clienteSelecionado.cnpj}</span>
          </div>
        )}
      </Card>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16 }}>
          <span style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600 }}>Itens do orçamento</span>
          <div style={{ display:'flex',gap:8 }}>
            <ProdutoSearch
              produtos={produtos}
              onSelect={p => setItens(prev => [...prev, { id: uuid(), descricao: p.nome, quantidade: 1, valorUnitario: p.preco, periodo: '' }])}
            />
            <Btn size="sm" onClick={()=>setItens(p=>[...p,newLine()])} icon={<span>+</span>}>Item manual</Btn>
          </div>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 1fr 0.8fr 36px',gap:8,padding:'8px 12px',background:'var(--surface2)',borderRadius:'9px 9px 0 0',fontSize:11,color:'var(--text3)',fontWeight:500,letterSpacing:'0.5px' }}>
          <span>DESCRIÇÃO</span><span>QUANTIDADE</span><span>VL. UNITÁRIO</span><span>DETALHE DO ITEM</span><span style={{textAlign:'right'}}>TOTAL</span><span></span>
        </div>
        <div style={{ border:'1px solid var(--border)',borderTop:'none',borderRadius:'0 0 9px 9px',overflow:'hidden' }}>
          {itens.map((item, idx) => (
            <div key={item.id} style={{ display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 0.8fr 0.8fr 36px',gap:8,padding:'8px 12px',borderBottom: idx < itens.length-1 ? '1px solid var(--border)' : 'none',alignItems:'center' }}>
              <input value={item.descricao} onChange={e=>updateItem(item.id,'descricao',e.target.value)} placeholder="Descrição do item..." style={{ padding:'7px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',width:'100%' }} />
              <input type="number" value={item.quantidade} min={1} onChange={e=>updateItem(item.id,'quantidade',parseFloat(e.target.value)||0)} style={{ padding:'7px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',textAlign:'center',width:'100%' }} />
              <CurrencyInput value={item.valorUnitario} onChange={v=>updateItem(item.id,'valorUnitario',v)} />
              <input value={item.periodo||''} onChange={e=>updateItem(item.id,'periodo',e.target.value)} placeholder="ex: Chuveiro, 3 dias..." style={{ padding:'7px 10px',border:'1px solid var(--border)',borderRadius:8,fontSize:13,fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',width:'100%' }} />
              <span style={{ fontSize:13,fontWeight:600,textAlign:'right',paddingRight:4,whiteSpace:'nowrap' }}>{fmtMoeda(item.quantidade*item.valorUnitario)}</span>
              <button onClick={()=>removeItem(item.id)} style={{ width:30,height:30,borderRadius:7,border:'none',background:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text3)',fontSize:16,transition:'all .15s' }}
                onMouseEnter={e=>{e.currentTarget.style.background='var(--red-bg)';e.currentTarget.style.color='var(--red)'}}
                onMouseLeave={e=>{e.currentTarget.style.background='none';e.currentTarget.style.color='var(--text3)'}}
              >×</button>
            </div>
          ))}
        </div>
      </Card>

      <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
        <Card>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:14 }}>Detalhes do orçamento</div>
          <Textarea
            rows={7}
            value={observacoes}
            onChange={e=>setObservacoes(e.target.value)}
            placeholder={"Condições de pagamento, prazo de entrega, notas...\n\nPressione Enter para nova linha."}
            style={{ resize:'vertical' }}
          />
        </Card>

        <Card style={{ background:'var(--surface2)' }}>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:14 }}>Resumo financeiro</div>
          {[['Subtotal', fmtMoeda(subtotal)]].map(([l,v])=>(
            <div key={l} style={{ display:'flex',justifyContent:'space-between',marginBottom:10,fontSize:13.5,color:'var(--text2)' }}>
              <span>{l}</span><span style={{color:'var(--text)',fontWeight:500}}>{v}</span>
            </div>
          ))}
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
            <span style={{fontSize:13.5,color:'var(--text2)'}}>Desconto</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <input inputMode="decimal" value={desconto === 0 ? '' : String(desconto)} onChange={e=>{const v=e.target.value.replace(',','.');setDesconto(parseFloat(v)||0)}} placeholder="0" style={{width:52,padding:'5px 8px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,textAlign:'center',fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)'}} />
              <span style={{fontSize:12,color:'var(--text3)'}}>%</span>
              <span style={{fontSize:13,color:'var(--text)',fontWeight:500,minWidth:80,textAlign:'right'}}>- {fmtMoeda(descontoVal)}</span>
            </div>
          </div>
          <div style={{ display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:10 }}>
            <span style={{fontSize:13.5,color:'var(--text2)'}}>Impostos</span>
            <div style={{display:'flex',alignItems:'center',gap:6}}>
              <input inputMode="decimal" value={impostos === 0 ? '' : String(impostos)} onChange={e=>{const v=e.target.value.replace(',','.');setImpostos(parseFloat(v)||0)}} placeholder="0" style={{width:52,padding:'5px 8px',border:'1px solid var(--border)',borderRadius:7,fontSize:13,textAlign:'center',fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)'}} />
              <span style={{fontSize:12,color:'var(--text3)'}}>%</span>
              <span style={{fontSize:13,color:'var(--text)',fontWeight:500,minWidth:80,textAlign:'right'}}>+ {fmtMoeda(impostosVal)}</span>
            </div>
          </div>
          <div style={{ borderTop:'1px solid var(--border2)',paddingTop:12,marginTop:4,display:'flex',justifyContent:'space-between',alignItems:'center' }}>
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700}}>TOTAL</span>
            <span style={{fontFamily:"'Outfit',sans-serif",fontSize:22,fontWeight:700,color:'var(--text)'}}>{fmtMoeda(total)}</span>
          </div>
          <Btn variant="primary" onClick={()=>handleSalvar()} style={{width:'100%',justifyContent:'center',marginTop:14}}>Salvar orçamento</Btn>
        </Card>
      </div>

      <Modal open={novoClienteModal} onClose={()=>setNovoClienteModal(false)} title="Cadastrar novo cliente">
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <FormField label="Nome *"><Input value={novoClienteForm.nome} onChange={e=>setNovoClienteForm({...novoClienteForm,nome:e.target.value})} placeholder="Nome completo" /></FormField>
          <FormField label="Empresa / Razão Social"><Input value={novoClienteForm.empresa} onChange={e=>setNovoClienteForm({...novoClienteForm,empresa:e.target.value})} placeholder="Nome da empresa" /></FormField>
          <FormField label="E-mail"><Input type="email" value={novoClienteForm.email} onChange={e=>setNovoClienteForm({...novoClienteForm,email:e.target.value})} placeholder="email@empresa.com" /></FormField>
          <FormField label="Telefone"><TelefoneInput value={novoClienteForm.telefone} onChange={v=>setNovoClienteForm({...novoClienteForm,telefone:v})} /></FormField>
          <FormField label="CPF / CNPJ"><CpfCnpjInput value={novoClienteForm.cnpj} onChange={v=>setNovoClienteForm({...novoClienteForm,cnpj:v})} /></FormField>
        </div>
        <FormField label="Endereço" style={{ marginBottom:20 }}><Input value={novoClienteForm.endereco} onChange={e=>setNovoClienteForm({...novoClienteForm,endereco:e.target.value})} placeholder="Rua, número, cidade/estado" /></FormField>
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          <Btn onClick={()=>setNovoClienteModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvarNovoCliente}>Criar e selecionar</Btn>
        </div>
      </Modal>
    </div>
  );
}
