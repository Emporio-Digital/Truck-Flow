"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function MyTeamPage() {
  const [profile, setProfile] = useState<any>(null)
  const [drivers, setDrivers] = useState<any[]>([])
  const [timelineItems, setTimelineItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  // Estado para a foto em tela cheia (Lightbox)
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null)
  // Estado para substituir alertas padrão por alerta premium
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Função para forçar o download direto de imagens do Supabase Storage
  const handleDownloadFile = async (imageUrl: string, filename: string) => {
    try {
      const response = await fetch(imageUrl)
      const blob = await response.blob()
      const blobUrl = URL.createObjectURL(blob)
      
      const tempLink = document.createElement("a")
      tempLink.href = blobUrl
      tempLink.download = filename
      document.body.appendChild(tempLink)
      tempLink.click()
      document.body.removeChild(tempLink)
      URL.revokeObjectURL(blobUrl)
    } catch (error) {
      window.open(imageUrl, "_blank")
    }
  }

  // Estados dos Filtros
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })
  const [typeFilter, setTypeFilter] = useState<'all' | 'viagem' | 'gasto'>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')

  // Estados de abertura dos Dropdowns
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState(false)

  const router = useRouter()

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      // 1. Perfil do Administrador
      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)

      if (prof?.company_id) {
        // 2. Busca todos os motoristas da empresa
        const { data: teamDrivers } = await supabase.from('profiles')
          .select('*')
          .eq('company_id', prof.company_id)
          .eq('role', 'driver')

        setDrivers(teamDrivers || [])

        if (teamDrivers && teamDrivers.length > 0) {
          const driverIds = teamDrivers.map(d => d.id)

          // Define data limite para carregar até 6 meses de histórico retroativo (Máxima performance no 4G)
          const sixMonthsAgo = new Date()
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
          const limitDate = sixMonthsAgo.toISOString()

          // 3. Busca Viagens de todos os motoristas
          const { data: t } = await supabase.from('trips')
            .select('*')
            .in('driver_id', driverIds)
            .gte('created_at', limitDate)

          // 4. Busca Despesas de todos os motoristas
          const { data: e } = await supabase.from('expenses')
            .select('*')
            .in('driver_id', driverIds)
            .gte('created_at', limitDate)

          // 5. Combina os registros associando o nome do motorista correspondente
          const combined = [
            ...(t || []).map(x => {
              const drv = teamDrivers.find(d => d.id === x.driver_id);
              return { ...x, kind: 'viagem', driver_name: drv ? drv.full_name : 'Motorista' };
            }),
            ...(e || []).map(x => {
              const drv = teamDrivers.find(d => d.id === x.driver_id);
              return { ...x, kind: 'gasto', driver_name: drv ? drv.full_name : 'Motorista' };
            })
          ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

          setTimelineItems(combined)
        }
      }
      setLoading(false)
    }
    fetchTeamData()
  }, [router])

  // Lógica de Filtros no Client (Data + Tipo + Funcionário)
  const filteredItems = timelineItems.filter(item => {
    const itemDate = new Date(item.created_at);
    const itemDateString = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
    
    const matchesDate = itemDateString === selectedDate;
    const matchesType = typeFilter === 'all' || item.kind === typeFilter;
    const matchesEmployee = employeeFilter === 'all' || item.driver_id === employeeFilter;

    return matchesDate && matchesType && matchesEmployee;
  })

  // Estatísticas Dinâmicas baseadas no filtro atual de data e funcionário
  const stats = filteredItems.reduce((acc, curr) => {
    if (curr.kind === 'viagem') acc.trips += 1;
    if (curr.kind === 'gasto') acc.expenses += Number(curr.value);
    return acc;
  }, { trips: 0, expenses: 0 })

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest text-2xl uppercase">Carregando...</div>

  return (
    <main className="min-h-screen w-full bg-[#020617] text-white pt-10 md:pt-20 px-4 md:px-10 pb-32 overflow-x-hidden">
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Faixa Superior Integrada ao Menu (Branding e Ação) */}
        <div className="-mt-10 md:-mt-20 mb-4 flex items-center justify-between border-b border-white/5 pb-6 pt-6 md:pt-10">
          <div className="flex items-center gap-4">
            <img 
              src="/logo.png" 
              alt="Logo" 
              className="w-20 h-20 md:w-24 md:h-24 object-contain shrink-0" 
            />
            <span className="text-2xl font-black italic tracking-tighter uppercase text-white">
              TRUCK<span className="text-orange-500">FLOW</span>
              <span className="text-orange-500 font-extrabold">.</span>
            </span>
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

        {/* Identificação da Empresa em Evidência */}
        <div className="mb-12 text-left">
          <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Controle de Equipe</p>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none break-words text-white">
            {profile?.companies?.name || 'Sem Empresa'}
          </h1>
        </div>

        {/* Estatísticas Dinâmicas */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Viagens Dia</p>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter leading-none text-white">{stats.trips}</span>
            </div>
          </div>
          <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left overflow-hidden">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Gastos Dia</p>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl md:text-2xl font-black italic tracking-tighter leading-none text-orange-500 truncate" title={`R$${stats.expenses.toFixed(2)}`}>
                R${stats.expenses.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Total Frota</p>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter leading-none text-white">{drivers.length}</span>
            </div>
          </div>
        </div>

        {/* BARRA DE FILTROS TRIPLA PREMIUM (Lado a Lado) */}
        <div className="grid grid-cols-3 gap-2 mb-8 animate-in fade-in slide-in-from-top-3 duration-500 ease-out">
          
          {/* Card 1: Calendário de Data */}
          <div className="relative active:scale-[0.97] transition-all bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-orange-500/30">
            <div className="flex items-center gap-2">
              <span className="text-sm">📅</span>
              <span className="text-[9px] font-black tracking-wider text-white uppercase">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
              </span>
            </div>
            <span className="text-[7px] text-orange-500">▼</span>
            
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Card 2: Seletor de Motorista */}
          <div className="relative w-full">
            <div 
              onClick={() => { setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen); setIsTypeDropdownOpen(false); }}
              className="active:scale-[0.97] transition-all bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-orange-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">👤</span>
                <span className="text-[9px] font-black tracking-wider text-white uppercase truncate max-w-[50px] md:max-w-[80px]">
                  {employeeFilter === 'all' ? 'Frota' : drivers.find(d => d.id === employeeFilter)?.full_name.split(' ')[0]}
                </span>
              </div>
              <span className={`text-[7px] text-orange-500 transition-transform duration-300 ${isEmployeeDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </div>

            {isEmployeeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsEmployeeDropdownOpen(false)} />
                <div className="absolute top-full left-0 w-full mt-2 bg-[#020617] border border-white/10 rounded-2xl p-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setEmployeeFilter('all'); setIsEmployeeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${employeeFilter === 'all' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                  >
                    👥 Toda Frota
                  </button>
                  {drivers.map(d => (
                    <button
                      key={d.id}
                      onClick={() => { setEmployeeFilter(d.id); setIsEmployeeDropdownOpen(false); }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all truncate ${employeeFilter === d.id ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                    >
                      👤 {d.full_name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Card 3: Seletor de Tipo */}
          <div className="relative w-full">
            <div 
              onClick={() => { setIsTypeDropdownOpen(!isTypeDropdownOpen); setIsEmployeeDropdownOpen(false); }}
              className="active:scale-[0.97] transition-all bg-white/5 border border-white/10 rounded-2xl p-3 flex items-center justify-between cursor-pointer hover:border-orange-500/30"
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {typeFilter === 'all' ? '📑' : typeFilter === 'viagem' ? '🚛' : '💸'}
                </span>
                <span className="text-[9px] font-black tracking-wider text-white uppercase">
                  {typeFilter === 'all' ? 'Todos' : typeFilter === 'viagem' ? 'Viagens' : 'Gastos'}
                </span>
              </div>
              <span className={`text-[7px] text-orange-500 transition-transform duration-300 ${isTypeDropdownOpen ? 'rotate-180' : 'rotate-0'}`}>▼</span>
            </div>

            {isTypeDropdownOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                <div className="absolute top-full left-0 w-full mt-2 bg-[#020617] border border-white/10 rounded-2xl p-2 z-50 shadow-[0_10px_30px_rgba(0,0,0,0.8)] space-y-1 animate-in fade-in slide-in-from-top-2 duration-200">
                  <button
                    onClick={() => { setTypeFilter('all'); setIsTypeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${typeFilter === 'all' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                  >
                    📑 Todos
                  </button>
                  <button
                    onClick={() => { setTypeFilter('viagem'); setIsTypeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${typeFilter === 'viagem' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                  >
                    🚛 Viagens
                  </button>
                  <button
                    onClick={() => { setTypeFilter('gasto'); setIsTypeDropdownOpen(false); }}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all ${typeFilter === 'gasto' ? 'bg-orange-500 text-black' : 'text-white/80 hover:bg-white/5'}`}
                  >
                    💸 Gastos
                  </button>
                </div>
              </>
            )}
          </div>

        </div>

        {/* Linha Cronológica Filtrada */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={`${item.kind}-${item.id}`} 
              onClick={() => {
                setIsEmployeeDropdownOpen(false);
                setIsTypeDropdownOpen(false);
                setSelectedTrip(item);
              }} 
              className="relative group active:scale-[0.98] transition-all cursor-pointer mb-4"
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
                      {/* Nome do motorista em cima */}
                      <p className="text-[8px] font-black text-orange-500 uppercase tracking-[2px] leading-none mb-1 italic">
                        {item.driver_name}
                      </p>
                      <h4 className="text-white font-black text-sm uppercase tracking-tight leading-none">
                        {item.kind === 'viagem' ? item.origin : item.type}
                      </h4>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-[9px] font-black text-white/80 uppercase tracking-wider bg-white/5 px-2 py-0.5 rounded-md border border-white/10">
                          {item.kind === 'viagem' ? (item.material || 'Carga') : `R$ ${item.value}`}
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
          <div className="text-center py-12 bg-white/5 border border-white/10 rounded-[32px]">
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Nenhum registro para os filtros selecionados</p>
          </div>
        )}

        {/* Drawer Lateral */}
        <div className={`fixed inset-0 z-[200] flex justify-end transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className={`relative w-[85%] max-w-sm bg-[#020617] h-full border-l border-white/10 p-8 shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10">✕</button>
            </div>

            <div className="space-y-8">
              <div className="bg-white/5 rounded-[24px] p-4 border border-white/5">
                <p className="text-[8px] font-black uppercase text-orange-500 tracking-[2px] mb-3 italic text-center">Acesso Frota</p>
                <div className="flex items-center justify-between gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <code className="text-white font-black tracking-widest text-xs">{profile?.companies?.company_token}</code>
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(profile?.companies?.company_token || ""); 
                      setAlertMessage("Código de acesso copiado com sucesso!"); 
                    }} 
                    className="bg-orange-500 text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase transition-all active:scale-95"
                  >
                    Copiar
                  </button>
                </div>
              </div>

              <nav className="space-y-1">
                <p className="text-[9px] font-black uppercase text-white/40 tracking-[4px] ml-4 mb-4 font-bold">Navegação</p>
                <button onClick={() => router.push('/dashboard/admin')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🏠 Início</button>
                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left p-5 rounded-3xl bg-orange-500/10 text-orange-500 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🚛 Minha Equipe</button>
                <button onClick={() => router.push('/dashboard/admin/portal')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🏗️ Obras</button>
                <div className="h-[1px] w-full bg-white/5 my-4" />
                <button onClick={() => router.push('/dashboard/admin/settings')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">⚙️ Configurações</button>
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full text-left p-5 rounded-3xl hover:bg-red-500/5 text-red-500/80 hover:text-red-500 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">🔴 Sair</button>
              </nav>
            </div>
          </div>
        </div>

        </div> {/* Fechamento do max-w-7xl original */}

      {/* MINI-EXTRATO (Com animação e correção de Build) */}
      <div className={`fixed inset-0 z-[150] flex items-center justify-center p-4 md:p-10 bg-black/95 backdrop-blur-xl transition-all duration-500 ${selectedTrip ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className={`glass w-full max-w-lg p-8 rounded-[40px] border border-white/10 shadow-2xl relative text-white transition-all duration-500 ease-out ${selectedTrip ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}`}>
          {selectedTrip && (
            <>
              {selectedTrip.kind === 'viagem' ? (
                /* LAYOUT DE RESUMO DE VIAGEM */
                <>
                  <div className="mb-8 text-left">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo da Viagem</h2>
                    <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Digital</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Origem</p>
                        <p className="font-black uppercase text-sm">{selectedTrip.origin}</p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Destino</p>
                        <p className="font-black uppercase text-sm">{selectedTrip.destination}</p>
                      </div>
                    </div>

                    <div className="bg-white/5 p-5 rounded-[32px] border border-white/5 flex items-center justify-between">
                      <div>
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Material</p>
                        <p className="font-black uppercase text-orange-500 italic">{selectedTrip.material}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Data</p>
                        <p className="font-black uppercase text-xs">{new Date(selectedTrip.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>

                    <div>
                      {selectedTrip.photo_url ? (
                        <div 
                          onClick={() => setActiveLightboxUrl(selectedTrip.photo_url)}
                          className="relative group w-full aspect-video rounded-[32px] overflow-hidden border-2 border-white/5 cursor-zoom-in hover:border-orange-500/50 transition-all"
                        >
                          <img src={selectedTrip.photo_url} className="w-full h-full object-cover" alt="Comprovante" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white font-black text-[10px] uppercase tracking-[3px] bg-black/75 border border-white/10 px-5 py-3 rounded-2xl">
                              🔍 Ampliar Foto
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center">
                          <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Sem foto registrada</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedTrip(null);
                        setActiveLightboxUrl(null);
                      }} 
                      className="w-full bg-white text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all active:scale-95 shadow-xl"
                    >
                      Fechar Resumo
                    </button>
                  </div>
                </>
              ) : (
                /* LAYOUT DE RESUMO DE DESPESA (NOVO GASTO) */
                <>
                  <div className="mb-8 text-left">
                    <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo da Despesa</h2>
                    <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Financeiro</p>
                  </div>

                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Categoria</p>
                        <p className="font-black uppercase text-sm flex items-center gap-1.5">
                          {selectedTrip.type === 'Combustível' ? '⛽' : 
                           selectedTrip.type === 'Borracharia' ? '🛞' : '📦'} {selectedTrip.type}
                        </p>
                      </div>
                      <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Valor</p>
                        <p className="font-black uppercase text-sm text-orange-500 italic">R$ {Number(selectedTrip.value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                      </div>
                    </div>

                    {selectedTrip.description && (
                      <div className="bg-[#020617]/40 p-5 rounded-[32px] border border-white/5">
                        <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Observação</p>
                        <p className="font-medium text-xs text-white/80">{selectedTrip.description}</p>
                      </div>
                    )}

                    <div className="bg-white/5 p-4 rounded-[24px] border border-white/5 flex justify-between items-center">
                      <p className="text-[8px] font-black uppercase text-white/70 tracking-widest">Data do Lançamento</p>
                      <p className="font-black uppercase text-xs">{new Date(selectedTrip.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>

                    <div>
                      {selectedTrip.photo_url ? (
                        <div 
                          onClick={() => setActiveLightboxUrl(selectedTrip.photo_url)}
                          className="relative group w-full aspect-video rounded-[32px] overflow-hidden border-2 border-white/5 cursor-zoom-in hover:border-orange-500/50 transition-all"
                        >
                          <img src={selectedTrip.photo_url} className="w-full h-full object-cover" alt="Comprovante de Despesa" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                            <span className="text-white font-black text-[10px] uppercase tracking-[3px] bg-black/75 border border-white/10 px-5 py-3 rounded-2xl">
                              🔍 Ampliar Foto
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-full h-32 bg-white/5 rounded-[32px] border border-dashed border-white/10 flex items-center justify-center">
                          <p className="text-[10px] font-black uppercase text-white/20 tracking-widest italic">Sem foto registrada</p>
                        </div>
                      )}
                    </div>

                    <button 
                      onClick={() => {
                        setSelectedTrip(null);
                        setActiveLightboxUrl(null);
                      }} 
                      className="w-full bg-white text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all active:scale-95 shadow-xl"
                    >
                      Fechar Resumo
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        {/* LIGHTBOX DE FOTO EM TELA CHEIA */}
        {activeLightboxUrl && (
          <div 
            className="absolute inset-0 z-[160] bg-black/98 flex flex-col items-center justify-center p-4 md:p-10 select-none animate-in fade-in duration-300"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLightboxUrl(null);
            }}
          >
            {/* Botões fixados no topo do viewport */}
            <div className="absolute top-6 left-6 right-6 z-[170] flex justify-between items-center pointer-events-none">
              {/* Botão de Fechar (Esquerdo) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  setActiveLightboxUrl(null)
                }}
                className="pointer-events-auto bg-black/80 hover:bg-black text-white w-14 h-14 rounded-full flex items-center justify-center border border-white/10 shadow-2xl transition-all active:scale-90 text-xl font-black"
                title="Fechar"
              >
                ✕
              </button>

              {/* Botão de Download (Direito) */}
              <button 
                onClick={(e) => {
                  e.stopPropagation()
                  handleDownloadFile(activeLightboxUrl, `comprovante-${selectedTrip?.origin || selectedTrip?.type || 'registro'}.jpg`)
                }}
                className="pointer-events-auto bg-[#F97316] hover:bg-orange-600 text-black w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all active:scale-90 text-2xl font-bold"
                title="Baixar Imagem"
              >
                📥
              </button>
            </div>

            {/* Container centralizado da imagem */}
            <div className="w-full max-w-4xl max-h-[80vh] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
              <img 
                src={activeLightboxUrl} 
                className="max-w-full max-h-[80vh] object-contain rounded-3xl border border-white/10 shadow-2xl" 
                alt="Visualização Completa" 
              />
            </div>
          </div>
        )}
      </div>

      {/* MODAL DE ALERTA PREMIUM CUSTOMIZADO (SUBSTITUTO DO ALERT NATIVO) */}
      {alertMessage && (
        <div className="fixed inset-0 z-[700] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-sm p-6 rounded-[32px] border border-white/10 shadow-2xl relative text-center text-white animate-in zoom-in-95 duration-200">
            {/* Ícone Alerta Animado */}
            <div className="w-14 h-14 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4 animate-bounce">
              ⚠️
            </div>
            
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white mb-2">Atenção</h3>
            <p className="text-white/70 text-xs font-medium leading-relaxed mb-6 italic">{alertMessage}</p>
            
            {/* Botão de Fechar */}
            <button 
              onClick={() => setAlertMessage(null)}
              className="w-full bg-[#F97316] hover:bg-orange-600 text-black font-black uppercase tracking-[2px] py-4 rounded-2xl text-xs transition-all active:scale-95 shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  )
}