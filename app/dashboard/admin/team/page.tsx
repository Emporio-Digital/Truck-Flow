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
  // Estados para controle de exclusão segura
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)

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

  // Estados dos Filtros (Intervalo de Datas)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });

  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  });
  const [typeFilter, setTypeFilter] = useState<'all' | 'viagem' | 'gasto'>('all')
  const [employeeFilter, setEmployeeFilter] = useState<string>('all')

  // Controle do Modal de Filtros Elegante
  const [isFiltersModalOpen, setIsFiltersModalOpen] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchTeamData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)

      if (prof?.company_id) {
        const { data: teamDrivers } = await supabase.from('profiles')
          .select('*')
          .eq('company_id', prof.company_id)
          .eq('role', 'driver')

        setDrivers(teamDrivers || [])

        if (teamDrivers && teamDrivers.length > 0) {
          const driverIds = teamDrivers.map(d => d.id)

          // Lógica de busca dinâmica baseada no intervalo selecionado
          const startQuery = `${startDate}T00:00:00-03:00`
          const endQuery = `${endDate}T23:59:59-03:00`

          const { data: t } = await supabase.from('trips')
            .select('*')
            .in('driver_id', driverIds)
            .gte('created_at', startQuery)
            .lte('created_at', endQuery)

          const { data: e } = await supabase.from('expenses')
            .select('*')
            .in('driver_id', driverIds)
            .gte('created_at', startQuery)
            .lte('created_at', endQuery)

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
  }, [router, startDate, endDate])

  // Executa a remoção direta de registros da equipe no Supabase (Sobrescrita do Administrador)
  const executeDelete = async () => {
    if (!selectedTrip) return
    setDeleting(true)
    try {
      const table = selectedTrip.kind === 'viagem' ? 'trips' : 'expenses'
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', selectedTrip.id)

      if (error) throw error
      
      setShowDeleteConfirm(false)
      setSelectedTrip(null)
      window.location.reload()
    } catch (err: any) {
      setAlertMessage(`Erro ao excluir o registro: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  // Lógica de Filtros no Client (Intervalo + Tipo + Funcionário)
  const filteredItems = timelineItems.filter(item => {
    const itemDate = new Date(item.created_at);
    const itemDateString = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
    
    const matchesDate = itemDateString >= startDate && itemDateString <= endDate;
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
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Viagens do Período</p>
            <div className="flex flex-col">
              <span className="text-2xl font-black italic tracking-tighter leading-none text-white">{stats.trips}</span>
            </div>
          </div>
          <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left overflow-hidden">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Gastos do Período</p>
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

        {/* NOVA BARRA DE FILTRO DE DATA (EXPANDIDA) + BOTÃO DE FILTROS ADICIONAIS */}
        <div className="flex gap-3 mb-8 animate-in fade-in slide-in-from-top-3 duration-500 ease-out h-[84px]">
          
          {/* Card de Data com mais Respiro - TOM NUDE PREMIUM */}
          <div className="flex-1 grid grid-cols-2 bg-[#F8F5F2] border border-white/20 rounded-[28px] relative overflow-hidden shadow-xl">
            <div className="relative flex flex-col items-center justify-center border-r border-black/5 hover:bg-black/[0.03] transition-all px-4">
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] mb-1 italic">Início</span>
              <span className="text-sm font-black text-[#020617] uppercase tracking-tight">
                {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
              <input 
                type="date" value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
            <div className="relative flex flex-col items-center justify-center hover:bg-black/[0.03] transition-all px-4">
              <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] mb-1 italic">Fim</span>
              <span className="text-sm font-black text-[#020617] uppercase tracking-tight">
                {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
              </span>
              <input 
                type="date" value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              />
            </div>
          </div>

          {/* Botão de Abrir Filtros - TOM NUDE PREMIUM */}
          <button 
            onClick={() => setIsFiltersModalOpen(true)}
            className="relative w-[84px] bg-[#F8F5F2] text-[#020617] rounded-[28px] flex flex-col items-center justify-center gap-1 shadow-xl active:scale-90 transition-all hover:bg-orange-500 hover:text-white group border border-white/20"
          >
            <span className="text-xl group-hover:scale-110 transition-transform">⚙️</span>
            <span className="text-[8px] font-black uppercase tracking-tighter">Filtros</span>
            {(typeFilter !== 'all' || employeeFilter !== 'all') && (
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-orange-500 text-white border-[3px] border-[#F8F5F2] rounded-full flex items-center justify-center text-[10px] font-black shadow-lg animate-bounce">
                !
              </div>
            )}
          </button>
        </div>

        {/* Linha Cronológica Filtrada */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div 
              key={`${item.kind}-${item.id}`} 
              onClick={() => {
                
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
        <div className={`glass w-full max-w-lg p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl relative text-white max-h-[90vh] overflow-y-auto transition-all duration-500 ease-out ${selectedTrip ? 'scale-100 translate-y-0 opacity-100' : 'scale-90 translate-y-10 opacity-0'}`}>
          {selectedTrip && (
            <>
              {selectedTrip.kind === 'viagem' ? (
                /* LAYOUT DE RESUMO DE VIAGEM */
                <>
                  <div className="flex justify-between items-start mb-8 text-left">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo</h2>
                      <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Digital</p>
                    </div>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 shrink-0"
                      title="Excluir Registro"
                    >
                      🗑️
                    </button>
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
                  <div className="flex justify-between items-start mb-8 text-left">
                    <div>
                      <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo da Despesa</h2>
                      <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Comprovante Financeiro</p>
                    </div>
                    <button 
                      onClick={() => setShowDeleteConfirm(true)}
                      className="w-10 h-10 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90 shrink-0"
                      title="Excluir Registro"
                    >
                      🗑️
                    </button>
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO PREMIUM (SEM POPUPS DO NAVEGADOR) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[750] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-sm p-6 rounded-[32px] border border-white/10 shadow-2xl relative text-center text-white animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white mb-2">Excluir Registro?</h3>
            <p className="text-white/70 text-xs font-medium leading-relaxed mb-6 italic">
              Esta ação é permanente e removerá este comprovante de {selectedTrip?.kind === 'viagem' ? 'viagem' : 'despesa'} definitivamente do histórico do colaborador.
            </p>
            
            <div className="flex gap-3">
              <button 
                disabled={deleting}
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 bg-white/5 hover:bg-white/10 text-white font-black uppercase tracking-[1px] py-4 rounded-2xl text-[10px] transition-all border border-white/10 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button 
                disabled={deleting}
                onClick={executeDelete}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-black uppercase tracking-[1px] py-4 rounded-2xl text-[10px] transition-all shadow-[0_5px_20px_rgba(239,68,68,0.3)] disabled:opacity-50"
              >
                {deleting ? "EXCLUINDO..." : "EXCLUIR"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NOVO MODAL DE FILTROS ELEGANTE (BOTTOM SHEET STYLE) */}
      <div className={`fixed inset-0 z-[600] flex items-end justify-center p-4 pb-4 transition-all duration-500 ${isFiltersModalOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsFiltersModalOpen(false)} />
        
        <div className={`relative w-full max-w-md bg-[#F8F5F2] rounded-[48px] p-7 shadow-[0_20px_80px_rgba(0,0,0,0.5)] transition-all duration-500 ease-out ${isFiltersModalOpen ? 'translate-y-0 scale-100' : 'translate-y-20 scale-95 opacity-0'}`}>
          {/* Handle de arraste visual */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mb-8" />
          
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#020617]">Filtrar Atividade</h2>
            <button onClick={() => setIsFiltersModalOpen(false)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-400">✕</button>
          </div>

          <div className="space-y-8">
            {/* Seção 1: Tipo de Registro */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] mb-4 ml-1">Tipo de Lançamento</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'all', label: 'Todos', icon: '📑' },
                  { id: 'viagem', label: 'Viagens', icon: '🚛' },
                  { id: 'gasto', label: 'Gastos', icon: '💸' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTypeFilter(t.id as any)}
                    className={`flex flex-col items-center justify-center p-4 rounded-3xl border-2 transition-all ${typeFilter === t.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white hover:border-slate-200'}`}
                  >
                    <span className="text-xl mb-1">{t.icon}</span>
                    <span className={`text-[9px] font-black uppercase ${typeFilter === t.id ? 'text-orange-600' : 'text-slate-600'}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Linha Elegante Divisória */}
            <div className="h-[1px] w-full bg-slate-100" />

            {/* Seção 2: Lista de Motoristas */}
            <div>
              <p className="text-[10px] font-black uppercase text-slate-500 tracking-[2px] mb-4 ml-1">Selecionar Motorista</p>
              <div className="grid grid-cols-2 gap-3 max-h-[160px] overflow-y-auto pr-1 pb-1 custom-scrollbar outline-none">
                <button
                  onClick={() => setEmployeeFilter('all')}
                  className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${employeeFilter === 'all' ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white'}`}
                >
                  <span className="text-lg">👥</span>
                  <span className={`text-[10px] font-black uppercase ${employeeFilter === 'all' ? 'text-orange-600' : 'text-slate-600'}`}>Toda Frota</span>
                </button>
                {drivers.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setEmployeeFilter(d.id)}
                    className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all ${employeeFilter === d.id ? 'border-orange-500 bg-orange-50' : 'border-slate-100 bg-white'}`}
                  >
                    <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">👤</div>
                    <span className={`text-[10px] font-black uppercase truncate ${employeeFilter === d.id ? 'text-orange-600' : 'text-slate-600'}`}>{d.full_name.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Rodapé do Modal (Botões de Ação) */}
            <div className="flex gap-4 pt-4">
              <button 
                onClick={() => { setTypeFilter('all'); setEmployeeFilter('all'); }}
                className="flex-1 py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] text-slate-700 hover:bg-slate-50 transition-all border border-slate-100"
              >
                Limpar Filtros
              </button>
              <button 
                onClick={() => setIsFiltersModalOpen(false)}
                className="flex-[2] py-5 rounded-3xl font-black uppercase tracking-widest text-[11px] bg-orange-500 text-white shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95 transition-all"
              >
                Aplicar Filtros
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}