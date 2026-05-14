import React, { useState } from 'react';

interface Props { onLogin: (email:string, role:'admin'|'operacional') => void; }

export default function Login({ onLogin }: Props) {
  const [email, setEmail] = useState('admin@empresa.com');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro('');
    if (!email || !senha) { setErro('Preencha e-mail e senha.'); return; }
    if (senha.length < 4) { setErro('Senha incorreta.'); return; }
    setLoading(true);
    setTimeout(() => { onLogin(email, email.includes('operacional') ? 'operacional' : 'admin'); }, 700);
  };

  return (
    <div style={{ minHeight:'100vh',background:'var(--bg)',display:'flex',alignItems:'center',justifyContent:'center',padding:20 }}>
      <div style={{ width:'100%',maxWidth:420 }}>
        <div style={{ textAlign:'center',marginBottom:40 }}>
          <div style={{ width:52,height:52,background:'var(--text)',borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 16px',fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:800,color:'#fff' }}>OP</div>
          <div style={{ fontFamily:"'Syne',sans-serif",fontSize:24,fontWeight:800,letterSpacing:'-0.5px' }}>OpSuite</div>
          <div style={{ fontSize:14,color:'var(--text2)',marginTop:4 }}>Plataforma Operacional</div>
        </div>
        <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:18,padding:'32px 32px' }}>
          <div style={{ fontFamily:"'Syne',sans-serif",fontSize:18,fontWeight:700,marginBottom:6 }}>Entrar na plataforma</div>
          <div style={{ fontSize:13.5,color:'var(--text2)',marginBottom:24 }}>Use seu e-mail e senha de acesso</div>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom:14 }}>
              <label style={{ fontSize:12,fontWeight:500,color:'var(--text2)',display:'block',marginBottom:6 }}>E-mail</label>
              <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="seu@email.com" style={{ width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',transition:'border .15s' }} onFocus={e=>(e.target.style.borderColor='#888')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
            </div>
            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12,fontWeight:500,color:'var(--text2)',display:'block',marginBottom:6 }}>Senha</label>
              <input type="password" value={senha} onChange={e=>setSenha(e.target.value)} placeholder="••••••••" style={{ width:'100%',padding:'10px 14px',border:'1px solid var(--border)',borderRadius:10,fontSize:14,fontFamily:"'DM Sans',sans-serif",outline:'none',color:'var(--text)',background:'var(--surface)',transition:'border .15s' }} onFocus={e=>(e.target.style.borderColor='#888')} onBlur={e=>(e.target.style.borderColor='var(--border)')} />
              <div style={{ textAlign:'right',marginTop:6 }}><button type="button" style={{ background:'none',border:'none',cursor:'pointer',fontSize:12.5,color:'var(--blue)',fontFamily:"'DM Sans',sans-serif" }}>Esqueci minha senha</button></div>
            </div>
            {erro && <div style={{ padding:'10px 14px',background:'var(--red-bg)',color:'var(--red)',borderRadius:9,fontSize:13,marginBottom:14 }}>{erro}</div>}
            <button type="submit" disabled={loading} style={{ width:'100%',padding:'12px',background:loading?'var(--surface3)':'var(--text)',color:loading?'var(--text2)':'#fff',border:'none',borderRadius:10,fontSize:14,fontWeight:600,fontFamily:"'DM Sans',sans-serif",cursor:loading?'not-allowed':'pointer',transition:'all .15s' }}>{loading?'Entrando...':'Entrar'}</button>
          </form>
          <div style={{ marginTop:20,padding:'12px 14px',background:'var(--surface2)',borderRadius:9,fontSize:12,color:'var(--text2)',lineHeight:1.6 }}>
            💡 <strong>Demo:</strong> Use qualquer e-mail + senha com 4+ caracteres.<br/>
            <span style={{ color:'var(--text3)' }}>Admin: admin@empresa.com | Operacional: operacional@empresa.com</span>
          </div>
        </div>
      </div>
    </div>
  );
}
