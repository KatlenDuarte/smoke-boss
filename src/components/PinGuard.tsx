import { useState } from 'react'
import { Lock, Delete, ArrowRight, ArrowLeft } from 'lucide-react'
import { useNavigate } from 'react-router-dom' // Importar o hook de navegação

interface PinGuardProps {
  children: React.ReactNode
  correctPin: string
  title: string
}

export default function PinGuard({ children, correctPin, title }: PinGuardProps) {
  const [pin, setPin] = useState('')
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [error, setError] = useState(false)
  const navigate = useNavigate() // Inicializar o navegador

  const handlePress = (num: string) => {
    if (pin.length < 4) {
      setPin(prev => prev + num)
      setError(false)
    }
  }

  const handleConfirm = () => {
    if (pin === correctPin) {
      setIsUnlocked(true)
    } else {
      setError(true)
      setPin('')
    }
  }

  if (isUnlocked) return <>{children}</>

  return (
    <div className="fixed inset-0 z-[999] bg-[#050505] flex flex-col items-center justify-center p-6 animate-in fade-in duration-500">
      
      {/* BOTÃO VOLTAR (Canto Superior Esquerdo) */}
      <button 
        onClick={() => navigate(-1)} // Volta para a página anterior
        className="absolute top-8 left-8 flex items-center gap-2 text-zinc-600 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Voltar</span>
      </button>

      <div className="mb-8 text-center">
        <div className={`w-16 h-16 mx-auto mb-4 rounded-2xl border flex items-center justify-center transition-colors ${error ? 'border-red-500 bg-red-500/10 text-red-500' : 'border-white/10 bg-white/5 text-[#6CC551]'}`}>
          <Lock size={24} />
        </div>
        <h2 className="text-xl font-black text-white uppercase italic tracking-tighter">{title}</h2>
        <p className="text-[9px] text-zinc-600 font-bold uppercase tracking-[0.3em] mt-2">Área Restrita</p>
      </div>

      {/* Visualizadores do PIN */}
      <div className="flex gap-4 mb-10">
        {[1, 2, 3, 4].map((_, i) => (
          <div key={i} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${pin.length > i ? 'bg-[#6CC551] border-[#6CC551] scale-125' : 'border-white/10'}`} />
        ))}
      </div>

      {/* Teclado Numérico */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-[280px]">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(num => (
          <button key={num} onClick={() => handlePress(num)} className="h-16 rounded-2xl bg-white/5 border border-white/5 text-white font-black text-xl hover:bg-white/10 active:scale-90 transition-all">
            {num}
          </button>
        ))}
        <button onClick={() => setPin('')} className="h-16 rounded-2xl flex items-center justify-center text-zinc-600 hover:text-white"><Delete size={20} /></button>
        <button onClick={() => handlePress('0')} className="h-16 rounded-2xl bg-white/5 border border-white/5 text-white font-black text-xl">0</button>
        <button onClick={handleConfirm} className="h-16 rounded-2xl bg-[#6CC551] flex items-center justify-center text-black hover:brightness-110 active:scale-95 transition-all"><ArrowRight size={24} /></button>
      </div>
      
      {error && <p className="mt-6 text-[10px] font-black text-red-500 uppercase tracking-widest animate-bounce">PIN Incorreto</p>}
    </div>
  )
}