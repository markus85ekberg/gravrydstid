import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://jrepmlwvrjsebieevygd.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpyZXBtbHd2cmpzZWJpZWV2eWdkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg3MjIxMzEsImV4cCI6MjA5NDI5ODEzMX0.rrHV_T08bmUFNBdbAp5PU7Z2vbpwFSEqVeyqr1fwuUU'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
