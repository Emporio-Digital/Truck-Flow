import { Metadata } from "next"
import { supabase } from "@/lib/supabase"

// Força o Next.js a sempre processar a requisição em tempo real no servidor, sem cachear
export const dynamic = 'force-dynamic'

type Props = {
  params: Promise<{ id: string }> | { id: string }
  children: React.ReactNode
}

export async function generateMetadata({ params }: { params: any }): Promise<Metadata> {
  try {
    // Resolve o params caso esteja no Next.js 15 (onde params é uma Promise)
    const resolvedParams = await params
    const id = resolvedParams?.id

    if (id) {
      const { data, error } = await supabase
        .from("projects")
        .select("name, address")
        .eq("id", id)
        .single()

      if (data?.name && !error) {
        const descriptionText = data.address 
          ? `Check-In para a obra: ${data.name} (${data.address}).`
          : `Check-In para a obra: ${data.name}.`
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
    }
  } catch (err) {
    // Silencioso se falhar
  }

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