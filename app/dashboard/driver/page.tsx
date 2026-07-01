"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import NewTripModal from "@/components/NewTripModal"
import NewExpenseModal from "@/components/NewExpenseModal"

export default function DriverDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [timelineItems, setTimelineItems] = useState<any[]>([])
  const [showFab, setShowFab] = useState(false)
  const [isTripModalOpen, setIsTripModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  const [tokenInput, setTokenInput] = useState("") 
  const [isLinking, setIsLinking] = useState(false)
  
  // Estados dos Filtros (Sem filtro de motorista)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })
  const [typeFilter, setTypeFilter] = useState<'all' | 'viagem' | 'gasto'>('all')
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  
  const router = useRouter()

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)
      
      if (prof?.company_id) {
        // Busca todas as viagens do próprio motorista
        const { data: t } = await supabase.from('trips')
          .select('*')
          .eq('driver_id', user.id)

        // Busca todas as despesas do próprio motorista
        const { data: e } = await supabase.from('expenses')
          .select('*')
          .eq('driver_id', user.id)

        // Combina as informações ordenando por data decrescente
        const combined = [
          ...(t || []).map(x => ({ ...x, kind: 'viagem' })),
          ...(e || []).map(x => ({ ...x, kind: 'gasto' }))
        ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

        setTimelineItems(combined)
      }
    }
    fetchDashboardData()
  }, [router])

  // Lógica de Filtro no Client (Data + Tipo)
  const filteredItems = timelineItems.filter(item => {
    const itemDate = new Date(item.created_at);
    const itemDateString = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
    
    const matchesDate = itemDateString === selectedDate;
    const matchesType = typeFilter === 'all' || item.kind === typeFilter;

    return matchesDate && matchesType;
  })

  // Estatísticas Dinâmicas Baseadas na Data Selecionada
  const stats = filteredItems.reduce((acc, curr) => {
    if (curr.kind === 'viagem') acc.trips += 1;
    if (curr.kind === 'gasto') acc.expenses += Number(curr.value);
    return acc;
  }, { trips: 0, expenses: 0 })

  const handleJoinCompany = async () => {
    if (!tokenInput) return
    setIsLinking(true)
    const { data: company } = await supabase.from('companies').select('id').eq('company_token', tokenInput).single()
    if (company) {
      await supabase.from('profiles').update({ company_id: company.id }).eq('id', profile.id)
      window.location.reload()
    } else {
      alert("Token Inválido")
    }
    setIsLinking(false)
  }

  if (!profile) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest">CARREGANDO...</div>

  return (
    <main className="relative min-h-screen w-full bg-[#020617] text-white pt-10 md:pt-20 px-4 md:px-10 pb-32 overflow-x-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Cabeçalho Identico */}
        <div className="mb-12 flex items-start justify-between">
          <div>
            <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Painel do Motorista</p>
            <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none">
              {profile.full_name?.split(' ')[0]}
              <span className="block text-white/20 text-2xl md:text-4xl not-italic mt-1 font-light tracking-normal">{profile.companies?.name || 'Aguardando Frota'}</span>
            </h1>
          </div>

          <button 
            onClick={() => setIsMenuOpen(true)}
            className="w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-all active:scale-90"
          >
            <div className="w-6 h-0.5 bg-white rounded-full" />
            <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
            <div className="w-4 h-0.5 bg-white rounded-full self-end mr-4" />
          </button>
        </div>

        {/* Drawer Lateral Identico */}
        <div className={`fixed inset-0 z-[200] flex justify-end transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className={`relative w-[85%] max-sm bg-[#020617] h-full border-l border-white/10 p-8 shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10">✕</button>
            </div>

            <div className="space-y-8">
              <nav className="space-y-1">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-[4px] ml-4 mb-4 font-bold">Navegação</p>
                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left p-5 rounded-3xl bg-orange-500/10 text-orange-500 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🏠 Início</button>
                <div className="h-[1px] w-full bg-white/5 my-4" />
                <button onClick={() => router.push('/dashboard/driver/settings')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">⚙️ Configurações</button>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full text-left p-5 rounded-3xl hover:bg-red-500/5 text-red-500/80 hover:text-red-500 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">🔴 Sair</button>
              </nav>
            </div>
          </div>
        </div>

        {profile.company_id ? (
          <>
            {/* Stats Identicos */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              <StatCard title="Viagens" value={stats.trips} unit="total" />
              <StatCard title="Gastos" value={`R$${stats.expenses}`} color="text-orange-500" />
            </div>

            {/* BARRA DE FILTROS DUPLA PREMIUM (Lado a Lado) */}
            <div className="grid grid-cols-2 gap-3 mb-8 animate-in fade-in slide-in-from-top-3 duration-500 ease-out">
              
              {/* Card 1: Calendário de Data */}
              <div className="relative active:scale-[0.97] transition-all bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500/30">
                <div className="flex items-center gap-2.5">
                  <span className="text-xs">📅</span>
                  <span className="text-[10px] font-black tracking-wider text-white uppercase">
                    {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                  </span>
                </div>
                <span className="text-[8px] text-orange-500">▼</span>
                
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              {/* Card 2: Seletor de Tipo */}
              <div className="relative w-full">
                <div 
                  onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
                  className="active:scale-[0.97] transition-all bg-white/5 border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500/30"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs">
                      {typeFilter === 'all' ? '📑' : typeFilter === 'viagem' ? '🚛' : '💸'}
                    </span>
                    <span className="text-[10px] font-black tracking-wider text-white uppercase">
                      {typeFilter === 'all' ? 'Todos' : typeFilter === 'viagem' ? 'Viagens' : 'Gastos'}
                    </span>
                  </div>
                  <span className={`text-[8px] text-orange-500 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
                </div>

                {isTypeDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                    <div className="absolute top-full left-0 w-full mt-2 bg-[#020617] border border-white/10 rounded-2xl p-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                      <button
                        onClick={() => { setTypeFilter('all'); setIsTypeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${typeFilter === 'all' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                      >
                        📑 Todos
                      </button>
                      <button
                        onClick={() => { setTypeFilter('viagem'); setIsTypeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${typeFilter === 'viagem' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                      >
                        🚛 Viagens
                      </button>
                      <button
                        onClick={() => { setTypeFilter('gasto'); setIsTypeDropdownOpen(false); }}
                        className={`w-full text-left px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-2.5 transition-all ${typeFilter === 'gasto' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                      >
                        💸 Gastos
                      </button>
                    </div>
                  </>
                )}
              </div>

            </div>

            {/* TIMELINE MIXTA DE ATIVIDADE */}
            <div className="mt-10 mb-20">
              <div className="mb-6 px-1 text-left">
                <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Minha Atividade</h2>
                <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-1">Registros Filtrados</p>
              </div>

              <div className="space-y-4">
                {filteredItems.length > 0 ? (
                  filteredItems.map((item) => (
                    <div 
                      key={`${item.kind}-${item.id}`} 
                      onClick={() => setSelectedTrip(item)} 
                      className="relative group active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <div 
                        className="relative bg-[#0f172a]/40 backdrop-blur-xl p-5 rounded-[32px] overflow-hidden transition-all duration-300"
                        style={{
                          borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                          borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                          borderLeft: item.kind === 'viagem' ? '12px solid #f97316' : '12px solid #ffffff'
                        }}
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-5">
                            <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl border border-white/10 shrink-0">
                              {item.kind === 'viagem' ? '🚛' : '💸'}
                            </div>

                            <div className="text-left">
                              <h4 className="text-white font-black text-sm uppercase tracking-tight leading-none">
                                {item.kind === 'viagem' ? item.origin : item.type}
                              </h4>
                              <div className="flex items-center gap-3 mt-2">
                                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] bg-orange-500/10 px-2 py-0.5 rounded-md border border-orange-500/20">
                                  {item.kind === 'viagem' ? (item.material || 'Carga') : `R$ ${item.value}`}
                                </span>
                                <span className="text-white/60 text-[9px] font-black uppercase italic tracking-wider">
                                  {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="w-8 h-8 bg-white/5 rounded-full flex items-center justify-center border border-white/5 group-hover:border-orange-500/50 transition-all shrink-0">
                            <span className="text-orange-500 text-[10px]">→</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-16 bg-white/[0.02] border border-dashed border-white/10 rounded-[40px]">
                    <p className="text-white/10 font-black uppercase text-[10px] tracking-[4px] italic">Nenhum registro para esta data</p>
                  </div>
                )}
              </div>
            </div>

            {/* FAB OPERACIONAL (Com animações Bezier) */}
            <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-center">
              <div className={`flex flex-col items-center gap-3 mb-5 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${showFab ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
                <button onClick={() => { setIsTripModalOpen(true); setShowFab(false); }} className="group relative flex items-center justify-center">
                  <span className="absolute right-full mr-4 bg-orange-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_20px_rgba(249,115,22,0.4)]">Novo Trampo</span>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl shadow-2xl hover:bg-orange-500 hover:text-black transition-all duration-300">🚛</div>
                </button>
                <button onClick={() => { setIsExpenseModalOpen(true); setShowFab(false); }} className="group relative flex items-center justify-center">
                  <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl">Lançar Gasto</span>
                  <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl shadow-2xl hover:bg-orange-500 hover:text-black transition-all duration-300">💸</div>
                </button>
              </div>
              <button onClick={() => setShowFab(!showFab)} className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-500 ${showFab ? 'bg-white text-black' : 'bg-orange-500 text-black'}`}>
                <div className={`text-4xl font-light transition-transform duration-500 flex items-center justify-center ${showFab ? 'rotate-[135deg]' : 'rotate-0'}`} style={{ width: '32px', height: '32px', paddingBottom: '6px' }}>+</div>
              </button>
            </div>
          </>
        ) : (
          <div className="glass w-full rounded-[40px] p-12 border border-white/5 text-center">
            <h3 className="text-2xl font-black italic uppercase mb-4 text-orange-500">Vínculo Pendente</h3>
            <p className="text-white/40 mb-8 max-w-sm mx-auto font-medium text-sm italic tracking-tight">Digite o Token da Frota fornecido pelo seu patrão para ativar seu painel operacional.</p>
            <div className="max-w-xs mx-auto space-y-4">
              <input type="text" value={tokenInput} onChange={(e) => setTokenInput(e.target.value.toUpperCase())} placeholder="TOKEN DA FROTA" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-center font-black tracking-[4px] text-white focus:border-orange-500 transition-all outline-none" />
              <button onClick={handleJoinCompany} disabled={isLinking} className="w-full bg-white text-black py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
                {isLinking ? 'CONECTANDO...' : 'CONECTAR AGORA'}
              </button>
            </div>
          </div>
        )}

        {/* Modais de Lançamentos */}
        <div className={`fixed inset-0 z-[160] transition-all duration-500 ${isTripModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {isTripModalOpen && <NewTripModal userId={profile.id} companyId={profile.company_id} onClose={() => setIsTripModalOpen(false)} onSuccess={() => window.location.reload()} />}
        </div>
        <div className={`fixed inset-0 z-[160] transition-all duration-500 ${isExpenseModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {isExpenseModalOpen && <NewExpenseModal userId={profile.id} companyId={profile.company_id} onClose={() => setIsExpenseModalOpen(false)} onSuccess={() => window.location.reload()} />}
        </div>

        {/* MODAL DETALHADO COMPATÍVEL COM SUPORTE A SCROLL (SEM CORTES) */}
        {selectedTrip && (
          <div 
            className="fixed inset-0 z-[150] overflow-y-auto bg-black/95 backdrop-blur-xl p-4 md:p-10 flex items-start justify-center transition-all duration-500"
            onClick={() => setSelectedTrip(null)}
          >
            <div 
              className="glass w-full max-w-lg p-6 md:p-8 rounded-[32px] md:rounded-[40px] border border-white/10 shadow-2xl relative text-white flex flex-col my-auto transition-all duration-500 ease-out scale-100"
              onClick={e => e.stopPropagation()}
            >
              {selectedTrip.kind === 'viagem' ? (
                /* RESUMO VIAGEM */
                <>
                  <div className="flex justify-between items-start mb-8 text-left">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo da Viagem</h2>
                      <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Digital</p>
                    </div>
                    <button onClick={() => setSelectedTrip(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-xl border border-white/10 hover:text-white transition-all">✕</button>
                  </div>

                  <div className="space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Origem</p>
                        <p className="font-black uppercase text-sm">{selectedTrip.origin}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Destino</p>
                        <p className="font-black uppercase text-sm">{selectedTrip.destination}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-[32px] border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Material</p>
                        <p className="font-black uppercase text-orange-500 italic">{selectedTrip.material}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Data</p>
                        <p className="font-black uppercase text-xs">{new Date(selectedTrip.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <div>
                      {selectedTrip.photo_url ? (
                        <div className="w-full aspect-video rounded-[32px] overflow-hidden border-2 border-white/5">
                          <img src={selectedTrip.photo_url} className="w-full h-full object-cover" alt="Comprovante" />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center">
                          <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Sem foto registrada</p>
                        </div>
                      )}
                    </div>

                    <button onClick={() => setSelectedTrip(null)} className="w-full bg-white text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all active:scale-95 shadow-xl">Fechar Resumo</button>
                  </div>
                </>
              ) : (
                /* RESUMO DESPESA (COM DOWNLOAD) */
                <>
                  <div className="flex justify-between items-start mb-8 text-left">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo da Despesa</h2>
                      <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Financeiro</p>
                    </div>
                    <button onClick={() => setSelectedTrip(null)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 text-xl border border-white/10 hover:text-white transition-all">✕</button>
                  </div>

                  <div className="space-y-6 text-left">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Categoria</p>
                        <p className="font-black uppercase text-sm flex items-center gap-1.5">
                          {selectedTrip.type === 'Combustível' ? '⛽' : 
                           selectedTrip.type === 'Borracharia' ? '🛞' : '📦'} {selectedTrip.type}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Valor</p>
                        <p className="font-black uppercase text-sm text-orange-500 italic">R$ {Number(selectedTrip.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {selectedTrip.description && (
                      <div className="bg-white/5 p-5 rounded-[32px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-1">Observação</p>
                        <p className="font-medium text-xs text-white/80">{selectedTrip.description}</p>
                      </div>
                    )}

                    <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex justify-between items-center">
                      <p className="text-[8px] font-black uppercase text-white/30 tracking-widest">Data do Lançamento</p>
                      <p className="font-black uppercase text-xs">{new Date(selectedTrip.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div>
                      {selectedTrip.photo_url ? (
                        <div className="w-full aspect-video rounded-[32px] overflow-hidden border-2 border-white/5">
                          <img src={selectedTrip.photo_url} className="w-full h-full object-cover" alt="Comprovante de Despesa" />
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center">
                          <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Sem foto registrada</p>
                        </div>
                      )}
                    </div>
                    <div className="pt-2">
                      <button onClick={() => setSelectedTrip(null)} className="w-full bg-white text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all active:scale-95 shadow-xl">Fechar Resumo</button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* CONTÊINER DE MODAIS DE LANÇAMENTO (ENCAIXE MOBILE NATIVO) */}
        <div className={`fixed inset-0 z-[160] transition-all duration-500 ${isTripModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {isTripModalOpen && (
            <NewTripModal 
              userId={profile.id} 
              companyId={profile.company_id} 
              onClose={() => setIsTripModalOpen(false)} 
              onSuccess={() => window.location.reload()} 
            />
          )}
        </div>

        <div className={`fixed inset-0 z-[160] transition-all duration-500 ${isExpenseModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          {isExpenseModalOpen && (
            <NewExpenseModal 
              userId={profile.id} 
              companyId={profile.company_id} 
              onClose={() => setIsExpenseModalOpen(false)} 
              onSuccess={() => window.location.reload()} 
            />
          )}
        </div>

      </div>
    </main>
  )
}
// COMPONENTE AUXILIAR STATCARD ÚNICO E ALINHADO
function StatCard({ title, value, unit, color }: any) {
  return (
    <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left">
      <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">{title}</p>
      <div className="flex flex-col">
        <span className={`text-2xl font-black italic tracking-tighter leading-none ${color || 'text-white'}`}>{value}</span>
        {unit && <span className="text-white/40 text-[8px] font-bold uppercase mt-1 font-black">{unit}</span>}
      </div>
    </div>
  )
}