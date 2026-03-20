import { useState, useEffect, useMemo } from 'react'
import {
  Plus, TrendingUp, Search, CreditCard, Banknote,
  QrCode, ChevronRight, Eye, EyeOff, Smartphone, Clock, Loader2
} from 'lucide-react'
import { collection, query, orderBy, limit, onSnapshot, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import ModalNovaVenda from '../components/ModalNovaVenda'

export default function PDV({ storeEmail }: { storeEmail: string }) {
  const [isModalAberto, setIsModalAberto] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendas, setVendas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const todayStr = useMemo(() => new Date().toLocaleDateString("pt-BR"), [])

  useEffect(() => {
    if (!storeEmail) return;
    setIsLoading(true);
    const q = query(
      collection(db, "sales"),
      where("store", "==", storeEmail),
      orderBy("timestamp", "desc"),
      limit(25)
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => {
        const d = doc.data();
        return {
          id: doc.id,
          total: Number(d.total || 0),
          time: d.hora || (d.timestamp?.toDate ? d.timestamp.toDate().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "--:--"),
          date: d.data || (d.timestamp?.toDate ? d.timestamp.toDate().toLocaleDateString("pt-BR") : ""),
          paymentMethod: (d.metodoPagamento || "PIX").toUpperCase(),
          items: d.items || [],
          status: d.status || "completed"
        };
      });
      setVendas(list);
      setIsLoading(false);
    }, (error) => {
      console.error("ERRO FIREBASE NO PDV:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [storeEmail]);

  const filteredSales = useMemo(() => {
    return vendas.filter(v =>
      !searchTerm ||
      v.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      v.items.some((i: any) => (i.nome || i.name)?.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [vendas, searchTerm]);

  const stats = useMemo(() => {
    const totals = { pix: 0, card: 0, cash: 0, profit: 0 };
    vendas.forEach(v => {
      if (v.date === todayStr) {
        if (v.paymentMethod.includes("PIX")) totals.pix += v.total;
        else if (v.paymentMethod.includes("CART") || v.paymentMethod.includes("CARD")) totals.card += v.total;
        else totals.cash += v.total;
        totals.profit += (v.total * 0.3); 
      }
    });
    return totals;
  }, [vendas, todayStr]);

  const formatValue = (val: number) => 
    showValues ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "••••••";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4 text-zinc-100">
      
      {/* HEADER PADRÃO BOSS */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Terminal</h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80">{storeEmail}</p>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={() => setShowValues(!showValues)} 
            className="p-4 bg-zinc-900/50 rounded-2xl border border-white/5 text-zinc-500 hover:text-white transition-all shadow-xl"
          >
            {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          
          <button
            onClick={() => setIsModalAberto(true)}
            className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#6CC551] text-black px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:brightness-110 active:scale-95 shadow-lg shadow-[#6CC551]/10 transition-all"
          >
            <Plus size={18} strokeWidth={4} /> Realizar Venda
          </button>
        </div>
      </header>

      {/* MÉTRICAS GRID (IGUAL DASHBOARD) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricSmallCard label="Pix Hoje" value={formatValue(stats.pix)} icon={<Smartphone size={14}/>} color="#6CC551" />
        <MetricSmallCard label="Cartão" value={formatValue(stats.card)} icon={<CreditCard size={14}/>} color="#3B82F6" />
        <MetricSmallCard label="Dinheiro" value={formatValue(stats.cash)} icon={<Banknote size={14}/>} color="#FBBF24" />
        <MetricSmallCard label="Lucro Est." value={formatValue(stats.profit)} icon={<TrendingUp size={14}/>} color="#A855F7" />
      </section>

      {/* BUSCA ESTILIZADA */}
      <div className="relative group">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#6CC551] transition-colors" size={20} />
        <input
          type="text"
          placeholder="PESQUISAR NO HISTÓRICO DE VENDAS..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/30 border border-white/5 py-5 pl-14 pr-6 rounded-[2rem] text-[11px] font-black focus:border-[#6CC551]/30 transition-all text-white placeholder:text-zinc-800 uppercase tracking-widest outline-none"
        />
      </div>

      {/* LISTA DE REGISTROS (PADRÃO SALEROW DO DASHBOARD) */}
      <div className="space-y-4">
        <h3 className="text-[10px] md:text-[11px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 px-2">
          <Clock size={14} className="text-[#6CC551]" /> Fluxo de Caixa Recente
        </h3>

        <div className="bg-zinc-900/30 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          {isLoading ? (
            <div className="py-32 flex flex-col items-center justify-center gap-4">
               <Loader2 className="animate-spin text-[#6CC551]" size={32} />
               <span className="text-[10px] font-black uppercase text-zinc-500 tracking-[0.2em]">Sincronizando Nuvem...</span>
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {filteredSales.length > 0 ? filteredSales.map((venda) => (
                <VendaRow key={venda.id} venda={venda} blurValue={!showValues} />
              )) : (
                <div className="py-32 text-center opacity-20">
                  <QrCode size={48} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-[10px] tracking-[0.3em]">Nenhum registro encontrado</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MODAL NOVA VENDA */}
      {isModalAberto && (
        <ModalNovaVenda
          onClose={() => setIsModalAberto(false)}
          storeEmail={storeEmail}
          onSuccess={() => setIsModalAberto(false)}
        />
      )}
    </div>
  )
}

/* COMPONENTES INTERNOS PADRONIZADOS */

function MetricSmallCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-zinc-900/40 p-4 md:p-5 rounded-[1.5rem] border border-white/5 relative overflow-hidden">
      <div className="flex justify-between items-center mb-2">
        <span className="text-[7px] md:text-[8px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className="text-sm md:text-lg font-black text-white italic tracking-tighter truncate">
        {value}
      </h3>
      <div className="absolute -bottom-2 -right-2 w-8 h-8 opacity-[0.03] rotate-12" style={{ backgroundColor: color, borderRadius: '50%', filter: 'blur(20px)' }} />
    </div>
  )
}

function VendaRow({ venda, blurValue }: { venda: any, blurValue: boolean }) {
  const isPix = venda.paymentMethod.includes('PIX')
  
  return (
    <div className="group flex justify-between items-center p-5 md:p-6 hover:bg-white/[0.03] active:bg-white/[0.05] cursor-pointer transition-all">
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-zinc-950 border border-white/5 transition-colors ${isPix ? 'text-[#6CC551]' : 'text-blue-400'}`}>
          {isPix ? <Smartphone size={18} /> : <CreditCard size={18} />}
        </div>
        <div className="max-w-[140px] md:max-w-md">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-black text-white italic uppercase tracking-tighter group-hover:text-[#6CC551] transition-colors">#{venda.id.slice(-4)}</span>
            <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{venda.time}</span>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase italic mt-1 line-clamp-1 opacity-70">
            {venda.items.map((i: any) => `${i.qtd}x ${i.nome}`).join(' • ')}
          </p>
        </div>
      </div>

      <div className="text-right flex items-center gap-4 md:gap-6">
        <div>
          <p className={`text-sm md:text-base font-black text-white italic tracking-tighter leading-none ${blurValue && "blur-md select-none"}`}>
            R$ {venda.total.toFixed(2)}
          </p>
          <p className="text-[7px] font-black text-[#6CC551] uppercase tracking-[0.2em] mt-1 opacity-80">{venda.paymentMethod}</p>
        </div>
        <ChevronRight size={16} className="text-zinc-800 group-hover:text-[#6CC551] transition-all" />
      </div>
    </div>
  )
}