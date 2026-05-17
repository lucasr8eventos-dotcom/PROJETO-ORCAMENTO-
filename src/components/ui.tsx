import React, { useState, useEffect } from 'react';

const statusConfig = {
  aprovado:  { label: 'Aprovado',   bg: 'var(--green-bg)', color: 'var(--green)' },
  enviado:   { label: 'Enviado',    bg: 'var(--blue-bg)',  color: 'var(--blue)'  },
  aguardando:{ label: 'Aguardando', bg: 'var(--amber-bg)', color: 'var(--amber)' },
  recusado:  { label: 'Recusado',   bg: 'var(--red-bg)',   color: 'var(--red)'   },
  rascunho:  { label: 'Rascunho',   bg: 'var(--surface3)', color: 'var(--text2)' },
};

export function StatusBadge({ status }: { status: string }) {
  const cfg = statusConfig[status as keyof typeof statusConfig] || statusConfig.rascunho;
  return (
    <span style={{ display:'inline-flex',alignItems:'center',gap:5,padding:'3px 10px',borderRadius:20,fontSize:11.5,fontWeight:500,background:cfg.bg,color:cfg.color }}>
      <span style={{ width:5,height:5,borderRadius:'50%',background:'currentColor' }} />
      {cfg.label}
    </span>
  );
}

interface BtnProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
}

export function Btn({ variant='ghost', size='md', icon, children, style, ...rest }: BtnProps) {
  const base: React.CSSProperties = {
    display:'inline-flex',alignItems:'center',gap:6,border:'none',cursor:'pointer',
    fontFamily:"'Inter',sans-serif",fontWeight:500,transition:'all .15s',outline:'none',
    padding: size==='sm' ? '6px 12px' : '9px 16px',
    fontSize: size==='sm' ? 12.5 : 13.5,
    borderRadius:10,
    ...(variant==='primary' && { background:'var(--text)',color:'#fff' }),
    ...(variant==='ghost'   && { background:'var(--surface)',color:'var(--text)',border:'1px solid var(--border)' }),
    ...(variant==='danger'  && { background:'var(--red-bg)',color:'var(--red)',border:'1px solid transparent' }),
    ...style,
  };
  return <button style={base} {...rest}>{icon}{children}</button>;
}

export function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return <div onClick={onClick} style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'20px',...(onClick&&{cursor:'pointer'}),...style }}>{children}</div>;
}

export function CardHeader({ title, action }: { title: string; action?: React.ReactNode }) {
  return (
    <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:18 }}>
      <span style={{ fontFamily:"'Outfit',sans-serif",fontSize:14.5,fontWeight:600 }}>{title}</span>
      {action}
    </div>
  );
}

export function FormField({ label, children, style }: { label: string; children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div style={{ display:'flex',flexDirection:'column',gap:6,...style }}>
      <label style={{ fontSize:12,fontWeight:500,color:'var(--text2)',letterSpacing:'0.3px' }}>{label}</label>
      {children}
    </div>
  );
}

const inputStyle: React.CSSProperties = {
  padding:'9px 12px',border:'1px solid var(--border)',borderRadius:10,
  fontSize:13.5,fontFamily:"'Inter',sans-serif",color:'var(--text)',
  background:'var(--surface)',outline:'none',width:'100%',transition:'border .15s',
};

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input style={inputStyle} {...props} />;
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select style={{ ...inputStyle,cursor:'pointer' }} {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea style={{ ...inputStyle,resize:'vertical',lineHeight:1.6 }} {...props} />;
}

export function StatCard({ label, value, badge, iconBg, icon }: { label:string; value:string; badge?:string; iconBg:string; icon:React.ReactNode }) {
  const up = badge?.startsWith('↑');
  return (
    <div style={{ background:'var(--surface)',border:'1px solid var(--border)',borderRadius:14,padding:'18px 20px' }}>
      <div style={{ display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:14 }}>
        <div style={{ width:36,height:36,borderRadius:9,display:'flex',alignItems:'center',justifyContent:'center',background:iconBg }}>{icon}</div>
        {badge && <span style={{ fontSize:11,fontWeight:500,padding:'3px 8px',borderRadius:20,background:up?'var(--green-bg)':'var(--red-bg)',color:up?'var(--green)':'var(--red)' }}>{badge}</span>}
      </div>
      <div style={{ fontFamily:"'Outfit',sans-serif",fontSize:26,fontWeight:700,letterSpacing:'-0.5px',lineHeight:1 }}>{value}</div>
      <div style={{ fontSize:12.5,color:'var(--text2)',marginTop:5 }}>{label}</div>
    </div>
  );
}

export function Modal({ open, onClose, title, children, width=520 }: { open:boolean; onClose:()=>void; title:string; children:React.ReactNode; width?:number }) {
  if (!open) return null;
  return (
    <div style={{ position:'fixed',inset:0,background:'rgba(0,0,0,0.45)',zIndex:1000,display:'flex',alignItems:'center',justifyContent:'center',padding:20 }} onClick={onClose}>
      <div style={{ background:'var(--surface)',borderRadius:16,width:'100%',maxWidth:width,maxHeight:'90vh',overflowY:'auto' }} onClick={e=>e.stopPropagation()}>
        <div style={{ display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px 16px',borderBottom:'1px solid var(--border)' }}>
          <span style={{ fontFamily:"'Outfit',sans-serif",fontSize:16,fontWeight:700 }}>{title}</span>
          <button onClick={onClose} style={{ background:'none',border:'none',cursor:'pointer',fontSize:20,color:'var(--text2)',lineHeight:1 }}>×</button>
        </div>
        <div style={{ padding:'20px 24px' }}>{children}</div>
      </div>
    </div>
  );
}

export function Tabs({ tabs, active, onChange }: { tabs:{id:string;label:string}[]; active:string; onChange:(id:string)=>void }) {
  return (
    <div style={{ display:'flex',gap:2,background:'var(--surface2)',borderRadius:10,padding:3,border:'1px solid var(--border)',overflowX:'auto' }}>
      {tabs.map(t => (
        <button key={t.id} onClick={()=>onChange(t.id)} style={{ padding:'7px 16px',borderRadius:7,fontSize:13,fontWeight:active===t.id?500:400,cursor:'pointer',border:'none',whiteSpace:'nowrap',background:active===t.id?'var(--surface)':'transparent',color:active===t.id?'var(--text)':'var(--text2)',boxShadow:active===t.id?'0 1px 3px rgba(0,0,0,0.08)':'none',transition:'all .15s' }}>{t.label}</button>
      ))}
    </div>
  );
}

const avatarColors = ['#1D9E75','#185FA5','#BA7517','#A32D2D','#0F6E56','#533DB7','#993556'];
export function Avatar({ name, size=38 }: { name:string; size?:number }) {
  const initials = name.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();
  const color = avatarColors[(name.charCodeAt(0)||0) % avatarColors.length];
  return <div style={{ width:size,height:size,borderRadius:'50%',background:color,display:'flex',alignItems:'center',justifyContent:'center',fontSize:size*0.33,fontWeight:600,color:'#fff',flexShrink:0 }}>{initials}</div>;
}

export const fmtMoeda = (v: number) => v.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

export function CurrencyInput({ value, onChange, style }: { value: number; onChange: (v: number) => void; style?: React.CSSProperties }) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);
  const fmt = (digits: string) => (parseInt(digits || '0', 10) / 100).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const display = focused ? (raw ? fmt(raw) : '') : (value === 0 ? '' : value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  const handleFocus = () => { const c = Math.round(value * 100); setRaw(c === 0 ? '' : String(c)); setFocused(true); };
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    setRaw(digits);
    onChange(parseInt(digits || '0', 10) / 100);
  };
  return (
    <input value={display} onChange={handleChange} onFocus={handleFocus} onBlur={() => { setFocused(false); setRaw(''); }}
      placeholder="0,00" inputMode="numeric"
      style={{ ...inputStyle, ...style }} />
  );
}

function fmtCpf(d: string) {
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0,3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6)}`;
  return `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
}
function fmtCnpj(d: string) {
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0,2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8)}`;
  return `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
}

export function CpfCnpjInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 14);
    onChange(digits.length <= 11 ? fmtCpf(digits) : fmtCnpj(digits));
  };
  return (
    <input value={value} onChange={handleChange} inputMode="numeric" placeholder="CPF ou CNPJ"
      style={inputStyle} />
  );
}

export function TelefoneInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 11);
    let fmt = d;
    if (d.length > 2)  fmt = `(${d.slice(0,2)}) ${d.slice(2)}`;
    if (d.length > 6)  fmt = `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6)}`;
    if (d.length > 10) fmt = `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7)}`;
    onChange(fmt);
  };
  return (
    <input value={value} onChange={handleChange} inputMode="tel" placeholder="(00) 00000-0000"
      style={inputStyle} />
  );
}

export function DataInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const toDisplay = (iso: string) => {
    if (!iso) return '';
    const [y, m, d] = iso.split('-');
    return `${d}/${m}/${y}`;
  };
  const [text, setText] = useState(toDisplay(value));
  useEffect(() => { setText(toDisplay(value)); }, [value]);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const d = e.target.value.replace(/\D/g, '').slice(0, 8);
    let fmt = d;
    if (d.length > 2) fmt = `${d.slice(0,2)}/${d.slice(2)}`;
    if (d.length > 4) fmt = `${d.slice(0,2)}/${d.slice(2,4)}/${d.slice(4)}`;
    setText(fmt);
    if (d.length === 8) onChange(`${d.slice(4,8)}-${d.slice(2,4)}-${d.slice(0,2)}`);
  };
  return (
    <input value={text} onChange={handleChange} inputMode="numeric" placeholder="dd/mm/aaaa"
      style={inputStyle} />
  );
}
