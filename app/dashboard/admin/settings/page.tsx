"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Estados para os inputs
  const [profile, setProfile] = useState({ id: "", full_name: "", whatsapp: "" })
  const [company, setCompany] = useState({ id: "", name: "", default_pay_type: "diaria" })

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return router.push("/login")

      const { data: prof } = await supabase.from('profiles').select('*, companies(*)').eq('id', user.id).single()
      
      if (prof) {
        setProfile({ id: prof.id, full_name: prof.full_name || "", whatsapp: prof.whatsapp || "" })
        if (prof.companies) {
          setCompany({ 
            id: prof.companies.id, 
            name: prof.companies.name || "", 
            default_pay_type: prof.companies.default_pay_type || "diaria" 
          })
        }
      }
      setLoading(false)
    }
    fetchSettings()
  }, [router])

  const handleSave = async () => {
    setSaving(true)
    try {
      // 1. Atualiza Perfil
      await supabase.from('profiles').update({
        full_name: profile.full_name,
        whatsapp: profile.whatsapp
      }).eq('id', profile.id)

      // 2. Atualiza Empresa
      await supabase.from('companies').update({
        name: company.name,
        default_pay_type: company.default_pay_type
      }).eq('id', company.id)

      alert("Configurações salvas com sucesso!")
      router.back()
    } catch (error) {
      alert("Erro ao salvar.")
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest uppercase">Carregando...</div>

  return (
    <main className="min-h-screen bg-[#020617] text-white p-6 md:p-12">
      <div className="max-w-2xl mx-auto">
        
        {/* Header com Botão Voltar */}
        <div className="flex items-center justify-between mb-12">
          <button 
            onClick={() => router.back()}
            className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40 hover:text-white transition-all"
          >
            ←
          </button>
          <div className="text-right">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter">Ajustes</h1>
            <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px]">Painel de Controle</p>
          </div>
        </div>

        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* SEÇÃO: MEUS DADOS */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 ml-2">
              <span className="text-xl">👤</span>
              <h2 className="text-sm font-black uppercase tracking-[4px] text-white/40">Meus Dados</h2>
            </div>
            
            <div className="glass p-8 rounded-[40px] border border-white/5 space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Nome Completo</label>
                <input 
                  value={profile.full_name}
                  onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">WhatsApp</label>
                <input 
                  value={profile.whatsapp}
                  onChange={(e) => setProfile({...profile, whatsapp: e.target.value})}
                  placeholder="(00) 00000-0000"
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>
            </div>
          </section>

          {/* SEÇÃO: EMPRESA & REGRAS */}
          <section className="space-y-6">
            <div className="flex items-center gap-4 ml-2">
              <span className="text-xl">🏢</span>
              <h2 className="text-sm font-black uppercase tracking-[4px] text-white/40">Minha Frota</h2>
            </div>

            <div className="glass p-8 rounded-[40px] border border-white/5 space-y-8">
              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Nome da Empresa</label>
                <input 
                  value={company.name}
                  onChange={(e) => setCompany({...company, name: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all"
                />
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-4 block tracking-widest">Modelo de Pagamento Padrão</label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setCompany({...company, default_pay_type: 'diaria'})}
                    className={`py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all border ${company.default_pay_type === 'diaria' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-white/40 border-white/10'}`}
                  >
                    ☀️ Diária
                  </button>
                  <button 
                    onClick={() => setCompany({...company, default_pay_type: 'viagem'})}
                    className={`py-5 rounded-[24px] font-black text-[10px] uppercase tracking-widest transition-all border ${company.default_pay_type === 'viagem' ? 'bg-orange-500 text-black border-orange-500 shadow-[0_0_20px_rgba(249,115,22,0.3)]' : 'bg-white/5 text-white/40 border-white/10'}`}
                  >
                    🛣️ Viagem
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* BOTÃO SALVAR IMPACTANTE */}
          <div className="pt-10 pb-20">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase tracking-[4px] py-6 rounded-[32px] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-[0_20px_40px_rgba(249,115,22,0.3)] flex items-center justify-center gap-3 group"
            >
              {saving ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                  PROCESSANDO...
                </span>
              ) : (
                <>
                  SALVAR ALTERAÇÕES
                  <span className="group-hover:translate-x-1 transition-transform text-xl">→</span>
                </>
              )}
            </button>
            <p className="text-center text-[9px] font-black uppercase text-white/20 tracking-[3px] mt-6 italic">TruckFlow v1.1 Evolution</p>
          </div>

        </div>
      </div>
    </main>
  )
}