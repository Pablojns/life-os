/**
 * Cliente único do Supabase (auth + banco).
 * A publishable key é segura no frontend — as regras de acesso ficam no RLS.
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY =
  import.meta.env.VITE_SUPABASE_KEY || 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
