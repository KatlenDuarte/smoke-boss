import { useState, useEffect, useMemo } from 'react'
import {
  X, Search, Plus, Minus, Receipt, ShoppingCart, ChevronUp, Tag, User
} from 'lucide-react'
import {
  collection, addDoc, serverTimestamp, doc,
  updateDoc, increment, onSnapshot, query, orderBy
} from "firebase/firestore";
import { db } from "../lib/firebase";

interface ItemCarrinho {
  id: string;
  nome: string;
  qtd: number;
  precoVenda: number;
  estoque: number;
  categoria?: string;
}

export default function ModalNovaVenda({ onClose, onSuccess, storeEmail }: { onClose: () => void, onSuccess: () => void, storeEmail: string }) {
  const [busca, setBusca] = useState("")
  const [produtos, setProdutos] = useState<ItemCarrinho[]>([])
  const [carrinho, setCarrinho] = useState<ItemCarrinho[]>([])
  const [vendedores, setVendedores] = useState<{id: string, nome: string}[]>([])
  const [vendedorSelecionado, setVendedorSelecionado] = useState("")
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTÃO' | 'DINHEIRO'>('PIX')
  const [desconto, setDesconto] = useState(0)
  const [isSalvando, setIsSalvando] = useState(false)
  const [showCarrinhoMobile, setShowCarrinhoMobile] = useState(false)

  // Busca Produtos e Vendedores
  useEffect(() => {
    // Listener de Produtos
    const qProd = query(collection(db, "products"), orderBy("nome", "asc"));
    const unsubProd = onSnapshot(qProd, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemCarrinho));
      setProdutos(lista);
    });

    // Listener de Vendedores
    const qVend = query(collection(db, "sellers"), orderBy("nome", "asc"));
    const unsubVend = onSnapshot(qVend, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, nome: doc.data().nome }));
      setVendedores(lista);
    });

    return () => {
      unsubProd();
      unsubVend();
    };
  }, []);

  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo.length === 0) return [];
    return produtos.filter(p => p.nome?.toLowerCase().includes(termo));
  }, [busca, produtos]);

  const subtotal = carrinho.reduce((sum, item) => sum + (item.precoVenda * item.qtd), 0);
  const total = Math.max(0, subtotal - desconto);

  const adicionarAoCarrinho = (produto: ItemCarrinho) => {
    if (produto.estoque <= 0) return;
    setCarrinho(prev => {
      const existe = prev.find(item => item.id === produto.id);
      if (existe) {
        if (existe.qtd >= produto.estoque) return prev;
        return prev.map(item => item.id === produto.id ? { ...item, qtd: item.qtd + 1 } : item);
      }
      return [...prev, { ...produto, qtd: 1 }];
    });
    setBusca("");
  };

  const alterarQtd = (id: string, delta: number) => {
    setCarrinho(prev => prev.map(item => {
      if (item.id === id) {
        const prodOriginal = produtos.find(p => p.id === id);
        const novaQtd = item.qtd + delta;
        if (novaQtd > (prodOriginal?.estoque || 0)) return item;
        return { ...item, qtd: Math.max(0, novaQtd) };
      }
      return item;
    }).filter(i => i.qtd > 0));
  };

const handleFinalizar = async () => {
  if (carrinho.length === 0 || isSalvando) return;
  if (!vendedorSelecionado) {
    alert("Selecione um vendedor antes de finalizar!");
    return;
  }

  setIsSalvando(true);
  try {
    // FORMATO PADRONIZADO (FORÇA DD/MM/YYYY)
    const agora = new Date();
    const dia = String(agora.getDate()).padStart(2, '0');
    const mes = String(agora.getMonth() + 1).padStart(2, '0');
    const ano = agora.getFullYear();
    const dataPadronizada = `${dia}/${mes}/${ano}`;
    
    const horaAgora = agora.toLocaleTimeString("pt-BR", { 
      hour: "2-digit", 
      minute: "2-digit" 
    });

    await addDoc(collection(db, "sales"), {
      store: storeEmail,
      vendedor: vendedorSelecionado,
      subtotal,
      desconto,
      total,
      metodoPagamento,
      items: carrinho.map(i => ({ id: i.id, nome: i.nome, qtd: i.qtd, preco: i.precoVenda })),
      timestamp: serverTimestamp(), // OBRIGATÓRIO PARA O ORDERBY FUNCIONAR
      data: dataPadronizada, // Salva o formato fixo
      hora: horaAgora
    });

      for (const item of carrinho) {
        await updateDoc(doc(db, "products", item.id), { estoque: increment(-item.qtd) });
      }
      onSuccess();
      onClose();
    } catch (e) {
      alert("Erro ao salvar venda.");
    } finally {
      setIsSalvando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4">
      <div className="bg-[#0A0A0A] w-full max-w-7xl md:rounded-[2rem] border border-white/10 flex flex-col h-full md:h-[90vh] overflow-hidden shadow-2xl">

        <header className="px-6 py-4 border-b border-white/5 flex justify-between items-center bg-[#0D0D0D]">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6CC551]/10 rounded-lg">
              <Receipt className="text-[#6CC551]" size={20} />
            </div>
            <h2 className="text-sm font-black text-white italic uppercase tracking-widest">
              CAIXA <span className="text-[#6CC551]">LIVRE</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-zinc-500 hover:text-white transition-all">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden relative">

          <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
            <div className="p-4 md:p-6">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#6CC551] transition-colors" size={20} />
                <input
                  type="text"
                  placeholder="PROCURAR PRODUTO..."
                  className="w-full bg-[#0D0D0D] border border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white font-bold outline-none focus:border-[#6CC551]/30 transition-all uppercase text-base md:text-sm placeholder:text-[10px] placeholder:tracking-widest"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-6 pb-32 md:pb-8 no-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {produtosFiltrados.map(prod => (
                  <button
                    key={prod.id}
                    disabled={prod.estoque <= 0}
                    onClick={() => adicionarAoCarrinho(prod)}
                    className="bg-[#0D0D0D] border border-white/5 p-4 rounded-2xl text-left hover:border-[#6CC551]/30 active:scale-95 transition-all disabled:opacity-20 group"
                  >
                    <h4 className="text-white font-black italic text-[10px] uppercase line-clamp-2 group-hover:text-[#6CC551] transition-colors h-8">{prod.nome}</h4>
                    <div className="mt-4 flex justify-between items-center">
                      <span className="text-sm font-black text-white">R$ {prod.precoVenda.toFixed(2)}</span>
                      <span className="text-[8px] text-zinc-600 font-bold bg-white/5 px-2 py-1 rounded">{prod.estoque} UN</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className={`
            fixed md:relative inset-x-0 bottom-0 bg-[#0D0D0D] border-t md:border-l border-white/10 flex flex-col 
            md:w-[400px] transition-all duration-500 z-50
            ${showCarrinhoMobile ? 'h-[85vh]' : 'h-[100px] md:h-full'}
          `}>

            <button
              onClick={() => setShowCarrinhoMobile(!showCarrinhoMobile)}
              className="md:hidden w-full h-[100px] px-6 flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <div className="bg-[#6CC551] p-3 rounded-xl text-black shadow-lg shadow-[#6CC551]/20">
                  <ShoppingCart size={20} />
                </div>
                <div className="text-left">
                  <p className="text-[10px] font-black text-zinc-500 uppercase">Carrinho ({carrinho.length})</p>
                  <p className="text-xl font-black text-white italic leading-none">R$ {total.toFixed(2)}</p>
                </div>
              </div>
              <ChevronUp className={`text-zinc-500 transition-transform ${showCarrinhoMobile ? 'rotate-180' : ''}`} />
            </button>

            <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${!showCarrinhoMobile && 'hidden md:block'}`}>
              <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4">Itens Selecionados</h3>
              {carrinho.map(item => (
                <div key={item.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-white text-[10px] font-black uppercase italic line-clamp-1">{item.nome}</h5>
                    <p className="text-[#6CC551] text-[11px] font-black">R$ {item.precoVenda.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl border border-white/5">
                    <button onClick={() => alterarQtd(item.id, -1)} className="text-zinc-500 hover:text-white p-1"><Minus size={14} /></button>
                    <span className="text-white font-black text-xs min-w-[15px] text-center">{item.qtd}</span>
                    <button onClick={() => adicionarAoCarrinho(item)} className="text-zinc-500 hover:text-white p-1"><Plus size={14} /></button>
                  </div>
                </div>
              ))}
            </div>

            <div className={`p-6 bg-black/40 border-t border-white/5 space-y-4 ${!showCarrinhoMobile && 'hidden md:block'}`}>
              
              {/* CAMPO SELEÇÃO DE VENDEDOR */}
              <div className="space-y-2">
                <label className="text-[8px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <User size={10} className="text-[#6CC551]" /> Vendedor Responsável
                </label>
                <select 
                  value={vendedorSelecionado}
                  onChange={(e) => setVendedorSelecionado(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-xs font-bold text-white outline-none focus:border-[#6CC551]/30 appearance-none uppercase italic"
                >
                  <option value="" className="bg-[#0A0A0A]">SELECIONAR VENDEDOR...</option>
                  {vendedores.map(v => (
                    <option key={v.id} value={v.nome} className="bg-[#0A0A0A]">{v.nome}</option>
                  ))}
                </select>
              </div>

              <div className="relative group">
                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-600 group-focus-within:text-[#6CC551]" size={16} />
                <input
                  type="number"
                  placeholder="VALOR DO DESCONTO (R$)"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-12 pr-4 text-base md:text-xs font-bold text-white outline-none focus:border-[#6CC551]/30 transition-all placeholder:text-[9px] placeholder:font-black"
                  value={desconto || ''}
                  onChange={(e) => setDesconto(Number(e.target.value))}
                />
              </div>

              <div className="grid grid-cols-3 gap-1">
                {['PIX', 'CARTÃO', 'DINHEIRO'].map(m => (
                  <button
                    key={m}
                    onClick={() => setMetodoPagamento(m as any)}
                    className={`py-3 rounded-xl text-[9px] font-black border transition-all ${metodoPagamento === m ? 'border-[#6CC551] bg-[#6CC551]/10 text-[#6CC551]' : 'border-white/5 text-zinc-600'}`}
                  >
                    {m}
                  </button>
                ))}
              </div>

              <div className="pt-2 border-t border-white/5">
                <div className="flex justify-between items-end mb-4">
                  <div>
                    <p className="text-[10px] font-black text-zinc-600 uppercase italic">Total Final</p>
                    <h3 className="text-3xl font-black text-white italic leading-none">R$ {total.toFixed(2)}</h3>
                  </div>
                  {desconto > 0 && (
                    <span className="text-[10px] font-bold text-red-500 bg-red-500/10 px-2 py-1 rounded">
                      -R$ {desconto.toFixed(2)}
                    </span>
                  )}
                </div>

                <button
                  disabled={carrinho.length === 0 || isSalvando || !vendedorSelecionado}
                  onClick={handleFinalizar}
                  className="w-full py-5 bg-[#6CC551] text-black font-black rounded-2xl uppercase text-[12px] shadow-lg shadow-[#6CC551]/20 hover:brightness-110 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                >
                  {isSalvando ? "PROCESSANDO..." : "FINALIZAR VENDA"}
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}