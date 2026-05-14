import { createClient } from '@supabase/supabase-js'

// Byt ut dessa mot dina egna värden från Supabase-projektet
// Hämtas under: Settings → API i ditt Supabase-projekt
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
