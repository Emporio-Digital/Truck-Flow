import { Metadata } from "next"
import { supabase } from "@/lib/supabase"

type Props = {
  params: { id: string }
  children: React.ReactNode
}

// Essa função roda estritamente no servidor e monta a descrição para o WhatsApp
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params

  try {
    // Busca apenas o nome do projeto de forma cirúrgica e rápida
    const { data, error } = await supabase
      .from("projects")
      .select("name")
      .eq("id", id)
      .single()

    if (data?.name && !error) {
      const descriptionText = `Registro de entrada para a obra: ${data.name}.`
      return {
        description: descriptionText,
        openGraph: {
          description: descriptionText,
        },
        twitter: {
          description: descriptionText,
        }
      }
    }
  } catch (err) {
    // Silencioso: Se houver qualquer falha de rede ou banco, não quebra a página
  }

  // Fallback padrão idêntico ao original se algo falhar ou a obra não existir
  const fallbackText = "A revolução na gestão de frotas"
  return {
    description: fallbackText,
    openGraph: {
      description: fallbackText,
    },
    twitter: {
      description: fallbackText,
    }
  }
}

export default function CheckInLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}