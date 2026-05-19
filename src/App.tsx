import React, { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import './index.css';
import cfg from './config';
import { Section, Orcamento, Cliente, Produto, Evento, Usuario, Venda, OrdemServico } from './types';
import { calcularTotais } from './data';
import {
  authApi, clientesApi, produtosApi, orcamentosApi,
  vendasApi, ordensApi, eventosApi, usuariosApi,
} from './api';
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

function normalizeOrc(o: any): Orcamento {
  return { ...o, itens: o.itens || [] };
}
function normalizeVenda(v: any): Venda {
  return { ...v, pagamentos: v.pagamentos || [], itens: v.orcamento?.itens || [] };
}
function normalizeOS(o: any): OrdemServico {
  return { ...o, itens: o.itens || [] };
}

const BUILD_TAG = 'v2-monoorigem-2026-05-18';
if (typeof window !== 'undefined') console.log('OpSuite build:', BUILD_TAG);

export default function App() {
  const [user, setUser] = useState<Usuario | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [section, setSection] = useState<Section>('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [editOrc, setEditOrc] = useState<Orcamento | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [busca, setBusca] = useState('');
  const [filtroOsVendaId, setFiltroOsVendaId] = useState<string | null>(null);
  const [vendaAbrirId, setVendaAbrirId] = useState<string | null>(null);
  const [pendingAprovacaoOrc, setPendingAprovacaoOrc] = useState<Orcamento | null>(null);
  const [toasts, setToasts] = useState<{ id: string; msg: string }[]>([]);

  const [orcamentos, setOrcamentos] = useState<Orcamento[]>([]);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [eventos, setEventos] = useState<Evento[]>([]);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [ordens, setOrdens] = useState<OrdemServico[]>([]);

  const addToast = (msg: string) => {
    const id = crypto.randomUUID();
    setToasts(t => [...t, { id, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 4000);
  };

  const carregarDados = useCallback(async () => {
    const [orcs, clis, prods, evs, vnds, oss] = await Promise.all([
      orcamentosApi.listar(),
      clientesApi.listar(),
      produtosApi.listar(),
      eventosApi.listar(),
      vendasApi.listar(),
      ordensApi.listar(),
    ]);
    setOrcamentos(orcs.map(normalizeOrc));
    setClientes(clis);
    setProdutos(prods);
    setEventos(evs);
    setVendas(vnds.map(normalizeVenda));
    setOrdens(oss.map(normalizeOS));

    usuariosApi.listar().then(usrs =>
      setUsuarios(usrs.map((u: any) => ({ ...u, senha: '' })))
    ).catch(() => {});
  }, []);

  // Restaura sessão a partir do token salvo; só mostra login se token ausente ou expirado
  useEffect(() => {
    const stored = localStorage.getItem(cfg.tokenKey);
    if (!stored) { setAppReady(true); return; }
    authApi.me()
      .then(async u => {
        setUser({ id: u.id, nome: u.nome, email: u.email, role: u.role as any, ativo: u.ativo, senha: '', criadoEm: '' });
        try { await carregarDados(); } catch {}
        setAppReady(true);
      })
      .catch(() => {
        localStorage.removeItem(cfg.tokenKey);
        setAppReady(true);
      });
  }, [carregarDados]);

  useEffect(() => {
    const h = () => setIsMobile(window.innerWidth <= 900);
    window.addEventListener('resize', h); return () => window.removeEventListener('resize', h);
  }, []);

  const navTo = (s: Section) => { setSection(s); setSidebarOpen(false); setBusca(''); };

  const proximoNumero = (() => {
    const nums = orcamentos.map(o => parseInt(o.numero.replace('ORÇ-', ''), 10)).filter(n => !isNaN(n));
    const next = nums.length ? Math.max(...nums) + 1 : 1;
    return `ORÇ-${String(next).padStart(4, '0')}`;
  })();

  const criarVendaEOS = async (orc: Orcamento) => {
    const jaExiste = vendas.some(v => v.orcamentoId === orc.id);
    if (jaExiste) return;
    try {
      const novaVenda = await vendasApi.criar({
        orcamentoId: orc.id, orcamentoNumero: orc.numero,
        clienteId: orc.clienteId, clienteNome: orc.clienteNome, contato: orc.contato,
        desconto: orc.desconto, impostos: orc.impostos, subtotal: orc.subtotal, total: orc.total,
        observacoes: orc.observacoes, criadoEm: format(new Date(), 'yyyy-MM-dd'),
      });
      const novaOS = await ordensApi.criar({
        vendaId: novaVenda.id, vendaNumero: novaVenda.numero, orcamentoNumero: orc.numero,
        clienteId: orc.clienteId, clienteNome: orc.clienteNome, contato: orc.contato,
        enderecoEvento: '', dataMontagem: '', dataRetirada: '',
        horarioInicio: '', horarioFim: '', equipe: '', motorista: '',
        itens: orc.itens, observacoesOperacionais: orc.observacoes,
        criadoEm: format(new Date(), 'yyyy-MM-dd'),
      });
      setVendas(v => [normalizeVenda(novaVenda), ...v]);
      setOrdens(o => [normalizeOS(novaOS), ...o]);
      addToast(`✅ Venda ${novaVenda.numero} e OS ${novaOS.numero} geradas automaticamente!`);
    } catch (e: any) { addToast(`❌ Erro ao gerar venda/OS: ${e.message}`); }
  };

  const saveOrc = async (orc: Orcamento) => {
    const orcComTotais = { ...orc, ...calcularTotais(orc) };
    try {
      let salvo: any;
      const existe = orcamentos.some(x => x.id === orcComTotais.id);
      if (existe) {
        salvo = await orcamentosApi.atualizar(orcComTotais.id, orcComTotais);
      } else {
        salvo = await orcamentosApi.criar(orcComTotais);
      }
      const orcSalvo = normalizeOrc(salvo);
      setOrcamentos(p => {
        const i = p.findIndex(x => x.id === orcSalvo.id);
        if (i >= 0) { const n = [...p]; n[i] = orcSalvo; return n; }
        return [orcSalvo, ...p];
      });
      if (orcSalvo.status === 'aprovado' && !vendas.some(v => v.orcamentoId === orcSalvo.id)) {
        setPendingAprovacaoOrc(orcSalvo);
      }
      navTo('orcamentos');
    } catch (e: any) { addToast(`❌ Erro ao salvar orçamento: ${e.message}`); }
  };

  const handleStatusChange = async (id: string, status: Orcamento['status']) => {
    try {
      const salvo = await orcamentosApi.status(id, status);
      const orcAtualizado = normalizeOrc(salvo);
      setOrcamentos(p => p.map(o => o.id === id ? orcAtualizado : o));
      if (status === 'aprovado' && !vendas.some(v => v.orcamentoId === orcAtualizado.id)) {
        setPendingAprovacaoOrc(orcAtualizado);
      }
    } catch (e: any) { addToast(`❌ Erro ao atualizar status: ${e.message}`); }
  };

  const duplicarOrc = async (orc: Orcamento) => {
    try {
      const salvo = await orcamentosApi.criar({
        ...orc, id: undefined, numero: undefined,
        status: 'rascunho', criadoEm: format(new Date(), 'yyyy-MM-dd'),
        itens: orc.itens.map(i => ({ ...i, id: undefined })),
      });
      setOrcamentos(p => [normalizeOrc(salvo), ...p]);
      addToast(`✅ Orçamento duplicado como ${salvo.numero}`);
    } catch (e: any) { addToast(`❌ Erro ao duplicar orçamento: ${e.message}`); }
  };

  const saveUsuario = async (u: Usuario) => {
    try {
      const data: any = { nome: u.nome, email: u.email, role: u.role, ativo: u.ativo };
      if (u.senha) data.senha = u.senha;
      let salvo: any;
      const existe = usuarios.some(x => x.id === u.id);
      if (existe) {
        salvo = await usuariosApi.atualizar(u.id, data);
      } else {
        salvo = await usuariosApi.criar(data);
      }
      const uSalvo: Usuario = { ...salvo, senha: '' };
      setUsuarios(p => { const i = p.findIndex(x => x.id === uSalvo.id); if (i >= 0) { const n = [...p]; n[i] = uSalvo; return n; } return [uSalvo, ...p]; });
      if (user && uSalvo.id === user.id) setUser(uSalvo);
    } catch (e: any) { addToast(`❌ Erro ao salvar usuário: ${e.message}`); }
  };

  const verOSdaVenda = (vendaId: string) => { setFiltroOsVendaId(vendaId); navTo('ordens-servico'); };

  const handleLogin = async (u: Usuario) => {
    setUser(u);
    try {
      await carregarDados();
    } catch (e: any) {
      addToast(`❌ Erro ao carregar dados: ${e.message || 'verifique a conexão com o servidor'}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem(cfg.tokenKey);
    setUser(null);
    setOrcamentos([]); setClientes([]); setProdutos([]);
    setEventos([]); setUsuarios([]); setVendas([]); setOrdens([]);
  };

  if (!appReady) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: 'var(--bg)', flexDirection: 'column', gap: 16 }}>
      <div style={{ width: 40, height: 40, background: 'var(--text)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 800, color: '#fff', fontSize: 14 }}>{cfg.sigla}</div>
      <div style={{ fontSize: 14, color: 'var(--text2)' }}>Carregando...</div>
    </div>
  );

  if (!user) return <Login onLogin={handleLogin} />;

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
        return <Orcamentos orcamentos={orcamentos} clientes={clientes} vendas={vendas}
          onNovo={() => { setEditOrc(null); navTo('novo-orcamento'); }}
          onEditar={o => { setEditOrc(o); navTo('novo-orcamento'); }}
          onDelete={async id => {
            try { await orcamentosApi.deletar(id); setOrcamentos(p => p.filter(o => o.id !== id)); }
            catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onStatusChange={handleStatusChange}
          onDuplicar={duplicarOrc}
          onVerVenda={id => { setVendaAbrirId(id); navTo('vendas'); }}
          onToast={addToast} />;
      case 'novo-orcamento':
        return <NovoOrcamento orcamento={editOrc} clientes={clientes} produtos={produtos}
          proximoNumero={proximoNumero} onSalvar={saveOrc}
          onCancelar={() => navTo('orcamentos')}
          onSalvarCliente={async c => {
            try {
              let salvo: any;
              const existe = clientes.some(x => x.id === c.id);
              if (existe) salvo = await clientesApi.atualizar(c.id, c);
              else salvo = await clientesApi.criar(c);
              setClientes(p => { const i = p.findIndex(x => x.id === salvo.id); if (i >= 0) { const n = [...p]; n[i] = salvo; return n; } return [salvo, ...p]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }} />;
      case 'clientes':
        return <Clientes clientes={clientesFiltrados}
          onSalvar={async c => {
            try {
              let salvo: any;
              const existe = clientes.some(x => x.id === c.id);
              if (existe) salvo = await clientesApi.atualizar(c.id, c);
              else salvo = await clientesApi.criar(c);
              setClientes(p => { const i = p.findIndex(x => x.id === salvo.id); if (i >= 0) { const n = [...p]; n[i] = salvo; return n; } return [salvo, ...p]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onDelete={async id => {
            try { await clientesApi.deletar(id); setClientes(p => p.filter(c => c.id !== id)); }
            catch (e: any) { addToast(`❌ ${e.message}`); }
          }} />;
      case 'produtos':
        return <Produtos produtos={produtosFiltrados}
          onSalvar={async p => {
            try {
              let salvo: any;
              const existe = produtos.some(x => x.id === p.id);
              if (existe) salvo = await produtosApi.atualizar(p.id, p);
              else salvo = await produtosApi.criar(p);
              setProdutos(prev => { const i = prev.findIndex(x => x.id === salvo.id); if (i >= 0) { const n = [...prev]; n[i] = salvo; return n; } return [salvo, ...prev]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onDelete={async id => {
            try { await produtosApi.deletar(id); setProdutos(p => p.filter(x => x.id !== id)); }
            catch (e: any) { addToast(`❌ ${e.message}`); }
          }} />;
      case 'agenda':
        return <Agenda eventos={eventos}
          onSalvar={async e => {
            try {
              let salvo: any;
              const existe = eventos.some(x => x.id === e.id);
              if (existe) salvo = await eventosApi.atualizar(e.id, e);
              else salvo = await eventosApi.criar(e);
              setEventos(p => { const i = p.findIndex(x => x.id === salvo.id); if (i >= 0) { const n = [...p]; n[i] = salvo; return n; } return [...p, salvo]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onDelete={async id => {
            try { await eventosApi.deletar(id); setEventos(p => p.filter(e => e.id !== id)); }
            catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onToggle={async id => {
            try {
              const salvo = await eventosApi.toggle(id);
              setEventos(p => p.map(e => e.id === id ? salvo : e));
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }} />;
      case 'vendas':
        return <Vendas vendas={vendas} userRole={user.role}
          detalheInicial={vendaAbrirId}
          onSalvar={async v => {
            try {
              const salva = await vendasApi.atualizar(v.id, v);
              setVendas(p => { const i = p.findIndex(x => x.id === salva.id); if (i >= 0) { const n = [...p]; n[i] = normalizeVenda(salva); return n; } return [normalizeVenda(salva), ...p]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onDelete={async id => {
            try {
              await vendasApi.deletar(id);
              setVendas(p => p.filter(v => v.id !== id));
              setOrdens(p => p.filter(o => o.vendaId !== id));
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onVerOS={verOSdaVenda} />;
      case 'ordens-servico':
        return <OrdemServicoComp ordens={ordens} userRole={user.role}
          onSalvar={async os => {
            try {
              const salvo = await ordensApi.atualizar(os.id, os);
              setOrdens(p => { const i = p.findIndex(x => x.id === salvo.id); if (i >= 0) { const n = [...p]; n[i] = normalizeOS(salvo); return n; } return [normalizeOS(salvo), ...p]; });
            } catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          onDelete={async id => {
            try { await ordensApi.deletar(id); setOrdens(p => p.filter(o => o.id !== id)); }
            catch (e: any) { addToast(`❌ ${e.message}`); }
          }}
          filtroVendaId={filtroOsVendaId}
          onLimparFiltro={() => setFiltroOsVendaId(null)} />;
      case 'configuracoes':
        return <Configuracoes />;
      case 'usuarios':
        return user.role === 'admin'
          ? <Usuarios usuarios={usuarios} usuarioAtualId={user.id} onSalvar={saveUsuario}
              onDelete={async id => {
                try { await usuariosApi.deletar(id); setUsuarios(p => p.filter(u => u.id !== id)); }
                catch (e: any) { addToast(`❌ ${e.message}`); }
              }} />
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
            <div style={{ width: 32, height: 32, background: '#fff', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: 13, color: 'var(--text)' }}>{cfg.sigla}</div>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 700, fontSize: 15, color: '#fff', letterSpacing: '-0.3px' }}>{cfg.nome}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}>{cfg.tagline}</div>
            </div>
          </div>
        </div>
        <div style={{ padding: '12px 10px 4px', flex: 1, overflowY: 'auto' }}>
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '6px 8px 4px' }}>COMERCIAL</div>
          <NavItem label="Dashboard" icon="⊞" active={section === 'dashboard'} onClick={() => navTo('dashboard')} />
          <NavItem label="Orçamentos" icon="📄" active={section === 'orcamentos' || section === 'novo-orcamento'} onClick={() => navTo('orcamentos')} badge={pendOrc || undefined} />
          <NavItem label="Vendas" icon="💰" active={section === 'vendas'} onClick={() => navTo('vendas')} badge={pendVendas || undefined} />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>OPERAÇÃO</div>
          <NavItem label="Ordens de Serviço" icon="🔧" active={section === 'ordens-servico'} onClick={() => navTo('ordens-servico')} badge={pendOS || undefined} />
          <NavItem label="Agenda" icon="📅" active={section === 'agenda'} onClick={() => navTo('agenda')} dot />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>CADASTROS</div>
          <NavItem label="Clientes" icon="👥" active={section === 'clientes'} onClick={() => navTo('clientes')} />
          <NavItem label="Produtos" icon="📦" active={section === 'produtos'} onClick={() => navTo('produtos')} />
          <div style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.25)', letterSpacing: '1.2px', padding: '16px 8px 4px' }}>SISTEMA</div>
          <NavItem label="Configurações" icon="⚙" active={section === 'configuracoes'} onClick={() => navTo('configuracoes')} />
          {user.role === 'admin' && <NavItem label="Usuários" icon="👤" active={section === 'usuarios'} onClick={() => navTo('usuarios')} />}
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
            <button onClick={handleLogout} title="Sair" style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.3)', fontSize: 14, padding: 4 }}>⏻</button>
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
            {!isMobile && (section === 'clientes' || section === 'produtos') && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '8px 12px' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input placeholder={`Buscar em ${pageTitles[section].toLowerCase()}...`} value={busca} onChange={e => setBusca(e.target.value)} style={{ border: 'none', outline: 'none', fontSize: 13, fontFamily: "'Inter',sans-serif", color: 'var(--text)', background: 'transparent', width: 180 }} />
                {busca && (<button onClick={() => setBusca('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text3)', fontSize: 16, lineHeight: 1, padding: 0 }}>×</button>)}
              </div>
            )}
            <div style={{ width: 36, height: 36, borderRadius: 9, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', fontSize: 16 }}>🔔</div>
            {section === 'dashboard' && (
              <button onClick={() => { setEditOrc(null); navTo('novo-orcamento'); }} style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '9px 16px', borderRadius: 10, background: 'var(--text)', color: '#fff', border: 'none', cursor: 'pointer', fontSize: 13.5, fontWeight: 500, fontFamily: "'Inter',sans-serif", whiteSpace: 'nowrap' }}>+ Novo orçamento</button>
            )}
          </div>
        </div>
        {renderContent()}
      </main>

      <div style={{ position: 'fixed', bottom: 24, right: 24, display: 'flex', flexDirection: 'column', gap: 10, zIndex: 9999 }}>
        {toasts.map(t => (
          <div key={t.id} style={{ background: '#1a1a2e', color: '#fff', padding: '12px 18px', borderRadius: 12, fontSize: 13.5, fontFamily: "'Inter',sans-serif", boxShadow: '0 4px 20px rgba(0,0,0,0.25)', maxWidth: 360, display: 'flex', alignItems: 'center', gap: 10, animation: 'fadeInUp .25s ease' }}>
            {t.msg}
          </div>
        ))}
      </div>

      {/* Confirmação: gerar Venda + OS ao aprovar orçamento */}
      {pendingAprovacaoOrc && (
        <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.5)',zIndex:9000,display:'flex',alignItems:'center',justifyContent:'center',padding:16 }}>
          <div style={{ background:'var(--surface)',borderRadius:16,padding:32,maxWidth:420,width:'100%',boxShadow:'0 20px 60px rgba(0,0,0,0.3)',textAlign:'center' }}>
            <div style={{ fontSize:40,marginBottom:14 }}>✅</div>
            <div style={{ fontFamily:"'Outfit',sans-serif",fontWeight:700,fontSize:20,marginBottom:8 }}>Orçamento aprovado!</div>
            <div style={{ fontSize:14,color:'var(--text2)',marginBottom:6 }}>{pendingAprovacaoOrc.numero} · {pendingAprovacaoOrc.clienteNome}</div>
            <div style={{ fontSize:13,color:'var(--text3)',marginBottom:28 }}>Deseja gerar a Venda e Ordem de Serviço automaticamente?</div>
            <div style={{ display:'flex',gap:10,justifyContent:'center' }}>
              <button onClick={() => setPendingAprovacaoOrc(null)}
                style={{ padding:'10px 22px',borderRadius:10,border:'1px solid var(--border)',background:'none',cursor:'pointer',fontSize:13,color:'var(--text)' }}>
                Não, só alterar status
              </button>
              <button onClick={async () => { const orc = pendingAprovacaoOrc; setPendingAprovacaoOrc(null); await criarVendaEOS(orc); }}
                style={{ padding:'10px 22px',borderRadius:10,border:'none',background:'var(--text)',color:'#fff',cursor:'pointer',fontSize:13,fontWeight:600 }}>
                ✅ Gerar Venda e OS
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
