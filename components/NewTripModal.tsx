"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface Props {
  userId: string
  companyId: string
  onClose: () => void
  onSuccess: () => void
}

export default function NewTripModal({ userId, companyId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  // Estado para os alertas customizados unificados
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    material: ""
  })

  // Lógica Matemática do Carimbo Digital (Watermark) de Alta Resolução no Padrão Premium
  const processImage = async (file: File, origin: string, destination: string): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Mantém a proporção e resolução real da foto capturada
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            // Desenha a imagem original no canvas
            ctx.drawImage(img, 0, 0);
            
            // Formatação oficial de data e hora de Brasília
            const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            
            // Tamanho da fonte proporcional à largura da imagem (2.5% da largura)
            const fontSize = Math.max(20, canvas.width * 0.025);
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            
            // Desenha a barra escura de fundo na base da foto para contraste absoluto
            const barHeight = fontSize * 3;
            ctx.fillStyle = 'rgba(2, 6, 23, 0.85)'; // Fundo escuro profundo
            ctx.fillRect(0, canvas.height - barHeight, canvas.width, barHeight);
            
            // Injeta o Carimbo Digital Incontestável (Apenas Data e Hora para manter o padrão)
            ctx.fillStyle = '#F97316'; // Timestamp em Highway Orange
            ctx.fillText(`REGISTRO VERIFICADO: ${timestamp}`, canvas.width * 0.04, canvas.height - (barHeight * 0.38));
          }
          
          // Converte para JPEG com compressão de 80% para economizar internet móvel
          canvas.toBlob((blob) => {
            resolve(blob as Blob);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleSave = async () => {
    if (!formData.origin.trim() || !formData.destination.trim()) {
      return setAlertMessage("Por favor, informe a Origem e o Destino para registrar a viagem.");
    }
    setLoading(true)

    try {
      let photo_url = null;

      // Se tiver imagem, processa e faz o upload com o novo carimbo
      if (selectedImage) {
        const stampedBlob = await processImage(selectedImage, formData.origin, formData.destination);
        const fileName = `${Date.now()}-${userId}.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('trip-proofs')
          .upload(fileName, stampedBlob);

        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('trip-proofs')
          .getPublicUrl(fileName);
          
        photo_url = publicUrl;
      }

      const { error } = await supabase.from('trips').insert([{
        company_id: companyId,
        driver_id: userId,
        origin: formData.origin.trim(),
        destination: formData.destination.trim(),
        material: formData.material.trim(), // Voltando para o nome reconhecido pelo banco
        photo_url: photo_url, 
        status: 'finalizada'
      }])

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      setAlertMessage(`Houve um erro ao salvar o registro: ${error.message}`);
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center md:p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      {/* No mobile: h-full e rounded-none | No PC: h-auto e rounded-40px */}
      <div className="glass w-full max-w-lg min-h-screen md:min-h-0 md:h-auto p-6 md:p-8 rounded-none md:rounded-[40px] border-none md:border md:border-white/10 shadow-2xl relative text-white flex flex-col justify-center">
        
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Nova Viagem</h2>
            <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2">Lançamento de Registro</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors text-xl border border-white/10">✕</button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Origem */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Origem</label>
            <input 
              value={formData.origin}
              onChange={(e) => setFormData({...formData, origin: e.target.value})}
              placeholder="Ex: Local"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Destino */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Destino</label>
            <input 
              value={formData.destination}
              onChange={(e) => setFormData({...formData, destination: e.target.value})}
              placeholder="Ex: Local"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Material */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Material</label>
            <input 
              value={formData.material}
              onChange={(e) => setFormData({...formData, material: e.target.value})}
              placeholder="Ex: Areia"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Captura de Foto */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest text-center md:text-left">Comprovação Visual (Opcional)</label>
            
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-[24px] cursor-pointer hover:border-orange-500/50 hover:bg-orange-500/5 transition-all">
                <div className="flex flex-col items-center justify-center">
                  <p className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-3">
                    <span className="text-xl">📸</span> Tirar Foto do Local
                  </p>
                </div>
                <input 
                  type="file" 
                  accept="image/*" 
                  capture="environment" 
                  className="hidden" 
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedImage(file);
                      setPreviewUrl(URL.createObjectURL(file));
                    }
                  }}
                />
              </label>
            ) : (
              <div className="relative w-full h-48 rounded-3xl overflow-hidden border border-orange-500/50">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                <button 
                  onClick={() => { setSelectedImage(null); setPreviewUrl(null); }}
                  className="absolute top-2 right-2 bg-black/60 p-2 rounded-xl text-[10px] font-black uppercase"
                >
                  Remover ✕
                </button>
              </div>
            )}
          </div>

          <div className="pt-4 flex gap-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              {loading ? "SALVANDO..." : "CONFIRMAR VIAGEM"}
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
    </div>
  )
}