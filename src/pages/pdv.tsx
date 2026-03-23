import { useState, useEffect, useMemo } from 'react'
import {
  Plus, TrendingUp, Search, CreditCard, Banknote,
  QrCode, ChevronRight, Eye, EyeOff, Smartphone, Clock, Loader2, Calendar, User, X
} from 'lucide-react'
import { 
  collection, query, orderBy, onSnapshot, where, 
  doc, deleteDoc, updateDoc, increment 
} from "firebase/firestore";
import { db } from "../lib/firebase";
import ModalNovaVenda from '../components/ModalNovaVenda'

export default function PDV({ storeEmail }: { storeEmail: string }) {
  const [isModalAberto, setIsModalAberto] = useState(false)
  const [showValues, setShowValues] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [vendas, setVendas] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [dataFiltro, setDataFiltro] = useState(new Date().toISOString().split('T')[0])

  // Formata a data do input (YYYY-MM-DD) para o padrão do banco (DD/MM/YYYY)
  const selectedDateStr = useMemo(() => {
    if (!dataFiltro) return "";
    const [year, month, day] = dataFiltro.split('-');
    return `${day}/${month}/${year}`;
  }, [dataFiltro]);

  useEffect(() => {
    if (!storeEmail) return;
    setIsLoading(true);

    const q = query(
      collection(db, "sales"), 
      where("store", "==", storeEmail),
      where("data", "==", selectedDateStr),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        total: Number(doc.data().total || 0),
        time: doc.data().hora || "--:--",
        vendedor: doc.data().vendedor || "GERENTE",
        paymentMethod: (doc.data().metodoPagamento || "PIX").toUpperCase(),
        items: doc.data().items || [],
      }));
      setVendas(list);
      setIsLoading(false);
    }, () => setIsLoading(false));

    return () => unsubscribe();
  }, [storeEmail, selectedDateStr]);

  // FUNÇÃO DE ESTORNO (DEVOLUÇÃO)
  const handleEstornarVenda = async (venda: any) => {
    const pinSalvo = localStorage.getItem('fechamento_pin') || '1234';
    const pinDigitado = prompt(`Digite o PIN para estornar a venda #${venda.id.slice(-4).toUpperCase()}:`);

    if (pinDigitado !== pinSalvo) {
      alert("PIN Incorreto! Operação cancelada.");
      return;
    }

    if (!confirm("Isso excluirá a venda e devolverá os produtos ao estoque. Confirmar?")) return;

    setIsLoading(true);
    try {
      // 1. Devolve os itens ao estoque um por um
      const promessasEstoque = venda.items.map((item: any) => {
        const pRef = doc(db, "products", item.id);
        return updateDoc(pRef, {
          estoque: increment(item.qtd)
        });
      });

      await Promise.all(promessasEstoque);

      // 2. Deleta o registro da venda
      await deleteDoc(doc(db, "sales", venda.id));

      alert("Venda estornada e produtos devolvidos ao estoque!");
    } catch (error) {
      console.error(error);
      alert("Erro ao processar estorno.");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredSales = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return vendas.filter(v =>
      !term ||
      v.id.toLowerCase().includes(term) ||
      v.vendedor.toLowerCase().includes(term) ||
      v.items.some((i: any) => i.nome.toLowerCase().includes(term))
    );
  }, [vendas, searchTerm]);

  const stats = useMemo(() => {
    const totals = { pix: 0, card: 0, cash: 0, total: 0 };
    vendas.forEach(v => {
      totals.total += v.total;
      if (v.paymentMethod.includes("PIX")) totals.pix += v.total;
      else if (v.paymentMethod.includes("CART")) totals.card += v.total;
      else totals.cash += v.total;
    });
    return totals;
  }, [vendas]);

  const formatValue = (val: number) => 
    showValues ? `R$ ${val.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}` : "••••";

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4 md:space-y-8 pb-32 md:pb-24 px-4 text-zinc-100 antialiased">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-6">
        <div className="w-full md:w-auto space-y-4">
          <div className="flex items-center justify-between md:justify-start gap-3">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-[#6CC551] shadow-[0_0_10px_#6CC551] animate-pulse" />
              <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter">Terminal</h2>
            </div>
            <button onClick={() => setShowValues(!showValues)} className="md:hidden p-3 bg-zinc-900 rounded-xl text-zinc-500">
              {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
            </button>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
             <div className="flex items-center bg-zinc-900 border border-white/5 rounded-xl px-4 py-2.5 gap-3 shrink-0">
                <Calendar size={14} className="text-[#6CC551]" />
                <input 
                  type="date" 
                  value={dataFiltro}
                  onChange={(e) => setDataFiltro(e.target.value)}
                  className="bg-transparent text-[10px] font-black text-white outline-none uppercase"
                />
             </div>
             <button 
                onClick={() => setDataFiltro(new Date().toISOString().split('T')[0])}
                className="px-4 py-2.5 bg-zinc-900 border border-white/5 rounded-xl text-[9px] font-black uppercase text-zinc-500 shrink-0"
             >
                Hoje
             </button>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-3">
          <button onClick={() => setShowValues(!showValues)} className="p-4 bg-zinc-900 border border-white/5 rounded-2xl text-zinc-500 hover:text-white transition-all">
            {showValues ? <Eye size={20} /> : <EyeOff size={20} />}
          </button>
          <button onClick={() => setIsModalAberto(true)} className="flex items-center gap-3 bg-[#6CC551] text-black px-10 py-5 rounded-2xl text-[11px] font-black uppercase tracking-[0.15em] shadow-lg shadow-[#6CC551]/20">
            <Plus size={18} strokeWidth={4} /> Realizar Venda
          </button>
        </div>
      </header>

      {/* MÉTRICAS */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Pix" value={formatValue(stats.pix)} icon={<Smartphone size={16}/>} color="#6CC551" />
        <MetricCard label="Cartão" value={formatValue(stats.card)} icon={<CreditCard size={16}/>} color="#3B82F6" />
        <MetricCard label="Dinheiro" value={formatValue(stats.cash)} icon={<Banknote size={16}/>} color="#FBBF24" />
        <MetricCard label="Total" value={formatValue(stats.total)} icon={<TrendingUp size={16}/>} color="#A855F7" />
      </section>

      {/* BUSCA */}
      <div className="relative">
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
        <input
          type="text"
          placeholder="BUSCAR VENDEDOR OU PRODUTO..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full bg-zinc-900/30 border border-white/5 py-4 md:py-6 pl-14 pr-6 rounded-2xl md:rounded-[2rem] text-[10px] md:text-[11px] font-black text-white uppercase outline-none focus:border-[#6CC551]/30 transition-all"
        />
      </div>

      {/* LISTA DE VENDAS */}
      <div className="space-y-4">
        <div className="flex justify-between items-center px-2">
          <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2 italic">
            <Clock size={14} className="text-[#6CC551]" /> {selectedDateStr}
          </h3>
          <span className="text-[9px] font-black text-zinc-600 bg-white/5 px-3 py-1 rounded-full uppercase">{filteredSales.length} Lançamentos</span>
        </div>

        <div className="bg-zinc-900/30 backdrop-blur-sm rounded-[2rem] md:rounded-[2.5rem] border border-white/5 overflow-hidden">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center gap-4">
               <Loader2 className="animate-spin text-[#6CC551]" size={32} />
            </div>
          ) : (
            <div className="divide-y divide-white/[0.03]">
              {filteredSales.map((venda) => (
                <VendaRow 
                  key={venda.id} 
                  venda={venda} 
                  blurValue={!showValues} 
                  onEstorno={() => handleEstornarVenda(venda)}
                />
              ))}
              {filteredSales.length === 0 && (
                <div className="py-20 text-center opacity-20">
                  <QrCode size={40} className="mx-auto mb-4" />
                  <p className="font-black uppercase text-[10px]">Sem registros</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* BOTÃO FIXO MOBILE */}
      <div className="fixed bottom-6 left-0 right-0 px-6 md:hidden z-40">
        <button 
          onClick={() => setIsModalAberto(true)}
          className="w-full bg-[#6CC551] text-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-[0_20px_40px_rgba(108,197,81,0.3)] active:scale-95 transition-transform font-black uppercase text-xs tracking-widest"
        >
          <Plus size={20} strokeWidth={4} /> Realizar Venda
        </button>
      </div>

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

function MetricCard({ label, value, icon, color }: any) {
    return (
      <div className="bg-zinc-900/40 p-4 md:p-5 rounded-2xl md:rounded-[2rem] border border-white/5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[8px] md:text-[9px] font-black text-zinc-500 uppercase tracking-widest">{label}</span>
          <div style={{ color }} className="opacity-80 scale-90 md:scale-100">{icon}</div>
        </div>
        <h3 className="text-sm md:text-xl font-black text-white italic tracking-tighter truncate">{value}</h3>
      </div>
    )
}

function VendaRow({ venda, blurValue, onEstorno }: { venda: any, blurValue: boolean, onEstorno: () => void }) {
  const isPix = venda.paymentMethod.includes('PIX')
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center p-5 md:p-6 hover:bg-white/[0.02] gap-4 relative">
      <div className="flex items-center gap-4 w-full md:w-auto">
        <div className={`p-3 md:p-4 rounded-xl md:rounded-2xl bg-zinc-950 border border-white/5 ${isPix ? 'text-[#6CC551]' : 'text-blue-500'}`}>
          {isPix ? <Smartphone size={18} /> : <CreditCard size={18} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-black text-white italic">#{venda.id.slice(-4).toUpperCase()}</span>
            <span className="text-[9px] font-bold text-zinc-600">{venda.time}</span>
            <span className="text-[8px] font-black bg-zinc-950 text-[#6CC551] px-2 py-0.5 rounded border border-white/5 uppercase italic">
               <User size={8} className="inline mr-1" /> {venda.vendedor}
            </span>
          </div>
          <p className="text-[9px] font-bold text-zinc-500 uppercase italic line-clamp-1 mt-1">
            {venda.items.map((i: any) => `${i.qtd}x ${i.nome}`).join(' • ')}
          </p>
        </div>
      </div>
      
      <div className="flex justify-between items-center w-full md:w-auto border-t md:border-t-0 border-white/5 pt-3 md:pt-0 gap-4">
        <div className="md:text-right">
          <p className={`text-base md:text-xl font-black text-white italic tracking-tighter ${blurValue && "blur-md"}`}>
            R$ {venda.total.toFixed(2)}
          </p>
          <p className="text-[8px] font-black text-[#6CC551] uppercase tracking-widest md:text-right">{venda.paymentMethod}</p>
        </div>
        
        {/* BOTÃO DE ESTORNO */}
        <button 
          onClick={onEstorno}
          className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
          title="Estornar Venda"
        >
          <X size={16} strokeWidth={3} />
        </button>
      </div>
    </div>
  )
}