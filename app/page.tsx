"use client"
import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen w-full bg-[#020617] text-white overflow-x-hidden font-sans relative">
      
      {/* 1. HERO SECTION (Identidade Premium com espaçamento inferior equilibrado) */}
      <section className="relative w-full pt-36 pb-10 md:pt-48 md:pb-14 px-4 md:px-10 max-w-7xl mx-auto flex flex-col items-center text-center">
        {/* Spotlights de Fundo (Glow Circular Traseiro) */}
        <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[50%] h-[50%] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-[25%] left-1/2 -translate-x-1/2 w-[40%] h-[40%] bg-blue-600/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-3xl">
          {/* Título Principal com Brilho Neon Multi-Camada Equalizado */}
          <h1 
            style={{ 
              textShadow: "0 0 15px rgba(249, 115, 22, 0.7), 0 0 30px rgba(249, 115, 22, 0.5), 0 0 60px rgba(249, 115, 22, 0.3)" 
            }}
            className="text-5xl sm:text-6xl md:text-8xl font-black italic tracking-tighter uppercase leading-none text-white mb-2"
          >
            TRUCKFLOW
          </h1>
          
          {/* Subtítulo da Distribuidora Exclusiva */}
          <h2 className="text-xl sm:text-2xl md:text-3xl font-black uppercase tracking-[3px] text-white mb-10">
            EG EMPÓRIO DIGITAL
          </h2>

          {/* Lista de Badges de Recursos Aumentados e Distribuídos */}
          <div className="flex flex-wrap items-center justify-center gap-3 md:gap-4 mb-10 max-w-2xl mx-auto px-2">
            <span className="border border-orange-500/20 bg-orange-500/5 px-5 py-3 rounded-xl text-orange-500 text-[10px] md:text-[11px] font-black tracking-widest uppercase shrink-0">
              FOTO CARIMBADA
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="border border-orange-500/20 bg-orange-500/5 px-5 py-3 rounded-xl text-orange-500 text-[10px] md:text-[11px] font-black tracking-widest uppercase shrink-0">
              PORTAL DE TERCEIROS
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="border border-orange-500/20 bg-orange-500/5 px-5 py-3 rounded-xl text-orange-500 text-[10px] md:text-[11px] font-black tracking-widest uppercase shrink-0">
              DASHBOARD CLOUD
            </span>
            <span className="text-white/20 hidden sm:inline">•</span>
            <span className="border border-orange-500/20 bg-orange-500/5 px-5 py-3 rounded-xl text-orange-500 text-[10px] md:text-[11px] font-black tracking-widest uppercase shrink-0">
              ANTI-FRAUDE
            </span>
          </div>

          {/* Descrição Curta com Destaques em Negrito */}
          <p className="text-white/70 text-sm md:text-base font-medium leading-relaxed max-w-xl mx-auto mb-10 italic">
            Transforme sua gestão logística em uma <strong className="text-white not-italic font-black">operação de auditoria automática</strong>. Provas visuais em tempo real, controle de motoristas agregados e faturamento sem papel.
          </p>

          {/* Botões de Ação com Estilo Horizon */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link 
              href="/register" 
              className="w-full sm:w-auto border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-black px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all hover:scale-[1.03] active:scale-95 text-center"
            >
              Quero Escalar Agora
            </Link>
            <Link 
              href="/login" 
              className="w-full sm:w-auto bg-[#0f172a]/80 hover:bg-slate-900 text-white border border-white/5 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 text-center"
            >
              Entrar no meu Painel
            </Link>
          </div>
        </div>
      </section>

      {/* 2. SEÇÃO DE BENEFÍCIOS (Espaçamentos superior e inferior equilibrados) */}
      <section className="relative w-full pt-10 pb-10 md:pt-14 md:pb-14 px-4 md:px-10 max-w-7xl mx-auto z-10">
        
        {/* Cabeçalho da Seção com Divisor Laranja Sólido */}
        <div className="text-center mb-10 md:mb-12">
          <h2 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white leading-none">
            POR QUE ESCOLHER O TRUCKFLOW?
          </h2>
          <div className="w-20 h-1 bg-orange-500 mx-auto mt-5 rounded-full" />
        </div>

        {/* Grid de Benefícios */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Comando Total */}
          <div className="glass p-8 rounded-[32px] border border-white/10 flex flex-col justify-between min-h-[300px]">
            <div>
              {/* Círculo com Ícone Iluminado de Painel de Comando */}
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
               📲​
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                Comando Total
              </h3>
              <p className="text-white/70 text-xs font-medium leading-relaxed italic mb-6">
                Gerencie sua frota de qualquer lugar através do seu celular. Controle viagens, acertos de equipe e relatórios de campo com total liberdade.
              </p>
            </div>
            <Link href="/register" className="text-[10px] font-black text-orange-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              Iniciar Agora <span className="text-xs">➔</span>
            </Link>
          </div>

          {/* Card 2: Provas Reais */}
          <div className="glass p-8 rounded-[32px] border border-white/10 flex flex-col justify-between min-h-[300px]">
            <div>
              {/* Círculo com Ícone Iluminado */}
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                📸
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                Provas Reais
              </h3>
              <p className="text-white/70 text-xs font-medium leading-relaxed italic mb-6">
                Nossa tecnologia de carimbo em tempo real injeta data e hora diretamente na base das fotos de comprovação, inibindo fraudes de imagem.
              </p>
            </div>
            <Link href="/register" className="text-[10px] font-black text-orange-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              Iniciar Agora <span className="text-xs">➔</span>
            </Link>
          </div>

          {/* Card 3: Sem Cadastro */}
          <div className="glass p-8 rounded-[32px] border border-white/10 flex flex-col justify-between min-h-[300px]">
            <div>
              {/* Círculo com Ícone Iluminado */}
              <div className="w-16 h-16 bg-orange-500/10 border border-orange-500/20 rounded-2xl flex items-center justify-center text-2xl mb-6 shadow-[0_0_15px_rgba(249,115,22,0.15)]">
                🚚​
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mb-3">
                Sem Cadastro
              </h3>
              <p className="text-white/70 text-xs font-medium leading-relaxed italic mb-6">
                Ofereça um portal simplificado para funcionários e terceiros realizarem check-in via link público, mantendo o controle centralizado.
              </p>
            </div>
            <Link href="/register" className="text-[10px] font-black text-orange-500 uppercase tracking-wider flex items-center gap-1.5 hover:text-orange-400 transition-colors">
              Iniciar Agora <span className="text-xs">➔</span>
            </Link>
          </div>

        </div>
      </section>

      {/* Estilos para o efeito pulsar contínuo e suave das bordas */}
      <style jsx global>{`
        @keyframes softPulse {
          0%, 100% {
            transform: scale(0.92);
            opacity: 0.35;
          }
          50% {
            transform: scale(1.18);
            opacity: 0.85;
          }
        }
        @keyframes outerRipple {
          0% {
            transform: scale(0.85);
            opacity: 0.6;
          }
          100% {
            transform: scale(1.45);
            opacity: 0;
          }
        }
        .animate-soft-pulse {
          animation: softPulse 2s infinite ease-in-out;
        }
        .animate-outer-ripple {
          animation: outerRipple 2.5s infinite cubic-bezier(0.4, 0, 0.6, 1);
        }
      `}</style>

      {/* 3. WIDGET FLUTUANTE DO WHATSAPP COM POSICIONAMENTO AJUSTADO E HALO FLUIDO */}
      <a 
        href="https://wa.me/5511916053292?text=Ol%C3%A1%2C%20preciso%20de%20suporte%20para%20o%20Truck%20Flow."
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-6 right-3 md:right-4 z-[300] flex items-center justify-center w-24 h-24 group select-none"
        title="Fale com um Especialista"
      >
        {/* Halo externo que se expande e esvanece continuamente */}
        <span className="absolute w-24 h-24 rounded-full bg-[#25D366]/20 animate-outer-ripple pointer-events-none" />

        {/* Halo intermediário com pulsação suave e contínua */}
        <span className="absolute w-20 h-20 rounded-full bg-[#25D366]/35 animate-soft-pulse pointer-events-none" />
        
        {/* Botão Sólido Principal com o ícone oficial */}
        <span className="relative z-10 w-16 h-16 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-[0_8px_24px_rgba(37,211,102,0.35)] hover:scale-105 active:scale-95 transition-all duration-300">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 448 512" 
            className="w-9 h-9 fill-white"
          >
            <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L0 480l117.7-30.9c32.4 17.7 68.9 27 106.1 27h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-69.8 18.3L72 359.2l-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7 .9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z" />
          </svg>
        </span>
      </a>

      {/* 4. RODAPÉ EXCLUSIVO (EG Empório Digital - 100% Centralizado e Limpo) */}
      <footer className="w-full bg-[#020617] border-t border-white/5 py-12 px-4 md:px-10 mt-10 md:mt-14 relative z-10">
        <div className="max-w-7xl mx-auto flex flex-col items-center justify-center gap-4 text-center">
          
          {/* Nome do sistema colorido */}
          <div>
            <span className="text-xl font-black italic tracking-tighter uppercase text-white">
              TRUCK<span className="text-orange-500">FLOW</span>
              <span className="text-orange-500 font-extrabold">.</span>
            </span>
          </div>

          {/* Tecnologia exclusiva (Quebra de Linha Responsiva para Mobile) */}
          <div className="text-white/45 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
            Tecnologia Exclusiva de <br className="sm:hidden" />
            <a 
              href="https://egemporiodigital.com.br/" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-orange-500 hover:text-orange-400 transition-colors underline decoration-dotted font-black block sm:inline mt-1 sm:mt-0"
            >
              EG Empório Digital
            </a>
          </div>

        </div>
      </footer>

    </main>
  )
}