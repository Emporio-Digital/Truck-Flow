import Link from "next/link";

export default function Home() {
  return (
    <main className="relative min-h-screen w-full flex flex-col items-center justify-center px-6 overflow-hidden">
      {/* Luzes de fundo */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-orange-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 rounded-full blur-[120px]" />

      <div className="relative z-10 text-center max-w-4xl">
        <h2 className="text-orange-500 font-black tracking-[8px] text-sm uppercase mb-6 animate-fade-in">
          LOGÍSTICA AVANÇADA
        </h2>
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter leading-[0.9] mb-8 uppercase">
          A REVOLUÇÃO <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/20 italic"> NO TRANSPORTE.</span>
        </h1>
        
        <p className="text-white/40 text-lg md:text-xl font-medium max-w-2xl mx-auto mb-12 leading-relaxed">
          Modernize sua frota com o sistema Gold Edition. Controle total de viagens, gastos e motoristas em uma única central de comando.
        </p>

        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
          <Link href="/register" className="w-full md:w-auto bg-white text-black px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-orange-500 transition-all hover:scale-105 active:scale-95">
            Começar Agora
          </Link>
          <Link href="/login" className="w-full md:w-auto glass border border-white/10 text-white px-10 py-5 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-white/5 transition-all">
            Acessar Painel
          </Link>
        </div>
      </div>

      <footer className="absolute bottom-10 flex items-center gap-10 opacity-20 grayscale hover:grayscale-0 transition-all">
        <span className="font-black italic text-2xl tracking-tighter">SCANIA</span>
        <span className="font-black italic text-2xl tracking-tighter">VOLVO</span>
        <span className="font-black italic text-2xl tracking-tighter">MERCEDES</span>
      </footer>
    </main>
  );
}