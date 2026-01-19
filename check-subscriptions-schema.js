// Script para verificar el esquema de la tabla subscriptions
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('Consultando esquema de la tabla subscriptions...\n');
  
  try {
    // Intentar obtener una suscripción para ver qué columnas tiene
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Error al consultar:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('Columnas encontradas en la tabla subscriptions:');
      console.log('='.repeat(50));
      Object.keys(data[0]).forEach(column => {
        console.log(`- ${column}: ${typeof data[0][column]} = ${data[0][column]}`);
      });
      console.log('\n');
      console.log('Datos completos del primer registro:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('No hay registros en la tabla. Intentando insertar un registro de prueba...');
      
      // Intentar insertar con campos mínimos
      const testData = {
        organization_id: '00000000-0000-0000-0000-000000000000',
        status: 'active'
      };
      
      const { data: insertData, error: insertError } = await supabase
        .from('subscriptions')
        .insert(testData)
        .select();
      
      if (insertError) {
        console.error('Error al insertar:', insertError);
      } else {
        console.log('Registro de prueba insertado. Columnas:');
        Object.keys(insertData[0]).forEach(column => {
          console.log(`- ${column}`);
        });
      }
    }
  } catch (err) {
    console.error('Error inesperado:', err);
  }
}

checkSchema();
