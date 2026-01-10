import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://bbxfsndkukgrmuwuzpbm.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJieGZzbmRrdWtncm11d3V6cGJtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc5Nzg2MjUsImV4cCI6MjA4MzU1NDYyNX0.FSxARHhRi6GxR1sIFKoYsvpIHQP4GtQgnqGwY_Byrzk'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
