import { useState, useEffect, useMemo } from 'react'
import { 
  DollarSign, TrendingUp, X, 
  Wallet, CreditCard, Receipt, 
  ArrowUpRight, ArrowDownLeft, Target, Save, Loader2,
} from 'lucide-react'
import { 
  collection, query, where, onSnapshot, addDoc, 
  updateDoc, doc, serverTimestamp, limit, orderBy 
} from 'firebase/firestore'
import { db } from '../lib/firebase'
import { useAuth } from '../hooks/useAuth'

export default function Financeiro() {
  const { user } = useAuth()
  const [caixaAtual, setCaixaAtual] = useState<any>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [descSaida, setDescSaida] = useState('')
  const [valorSaida, setValorSaida] = useState('')
  const [catSaida, setCatSaida] = useState('Suprimentos')

  // MONITORAR CAIXA ABERTO
  useEffect(() => {
    if (!user?.email) return
    const q = query(
      collection(db, 'cash_registers'),
      where('store', '==', user.email),
      where('status', '==', 'Aberto'),
      limit(1)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        setCaixaAtual({ id: snapshot.docs[0].id, ...snapshot.docs[0].data() })
      } else {
        setCaixaAtual(null)
      }
      setLoading(false)
    })
    return () => unsubscribe()
  }, [user?.email])

  // SINCRONIZAR VENDAS
  useEffect(() => {
    if (!caixaAtual?.id || !caixaAtual?.abertoEm || !user?.email) return
    const qVendas = query(
      collection(db, 'sales'),
      where('store', '==', user.email),
      where('timestamp', '>=', caixaAtual.abertoEm),
      orderBy('timestamp', 'desc')
    )
    const unsubscribeVendas = onSnapshot(qVendas, (snapshot) => {
      let bruto = 0, dinheiro = 0, pix = 0, cartao = 0
      snapshot.docs.forEach(docVenda => {
        const v = docVenda.data()
        const valor = Number(v.total || 0)
        bruto += valor
        const metodo = (v.metodoPagamento || "").toUpperCase()
        if (metodo.includes("DINHEIRO")) dinheiro += valor
        else if (metodo.includes("PIX")) pix += valor
        else if (metodo.includes("CART") || metodo.includes("CARD") || metodo.includes("DÉBITO")) cartao += valor
        else dinheiro += valor
      })
      updateDoc(doc(db, 'cash_registers', caixaAtual.id), {
        totalVendas: bruto, totalDinheiro: dinheiro, totalPix: pix, totalCartao: cartao
      })
    })
    return () => unsubscribeVendas()
  }, [caixaAtual?.id, caixaAtual?.abertoEm, user?.email])

  const handleAbrirCaixa = async () => {
    const valor = prompt('VALOR INICIAL EM DINHEIRO (R$):', '0.00')
    if (valor === null || isNaN(parseFloat(valor))) return
    try {
      await addDoc(collection(db, 'cash_registers'), {
        store: user?.email,
        operador: user?.displayName || 'Gerente',
        status: 'Aberto',
        abertoEm: serverTimestamp(),
        valorAbertura: parseFloat(valor),
        totalVendas: 0, totalDinheiro: 0, totalPix: 0, totalCartao: 0, totalSaidas: 0, historicoSaidas: []
      })
    } catch (error) { alert('Erro ao abrir caixa') }
  }

  const handleRegistrarSaida = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!caixaAtual) return
    const valor = parseFloat(valorSaida)
    const novaSaida = {
      descricao: descSaida.toUpperCase(),
      valor: valor,
      categoria: catSaida,
      hora: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      timestamp: new Date()
    }
    try {
      const novoTotalSaidas = (caixaAtual.totalSaidas || 0) + valor
      const novoHistorico = [novaSaida, ...(caixaAtual.historicoSaidas || [])]
      await updateDoc(doc(db, 'cash_registers', caixaAtual.id), {
        totalSaidas: novoTotalSaidas,
        historicoSaidas: novoHistorico
      })
      setIsModalOpen(false); setDescSaida(''); setValorSaida('')
    } catch (error) { alert('Erro ao registrar saída') }
  }

  const handleFecharCaixa = async () => {
    if (!confirm('Deseja realmente fechar o caixa e encerrar o turno?')) return
    try {
      await updateDoc(doc(db, 'cash_registers', caixaAtual.id), {
        status: 'Fechado',
        fechadoEm: serverTimestamp(),
        valorFinalCaixa: (caixaAtual.valorAbertura + caixaAtual.totalDinheiro - caixaAtual.totalSaidas)
      })
    } catch (error) { alert('Erro ao fechar caixa') }
  }

  if (loading) return (
    <div className="h-[60vh] flex flex-col items-center justify-center gap-4">
      <Loader2 className="text-[#6CC551] animate-spin" size={32} />
      <span className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em]">Sincronizando Fluxo</span>
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-28 px-4 text-zinc-100">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none text-white">
              Gestão Financeira
            </h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80 italic">Fluxo de Caixa em Tempo Real</p>
        </div>

        {caixaAtual && (
          <button 
            onClick={() => setIsModalOpen(true)} 
            className="w-full md:w-auto flex items-center justify-center gap-3 bg-red-500/10 border border-red-500/20 text-red-500 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all shadow-lg"
          >
            <ArrowDownLeft size={18} strokeWidth={3} /> Registrar Retirada
          </button>
        )}
      </header>

      {!caixaAtual ? (
        <div className="bg-zinc-900/30 backdrop-blur-md border border-dashed border-white/5 rounded-[3rem] p-16 md:p-32 text-center">
          <div className="w-20 h-20 bg-zinc-950 border border-white/5 rounded-3xl flex items-center justify-center mx-auto mb-8 text-zinc-800 shadow-2xl">
            <Wallet size={40} />
          </div>
          <h3 className="text-xl md:text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">Turno Encerrado</h3>
          <p className="text-zinc-500 text-[10px] font-bold uppercase tracking-[0.2em] mb-12 max-w-xs mx-auto opacity-60">O monitoramento financeiro está pausado. Inicie um novo turno para registrar vendas.</p>
          <button 
            onClick={handleAbrirCaixa} 
            className="bg-[#6CC551] text-black px-14 py-5 rounded-4xl font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-[#6CC551]/10"
          >
            Abrir Novo Caixa
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* PAINEL ESQUERDO: MÉTRICAS */}
          <div className="lg:col-span-8 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
              <FinanceMiniCard 
                label="Saldo em Mãos" 
                value={(caixaAtual.valorAbertura + (caixaAtual.totalDinheiro || 0) - (caixaAtual.totalSaidas || 0)).toFixed(2)} 
                icon={<Wallet size={16}/>} 
                color="#32C5C5" 
              />
              <FinanceMiniCard 
                label="Bruto Turno" 
                value={caixaAtual.totalVendas?.toFixed(2)} 
                icon={<ArrowUpRight size={16}/>} 
                color="#6CC551" 
              />
              <div className="col-span-2 lg:col-span-1">
                <FinanceMiniCard 
                  label="Retiradas" 
                  value={caixaAtual.totalSaidas?.toFixed(2)} 
                  icon={<ArrowDownLeft size={16}/>} 
                  color="#EF4444" 
                />
              </div>
            </div>

            {/* COMPOSIÇÃO DETALHADA */}
            <div className="bg-zinc-900/30 backdrop-blur-sm border border-white/5 rounded-[2.5rem] p-6 md:p-10 shadow-xl">
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.4em] mb-10 flex items-center gap-3">
                <Target size={16} className="text-[#6CC551]" /> Métodos de Entrada
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <MetodoItem icon={<DollarSign size={16}/>} label="Dinheiro" value={caixaAtual.totalDinheiro} color="#6CC551" />
                <MetodoItem icon={<TrendingUp size={16}/>} label="Pix" value={caixaAtual.totalPix} color="#32C5C5" />
                <MetodoItem icon={<CreditCard size={16}/>} label="Cartões" value={caixaAtual.totalCartao} color="#A855F7" />
              </div>
            </div>
          </div>

          {/* PAINEL DIREITO: FLUXO DE SAÍDA */}
          <div className="lg:col-span-4 h-full">
            <div className="bg-zinc-900/30 backdrop-blur-md border border-white/5 rounded-[2.5rem] flex flex-col h-full overflow-hidden min-h-125 shadow-2xl">
              <div className="p-6 border-b border-white/3 bg-zinc-950/50">
                <h3 className="font-black italic uppercase text-[10px] tracking-[0.2em] text-white flex items-center gap-3">
                  <Receipt size={16} className="text-red-500" /> Linha do Tempo (Saídas)
                </h3>
              </div>
              
              <div className="p-4 space-y-3 flex-1 overflow-y-auto max-h-112.5 no-scrollbar">
                {caixaAtual.historicoSaidas?.length > 0 ? (
                  caixaAtual.historicoSaidas.map((d: any, i: number) => (
                    <div key={i} className="group p-5 bg-zinc-950/40 border border-white/5 rounded-2xl flex justify-between items-center hover:bg-zinc-900/50 transition-all">
                      <div>
                        <p className="text-[11px] font-black text-white uppercase italic tracking-tighter group-hover:text-red-500 transition-colors">{d.descricao}</p>
                        <span className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">{d.categoria} • {d.hora}</span>
                      </div>
                      <span className="text-red-500 font-black text-sm italic tracking-tighter">- R$ {d.valor.toFixed(2)}</span>
                    </div>
                  ))
                ) : (
                  <div className="py-24 text-center opacity-20 uppercase font-black text-[9px] tracking-[0.4em]">Nenhuma retirada</div>
                )}
              </div>

              <div className="p-6 bg-zinc-950/20 border-t border-white/3">
                <button 
                  onClick={handleFecharCaixa} 
                  className="w-full py-5 bg-zinc-900/50 border border-white/5 rounded-2xl text-[9px] font-black uppercase tracking-[0.3em] text-zinc-500 hover:text-red-500 hover:border-red-500/30 transition-all active:scale-95"
                >
                  Fechar Turno Atual
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE SAÍDA (PADRÃO BOSS) */}
      {isModalOpen && (
        <div className="fixed inset-0 z-100 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setIsModalOpen(false)} />
          <div className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] relative animate-in zoom-in-95 duration-300 overflow-hidden">
            <div className="p-8 flex justify-between items-center border-b border-white/5 bg-zinc-950/50">
              <h4 className="text-lg font-black text-white italic uppercase tracking-tighter">Registrar Retirada</h4>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-500 hover:text-white transition-colors"><X size={24} /></button>
            </div>
            
            <form className="p-8 space-y-6" onSubmit={handleRegistrarSaida}>
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Descrição / Motivo</label>
                  <input 
                    required 
                    value={descSaida} 
                    onChange={(e) => setDescSaida(e.target.value)} 
                    className="w-full bg-zinc-950 border border-white/5 p-5 rounded-2xl text-white font-black italic text-xs outline-none focus:border-red-500/50 transition-all uppercase placeholder:text-zinc-800" 
                    placeholder="EX: PAGAMENTO MOTOBOY" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Valor R$</p>
                    <input 
                      type="number" step="0.01" required 
                      value={valorSaida} onChange={(e) => setValorSaida(e.target.value)} 
                      className="bg-transparent text-red-500 font-black outline-none w-full text-center text-xl italic tracking-tighter" 
                      placeholder="0.00" 
                    />
                  </div>
                  <div className="bg-zinc-950 p-5 rounded-2xl border border-white/5 text-center">
                    <p className="text-[9px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Categoria</p>
                    <select 
                      value={catSaida} 
                      onChange={(e) => setCatSaida(e.target.value)} 
                      className="bg-transparent text-white font-black outline-none w-full text-center text-[11px] uppercase cursor-pointer"
                    >
                      <option value="Suprimentos" className="bg-zinc-900">Suprimentos</option>
                      <option value="Funcionários" className="bg-zinc-900">Funcionários</option>
                      <option value="Estoque" className="bg-zinc-900">Estoque</option>
                      <option value="Outros" className="bg-zinc-900">Outros</option>
                    </select>
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full bg-red-600 text-white font-black py-5 rounded-4xl uppercase text-[10px] tracking-[0.3em] flex items-center justify-center gap-3 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-red-900/20">
                <Save size={18} strokeWidth={3} /> Confirmar Retirada
              </button>
            </form>
          </div>
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

function FinanceMiniCard({ label, value, icon, color }: any) {
  return (
    <div className="bg-zinc-900/40 p-6 rounded-4xl border border-white/5 shadow-xl relative overflow-hidden group">
      <div className="w-10 h-10 bg-zinc-950 rounded-2xl border border-white/5 flex items-center justify-center mb-5 shadow-inner transition-transform group-hover:scale-110" style={{ color }}>
        {icon}
      </div>
      <span className="text-[8px] md:text-[9px] font-black uppercase tracking-[0.2em] text-zinc-500 block mb-1 opacity-70">{label}</span>
      <div className="text-xl md:text-2xl font-black italic text-white tracking-tighter leading-none truncate">R$ {value}</div>
      <div className="absolute -bottom-2 -right-2 w-12 h-12 opacity-[0.03] blur-2xl rounded-full" style={{ backgroundColor: color }} />
    </div>
  )
}

function MetodoItem({ icon, label, value, color }: any) {
  return (
    <div className="bg-zinc-950/50 p-6 rounded-[1.8rem] border border-white/5 group hover:border-white/10 transition-all">
      <div className="flex items-center gap-3 mb-4">
        <span className="p-2 bg-zinc-900 rounded-xl border border-white/5 shadow-inner transition-colors" style={{ color }}>{icon}</span>
        <span className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-2xl font-black italic text-white tracking-tighter">R$ {value?.toFixed(2)}</p>
      <div className="mt-4 h-1 w-full bg-zinc-900 rounded-full overflow-hidden">
        <div className="h-full rounded-full opacity-50 transition-all duration-1000" style={{ backgroundColor: color, width: '100%' }} />
      </div>
    </div>
  )
}