import { ArrowUpRight, Clock, User, CreditCard } from 'lucide-react'

export default function Historico() {
  // Aqui você buscaria as vendas do seu banco
  const vendas = [
    { id: 'SB-8821', total: 155.0, metodo: 'PIX', hora: '14:20', itens: 4 },
    { id: 'SB-8820', total: 42.0, metodo: 'Dinheiro', hora: '13:50', itens: 2 },
  ]

  return (
    <div className="min-h-screen bg-[#080808] text-white p-4 md:p-8">
      <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-8">Fluxo de <span className="text-[#32C5C5]">Vendas</span></h1>
      
      <div className="grid gap-4">
        {vendas.map(venda => (
          <div key={venda.id} className="bg-[#0D0D0D] border border-white/5 p-6 rounded-[2rem] flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#111] rounded-2xl flex items-center justify-center text-[#32C5C5]">
                <Clock size={20} />
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-500 uppercase">{venda.hora} • {venda.id}</p>
                <h3 className="font-black italic uppercase text-white tracking-tight">{venda.itens} Itens Vendidos</h3>
              </div>
            </div>
            
            <div className="text-right">
              <p className="text-lg font-black italic text-white">R$ {venda.total.toFixed(2)}</p>
              <span className="text-[9px] font-black text-[#6CC551] uppercase bg-[#6CC551]/10 px-2 py-0.5 rounded-full">{venda.metodo}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}