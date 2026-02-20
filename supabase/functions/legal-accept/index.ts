import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
}

interface LegalDocument {
  id: string;
  document_type: string;
  version: string;
  title: string;
  content: string;
  is_active: boolean;
  published_at: string;
  created_at: string;
}

interface LegalAcceptance {
  id: string;
  user_id: string;
  document_type: string;
  document_version: string;
  accepted_source: string;
  accepted_at: string;
  ip_address?: string;
  user_agent?: string;
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('Legal Accept Function Called:', req.method);
    
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    
    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('Missing environment variables');
      return new Response(
        JSON.stringify({ error: 'Server configuration error' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('No valid Authorization header');
      return new Response(
        JSON.stringify({ error: 'No valid authorization header' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Extract JWT token from header
    const token = authHeader.replace('Bearer ', '');
    
    // Simple JWT validation - check if it's not empty and has proper format
    if (!token || token.length < 20 || !token.includes('.')) {
      console.error('Invalid JWT format');
      return new Response(
        JSON.stringify({ error: 'Invalid token format' }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Create supabase client with anon key and JWT token
    // The JWT token will be validated by RLS policies
    const supabaseClient = createClient(
      supabaseUrl,
      supabaseAnonKey,
      {
        global: {
          headers: { Authorization: authHeader },
        },
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Test auth by making a simple query (RLS will enforce user access)
    let userId;
    try {
      // Try to get user profile to validate JWT and get user ID
      const { data: profiles, error: profileError } = await supabaseClient
        .from('user_profiles')
        .select('id')
        .limit(1);
      
      if (profileError) {
        console.error('Auth validation failed:', profileError.message);
        return new Response(
          JSON.stringify({ error: 'Authentication failed' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
      // Extract user ID from JWT payload (simple base64 decode)
      const payload = token.split('.')[1];
      const decoded = JSON.parse(atob(payload));
      userId = decoded.sub;
      
      if (!userId) {
        console.error('No user ID in JWT');
        return new Response(
          JSON.stringify({ error: 'Invalid user session' }),
          { 
            status: 401, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      
    } catch (authError) {
      console.error('Authentication error:', authError);
      return new Response(
        JSON.stringify({ error: 'Authentication failed', details: authError.message }),
        { 
          status: 401, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log('User authenticated:', userId);

    // GET: Check acceptance status
    if (req.method === 'GET') {
      console.log('GET request - checking acceptance status for user:', userId);
      
      // Get all active documents (public access)
      const { data: activeDocs, error: docsError } = await supabaseClient
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .order('document_type')

      if (docsError) {
        console.error('Error fetching documents:', docsError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch documents', details: docsError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Get user's acceptances (RLS will filter by user_id automatically)
      const { data: acceptances, error: acceptancesError } = await supabaseClient
        .from('legal_acceptances')
        .select('*')
        .eq('user_id', userId)

      if (acceptancesError) {
        console.error('Error fetching acceptances:', acceptancesError)
        return new Response(
          JSON.stringify({ error: 'Failed to fetch acceptances', details: acceptancesError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Find missing documents (not accepted or outdated version)
      const missing = activeDocs?.filter(doc => {
        const userAcceptance = acceptances?.find(acc => 
          acc.document_type === doc.document_type && 
          acc.document_version === doc.version
        )
        return !userAcceptance
      }) || []

      console.log('Found missing documents:', missing.length);

      const response = {
        activeDocs: activeDocs || [],
        acceptances: acceptances || [],
        missing,
        hasPendingAcceptance: missing.length > 0
      }

      return new Response(
        JSON.stringify(response),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // POST: Accept document
    if (req.method === 'POST') {
      console.log('POST request - accepting document for user:', userId);
      
      const body = await req.json()
      const { document_type, version, source } = body

      console.log('Document acceptance request:', { document_type, version, source });

      // Validate required fields
      if (!document_type || !version || !source) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields: document_type, version, source' }),
          { 
            status: 400, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Validate document exists and is active
      const { data: document, error: docError } = await supabaseClient
        .from('legal_documents')
        .select('*')
        .eq('document_type', document_type)
        .eq('version', version)
        .eq('is_active', true)
        .single()

      if (docError || !document) {
        console.error('Document not found:', { document_type, version, error: docError });
        return new Response(
          JSON.stringify({ error: 'Document not found or not active' }),
          { 
            status: 404, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      // Check if user already accepted this version
      const { data: existingAcceptance } = await supabaseClient
        .from('legal_acceptances')
        .select('id')
        .eq('user_id', userId)
        .eq('document_type', document_type)
        .eq('document_version', version)
        .single()

      if (existingAcceptance) {
        console.log('Document already accepted:', existingAcceptance.id);
        return new Response(
          JSON.stringify({ message: 'Document already accepted', acceptance_id: existingAcceptance.id }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Get client info for logging
      const clientIP = req.headers.get('x-forwarded-for') || 
                      req.headers.get('x-real-ip') || 
                      'unknown'
      const userAgent = req.headers.get('user-agent') || 'unknown'

      // Calculate SHA256 hash of document content
      const hashDocumentContent = async (content: string) => {
        const data = new TextEncoder().encode(content)
        const hashBuffer = await crypto.subtle.digest('SHA-256', data)
        return Array.from(new Uint8Array(hashBuffer))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('')
      }

      // Generate document hash
      const document_hash = await hashDocumentContent(document.content)

      // Get app_version from request body if present, else 'unknown'
      const app_version = body.app_version || 'unknown'

      // Insert acceptance record (RLS will enforce user_id matches auth)
      const { data: acceptanceData, error: acceptanceError } = await supabaseClient
        .from('legal_acceptances')
        .insert({
          user_id: userId,
          document_type,
          document_version: version,
          accepted_source: source,
          ip_address: clientIP,
          user_agent: userAgent,
          document_hash,
          app_version
        })
        .select('*')
        .single()

      if (acceptanceError) {
        console.error('Error inserting acceptance:', acceptanceError)
        return new Response(
          JSON.stringify({ error: 'Failed to record acceptance', details: acceptanceError.message }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }

      console.log('Document accepted successfully:', acceptanceData.id);

      return new Response(
        JSON.stringify({ 
          message: 'Document accepted successfully',
          acceptance: acceptanceData 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Method not allowed
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Edge function error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message || 'Unknown error'
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})