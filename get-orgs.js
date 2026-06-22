const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ywilkhfkuwhsjvojocso.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl3aWxraGZrdXdoc2p2b2pvY3NvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTgwNjk5ODEsImV4cCI6MjA3MzY0NTk4MX0.QoFH7xBN9vYDZXAu_uOdUr8gHhCoFoW6Fz1SFSK5XuI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, owner_id')
    .limit(5);

  if (error) {
    console.error('Error:', error);
    return;
  }

  for (const org of orgs) {
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, current_period_end, status, expiration_notice_sent_at')
      .eq('organization_id', org.id)
      .maybeSingle();

    const { data: owner } = await supabase.auth.admin.getUserById(org.owner_id).catch(() => ({ data: null }));

    console.log(`Org: ${org.name} (${org.id})`);
    console.log(`  Owner ID: ${org.owner_id} | Email: ${owner?.user?.email || 'N/A'}`);
    console.log(`  Sub: ${sub ? `Status: ${sub.status} | End: ${sub.current_period_end} | Notice Sent: ${sub.expiration_notice_sent_at}` : 'Ninguna'}`);
  }
}

run();
