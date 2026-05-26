const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  const userId = '8407bbec-6725-4ff8-aa19-cbf755dfa2a7';
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) {
    console.error('Error fetching user_profile:', error);
  } else {
    console.log('User Profile:', data);
  }
}

run();
