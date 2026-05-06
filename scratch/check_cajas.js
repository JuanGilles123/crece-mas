const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkActiveRegisters() {
  try {
    // 1. Obtener aperturas abiertas
    const { data: aperturas, error: errorAperturas } = await supabase
      .from('aperturas_caja')
      .select('id, created_at, employee_id, user_id, organization_id')
      .is('cierre_id', null);

    if (errorAperturas) throw errorAperturas;

    if (!aperturas || aperturas.length === 0) {
      console.log('No hay cajas abiertas actualmente.');
      return;
    }

    // 2. Obtener nombres de empleados
    const employeeIds = aperturas.map(a => a.employee_id).filter(Boolean);
    const { data: employees } = await supabase
      .from('team_members')
      .select('id, employee_name')
      .in('id', employeeIds);

    // 3. Obtener perfiles de usuarios (en caso de que no haya employee_id)
    const userIds = aperturas.map(a => a.user_id).filter(Boolean);
    const { data: profiles } = await supabase
      .from('user_profiles')
      .select('id, full_name, email')
      .in('id', userIds);

    const employeeMap = new Map(employees?.map(e => [e.id, e.employee_name]));
    const profileMap = new Map(profiles?.map(p => [p.id, p.full_name || p.email]));

    console.log('\n--- CAJAS ABIERTAS ACTUALMENTE ---');
    aperturas.forEach(a => {
      const nombre = employeeMap.get(a.employee_id) || profileMap.get(a.user_id) || 'Usuario Desconocido';
      const fecha = new Date(a.created_at).toLocaleString('es-CO');
      console.log(`- Usuario: ${nombre}`);
      console.log(`  Abrió el: ${fecha}`);
      console.log(`  Monto inicial: ${a.monto_apertura}`);
      console.log(`  ID Apertura: ${a.id}`);
      console.log('----------------------------------');
    });

  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkActiveRegisters();
