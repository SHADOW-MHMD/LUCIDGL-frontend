import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  'https://qjwnhvzzngnjoubcvgwb.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqd25odnp6bmduam91YmN2Z3diIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIzOTM4NzIsImV4cCI6MjA5Nzk2OTg3Mn0.kw29UZIkM3radnvEpOKPRwxUlsXPGyBkwLmEhRtO4ts'
)

async function test() {
  // We don't have a user token, so auth.uid() will be null.
  // But we can check if the query fails entirely or just returns empty.
  const { data, error } = await supabase
    .from('channel_members')
    .select('channel_id, channels(id, name, type)')
    .limit(1)

  console.log('Result:', data)
  console.log('Error:', error)
}

test()
