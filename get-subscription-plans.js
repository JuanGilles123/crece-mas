// Script para obtener los planes de subscription_plans
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function getPlans() {
  console.log('Consultando subscription_plans...\n');
  
  // Intentar con auth bypass para service role
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('display_order');

  if (error) {
    console.error('Error:', error);
    console.log('\nIntentando sin filtro de is_active...');
    
    // Segundo intento sin filtro
    const { data: data2, error: error2 } = await supabase
      .from('subscription_plans')
      .select('*')
      .order('display_order');
    
    if (error2) {
      console.error('Error en segundo intento:', error2);
      return;
    }
    
    if (!data2 || data2.length === 0) {
      console.log('La tabla existe pero está vacía o RLS bloquea la lectura.');
      return;
    }
    
    // Usar data2 si el primer intento falló
    console.log('Planes encontrados (sin filtro):');
    data2.forEach(plan => {
      console.log(`\n${plan.name} (${plan.slug})`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Precio mensual: $${plan.price_monthly}`);
    });
    return;
  }

  if (data && data.length > 0) {
    console.log('Planes encontrados:');
    console.log('='.repeat(80));
    data.forEach(plan => {
      console.log(`\n${plan.name} (${plan.slug})`);
      console.log(`  ID: ${plan.id}`);
      console.log(`  Precio mensual: $${plan.price_monthly}`);
      console.log(`  Precio anual: $${plan.price_yearly || 'N/A'}`);
      console.log(`  Max organizaciones: ${plan.max_organizations || 'Ilimitado'}`);
      console.log(`  Max usuarios: ${plan.max_users_per_org || 'Ilimitado'}`);
      console.log(`  Max productos: ${plan.max_products || 'Ilimitado'}`);
      console.log(`  Max ventas/mes: ${plan.max_sales_per_month || 'Ilimitado'}`);
      console.log(`  Activo: ${plan.is_active}`);
    });
  } else {
    console.log('No hay planes en la tabla.');
    console.log('Necesitas ejecutar el script SETUP_SUSCRIPCIONES_DB.sql en Supabase.');
  }
}

getPlans();
