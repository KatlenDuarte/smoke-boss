import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { useEffect, useState } from 'react' // Adicionado hooks

// IMPORTAÇÃO DAS PÁGINAS
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Estoque from './pages/Estoque'
import PDV from './pages/pdv'
import Financeiro from './pages/Financeiro'
import Relatorios from './pages/Relatorios'
import Configuracoes from './pages/Configuracoes'
import Login from './pages/Login'
import PinGuard from './components/PinGuard'

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

  // LÓGICA DO PIN DINÂMICO
  // Ele tenta buscar 'master_pin' do localStorage. Se não existir, usa "1234".
  const masterPin = localStorage.getItem('master_pin') || "1234"

  if (loading) return null

  const storeEmail = user?.email || ""

  return (
    <Routes>
      <Route
        path="/login"
        element={isAuthenticated ? <Navigate to="/dashboard" replace /> : <Login />}
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Usando o masterPin dinâmico em todas as rotas protegidas */}
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

        <Route path="pdv" element={<PDV storeEmail={storeEmail} />} />
        <Route path="financeiro" element={<Financeiro />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}