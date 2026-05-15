
import { supabase } from './src/services/api/supabaseClient';

async function checkTable() {
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('id')
    .limit(1);
  
  if (error) {
    console.log('Error or table does not exist:', error.message);
  } else {
    console.log('Table exists!');
  }
}

checkTable();
