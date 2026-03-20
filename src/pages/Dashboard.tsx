import { useState, useEffect, useMemo } from 'react'
import { 
  TrendingUp, AlertTriangle, X, DollarSign, 
  ChevronRight, Calendar, Package, ShoppingBag, 
  Receipt, Loader2, ArrowUpRight, CreditCard, Wallet
} from 'lucide-react'
import { collection, query, where, onSnapshot, limit } from 'firebase/firestore'
import { db } from '../lib/firebase'

interface DashboardProps {
  storeEmail: string;
}

export default function Dashboard({ storeEmail }: DashboardProps) {
  const [dateValue, setDateValue] = useState(new Date().toISOString().split('T')[0])
  const [selectedSale, setSelectedSale] = useState<any>(null)
  const [salesHistory, setSalesHistory] = useState<any[]>([])
  const [criticalItems, setCriticalItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [metrics, setMetrics] = useState({ total: 0, ticket: 0, count: 0, alerts: 0 })

  const dateFilter = useMemo(() => {
    const [year, month, day] = dateValue.split('-')
    return `${day}/${month}/${year}`
  }, [dateValue])

  useEffect(() => {
    if (!storeEmail) return
    setLoading(true)
    const q = query(collection(db, "sales"), where("store", "==", storeEmail))

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData: any[] = []
      let totalDia = 0
      snapshot.forEach((doc) => {
        const d = doc.data()
        if (d.data === dateFilter) {
          const sale = {
            id: doc.id,
            ...d,
            total: Number(d.total || 0),
            hora: d.hora || "--:--",
            metodoPagamento: (d.metodoPagamento || "PIX").toUpperCase()
          }
          salesData.push(sale)
          totalDia += sale.total
        }
      })
      const sorted = salesData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      setSalesHistory(sorted)
      const count = sorted.length
      setMetrics(prev => ({
        ...prev,
        total: totalDia,
        count: count,
        ticket: count > 0 ? totalDia / count : 0
      }))
      setLoading(false)
    }, (error) => {
      console.error("ERRO DASHBOARD:", error)
      setLoading(false)
    })
    return () => unsubscribe()
  }, [dateFilter, storeEmail])

  useEffect(() => {
    if (!storeEmail) return
    const qEstoque = query(
      collection(db, "produtos"),
      where("store", "==", storeEmail),
      where("estoque", "<=", 5),
      limit(5)
    )
    return onSnapshot(qEstoque, (snap) => {
      const items = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setCriticalItems(items)
      setMetrics(prev => ({ ...prev, alerts: items.length }))
    })
  }, [storeEmail])

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4 text-zinc-100">
      
      {/* HEADER RESPONSIVO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Visão Geral</h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80">{storeEmail}</p>
        </div>

        <div className="w-full md:w-auto group relative flex items-center bg-zinc-900/50 border border-white/10 rounded-2xl p-1 pr-4 hover:border-[#6CC551]/50 transition-all duration-300">
          <div className="p-2 bg-[#6CC551]/10 rounded-xl text-[#6CC551] mr-3">
            <Calendar size={18} />
          </div>
          <input 
            type="date" 
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="bg-transparent text-xs font-black uppercase outline-none cursor-pointer flex-1 md:flex-none"
          />
        </div>
      </header>

      {/* MÉTRICAS GRID: 2 COLUNAS NO MOBILE, 4 NO DESKTOP */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard 
          label="Total" 
          value={metrics.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<DollarSign size={16}/>} 
          trend="+12%" 
          color="#6CC551"
        />
        <MetricCard 
          label="Média" 
          value={metrics.ticket.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
          icon={<TrendingUp size={16}/>} 
          trend="Estável"
          color="#32C5C5"
        />
        <MetricCard 
          label="Pedidos" 
          value={metrics.count.toString()} 
          icon={<ShoppingBag size={16}/>} 
          trend="Hoje"
          color="#A1A1AA"
        />
        <MetricCard 
          label="Alertas" 
          value={metrics.alerts.toString()} 
          icon={<AlertTriangle size={16}/>} 
          trend="Crítico"
          color="#EF4444"
          isAlert={metrics.alerts > 0}
        />
      </section>

      <div className="grid grid-cols-12 gap-6 md:gap-8">
        {/* LISTA DE VENDAS */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          <div className="flex items-center justify-between px-2">
             <h3 className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2">
               <Receipt size={14} className="text-[#6CC551]" /> Movimentações
             </h3>
          </div>
          
          <div className="bg-zinc-900/30 backdrop-blur-md rounded-[2rem] border border-white/5 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-32 md:py-40 gap-4">
                <Loader2 className="animate-spin text-[#6CC551]" size={32} />
                <span className="text-[10px] font-black uppercase text-zinc-500">Sincronizando...</span>
              </div>
            ) : salesHistory.length > 0 ? (
              <div className="divide-y divide-white/[0.03]">
                {salesHistory.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} onClick={() => setSelectedSale(sale)} />
                ))}
              </div>
            ) : (
              <div className="py-32 md:py-40 flex flex-col items-center justify-center opacity-20 text-center">
                <ShoppingBag size={40} className="mb-4" />
                <p className="font-black uppercase text-[10px] tracking-[0.2em]">Sem registros hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR: ESTOQUE E INSIGHTS */}
        <div className="col-span-12 lg:col-span-4 space-y-6">
          <div className="space-y-4">
            <h3 className="text-[10px] md:text-[11px] font-black text-zinc-400 uppercase tracking-widest flex items-center gap-2 px-2">
              <Package size={14} className="text-red-500" /> Estoque Crítico
            </h3>
            <div className="grid grid-cols-1 gap-2 bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/10 rounded-[2rem] p-2">
              {criticalItems.length > 0 ? criticalItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-4 bg-zinc-900/40 rounded-2xl border border-white/[0.02]">
                  <div className="flex flex-col max-w-[70%]">
                    <span className="text-[10px] md:text-[11px] font-black uppercase italic text-zinc-200 truncate">{item.nome}</span>
                    <span className="text-[8px] text-zinc-500 font-bold uppercase">Repor agora</span>
                  </div>
                  <div className="px-3 py-1 bg-red-500/10 rounded-lg border border-red-500/20">
                    <span className="text-[10px] font-black text-red-500">{item.estoque} UN</span>
                  </div>
                </div>
              )) : (
                <div className="p-8 text-center text-[9px] font-black text-zinc-600 uppercase italic">Tudo em dia</div>
              )}
            </div>
          </div>

          <div className="p-6 bg-[#6CC551] rounded-[2rem] text-black relative overflow-hidden group shadow-lg shadow-[#6CC551]/10">
            <div className="relative z-10">
              <p className="text-[9px] font-black uppercase mb-1 opacity-70">Aviso</p>
              <h4 className="text-lg font-black italic uppercase leading-none">Ticket Médio</h4>
              <p className="text-[10px] font-bold mt-2 leading-relaxed opacity-90">Considere criar combos para itens parados no estoque.</p>
            </div>
            <TrendingUp size={60} className="absolute -bottom-2 -right-2 opacity-10" />
          </div>
        </div>
      </div>

      {/* MODAL RESPONSIVO (VIRA DRAWER NO MOBILE) */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setSelectedSale(null)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in duration-300" />
          <div 
            className="relative bg-[#0D0D0D] w-full max-w-md rounded-t-[2.5rem] md:rounded-[2.5rem] border-t md:border border-white/10 p-6 md:p-8 shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300" 
            onClick={e => e.stopPropagation()}
          >
            {/* Handle visual para Mobile */}
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
            
            <div className="flex justify-between items-center mb-6">
                <div>
                  <h4 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">Detalhes</h4>
                  <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-widest">#{selectedSale.id.slice(-6)}</p>
                </div>
                <button onClick={() => setSelectedSale(null)} className="p-2 bg-white/5 rounded-full text-zinc-400">
                  <X size={18} />
                </button>
            </div>
            
            <div className="space-y-2 mb-6 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
              {selectedSale.items?.map((it: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/[0.03]">
                  <span className="text-[10px] font-black uppercase italic truncate pr-4">{it.nome}</span>
                  <span className="text-[10px] font-black text-[#6CC551] whitespace-nowrap">{it.qtd} UN</span>
                </div>
              ))}
            </div>

            <div className="p-6 bg-zinc-900/50 rounded-3xl border border-white/5 text-center">
               <p className="text-[10px] text-zinc-500 font-black uppercase mb-1">Total Pago</p>
               <p className="text-3xl font-black italic text-white leading-none mb-4">R$ {selectedSale.total.toFixed(2)}</p>
               <div className="flex items-center justify-center gap-2">
                 <span className="px-3 py-1 bg-[#6CC551]/10 border border-[#6CC551]/20 rounded-full text-[9px] font-black text-[#6CC551] uppercase">
                   {selectedSale.metodoPagamento}
                 </span>
                 <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-zinc-400 uppercase">
                   {selectedSale.hora}
                 </span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon, trend, color, isAlert }: any) {
  return (
    <div className={`relative bg-zinc-900/40 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border ${isAlert ? 'border-red-500/30' : 'border-white/5'} overflow-hidden`}>
      <div className="flex justify-between items-start mb-3 md:mb-4 relative z-10">
        <div className="p-2 rounded-xl bg-zinc-950 border border-white/5" style={{ color: color }}>
          {icon}
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/5">
          <span className="text-[7px] md:text-[8px] font-black uppercase" style={{ color: color }}>{trend}</span>
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-0.5">{label}</span>
        <div className="text-lg md:text-2xl font-black text-white italic tracking-tighter truncate">{value}</div>
      </div>
    </div>
  )
}

function SaleRow({ sale, onClick }: any) {
  const isPix = sale.metodoPagamento === 'PIX'
  return (
    <div onClick={onClick} className="flex justify-between items-center p-4 md:p-5 hover:bg-white/[0.03] active:bg-white/[0.05] cursor-pointer transition-all">
      <div className="flex items-center gap-3 md:gap-4">
        <div className={`p-2.5 rounded-xl ${isPix ? 'bg-teal-500/10 text-teal-500' : 'bg-blue-500/10 text-blue-500'} border border-white/5`}>
          {isPix ? <Wallet size={16} /> : <CreditCard size={16} />}
        </div>
        <div className="max-w-[120px] md:max-w-none">
          <p className="text-[10px] md:text-xs font-black uppercase italic truncate">#{sale.id.slice(-4)}</p>
          <p className="text-[7px] md:text-[8px] text-zinc-600 font-bold uppercase">{sale.hora} • {sale.metodoPagamento}</p>
        </div>
      </div>
      <div className="text-right flex items-center gap-3 md:gap-4">
        <div>
          <p className="text-xs md:text-sm font-black italic">R$ {sale.total.toFixed(2)}</p>
          <p className="text-[7px] text-[#6CC551] font-black uppercase">Ok</p>
        </div>
        <ChevronRight size={14} className="text-zinc-800" />
      </div>
    </div>
  )
}