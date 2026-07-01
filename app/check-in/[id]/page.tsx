"use client"
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { useParams } from "next/navigation"

export default function PublicCheckInPage() {
  const { id } = useParams()
  const [project, setProject] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)

  // Estados do Formulário
  const [driverName, setDriverName] = useState("")
  const [vehiclePlate, setVehiclePlate] = useState("")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Estado para controlar a mensagem do alerta customizado
  const [alertMessage, setAlertMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      // Valida se a obra existe e busca os dados de identificação
      const { data, error } = await supabase
        .from('projects')
        .select('*, companies(*)')
        .eq('id', id)
        .single()

      if (data && !error) {
        setProject(data)
      }
      setLoading(false)
    }
    fetchProjectData()
  }, [id])

  // Lógica matemática do Carimbo Digital (Watermark) e Compressão
  const processImage = async (file: File, projectName: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (event) => {
        const img = new Image()
        img.src = event.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          const ctx = canvas.getContext('2d')

          // Mantém a proporção e resolução da foto capturada
          canvas.width = img.width
          canvas.height = img.height

          if (ctx) {
            // Desenha a imagem original no canvas
            ctx.drawImage(img, 0, 0)

            // Formatação oficial de data e hora de Brasília
            const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })

            // Calcula o tamanho da fonte proporcional à resolução da imagem (2.5% da largura)
            const fontSize = Math.max(20, canvas.width * 0.025)
            ctx.font = `bold ${fontSize}px Inter, sans-serif`

            // Desenha a barra escura de fundo na base da foto para contraste da letra
            const barHeight = fontSize * 3
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)' // Fundo escuro profundo
            ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight)

            // Injeta o Carimbo Digital Incontestável
            ctx.fillStyle = '#FFFFFF' // Texto principal em branco
            ctx.fillText(`OBRA: ${projectName.toUpperCase()}`, canvas.width * 0.04, canvas.height - (barHeight * 0.55))
            
            ctx.fillStyle = '#F97316' // Timestamp emHighway Orange
            ctx.fillText(`REGISTRO AUDITADO: ${timestamp}`, canvas.width * 0.04, canvas.height - (barHeight * 0.22))
          }

          // Converte para JPEG com compressão de 80% para economizar internet do motorista
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.8)
        }
      }
    })
  }

  const handleSubmit = async () => {
    if (!driverName.trim()) return setAlertMessage("Por favor, digite seu nome para continuar.")
    if (!vehiclePlate.trim()) return setAlertMessage("Por favor, digite a placa do caminhão.")
    if (!selectedImage) return setAlertMessage("A foto de comprovação é obrigatória.")

    setSaving(true)

    try {
      // 1. Processa e Carimba a Foto em tempo real
      const stampedBlob = await processImage(selectedImage, project.name)
      const fileName = `external-${Date.now()}-${id}.jpg`

      // 2. Faz o Upload no Bucket público de provas
      const { error: uploadError } = await supabase.storage
        .from('trip-proofs')
        .upload(fileName, stampedBlob)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('trip-proofs')
        .getPublicUrl(fileName)

      // 3. Insere o registro na tabela de entradas de terceiros (external_entries) com a coluna correta
      const { error: insertError } = await supabase.from('external_entries').insert([{
        project_id: id,
        driver_name: driverName.trim(),
        vehicle_plate: vehiclePlate.trim().toUpperCase(),
        photo_url: publicUrl,
        created_at: new Date().toISOString()
      }])

      if (insertError) throw insertError

      setSuccess(true)
    } catch (error: any) {
      setAlertMessage(`Houve um erro no registro: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-widest text-2xl uppercase">Carregando Obra...</div>
  }

  // Tratamento de link quebrado ou obra inativa
  if (!project) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white text-center">
        <div className="glass max-w-md p-10 rounded-[40px] border border-white/10 shadow-2xl">
          <span className="text-5xl block mb-6">⚠️</span>
          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-orange-500 mb-4">Link Inválido</h2>
          <p className="text-white/40 font-medium text-sm italic">Esta frente de trabalho não existe ou foi pausada pelo administrador da frota.</p>
        </div>
      </div>
    )
  }

  // TELA DE SUCESSO DO MOTORISTA (BORDAS E ESCAPE CORRIGIDOS)
  if (success) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 text-white text-center">
        <div className="glass max-w-md w-full p-8 pb-10 rounded-[40px] border border-white/10 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-orange-500/10 border border-orange-500/20 rounded-full flex items-center justify-center text-4xl mx-auto mb-8 animate-bounce">
            👍
          </div>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4 text-white">Check-in Realizado!</h2>
          <p className="text-orange-500 text-[10px] font-black uppercase tracking-[3px] italic mb-6">Enviado</p>
          <div className="bg-black/40 border border-white/5 p-4 rounded-2xl mb-8 text-left space-y-2">
            <p className="text-[10px] text-white/60 uppercase font-bold">Resumo do Envio:</p>
            <p className="text-sm font-black text-white uppercase"><span className="text-white/60 font-medium text-xs">Motorista:</span> {driverName}</p>
            <p className="text-sm font-black text-orange-500 uppercase italic"><span className="text-white/60 font-medium text-xs not-italic">Placa:</span> {vehiclePlate.toUpperCase()}</p>
            <p className="text-xs font-black text-white/80 uppercase"><span className="text-white/60 font-medium text-xs">Frente:</span> {project.name}</p>
          </div>
          <p className="text-white/80 text-[11px] font-bold italic">Obrigado! Seu registro já está disponível na central do contratante.</p>
        </div>
      </div>
    )
  }

  // FORMULÁRIO DE PREENCHIMENTO PÚBLICO COM ESPAÇADOR FÍSICO CONTRA SOBREPOSIÇÃO
  return (
    <main className="min-h-screen w-full bg-[#020617] text-white px-6 flex flex-col items-center justify-start overflow-y-auto">
      
      {/* Bloco invisível que ocupa o espaço exato do menu fixo */}
      <div className="h-24 w-full shrink-0" />

      {/* Cartão do Formulário (Sempre começa abaixo do bloco acima) */}
      <div className="w-full max-w-md glass p-6 md:p-8 rounded-[40px] border border-white/10 shadow-2xl relative text-left mb-12 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Cabeçalho do Portal */}
        <div className="mb-8">
          <p className="text-orange-500 font-black tracking-[4px] text-[10px] uppercase mb-2 italic">Portal de Terceiros</p>
          <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">{project.name}</h2>
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-widest mt-1 italic">{project.companies?.name || 'EG TruckFlow'}</p>
        </div>

        {/* Notificação do modelo de pagamento configurado pela obra */}
        <div className="bg-orange-500/10 border border-orange-500/20 p-4 rounded-2xl mb-6">
          <p className="text-[8px] font-black text-orange-500 uppercase tracking-[2px] mb-1 italic">Tipo de Registro Definido:</p>
          <p className="text-sm font-black text-white uppercase italic">{project.payment_model}</p>
        </div>

        <div className="space-y-5">
          {/* Campo Nome */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Seu Nome Completo</label>
            <input 
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              placeholder="Ex: João da Silva"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/20 uppercase"
            />
          </div>

          {/* Campo Placa */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Placa do Caminhão</label>
            <input 
              type="text"
              value={vehiclePlate}
              onChange={(e) => setVehiclePlate(e.target.value)}
              maxLength={7}
              placeholder="Ex: ABC1D23"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white font-bold focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/20 uppercase tracking-widest"
            />
          </div>

          {/* Campo Câmera Obrigatória */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Foto de Comprovação (Obrigatória)</label>
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-32 bg-white/5 border-2 border-dashed border-white/10 rounded-[28px] cursor-pointer hover:border-orange-500/50 transition-all">
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-3">
                  <span className="text-2xl">📸</span> Bater Foto do caminhão na obra
                </p>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0]
                    if (file) {
                      setSelectedImage(file)
                      setPreviewUrl(URL.createObjectURL(file))
                    }
                  }}
                />
              </label>
            ) : (
              <div className="relative w-full h-48 rounded-[28px] overflow-hidden border border-orange-500/50 shadow-xl">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview da Carga" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} 
                  className="absolute top-3 right-3 bg-black/80 px-4 py-2 rounded-xl text-[9px] font-black uppercase border border-white/10"
                >
                  Alterar Câmera ✕
                </button>
              </div>
            )}
          </div>

          {/* Botão Enviar */}
          <div className="pt-4">
            <button 
              onClick={handleSubmit}
              disabled={saving}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(249,115,22,0.3)] active:scale-95"
            >
              {saving ? "REGISTRANDO CHECK-IN..." : "REALIZAR CHECK-IN"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ALERTA PREMIUM CUSTOMIZADO (SUBSTITUTO DO ALERT NATIVO) */}
      {alertMessage && (
        <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
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
              className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black uppercase tracking-[2px] py-4 rounded-2xl text-xs transition-all active:scale-95 shadow-[0_10px_30px_rgba(249,115,22,0.3)]"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </main>
  )
}