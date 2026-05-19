import React, { useState } from 'react';
import { Usuario } from '../types';
import { Card, Btn, FormField, Input, Select, Modal, Avatar } from './ui';
import { v4 as uuid } from 'uuid';
import { format } from 'date-fns';

interface Props {
  usuarios: Usuario[];
  usuarioAtualId: string;
  onSalvar: (u: Usuario) => void;
  onDelete: (id: string) => void;
}

const empty = (): Usuario => ({
  id: '', nome: '', email: '', senha: '', role: 'operacional', ativo: true,
  criadoEm: format(new Date(), 'yyyy-MM-dd'),
});

export default function Usuarios({ usuarios, usuarioAtualId, onSalvar, onDelete }: Props) {
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Usuario>(empty());
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [erro, setErro] = useState('');

  const abrirNovo = () => { setForm(empty()); setErro(''); setMostrarSenha(true); setModal(true); };
  const abrirEditar = (u: Usuario) => { setForm({ ...u, senha: '' }); setErro(''); setMostrarSenha(false); setModal(true); };

  const salvar = () => {
    if (!form.nome.trim()) { setErro('Nome obrigatório.'); return; }
    if (!form.email.trim()) { setErro('E-mail obrigatório.'); return; }
    const emailExiste = usuarios.find(u => u.email === form.email && u.id !== form.id);
    if (emailExiste) { setErro('Já existe um usuário com esse e-mail.'); return; }
    if (!form.id && !form.senha) { setErro('Senha obrigatória para novo usuário.'); return; }
    if (form.senha && form.senha.length < 4) { setErro('Senha deve ter ao menos 4 caracteres.'); return; }

    const usuarioExistente = usuarios.find(u => u.id === form.id);
    const senhaFinal = form.senha || usuarioExistente?.senha || '';
    onSalvar({ ...form, id: form.id || uuid(), senha: senhaFinal });
    setModal(false);
  };

  const podeExcluir = (u: Usuario) => u.id !== usuarioAtualId;

  return (
    <div>
      <div style={{ display:'flex',justifyContent:'flex-end',marginBottom:18 }}>
        <Btn variant="primary" icon={<span>+</span>} onClick={abrirNovo}>Novo usuário</Btn>
      </div>

      <Card style={{ padding:0 }}>
        {usuarios.length === 0 ? (
          <div style={{ padding:48,textAlign:'center',color:'var(--text3)',fontSize:14 }}>Nenhum usuário cadastrado</div>
        ) : (
          <div style={{ overflowX:'auto' }}>
            <table style={{ width:'100%',borderCollapse:'collapse' }}>
              <thead>
                <tr>{['USUÁRIO','E-MAIL','PERFIL','STATUS','CRIADO EM',''].map(h=>(
                  <th key={h} style={{ textAlign:'left',fontSize:10.5,fontWeight:500,color:'var(--text3)',letterSpacing:'0.7px',padding:'12px 16px',borderBottom:'1px solid var(--border)',whiteSpace:'nowrap' }}>{h}</th>
                ))}</tr>
              </thead>
              <tbody>
                {usuarios.map(u => (
                  <tr key={u.id}
                    style={{ cursor:'pointer' }}
                    onMouseEnter={e=>(e.currentTarget.style.background='var(--surface2)')}
                    onMouseLeave={e=>(e.currentTarget.style.background='transparent')}
                    onClick={()=>abrirEditar(u)}
                  >
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex',alignItems:'center',gap:10 }}>
                        <Avatar name={u.nome} size={32} />
                        <div>
                          <div style={{ fontSize:13,fontWeight:600,color:'var(--text)' }}>{u.nome}</div>
                          {u.id === usuarioAtualId && <div style={{ fontSize:10.5,color:'var(--green)' }}>você</div>}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:13,color:'var(--text2)' }}>{u.email}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11.5,padding:'3px 10px',borderRadius:20,fontWeight:500,
                        background: u.role==='admin' ? 'var(--blue-bg)' : 'var(--surface2)',
                        color: u.role==='admin' ? 'var(--blue)' : 'var(--text2)' }}>
                        {u.role === 'admin' ? 'Administrador' : 'Operacional'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:11.5,padding:'3px 10px',borderRadius:20,fontWeight:500,
                        background: u.ativo ? 'var(--green-bg)' : 'var(--red-bg)',
                        color: u.ativo ? 'var(--green)' : 'var(--red)' }}>
                        <span style={{width:5,height:5,borderRadius:'50%',background:'currentColor',display:'inline-block',marginRight:5}} />
                        {u.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td style={{ padding:'12px 16px',fontSize:12.5,color:'var(--text2)' }}>
                      {format(new Date(u.criadoEm+'T12:00:00'),'dd/MM/yyyy')}
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <button style={{ background:'none',border:'none',cursor:'pointer',color:'var(--text3)',fontSize:16 }}>✏️</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal open={modal} onClose={()=>setModal(false)} title={form.id ? 'Editar usuário' : 'Novo usuário'}>
        <div style={{ display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:14 }}>
          <FormField label="Nome *">
            <Input value={form.nome} onChange={e=>setForm({...form,nome:e.target.value})} placeholder="Nome completo" />
          </FormField>
          <FormField label="E-mail *">
            <Input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})} placeholder="email@empresa.com" />
          </FormField>
          <FormField label={form.id ? 'Nova senha (deixe vazio para manter)' : 'Senha *'}>
            <div style={{ position:'relative' }}>
              <Input
                type={mostrarSenha ? 'text' : 'password'}
                value={form.senha}
                onChange={e=>setForm({...form,senha:e.target.value})}
                placeholder={form.id ? '••••••••' : 'Mínimo 4 caracteres'}
                style={{ paddingRight:40 }}
              />
              <button type="button" onClick={()=>setMostrarSenha(v=>!v)}
                style={{ position:'absolute',right:10,top:'50%',transform:'translateY(-50%)',background:'none',border:'none',cursor:'pointer',fontSize:14,color:'var(--text3)' }}>
                {mostrarSenha ? '🙈' : '👁️'}
              </button>
            </div>
          </FormField>
          <FormField label="Perfil">
            <Select value={form.role} onChange={e=>setForm({...form,role:e.target.value as 'admin'|'operacional'})}>
              <option value="admin">Administrador</option>
              <option value="operacional">Operacional</option>
            </Select>
          </FormField>
          <FormField label="Status">
            <Select value={form.ativo?'1':'0'} onChange={e=>setForm({...form,ativo:e.target.value==='1'})}>
              <option value="1">Ativo</option>
              <option value="0">Inativo</option>
            </Select>
          </FormField>
        </div>
        {erro && <div style={{ padding:'10px 14px',background:'var(--red-bg)',color:'var(--red)',borderRadius:9,fontSize:13,marginBottom:14 }}>{erro}</div>}
        <div style={{ display:'flex',gap:8,justifyContent:'flex-end' }}>
          {form.id && podeExcluir(form) && (
            <Btn variant="danger" onClick={()=>{onDelete(form.id);setModal(false);}}>Excluir</Btn>
          )}
          <Btn onClick={()=>setModal(false)}>Cancelar</Btn>
          <Btn variant="primary" onClick={salvar}>{form.id ? 'Salvar alterações' : 'Criar usuário'}</Btn>
        </div>
      </Modal>
    </div>
  );
}
