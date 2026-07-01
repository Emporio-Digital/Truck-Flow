"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import CreateCompanyModal from "@/components/CreateCompanyModal"
import NewTripModal from "@/components/NewTripModal"
import NewExpenseModal from "@/components/NewExpenseModal"

export default function AdminDashboard() {
  const [profile, setProfile] = useState<any>(null)
  const [timelineItems, setTimelineItems] = useState<any[]>([])
  const [stats, setStats] = useState({ trips: 0, expenses: 0, drivers: 0 })
  const [showFab, setShowFab] = useState(false)
  const [isTripModalOpen, setIsTripModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [selectedTrip, setSelectedTrip] = useState<any>(null)
  // Estado para a foto em tela cheia (Lightbox)
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null)
  // Estado para substituir alertas padrão por alerta premium
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth())
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const router = useRouter()
  // Estado para a data selecionada (Padrão: Hoje)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  })

  // Função para forçar o download direto de imagens externas (Supabase Storage)
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
      // Fallback seguro abrindo em nova aba para salvar manualmente
      window.open(imageUrl, "_blank")
    }
  }

  // Estado para o tipo de filtro (Todos / Viagem / Gasto)
  const [typeFilter, setTypeFilter] = useState<'all' | 'viagem' | 'gasto'>('all')
  // Estado para controlar a abertura do dropdown customizado
  const [isTypeDropdownOpen, setIsTypeDropdownOpen] = useState(false)

  const monthOptions = Array.from({ length: 6 }).map((_, i) => {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    return { label: d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }), month: d.getMonth(), year: d.getFullYear() }
  })

  useEffect(() => {
    const fetchDashboardData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")
      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)
      if (prof?.company_id) {
        const start = new Date(selectedYear, selectedMonth, 1).toISOString()
        const end = new Date(selectedYear, selectedMonth + 1, 0, 23, 59, 59).toISOString()
        
        // Busca os dados filtrando pelo ID da empresa (company_id) para consolidar os dados da frota
        const { data: t } = await supabase.from('trips').select('*').eq('company_id', prof.company_id).gte('created_at', start).lte('created_at', end)
        const { data: e } = await supabase.from('expenses').select('*').eq('company_id', prof.company_id).gte('created_at', start).lte('created_at', end)
        const { data: d } = await supabase.from('profiles').select('id').eq('company_id', prof.company_id).eq('role', 'driver')
        
        setStats({ trips: t?.length || 0, expenses: e?.reduce((acc, curr) => acc + Number(curr.value), 0) || 0, drivers: d?.length || 0 })
        const combined = [...(t || []).map(x => ({...x, kind: 'viagem'})), ...(e || []).map(x => ({...x, kind: 'gasto'}))]
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        setTimelineItems(combined)
      }
    }
    fetchDashboardData()
  }, [router, selectedMonth, selectedYear])
  // Filtra os itens da timeline combinando a Data Selecionada e o Tipo de Filtro
  const filteredItems = timelineItems.filter(item => {
    const itemDate = new Date(item.created_at);
    const itemDateString = `${itemDate.getFullYear()}-${String(itemDate.getMonth() + 1).padStart(2, '0')}-${String(itemDate.getDate()).padStart(2, '0')}`;
    
    const matchesDate = itemDateString === selectedDate;
    const matchesType = typeFilter === 'all' || item.kind === typeFilter;

    return matchesDate && matchesType;
  });

  if (!profile) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest">CARREGANDO...</div>

  return (
    <main className="relative min-h-screen w-full bg-[#020617] text-white pt-10 md:pt-20 px-4 md:px-10 pb-32 overflow-x-hidden">
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

        {/* Identificação da Empresa em Evidência (Sem Nome da Pessoa) */}
        <div className="mb-12 text-left">
          <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Painel de Gestão</p>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none break-words text-white">
            {profile.companies?.name || 'Sem Empresa'}
          </h1>
        </div>

        {/* Drawer Lateral Padronizado */}
        <div className={`fixed inset-0 z-[200] flex justify-end transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
          <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
          <div className={`relative w-[85%] max-w-sm bg-[#020617] h-full border-l border-white/10 p-8 shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
            <div className="flex justify-between items-center mb-10">
              <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Menu</h3>
              <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10">✕</button>
            </div>

            <div className="space-y-8">
              {/* Código de Acesso (Design Compacto) */}
              <div className="bg-white/5 rounded-[24px] p-4 border border-white/5">
                <p className="text-[8px] font-black uppercase text-orange-500 tracking-[2px] mb-3 italic text-center">Acesso Frota</p>
                <div className="flex items-center justify-between gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                  <code className="text-white font-black tracking-widest text-xs">{profile.companies?.company_token}</code>
                  <button 
                    onClick={() => { 
                      navigator.clipboard.writeText(profile.companies?.company_token); 
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
                
                {/* INÍCIO ATIVO */}
                <button onClick={() => setIsMenuOpen(false)} className="w-full text-left p-5 rounded-3xl bg-orange-500/10 text-orange-500 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🏠 Início</button>
                
                <button onClick={() => router.push('/dashboard/admin/team')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🚛 Minha Equipe</button>
                
                <button onClick={() => router.push('/dashboard/admin/portal')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm">🏗️ Obras</button>
                
                <div className="h-[1px] w-full bg-white/5 my-4" />
                
                <button onClick={() => router.push('/dashboard/admin/settings')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">⚙️ Configurações</button>
                
                <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full text-left p-5 rounded-3xl hover:bg-red-500/5 text-red-500/80 hover:text-red-500 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm">🔴 Sair</button>
              </nav>
            </div>
          </div>
        </div>

        {/* Stats em Mini-Cards Lado a Lado (Mobile First) */}
        <div className="grid grid-cols-3 gap-3 mb-8">
          <StatCard title="Viagens Dia" value={stats.trips} unit="total" />
          
          {/* Card de Gastos Customizado para Evitar Vazamentos */}
          <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28 text-left overflow-hidden">
            <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">Gastos Dia</p>
            <div className="flex flex-col">
              <span className="text-base sm:text-xl md:text-2xl font-black italic tracking-tighter leading-none text-orange-500 truncate" title={`R$${stats.expenses}`}>
                R${stats.expenses}
              </span>
            </div>
          </div>

          <StatCard title="Equipe" value={stats.drivers} unit="membros" />
        </div>

        {/* BARRA DE FILTROS HIGH-END (CLIQUE TOTAL & ALINHAMENTO MILIMÉTRICO) */}
        <div className="grid grid-cols-2 gap-3 mb-6 animate-in fade-in slide-in-from-top-3 duration-500 ease-out">
          
          {/* Card 1: Data de Lançamento (Clique em qualquer lugar) */}
          <div className="relative active:scale-[0.97] transition-all bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500/30">
            <div className="flex items-center gap-2.5">
              <span className="text-xs">📅</span>
              <span className="text-[10px] font-black tracking-wider text-white uppercase">
                {new Date(selectedDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
              </span>
            </div>
            <span className="text-[8px] text-orange-500">▼</span>
            
            {/* Input Nativo Oculto (Esticado para ocupar 100% da área de clique no Windows/Chrome) */}
            <input 
              type="date"
              value={selectedDate}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  setSelectedDate(val);
                  const [yyyy, mm] = val.split('-').map(Number);
                  setSelectedMonth(mm - 1);
                  setSelectedYear(yyyy);
                }
              }}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
              style={{ colorScheme: 'dark' }}
            />
          </div>

          {/* Card 2: Categoria do Filtro (Customizado Alinhado) */}
          <div className="relative w-full">
            <div 
              onClick={() => setIsTypeDropdownOpen(!isTypeDropdownOpen)}
              className="active:scale-[0.97] transition-all bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex items-center justify-between cursor-pointer hover:border-orange-500/30"
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

            {/* Menu de Opções Escuro (Drop-down com Largura Idêntica ao Card) */}
            {isTypeDropdownOpen && (
              <>
                {/* Fechar ao clicar fora */}
                <div className="fixed inset-0 z-40" onClick={() => setIsTypeDropdownOpen(false)} />
                
                {/* Caixa de Opções Alinhada perfeitamente nas laterais */}
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

        {/* LISTAGEM DOS ITENS FILTRADOS */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <div key={`${item.kind}-${item.id}`} onClick={() => setSelectedTrip(item)} className="relative group active:scale-[0.98] transition-all cursor-pointer mb-4">
              
              {/* CONTAINER COM BORDA NATIVA INQUEBRÁVEL (Bypassa o Cache do Tailwind) */}
              <div 
                className="relative bg-[#0f172a]/40 backdrop-blur-xl p-5 rounded-[32px] overflow-hidden transition-all duration-300"
                style={{
                  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
                  borderRight: '1px solid rgba(255, 255, 255, 0.05)',
                  borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
                  borderLeft: item.kind === 'viagem' ? '12px solid #f97316' : '12px solid #ffffff'
                }}
              >
                
                {/* CONTEÚDO CLEAN ORIGINAL */}
                <div className="flex items-center justify-between relative z-10">
                  <div className="flex items-center gap-5">
                    
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-xl border border-white/10 shrink-0">
                      {item.kind === 'viagem' ? '🚛' : '💸'}
                    </div>

                    <div>
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
          <div className="text-center py-10 bg-white/5 border border-white/10 rounded-[32px] mb-4">
            <p className="text-[10px] font-black uppercase text-white/30 tracking-widest italic">Nenhum registro para esta data</p>
          </div>
        )}


        {/* FAB ULTRA-MODERNO (CENTRALIZADO) */}
        <div className="fixed bottom-10 right-10 z-[100] flex flex-col items-center">
          
          {/* Menu de Opções */}
          <div className={`flex flex-col items-center gap-3 mb-5 transition-all duration-500 ease-[cubic-bezier(0.175,0.885,0.32,1.275)] ${showFab ? 'opacity-100 translate-y-0 scale-100' : 'opacity-0 translate-y-10 scale-50 pointer-events-none'}`}>
            
            {/* Botão Nova Viagem */}
            <button 
              onClick={() => { setIsTripModalOpen(true); setShowFab(false); }}
              className="group relative flex items-center justify-center"
            >
              <span className="absolute right-full mr-4 bg-orange-500 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                Novo Trampo
              </span>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl shadow-2xl hover:bg-orange-500 hover:text-black transition-all duration-300">
                🚛
              </div>
            </button>

            {/* Botão Lançar Gasto */}
            <button 
              onClick={() => { setIsExpenseModalOpen(true); setShowFab(false); }}
              className="group relative flex items-center justify-center"
            >
              <span className="absolute right-full mr-4 bg-white text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap shadow-xl">
                Lançar Gasto
              </span>
              <div className="w-14 h-14 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-xl shadow-2xl hover:bg-orange-500 hover:text-black transition-all duration-300">
                💸
              </div>
            </button>

          </div>

        {/* Botão Principal */}
          <button 
            onClick={() => setShowFab(!showFab)}
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(249,115,22,0.4)] transition-all duration-500 ${showFab ? 'bg-white text-black' : 'bg-orange-500 text-black'}`}
          >
            <div className={`text-4xl font-light transition-transform duration-500 flex items-center justify-center ${showFab ? 'rotate-[135deg]' : 'rotate-0'}`} style={{ width: '32px', height: '32px', paddingBottom: '6px' }}>
              +
            </div>
          </button>
        </div>

        {/* Se não tem empresa ainda, mostra o CTA */}
        {!profile.company_id && (
          <div className="glass w-full rounded-[40px] p-12 border border-white/5 text-center">
            <h3 className="text-2xl font-black italic uppercase mb-4 text-orange-500">Configuração Pendente</h3>
            <p className="text-white/40 mb-8 max-w-sm mx-auto font-medium text-sm">Você ainda não configurou sua frota. Crie sua empresa para gerar o Token para seus motoristas.</p>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="bg-white text-black px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:scale-105 transition-all"
            >
              Configurar Empresa Agora
            </button>
          </div>
        )}
      {/* Modal de Criação de Empresa */}
        {isModalOpen && (
          <CreateCompanyModal 
            userId={profile.id} 
            onSuccess={() => window.location.reload()} 
          />
        )}

      </div> {/* <--- FECHAMENTO DA DIRETRIZ max-w-7xl AQUI (Isola os modais para ficarem no topo absoluto de camadas) */}

      {/* Modal de Nova Viagem (Com animação) */}
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

        {/* Modal de Novo Gasto (Com animação) */}
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

          {/* LIGHTBOX DE FOTO EM TELA CHEIA (Renderizado de forma absoluta dentro do container z-150 que já cobre a tela inteira) */}
          {activeLightboxUrl && (
            <div 
              className="absolute inset-0 z-[160] bg-black/98 flex flex-col items-center justify-center p-4 md:p-10 select-none animate-in fade-in duration-300"
              onClick={(e) => {
                e.stopPropagation();
                setActiveLightboxUrl(null);
              }}
            >
              {/* Botões fixados no topo do viewport, imunes ao tamanho da imagem */}
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

function StatCard({ title, value, unit, color }: any) {
  return (
    <div className="glass p-4 rounded-[24px] border border-white/10 flex flex-col justify-between h-28">
      <p className="text-white/60 text-[8px] font-black uppercase tracking-[2px] leading-tight">{title}</p>
      <div className="flex flex-col">
        <span className={`text-2xl font-black italic tracking-tighter leading-none ${color || 'text-white'}`}>
          {value}
        </span>
        {unit && <span className="text-white/40 text-[8px] font-bold uppercase mt-1 font-black">{unit}</span>}
      </div>
    </div>
  )
}