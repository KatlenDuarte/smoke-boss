import { useState, useEffect } from 'react'
import { 
  User, Shield, LogOut, Loader2, X, Plus, 
  ChevronRight, Hash, Lock, Users
} from 'lucide-react'
import { updatePassword, signOut } from 'firebase/auth'
import { auth, db } from '../lib/firebase'
import { collection, addDoc, onSnapshot, query, deleteDoc, doc, orderBy } from "firebase/firestore"

export default function ConfiguracoesMobile() {
  const [activeTab, setActiveTab] = useState('perfil')
  const [loading, setLoading] = useState(false)
  
  // Estados de Segurança
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmarSenha, setConfirmarSenha] = useState('')
  const [novoPin, setNovoPin] = useState('')
  
  // Estados de Vendedores
  const [vendedores, setVendedores] = useState<{id: string, nome: string}[]>([])
  const [novoVendedor, setNovoVendedor] = useState('')
  
  const [status, setStatus] = useState({ type: '', msg: '' })

  useEffect(() => {
    const savedPin = localStorage.getItem('master_pin') || '1234'
    setNovoPin(savedPin)

    const q = query(collection(db, "sellers"), orderBy("nome", "asc"));
    const unsub = onSnapshot(q, (snap) => {
      setVendedores(snap.docs.map(d => ({ id: d.id, nome: d.data().nome })));
    });
    return () => unsub();
  }, [])

  const handleAddVendedor = async () => {
    if (!novoVendedor.trim()) return;
    try {
      await addDoc(collection(db, "sellers"), { nome: novoVendedor.toUpperCase() });
      setNovoVendedor('');
    } catch (e) { alert("Erro ao cadastrar"); }
  }

  const handleUpdateSecurity = async () => {
    setStatus({ type: '', msg: '' }); 
    setLoading(true)
    try {
      if (novoPin.length !== 4) throw new Error('PIN deve ter 4 dígitos')
      localStorage.setItem('master_pin', novoPin)
      if (novaSenha) {
        if (novaSenha !== confirmarSenha) throw new Error('Senhas não coincidem')
        if (auth.currentUser) await updatePassword(auth.currentUser, novaSenha)
      }
      setStatus({ type: 'success', msg: 'Protocolos atualizados!' })
      setTimeout(() => setStatus({ type: '', msg: '' }), 3000)
    } catch (error: any) {
      setStatus({ type: 'error', msg: error.message })
    } finally { setLoading(false) }
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil', icon: <User size={16} /> },
    { id: 'vendedores', label: 'Equipe', icon: <Users size={16} /> },
    { id: 'seguranca', label: 'Segurança', icon: <Shield size={16} /> },
  ]

  return (
    <div className="w-full max-w-md mx-auto space-y-6 pb-32 px-4 pt-4 text-zinc-100 antialiased">
      
      {/* HEADER MOBILE */}
      <header className="flex justify-between items-center py-4">
        <div>
          <h2 className="text-xl font-black italic uppercase text-white tracking-tighter flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] shadow-[0_0_10px_#6CC551]" />
            Ajustes
          </h2>
          <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Painel de Controle</p>
        </div>
        <button 
          onClick={() => signOut(auth)} 
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 active:scale-95 transition-all"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* NAV TABS MOBILE (Scroll Horizontal) */}
      <nav className="flex gap-2 overflow-x-auto no-scrollbar pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all border ${
              activeTab === tab.id 
              ? 'bg-[#6CC551] text-black border-[#6CC551] shadow-lg shadow-[#6CC551]/20' 
              : 'bg-zinc-900/40 text-zinc-500 border-white/5'
            }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </nav>

      <main className="min-h-[400px]">
        {/* ABA PERFIL */}
        {activeTab === 'perfil' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-8 flex flex-col items-center text-center">
              <div className="relative mb-4">
                <div className="w-24 h-24 bg-zinc-950 border-2 border-[#6CC551]/20 rounded-[2rem] flex items-center justify-center">
                  <User size={40} className="text-zinc-800" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-[#6CC551] p-2 rounded-xl text-black shadow-lg">
                  <Hash size={14} />
                </div>
              </div>
              <span className="text-[9px] font-black text-[#6CC551] uppercase tracking-[0.4em] mb-1">Acesso Root</span>
              <h3 className="text-lg font-black italic text-white break-all">{auth.currentUser?.email}</h3>
            </div>
          </div>
        )}

        {/* ABA VENDEDORES */}
        {activeTab === 'vendedores' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2rem] p-4 space-y-4">
              <div className="flex flex-col gap-2">
                <input 
                  className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-white text-sm uppercase font-bold outline-none focus:border-[#6CC551]/50 transition-all"
                  placeholder="NOME DO VENDEDOR"
                  value={novoVendedor}
                  onChange={(e) => setNovoVendedor(e.target.value)}
                />
                <button 
                  onClick={handleAddVendedor} 
                  className="w-full bg-[#6CC551] text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest active:scale-[0.98] transition-all"
                >
                  Cadastrar na Equipe
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="text-[9px] font-black text-zinc-600 uppercase tracking-widest px-2">Equipe Ativa ({vendedores.length})</h4>
              {vendedores.map(v => (
                <div key={v.id} className="flex justify-between items-center bg-zinc-900/20 p-5 rounded-[1.5rem] border border-white/5 active:bg-zinc-900/40 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-[#6CC551]" />
                    <span className="text-xs font-black text-white uppercase italic tracking-wider">{v.nome}</span>
                  </div>
                  <button 
                    onClick={() => { if(confirm('Excluir vendedor?')) deleteDoc(doc(db, "sellers", v.id)) }} 
                    className="text-zinc-700 p-2 active:text-red-500"
                  >
                    <X size={18}/>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ABA SEGURANÇA */}
        {activeTab === 'seguranca' && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-zinc-900/30 border border-white/5 rounded-[2.5rem] p-6 space-y-6">
              
              <div className="space-y-2">
                <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">PIN de Fechamento (4 dígitos)</label>
                <div className="relative">
                  <Hash className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
                  <input
                    type="text" pattern="\d*" maxLength={4}
                    value={novoPin} 
                    onChange={(e) => setNovoPin(e.target.value.replace(/\D/g, ''))}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 pl-12 text-white text-lg tracking-[1em] font-black outline-none focus:border-[#6CC551]/50"
                  />
                </div>
              </div>

              <div className="space-y-4 pt-4 border-t border-white/5">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Nova Senha de Acesso</label>
                  <input
                    type="password"
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#6CC551]/50 font-bold"
                    placeholder="••••••••"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-500 uppercase tracking-widest px-1">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    value={confirmarSenha}
                    onChange={(e) => setConfirmarSenha(e.target.value)}
                    className="w-full bg-zinc-950 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-[#6CC551]/50 font-bold"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {status.msg && (
                <div className={`p-4 rounded-2xl text-[10px] font-black uppercase text-center ${
                  status.type === 'success' ? 'bg-[#6CC551]/10 text-[#6CC551]' : 'bg-red-500/10 text-red-500'
                }`}>
                  {status.msg}
                </div>
              )}

              <button 
                onClick={handleUpdateSecurity} 
                disabled={loading}
                className="w-full py-5 bg-white text-black rounded-[1.5rem] text-[11px] font-black uppercase tracking-[0.2em] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="animate-spin" size={16} /> : 'Salvar Protocolos'}
              </button>
            </div>
          </div>
        )}
      </main>

      {/* STYLE PARA REMOVER SCROLLBAR DA NAV */}
      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}