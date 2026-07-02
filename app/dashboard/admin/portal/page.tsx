"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import CreateProjectModal from "@/components/CreateProjectModal"

export default function JobSitesPage() {
  const [profile, setProfile] = useState<any>(null)
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  // Estado para substituir alertas padrão por alerta premium
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  // Estados para controle de exclusão segura de obras
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      setProfile(prof)

      if (prof?.company_id) {
        const { data: projData } = await supabase.from('projects')
          .select('*')
          .eq('company_id', prof.company_id)
          .order('created_at', { ascending: false })
        
        setProjects(projData || [])
      }
      setLoading(false)
    }
    fetchData()
  }, [router])

  // Executa a exclusão definitiva da frente de obra no Supabase
  const executeDelete = async () => {
    if (!projectToDelete) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', projectToDelete.id)

      if (error) throw error

      setShowDeleteConfirm(false)
      setProjectToDelete(null)
      // Atualiza a lista local instantaneamente sem precisar recarregar a tela inteira
      setProjects(projects.filter(p => p.id !== projectToDelete.id))
    } catch (err: any) {
      setAlertMessage(`Erro ao excluir obra: ${err.message}`)
    } finally {
      setDeleting(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest text-2xl uppercase">Carregando...</div>

  return (
    <main className="min-h-screen w-full bg-[#020617] text-white pt-10 md:pt-20 px-6 pb-32">
      <div className="max-w-4xl mx-auto">
        
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

        {/* Identificação da Frente de Obras (Títulos Preservados) */}
        <div className="mb-12 text-left">
          <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Gestão de Frentes</p>
          <h1 className="text-4xl md:text-6xl font-black italic tracking-tighter uppercase leading-none text-white">
            Check-in <span className="text-orange-500">de Obra</span>
          </h1>
        </div>

        {/* LISTAGEM DE OBRAS */}
        <div className="grid grid-cols-1 gap-6">
          {projects.length > 0 ? (
            projects.map((project) => (
              <div 
                key={project.id}
                className="bg-[#0f172a]/60 backdrop-blur-xl p-8 rounded-[40px] border border-white/10 group hover:border-orange-500/40 transition-all relative overflow-hidden shadow-2xl text-left"
              >
                <div className="flex flex-col gap-4 text-left">
                  {/* Linha Topo: Nome, Status e Lixeira (Com pr-2 para não cortar fontes em itálico) */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none mb-1.5 uppercase truncate pr-2 max-w-[190px] md:max-w-[290px]">
                        {project.name}
                      </h3>
                      <p className="text-white/30 text-[9px] font-bold uppercase tracking-widest italic leading-none">
                        {project.address || 'Sem Endereço'}
                      </p>
                    </div>
                    
                    {/* Bloco de Ações Verticais Direitas */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {/* Botão Lixeira de Exclusão da Obra */}
                      <button 
                        onClick={() => {
                          setProjectToDelete(project)
                          setShowDeleteConfirm(true)
                        }}
                        className="w-8 h-8 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center justify-center text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                        title="Excluir Obra"
                      >
                        🗑️
                      </button>
                      
                      {/* Badge do Modelo de Acerto */}
                      <span className="text-[8px] font-black uppercase tracking-widest text-orange-500 bg-orange-500/10 px-2 py-1 rounded-md border border-orange-500/20 italic block leading-none">
                        {project.payment_model}
                      </span>
                    </div>
                  </div>

                  {/* Linha de Botões: Menores e Lado a Lado */}
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(`https://egtruckflow.com.br/check-in/${project.id}`)
                        setAlertMessage("Link de check-in copiado com sucesso!")
                      }}
                      className="flex-[2] bg-white text-black font-black uppercase text-[9px] tracking-widest h-12 rounded-xl hover:bg-orange-500 transition-all active:scale-95 italic"
                    >
                      Copiar Link
                    </button>
                    <button 
                      onClick={() => router.push(`/dashboard/admin/portal/${project.id}`)}
                      className="flex-1 bg-white/5 text-white/60 font-black uppercase text-[9px] tracking-widest h-12 rounded-xl border border-white/10 hover:bg-white/10 transition-all active:scale-95 italic"
                    >
                      Relatório
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-10 bg-white/[0.01] border-2 border-dashed border-white/5 rounded-[50px] text-center">
              <p className="text-white/20 font-black uppercase text-[10px] tracking-[5px] mb-8 italic text-center">Nenhuma obra ativa encontrada</p>
              <button 
                className="bg-orange-500 text-black px-10 py-5 rounded-[24px] font-black text-xs uppercase tracking-[2px] active:scale-95 transition-all shadow-[0_10px_40px_rgba(249,115,22,0.3)]"
                onClick={() => setIsModalOpen(true)}
              >
                Criar Primeira Frente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MENU LATERAL (DRAWER) */}
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
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[4px] ml-4 mb-4 font-bold text-left">Navegação</p>
              <button onClick={() => router.push('/dashboard/admin')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🏠 Início</button>
              <button onClick={() => router.push('/dashboard/admin/team')} className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🚛 Minha Equipe</button>
              <button onClick={() => setIsMenuOpen(false)} className="w-full text-left p-5 rounded-3xl bg-orange-500/10 text-orange-500 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm uppercase">🏗️ Obras</button>
              <div className="h-[1px] w-full bg-white/5 my-4" />
              <button onClick={() => supabase.auth.signOut().then(() => router.push('/login'))} className="w-full text-left p-5 rounded-3xl hover:bg-red-500/5 text-red-500/80 hover:text-red-500 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm uppercase">🔴 Sair</button>
            </nav>
          </div>
        </div>
      </div>

      {/* FAB (QUADRADO ARREDONDADO PERFEITO) */}
      <div className="fixed bottom-10 right-10 z-[100]">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="w-16 h-16 bg-orange-500 text-black rounded-2xl shadow-[0_10px_40px_rgba(249,115,22,0.4)] flex items-center justify-center hover:scale-110 active:scale-90 transition-all border-4 border-[#020617]"
        >
          <span className="text-4xl font-light leading-none mb-1">+</span>
        </button>
      </div>

      {/* MODAL DE CRIAÇÃO */}
      {isModalOpen && (
        <CreateProjectModal 
          companyId={profile?.company_id} 
          onClose={() => setIsModalOpen(false)}
          onSuccess={() => window.location.reload()}
        />
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

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO PREMIUM (SEM POPUPS DO NAVEGADOR) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[750] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
          <div className="glass w-full max-w-sm p-6 rounded-[32px] border border-white/10 shadow-2xl relative text-center text-white animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🗑️
            </div>
            
            <h3 className="text-lg font-black italic uppercase tracking-tighter text-white mb-2">Excluir Frente?</h3>
            <p className="text-white/70 text-xs font-medium leading-relaxed mb-6 italic">
              Esta ação é permanente e removerá a frente "{projectToDelete?.name}" de forma definitiva. Todos os links e QR Codes públicos associados a esta obra deixarão de funcionar imediatamente.
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
    </main>
  )
}