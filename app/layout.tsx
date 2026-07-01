import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata = {
  title: "TruckFlow | Gestão de Frotas",
  description: "A revolução na gestão de frotas",
  manifest: "/manifest.json",
  icons: {
    icon: "/logo.png",
    shortcut: "/logo.png",
    apple: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-br">
      <body className="bg-[#020617] text-white antialiased min-h-screen">
        <Navbar />
        {children}
      </body>
    </html>
  );
}