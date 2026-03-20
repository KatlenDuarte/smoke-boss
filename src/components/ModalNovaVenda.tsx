import { useState, useEffect, useMemo } from 'react'
import { 
  X, Search, Plus, Minus, Receipt 
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
  const [metodoPagamento, setMetodoPagamento] = useState<'PIX' | 'CARTÃO' | 'DINHEIRO'>('PIX')
  const [desconto, setDesconto] = useState(0)
  const [isSalvando, setIsSalvando] = useState(false)
  const [showCarrinhoMobile, setShowCarrinhoMobile] = useState(false)

  // Busca produtos em tempo real
  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("nome", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ItemCarrinho));
      setProdutos(lista);
    });
    return () => unsubscribe();
  }, []);

  // Filtro de busca
  const produtosFiltrados = useMemo(() => {
    const termo = busca.trim().toLowerCase();
    if (termo.length === 0) return [];
    return produtos.filter(p => p.nome?.toLowerCase().includes(termo));
  }, [busca, produtos]);

  // Cálculos
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
    setIsSalvando(true);

    try {
      const dataHoje = new Date().toLocaleDateString("pt-BR");
      const horaAgora = new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

      // SALVANDO A VENDA COM O CAMPO STORE
      await addDoc(collection(db, "sales"), {
        store: storeEmail, // Identificador da loja
        subtotal,
        desconto,
        total,
        metodoPagamento,
        items: carrinho.map(i => ({ 
          id: i.id, 
          nome: i.nome, 
          qtd: i.qtd, 
          preco: i.precoVenda 
        })),
        timestamp: serverTimestamp(),
        data: dataHoje, 
        hora: horaAgora
      });

      // Atualiza o estoque no Firestore
      for (const item of carrinho) {
        await updateDoc(doc(db, "products", item.id), { 
          estoque: increment(-item.qtd) 
        });
      }

      onSuccess();
      onClose();
    } catch (e) { 
      console.error("Erro ao salvar venda:", e); 
      alert("Erro ao salvar venda. Verifique o console.");
    } finally { 
      setIsSalvando(false); 
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-md flex items-center justify-center p-0 md:p-4 animate-in fade-in duration-300">
      <div className="bg-[#0A0A0A] w-full max-w-7xl md:rounded-[2.5rem] border border-white/10 flex flex-col h-full md:h-[90vh] overflow-hidden shadow-2xl">
        
        {/* Header */}
        <header className="px-5 py-4 border-b border-white/5 flex justify-between items-center bg-[#0D0D0D]">
          <div className="flex items-center gap-3">
            <Receipt className="text-[#6CC551]" size={20} />
            <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">
              PONTO DE <span className="text-[#6CC551]">VENDA</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </header>

        <div className="flex-1 flex flex-col md:flex-row overflow-hidden pb-[130px] md:pb-0">
          
          {/* Lado Esquerdo: Busca e Produtos */}
          <div className="flex-1 flex flex-col bg-[#080808] overflow-hidden">
            <div className="p-4 md:p-8">
              <input
                type="text"
                placeholder="BUSCAR PRODUTO..."
                className="w-full bg-[#0D0D0D] border border-white/5 rounded-2xl py-5 px-6 text-white font-black italic outline-none focus:border-[#6CC551]/30 transition-all uppercase"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
              />
            </div>

            <div className="flex-1 overflow-y-auto px-4 md:px-8 pb-8 no-scrollbar">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {produtosFiltrados.map(prod => (
                  <button
                    key={prod.id}
                    disabled={prod.estoque <= 0}
                    onClick={() => adicionarAoCarrinho(prod)}
                    className="bg-[#0D0D0D] border border-white/5 p-4 rounded-[1.5rem] text-left hover:border-[#6CC551]/30 transition-all disabled:opacity-20"
                  >
                    <h4 className="text-white font-black italic text-[10px] uppercase line-clamp-2">{prod.nome}</h4>
                    <div className="mt-4 flex justify-between items-end">
                      <span className="text-sm font-black text-white italic">R$ {prod.precoVenda.toFixed(2)}</span>
                      <span className="text-[7px] text-zinc-600 font-bold">{prod.estoque} UN</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Lado Direito: Carrinho e Checkout */}
          <aside className={`fixed md:relative inset-x-0 bottom-0 bg-[#0D0D0D] border-t md:border-l border-white/10 flex flex-col md:w-[400px] transition-all z-10 ${showCarrinhoMobile ? 'h-[80vh]' : 'h-[130px] md:h-full'}`}>
            
            {/* Itens do Carrinho */}
            <div className={`flex-1 overflow-y-auto p-6 space-y-3 ${!showCarrinhoMobile && 'hidden md:block'}`}>
              {carrinho.map(item => (
                <div key={item.id} className="bg-[#111] p-4 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="flex-1">
                    <h5 className="text-white text-[10px] font-black uppercase italic">{item.nome}</h5>
                    <p className="text-[#6CC551] text-[10px] font-black">R$ {item.precoVenda.toFixed(2)}</p>
                  </div>
                  <div className="flex items-center gap-3 bg-black/40 p-2 rounded-xl">
                    <button onClick={() => alterarQtd(item.id, -1)} className="text-zinc-600 hover:text-white"><Minus size={12} /></button>
                    <span className="text-white font-black text-xs">{item.qtd}</span>
                    <button onClick={() => adicionarAoCarrinho(item)} className="text-zinc-600 hover:text-white"><Plus size={12} /></button>
                  </div>
                </div>
              ))}
            </div>

            {/* Rodapé do Carrinho */}
            <div className="p-6 bg-[#111] border-t border-white/5 space-y-4">
              <div className="flex justify-between items-end">
                <div>
                  <p className="text-[10px] font-black text-zinc-600 uppercase italic">Total a Pagar</p>
                  <h3 className="text-3xl font-black text-white italic leading-none">R$ {total.toFixed(2)}</h3>
                </div>
                <div className="flex gap-2">
                  {['PIX', 'CARTÃO', 'DINHEIRO'].map(m => (
                    <button 
                      key={m} 
                      onClick={() => setMetodoPagamento(m as any)} 
                      className={`px-3 py-2 rounded-lg text-[8px] font-black border transition-all ${metodoPagamento === m ? 'border-[#6CC551] text-[#6CC551]' : 'border-white/5 text-zinc-600'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              
              <button
                disabled={carrinho.length === 0 || isSalvando}
                onClick={handleFinalizar}
                className="w-full py-5 bg-[#6CC551] text-black font-black rounded-2xl uppercase text-[10px] hover:brightness-110 active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
              >
                {isSalvando ? "PROCESSANDO..." : "FECHAR VENDA"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}