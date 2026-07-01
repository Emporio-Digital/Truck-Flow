"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import Link from "next/link"

export default function Register() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [fullName, setFullName] = useState("")
  const [whatsapp, setWhatsapp] = useState("")
  const [role, setRole] = useState<'owner' | 'driver'>('driver') // Estado para o perfil
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    if (password !== confirmPassword) {
      setMessage("❌ As senhas não coincidem!")
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          whatsapp: whatsapp,
          role: role, // Enviando a escolha para o banco
        },
      },
    })

    if (error) {
      setMessage("❌ " + error.message)
    } else {
      setMessage("✅ Sucesso!")
    }
    setLoading(false)
  }

  return (
    <main className="relative min-h-screen w-full flex flex-col items-center px-4 bg-[#020617] py-24 md:py-32 font-sans overflow-x-clip">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="relative z-10 w-full max-w-[500px]">
        <div className="text-center mb-8">
          <h2 className="text-5xl font-black italic tracking-tighter mb-2 uppercase">CADASTRO</h2>
          <p className="text-orange-500 font-bold tracking-[3px] text-[10px] uppercase italic">Selecione seu perfil TruckFlow</p>
        </div>

        {/* SELEÇÃO DE PERFIL */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => setRole('driver')}
            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${role === 'driver' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role === 'driver' ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'}`}>
               🚚
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Motorista</span>
          </button>

          <button 
            onClick={() => setRole('owner')}
            className={`p-6 rounded-[24px] border-2 transition-all flex flex-col items-center gap-3 ${role === 'owner' ? 'border-orange-500 bg-orange-500/10' : 'border-white/5 bg-white/5 opacity-40 hover:opacity-100'}`}
          >
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${role === 'owner' ? 'bg-orange-500 text-black' : 'bg-white/10 text-white'}`}>
               👑
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">Patrão</span>
          </button>
        </div>

        <form onSubmit={handleRegister} className="glass rounded-[32px] p-8 space-y-4 shadow-2xl">
          <div className="space-y-3">
            <input required type="text" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nome Completo" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 transition-all placeholder:text-white/20 font-bold" />
            
            <input required type="text" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} placeholder="WhatsApp" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 transition-all placeholder:text-white/20 font-bold" />

            <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="E-mail de acesso" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 transition-all placeholder:text-white/20 font-bold" />

            <div className="grid grid-cols-2 gap-3">
              <input required type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 transition-all placeholder:text-white/20 font-bold" />
              <input required type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirme" 
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 outline-none focus:border-orange-500 transition-all placeholder:text-white/20 font-bold" />
            </div>
          </div>

          <button disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-5 rounded-2xl text-lg uppercase tracking-tighter transition-all glow-orange flex items-center justify-center gap-3 disabled:opacity-50 mt-4">
            {loading ? "PROCESSANDO..." : `CADASTRAR COMO ${role === 'owner' ? 'PATRÃO' : 'MOTORISTA'}`}
          </button>

          {message && (
            <div className={`p-4 rounded-xl text-[10px] font-black text-center tracking-widest uppercase ${message.includes('❌') ? 'bg-red-500/10 text-red-500' : 'bg-green-500/10 text-green-500'}`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </main>
  )
}