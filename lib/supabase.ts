import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,       // Força a gravação da sessão no celular/computador
    autoRefreshToken: true,     // Renova o token de acesso automaticamente em segundo plano
    detectSessionInUrl: true,   // Detecta sessões vindas de links externos de confirmação
  },
})