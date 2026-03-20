import { useState } from 'react'
import { X, ShoppingCart, Trash2, CreditCard, Banknote, QrCode } from 'lucide-react'

interface ModalProps {
  onClose: () => void;
  onSuccess: (venda: any) => void;
}

export default function ModalNovaVenda({ onClose, onSuccess }: ModalProps) {
  const [carrinho, setCarrinho] = useState<any[]>([])
  const [formaPagamento, setFormaPagamento] = useState('Dinheiro')
  const [valorPago, setValorPago] = useState(0)

  const total = carrinho.reduce((sum, item) => sum + (item.preco * item.qtd), 0)
  const troco = valorPago - total

  // Função para simular a adição de um produto
  const adicionarProduto = () => {
    const item = { 
      id: Date.now(), 
      nome: "Seda Smoking + Filtro", 
      preco: 15.00, 
      qtd: 1 
    }
    setCarrinho([...carrinho, item])
  }

  const handleFinalizar = () => {
    if (carrinho.length === 0) return

    const dadosVenda = {
      id: `SB-${Math.floor(1000 + Math.random() * 9000)}`,
      total,
      metodo: formaPagamento,
      hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itens: carrinho.length,
      troco: troco > 0 ? troco : 0
    }
    
    onSuccess(dadosVenda)
  }

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center md:p-6 animate-in fade-in zoom-in duration-300">
      <div className="w-full h-full max-w-6xl bg-[#080808] md:rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(108,197,81,0.1)]">
        
        {/* HEADER DO MODAL */}
        <div className="p-6 border-b border-white/5 flex justify-between items-center bg-[#0D0D0D]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6CC551]/10 rounded-xl flex items-center justify-center text-[#6CC551]">
              <ShoppingCart size={20} />
            </div>
            <h2 className="text-xl font-black italic uppercase text-white tracking-tighter">
              Novo <span className="text-[#6CC551]">Checkout</span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
          {/* LADO ESQUERDO: CARRINHO */}
          <div className="flex-1 p-8 overflow-y-auto custom-scrollbar bg-[radial-gradient(circle_at_top_left,_#111_0%,_transparent_40%)]">
            <button 
              onClick={adicionarProduto} 
              className="mb-6 w-full py-8 border-2 border-dashed border-white/5 rounded-3xl text-gray-500 font-black uppercase text-[10px] tracking-widest hover:border-[#6CC551]/50 hover:text-[#6CC551] hover:bg-[#6CC551]/5 transition-all group"
            >
              <Plus size={24} className="mx-auto mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
              Bipar ou Adicionar Produto
            </button>

            <div className="space-y-3">
              {carrinho.length === 0 ? (
                <div className="py-20 text-center opacity-10">
                  <ShoppingCart size={64} className="mx-auto mb-4" />
                  <p className="font-black uppercase tracking-widest">Carrinho Vazio</p>
                </div>
              ) : (
                carrinho.map(item => (
                  <div key={item.id} className="flex justify-between items-center bg-[#0D0D0D] p-5 rounded-2xl border border-white/5 animate-in slide-in-from-right-4">
                    <div>
                      <span className="font-black uppercase italic text-sm text-white">{item.nome}</span>
                      <p className="text-[10px] text-gray-500 font-bold uppercase">UN. R$ {item.preco.toFixed(2)}</p>
                    </div>
                    <div className="flex items-center gap-6">
                      <span className="font-black text-white italic">R$ {item.preco.toFixed(2)}</span>
                      <button 
                        onClick={() => setCarrinho([])} 
                        className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/5 text-red-900 hover:text-red-500 hover:bg-red-500/10 transition-all"
                      >
                        <Trash2 size={16}/>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* LADO DIREITO: PAGAMENTO */}
          <div className="w-full lg:w-[450px] bg-[#0D0D0D] p-8 border-l border-white/5 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
            <div className="mb-10">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Total a Pagar</p>
              <p className="text-6xl font-black text-white italic tracking-tighter">
                <span className="text-[20px] not-italic text-[#6CC551] mr-2">R$</span>
                {total.toFixed(2)}
              </p>
            </div>

            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-4">Forma de Pagamento</p>
            <div className="grid grid-cols-2 gap-3 mb-8">
              {[
                { id: 'Dinheiro', icon: Banknote },
                { id: 'PIX', icon: QrCode },
                { id: 'Cartão', icon: CreditCard }
              ].map(m => (
                <button 
                  key={m.id} 
                  onClick={() => setFormaPagamento(m.id)} 
                  className={`p-5 rounded-2xl border flex flex-col items-center gap-3 transition-all ${
                    formaPagamento === m.id 
                    ? 'bg-[#6CC551] text-black border-[#6CC551] shadow-[0_0_20px_rgba(108,197,81,0.3)]' 
                    : 'bg-[#111] text-gray-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  <m.icon size={20} />
                  <span className="text-[9px] font-black uppercase tracking-tighter">{m.id}</span>
                </button>
              ))}
            </div>

            {formaPagamento === 'Dinheiro' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Valor Recebido</p>
                <input 
                  type="number" 
                  autoFocus
                  placeholder="0,00"
                  className="w-full bg-[#111] border border-white/10 rounded-2xl p-6 text-white text-2xl font-black mb-2 focus:border-[#6CC551] outline-none transition-all"
                  onChange={(e) => setValorPago(Number(e.target.value))}
                />
                {troco > 0 && (
                  <div className="p-4 bg-[#6CC551]/10 rounded-xl border border-[#6CC551]/20 flex justify-between items-center mb-6">
                    <span className="text-[10px] font-black text-[#6CC551] uppercase">Troco:</span>
                    <span className="font-black text-[#6CC551]">R$ {troco.toFixed(2)}</span>
                  </div>
                )}
              </div>
            )}

            <button 
              disabled={carrinho.length === 0}
              onClick={handleFinalizar}
              className="mt-auto w-full py-7 bg-[#6CC551] text-black rounded-[2rem] font-black uppercase text-sm tracking-[0.2em] shadow-[0_20px_40px_-10px_rgba(108,197,81,0.4)] active:scale-95 disabled:opacity-20 disabled:grayscale transition-all"
            >
              Confirmar Venda
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}