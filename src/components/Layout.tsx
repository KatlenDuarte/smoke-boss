import { useState } from 'react'
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom'
import { 
  LayoutDashboard, Package, ShoppingCart, DollarSign, 
  FileText, LogOut, User, Menu, X, Settings
} from 'lucide-react'

// IMPORTAÇÃO DA LOGO
import logoImg from '../pages/logo.png' 

import { auth } from '../lib/firebase'
import { signOut } from 'firebase/auth'
import { useAuth } from '../hooks/useAuth'

export default function Layout() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, isAdmin, loading } = useAuth()

  const handleLogout = async () => {
    if (confirm('Deseja encerrar a sessão de segurança?')) {
      await signOut(auth)
      navigate('/login')
    }
  }

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Painel Geral' },
    { path: '/estoque', icon: Package, label: 'Estoque' },
    { path: '/pdv', icon: ShoppingCart, label: 'Frente de Caixa' },
    { path: '/comandas', icon: FileText, label: 'Comandas' },
    { path: '/financeiro', icon: DollarSign, label: 'Financeiro', adminOnly: true },
    { path: '/relatorios', icon: FileText, label: 'Relatórios', adminOnly: true },
    { path: '/configuracoes', icon: Settings, label: 'Configurações', adminOnly: true },
  ]

  const filteredMenuItems = menuItems.filter(item => !item.adminOnly || isAdmin)

  if (loading) return (
    <div className="fixed inset-0 bg-[#050505] flex flex-col items-center justify-center z-[100] gap-4">
      <div className="w-8 h-8 border-2 border-[#6CC551]/10 border-t-[#6CC551] rounded-full animate-spin" />
      <span className="text-[8px] font-black uppercase tracking-[0.5em] text-zinc-700">Iniciando Protocolos</span>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#050505] flex flex-col md:flex-row text-zinc-400 selection:bg-[#6CC551]/30 overflow-hidden antialiased font-sans">
      
      {/* HEADER MOBILE - AJUSTADO PARA LOGO HORIZONTAL */}
      <header className="md:hidden bg-[#080808] border-b border-white/5 px-6 py-4 flex justify-between items-center sticky top-0 z-[60] min-h-[85px] backdrop-blur-md">
        <Link to="/dashboard" className="flex items-center">
          <img 
            src={logoImg} 
            alt="Logo Boss" 
            className="w-40 h-auto object-contain brightness-125 drop-shadow-[0_0_15px_rgba(108,197,81,0.4)] block" 
          />
        </Link>
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
          className="p-3 text-[#6CC551] bg-[#6CC551]/5 rounded-xl border border-[#6CC551]/10 active:scale-95 transition-transform"
        >
          {isMobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
        </button>
      </header>

      {/* SIDEBAR */}
      <aside className={`
        fixed inset-0 z-[70] bg-[#050505] transition-all duration-500 ease-in-out flex flex-col
        md:relative md:inset-auto md:translate-x-0 md:w-64 md:border-r md:border-white/5
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        
        {/* LOGO DESKTOP - AJUSTADA PARA SER MAIOR E HORIZONTAL */}
        <div className="hidden md:block border-b border-white/5 mb-6">
          <Link to="/dashboard" className="flex justify-center p-10 group">
            <div className="relative shrink-0 flex items-center justify-center">
              <img 
                src={logoImg} 
                alt="Boss Logo" 
                className="w-48 h-auto object-contain group-hover:scale-105 transition-transform duration-500 brightness-125" 
              />
              <div className="absolute inset-0 bg-[#6CC551]/15 blur-2xl rounded-full -z-10 opacity-40 group-hover:opacity-80 transition-opacity" />
            </div>
          </Link>
        </div>

        {/* NAVEGAÇÃO */}
        <nav className="flex-1 px-4 space-y-1 mt-4 md:mt-0 custom-scrollbar overflow-y-auto">
          <p className="text-[7px] font-black text-zinc-800 uppercase tracking-[0.6em] mb-4 px-4 font-mono">Menu do Sistema</p>
          
          {filteredMenuItems.map((item) => {
            const Icon = item.icon
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/')
            
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setIsMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all group ${
                  isActive
                    ? 'bg-[#6CC551]/5 text-white border border-[#6CC551]/10 shadow-[0_0_15px_rgba(108,197,81,0.03)]'
                    : 'hover:text-zinc-200 hover:bg-white/5'
                }`}
              >
                <Icon size={16} className={isActive ? 'text-[#6CC551]' : 'text-zinc-700 group-hover:text-zinc-400'} />
                <span className={`text-[10px] tracking-[0.1em] uppercase ${isActive ? 'font-black italic' : 'font-bold'}`}>
                  {item.label}
                </span>
                {isActive && <div className="ml-auto w-1 h-1 bg-[#6CC551] rounded-full shadow-[0_0_8px_#6CC551]" />}
              </Link>
            )
          })}
        </nav>

        {/* RODAPÉ DO PERFIL */}
        <div className="p-4 mt-auto border-t border-white/5 bg-[#080808]/50">
          <div className="bg-zinc-900/40 border border-white/5 rounded-2xl p-4 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-950 border border-white/10 rounded-lg flex items-center justify-center text-zinc-600 shadow-inner">
                <User size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-white truncate uppercase italic">{user?.userName || 'Operador'}</p>
                <p className="text-[7px] text-[#6CC551] font-black uppercase tracking-widest opacity-60">
                  {isAdmin ? 'Diretoria' : 'Colaborador'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-zinc-700 hover:text-red-500 hover:bg-red-500/5 transition-all font-black text-[8px] uppercase border border-white/5 tracking-tighter"
            >
              <LogOut size={12} /> Sair do Sistema
            </button>
          </div>
        </div>
      </aside>

      <main className="flex-1 h-[calc(100vh-85px)] md:h-screen overflow-y-auto custom-scrollbar bg-[#050505]">
        <div className="max-w-[1400px] mx-auto p-4 md:p-8 lg:p-10">
          <Outlet />
        </div>
      </main>
    </div>
  )
}