import { useState, useEffect } from 'react'
import { 
  User, Shield, Save, Lock, Camera, 
  ChevronRight, LogOut, Loader2, CheckCircle2, Hash,
  Smartphone, Bell, Eye, EyeOff
} from 'lucide-react'
import { updatePassword, signOut } from 'firebase/auth'
import { auth } from '../lib/firebase'

export default function Configuracoes() {
  const [activeTab, setActiveTab] = useState('perfil')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [novoPin, setNovoPin] = useState('')
  
  const [status, setStatus] = useState({ type: '', msg: '' })

  useEffect(() => {
    const savedPin = localStorage.getItem('master_pin') || '1234'
    setNovoPin(savedPin)
  }, [])

  const handleUpdateSecurity = async () => {
    setStatus({ type: '', msg: '' })
    setLoading(true)

    try {
      if (novoPin.length !== 4) {
        throw new Error('O PIN deve ter exatamente 4 dígitos')
      }
      localStorage.setItem('master_pin', novoPin)

      if (novaSenha) {
        if (novaSenha.length < 6) throw new Error('Senha: Mínimo 6 caracteres')
        if (novaSenha !== confirmarSenha) throw new Error('As senhas não coincidem')
        
        const user = auth.currentUser
        if (user) await updatePassword(user, novaSenha)
      }

      setStatus({ type: 'success', msg: 'Protocolos de segurança atualizados!' })
      setNovaSenha(''); setConfirmarSenha('')
    } catch (error: any) {
      const msg = error.code === 'auth/requires-recent-login' 
        ? 'Sessão expirada. Saia e entre novamente.' 
        : error.message || 'Erro na atualização.'
      setStatus({ type: 'error', msg })
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    if (confirm('Deseja realmente encerrar a sessão?')) signOut(auth)
  }

  const tabs = [
    { id: 'perfil', label: 'Meu Perfil', icon: <User size={14} /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield size={14} /> },
  ]

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-28 px-4 text-zinc-100">
      
      {/* HEADER PADRÃO BOSS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
              Painel de Ajustes
            </h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80 italic">Preferências e Segurança da Conta</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* NAVEGAÇÃO LATERAL (DESKTOP) / TABS (MOBILE) */}
        <div className="lg:col-span-3 space-y-2">
          <div className="flex lg:flex-col gap-2 p-1.5 bg-zinc-900/40 rounded-3xl border border-white/5 backdrop-blur-md overflow-x-auto no-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); setStatus({ type: '', msg: '' }) }}
                className={`flex items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap flex-1 lg:flex-none ${
                  activeTab === tab.id 
                  ? 'bg-[#6CC551] text-black shadow-lg' 
                  : 'text-zinc-500 hover:bg-white/5 hover:text-zinc-300'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          <button 
            onClick={handleLogout}
            className="hidden lg:flex w-full items-center gap-3 px-6 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/10 transition-all border border-transparent hover:border-red-500/20 mt-4"
          >
            <LogOut size={14} /> Encerrar Sessão
          </button>
        </div>

        {/* ÁREA DE CONTEÚDO */}
        <div className="lg:col-span-9 bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-2xl min-h-125">
          
          {activeTab === 'perfil' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-10">
              <div className="flex flex-col md:flex-row items-center gap-8 border-b border-white/3 pb-10">
                <div className="relative group">
                  <div className="w-28 h-28 bg-zinc-950 border-2 border-dashed border-[#6CC551]/20 rounded-4xl flex items-center justify-center overflow-hidden transition-all group-hover:border-[#6CC551]/50 shadow-2xl">
                    <User size={40} className="text-zinc-800" />
                  </div>
                  <button className="absolute -bottom-2 -right-2 bg-[#6CC551] p-3 rounded-2xl text-black border-[6px] border-[#121212] hover:scale-110 transition-transform shadow-lg">
                    <Camera size={16} strokeWidth={3} />
                  </button>
                </div>
                <div className="text-center md:text-left">
                  <span className="text-[8px] font-black text-[#6CC551] uppercase tracking-[0.4em] mb-2 block">Administrador Root</span>
                  <h3 className="text-2xl md:text-3xl font-black italic uppercase text-white tracking-tighter leading-none">
                    {auth.currentUser?.displayName || 'Boss User'}
                  </h3>
                  <p className="text-[10px] font-bold text-zinc-600 tracking-widest uppercase mt-2 italic">Acesso total ao sistema</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 opacity-40 grayscale pointer-events-none">
                <ConfigInputGroup label="Identificação da Unidade" value="Matriz Smoke Boss" icon={<Smartphone size={14}/>} />
                <ConfigInputGroup label="E-mail de Acesso" value={auth.currentUser?.email || ''} icon={<Bell size={14}/>} />
                <p className="text-[9px] font-black text-zinc-700 uppercase tracking-widest md:col-span-2 italic">
                  * Campos geridos pelo diretório central não podem ser alterados localmente.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'seguranca' && (
            <div className="animate-in slide-in-from-right-4 duration-500 space-y-10">
              
              {/* PIN DE ACESSO */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/3 pb-4">
                   <div className="p-2.5 bg-[#6CC551]/10 rounded-xl text-[#6CC551] shadow-inner"><Hash size={18} /></div>
                   <div>
                     <h3 className="text-[11px] font-black uppercase text-white tracking-widest italic leading-none">PIN de Proteção</h3>
                     <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1">Utilizado para desbloquear telas restritas</p>
                   </div>
                </div>
                <div className="max-w-xs">
                  <ConfigInputGroup 
                    label="Código PIN (4 Dígitos)" 
                    type="text" 
                    maxLength={4}
                    placeholder="0000" 
                    value={novoPin}
                    onChange={(e: any) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                  />
                </div>
              </div>

              {/* SENHA DA CONTA */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 border-b border-white/3 pb-4">
                   <div className="p-2.5 bg-red-500/10 rounded-xl text-red-500 shadow-inner"><Lock size={18} /></div>
                   <div>
                     <h3 className="text-[11px] font-black uppercase text-white tracking-widest italic leading-none">Senha Master</h3>
                     <p className="text-[8px] font-bold text-zinc-600 uppercase mt-1">Credenciais de autenticação Cloud</p>
                   </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <ConfigInputGroup 
                      label="Nova Senha Master" 
                      type={showPassword ? "text" : "password"} 
                      placeholder="••••••••" 
                      value={novaSenha}
                      onChange={(e: any) => setNovaSenha(e.target.value)}
                    />
                    <button 
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 bottom-4 text-zinc-600 hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}
                    </button>
                  </div>
                  <ConfigInputGroup 
                    label="Confirmar Nova Senha" 
                    type={showPassword ? "text" : "password"} 
                    placeholder="••••••••" 
                    value={confirmarSenha}
                    onChange={(e: any) => setConfirmarSenha(e.target.value)}
                  />
                </div>
              </div>

              {status.msg && (
                <div className={`p-5 rounded-3xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-3 border animate-in slide-in-from-top-2 ${
                  status.type === 'success' 
                  ? 'bg-[#6CC551]/10 border-[#6CC551]/20 text-[#6CC551]' 
                  : 'bg-red-500/10 border-red-500/20 text-red-500'
                }`}>
                  {status.type === 'success' ? <CheckCircle2 size={18} /> : <Shield size={18} />}
                  {status.msg}
                </div>
              )}
              
              <div className="pt-6">
                <button 
                  onClick={handleUpdateSecurity}
                  disabled={loading}
                  className="w-full py-5 bg-[#6CC551] text-black rounded-2xl text-[11px] font-black uppercase tracking-[0.3em] hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-xl shadow-[#6CC551]/10"
                >
                  {loading ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} strokeWidth={3} />}
                  {loading ? 'Sincronizando...' : 'Confirmar Atualizações'}
                </button>
              </div>

              <button 
                onClick={handleLogout} 
                className="lg:hidden w-full p-6 bg-red-500/5 border border-red-500/10 rounded-2xl flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <LogOut size={18} className="text-red-500" />
                  <span className="text-[11px] font-black uppercase text-red-500 tracking-widest">Encerrar Sessão</span>
                </div>
                <ChevronRight size={18} className="text-red-500/30 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

function ConfigInputGroup({ label, placeholder, type = "text", value, onChange, readOnly = false, maxLength, icon }: any) {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center gap-2 px-1">
        <span className="text-zinc-700 group-focus-within:text-[#6CC551] transition-colors">{icon}</span>
        <label className="text-[9px] font-black text-zinc-600 uppercase tracking-widest group-focus-within:text-white transition-colors">
          {label}
        </label>
      </div>
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        maxLength={maxLength}
        placeholder={placeholder}
        className="w-full bg-zinc-950/50 border border-white/5 rounded-2xl p-5 text-white text-sm outline-none focus:border-[#6CC551]/40 focus:bg-zinc-950 transition-all font-bold italic tracking-tight placeholder:text-zinc-800"
      />
    </div>
  )
}