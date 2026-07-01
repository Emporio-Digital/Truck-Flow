"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface Props {
  userId: string
  onSuccess: () => void
}

export default function CreateCompanyModal({ userId, onSuccess }: Props) {
  const [name, setName] = useState("")
  const [payType, setPayType] = useState<"diaria" | "viagem">("diaria")
  const [loading, setLoading] = useState(false)

  const generateToken = (companyName: string) => {
    const initials = companyName.substring(0, 3).toUpperCase()
    const random = Math.floor(1000 + Math.random() * 9000)
    return `FLOW-${initials}-${random}`
  }

  const handleCreate = async () => {
    if (!name) return alert("Digite o nome da empresa")
    setLoading(true)

    try {
      const token = generateToken(name)

      // 1. Criar a empresa com o modelo de pagamento padrão
      const { data: company, error: coError } = await supabase
        .from('companies')
        .insert([{ 
          name, 
          owner_id: userId, 
          company_token: token,
          default_pay_type: payType
        }])
        .select()
        .single()

      if (coError) throw coError

      // 2. Vincular o patrão a essa empresa
      const { error: upError } = await supabase
        .from('profiles')
        .update({ company_id: company.id })
        .eq('id', userId)

      if (upError) throw upError

      onSuccess()
    } catch (error: any) {
      console.error(error)
      // Isso aqui vai nos dizer EXATAMENTE o que o banco de dados rejeitou
      alert(`ERRO REAL: ${error.message || "Erro desconhecido"}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="glass w-full max-w-md p-8 rounded-[40px] border border-white/10 shadow-2xl relative overflow-hidden text-white">
        
        <h2 className="text-3xl font-black italic uppercase mb-2">Minha Frota</h2>
        <p className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-8">Configuração de Negócio</p>

        <div className="space-y-8">
          {/* Nome da Empresa */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Nome da Empresa</label>
            <input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: TransLog Brasil"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/10 focus:outline-none focus:border-orange-500/50 transition-all"
            />
          </div>

          {/* Modelo de Pagamento */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-3 block tracking-widest">Modelo de Pagamento Padrão</label>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setPayType("diaria")}
                className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${payType === 'diaria' ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-white/40 border-white/10'}`}
              >
                ☀️ Diária
              </button>
              <button 
                onClick={() => setPayType("viagem")}
                className={`py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all border ${payType === 'viagem' ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-white/40 border-white/10'}`}
              >
                🛣️ Viagem
              </button>
            </div>
            <p className="text-[9px] text-white/20 mt-3 ml-2 italic">* Você poderá alterar isso individualmente por motorista depois.</p>
          </div>

          <button 
            onClick={handleCreate}
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(249,115,22,0.3)]"
          >
            {loading ? "GERANDO TOKEN..." : "FINALIZAR E GERAR TOKEN"}
          </button>
        </div>
      </div>
    </div>
  )
}