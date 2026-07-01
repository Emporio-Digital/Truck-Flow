"use client"
import { useState } from "react"
import { supabase } from "@/lib/supabase"

interface Props {
  userId: string
  companyId: string
  onClose: () => void
  onSuccess: () => void
}

export default function NewExpenseModal({ userId, companyId, onClose, onSuccess }: Props) {
  const [loading, setLoading] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [alertMessage, setAlertMessage] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    type: "Combustível",
    value: "",
    description: ""
  })

  // Categorias baseadas no dossiê
  const categories = ["Combustível", "Borracharia", "Outros"]

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
          canvas.width = img.width;
          canvas.height = img.height;
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const timestamp = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
            const fontSize = canvas.width * 0.04;
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            ctx.fillRect(0, canvas.height - (fontSize * 2.5), canvas.width, fontSize * 2.5);
            ctx.fillStyle = '#F97316';
            ctx.fillText(`GASTO COMPROVADO: ${timestamp}`, canvas.width * 0.05, canvas.height - fontSize);
          }
          canvas.toBlob((blob) => resolve(blob as Blob), 'image/jpeg', 0.8);
        };
      };
    });
  };

  const handleSave = async () => {
    if (!formData.value) return setAlertMessage("Insira o valor do gasto");
    if (!selectedImage) return setAlertMessage("A foto do comprovante é obrigatória");
    
    setLoading(true);

    try {
      // 1. Upload da Foto (Obrigatória para Gastos)
      const stampedBlob = await processImage(selectedImage);
      const fileName = `expense-${Date.now()}-${userId}.jpg`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('trip-proofs')
        .upload(fileName, stampedBlob);

      if (uploadError) throw uploadError;
      
      const { data: { publicUrl } } = supabase.storage
        .from('trip-proofs')
        .getPublicUrl(fileName);

      // 2. Salvar no Banco
      const { error } = await supabase.from('expenses').insert([{
        company_id: companyId,
        driver_id: userId,
        type: formData.type,
        value: parseFloat(formData.value.replace(',', '.')),
        description: formData.description,
        photo_url: publicUrl,
        created_at: new Date().toISOString()
      }]);

      if (error) throw error;
      onSuccess();
    } catch (error: any) {
      setAlertMessage(`Erro ao salvar gasto: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center md:p-4 bg-black/95 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="glass w-full max-w-lg min-h-screen md:min-h-0 md:h-auto p-6 md:p-8 rounded-none md:rounded-[40px] border-none md:border md:border-white/10 shadow-2xl relative text-white flex flex-col justify-center">
        
        <div className="flex justify-between items-start mb-6 md:mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">Novo Gasto</h2>
            <p className="text-orange-500 text-[8px] font-black uppercase tracking-[3px] mt-2">Financeiro & Recibos</p>
          </div>
          <button onClick={onClose} className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 hover:text-white transition-colors text-xl border border-white/10">✕</button>
        </div>

        <div className="space-y-4 md:space-y-6">
          {/* Categoria */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Categoria</label>
            <div className="grid grid-cols-3 gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFormData({...formData, type: cat})}
                  className={`py-3 rounded-[18px] text-[9px] font-black uppercase transition-all border ${formData.type === cat ? 'bg-orange-500 text-black border-orange-500' : 'bg-white/5 text-white/70 border-white/10'}`}
                >
                  {cat === 'Combustível' ? '⛽' : 
                   cat === 'Borracharia' ? '🛞' : '📦'} {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Valor */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Valor (R$)</label>
            <input 
              type="number"
              inputMode="decimal"
              value={formData.value}
              onChange={(e) => setFormData({...formData, value: e.target.value})}
              placeholder="0,00"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white text-2xl font-black focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/10"
            />
          </div>

          {/* Descrição */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Observação (Opcional)</label>
            <input 
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              placeholder="Ex: Pedágio..."
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-white focus:outline-none focus:border-orange-500/50 transition-all placeholder:text-white/40"
            />
          </div>

          {/* Foto Obrigatória */}
          <div>
            <label className="text-[10px] font-black uppercase text-orange-500 ml-2 mb-2 block tracking-widest">Foto do Comprovante (Obrigatório)</label>
            {!previewUrl ? (
              <label className="flex flex-col items-center justify-center w-full h-24 bg-white/5 border-2 border-dashed border-white/10 rounded-[24px] cursor-pointer hover:border-orange-500/50 transition-all">
                <p className="text-[10px] font-black uppercase text-white/60 tracking-widest flex items-center gap-3">
                  <span className="text-xl">📸</span> Bater Foto
                </p>
                <input type="file" accept="image/*" capture="environment" className="hidden" 
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
              <div className="relative w-full h-40 rounded-[24px] overflow-hidden border border-orange-500/50">
                <img src={previewUrl} className="w-full h-full object-cover" alt="Comprovante" />
                <button onClick={() => { setSelectedImage(null); setPreviewUrl(null); }} className="absolute top-2 right-2 bg-black/60 p-2 rounded-xl text-[10px] font-black uppercase">Alterar ✕</button>
              </div>
            )}
          </div>

          <div className="pt-4">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-black font-black uppercase tracking-[2px] py-5 rounded-2xl transition-all shadow-[0_0_20px_rgba(249,115,22,0.3)]"
            >
              {loading ? "PROCESSANDO..." : "LANÇAR DESPESA"}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE ALERTA PREMIUM CUSTOMIZADO */}
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