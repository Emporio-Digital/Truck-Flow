"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

export default function CreateProjectModal({ companyId, onClose, onSuccess }: any) {
  const [name, setName] = useState("")
  const [address, setAddress] = useState("")
  const [paymentModel, setPaymentModel] = useState("viagem")
  const [loading, setLoading] = useState(false)

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name) return alert("O nome da obra é obrigatório")
    
    setLoading(true)
    const { error } = await supabase.from('projects').insert([
      { 
        name: name.toUpperCase(), 
        address: address.toUpperCase(), 
        payment_model: paymentModel,
        company_id: companyId, 
        status: 'ativo' 
      }
    ])

    if (error) {
      alert("Erro ao salvar!")
    } else {
      onSuccess()
      onClose()
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md">
      {/* Container com max-h para garantir que caiba em qualquer celular */}
      <div className="bg-[#0f172a] border border-white/10 w-full max-w-lg p-6 md:p-10 rounded-[40px] shadow-2xl relative max-h-[95vh] overflow-y-auto">
        
        {/* Header - Mais compacto no mobile */}
        <div className="flex justify-between items-start mb-6 md:mb-10">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter text-white leading-none">
              Nova <span className="text-orange-500">Frente</span>
            </h2>
            <p className="text-white/30 text-[7px] md:text-[8px] font-black uppercase tracking-[3px] mt-2 italic">Cadastro de Obra</p>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleCreate} className="space-y-4 md:space-y-6">
          {/* Nome da Obra */}
          <div>
            <label className="text-[9px] md:text-[10px] font-black uppercase text-orange-500 tracking-[3px] mb-2 block italic ml-2">Nome da Obra</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="EX: RODOANEL"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white font-bold focus:border-orange-500 outline-none transition-all placeholder:text-white/5 uppercase text-sm"
            />
          </div>

          {/* Endereço */}
          <div>
            <label className="text-[9px] md:text-[10px] font-black uppercase text-orange-500 tracking-[3px] mb-2 block italic ml-2">Localização</label>
            <input 
              type="text" 
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="ENDEREÇO"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 text-white font-bold focus:border-orange-500 outline-none transition-all placeholder:text-white/5 uppercase text-sm"
            />
          </div>

          {/* Seletor de Pagamento */}
          <div>
            <label className="text-[9px] md:text-[10px] font-black uppercase text-orange-500 tracking-[3px] mb-2 block italic ml-2">Acerto</label>
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <button
                type="button"
                onClick={() => setPaymentModel('viagem')}
                className={`py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border ${paymentModel === 'viagem' ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-white/40 border-white/5'}`}
              >
                Viagem
              </button>
              <button
                type="button"
                onClick={() => setPaymentModel('diaria')}
                className={`py-3 md:py-4 rounded-xl md:rounded-2xl font-black text-[9px] md:text-[10px] uppercase tracking-widest transition-all border ${paymentModel === 'diaria' ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-white/40 border-white/5'}`}
              >
                Diária
              </button>
            </div>
          </div>

          {/* Botão de Confirmação - ULTRA ROBUSTO */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-orange-500 text-black font-black uppercase tracking-[2px] h-16 md:h-20 rounded-[24px] hover:scale-[1.01] active:scale-95 transition-all shadow-[0_10px_40px_rgba(249,115,22,0.4)] disabled:opacity-50 mt-2 text-xs md:text-sm"
          >
            {loading ? 'PROCESSANDO...' : 'CONFIRMAR CADASTRO'}
          </button>
        </form>
      </div>
    </div>
  )
}