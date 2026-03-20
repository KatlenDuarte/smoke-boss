import React, { useState, useMemo } from 'react'
import { 
  Plus, Search, Package, Edit, Trash2, 
  AlertTriangle, TrendingUp, DollarSign, 
  ArrowUpRight, X
} from 'lucide-react'

// --- INTERFACES ---
interface Produto {
  _id: string;
  nome: string;
  categoria: string;
  precoCusto: number;
  precoVenda: number;
  estoque: number;
  estoqueMinimo: number;
}

// --- COMPONENTE MODAL (CORRIGIDO E INTEGRADO) ---
function ModalProduto({ produto, onClose, onSave }: { produto: Produto | null, onClose: () => void, onSave: (p: Produto) => void }) {
  const [formData, setFormData] = useState<Produto>(produto || {
    _id: Math.random().toString(36).substr(2, 9),
    nome: '',
    categoria: 'Geral',
    precoCusto: 0,
    precoVenda: 0,
    estoque: 0,
    estoqueMinimo: 0
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 animate-in fade-in duration-200">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-lg bg-[#0A0A0A] border-t md:border border-zinc-800 rounded-t-[2rem] md:rounded-[2.5rem] p-6 md:p-10 shadow-2xl transform animate-in slide-in-from-bottom duration-300">
        <div className="w-12 h-1.5 bg-zinc-800 rounded-full mx-auto mb-8 md:hidden" />

        <div className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">
              {produto ? 'Editar' : 'Novo'} <span className="text-[#6CC551]">Item</span>
            </h2>
            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">ID: {formData._id}</p>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Identificação do Ativo</label>
            <input 
              type="text" 
              value={formData.nome}
              onChange={(e) => setFormData({...formData, nome: e.target.value})}
              className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-[#6CC551]/50 transition-all font-bold"
              placeholder="Ex: Narguilé Batman Gold"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Custo (R$)</label>
              <input 
                type="number" 
                value={formData.precoCusto}
                onChange={(e) => setFormData({...formData, precoCusto: Number(e.target.value)})}
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-[#6CC551]/50 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-[#6CC551] uppercase tracking-widest ml-2">Venda (R$)</label>
              <input 
                type="number" 
                value={formData.precoVenda}
                onChange={(e) => setFormData({...formData, precoVenda: Number(e.target.value)})}
                className="w-full bg-zinc-900/50 border border-[#6CC551]/20 p-4 rounded-2xl text-[#6CC551] outline-none focus:border-[#6CC551] transition-all font-black text-lg"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-600 uppercase tracking-widest ml-2">Qtd Atual</label>
              <input 
                type="number" 
                value={formData.estoque}
                onChange={(e) => setFormData({...formData, estoque: Number(e.target.value)})}
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-white outline-none focus:border-[#6CC551]/50 transition-all font-bold"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-red-500/70 uppercase tracking-widest ml-2">Aviso Mínimo</label>
              <input 
                type="number" 
                value={formData.estoqueMinimo}
                onChange={(e) => setFormData({...formData, estoqueMinimo: Number(e.target.value)})}
                className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-2xl text-red-500 outline-none focus:border-red-500/50 transition-all font-bold"
              />
            </div>
          </div>

          <button 
            onClick={() => onSave(formData)}
            className="w-full bg-[#6CC551] text-black font-black uppercase tracking-[0.2em] py-5 rounded-2xl mt-4 shadow-[0_10px_30px_rgba(108,197,81,0.3)] active:scale-95 transition-all"
          >
            Confirmar Alterações
          </button>
        </div>
      </div>
    </div>
  )
}

// --- COMPONENTE PRINCIPAL ---
export default function EstoqueBoss() {
  const [searchTerm, setSearchTerm] = useState('')
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [filterLowStock, setFilterLowStock] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
  
  const [produtos, setProdutos] = useState<Produto[]>([
    { _id: '1', nome: 'Cuia Verde com Laranja', categoria: '🧉 Cuias', precoCusto: 10.00, precoVenda: 19.99, estoque: 15, estoqueMinimo: 5 },
    { _id: '2', nome: 'Narguilé Batman', categoria: '💨 Narguilés', precoCusto: 180.00, precoVenda: 279.90, estoque: 2, estoqueMinimo: 3 },
    { _id: '3', nome: 'Dichavador Ferro Bitcoin', categoria: '⚙️ Dichavas', precoCusto: 45.00, precoVenda: 89.90, estoque: 12, estoqueMinimo: 4 },
    { _id: '4', nome: 'Tabaco Acrema Blend', categoria: '🍃 Tabacos', precoCusto: 12.00, precoVenda: 22.90, estoque: 45, estoqueMinimo: 10 },
  ])

  const categorias = ['Todos', '🧉 Cuias', '💨 Narguilés', '⚙️ Dichavas', '🍃 Tabacos']

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
    const alertas = produtos.filter(p => p.estoque <= p.estoqueMinimo).length
    const totalCusto = produtos.reduce((acc, p) => acc + (p.precoCusto * p.estoque), 0)
    return { totalVenda, alertas, lucroPotencial: totalVenda - totalCusto }
  }, [produtos])

  const handleEdit = (p: Produto) => {
    setSelectedProduto(p);
    setShowModal(true);
  }

  const handleDelete = (id: string) => {
    if (window.confirm("Remover este item do inventário?")) {
      setProdutos(produtos.filter(p => p._id !== id))
    }
  }

  const handleSave = (produtoEditado: Produto) => {
    if (selectedProduto) {
      setProdutos(produtos.map(p => p._id === produtoEditado._id ? produtoEditado : p));
    } else {
      setProdutos([produtoEditado, ...produtos]);
    }
    setShowModal(false);
    setSelectedProduto(null);
  }

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-300 antialiased pb-20 overflow-x-hidden font-sans">
      
      {/* HEADER */}
      <header className="p-4 md:p-12 max-w-[1400px] mx-auto space-y-10">
        <div className="flex justify-between items-center md:items-end">
          <div className="animate-in slide-in-from-left duration-500">
            <div className="flex items-center gap-3 mb-1">
              <div className="w-1.5 h-8 bg-[#6CC551] rounded-full shadow-[0_0_15px_#6CC551]" />
              <h1 className="text-2xl md:text-4xl font-black text-white italic uppercase tracking-tighter">
                Estoque <span className="text-[#6CC551]">Boss</span>
              </h1>
            </div>
            <p className="text-[8px] md:text-[10px] text-zinc-600 font-bold uppercase tracking-[0.4em] ml-5">Sistema de Gestão de Ativos</p>
          </div>
          
          <button 
            onClick={() => { setSelectedProduto(null); setShowModal(true); }}
            className="bg-[#6CC551] text-black p-3 md:px-8 md:py-4 rounded-xl md:rounded-2xl active:scale-95 transition-all shadow-lg flex items-center gap-2"
          >
            <Plus size={20} strokeWidth={3} />
            <span className="hidden md:block font-black uppercase text-xs tracking-widest">Novo Item</span>
          </button>
        </div>

        {/* MÉTRICAS */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-6 animate-in zoom-in duration-700">
          <MetricCard label="Patrimônio" value={`R$ ${metrics.totalVenda.toLocaleString('pt-BR')}`} icon={<DollarSign size={18}/>} />
          <MetricCard label="Lucro Estimado" value={`R$ ${metrics.lucroPotencial.toLocaleString('pt-BR')}`} icon={<TrendingUp size={18}/>} color="text-[#32C5C5]" />
          <div className="col-span-2 md:col-span-1">
            <MetricCard 
              label="Alertas Críticos" 
              value={`${metrics.alertas} Itens`} 
              icon={<AlertTriangle size={18}/>} 
              color={metrics.alertas > 0 ? "text-red-500" : "text-zinc-500"}
              onClick={() => setFilterLowStock(!filterLowStock)}
              active={filterLowStock}
              pulse={metrics.alertas > 0}
            />
          </div>
        </div>
      </header>

      {/* FILTROS E PESQUISA */}
      <main className="px-4 md:px-12 max-w-[1400px] mx-auto space-y-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1 group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700 group-focus-within:text-[#6CC551] transition-colors" size={18} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Pesquisar no inventário..."
              className="w-full bg-zinc-900/40 border border-zinc-800 p-4 pl-14 rounded-2xl text-white outline-none focus:border-[#6CC551]/40 transition-all"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto scrollbar-hide py-1">
            {categorias.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-6 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all whitespace-nowrap ${
                  activeCategory === cat ? 'bg-white text-black border-white' : 'bg-zinc-900/40 text-zinc-500 border-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* LISTAGEM */}
        <div className="bg-zinc-900/20 border border-zinc-800/50 md:rounded-[2.5rem] backdrop-blur-xl overflow-hidden">
          {/* VIEW DESKTOP */}
          <div className="hidden md:block">
            <table className="w-full text-left">
              <thead className="border-b border-zinc-800/50 bg-white/[0.01]">
                <tr>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-zinc-600 tracking-widest w-16 italic text-center">#</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest">Item</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-center">Estoque</th>
                  <th className="px-6 py-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Preço</th>
                  <th className="px-10 py-6 text-[10px] font-black uppercase text-zinc-500 tracking-widest text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/30">
                {filteredProdutos.map((p, idx) => (
                  <tr key={p._id} onClick={() => handleEdit(p)} className="hover:bg-white/[0.02] transition-all group cursor-pointer">
                    <td className="px-10 py-7 text-xs font-black italic text-zinc-800 group-hover:text-[#6CC551] text-center">{idx + 1}</td>
                    <td className="px-6 py-7 font-bold text-white uppercase italic text-sm">{p.nome}</td>
                    <td className="px-6 py-7 text-center">
                      <span className={`text-xs font-black ${p.estoque <= p.estoqueMinimo ? 'text-red-500' : 'text-zinc-200'}`}>
                        {p.estoque} UN
                      </span>
                    </td>
                    <td className="px-6 py-7 text-right font-black text-[#6CC551]">R$ {p.precoVenda.toFixed(2)}</td>
                    <td className="px-10 py-7 text-right">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button className="p-2 bg-zinc-800 rounded-lg hover:bg-white hover:text-black"><Edit size={14}/></button>
                        <button onClick={(e) => { e.stopPropagation(); handleDelete(p._id); }} className="p-2 bg-zinc-800 rounded-lg hover:bg-red-600"><Trash2 size={14}/></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* VIEW MOBILE */}
          <div className="md:hidden space-y-3 p-2">
            {filteredProdutos.map(p => (
              <MobileCard key={p._id} produto={p} onEdit={() => handleEdit(p)} onDelete={() => handleDelete(p._id)} />
            ))}
          </div>
        </div>
      </main>

      {/* MODAL */}
      {showModal && <ModalProduto produto={selectedProduto} onClose={() => setShowModal(false)} onSave={handleSave} />}
    </div>
  )
}

function MetricCard({ label, value, icon, color = "text-white", onClick, active, pulse }: any) {
  return (
    <div onClick={onClick} className={`p-5 md:p-8 rounded-[1.5rem] md:rounded-[2rem] border transition-all cursor-pointer ${active ? 'bg-[#6CC551]/10 border-[#6CC551]' : 'bg-zinc-900/40 border-zinc-800'}`}>
      <div className={`p-2 bg-black/40 rounded-xl w-fit mb-4 ${active ? 'text-[#6CC551]' : 'text-zinc-500'}`}>
        {icon}
        {pulse && <span className="absolute w-2 h-2 bg-red-500 rounded-full animate-ping" />}
      </div>
      <p className="text-[8px] md:text-[10px] font-black text-zinc-600 uppercase tracking-widest">{label}</p>
      <h3 className={`text-sm md:text-2xl font-black italic ${color}`}>{value}</h3>
    </div>
  )
}

function MobileCard({ produto, onEdit, onDelete }: { produto: Produto, onEdit: () => void, onDelete: () => void }) {
  const isLow = produto.estoque <= produto.estoqueMinimo;
  return (
    <div className="flex gap-2 items-center">
      <div onClick={onEdit} className="flex-1 bg-[#0D0D0D] border border-white/[0.03] p-4 rounded-2xl flex justify-between items-center active:scale-95 transition-all">
        <div className="flex items-center gap-3">
          <div className={`w-1 h-6 rounded-full ${isLow ? 'bg-red-500 animate-pulse' : 'bg-[#6CC551]'}`} />
          <div className="text-left">
            <h4 className="text-[11px] font-black text-white uppercase italic">{produto.nome}</h4>
            <p className="text-[8px] text-zinc-600 font-bold uppercase tracking-widest">{produto.estoque} UN DISPONÍVEL</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-xs font-black text-[#6CC551] italic">R$ {produto.precoVenda.toFixed(2)}</p>
        </div>
      </div>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-4 bg-red-950/20 text-red-600 rounded-2xl border border-red-900/20"><Trash2 size={16}/></button>
    </div>
  )
}