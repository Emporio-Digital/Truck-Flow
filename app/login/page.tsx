"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import Link from "next/link"

export default function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage("")

    // 1. Tenta fazer o Login
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setMessage("❌ " + authError.message)
      setLoading(false)
      return
    }

    // 2. Se logou, busca o PERFIL no banco para saber o que ele é (Owner ou Driver)
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', authData.user.id)
      .single()

    if (profileError || !profile) {
      setMessage("❌ Erro ao buscar perfil.")
      setLoading(false)
      return
    }

    // 3. Redirecionamento Inteligente
    if (profile.role === 'owner') {
      router.push('/dashboard/admin')
    } else {
      router.push('/dashboard/driver')
    }
  }

  return (
    <main className="relative min-h-[100dvh] w-full flex flex-col items-center justify-center px-4 overflow-hidden bg-[#020617] font-sans pt-28 md:pt-36">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative z-10 w-full max-w-[450px]">
        <div className="text-center mb-8 text-white">
          <h2 className="text-6xl font-black italic tracking-tighter mb-2 uppercase italic leading-none">LOGIN</h2>
          <p className="text-blue-500 font-bold tracking-[3px] text-[10px] uppercase italic">Acesso TruckFlow Gold Edition</p>
        </div>

        <form onSubmit={handleLogin} className="glass rounded-[32px] p-8 space-y-6 shadow-2xl">
          <div className="space-y-4">
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="E-mail de acesso" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none focus:border-blue-500 transition-all placeholder:text-white/20 font-bold text-white" 
            />

            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Sua senha" 
              className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 outline-none focus:border-blue-500 transition-all placeholder:text-white/20 font-bold text-white" 
            />
          </div>

          <button 
            disabled={loading}
            className="w-full bg-orange-500 hover:bg-orange-600 text-black font-black py-5 rounded-2xl text-lg uppercase tracking-tighter transition-all glow-orange group flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? "CONECTANDO..." : "ENTRAR NO DASHBOARD"}
            {!loading && <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 transition-transform"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>}
          </button>

          {message && (
             <div className="p-4 rounded-xl text-[10px] font-black text-center tracking-widest uppercase bg-red-500/10 text-red-500">
               {message}
             </div>
          )}

          <Link href="/register" className="w-full py-2 text-white/40 text-[10px] font-bold uppercase tracking-[2px] flex items-center justify-center gap-2 hover:text-white transition-all text-center">
             NÃO TEM ACESSO? SOLICITAR LICENÇA
          </Link>
        </form>
      </div>
    </main>
  )
}