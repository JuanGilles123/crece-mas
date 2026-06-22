const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function inspectVentas() {
  try {
    const { data, error } = await supabase
      .from('ventas')
      .select('*')
      .limit(1);

    if (error) throw error;
    
    if (data && data.length > 0) {
      console.log('Columnas disponibles en VENTAS:', Object.keys(data[0]));
    } else {
      console.log('No hay ventas para inspeccionar.');
    }
  } catch (err) {
    console.error('Error:', err.message);
  }
}

inspectVentas();
