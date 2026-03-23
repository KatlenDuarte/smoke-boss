import { useState } from 'react'
import { auth, db } from '../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { Lock, Mail, ChevronRight, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

// IMPORTAÇÃO DA LOGO
import logoImg from './logo.png' 

export default function Login() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const navigate = useNavigate()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError('')

        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password)
            const user = userCredential.user
            const userDoc = await getDoc(doc(db, "usuarios", user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                userData.role === 'admin' ? navigate('/dashboard') : navigate('/pdv')
            } else {
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError('Credenciais inválidas.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center p-6 text-white antialiased font-sans">
            <div className="w-full max-w-[400px] space-y-8">
                
                {/* LOGO AREA - Otimizada para Logo Horizontal */}
                <div className="text-center space-y-6">
                    <div className="flex justify-center">
                        <div className="relative group">
                            {/* IMAGEM DA LOGO - Aumentada para destacar o nome ao lado */}
                            <img 
                                src={logoImg} 
                                alt="Logo SmokeBoss" 
                                className="w-64 h-auto object-contain brightness-125 drop-shadow-[0_0_25px_rgba(108,197,81,0.5)] transition-all duration-700 group-hover:scale-105" 
                            />
                            
                            {/* Brilho de Fundo Dinâmico */}
                            <div className="absolute inset-0 bg-[#6CC551]/10 blur-[50px] rounded-full -z-10 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <p className="text-[9px] text-zinc-600 font-black uppercase tracking-[0.6em] animate-pulse">
                            Acesso Restrito · Core Terminal
                        </p>
                    </div>
                </div>

                {/* LOGIN CARD */}
                <div className="bg-[#0D0D0D] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden backdrop-blur-sm">
                    <form onSubmit={handleLogin} className="space-y-5 relative z-10">
                        {error && (
                            <div className="p-3 bg-red-500/5 border border-red-500/10 text-red-500 text-[9px] font-black uppercase text-center rounded-xl tracking-widest animate-in fade-in zoom-in-95">
                                {error}
                            </div>
                        )}
                        
                        <div className="space-y-2 group">
                            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1 group-focus-within:text-[#6CC551] transition-colors">E-mail Corporativo</label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#6CC551] transition-colors" size={14} />
                                <input 
                                    type="email" 
                                    className="w-full bg-[#050505] border border-white/5 p-4 pl-11 rounded-xl outline-none focus:border-[#6CC551]/30 text-xs font-bold transition-all placeholder:text-zinc-900 text-white"
                                    placeholder="admin@smokeboss.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="space-y-2 group">
                            <label className="text-[8px] font-black text-zinc-600 uppercase tracking-widest px-1 group-focus-within:text-[#6CC551] transition-colors">Chave de Acesso</label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-800 group-focus-within:text-[#6CC551] transition-colors" size={14} />
                                <input 
                                    type="password" 
                                    className="w-full bg-[#050505] border border-white/5 p-4 pl-11 rounded-xl outline-none focus:border-[#6CC551]/30 text-xs font-bold transition-all placeholder:text-zinc-900 text-white"
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button 
                            disabled={loading}
                            className="w-full bg-white text-black py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-[#6CC551] hover:shadow-[0_0_20px_rgba(108,197,81,0.3)] transition-all disabled:opacity-50 mt-4 flex items-center justify-center gap-2 group"
                        >
                            {loading ? (
                                <Loader2 className="animate-spin" size={16} />
                            ) : (
                                <>
                                    Entrar no Sistema
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Decoração Sutil de Fundo */}
                    <div className="absolute -top-10 -right-10 w-32 h-32 bg-[#6CC551]/5 blur-[60px] rounded-full pointer-events-none" />
                </div>

                <div className="text-center">
                    <p className="text-[7px] font-bold text-zinc-700 uppercase tracking-[0.5em]">Secure Terminal v3.0.4</p>
                </div>
            </div>
        </div>
    )
}