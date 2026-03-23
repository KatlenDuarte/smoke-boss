import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Package, Trash2, 
  AlertTriangle, DollarSign, TrendingUp, X, Save,
  ChevronRight, Loader2, Layers, Calendar
} from 'lucide-react'
import { 
  collection, addDoc, updateDoc, deleteDoc, 
  doc, onSnapshot, query, orderBy 
} from 'firebase/firestore'
import { db } from '../lib/firebase'

interface Produto {
  id?: string;
  nome: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
}

const CATEGORIAS_LISTA = [
  'Todos', '🧉 Cuias', '💨 Narguilés', '🔥 Hosh', '⚙️ Dichavas', 
  '🌀 Mangueiras', '✂️ Tesouras', '🍃 Tabacos', '🚬 Pipes', 
  '🎒 Acessórios', '🛸 Pratinhos', '🌿 Sedas Premium', '📏 Sedas Longas', '🔥 Blunts'
]

export default function EstoqueBoss() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [showValues, setShowValues] = useState(true) // Privacidade apenas nos cards
  const [editingProduto, setEditingProduto] = useState<Produto | null>(null)
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Produto[];
      setProdutos(list);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const filteredProdutos = useMemo(() => {
    return produtos.filter(p => {
      const matchesSearch = p.nome.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCategory = activeCategory === 'Todos' || p.categoria === activeCategory
      const isLow = p.estoque <= p.estoqueMinimo
      return filterLowStock ? (matchesSearch && matchesCategory && isLow) : (matchesSearch && matchesCategory)
    })
  }, [produtos, searchTerm, activeCategory, filterLowStock])

  const metrics = useMemo(() => {
    const totalVenda = produtos.reduce((acc, p) => acc + (p.precoVenda * p.estoque), 0)
    const totalCusto = produtos.reduce((acc, p) => acc + (p.precoCusto * p.estoque), 0)
    const alertas = produtos.filter(p => p.estoque <= p.estoqueMinimo).length
    return { totalVenda, alertas, lucroPotencial: totalVenda - totalCusto, totalItens: produtos.length }
  }, [produtos])

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    const dadosProduto = {
      nome: (formData.get('nome') as string).toUpperCase(),
      categoria: formData.get('categoria') as string,
      precoCusto: Number(formData.get('precoCusto')),
      precoVenda: Number(formData.get('precoVenda')),
      estoque: Number(formData.get('estoque')),
      estoqueMinimo: Number(formData.get('estoqueMinimo')),
    }

    try {
      if (editingProduto?.id) {
        await updateDoc(doc(db, "products", editingProduto.id), dadosProduto);
      } else {
        await addDoc(collection(db, "products"), dadosProduto);
      }
      setShowModal(false);
      setEditingProduto(null);
    } catch (error) {
      alert("Erro ao salvar.");
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Remover este item definitivamente?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setShowModal(false);
      } catch (error) { console.error(error); }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-5 pb-24 px-2 text-zinc-100 font-sans">
      
      {/* HEADER */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-4 px-1">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-xl font-black italic uppercase tracking-tighter">Inventário <span className="text-[#6CC551]">Boss</span></h2>
          </div>
          <p className="text-[8px] text-zinc-600 font-black uppercase tracking-[0.2em]">Gestão de Ativos em Tempo Real</p>
        </div>

        <button 
          onClick={() => { setEditingProduto(null); setShowModal(true); }}
          className="w-full md:w-auto bg-[#6CC551] text-black px-6 py-3.5 rounded-xl active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#6CC551]/10"
        >
          <Plus size={16} strokeWidth={4} /> Novo Registro
        </button>
      </header>

      {/* MÉTRICAS (Com Blur condicional apenas aqui) */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <MetricCard label="Patrimônio" value={metrics.totalVenda} blur={!showValues} icon={<DollarSign size={14}/>} color="#6CC551" />
        <MetricCard label="Lucro Est." value={metrics.lucroPotencial} blur={!showValues} icon={<TrendingUp size={14}/>} color="#32C5C5" />
        <MetricCard label="SKUs" value={metrics.totalItens} icon={<Layers size={14}/>} color="#A1A1AA" />
        <MetricCard 
          label="Alertas" 
          value={metrics.alertas} 
          icon={<AlertTriangle size={14}/>} 
          color={metrics.alertas > 0 ? "#EF4444" : "#A1A1AA"} 
          isAlert={metrics.alertas > 0}
          active={filterLowStock}
          onClick={() => setFilterLowStock(!filterLowStock)}
        />
      </section>

      {/* FILTROS E BUSCA (Ajustado para impedir zoom mobile) */}
      <div className="space-y-3">
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={16} />
          <input
            type="text"
            placeholder="PROCURAR NO INVENTÁRIO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            // text-base impede o zoom do iOS
            className="w-full bg-zinc-900/40 border border-white/5 p-4 pl-12 rounded-xl outline-none text-base md:text-xs font-black text-white uppercase placeholder:text-[9px] placeholder:text-zinc-800 transition-all"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-1">
          {CATEGORIAS_LISTA.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-5 py-2 rounded-lg text-[8px] font-black uppercase whitespace-nowrap border transition-all ${
                activeCategory === cat 
                  ? 'bg-[#6CC551] text-black border-[#6CC551]' 
                  : 'bg-zinc-900/40 text-zinc-600 border-white/5 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM (Valores sempre visíveis / Sem Blur) */}
      <div className="bg-zinc-900/30 rounded-[1.5rem] border border-white/5 overflow-hidden">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center gap-4 opacity-50">
             <Loader2 className="animate-spin text-[#6CC551]" size={28} />
             <span className="text-[9px] font-black uppercase tracking-widest text-zinc-600">Sincronizando...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredProdutos.map(p => (
              <ProdutoRow key={p.id} produto={p} onEdit={() => { setEditingProduto(p); setShowModal(true); }} />
            ))}
            {filteredProdutos.length === 0 && (
              <div className="py-20 text-center opacity-20">
                <Package size={40} className="mx-auto mb-2" />
                <p className="font-black uppercase text-[9px] tracking-widest">Estoque Vazio</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL / DRAWER */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in" />
          <div 
            className="relative bg-[#0D0D0D] w-full max-w-md rounded-t-[2.5rem] md:rounded-[2rem] border-t md:border border-white/10 p-6 shadow-2xl animate-in slide-in-from-bottom-full duration-300 max-h-[95vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-6 md:hidden" />
            
            <header className="flex justify-between items-start mb-6">
              <div>
                <h4 className="text-xl font-black italic uppercase tracking-tighter text-white">Ficha do Ativo</h4>
                <p className="text-[8px] text-[#6CC551] font-black uppercase tracking-widest mt-1">{editingProduto ? 'Alterar Dados' : 'Novo Cadastro'}</p>
              </div>
              <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-colors">
                <X size={18} />
              </button>
            </header>
            
            <form onSubmit={handleSave} className="space-y-4">
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Nome do Produto</p>
                <input name="nome" defaultValue={editingProduto?.nome} required className="bg-transparent text-white font-black italic uppercase outline-none w-full text-base" placeholder="NOME DO ITEM..." />
              </div>
              
              <div className="bg-zinc-950 p-4 rounded-xl border border-white/5">
                <p className="text-[7px] font-black text-zinc-600 uppercase mb-2 tracking-widest">Categoria</p>
                <select name="categoria" defaultValue={editingProduto?.categoria || CATEGORIAS_LISTA[1]} className="bg-transparent text-zinc-400 font-black text-[10px] outline-none w-full uppercase tracking-widest">
                  {CATEGORIAS_LISTA.filter(c => c !== 'Todos').map(c => (
                    <option key={c} value={c} className="bg-zinc-900">{c}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputBox label="Custo Unit." name="precoCusto" type="number" step="0.01" defaultValue={editingProduto?.precoCusto} color="text-zinc-500" />
                <InputBox label="Venda Unit." name="precoVenda" type="number" step="0.01" defaultValue={editingProduto?.precoVenda} color="text-[#6CC551]" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <InputBox label="Em Estoque" name="estoque" type="number" defaultValue={editingProduto?.estoque} color="text-white" />
                <InputBox label="Mín. Alerta" name="estoqueMinimo" type="number" defaultValue={editingProduto?.estoqueMinimo} color="text-red-500" />
              </div>

              <div className="flex gap-2 pt-4">
                {editingProduto && (
                  <button type="button" onClick={() => handleDelete(editingProduto.id!)} className="p-4 bg-red-500/5 text-red-500 rounded-xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={20}/>
                  </button>
                )}
                <button type="submit" className="flex-1 bg-[#6CC551] text-black font-black py-4 rounded-xl uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#6CC551]/10">
                  <Save size={16} /> Salvar Ativo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
    </div>
  )
}

function MetricCard({ label, value, icon, color, isAlert, active, onClick, blur }: any) {
  return (
    <div 
      onClick={onClick}
      className={`bg-zinc-900 border p-3.5 rounded-xl transition-all cursor-pointer ${
        active ? 'border-[#6CC551] bg-[#6CC551]/10' : isAlert ? 'border-red-500/30' : 'border-white/5'
      }`}
    >
      <div className="flex justify-between items-center mb-1">
        <p className="text-[7px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
        <div style={{ color }}>{icon}</div>
      </div>
      <h3 className={`text-base font-black italic text-white tracking-tighter ${blur ? 'blur-md select-none' : ''}`}>
        {typeof value === 'number' && label !== 'SKUs' && label !== 'Alertas' 
          ? `R$ ${value.toFixed(2)}` 
          : value}
      </h3>
    </div>
  )
}

function ProdutoRow({ produto, onEdit }: { produto: Produto, onEdit: () => void }) {
  const isLow = produto.estoque <= produto.estoqueMinimo;
  return (
    <div 
      onClick={onEdit} 
      className="group flex justify-between items-center p-4 hover:bg-white/[0.02] active:bg-white/[0.04] cursor-pointer transition-all"
    >
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 rounded-lg bg-black border transition-colors flex items-center justify-center ${isLow ? 'border-red-500/20 text-red-500' : 'border-white/5 text-[#6CC551]'}`}>
          <Package size={14} className={isLow ? 'animate-pulse' : ''} />
        </div>
        <div className="max-w-[140px] md:max-w-xs">
          <p className="text-[10px] font-black uppercase italic text-white truncate group-hover:text-[#6CC551] transition-colors leading-tight">
            {produto.nome}
          </p>
          <p className="text-[7px] text-zinc-600 font-bold uppercase tracking-widest mt-0.5">
            {produto.categoria}
          </p>
        </div>
      </div>

      <div className="text-right flex items-center gap-4">
        <div>
          <p className={`text-[10px] font-black italic ${isLow ? 'text-red-500' : 'text-zinc-300'}`}>
            {produto.estoque} <span className="text-[7px] opacity-50 uppercase">un</span>
          </p>
          <p className="text-[8px] font-black text-[#6CC551] mt-0.5">
            R$ {produto.precoVenda.toFixed(2)}
          </p>
        </div>
        <ChevronRight size={14} className="text-zinc-800" />
      </div>
    </div>
  )
}

function InputBox({ label, color, ...props }: any) {
  return (
    <div className="bg-zinc-950 p-4 rounded-xl border border-white/5 focus-within:border-[#6CC551]/20 transition-all">
      <p className="text-[7px] font-black text-zinc-600 uppercase mb-2 tracking-widest">{label}</p>
      <input {...props} className={`bg-transparent ${color} font-black italic outline-none w-full text-base`} placeholder="0.00" />
    </div>
  )
}