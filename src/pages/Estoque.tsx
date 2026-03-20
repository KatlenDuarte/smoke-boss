import React, { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Package, Trash2, 
  AlertTriangle, DollarSign, TrendingUp, X, Save,
  ChevronRight, Hash, Loader2, Layers, Filter
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
      alert("Erro ao salvar produto.");
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm("Remover este item do inventário?")) {
      try {
        await deleteDoc(doc(db, "products", id));
        setShowModal(false);
      } catch (error) { console.error(error); }
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 md:space-y-8 animate-in fade-in zoom-in-95 duration-500 pb-24 px-4 text-zinc-100">
      
      {/* HEADER PADRÃO DASHBOARD */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pt-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">
              estoque 
            </h2>
          </div>
          <p className="text-[9px] md:text-[10px] text-zinc-500 font-bold uppercase tracking-[0.2em] opacity-80">Gestão de Ativos em Tempo Real</p>
        </div>

        <button 
          onClick={() => { setEditingProduto(null); setShowModal(true); }}
          className="w-full md:w-auto bg-[#6CC551] text-black px-8 py-4 rounded-2xl hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-[#6CC551]/10"
        >
          <Plus size={18} strokeWidth={3} />
          <span>Novo Ativo</span>
        </button>
      </header>

      {/* MÉTRICAS GRID */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <MetricCard label="Patrimônio" value={metrics.totalVenda.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<DollarSign size={16}/>} trend="Total Venda" color="#6CC551" />
        <MetricCard label="Lucro Est." value={metrics.lucroPotencial.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} icon={<TrendingUp size={16}/>} trend="Margem" color="#32C5C5" />
        <MetricCard label="SKUs" value={metrics.totalItens.toString()} icon={<Layers size={16}/>} trend="Cadastrados" color="#A1A1AA" />
        <MetricCard 
          label="Alertas" 
          value={metrics.alertas.toString()} 
          icon={<AlertTriangle size={16}/>} 
          trend="Reposição" 
          color="#EF4444" 
          isAlert={metrics.alertas > 0}
          active={filterLowStock}
          onClick={() => setFilterLowStock(!filterLowStock)}
        />
      </section>

      {/* FILTROS E BUSCA */}
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-12 md:col-span-4 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#6CC551] transition-colors" size={16} />
          <input
            type="text"
            placeholder="PESQUISAR NO INVENTÁRIO..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-zinc-900/30 border border-white/5 p-4 pl-12 rounded-2xl outline-none focus:border-[#6CC551]/30 transition-all text-[11px] font-bold text-white uppercase tracking-wider placeholder:text-zinc-700"
          />
        </div>
        
        <div className="col-span-12 md:col-span-8 flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIAS_LISTA.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase whitespace-nowrap border transition-all ${
                activeCategory === cat 
                  ? 'bg-[#6CC551] text-black border-[#6CC551]' 
                  : 'bg-zinc-900/30 text-zinc-500 border-white/5 hover:border-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* LISTAGEM ESTILO DASHBOARD */}
      <div className="bg-zinc-900/30 backdrop-blur-md rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        {isLoading ? (
          <div className="py-40 flex flex-col items-center justify-center gap-4 opacity-50">
             <Loader2 className="animate-spin text-[#6CC551]" size={32} />
             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Sincronizando Nuvem...</span>
          </div>
        ) : (
          <div className="divide-y divide-white/[0.03]">
            {filteredProdutos.map(p => (
              <ProdutoRow key={p.id} produto={p} onEdit={() => { setEditingProduto(p); setShowModal(true); }} />
            ))}
            {filteredProdutos.length === 0 && (
              <div className="py-40 text-center opacity-20">
                <Package size={48} className="mx-auto mb-4" />
                <p className="font-black uppercase text-xs tracking-widest">Nenhum item encontrado</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL / DRAWER (IGUAL AO DASHBOARD) */}
      {showModal && (
        <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={() => setShowModal(false)}>
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md animate-in fade-in" />
          <div 
            className="relative bg-[#0D0D0D] w-full max-w-md rounded-t-[2.5rem] md:rounded-[3rem] border-t md:border border-white/10 p-6 md:p-10 shadow-2xl animate-in slide-in-from-bottom-10 md:zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" 
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-8 md:hidden" />
            
            <div className="flex justify-between items-start mb-8">
                <div>
                  <h4 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Ficha Técnica</h4>
                  <p className="text-[9px] text-[#6CC551] font-black uppercase tracking-[0.2em] mt-2">{editingProduto ? 'Edição de Ativo' : 'Novo Registro'}</p>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 bg-white/5 rounded-full text-zinc-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
            </div>
            
            <form onSubmit={handleSave} className="space-y-6">
              <div className="space-y-4">
                <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 focus-within:border-[#6CC551]/30 transition-all">
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Nome do Produto</p>
                  <input name="nome" defaultValue={editingProduto?.nome} required className="bg-transparent text-white font-black italic uppercase outline-none w-full text-sm" placeholder="EX: SEDA SMOKING RED" />
                </div>
                
                <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5">
                  <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">Categoria</p>
                  <select name="categoria" defaultValue={editingProduto?.categoria || CATEGORIAS_LISTA[1]} className="bg-transparent text-zinc-400 font-black text-[10px] outline-none w-full uppercase tracking-widest">
                    {CATEGORIAS_LISTA.filter(c => c !== 'Todos').map(c => (
                      <option key={c} value={c} className="bg-zinc-900">{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputBox label="Custo Unit." name="precoCusto" type="number" step="0.01" value={editingProduto?.precoCusto} color="text-zinc-400" />
                <InputBox label="Venda Unit." name="precoVenda" type="number" step="0.01" value={editingProduto?.precoVenda} color="text-[#6CC551]" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <InputBox label="Em Estoque" name="estoque" type="number" value={editingProduto?.estoque} color="text-white" />
                <InputBox label="Mín. Alerta" name="estoqueMinimo" type="number" value={editingProduto?.estoqueMinimo} color="text-red-500" />
              </div>

              <div className="flex gap-3 pt-6">
                {editingProduto && (
                  <button type="button" onClick={() => handleDelete(editingProduto.id!)} className="p-5 bg-red-500/10 text-red-500 rounded-2xl border border-red-500/10 hover:bg-red-500 hover:text-white transition-all">
                    <Trash2 size={22}/>
                  </button>
                )}
                <button type="submit" className="flex-1 bg-[#6CC551] text-black font-black py-5 rounded-2xl uppercase text-[11px] tracking-[0.2em] flex items-center justify-center gap-2 hover:brightness-110 active:scale-95 transition-all shadow-xl shadow-[#6CC551]/10">
                  <Save size={18} /> SALVAR ALTERAÇÕES
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

/* COMPONENTES COMPARTILHADOS (PADRÃO DASHBOARD) */

function MetricCard({ label, value, icon, trend, color, isAlert, active, onClick }: any) {
  return (
    <div 
      onClick={onClick}
      className={`relative bg-zinc-900/40 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border transition-all cursor-pointer ${
        active ? 'border-[#6CC551] bg-[#6CC551]/5' : isAlert ? 'border-red-500/30 shadow-[0_0_20px_rgba(239,68,68,0.05)]' : 'border-white/5 hover:border-white/10'
      } overflow-hidden`}
    >
      <div className="flex justify-between items-start mb-4 relative z-10">
        <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5" style={{ color: color }}>
          {icon}
        </div>
        <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-lg border border-white/5">
          <span className="text-[7px] md:text-[8px] font-black uppercase tracking-widest" style={{ color: color }}>{trend}</span>
        </div>
      </div>
      <div className="relative z-10">
        <span className="text-[8px] md:text-[9px] font-black uppercase text-zinc-500 tracking-widest block mb-0.5">{label}</span>
        <div className="text-lg md:text-2xl font-black text-white italic tracking-tighter truncate">{value}</div>
      </div>
      {isAlert && <div className="absolute top-0 right-0 w-16 h-16 bg-red-500/5 blur-2xl rounded-full" />}
    </div>
  )
}

function ProdutoRow({ produto, onEdit }: { produto: Produto, onEdit: () => void }) {
  const isLow = produto.estoque <= produto.estoqueMinimo;
  return (
    <div 
      onClick={onEdit} 
      className="group flex justify-between items-center p-4 md:p-6 hover:bg-white/[0.03] active:bg-white/[0.05] cursor-pointer transition-all"
    >
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-2xl bg-zinc-950 border transition-colors ${isLow ? 'border-red-500/40 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.1)]' : 'border-white/5 text-[#6CC551]'}`}>
          <Package size={20} className={isLow ? 'animate-pulse' : ''} />
        </div>
        <div className="max-w-[150px] md:max-w-md">
          <p className="text-[11px] md:text-sm font-black uppercase italic text-zinc-100 truncate group-hover:text-[#6CC551] transition-colors">
            {produto.nome}
          </p>
          <p className="text-[7px] md:text-[8px] text-zinc-600 font-bold uppercase tracking-widest mt-1">
            {produto.categoria}
          </p>
        </div>
      </div>

      <div className="text-right flex items-center gap-4 md:gap-8">
        <div className="hidden md:block">
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5">Estoque</p>
          <p className={`text-xs font-black italic ${isLow ? 'text-red-500' : 'text-zinc-300'}`}>
            {produto.estoque} <span className="text-[9px]">UN</span>
          </p>
        </div>
        
        <div>
          <p className="text-[8px] font-black text-zinc-600 uppercase mb-0.5 text-right">Preço Venda</p>
          <p className="text-xs md:text-sm font-black italic text-[#6CC551]">
            R$ {produto.precoVenda.toFixed(2)}
          </p>
        </div>
        
        <ChevronRight size={16} className="text-zinc-800 group-hover:text-[#6CC551] transition-colors" />
      </div>
    </div>
  )
}

function InputBox({ label, color, ...props }: any) {
  return (
    <div className="bg-zinc-950 p-4 rounded-2xl border border-white/5 focus-within:border-white/10 transition-all">
      <p className="text-[8px] font-black text-zinc-600 uppercase mb-2">{label}</p>
      <input {...props} className={`bg-transparent ${color} font-black italic outline-none w-full text-sm`} placeholder="0.00" />
    </div>
  )
}