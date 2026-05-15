import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import './index.css';
import { Section, Orcamento, Cliente, Produto, Evento, Usuario, Venda, OrdemServico } from './types';
import {
  loadData, saveData, calcularTotais,
  clientesIniciais, produtosIniciais, orcamentosIniciais, eventosIniciais, usuariosIniciais,
  vendasIniciais, ordensServicoIniciais,
  proximoNumeroVenda, proximoNumeroOS,
} from './data';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Orcamentos from './components/Orcamentos';
import NovoOrcamento from './components/NovoOrcamento';
import Clientes from './components/Clientes';
import Produtos from './components/Produtos';
import Agenda from './components/Agenda';
import Configuracoes from './components/Configuracoes';
import Usuarios from './components/Usuarios';
import Vendas from './components/Vendas';
import OrdemServicoComp from './components/OrdemServico';

const pageTitles: Record<Section, string> = {
  dashboard: 'Dashboard', orcamentos: 'Orçamentos', 'novo-orcamento': 'Orçamento',
  clientes: 'Clientes', produtos: 'Produtos & Serviços', agenda: 'Agenda',
  vendas: 'Vendas', 'ordens-servico': 'Ordens de Serviço',
  configuracoes: 'Configurações', usuarios: 'Usuários',
};

function NavItem({ label, icon, active, onClick, badge, dot }: any) {
  const [hov, setHov] = useState(false);
  return (
    <div onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 8, cursor: 'pointer',
        background: active ? 'rgba(255,255,255,0.12)' : hov ? 'rgba(255,255,255,0.07)' : 'transparent',
        color: active ? '#fff' : 'rgba(255,255,255,0.5)', fontWeight: active ? 500 : 400, fontSize: 13.5, marginBottom: 2, transition: 'all .15s',
      }}>
      <span style={{ fontSize: 15, width: 20, textAlign: 'center', flexShrink: 0 }}>{icon}</span>
      <span style={{ flex: 1 }}>{label}</span>
      {badge ? <span style={{ background: 'rgba(255,255,255,0.15)', color: 'rgba(255,255,255,0.7)', fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 500 }}>{badge}</span> : null}
      {dot && !badge ? <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#639922', flexShrink: 0 }} /> : null}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOrc, setEditOrc] = useState<Orcamento | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [busca, setBusca] = useState('');
  const [filtroOsVendaId, setFiltroOsVendaId] = useState<string | null>(null);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>(() =>
    loadData('opsuite_orc', orcamentosIniciais).map(o => ({ ...o, ...calcularTotais(o) }))
  );
  const [clientes, setClientes] = useState<Cliente[]>(() => loadData('opsuite_cli', clientesIniciais));
  const [produtos, setProdutos] = useState<Produto[]>(() => loadData('opsuite_prod', produtosIniciais));
  const [eventos, setEventos] = useState<Evento[]>(() => loadData('opsuite_ev', eventosIniciais));
  const [usuarios, setUsuarios] = useState<Usuario[]>(() => loadData('opsuite_usr', usuariosIniciais));
  const [vendas, setVendas] = useState<Venda[]>(() => loadData('opsuite_vnd', vendasIniciais));
  const [ordens, setOrdens] = useState<OrdemServico[]>(() => loadData('opsuite_os', ordensServicoIniciais));

  useEffect(() => { saveData('opsuite_orc', orcamentos); }, [orcamentos]);
  useEffect(() => { saveData('opsuite_cli', clientes); }, [clientes]);
  useEffect(() => { saveData('opsuite_prod', produtos); }, [produtos]);
  useEffect(() => { saveData('opsuite_ev', eventos); }, [eventos]);
  useEffect(() => { saveData('opsuite_usr', usuarios); }, [usuarios]);
  useEffect(() => { saveData('opsuite_vnd', vendas); }, [vendas]);
  useEffect(() => { saveData('opsuite_os', ordens); }, [ordens]);
  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, []);

  const addToast = (msg: string) => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const criarVendaEOS = (orc: Orcamento, vendasAtuais: Venda[], ordensAtuais: OrdemServico[]) => {
    const jaExiste = vendasAtuais.some(v => v.orcamentoId === orc.id);
    if (jaExiste) return { novasVendas: vendasAtuais, novasOrdens: ordensAtuais };

    const numVenda = proximoNumeroVenda(vendasAtuais);
    const novaVenda: Venda = {
      id: crypto.randomUUID(),
      numero: numVenda,
      orcamentoId: orc.id,
      orcamentoNumero: orc.numero,
      clienteId: orc.clienteId,
      clienteNome: orc.clienteNome,
      contato: orc.contato,
      itens: orc.itens.map(i => ({ ...i, id: crypto.randomUUID() })),
      desconto: orc.desconto,
      impostos: orc.impostos,
      subtotal: orc.subtotal,
      total: orc.total,
      observacoes: orc.observacoes,
      criadoEm: format(new Date(), 'yyyy-MM-dd'),
      situacao: 'pendente',
      pagamentos: [],
    };

    const numOS = proximoNumeroOS(ordensAtuais);
    const novaOS: OrdemServico = {
      id: crypto.randomUUID(),
      numero: numOS,
      vendaId: novaVenda.id,
      vendaNumero: numVenda,
      orcamentoNumero: orc.numero,
      clienteId: orc.clienteId,
      clienteNome: orc.clienteNome,
      contato: orc.contato,
      enderecoEvento: '',
      dataMontagem: '',
      dataRetirada: '',
      horarioInicio: '',
      horarioFim: '',
      equipe: '',
      motorista: '',
      itens: orc.itens.map(i => ({ ...i, id: crypto.randomUUID() })),
      observacoesOperacionais: orc.observacoes,
      status: 'pendente',
      criadoEm: format(new Date(), 'yyyy-MM-dd'),
    };

    return {
      novasVendas: [novaVenda, ...vendasAtuais],
      novasOrdens: [novaOS, ...ordensAtuais],
    };
  };

  const proximoNumero = (() => {
    const nums = orcamentos.map(o => parseInt(o.numero.replace('ORÇ-', ''), 10)).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `ORÇ-${String(next).padStart(4, '0')}`;
  })();

  const navTo = (s: Section) => { setSection(s); setSidebarOpen(false); setBusca(''); };

  const saveOrc = (orc: Orcamento) => {
    const orcComTotais = { ...orc, ...calcularTotais(orc) };
    setOrcamentos(p => {
      const i = p.findIndex(x => x.id === orcComTotais.id);
      if (i >= 0) { const n = [...p]; n[i] = orcComTotais; return n; }
      return [orcComTotais, ...p];
    });

    if (orcComTotais.status === 'aprovado') {
      const { novasVendas, novasOrdens } = criarVendaEOS(orcComTotais, vendas, ordens);
      if (novasVendas !== vendas) {
        setVendas(novasVendas);
        setOrdens(novasOrdens);
        addToast(`✅ Venda e OS geradas automaticamente para ${orcComTotais.clienteNome}!`);
      }
    }

    navTo('orcamentos');
  };

  const handleStatusChange = (id: string, status: Orcamento['status']) => {
    const orc = orcamentos.find(o => o.id === id);
    if (!orc) return;
    const orcAtualizado = { ...orc, status };
    setOrcamentos(p => p.map(o => o.id === id ? orcAtualizado : o));

    if (status === 'aprovado') {
      const { novasVendas, novasOrdens } = criarVendaEOS(orcAtualizado, vendas, ordens);
      if (novasVendas !== vendas) {
        setVendas(novasVendas);
        setOrdens(novasOrdens);
        addToast(`✅ ${orc.numero} aprovado! Venda e OS criadas automaticamente.`);
      }
    }
  };

  const duplicarOrc = (orc: Orcamento) => {
    const novo: Orcamento = {
      ...orc,
      id: crypto.randomUUID(),
      numero: proximoNumero,
      status: 'rascunho',
      criadoEm: format(new Date(), 'yyyy-MM-dd'),
      itens: orc.itens.map(i => ({ ...i, id: crypto.randomUUID() })),
    };
    setOrcamentos(p => [novo, ...p]);
  };

  const saveUsuario = (u: Usuario) => {
    setUsuarios(p => { const i = p.findIndex(x => x.id === u.id); if (i >= 0) { const n = [...p]; n[i] = u; return n; } return [u, ...p]; });
    if (user && u.id === user.id) setUser(u);
  };

  const verOSdaVenda = (vendaId: string) => {
    setFiltroOsVendaId(vendaId);
    navTo('ordens-servico');
  };

  if (!user) return <Login usuarios={usuarios} onLogin={u => { setUser(u); }} />;

  const q = busca.toLowerCase().trim();
  const orcamentosFiltrados = q ? orcamentos.filter(o =>
    o.numero.toLowerCase().includes(q) || o.clienteNome.toLowerCase().includes(q) ||
    o.contato.toLowerCase().includes(q) || o.status.toLowerCase().includes(q)
  ) : orcamentos;
  const clientesFiltrados = q ? clientes.filter(c =>
    c.nome.toLowerCase().includes(q) || c.empresa.toLowerCase().includes(q) ||
    c.email.toLowerCase().includes(q) || c.cnpj.includes(q)
  ) : clientes;
  const produtosFiltrados = q ? produtos.filter(p =>
    p.nome.toLowerCase().includes(q) || p.categoria.toLowerCase().includes(q) ||
    p.unidade.toLowerCase().includes(q)
  ) : produtos;

  const pendOrc = orcamentos.filter(o => o.status === 'aguardando').length;
  const pendVendas = vendas.filter(v => v.situacao === 'pendente' || v.situacao === 'parcial').length;
  const pendOS = ordens.filter(o => o.status === 'pendente' || o.status === 'em_andamento').length;

  const renderContent = () => {
    switch (section) {
      case 'dashboard':
        return <Dashboard orcamentos={orcamentos} onVerOrcamentos={() => navTo('orcamentos')} onEditar={o => { setEditOrc(o); navTo('novo-orcamento'); }} />;
      case 'orcamentos':
        return <Orcamentos orcamentos={orcamentosFiltrados} clientes={clientes} vendas={vendas} onNovo={() => { setEditOrc(null); navTo('novo-orcamento'); }} onEditar={o => { setEditOrc(o); navTo('novo-orcamento'); }} onDelete={id => setOrcamentos(p => p.filter(o => o.id !== id))} onStatusChange={handleStatusChange} onDuplicar={duplicarOrc} />;
      case 'novo-orcamento':
        return <NovoOrcamento orcamento={editOrc} clientes={clientes} produtos={produtos} proximoNumero={proximoNumero} onSalvar={saveOrc} onCancelar={() => navTo('orcamentos')} onSalvarCliente={c => setClientes(p => { const i = p.findIndex(x => x.id === c.id); if (i >= 0) { const n = [...p]; n[i] = c; return n; } return [c, ...p]; })} />;
      case 'clientes':
        return <Clientes clientes={clientesFiltrados} onSalvar={c => { setClientes(p => { const i = p.findIndex(x => x.id === c.id); if (i >= 0) { const n = [...p]; n[i] = c; return n; } return [c, ...p]; }); }} onDelete={id => setClientes(p => p.filter(c => c.id !== id))} />;
      case 'produtos':
        return <Produtos produtos={produtosFiltrados} onSalvar={p => { setProdutos(prev => { const i = prev.findIndex(x => x.id === p.id); if (i >= 0) { const n = [...prev]; n[i] = p; return n; } return [p, ...prev]; }); }} onDelete={id => setProdutos(p => p.filter(x => x.id !== id))} />;
      case 'agenda':
        return <Agenda eventos={eventos} onSalvar={e => { setEventos(p => { const i = p.findIndex(x => x.id === e.id); if (i >= 0) { const n = [...p]; n[i] = e; return n; } return [...p, e]; }); }} onDelete={id => setEventos(p => p.filter(e => e.id !== id))} onToggle={id => setEventos(p => p.map(e => e.id === id ? { ...e, concluido: !e.concluido } : e))} />;
      case 'vendas':
        return <Vendas
          vendas={vendas}
          userRole={user.role}
          onSalvar={v => setVendas(p => { const i = p.findIndex(x => x.id === v.id); if (i >= 0) { const n = [...p]; n[i] = v; return n; } return [v, ...p]; })}
          onDelete={id => {
            const venda = vendas.find(v => v.id === id);
            setVendas(p => p.filter(v => v.id !== id));
            if (venda) setOrdens(p => p.filter(o => o.vendaId !== id));
          }}
          onVerOS={verOSdaVenda}
        />;
      case 'ordens-servico':
        return <OrdemServicoComp
          ordens={ordens}
          userRole={user.role}
          onSalvar={os => setOrdens(p => { const i = p.findIndex(x => x.id === os.id); if (i >= 0) { const n = [...p]; n[i] = os; return n; } return [os, ...p]; })}
          onDelete={id => setOrdens(p => p.filter(o => o.id !== id))}
          filtroVendaId={filtroOsVendaId}
          onLimparFiltro={() => setFiltroOsVendaId(null)}
        />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'usuarios':
        return user.role === 'admin'
          ? <Usuarios usuarios={usuarios} usuarioAtualId={user.id} onSalvar={saveUsuario} onDelete={id => setUsuarios(p => p.filter(u => u.id !== id))} />
          : <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Acesso restrito a administradores.</div>;
      default:
        return <div style={{ padding: 40, textAlign: 'center', color: 'var(--text3)' }}>Em desenvolvimento</div>;
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {sidebarOpen && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />}
      <nav style={{ width: 240, background: 'var(--text)', minHeight: '100vh', display: 'flex', flexDirection: 'column', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100, transform: (!isMobile || sidebarOpen) ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform .25s' }}>
        <div style={{ padding: '22px 18px 18px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>OP</div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>OpSuite</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>Plataforma Operacional</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 10px 4px', flex: 1, overflowY: 'auto' }}>
          <NavItem label="Dashboard" icon="⊞" active={section === 'dashboard'} onClick={() => navTo('dashboard')} />
          <NavItem label="Orçamentos" icon="📄" active={section === 'orcamentos' || section === 'novo-orcamento'} onClick={() => navTo('orcamentos')} badge={pendOrc || undefined} />
          <NavItem label="Clientes" icon="👥" active={section === 'clientes'} onClick={() => navTo('clientes')} />
          <NavItem label="Produtos" icon="📦" active={section === 'produtos'} onClick={() => navTo('produtos')} />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>COMERCIAL</div>
          <NavItem label="Vendas" icon="💰" active={section === 'vendas'} onClick={() => navTo('vendas')} badge={pendVendas || undefined} />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>OPERACIONAL</div>
          <NavItem label="Ordens de Serviço" icon="🔧" active={section === 'ordens-servico'} onClick={() => navTo('ordens-servico')} badge={pendOS || undefined} />
          <NavItem label="Agenda" icon="📅" active={section === 'agenda'} onClick={() => navTo('agenda')} dot />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>SISTEMA</div>
          {user.role === 'admin' && <NavItem label="Usuários" icon="👤" active={section === 'usuarios'} onClick={() => navTo('usuarios')} />}
          <NavItem label="Configurações" icon="⚙" active={section === 'configuracoes'} onClick={() => navTo('configuracoes')} />
        </div>
        <div style={{ padding: '14px 10px', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 9 }}>
            <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'linear-gradient(135deg,#5DCAA5,#1D9E75)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 600, color: '#fff', flexShrink: 0 }}>
              {user.nome.split(' ').map((w: string) => w[0]).slice(0, 2).join('')}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12.5, fontWeight: 500, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.nome}</div>
              <div style={{ fontSize: 10.5, color: 'rgba(255,255,255,0.35)' }}>{user.role === 'admin' ? 'Administrador' : 'Operacional'}</div>
            </div>
            <button onClick={() => setUser(null)} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 4 }}>⏻</button>
          </div>
        </div>
      </nav>

      <main style={{ marginLeft: isMobile ? 0 : 240, flex: 1, padding: isMobile ? '20px 16px' : '26px 32px', maxWidth: '100%', overflowX: 'hidden', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 26, flexWrap: 'wrap', gap: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {isMobile && (<button onClick={() => setSidebarOpen(true)} style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: 'var(--text)' }}>☰</button>)}
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontSize: 22, fontWeight: 800, letterSpacing: '-0.5px' }}>{pageTitles[section]}</div>
              <div style={{ fontSize: 13, color: 'var(--text2)', marginTop: 2 }}>
                {section === 'dashboard' && new Date().toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                {section === 'orcamentos' && (q ? `${orcamentosFiltrados.length} resultado(s) para "${busca}"` : `${orcamentos.length} orçamentos no total`)}
                {section === 'clientes' && (q ? `${clientesFiltrados.length} resultado(s) para "${busca}"` : `${clientes.length} clientes cadastrados`)}
                {section === 'produtos' && (q ? `${produtosFiltrados.length} resultado(s) para "${busca}"` : `${produtos.length} itens no catálogo`)}
                {section === 'agenda' && `${eventos.filter(e => !e.concluido).length} eventos pendentes`}
                {section === 'usuarios' && `${usuarios.length} usuário(s) cadastrado(s)`}
                {section === 'novo-orcamento' && (editOrc ? `Editando #${editOrc.numero}` : `Novo #${proximoNumero}`)}
                {section === 'vendas' && `${vendas.length} venda(s) · ${pendVendas} a receber`}
                {section === 'ordens-servico' && `${ordens.length} OS · ${ordens.filter(o => o.status === 'pendente').length} pendentes`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {!isMobile && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder={`Buscar em ${pageTitles[section].toLowerCase()}...`} value={busca} onChange={e => setBusca(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', background: 'transparent', width: 180 }} />
                {busca && (<button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>)}
              </div>
            )}
            <div style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 16 }}>🔔</div>
            {section !== 'vendas' && section !== 'ordens-servico' && (
              <button onClick={() => { setEditOrc(null); navTo('novo-orcamento'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'var(--text)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>+ Novo orçamento</button>
            )}
          </div>
        </div>
        {renderContent()}
      </main>

      {/* Toasts */}
      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1a1a2e', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp .25s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
