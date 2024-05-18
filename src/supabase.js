import { createClient } from '@supabase/supabase-js'

const supabaseUrl = "https://ldkbzfcoewzynxawicxg.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxka2J6ZmNvZXd6eW54YXdpY3hnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcxNTg2NDAwNCwiZXhwIjoyMDMxNDQwMDA0fQ.IJswQ6hReCfUdonQuQIaTmXJC7F_KyAIukKJGWDqu7Y";


export const supabase = createClient(supabaseUrl, supabaseKey)
