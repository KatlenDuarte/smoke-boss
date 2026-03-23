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
  const [showValues, setShowValues] = useState(true) // Controle de privacidade apenas para os cards

  const dateFilter = useMemo(() => {
    const [year, month, day] = dateValue.split('-')
    return `${day}/${month}/${year}`
  }, [dateValue])

  useEffect(() => {
    if (!storeEmail) return
    setLoading(true)

    const q = query(
      collection(db, "sales"), 
      where("store", "==", storeEmail),
      where("data", "==", dateFilter)
    )

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const salesData: any[] = []
      let totalDia = 0
      
      snapshot.forEach((doc) => {
        const d = doc.data()
        const sale = {
          id: doc.id,
          ...d,
          total: Number(d.total || 0),
          hora: d.hora || "--:--",
          metodoPagamento: (d.metodoPagamento || "PIX").toUpperCase()
        }
        salesData.push(sale)
        totalDia += sale.total
      })

      const sorted = salesData.sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
      setSalesHistory(sorted)
      
      const count = sorted.length
      setMetrics(prev => ({
        ...prev,
        total: totalDia,
        count: count,
        ticket: count > 0 ? totalDia / count : 0,
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
      collection(db, "products"), // Corrigido para "products" conforme seu padrão anterior
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
    // Padding lateral reduzido para px-2
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-24 px-2 text-zinc-100 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Visão <span className="text-[#6CC551]">Geral</span></h2>
          </div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">{storeEmail}</p>
        </div>

        <div className="w-full md:w-auto relative flex items-center bg-zinc-900 border border-white/5 rounded-xl px-3 py-2 gap-3">
          <Calendar size={14} className="text-[#6CC551]" />
          {/* text-base para evitar zoom no iOS */}
          <input 
            type="date" 
            value={dateValue}
            onChange={(e) => setDateValue(e.target.value)}
            className="bg-transparent text-base md:text-[10px] font-black uppercase outline-none cursor-pointer text-white"
          />
        </div>
      </header>

      {/* MÉTRICAS (Blur apenas aqui) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard label="Faturamento" value={metrics.total} blur={!showValues} icon={<DollarSign size={14}/>} color="#6CC551" />
        <MetricCard label="Ticket Médio" value={metrics.ticket} blur={!showValues} icon={<TrendingUp size={14}/>} color="#32C5C5" />
        <MetricCard label="Vendas" value={metrics.count} icon={<ShoppingBag size={14}/>} color="#A1A1AA" />
        <MetricCard 
          label="Reposição" 
          value={metrics.alerts} 
          icon={<AlertTriangle size={14}/>} 
          color={metrics.alerts > 0 ? "#EF4444" : "#A1A1AA"} 
          isAlert={metrics.alerts > 0}
        />
      </section>

      <div className="grid grid-cols-12 gap-5">
        {/* LISTA DE MOVIMENTAÇÕES (Sempre nítida) */}
        <div className="col-span-12 lg:col-span-8 space-y-3">
          <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
            <Receipt size={12} className="text-[#6CC551]" /> Últimos Registros
          </h3>
          
          <div className="bg-zinc-900/30 rounded-[1.5rem] border border-white/5 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3">
                <Loader2 className="animate-spin text-[#6CC551]" size={24} />
                <span className="text-[8px] font-black uppercase text-zinc-700">Sincronizando...</span>
              </div>
            ) : salesHistory.length > 0 ? (
              <div className="divide-y divide-white/[0.03]">
                {salesHistory.map((sale) => (
                  <SaleRow key={sale.id} sale={sale} onClick={() => setSelectedSale(sale)} />
                ))}
              </div>
            ) : (
              <div className="py-24 flex flex-col items-center justify-center opacity-20 text-center">
                <ShoppingBag size={32} className="mb-3" />
                <p className="font-black uppercase text-[8px] tracking-widest">Sem registros hoje</p>
              </div>
            )}
          </div>
        </div>

        {/* SIDEBAR */}
        <div className="col-span-12 lg:col-span-4 space-y-5">
          <div className="space-y-3">
            <h3 className="text-[9px] font-black text-zinc-600 uppercase tracking-[0.2em] flex items-center gap-2 px-1">
              <Package size={12} className="text-red-500" /> Alerta de Estoque
            </h3>
            <div className="grid grid-cols-1 gap-1.5 bg-red-500/5 border border-red-500/10 rounded-2xl p-1.5">
              {criticalItems.length > 0 ? criticalItems.map((item: any) => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-zinc-900/60 rounded-xl border border-white/[0.02]">
                  <div className="max-w-[70%]">
                    <p className="text-[10px] font-black uppercase italic text-white truncate">{item.nome}</p>
                    <p className="text-[7px] text-zinc-600 font-bold uppercase">Urgente</p>
                  </div>
                  <div className="px-2 py-1 bg-red-500/10 rounded-lg border border-red-500/10">
                    <span className="text-[9px] font-black text-red-500">{item.estoque} UN</span>
                  </div>
                </div>
              )) : (
                <div className="p-10 text-center text-[8px] font-black text-zinc-700 uppercase italic">Estoque saudável</div>
              )}
            </div>
          </div>

          <div className="p-5 bg-[#6CC551] rounded-[1.5rem] text-black relative overflow-hidden group">
            <div className="relative z-10">
              <p className="text-[8px] font-black uppercase mb-1 opacity-60">Insights</p>
              <h4 className="text-base font-black italic uppercase leading-tight">Sugestão de Combo</h4>
              <p className="text-[9px] font-bold mt-2 leading-relaxed opacity-80">Misture itens com baixa saída para aumentar seu ticket hoje.</p>
            </div>
            <TrendingUp size={40} className="absolute -bottom-2 -right-2 opacity-10" />
          </div>
        </div>
      </div>

      {/* MODAL DETALHES */}
      {selectedSale && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center" onClick={() => setSelectedSale(null)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in" />
          <div 
            className="relative bg-[#0D0D0D] w-full max-w-md rounded-t-[2rem] md:rounded-[2rem] border-t md:border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
            
            <div className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black italic uppercase text-white">Cupom Digital</h4>
                <p className="text-[8px] text-[#6CC551] font-black uppercase tracking-widest mt-1">Ref: {selectedSale.id.slice(-6)}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="p-2 bg-white/5 rounded-full text-zinc-500">
                <X size={16} />
              </button>
            </div>
            
            <div className="space-y-1.5 mb-6">
              {selectedSale.items?.map((it: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-3 bg-white/5 rounded-xl border border-white/[0.03]">
                  <span className="text-[10px] font-black uppercase italic text-zinc-300">{it.nome}</span>
                  <span className="text-[10px] font-black text-[#6CC551]">{it.qtd}x</span>
                </div>
              ))}
            </div>

            <div className="p-5 bg-zinc-950 rounded-2xl border border-white/5 text-center">
               <p className="text-[8px] text-zinc-600 font-black uppercase mb-1 tracking-widest">Valor Liquidado</p>
               <p className="text-2xl font-black italic text-white tracking-tighter">R$ {selectedSale.total.toFixed(2)}</p>
               <div className="flex items-center justify-center gap-2 mt-4">
                 <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[8px] font-black text-zinc-400 uppercase border border-white/5">{selectedSale.metodoPagamento}</span>
                 <span className="px-3 py-1 bg-zinc-900 rounded-lg text-[8px] font-black text-zinc-400 uppercase border border-white/5">{selectedSale.hora}</span>
               </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, icon, color, isAlert, blur }: any) {
  return (
    <div className={`bg-zinc-900 border p-3.5 rounded-xl transition-all ${isAlert ? 'border-red-500/30' : 'border-white/5'}`}>
      <div className="flex justify-between items-center mb-1">
        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className={`text-base font-black italic text-white tracking-tighter ${blur ? 'blur-md select-none' : ''}`}>
        {typeof value === 'number' && label !== 'Vendas' && label !== 'Reposição' 
          ? `R$ ${value.toFixed(2)}` 
          : value}
      </h3>
    </div>
  )
}

function SaleRow({ sale, onClick }: any) {
  const isPix = sale.metodoPagamento === 'PIX'
  return (
    <div onClick={onClick} className="flex justify-between items-center p-4 hover:bg-white/[0.02] active:bg-white/[0.04] cursor-pointer transition-all">
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg ${isPix ? 'bg-teal-500/10 text-teal-500' : 'bg-blue-500/10 text-blue-500'} border border-white/5 flex items-center justify-center`}>
          {isPix ? <Wallet size={14} /> : <CreditCard size={14} />}
        </div>
        <div className="max-w-[120px]">
          <p className="text-[10px] font-black uppercase italic text-white truncate">#{sale.id.slice(-4)}</p>
          <p className="text-[7px] text-zinc-600 font-bold uppercase">{sale.hora} • {sale.metodoPagamento}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <p className="text-[11px] font-black italic text-white tracking-tighter">R$ {sale.total.toFixed(2)}</p>
          <p className="text-[7px] text-[#6CC551] font-black uppercase">Concluído</p>
        </div>
        <ChevronRight size={14} className="text-zinc-800" />
      </div>
    </div>
  )
}