"use client"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function Navbar() {
    const pathname = usePathname()
  // Se o caminho começar com /dashboard, não renderiza nada
  if (pathname.startsWith('/dashboard')) return null
  const [isOpen, setIsOpen] = useState(false)

  return (
    <header className="fixed top-0 w-full z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between glass px-6 md:px-8 py-3 md:py-4 rounded-2xl border border-white/10 relative">
        
        {/* LOGO (Sempre visível) */}
        <Link href="/" className="flex items-center gap-2 group z-[60]">
          <div className="w-7 h-7 md:w-8 md:h-8 bg-white/5 rounded-lg flex items-center justify-center border border-white/20 group-hover:border-orange-500/50 transition-all">
            <div className="w-3.5 h-3.5 md:w-4 md:h-4 border-2 border-orange-500 rotate-45" />
          </div>
          <span className="font-black tracking-tighter text-lg md:text-xl">TRUCK<span className="text-orange-500 font-medium">FLOW.</span></span>
        </Link>

        {/* LINKS CENTRAIS (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[2px] text-white/50">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link>
          <button className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Suporte 24h
          </button>
        </nav>

        {/* BOTÕES DE AÇÃO (Desktop) */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-[11px] font-black uppercase tracking-[2px] text-white/70 hover:text-white transition-all">
            Entrar
          </Link>
          <Link href="/register" className="bg-orange-500 text-black px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest glow-orange hover:scale-105 transition-all">
            Obter Licença
          </Link>
        </div>

        {/* BOTÃO HAMBÚRGUER (Mobile) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden z-[60] p-2 text-white/70 hover:text-white"
        >
          {isOpen ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          )}
        </button>

        {/* MENU MOBILE (DROPDOWN GLASS) */}
        {isOpen && (
          <div className="absolute top-[110%] left-0 w-full bg-[#0a0f1e] rounded-[24px] p-8 flex flex-col items-center gap-8 md:hidden animate-in fade-in slide-in-from-top-5 duration-300 z-50 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
            <nav className="flex flex-col items-center gap-6 text-[13px] font-black uppercase tracking-[3px] text-white/40 w-full">
              <Link href="/" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors w-full text-center py-2">Início</Link>
              <Link href="/sobre" onClick={() => setIsOpen(false)} className="hover:text-orange-500 transition-colors w-full text-center py-2">Sobre</Link>
              <button className="flex items-center justify-center gap-3 text-green-500 w-full py-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                Suporte 24h
              </button>
            </nav>
            
            <div className="flex flex-col items-center gap-5 w-full pt-6 border-t border-white/5">
              <Link href="/login" onClick={() => setIsOpen(false)} className="text-[13px] font-black uppercase tracking-[3px] text-white hover:text-orange-500 transition-all">
                Entrar no Painel
              </Link>
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full bg-orange-500 text-black py-5 rounded-2xl font-black text-[13px] uppercase tracking-[2px] glow-orange text-center active:scale-95 transition-all">
                Obter Licença Gold
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  )
}