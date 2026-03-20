import { useState } from 'react'
import { auth, db } from '../lib/firebase'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { Lock, Mail, ChevronRight, Loader2, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

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

            // Opcional: Validar se o usuário existe na sua coleção customizada do Firestore
            const userDoc = await getDoc(doc(db, "usuarios", user.uid))

            if (userDoc.exists()) {
                const userData = userDoc.data()
                // Se for admin, vai para o dashboard, se não, vai para o PDV
                if (userData.role === 'admin') {
                    navigate('/dashboard')
                } else {
                    navigate('/pdv')
                }
            } else {
                // Se não usar coleção "usuarios", apenas redirecione:
                navigate('/dashboard')
            }
        } catch (err: any) {
            setError('E-mail ou senha incorretos.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-[#080808] flex items-center justify-center p-4 text-white">
            <div className="w-full max-w-[400px] bg-[#0D0D0D] border border-white/5 p-8 rounded-[2rem] shadow-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-black italic uppercase">Smoke<span className="text-[#6CC551]">Boss</span></h1>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">Acesso ao Sistema</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                    {error && <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-[10px] font-bold uppercase text-center rounded-xl">{error}</div>}
                    
                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase px-1">E-mail</label>
                        <input 
                            type="email" 
                            className="w-full bg-[#080808] border border-white/5 p-4 rounded-xl outline-none focus:border-[#6CC551]/30"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[9px] font-black text-zinc-500 uppercase px-1">Senha</label>
                        <input 
                            type="password" 
                            className="w-full bg-[#080808] border border-white/5 p-4 rounded-xl outline-none focus:border-[#6CC551]/30"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    <button 
                        disabled={loading}
                        className="w-full bg-[#6CC551] text-black py-4 rounded-xl font-black uppercase text-xs hover:scale-[1.02] transition-all disabled:opacity-50 mt-4"
                    >
                        {loading ? <Loader2 className="animate-spin mx-auto" /> : "Entrar"}
                    </button>
                </form>
            </div>
        </div>
    )
}