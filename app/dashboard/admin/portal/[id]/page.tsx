"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter, useParams } from "next/navigation"

export default function ProjectReportPage() {
  const { id } = useParams()
  const [profile, setProfile] = useState<any>(null)
  const [project, setProject] = useState<any>(null)
  const [entries, setEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Guarda o registro inteiro selecionado para o modal de resumo
  const [selectedEntry, setSelectedEntry] = useState<any>(null)
  // Estado para a foto em tela cheia (Lightbox)
  const [activeLightboxUrl, setActiveLightboxUrl] = useState<string | null>(null)
  // Estado para substituir alertas padrão por alerta premium
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  // Estados para o intervalo de datas (Padrão: Hoje)
  const [startDate, setStartDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });
  const [endDate, setEndDate] = useState(() => {
    const today = new Date();
    return `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  });

  const router = useRouter()

  // Função de Busca com Filtro de Intervalo
  const fetchEntries = async () => {
    const startQuery = `${startDate}T00:00:00-03:00`
    const endQuery = `${endDate}T23:59:59-03:00`

    const { data } = await supabase
      .from('external_entries')
      .select('*')
      .eq('project_id', id)
      .gte('created_at', startQuery)
      .lte('created_at', endQuery)
      .order('created_at', { ascending: false })

    setEntries(data || [])
  }

  useEffect(() => {
    const initData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)

      const { data: proj } = await supabase.from('projects').select('*').eq('id', id).single()
      setProject(proj)

      await fetchEntries()
      setLoading(false)
    }
    initData()
  }, [id, router])

  // Dispara a busca sempre que as datas mudarem
  useEffect(() => {
    if (!loading) fetchEntries()
  }, [startDate, endDate])

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
      // Caso ocorra bloqueio de segurança (CORS), abre em nova aba para salvar manualmente
      window.open(imageUrl, "_blank")
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest text-2xl uppercase">Carregando...</div>

  return (
    <main className="min-h-screen w-full bg-[#020617] text-white pt-10 md:pt-20 px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER + FILTRO INTELIGENTE */}
        <div className="mb-10">
          
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

          {/* Identificação da Obra (Títulos Preservados) */}
          <div className="flex items-start justify-between mb-8 text-left">
            <div className="text-left">
              <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Relatório de Check-In</p>
              <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
                {project?.name || 'Obra'}
              </h1>
            </div>
          </div>

          {/* BARRA DE FILTRO DE DATA (INTERVALO) + CARD TOTAL COMBINADO */}
          <div className="flex gap-3 mb-8 animate-in fade-in slide-in-from-top-3 duration-500 ease-out h-[84px]">
            
            {/* Card de Data Nude Premium */}
            <div className="flex-1 grid grid-cols-2 bg-[#F8F5F2] border border-white/20 rounded-[28px] relative overflow-hidden shadow-xl">
              <div className="relative flex flex-col items-center justify-center border-r border-black/5 hover:bg-black/[0.03] transition-all px-4 text-center">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] mb-1 italic">Início</span>
                <span className="text-sm font-black text-[#020617] uppercase tracking-tight">
                  {new Date(startDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
                <input 
                  type="date" value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
              <div className="relative flex flex-col items-center justify-center hover:bg-black/[0.03] transition-all px-4 text-center">
                <span className="text-[9px] font-black text-orange-500 uppercase tracking-[2px] mb-1 italic">Fim</span>
                <span className="text-sm font-black text-[#020617] uppercase tracking-tight">
                  {new Date(endDate + 'T00:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })}
                </span>
                <input 
                  type="date" value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-30 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
                  style={{ colorScheme: 'dark' }}
                />
              </div>
            </div>

            {/* Card Total Nude Premium (Sincronizado) */}
            <div className="w-[84px] bg-[#F8F5F2] border border-white/20 rounded-[28px] flex flex-col items-center justify-center shrink-0 text-center shadow-xl select-none">
              <p className="text-[9px] font-black uppercase text-orange-500 tracking-[1px] mb-1 italic">Total</p>
              <span className="text-2xl font-black italic tracking-tighter leading-none text-[#020617]">
                {entries.length}
              </span>
            </div>
          </div>
        </div>

        {/* GRID DE CHECK-INS 3X3 - ULTRA-MODERNO (ASSINATURA VISUAL TRUCKFLOW) */}
        {entries.length > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {entries.map((entry) => (
              <div 
                key={entry.id}
                onClick={() => setSelectedEntry(entry)}
                className="h-32 w-full relative bg-white border-l-[10px] border-orange-500 rounded-[32px] flex flex-col justify-between p-4 cursor-pointer active:scale-95 transition-all shadow-2xl text-left hover:shadow-orange-500/10 hover:border-orange-600"
              >
                {/* 1. Bloco Superior: Tag do Motorista + Horário Empilhado Verticalmente (Safe para Mobile) */}
                <div className="flex flex-col items-start gap-2.5 w-full">
                  {/* Tag do Nome */}
                  <div className="bg-slate-100 px-2 py-1 rounded-lg inline-flex items-center gap-1 shadow-sm max-w-full overflow-hidden">
                    <span className="text-[9px] leading-none">👤</span>
                    <span className="uppercase font-black tracking-wider leading-none truncate" style={{ fontSize: '8px', color: '#64748b' }}>
                      {entry.driver_name.split(' ')[0]}
                    </span>
                  </div>
                  
                  {/* Horário Logo Abaixo */}
                  <div className="inline-flex items-center gap-1 pl-1">
                    <span className="text-[9px] leading-none">🕒</span>
                    <span className="font-bold leading-none" style={{ fontSize: '9px', color: '#94a3b8' }}>
                      {new Date(entry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                {/* 2. Bloco Inferior: Placa em Destaque Moderno */}
                <div className="w-full">
                  <span className="uppercase font-black block leading-none" style={{ fontSize: '7px', color: '#94a3b8', letterSpacing: '1px' }}>
                    Placa do Veículo
                  </span>
                  <h4 className="font-mono font-black tracking-widest uppercase italic leading-none mt-2" style={{ fontSize: '14px', color: '#020617' }}>
                    {entry.vehicle_plate}
                  </h4>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-24 text-center bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[50px]">
             <p className="text-white/20 font-black uppercase text-[10px] tracking-[5px] italic">Aguardando primeiros check-ins...</p>
          </div>
        )}
      </div>

      {/* DRAWER LATERAL PADRONIZADO */}
      <div className={`fixed inset-0 z-[200] flex justify-end transition-opacity duration-500 ${isMenuOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <div className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md" onClick={() => setIsMenuOpen(false)} />
        <div className={`relative w-[85%] max-w-sm bg-[#020617] h-full border-l border-white/10 p-8 shadow-2xl transition-transform duration-500 ease-out ${isMenuOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex justify-between items-center mb-10 text-left">
            <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Menu</h3>
            <button onClick={() => setIsMenuOpen(false)} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10">✕</button>
          </div>

          <div className="space-y-8">
            <div className="bg-white/5 rounded-[24px] p-4 border border-white/5">
              <p className="text-[8px] font-black uppercase text-orange-500 tracking-[2px] mb-3 italic text-center text-left">Código de Acesso</p>
              <div className="flex items-center justify-between gap-2 bg-black/40 p-3 rounded-xl border border-white/5">
                <code className="text-white font-black tracking-widest text-xs uppercase">{profile?.companies?.company_token}</code>
                <button 
                  onClick={() => { 
                    navigator.clipboard.writeText(profile?.companies?.company_token); 
                    setAlertMessage("Código de acesso copiado com sucesso!"); 
                  }} 
                  className="bg-orange-500 text-black text-[8px] font-black px-3 py-1.5 rounded-lg uppercase transition-all active:scale-95"
                >
                  Copiar
                </button>
              </div>
            </div>

            <nav className="space-y-1">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[4px] ml-4 mb-4 font-bold text-left uppercase">Navegação</p>
              <button onClick={() => router.push('/dashboard/admin')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🏠 Início</button>
              <button onClick={() => router.push('/dashboard/admin/team')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🚛 Minha Equipe</button>
              <button onClick={() => router.push('/dashboard/admin/portal')} className="w-full text-left p-5 rounded-3xl bg-orange-500/10 text-orange-500 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🏗️ Obras</button>
              <div className="h-[1px] w-full bg-white/5 my-4" />
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full text-left p-5 rounded-3xl hover:bg-red-500/5 text-red-500/80 hover:text-red-500 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm uppercase">🔴 Sair</button>
            </nav>
          </div>
        </div>
      </div>

      {/* MODAL DE RESUMO COMPLETO DO CHECK-IN */}
      {selectedEntry && (
        <div 
          className="fixed inset-0 z-[500] bg-black/95 backdrop-blur-xl flex items-start md:items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 overflow-y-auto"
          onClick={() => setSelectedEntry(null)}
        >
          <div 
            className="glass w-full max-w-lg p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl relative text-white my-8 transition-all duration-300 scale-100 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Cabeçalho do Modal (Simplificado sem o botão X repetido) */}
            <div className="mb-8 text-left">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter leading-none">Resumo do Check-in</h2>
              <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Prova Visual Terceirizada</p>
            </div>

            {/* Conteúdo Detalhado */}
            <div className="space-y-6 text-left">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Motorista</p>
                  <p className="font-black uppercase text-sm text-white truncate">{selectedEntry.driver_name}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Placa</p>
                  <p className="font-black uppercase text-sm text-orange-500 italic">{selectedEntry.vehicle_plate}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Tipo de Lançamento</p>
                  <p className="font-black uppercase text-xs text-white/80">{project?.payment_model || 'Não definido'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-[24px] border border-white/5">
                  <p className="text-[8px] font-black uppercase text-white/70 tracking-widest mb-1">Hora/Data</p>
                  <p className="font-black uppercase text-xs text-white/80">
                    {new Date(selectedEntry.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} - {new Date(selectedEntry.created_at).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>

              {/* Foto do Comprovante Carimbada (Agora clicável para ampliar) */}
              <div 
                onClick={() => setActiveLightboxUrl(selectedEntry.photo_url)}
                className="relative group rounded-[32px] overflow-hidden border border-white/10 cursor-zoom-in hover:border-orange-500/50 transition-all"
              >
                <img src={selectedEntry.photo_url} className="w-full h-auto object-cover" alt="Comprovante" />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                  <span className="text-white font-black text-[10px] uppercase tracking-[3px] bg-black/75 border border-white/10 px-5 py-3 rounded-2xl">
                    🔍 Ampliar Foto
                  </span>
                </div>
              </div>

              {/* Botões de Ação (Simplificado) */}
              <div className="space-y-3 pt-2">
                <button 
                  onClick={() => setSelectedEntry(null)} 
                  className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all active:scale-95 text-xs shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
                >
                  Fechar Resumo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    {/* MODAL DE FOTO EM TELA CHEIA (LIGHTBOX) COM BOTÕES FIXOS NO TOPO DA TELA */}
      {activeLightboxUrl && (
        <div 
          className="fixed inset-0 z-[600] bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300 select-none"
          onClick={() => setActiveLightboxUrl(null)}
        >
          {/* Botões fixados no topo do viewport, imunes ao tamanho da imagem */}
          <div className="fixed top-6 left-6 right-6 z-[610] flex justify-between items-center pointer-events-none">
            {/* Botão de Fechar (Agora no Canto Superior Esquerdo) */}
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

            {/* Botão de Download (Agora no Canto Superior Direito) */}
            <button 
              onClick={(e) => {
                e.stopPropagation()
                handleDownloadFile(activeLightboxUrl, `comprovante-${selectedEntry?.vehicle_plate || 'registro'}.jpg`)
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