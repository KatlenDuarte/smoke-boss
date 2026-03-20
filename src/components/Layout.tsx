import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  FileText, LogOut, User, Menu, X, Settings
} from 'lucide-react'
import { auth } from '../lib/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  
  const { user, isAdmin, loading } = useAuth()

  const handleLogout = async () => {
    try {
      await signOut(auth)
      navigate('/login')
    } catch (error) {
      console.error("Erro ao deslogar:", error)
    }
  }

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'DASHBOARD' },
    { path: '/estoque', icon: Package, label: 'ESTOQUE' },
    { path: '/pdv', icon: ShoppingCart, label: 'PDV' },
    { path: '/financeiro', icon: DollarSign, label: 'FINANCEIRO', adminOnly: true },
    { path: '/relatorios', icon: FileText, label: 'RELATÓRIOS', adminOnly: true },
    { path: '/configuracoes', icon: Settings, label: 'CONFIGURAÇÕES', adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#050505] flex items-center justify-center z-[100]">
        <div className="w-10 h-10 border-4 border-[#6CC551]/20 border-t-[#6CC551] rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row text-white/80 font-sans selection:bg-[#6CC551]/30 overflow-hidden">
      
      {/* --- HEADER MOBILE (Fixo no topo) --- */}
      <header className="md:hidden bg-[#050505] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-[60] h-16">
        <Link to="/dashboard" className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="Smoke Boss Logo" 
            className="w-8 h-8 object-contain brightness-110 drop-shadow-[0_0_8px_rgba(108,197,81,0.3)]" 
          />
          <h1 className="text-lg font-black italic tracking-tighter text-white uppercase leading-none">
            Smoke<span className="text-[#6CC551]">Boss</span>
          </h1>
        </Link>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-2 text-[#6CC551] bg-[#6CC551]/5 rounded-xl border border-[#6CC551]/20 transition-transform active:scale-90"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </header>

      {/* --- SIDEBAR (RESPONSIVA) --- */}
      <aside className={`
        fixed inset-0 z-[70] bg-[#050505] transform transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] flex flex-col
        md:relative md:inset-auto md:translate-x-0 md:w-64 md:border-r md:border-white/5 md:opacity-100
        ${isMobileMenuOpen ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 md:translate-y-0'}
      `}>
        
        {/* LOGO DESKTOP & FECHAR MOBILE */}
        <div className="p-8 border-b border-white/5 mb-6 flex items-center justify-between">
          <Link to="/dashboard" className="flex items-center gap-4 group">
            <div className="relative">
              <img 
                src="/logo.png" 
                alt="Logo" 
                className="w-10 h-10 object-contain group-hover:scale-110 transition-transform duration-500 brightness-125" 
              />
              <div className="absolute inset-0 bg-[#6CC551]/20 blur-xl rounded-full -z-10 opacity-50 group-hover:opacity-100 transition-opacity" />
            </div>
            
            <h1 className="text-xl font-black italic tracking-tighter text-white uppercase leading-none">
              Smoke<span className="text-[#6CC551]">Boss</span>
            </h1>
          </Link>

          {/* Botão fechar apenas no Mobile */}
          <button onClick={() => setIsMobileMenuOpen(false)} className="md:hidden text-zinc-500">
            <X size={28} />
          </button>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-6 md:px-4 space-y-2 overflow-y-auto custom-scrollbar">
          <p className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.4em] mb-4 px-4 font-mono">Principal</p>
          
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                  isActive
                    ? 'bg-[#6CC551]/10 text-white border border-[#6CC551]/20 shadow-[0_0_20px_rgba(108,197,81,0.05)]'
                    : 'text-zinc-500 hover:text-white hover:bg-white/5'
                }`}
              >
                <Icon size={20} className={isActive ? 'text-[#6CC551]' : ''} />
                <span className={`text-[11px] md:text-xs tracking-widest uppercase ${isActive ? 'font-black italic' : 'font-bold'}`}>
                  {item.label}
                </span>
                {isActive && <div className="ml-auto w-1 h-1 bg-[#6CC551] rounded-full shadow-[0_0_8px_#6CC551]" />}
              </Link>
            )
          })}
        </nav>

        {/* PERFIL RODAPÉ */}
        <div className="p-6 md:p-4 mt-auto border-t border-white/5 bg-[#080808]/50">
          <div className="bg-zinc-900/40 rounded-3xl p-4 border border-white/5">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#050505] border border-white/10 rounded-2xl flex items-center justify-center text-[#6CC551] shrink-0">
                <User size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black text-white truncate uppercase italic">
                  {user?.userName || 'Boss Admin'}
                </p>
                <p className="text-[8px] text-[#6CC551] font-bold uppercase tracking-widest">
                  {isAdmin ? 'Diretoria' : 'Colaborador'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-black text-[9px] uppercase border border-white/5"
            >
              <LogOut size={14} />
              <span>Sair do Sistema</span>
            </button>
          </div>
        </div>
      </aside>

      {/* --- CONTEÚDO --- */}
      <main className="flex-1 h-[calc(100vh-64px)] md:h-screen overflow-y-auto custom-scrollbar bg-[#050505]">
        <div className="max-w-[1600px] mx-auto p-4 md:p-10 lg:p-12">
          <Outlet />
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 10px; }
      `}</style>
    </div>
  )
}