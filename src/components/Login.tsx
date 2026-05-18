import React, { useState } from 'react';
import { Usuario } from '../types';
import { authApi } from '../api';
import cfg from '../config';

interface Props {
  onLogin: (usuario: Usuario) => void;
}

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return; }
    setLoading(true);
    try {
      const { token, usuario } = await authApi.login(email, senha);
      localStorage.setItem(cfg.tokenKey, token);
      localStorage.setItem('opsuite_token', token);
      onLogin({ ...usuario, senha: '', role: usuario.role as any, ativo: true, criadoEm: '' });
    } catch (e: any) {
      setErro(e.message || 'Erro ao fazer login.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ width:'100%',maxWidth:420 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ width:52,height:52,background:'var(--text)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:800,color:'#fff' }}>{cfg.sigla}</div>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:24,fontWeight:800,letterSpacing:'-0.5px' }}>{cfg.nome}</div>
          <div style={{ fontSize:14,color:'var(--text2)',marginTop:4 }}>{cfg.tagline}</div>
        </div>
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:'32px 32px' }}>
          <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:18,fontWeight:700,marginBottom:6 }}>Entrar na plataforma</div>
          <div style={{ fontSize:13.5,color:'var(--text2)',marginBottom:24 }}>Use seu e-mail e senha de acesso</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:500,color:'var(--text2)',display:'block',marginBottom:6 }}>E-mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com"
                style={{ width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',transition:'border .15s' }}
                onFocus={e=>(e.target.style.borderColor='#888')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12,fontWeight:500,color:'var(--text2)',display:'block',marginBottom:6 }}>Senha</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••"
                style={{ width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:"'Inter',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',transition:'border .15s' }}
                onFocus={e=>(e.target.style.borderColor='#888')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
            </div>
            {erro && <div style={{ padding:'10px 14px',background:'var(--red-bg)',color:'var(--red)',borderRadius:9,fontSize:13,marginBottom:14 }}>{erro}</div>}
            <button type="submit" disabled={loading}
              style={{ width:'100%',padding:'12px',background:loading?'var(--surface3)':'var(--text)',color:loading?'var(--text2)':'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,fontFamily:"'Inter',sans-serif",cursor:loading?'not-allowed':'pointer',transition:'all .15s' }}>
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
