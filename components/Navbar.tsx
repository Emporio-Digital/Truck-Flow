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
    <header className="fixed top-0 w-full z-50 bg-[#020617]/90 backdrop-blur-md border-b border-white/5 transition-all">
      {/* Container Principal com alinhamento idêntico ao painel interno */}
      <div className="max-w-7xl mx-auto flex items-center justify-between py-4 md:py-6 px-4 md:px-10">
        
        {/* BRANDING (Logo e Nome idênticos ao do painel) */}
        <Link href="/" className="flex items-center gap-4 group">
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

        {/* NAVEGAÇÃO DESKTOP */}
        <nav className="hidden md:flex items-center gap-8 text-[11px] font-black uppercase tracking-[2px] text-white/50">
          <Link 
            href="/" 
            className={`transition-colors ${pathname === '/' ? 'text-orange-500' : 'hover:text-white'}`}
          >
            Início
          </Link>
          <a 
  href="https://egemporiodigital.com.br/" 
  target="_blank" 
  rel="noopener noreferrer" 
  className="transition-colors hover:text-white"
>
  Sobre Nós
</a>
          <a 
  href="https://wa.me/5511916053292?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20para%20o%20Truck%20Flow." 
  target="_blank" 
  rel="noopener noreferrer" 
  className="flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors"
>
  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
  Suporte 24h
</a>
        </nav>

        {/* BOTÕES DE AÇÃO DESKTOP */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/login" className="text-[11px] font-black uppercase tracking-[2px] text-white/70 hover:text-white transition-all">
            Entrar
          </Link>
          <Link href="/register" className="bg-orange-500 text-black px-6 py-3 rounded-xl font-black text-[11px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all">
            Obter Licença
          </Link>
        </div>

        {/* BOTÃO HAMBÚRGUER MOBILE (Mesmo visual e comportamento de clique do painel) */}
        <button 
          onClick={() => setIsOpen(true)}
          className="md:hidden w-14 h-14 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-1.5 hover:bg-white/10 transition-all active:scale-90"
        >
          <div className="w-6 h-0.5 bg-white rounded-full" />
          <div className="w-6 h-0.5 bg-orange-500 rounded-full" />
          <div className="w-4 h-0.5 bg-white rounded-full self-end mr-4" />
        </button>

      </div>

      {/* DRAWER LATERAL MOBILE (Réplica exata em design e animação do painel interno) */}
      <div 
        className={`fixed inset-0 z-[200] flex justify-end transition-opacity duration-500 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Fundo escuro com desfoque de alta qualidade */}
        <div 
          className="absolute inset-0 bg-[#020617]/60 backdrop-blur-md" 
          onClick={() => setIsOpen(false)} 
        />
        
        {/* Painel que desliza da direita */}
        <div 
          className={`relative w-[85%] max-w-sm bg-[#020617] h-full border-l border-white/10 p-8 shadow-2xl transition-transform duration-500 ease-out ${
            isOpen ? 'translate-x-0' : 'translate-x-full'
          }`}
        >
          {/* Cabeçalho do Drawer */}
          <div className="flex justify-between items-center mb-10">
            <h3 className="font-black italic uppercase tracking-tighter text-xl text-white">Menu</h3>
            <button 
              onClick={() => setIsOpen(false)} 
              className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center text-white/40 border border-white/10 hover:text-white transition-all"
            >
              ✕
            </button>
          </div>

          <div className="space-y-8">
            <nav className="space-y-1">
              <p className="text-[9px] font-black uppercase text-white/40 tracking-[4px] ml-4 mb-4 font-bold">
                Navegação
              </p>
              
              {/* Link Início */}
              <Link 
                href="/" 
                onClick={() => setIsOpen(false)} 
                className={`w-full text-left p-5 rounded-3xl font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm ${
                  pathname === '/' 
                    ? 'bg-orange-500/10 text-orange-500' 
                    : 'hover:bg-white/5 text-white/80 hover:text-white'
                }`}
              >
                🏠 Início
              </Link>
              
              {/* Link Sobre */}
<a 
  href="https://egemporiodigital.com.br/" 
  target="_blank" 
  rel="noopener noreferrer" 
  onClick={() => setIsOpen(false)} 
  className="w-full text-left p-5 rounded-3xl font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm hover:bg-white/5 text-white/80 hover:text-white"
>
  📝 Sobre Nós
</a>

              {/* Link Suporte */}
<a 
  href="https://wa.me/5511916053292?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20para%20o%20Truck%20Flow." 
  target="_blank" 
  rel="noopener noreferrer" 
  onClick={() => setIsOpen(false)}
  className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-green-500 hover:text-green-400 font-black italic uppercase tracking-tighter transition-all flex items-center gap-4 text-sm"
>
  🟢 Suporte 24h
</a>
              
              <div className="h-[1px] w-full bg-white/5 my-6" />
              
              {/* Link Login */}
              <Link 
                href="/login" 
                onClick={() => setIsOpen(false)} 
                className="w-full text-left p-5 rounded-3xl hover:bg-white/5 text-white/80 hover:text-white font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm"
              >
                🔑 Entrar no Painel
              </Link>
              
              {/* Link Registro (Destacado em Laranja) */}
              <Link 
                href="/register" 
                onClick={() => setIsOpen(false)} 
                className="w-full text-left p-5 rounded-3xl bg-orange-500 text-black hover:bg-orange-600 font-black italic uppercase tracking-tight transition-all flex items-center gap-4 text-sm"
              >
                🔥 Obter Licença
              </Link>
            </nav>
          </div>
        </div>
      </div>
    </header>
  )
}