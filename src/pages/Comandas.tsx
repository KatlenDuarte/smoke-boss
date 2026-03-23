import { useState, useEffect, useMemo } from 'react'
import {
    Plus, Search, X, Receipt, Clock, Loader2,
    Smartphone, Users, CreditCard, Banknote, QrCode, Minus, User, Tag
} from 'lucide-react'
import { db } from '../lib/firebase'
import {
    collection, query, onSnapshot, addDoc, updateDoc,
    doc, deleteDoc, orderBy, serverTimestamp, increment
} from 'firebase/firestore'

// --- INTERFACES ---
interface Produto {
    id: string;
    nome: string;
    precoVenda: number;
    estoque: number;
}

interface ItemComanda {
    id: string;
    nome: string;
    preco: number;
    qtd: number;
}

interface Comanda {
    id: string;
    cliente: string;
    vendedor: string;
    itens: ItemComanda[];
    total: number;
    createdAt: string;
    status: string;
}

export default function Comandas({ storeEmail }: { storeEmail: string }) {
    const [comandas, setComandas] = useState<Comanda[]>([])
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [vendedores, setVendedores] = useState<{ id: string, nome: string }[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isProcessando, setIsProcessando] = useState(false)

    // Modais
    const [isModalNovaOpen, setIsModalNovaOpen] = useState(false)
    const [modalLancar, setModalLancar] = useState<{ open: boolean, comandaId: string, cliente: string }>({
        open: false, comandaId: '', cliente: ''
    })
    const [modalFechar, setModalFechar] = useState<{ open: boolean, comanda: Comanda | null }>({
        open: false, comanda: null
    })

    // Estados de formulário
    const [novaComandaNome, setNovaComandaNome] = useState('')
    const [vendedorSelecionado, setVendedorSelecionado] = useState('')
    const [desconto, setDesconto] = useState<number>(0)
    const [buscaProduto, setBuscaProduto] = useState('')
    const [carrinhoTemporario, setCarrinhoTemporario] = useState<ItemComanda[]>([])
    const [formaPagamento, setFormaPagamento] = useState<'DINHEIRO' | 'CARTÃO' | 'PIX'>('PIX')

    // --- LISTENERS ---
    useEffect(() => {
        if (!storeEmail) return;
        setIsLoading(true);

        // Listener Comandas
        const unsubComandas = onSnapshot(query(collection(db, `stores/${storeEmail}/comandas`), orderBy("createdAt", "desc")), (snap) => {
            setComandas(snap.docs.map(d => ({ id: d.id, ...d.data() } as Comanda)));
            setIsLoading(false);
        });

        // Listener Produtos
        const unsubProds = onSnapshot(query(collection(db, "products"), orderBy("nome", "asc")), (snap) => {
            setProdutos(snap.docs.map(d => ({ id: d.id, ...d.data() } as Produto)));
        });

        // Listener Vendedores (Coleção 'sellers' igual ao ModalNovaVenda)
        const unsubVend = onSnapshot(query(collection(db, "sellers"), orderBy("nome", "asc")), (snap) => {
            const vends = snap.docs.map(d => ({ id: d.id, nome: d.data().nome }));
            setVendedores(vends);
        });

        return () => { unsubComandas(); unsubProds(); unsubVend(); }
    }, [storeEmail])

    const produtosFiltrados = useMemo(() => {
        const termo = buscaProduto.trim().toLowerCase()
        if (termo.length < 2) return [];
        return produtos.filter(p => p.nome.toLowerCase().includes(termo))
    }, [buscaProduto, produtos])

    // --- AÇÕES ---
    const abrirComanda = async () => {
        if (!novaComandaNome.trim() || !vendedorSelecionado) {
            alert("Preencha a identificação e selecione o vendedor!");
            return;
        }
        await addDoc(collection(db, `stores/${storeEmail}/comandas`), {
            cliente: novaComandaNome.toUpperCase(),
            vendedor: vendedorSelecionado,
            itens: [],
            total: 0,
            createdAt: new Date().toISOString(),
            status: 'aberta'
        })
        setNovaComandaNome('');
        setVendedorSelecionado('');
        setIsModalNovaOpen(false);
    }

    const salvarLancamento = async () => {
        if (carrinhoTemporario.length === 0) return
        const comandaRef = doc(db, `stores/${storeEmail}/comandas`, modalLancar.comandaId)
        const atual = comandas.find(c => c.id === modalLancar.comandaId)
        const novosItens = [...(atual?.itens || []), ...carrinhoTemporario]
        const novoTotal = novosItens.reduce((sum, i) => sum + (i.preco * i.qtd), 0)

        await updateDoc(comandaRef, { itens: novosItens, total: novoTotal })
        setCarrinhoTemporario([]); setModalLancar({ open: false, comandaId: '', cliente: '' }); setBuscaProduto('');
    }

    const finalizarVenda = async () => {
        if (!modalFechar.comanda || isProcessando) return;
        setIsProcessando(true);

        try {
            const { comanda } = modalFechar;
            const agora = new Date();
            const totalComDesconto = comanda.total - desconto;

            await addDoc(collection(db, "sales"), {
                store: storeEmail,
                cliente: comanda.cliente,
                vendedor: comanda.vendedor,
                items: comanda.itens.map(it => ({
                    id: it.id,
                    nome: it.nome,
                    qtd: it.qtd,
                    preco: it.preco
                })),
                subtotal: comanda.total,
                desconto: desconto,
                total: Math.max(0, totalComDesconto),
                metodoPagamento: formaPagamento,
                origem: "COMANDA",
                status: "completed",
                timestamp: serverTimestamp(),
                data: agora.toLocaleDateString("pt-BR"),
                hora: agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
            });

            for (const item of comanda.itens) {
                await updateDoc(doc(db, "products", item.id), {
                    estoque: increment(-item.qtd)
                });
            }

            await deleteDoc(doc(db, `stores/${storeEmail}/comandas`, comanda.id));
            setDesconto(0);
            setModalFechar({ open: false, comanda: null });
        } catch (e) {
            console.error(e);
        } finally {
            setIsProcessando(false);
        }
    }

    return (
        <div className="w-full max-w-7xl mx-auto space-y-6 pb-32 px-2 text-zinc-100 font-sans">

            {/* HEADER */}
            <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pt-6 px-1">
                <div>
                    <div className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[#6CC551] animate-pulse" />
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-white">SISTEMA DE COMANDAS</h2>
                    </div>
                    <p className="text-[8px] text-zinc-600 font-black uppercase tracking-widest">Atendimento Ativo</p>
                </div>

                <button
                    onClick={() => setIsModalNovaOpen(true)}
                    className="w-full md:w-auto flex items-center justify-center gap-3 bg-[#6CC551] text-black px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-[#6CC551]/10"
                >
                    <Plus size={16} strokeWidth={3} /> Abrir Novo Atendimento
                </button>
            </header>

            {/* MÉTRICAS */}
            <section className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                <MetricCard label="Ativas" value={comandas.length} icon={<Users size={14} />} color="#6CC551" />
                <MetricCard label="Em Aberto" value={`R$ ${comandas.reduce((s, c) => s + (c.total || 0), 0).toFixed(2)}`} icon={<Receipt size={14} />} color="#A855F7" />
            </section>

            {/* GRID COMANDAS */}
            {isLoading ? (
                <div className="py-32 flex flex-col items-center justify-center gap-3">
                    <Loader2 className="animate-spin text-[#6CC551]" size={32} />
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                    {comandas.map((comanda) => (
                        <div key={comanda.id} className="bg-zinc-900 border border-white/5 p-5 rounded-[1.8rem] flex flex-col shadow-xl">
                            <div className="flex justify-between items-center mb-4">
                                <span className="bg-zinc-950 text-[#6CC551] p-2.5 rounded-xl border border-white/5"><Smartphone size={16} /></span>
                                <div className="text-right">
                                    <span className="text-[8px] font-black text-zinc-700 uppercase block">#{comanda.id.slice(-4)}</span>
                                    <span className="text-[7px] font-black text-[#6CC551] uppercase">{comanda.vendedor}</span>
                                </div>
                            </div>

                            <h3 className="text-[13px] font-black text-white uppercase italic truncate">{comanda.cliente}</h3>
                            <p className="text-[9px] text-zinc-600 font-bold mb-4 flex items-center gap-1 uppercase tracking-tighter"><Clock size={10} /> {new Date(comanda.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>

                            <div className="flex-1 space-y-1.5 mb-5 max-h-32 overflow-y-auto pr-1 custom-scrollbar border-t border-white/[0.03] pt-3">
                                {comanda.itens?.length > 0 ? comanda.itens.map((it, i) => (
                                    <div key={i} className="flex justify-between text-[9px] font-black text-zinc-500 uppercase italic">
                                        <span className="truncate pr-2">{it.qtd}x {it.nome}</span>
                                        <span className="text-zinc-400">R${(it.preco * it.qtd).toFixed(2)}</span>
                                    </div>
                                )) : <span className="text-[8px] font-black text-zinc-800 uppercase italic">Aguardando pedido...</span>}
                            </div>

                            <div className="flex justify-between items-end mb-5 pt-3 border-t border-white/5">
                                <span className="text-[9px] font-black text-zinc-600 uppercase">Subtotal</span>
                                <span className="text-xl font-black text-[#6CC551] italic tracking-tighter leading-none">R$ {comanda.total.toFixed(2)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <button onClick={() => setModalLancar({ open: true, comandaId: comanda.id, cliente: comanda.cliente })} className="py-3 bg-zinc-950 border border-white/5 rounded-xl text-[8px] font-black uppercase text-zinc-400 hover:text-white transition-colors">Lançar</button>
                                <button onClick={() => setModalFechar({ open: true, comanda })} className="py-3 bg-[#6CC551]/10 border border-[#6CC551]/20 text-[#6CC551] rounded-xl text-[8px] font-black uppercase hover:bg-[#6CC551] hover:text-black transition-all">Fechar</button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL NOVA COMANDA (ATUALIZADO COM VENDEDORES DA COLEÇÃO 'SELLERS') */}
            {isModalNovaOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/95 backdrop-blur-sm animate-in zoom-in-95">
                    <div className="bg-[#0A0A0A] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8">
                        <h2 className="text-xl font-black italic text-white uppercase tracking-tighter mb-8 text-center">Abrir Atendimento</h2>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Identificação (Nome/Mesa)</label>
                                <div className="relative">
                                    <User className="absolute left-5 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                                    <input
                                        autoFocus type="text" value={novaComandaNome}
                                        onChange={(e) => setNovaComandaNome(e.target.value)}
                                        placeholder="EX: CLIENTE OU MESA..."
                                        className="w-full bg-zinc-950 border border-white/10 rounded-xl py-5 pl-14 pr-4 text-white font-black italic uppercase text-[15px] outline-none focus:border-[#6CC551] transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[8px] font-black text-zinc-600 uppercase ml-2 tracking-widest">Selecionar Vendedor</label>
                                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1 no-scrollbar">
                                    {vendedores.map(v => (
                                        <button
                                            key={v.id}
                                            type="button"
                                            onClick={() => setVendedorSelecionado(v.nome)}
                                            className={`py-4 px-4 rounded-xl border text-[9px] font-black uppercase transition-all duration-200 ${vendedorSelecionado === v.nome
                                                    ? 'bg-[#6CC551] text-black border-[#6CC551] shadow-lg shadow-[#6CC551]/20'
                                                    : 'bg-zinc-900 text-zinc-500 border-white/5 hover:border-white/20'
                                                }`}
                                        >
                                            {v.nome}
                                        </button>
                                    ))}
                                    {vendedores.length === 0 && (
                                        <div className="col-span-2 py-4 text-center text-zinc-700 text-[10px] font-bold uppercase italic">Nenhum vendedor registrado</div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={abrirComanda}
                            disabled={!novaComandaNome || !vendedorSelecionado}
                            className="w-full bg-[#6CC551] disabled:bg-zinc-800 disabled:text-zinc-600 text-black font-black py-5 rounded-xl uppercase text-[10px] mt-8 shadow-lg shadow-[#6CC551]/20 active:scale-95 transition-all"
                        >
                            Confirmar Abertura
                        </button>
                        <button onClick={() => { setIsModalNovaOpen(false); setVendedorSelecionado(''); }} className="w-full py-3 text-zinc-800 font-black uppercase text-[9px] mt-2">Cancelar</button>
                    </div>
                </div>
            )}

            {/* MODAL FECHAMENTO (IGUAL AO REGISTRAR VENDAS) */}
            {modalFechar.open && modalFechar.comanda && (
                <div className="fixed inset-0 z-[1001] bg-black/95 flex items-end justify-center">
                    <div className="bg-[#0A0A0A] border-t border-white/10 w-full max-w-lg rounded-t-[2rem] p-6 pb-10 animate-in slide-in-from-bottom-full">
                        <div className="w-10 h-1 bg-white/10 rounded-full mx-auto mb-6" />

                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-black text-white uppercase italic tracking-tighter">{modalFechar.comanda.cliente}</h2>
                            <span className="text-[9px] font-black text-[#6CC551] uppercase italic">Vendedor: {modalFechar.comanda.vendedor}</span>
                        </div>

                        <div className="bg-zinc-950 rounded-2xl p-4 border border-white/5 mb-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Tag size={14} className="text-zinc-600" />
                                <span className="text-[9px] font-black text-zinc-600 uppercase">Desconto (R$)</span>
                            </div>
                            <input
                                type="number"
                                value={desconto || ''}
                                onChange={(e) => setDesconto(Number(e.target.value))}
                                className="w-24 bg-zinc-900 border border-white/10 rounded-lg py-2 px-3 text-right text-white font-black outline-none focus:border-[#6CC551]"
                                placeholder="0,00"
                            />
                        </div>

                        <div className="bg-zinc-950 rounded-2xl p-6 border border-white/5 text-center mb-6">
                            <span className="text-[8px] font-black text-zinc-600 uppercase tracking-widest block mb-1">Total a Receber</span>
                            <h3 className="text-3xl font-black text-[#6CC551] italic tracking-tighter">
                                R$ {Math.max(0, modalFechar.comanda.total - desconto).toFixed(2)}
                            </h3>
                        </div>

                        <div className="grid grid-cols-3 gap-2 mb-8">
                            <PaymentBtn icon={<QrCode size={16} />} label="PIX" active={formaPagamento === 'PIX'} onClick={() => setFormaPagamento('PIX')} />
                            <PaymentBtn icon={<CreditCard size={16} />} label="CARD" active={formaPagamento === 'CARTÃO'} onClick={() => setFormaPagamento('CARTÃO')} />
                            <PaymentBtn icon={<Banknote size={16} />} label="CASH" active={formaPagamento === 'DINHEIRO'} onClick={() => setFormaPagamento('DINHEIRO')} />
                        </div>

                        <button onClick={finalizarVenda} disabled={isProcessando} className="w-full py-5 bg-[#6CC551] text-black font-black rounded-xl uppercase text-[11px] tracking-widest active:scale-95 transition-all">
                            {isProcessando ? <Loader2 className="animate-spin mx-auto" size={16} /> : "FINALIZAR VENDA"}
                        </button>
                        <button onClick={() => { setModalFechar({ open: false, comanda: null }); setDesconto(0); }} className="w-full py-3 text-zinc-800 font-black uppercase text-[9px] mt-2 hover:text-zinc-600">Voltar</button>
                    </div>
                </div>
            )}

            {/* MODAL LANÇAMENTO (SIMPLIFICADO) */}
            {modalLancar.open && (
                <div className="fixed inset-0 z-[999] bg-black flex flex-col animate-in slide-in-from-bottom-5">
                    <header className="p-4 border-b border-white/5 flex justify-between items-center bg-zinc-950">
                        <div>
                            <h2 className="text-lg font-black text-white italic uppercase tracking-tighter">Lançar Itens</h2>
                            <span className="text-[9px] font-black text-[#6CC551] uppercase tracking-widest">{modalLancar.cliente}</span>
                        </div>
                        <button onClick={() => { setModalLancar({ open: false, comandaId: '', cliente: '' }); setCarrinhoTemporario([]); setBuscaProduto(''); }} className="p-2 bg-zinc-900 rounded-xl text-zinc-500"><X size={20} /></button>
                    </header>
                    <div className="flex-1 p-4 overflow-hidden flex flex-col max-w-2xl mx-auto w-full">
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-700" size={18} />
                            <input
                                autoFocus type="text" placeholder="BUSCAR PRODUTO..."
                                className="w-full bg-zinc-900 border border-white/5 rounded-xl py-5 pl-12 pr-4 text-white font-black italic text-base outline-none focus:border-[#6CC551]/30 transition-all"
                                value={buscaProduto} onChange={(e) => setBuscaProduto(e.target.value)}
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto space-y-2 no-scrollbar">
                            {produtosFiltrados.map(p => (
                                <button key={p.id} onClick={() => setCarrinhoTemporario([...carrinhoTemporario, { id: p.id, nome: p.nome, preco: p.precoVenda, qtd: 1 }])} className="w-full flex justify-between items-center p-4 bg-zinc-900 border border-white/5 rounded-xl hover:border-[#6CC551]/30 transition-all">
                                    <div className="text-left">
                                        <p className="text-white text-[10px] font-black uppercase mb-1">{p.nome}</p>
                                        <p className="text-[#6CC551] text-xs font-black">R$ {p.precoVenda.toFixed(2)}</p>
                                    </div>
                                    <Plus size={16} className="text-[#6CC551]" />
                                </button>
                            ))}
                        </div>
                        <aside className="p-4 border-t border-white/10 flex items-center gap-4 bg-black">
                            <div className="flex-1">
                                <p className="text-[8px] font-black text-zinc-600 uppercase">Somando no lançamento</p>
                                <p className="text-2xl font-black text-white italic tracking-tighter">R$ {carrinhoTemporario.reduce((s, i) => s + (i.preco * i.qtd), 0).toFixed(2)}</p>
                            </div>
                            <button onClick={salvarLancamento} className="flex-1 py-5 bg-[#6CC551] text-black font-black rounded-xl uppercase text-[10px] shadow-lg shadow-[#6CC551]/10">Confirmar</button>
                        </aside>
                    </div>
                </div>
            )}
        </div>
    )
}

function MetricCard({ label, value, icon, color }: any) {
    return (
        <div className="bg-zinc-900 p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
            <div className="flex justify-between items-center opacity-40">
                <span className="text-[8px] font-black uppercase text-zinc-400 tracking-widest">{label}</span>
                <div style={{ color }}>{icon}</div>
            </div>
            <h3 className="text-lg font-black text-white italic tracking-tighter">{value}</h3>
        </div>
    )
}

function PaymentBtn({ icon, label, active, onClick }: { icon: any, label: string, active: boolean, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all gap-1.5 active:scale-95 ${active
                ? 'bg-[#6CC551]/10 border-[#6CC551] text-[#6CC551]'
                : 'bg-zinc-950 border-white/5 text-zinc-700'
                }`}
        >
            {icon}
            <span className="text-[8px] font-black uppercase tracking-widest">{label}</span>
        </button>
    )
}