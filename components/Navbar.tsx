"use client"
import { usePathname } from "next/navigation"
import { useState } from "react"
import Link from "next/link"

export default function Navbar() {
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)

  // Se o caminho começar com /dashboard, não renderiza a Navbar (o dashboard usa o cabeçalho interno)
  if (pathname.startsWith('/dashboard')) return null

  return (
    <header className="fixed top-0 w-full z-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl px-6 py-4 relative">
        
        {/* LOGO E TIPOGRAFIA PADRONIZADOS */}
        <Link href="/" className="flex items-center gap-4 group z-[60]">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-20 h-20 md:w-24 md:h-24 object-contain shrink-0" 
          />
          <span className="text-2xl font-black italic tracking-tighter uppercase text-white">
            TRUCK<span className="text-orange-500">FLOW</span>
            <span className="text-orange-500 font-extrabold">.</span>
          </span>
        </Link>

        {/* LINKS CENTRAIS (Desktop - Windows) */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[2px] text-white/50">
          <Link href="/" className="hover:text-white transition-colors">Início</Link>
          <Link href="/sobre" className="hover:text-white transition-colors">Sobre</Link>
          <button className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            Suporte 24h
          </button>
        </nav>

        {/* BOTÕES DE AÇÃO (Desktop - Windows) */}
        <div className="hidden md:flex items-center gap-4">
          <Link href="/login" className="text-[11px] font-black uppercase tracking-[2px] text-white/70 hover:text-white transition-all">
            Entrar
          </Link>
          <Link href="/register" className="bg-orange-500 text-black px-6 py-2.5 rounded-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all">
            Obter Licença
          </Link>
        </div>

        {/* BOTÃO HAMBÚRGUER (Mobile - Idêntico ao Painel Interno) */}
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden z-[60] w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-all active:scale-90"
        >
          {isOpen ? (
            <span className="text-white text-lg font-black">✕</span>
          ) : (
            <>
              <div className="w-6 h-0.5 bg-white rounded-full" />
              <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
              <div className="w-4 h-0.5 bg-white rounded-full self-end mr-4" />
            </>
          )}
        </button>

        {/* MENU MOBILE (DROPDOWN GLASS) */}
        {isOpen && (
          <div className="absolute top-[110%] left-0 w-full bg-[#020617] rounded-[24px] p-8 flex flex-col items-center gap-8 md:hidden animate-in fade-in slide-in-from-top-5 duration-300 z-50 border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.8)]">
            <nav className="flex flex-col items-center gap-6 text-[13px] font-black uppercase tracking-[3px] text-white/40 w-full text-left">
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
              <Link href="/register" onClick={() => setIsOpen(false)} className="w-full bg-orange-500 text-black py-5 rounded-2xl font-black text-[13px] uppercase tracking-[2px] text-center active:scale-95 transition-all">
                Obter Licença Gold
              </Link>
            </div>
          </div>
        )}

      </div>
    </header>
  )
}