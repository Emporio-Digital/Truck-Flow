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
  const [formData, setFormData] = useState({
    origin: "",
    destination: "",
    material: ""
  })

  // Função para processar a imagem e colocar o carimbo
  const processImage = async (file: File): Promise<Blob> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Mantém a proporção da imagem
          canvas.width = img.width;
          canvas.height = img.height;
          
          if (ctx) {
            // Desenha a foto original
            ctx.drawImage(img, 0, 0);
            
            // Estilo do Carimbo
            const timestamp = new Date().toLocaleString('pt-BR');
            const padding = canvas.width * 0.05;
            const fontSize = canvas.width * 0.04; // Fonte dinâmica proporcional
            
            ctx.font = `black ${fontSize}px Inter, sans-serif`;
            
            // Fundo preto semi-transparente para o texto
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, canvas.height - (fontSize * 2.5), canvas.width, fontSize * 2.5);
            
            // Texto do Carimbo (Data e Hora)
            ctx.fillStyle = '#F97316'; // Highway Orange
            ctx.fillText(`TRUCKFLOW PROOF: ${timestamp}`, padding, canvas.height - fontSize);
          }
          
          canvas.toBlob((blob) => {
            resolve(blob as Blob);
          }, 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleSave = async () => {
    if (!formData.origin || !formData.destination) return alert("Preencha Origem e Destino")
    setLoading(true)

    try {
      let photo_url = null;

      // Se tiver imagem, processa e faz upload
      if (selectedImage) {
        const stampedBlob = await processImage(selectedImage);
        const fileName = `${Date.now()}-${userId}.jpg`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('trip-proofs') // Certifique-se de que este bucket existe no Supabase
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
        origin: formData.origin,
        destination: formData.destination,
        material: formData.material,
        photo_url: photo_url, // URL da foto com carimbo
        status: 'finalizada'
      }])

      if (error) throw error
      onSuccess()
    } catch (error: any) {
      alert(`Erro ao salvar: ${error.message}`)
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
    </div>
  )
}