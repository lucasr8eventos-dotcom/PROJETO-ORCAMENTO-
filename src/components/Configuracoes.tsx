import React, { useState, useRef } from 'react';
import { Card, FormField, Input, Btn } from './ui';
import { loadData, saveData } from '../data';

export interface ConfigEmpresa {
  nome: string; razaoSocial: string; cnpj: string; ie: string;
  email: string; telefone: string; endereco: string; logo: string;
}

const defaultConfig: ConfigEmpresa = { nome:'',razaoSocial:'',cnpj:'',ie:'',email:'',telefone:'',endereco:'',logo:'' };

export function loadConfig(): ConfigEmpresa {
  return loadData('opsuite_config', defaultConfig);
}

export default function Configuracoes() {
  const [form, setForm] = useState<ConfigEmpresa>(() => loadConfig());
  const [salvo, setSalvo] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleSalvar = () => { saveData('opsuite_config', form); setSalvo(true); setTimeout(()=>setSalvo(false),2500); };

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setForm(p=>({...p,logo:reader.result as string}));
    reader.readAsDataURL(file);
  };

  const set = (key: keyof ConfigEmpresa) => ({ value: form[key], onChange: (e: React.ChangeEvent<HTMLInputElement>) => { setForm(p=>({...p,[key]:e.target.value})); setSalvo(false); } });

  return (
    <div style={{ maxWidth:640 }}>
      <Card style={{ marginBottom:14 }}>
        <div style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:600,marginBottom:16 }}>Logo da empresa</div>
        <div style={{ display:'flex',alignItems:'center',gap:16 }}>
          <div style={{ width:80,height:80,borderRadius:10,border:'1.5px dashed var(--border)',display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',background:'var(--surface2)',flexShrink:0 }}>
            {form.logo ? <img src={form.logo} alt="Logo" style={{ width:'100%',height:'100%',objectFit:'contain' }} /> : <span style={{ fontSize:11,color:'var(--text3)',textAlign:'center',padding:8 }}>Sem logo</span>}
          </div>
          <div style={{ display:'flex',flexDirection:'column',gap:8 }}>
            <input ref={fileRef} type="file" accept="image/*" style={{ display:'none' }} onChange={handleLogo} />
            <Btn size="sm" onClick={()=>fileRef.current?.click()}>Carregar logo</Btn>
            {form.logo && <Btn size="sm" variant="ghost" onClick={()=>setForm(p=>({...p,logo:''}))}>Remover</Btn>}
            <span style={{ fontSize:11,color:'var(--text3)' }}>PNG ou JPG · máx. 2MB</span>
          </div>
        </div>
      </Card>
      <Card style={{ marginBottom:16 }}>
        <div style={{ fontFamily:"'Syne',sans-serif",fontSize:14,fontWeight:600,marginBottom:18 }}>Dados da empresa</div>
        <div style={{ display:'flex',flexDirection:'column',gap:14 }}>
          <FormField label="Nome fantasia"><Input {...set('nome')} placeholder="Ex: R8 Eventos" /></FormField>
          <FormField label="Razão social"><Input {...set('razaoSocial')} placeholder="Ex: R8 EVENTOS E PARTICIPACOES EIRELI" /></FormField>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
            <FormField label="CNPJ"><Input {...set('cnpj')} placeholder="00.000.000/0001-00" /></FormField>
            <FormField label="Inscrição Estadual"><Input {...set('ie')} placeholder="0000000000000" /></FormField>
          </div>
          <FormField label="Endereço completo"><Input {...set('endereco')} placeholder="Rua, número, complemento, cidade/UF, CEP" /></FormField>
          <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14 }}>
            <FormField label="Telefone"><Input {...set('telefone')} placeholder="(00) 00000-0000" /></FormField>
            <FormField label="E-mail"><Input {...set('email')} type="email" placeholder="contato@empresa.com.br" /></FormField>
          </div>
        </div>
      </Card>
      <div style={{ display:'flex',alignItems:'center',gap:12 }}>
        <Btn variant="primary" onClick={handleSalvar}>Salvar configurações</Btn>
        {salvo && <span style={{ fontSize:13,color:'var(--green)',display:'flex',alignItems:'center',gap:5 }}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20,6 9,17 4,12" /></svg>Salvo com sucesso</span>}
      </div>
    </div>
  );
}
