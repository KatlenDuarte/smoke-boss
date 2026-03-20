import { useState, useEffect, useMemo } from 'react'
import { 
  BarChart3, Calendar, DollarSign, TrendingUp, Package, 
  Filter, ChevronRight, PieChart, Loader2, FileDown,
  ArrowUpRight, Target, Clock, Trophy
} from 'lucide-react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

export default function Relatorios() {
  const { user } = useAuth()
  const [periodo, setPeriodo] = useState('hoje')
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user?.email) return
    setLoading(true)
    const q = query(
      collection(db, 'sales'),
      where('store', '==', user.email),
      orderBy('timestamp', 'desc')
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const dadosVendas = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }))
      setVendas(dadosVendas)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user?.email])

  const stats = useMemo(() => {
    const hoje = new Date().toLocaleDateString('pt-BR')
    const filtradas = vendas.filter(venda => {
      if (periodo === 'hoje') return venda.data === hoje
      if (periodo === 'mes') {
        const mesAtual = new Date().getMonth()
        const anoAtual = new Date().getFullYear()
        const dataVenda = venda.timestamp?.toDate() 
        return dataVenda?.getMonth() === mesAtual && dataVenda?.getFullYear() === anoAtual
      }
      return true
    })

    const faturamento = filtradas.reduce((acc, v) => acc + (v.total || 0), 0)
    const totalPedidos = filtradas.length
    const ticketMedio = totalPedidos > 0 ? faturamento / totalPedidos : 0
    
    const mapProdutos: Record<string, number> = {}
    filtradas.forEach(venda => {
      venda.items?.forEach((item: any) => {
        mapProdutos[item.nome] = (mapProdutos[item.nome] || 0) + item.qtd
      })
    })

    const ranking = Object.entries(mapProdutos)
      .map(([nome, qtd]) => ({ nome, qtd }))
      .sort((a, b) => b.qtd - a.qtd)
      .slice(0, 6)

    return { faturamento, totalPedidos, ticketMedio, ranking, filtradas }
  }, [vendas, periodo])

  const gerarPDF = () => {
    const doc = new jsPDF()
    const verdeBoss = [108, 197, 81]
    doc.setFillColor(5, 5, 5)
    doc.rect(0, 0, 210, 40, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.text('SMOKE BOSS - RELATÓRIO EXECUTIVO', 15, 25)
    doc.setFontSize(10)
    doc.setTextColor(verdeBoss[0], verdeBoss[1], verdeBoss[2])
    doc.text(`PERÍODO: ${periodo.toUpperCase()} | EMISSÃO: ${new Date().toLocaleString()}`, 15, 33)

    autoTable(doc, {
      startY: 45,
      head: [['Faturamento Total', 'Qtd Pedidos', 'Ticket Médio']],
      body: [[`R$ ${stats.faturamento.toFixed(2)}`, `${stats.totalPedidos}`, `R$ ${stats.ticketMedio.toFixed(2)}`]],
      theme: 'grid',
      headStyles: { fillColor: verdeBoss }
    })

    doc.save(`Relatorio_Boss_${periodo}.pdf`)
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#6CC551] animate-spin" size={32} />
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Gerando Inteligência</span>
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-28 px-4 text-zinc-100">
      
      {/* HEADER PADRÃO BOSS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
              Análise de Performance
            </h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80 italic">Relatórios e Métricas de Crescimento</p>
        </div>

        <button 
          onClick={gerarPDF}
          className="w-full md:w-auto flex items-center justify-center gap-3 bg-zinc-900/50 border border-white/5 text-white px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#6CC551] hover:text-black transition-all shadow-lg active:scale-95"
        >
          <FileDown size={18} /> Exportar Relatório
        </button>
      </header>

      {/* SELETOR DE PERÍODO (ESTILO TABS) */}
      <div className="flex bg-zinc-900/40 p-1.5 rounded-[1.5rem] border border-white/5 w-full md:w-fit backdrop-blur-md overflow-x-auto no-scrollbar">
        {['hoje', 'semana', 'mes', 'todos'].map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`flex-1 md:flex-none px-8 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
              periodo === p ? 'bg-[#6CC551] text-black shadow-lg shadow-[#6CC551]/10' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {p}
          </button>
        ))}
      </div>

      {/* CARDS DE RESUMO (PADRÃO DASHBOARD) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <ResumoCard 
          title="Faturamento" value={`R$ ${stats.faturamento.toLocaleString('pt-BR')}`} 
          icon={<DollarSign size={16}/>} trend="Total Bruto" color="#6CC551" 
        />
        <ResumoCard 
          title="Pedidos" value={stats.totalPedidos.toString()} 
          icon={<Package size={16}/>} trend="Vendas Concluídas" color="#3B82F6" 
        />
        <ResumoCard 
          title="Ticket Médio" value={`R$ ${stats.ticketMedio.toFixed(2)}`} 
          icon={<Target size={16}/>} trend="Média / Pedido" color="#A855F7" 
        />
        <ResumoCard 
          title="Projeção" value={`R$ ${(stats.faturamento * 1.15).toFixed(0)}`} 
          icon={<TrendingUp size={16}/>} trend="+15% Est." color="#FBBF24" 
        />
      </div>

      {/* DASHBOARD GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* RANKING DE PRODUTOS */}
        <div className="lg:col-span-8 bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] flex items-center gap-3">
              <Trophy size={16} className="text-[#6CC551]" /> Top 06 Mais Vendidos
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {stats.ranking.map((prod, i) => (
              <div key={i} className="group flex items-center gap-5 p-5 bg-zinc-950/40 border border-white/5 rounded-2xl hover:bg-zinc-900/50 transition-all border-l-2 border-l-transparent hover:border-l-[#6CC551]">
                <span className="text-2xl font-black italic text-zinc-800 group-hover:text-[#6CC551]/20 transition-all">0{i+1}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-white uppercase italic tracking-tighter truncate mb-2">{prod.nome}</p>
                  <div className="w-full bg-zinc-900 h-1.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className="bg-[#6CC551] h-full rounded-full transition-all duration-1000" 
                      style={{ width: `${(prod.qtd / stats.ranking[0].qtd) * 100}%` }}
                    />
                  </div>
                </div>
                <div className="text-right">
                   <span className="text-sm font-black italic text-white block">{prod.qtd}</span>
                   <span className="text-[7px] font-black text-zinc-600 uppercase">Unidades</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* FECHAMENTO DE CAIXA RÁPIDO */}
        <div className="lg:col-span-4 bg-zinc-900/40 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-between shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
             <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-8">DRE Simplificado</h3>
             <div className="space-y-6">
                <div className="flex justify-between items-center group/item">
                  <span className="text-[10px] font-black text-zinc-600 uppercase italic tracking-widest">Receita Bruta</span>
                  <span className="text-sm font-black text-white italic">R$ {stats.faturamento.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-600 uppercase italic tracking-widest">Deduções</span>
                  <span className="text-sm font-black text-red-500/40 italic">R$ 0,00</span>
                </div>
                <div className="h-px bg-white/5 w-full" />
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-zinc-600 uppercase italic tracking-widest">Ticket Médio</span>
                  <span className="text-sm font-black text-blue-400 italic">R$ {stats.ticketMedio.toFixed(2)}</span>
                </div>
             </div>
          </div>

          <div className="mt-12 pt-8 border-t border-white/10 relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-1 h-1 rounded-full bg-[#6CC551]" />
              <p className="text-[9px] font-black text-[#6CC551] uppercase tracking-[0.4em]">Resultado Líquido</p>
            </div>
            <p className="text-4xl font-[1000] italic text-white tracking-tighter leading-none group-hover:scale-105 transition-transform origin-left">
              R$ {stats.faturamento.toLocaleString('pt-BR')}
            </p>
          </div>
          
          {/* Decoração de fundo sutil */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#6CC551]/5 blur-[80px] rounded-full" />
        </div>
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

function ResumoCard({ title, value, icon, color, trend }: any) {
  return (
    <div className="bg-zinc-900/40 p-6 rounded-[2rem] border border-white/5 shadow-xl relative overflow-hidden group transition-all hover:border-white/10">
      <div className="flex justify-between items-start mb-6">
        <div className="p-3 bg-zinc-950 rounded-2xl border border-white/5 shadow-inner transition-transform group-hover:scale-110" style={{ color }}>
          {icon}
        </div>
        <div className="flex items-center gap-1 px-2 py-1 bg-white/5 rounded-lg border border-white/5">
          <ArrowUpRight size={10} style={{ color }} />
          <span className="text-[8px] font-black text-white uppercase italic">{trend}</span>
        </div>
      </div>
      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1 opacity-70 italic">{title}</span>
      <div className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none truncate">{value}</div>
      <div className="absolute -bottom-4 -right-4 w-16 h-16 opacity-[0.03] blur-2xl rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}