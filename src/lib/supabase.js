/**
 * Cliente único do Supabase (auth + banco).
 * A publishable key é segura no frontend — as regras de acesso ficam no RLS.
 */
import { createClient } from '@supabase/supabase-js'

import { config } from './env'

const SUPABASE_URL = config.supabaseUrl || 'https://isjxfqkvavoaksroutre.supabase.co'
const SUPABASE_KEY = config.supabaseKey || 'sb_publishable_6K-0CffRhhuPUfvPoGsARw_oTu31N__'

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)
