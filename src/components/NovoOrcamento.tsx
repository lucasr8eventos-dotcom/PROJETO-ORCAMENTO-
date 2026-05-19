import React, { useState, useRef } from 'react';
import { Orcamento, LineItem, OrcamentoStatus, Cliente, Produto } from '../types';
import { Card, FormField, Input, Select, Textarea, Btn, StatusBadge, fmtMoeda } from './ui';
import { gerarPDF } from '../pdfGenerator';
import { loadConfig } from './Configuracoes';
import { format, addDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { v4 as uuid } from 'uuid';

function CurrencyInput({ value, onChange, style }: { value: number; onChange: (v: number) => void; style?: React.CSSProperties }) {
  const [focused, setFocused] = useState(false);
  const [raw, setRaw] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const display = focused
    ? raw
    : value === 0 ? '' : fmtMoeda(value);

  const handleFocus = () => {
    const cents = Math.round(value * 100);
    setRaw(cents === 0 ? '' : String(cents));
    setFocused(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRaw(digits);
    const cents = parseInt(digits || '0', 10);
    onChange(cents / 100);
  };

  const handleBlur = () => {
    setFocused(false);
    setRaw('');
  };

  return (
    <input
      ref={inputRef}
      value={display}
      onChange={handleChange}
      onFocus={handleFocus}
      onBlur={handleBlur}
      placeholder="R$ 0,00"
      inputMode="numeric"
      style={{
        padding: '7px 10px',
        border: '1px solid var(--border)',
        borderRadius: 8,
        fontSize: 13,
        fontFamily: "'Inter',sans-serif",
        outline: 'none',
        color: 'var(--text)',
        background: 'var(--surface)',
        width: '100%',
        ...style,
      }}
    />
  );
}

function newLine(): LineItem {
  return { id: uuid(), descricao: '', quantidade: 1, valorUnitario: 0, periodo: '' };
}

interface Props {
  orcamento?: Orcamento | null;
  clientes: Cliente[];
  produtos: Produto[];
  onSalvar: (o: Orcamento) => void;
  onCancelar: () => void;
  proximoNumero: string;
}

export default function NovoOrcamento({ orcamento, clientes, produtos, onSalvar, onCancelar, proximoNumero }: Props) {
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

  const addItemFromProduto = (prodId: string) => {
    const p = produtos.find(x => x.id === prodId);
    if (!p) return;
    setItens(prev => [...prev, { id: uuid(), descricao: p.nome, quantidade: 1, valorUnitario: p.preco, periodo: '' }]);
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
          {orcamento && <Btn onClick={()=>gerarPDF(orcamento, loadConfig())} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14,2 14,8 20,8"/></svg>}>PDF</Btn>}
          <Btn onClick={()=>handleSalvar('enviado')} icon={<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22,2 15,22 11,13 2,9"/></svg>}>Enviar</Btn>
          <Btn variant="primary" onClick={()=>handleSalvar()}>Salvar orçamento</Btn>
        </div>
      </div>

      <Card style={{ marginBottom: 14 }}>
        <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:16 }}>Dados do cliente</div>
        <div style={{ display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))',gap:14 }}>
          <FormField label="Cliente *">
            <Select value={clienteId} onChange={e => { setClienteId(e.target.value); const c=clientes.find(x=>x.id===e.target.value); if(c)setContato(c.nome); }}>
              <option value="">Selecionar cliente...</option>
              {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
            </Select>
          </FormField>
          <FormField label="Contato">
            <Input value={contato} onChange={e=>setContato(e.target.value)} placeholder="Nome do contato" />
          </FormField>
          <FormField label="Validade do orçamento">
            <Input type="date" value={validade} onChange={e=>setValidade(e.target.value)} />
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
            <select onChange={e=>{if(e.target.value){addItemFromProduto(e.target.value);e.target.value=''}}} style={{ padding:'7px 10px',border:'1px solid var(--border)',borderRadius:9,fontSize:12.5,fontFamily:"'Inter',sans-serif",color:'var(--text2)',background:'var(--surface)',cursor:'pointer',outline:'none' }}>
              <option value="">+ Adicionar do catálogo</option>
              {produtos.filter(p=>p.ativo).map(p=><option key={p.id} value={p.id}>{p.nome} — {fmtMoeda(p.preco)}/{p.unidade}</option>)}
            </select>
            <Btn size="sm" onClick={()=>setItens(p=>[...p,newLine()])} icon={<span>+</span>}>Item manual</Btn>
          </div>
        </div>

        <div style={{ display:'grid',gridTemplateColumns:'2.5fr 1fr 1fr 0.8fr 0.8fr 36px',gap:8,padding:'8px 12px',background:'var(--surface2)',borderRadius:'9px 9px 0 0',fontSize:11,color:'var(--text3)',fontWeight:500,letterSpacing:'0.5px' }}>
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
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:14 }}>Observações</div>
          <Textarea rows={5} value={observacoes} onChange={e=>setObservacoes(e.target.value)} placeholder="Condições de pagamento, prazo de entrega, notas..." />
        </Card>

        <Card style={{ background:'var(--surface2)' }}>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:14,fontWeight:600,marginBottom:14 }}>Resumo financeiro</div>
          {[
            ['Subtotal', fmtMoeda(subtotal)],
          ].map(([l,v])=>(
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
    </div>
  );
}
