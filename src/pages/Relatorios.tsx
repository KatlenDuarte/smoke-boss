import { useState, useEffect, useMemo } from 'react'
import { 
  Package, TrendingUp, Loader2, FileDown,
  Trophy, ArrowUpRight, BarChart3, 
  Target, ChevronRight, Star
} from 'lucide-react'
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

// Definição de tipos para os períodos
type Periodo = 'semana' | 'mes' | 'ano' | 'tudo'

export default function Relatorios() {
  const { user } = useAuth()
  const [vendas, setVendas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [periodoAtivo, setPeriodoAtivo] = useState<Periodo>('semana')

  // 1. BUSCA DE DADOS EM TEMPO REAL
  useEffect(() => {
    if (!user?.email) return
    setLoading(true)
    const q = query(
      collection(db, 'sales'),
      where('store', '==', user.email),
      orderBy('timestamp', 'desc')
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setVendas(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user?.email])

  // 2. LÓGICA DE CÁLCULO DINÂMICO POR PERÍODO
  const stats = useMemo(() => {
    const agora = new Date();
    let dataInicio = new Date();

    if (periodoAtivo === 'semana') {
      const diaSemana = agora.getDay();
      const diff = agora.getDate() - (diaSemana === 0 ? 6 : diaSemana - 1);
      dataInicio = new Date(agora.setDate(diff));
      dataInicio.setHours(0, 0, 0, 0);
    } else if (periodoAtivo === 'mes') {
      dataInicio = new Date(agora.getFullYear(), agora.getMonth(), 1);
    } else if (periodoAtivo === 'ano') {
      dataInicio = new Date(agora.getFullYear(), 0, 1);
    } else {
      dataInicio = new Date(2000, 0, 1); // Histórico total
    }

    const filtradas = vendas.filter(v => {
      const dataVenda = v.timestamp?.toDate();
      return dataVenda >= dataInicio;
    });

    const faturamento = filtradas.reduce((acc, v) => acc + (v.total || 0), 0);
    const mapVendedores: Record<string, any> = {};
    const produtosContagem: Record<string, number> = {};

    filtradas.forEach(v => {
      // Cálculo de Vendedores
      const nome = v.vendedor || 'S/ VENDEDOR';
      if (!mapVendedores[nome]) mapVendedores[nome] = { total: 0, comissao: 0, vendas: 0 };
      mapVendedores[nome].total += (v.total || 0);
      mapVendedores[nome].vendas += 1;
      mapVendedores[nome].comissao += (v.total || 0) * 0.05;

      // Cálculo de Produtos
      v.items?.forEach((item: any) => {
        const pNome = item.name || 'Produto';
        produtosContagem[pNome] = (produtosContagem[pNome] || 0) + (item.quantity || 1);
      });
    });

    return {
      faturamento,
      totalPedidos: filtradas.length,
      rankingVendedores: Object.entries(mapVendedores)
        .map(([nome, d]: any) => ({ nome, ...d }))
        .sort((a, b) => b.total - a.total),
      rankingProdutos: Object.entries(produtosContagem)
        .map(([nome, qtd]) => ({ nome, qtd }))
        .sort((a, b) => b.qtd - a.qtd)
        .slice(0, 5),
      totalComissoes: faturamento * 0.05,
      labelPeriodo: periodoAtivo === 'tudo' ? 'Início do Sistema' : dataInicio.toLocaleDateString('pt-BR')
    }
  }, [vendas, periodoAtivo])

  // 3. FUNÇÃO DE EXPORTAÇÃO PDF
  const gerarPDF = () => {
    const doc = new jsPDF()
    doc.setFontSize(18)
    doc.text('SMOKE BOSS - BALANÇO OPERACIONAL', 15, 20)
    doc.setFontSize(10)
    doc.text(`Período: ${periodoAtivo.toUpperCase()} | Início: ${stats.labelPeriodo}`, 15, 28)
    
    autoTable(doc, {
      startY: 35,
      head: [['Vendedor', 'Vendas', 'Total Bruto', 'Comissão (5%)']],
      body: stats.rankingVendedores.map(v => [
        v.nome, 
        v.vendas, 
        `R$ ${v.total.toFixed(2)}`, 
        `R$ ${v.comissao.toFixed(2)}`
      ]),
      headStyles: { fillColor: [108, 197, 81] },
      theme: 'grid'
    })
    
    doc.save(`Balanco_SmokeBoss_${periodoAtivo}_${new Date().getTime()}.pdf`)
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#6CC551] animate-spin" size={32} />
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Sincronizando Analytics</span>
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-28 px-4 text-zinc-100">
      
      {/* HEADER DINÂMICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">ANALYTICS & RELATÓRIOS</h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80 italic">Performance de Vendas e Comissões</p>
        </div>

        {/* SELETOR DE PERÍODO (ESTILO TABS FINANCEIRO) */}
        <div className="w-full md:w-auto flex bg-zinc-900/30 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
          {(['semana', 'mes', 'ano', 'tudo'] as Periodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodoAtivo(p)}
              className={`px-6 py-3 text-[9px] font-black uppercase tracking-wider rounded-xl transition-all ${
                periodoAtivo === p 
                  ? 'bg-[#6CC551] text-black shadow-lg shadow-[#6CC551]/10' 
                  : 'text-zinc-500 hover:text-white'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </header>

      {/* GRID DE MÉTRICAS (FINANCE MINI CARDS) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <FinanceMiniCard 
          label="Faturamento Bruto" 
          value={stats.faturamento.toFixed(2)} 
          icon={<TrendingUp size={16} />} 
          color="#6CC551" 
        />
        <FinanceMiniCard 
          label="Total de Pedidos" 
          value={stats.totalPedidos.toString()} 
          icon={<Package size={16} />} 
          color="#A855F7" 
          isCurrency={false}
        />
        <FinanceMiniCard 
          label="Comissões (5%)" 
          value={stats.totalComissoes.toFixed(2)} 
          icon={<Star size={16} />} 
          color="#FBBF24" 
        />
        <FinanceMiniCard 
          label="Ticket Médio" 
          value={(stats.faturamento / (stats.totalPedidos || 1)).toFixed(2)} 
          icon={<Target size={16} />} 
          color="#32C5C5" 
        />
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* RANKING VENDEDORES (PAINEL ESQUERDO) */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl">
            <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
              <Trophy size={16} className="text-yellow-500" /> Top Performance de Equipe
            </h3>
            
            <div className="grid gap-4">
              {stats.rankingVendedores.map((v, i) => (
                <div key={i} className="group p-6 bg-zinc-950/40 border border-white/5 rounded-[2rem] flex flex-col md:flex-row justify-between items-center hover:bg-zinc-900/50 transition-all gap-4">
                  <div className="flex items-center gap-5 w-full md:w-auto">
                    <div className="h-12 w-12 bg-black rounded-2xl border border-white/5 flex items-center justify-center text-xs font-[1000] italic text-[#6CC551] shadow-inner">
                      #{i + 1}
                    </div>
                    <div>
                      <p className="text-[12px] font-black text-white uppercase italic tracking-tighter">{v.nome}</p>
                      <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-[0.2em]">{v.vendas} vendas concluídas</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-8 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-white/5 pt-4 md:pt-0">
                    <div className="text-left md:text-right">
                      <p className="text-[7px] font-black text-zinc-500 uppercase leading-none">Volume Bruto</p>
                      <p className="text-sm font-black text-white italic">R$ {v.total.toFixed(2)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[7px] font-black text-[#6CC551] uppercase leading-none">Comissão</p>
                      <p className="text-sm font-black text-[#6CC551] italic">R$ {v.comissao.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MIX DE PRODUTOS (PAINEL DIREITO) */}
        <div className="lg:col-span-4 space-y-6 h-full">
          <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] flex flex-col shadow-2xl overflow-hidden min-h-[500px]">
            <div className="p-6 border-b border-white/3 bg-zinc-950/50">
               <h3 className="font-black italic uppercase text-[10px] tracking-[0.2em] text-white flex items-center gap-3">
                 <BarChart3 size={16} className="text-[#6CC551]" /> Mix de Saída (Top 5)
               </h3>
            </div>
            
            <div className="p-6 space-y-4 flex-1">
              {stats.rankingProdutos.map((p, i) => (
                <div key={i} className="p-4 bg-zinc-950/40 border border-white/5 rounded-2xl flex justify-between items-center group hover:bg-zinc-900/50 transition-all">
                  <span className="text-[10px] font-black text-zinc-400 uppercase italic truncate max-w-[150px]">{p.nome}</span>
                  <div className="flex items-center gap-3">
                    <div className="h-1 w-12 bg-zinc-900 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-[#6CC551] opacity-40 group-hover:opacity-100 transition-opacity" 
                        style={{ width: `${(p.qtd / (stats.rankingProdutos[0]?.qtd || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="text-white font-black text-[11px] italic">{p.qtd} <span className="text-[8px] text-zinc-600 uppercase">un</span></span>
                  </div>
                </div>
              ))}
              {stats.rankingProdutos.length === 0 && (
                <div className="py-20 text-center opacity-20 uppercase font-black text-[9px] tracking-[0.4em]">Sem dados no período</div>
              )}
            </div>
            
            <div className="p-6 bg-zinc-950/20 border-t border-white/3">
               <button 
                 onClick={gerarPDF}
                 className="w-full py-5 bg-zinc-900/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-[#6CC551] hover:border-[#6CC551]/30 transition-all flex items-center justify-center gap-2"
               >
                 Exportar PDF Detalhado <ChevronRight size={12} />
               </button>
            </div>
          </div>
        </div>
      </div>

      {/* RODAPÉ DE RESULTADO LÍQUIDO (FIXADO/OTIMIZADO) */}
      <footer className="bg-zinc-950 border border-white/10 p-8 md:p-12 rounded-[3rem] shadow-2xl relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="text-center md:text-left">
            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.5em] block mb-4 italic">Resultado Líquido da Loja</span>
            <div className="flex items-baseline justify-center md:justify-start gap-3">
              <span className="text-xl md:text-2xl font-black text-[#6CC551]">R$</span>
              <h2 className="text-4xl md:text-4xl font-[1000] italic text-white tracking-tighter leading-none">
                {(stats.faturamento - stats.totalComissoes).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
            <p className="text-[8px] text-zinc-700 font-bold uppercase mt-6 tracking-widest max-w-sm">
              Cálculo baseado no faturamento bruto menos comissão operacional padrão de 5%.
            </p>
          </div>
          
          <button 
            onClick={gerarPDF}
            className="group/btn bg-[#6CC551] text-black px-10 py-5 md:px-12 md:py-6 rounded-4xl font-black uppercase text-[10px] md:text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#6CC551]/10 flex items-center gap-3"
          >
            <FileDown size={20} strokeWidth={3} /> Exportar Balanço
          </button>
        </div>
        
        {/* Brilho decorativo de fundo */}
        <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-[#6CC551]/5 blur-[120px] rounded-full group-hover:bg-[#6CC551]/10 transition-colors" />
      </footer>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

// COMPONENTE DE MINI CARD REUTILIZÁVEL (MESMO PADRÃO FINANCEIRO)
function FinanceMiniCard({ label, value, icon, color, isCurrency = true }: any) {
  return (
    <div className="bg-zinc-900/40 p-6 rounded-4xl border border-white/5 shadow-xl relative overflow-hidden group transition-all hover:bg-zinc-900/60">
      <div className="w-10 h-10 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:scale-110" style={{ color }}>
        {icon}
      </div>
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1 opacity-70">{label}</span>
      <div className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none truncate">
        {isCurrency ? `R$ ${value}` : value}
      </div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 opacity-[0.03] blur-2xl rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}