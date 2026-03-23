import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'

// IMPORTAÇÃO DAS PÁGINAS E COMPONENTES
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import PDV from './pages/pdv'
import Financeiro from './pages/Financeiro'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import Comandas from './pages/Comandas' // Certifique-se de criar este arquivo
import PinGuard from './components/PinGuard'

// COMPONENTE DE ROTA PROTEGIDA (FIREBASE AUTH)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-[#6CC551]/20 border-t-[#6CC551] rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!isAuthenticated) return <Navigate replace to="/login" />
  return <>{children}</>
}

export default function App() {
  const { user, loading, isAuthenticated } = useAuth()

  // LÓGICA DO PIN DINÂMICO PARA ÁREAS RESTRITAS
  const masterPin = localStorage.getItem('master_pin') || "1234"

  if (loading) return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-[#6CC551]/20 border-t-[#6CC551] rounded-full animate-spin"></div>
    </div>
  )

  const storeEmail = user?.email || ""

  return (
    <Routes>
      {/* ROTA PÚBLICA: LOGIN */}
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      {/* ROTAS PROTEGIDAS PELO LAYOUT E AUTH */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        {/* REDIRECIONAMENTO INICIAL */}
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* --- ROTA DE COMANDAS (SEM PIN) --- */}
        <Route path="comandas" element={<Comandas storeEmail={storeEmail} />} />

        {/* --- ROTA DE PDV (SEM PIN) --- */}
        <Route path="pdv" element={<PDV storeEmail={storeEmail} />} />

        {/* --- ROTAS COM PROTEÇÃO DE PIN (PIN GUARD) --- */}
        <Route path="dashboard" element={
          <PinGuard correctPin={masterPin} title="Dashboard">
            <Dashboard storeEmail={storeEmail} />
          </PinGuard>
        } />

        <Route path="estoque" element={
          <PinGuard correctPin={masterPin} title="Estoque">
            <Estoque storeEmail={storeEmail} />
          </PinGuard>
        } />

        <Route path="relatorios" element={
          <PinGuard correctPin={masterPin} title="Relatórios">
            <Relatorios />
          </PinGuard>
        } />

        <Route path="configuracoes" element={
          <PinGuard correctPin={masterPin} title="Ajustes do Sistema">
            <Configuracoes />
          </PinGuard>
        } />

        {/* FINANCEIRO GERALMENTE É RESTRITO AO ADMIN NO LAYOUT */}
        <Route path="financeiro" element={
          <PinGuard correctPin={masterPin} title="Financeiro">
            <Financeiro />
          </PinGuard>
        } />
      </Route>

      {/* FALLBACK PARA QUALQUER ROTA INEXISTENTE */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}