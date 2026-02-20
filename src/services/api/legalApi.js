import { supabase } from './supabaseClient';

export const legalApi = {
  /**
   * Check if the current user has accepted all active legal documents.
   * Returns { activeDocs, acceptances, missing, hasPendingAcceptance }
   */
  checkAcceptanceStatus: async () => {
    try {
      // Verificar si hay sesión antes de llamar
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        console.log('No active session for legal check');
        return { hasPendingAcceptance: false };
      }

      // Usar acceso directo a la base de datos (más confiable)
      console.log('Using direct database access for legal check');
      const userId = session.user.id;

      // Obtener documentos activos
      const { data: activeDocs, error: docsError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('is_active', true)
        .order('document_type');

      if (docsError) {
        console.error('Error fetching documents:', docsError);
        return { hasPendingAcceptance: false };
      }

      // Obtener aceptaciones del usuario
      const { data: acceptances, error: acceptancesError } = await supabase
        .from('legal_acceptances')
        .select('*')
        .eq('user_id', userId);

      if (acceptancesError) {
        console.error('Error fetching acceptances:', acceptancesError);
        return { hasPendingAcceptance: false };
      }

      // Encontrar documentos faltantes
      const missing = activeDocs?.filter(doc => {
        const userAcceptance = acceptances?.find(acc => 
          acc.document_type === doc.document_type && 
          acc.document_version === doc.version
        );
        return !userAcceptance;
      }) || [];

      const response = {
        activeDocs: activeDocs || [],
        acceptances: acceptances || [],
        missing,
        hasPendingAcceptance: missing.length > 0
      };

      console.log(`Legal status check complete: ${missing.length} documents pending`);
      return response;
    } catch (error) {
      console.error('Error checking legal acceptance:', error);
      return { hasPendingAcceptance: false }; 
    }
  },

  /**
   * Accept a specific legal document
   * @param {string} documentType - 'TERMS', 'PRIVACY', 'DATA_POLICY', 'SUBSCRIPTION'
   * @param {string} version - The version string of the document
   * @param {string} source - 'REGISTER', 'LOGIN_UPDATE', 'SUBSCRIPTION'
   */
  acceptDocument: async (documentType, version, source) => {
    try {
      // Verificar si hay sesión
      const { data: { session } } = await supabase.auth.getSession();
      if (!session || !session.user) {
        throw new Error('No active session');
      }

      console.log(`Accepting document: ${documentType} v${version} (${source})`);

      // Usar inserción directa en la base de datos (más confiable)
      console.log('Using direct database insert for document acceptance');
      const userId = session.user.id;

      // Verificar que el documento existe y está activo
      const { data: document, error: docError } = await supabase
        .from('legal_documents')
        .select('*')
        .eq('document_type', documentType)
        .eq('version', version)
        .eq('is_active', true)
        .single();

      if (docError || !document) {
        console.error('Document validation failed:', docError?.message);
        throw new Error('Document not found or not active');
      }

      // Verificar si ya fue aceptado
      const { data: existingAcceptance } = await supabase
        .from('legal_acceptances')
        .select('id')
        .eq('user_id', userId)
        .eq('document_type', documentType)
        .eq('document_version', version)
        .single();

      if (existingAcceptance) {
        console.log('Document already accepted:', existingAcceptance.id);
        return { 
          message: 'Document already accepted', 
          acceptance_id: existingAcceptance.id 
        };
      }

      // Insertar nueva aceptación
      const { data: acceptanceData, error: acceptanceError } = await supabase
        .from('legal_acceptances')
        .insert({
          user_id: userId,
          document_type: documentType,
          document_version: version,
          accepted_source: source,
          ip_address: 'web-client', // Placeholder ya que no podemos obtener IP del cliente
          user_agent: navigator.userAgent || 'unknown'
        })
        .select('*')
        .single();

      if (acceptanceError) {
        console.error('Failed to insert acceptance:', acceptanceError);
        throw new Error('Failed to record acceptance: ' + acceptanceError.message);
      }

      console.log('Document acceptance recorded successfully:', acceptanceData.id);
      return { 
        message: 'Document accepted successfully',
        acceptance: acceptanceData 
      };
    } catch (error) {
      console.error('Error accepting document:', error);
      throw error;
    }
  },

  /**
   * Get public active documents (for displaying in modal)
   * This uses direct DB access for speed, bypassing the function overhead if just reading content
   */
  getActiveDocuments: async () => {
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('is_active', true);
      
    if (error) throw error;
    return data;
  }
};
