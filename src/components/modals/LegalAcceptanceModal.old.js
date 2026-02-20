import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { 
  FileText, 
  Shield, 
  Database, 
  CheckCircle, 
  AlertCircle,
  X,
  Eye,
  ChevronRight,
  Clock,
  Bookmark
} from 'lucide-react';
import toast from 'react-hot-toast';
import { legalApi } from '../../services/api/legalApi';

const LegalAcceptanceModal = ({ missingDocuments, open, onAcceptAll, onRefresh }) => {
  const [loading, setLoading] = useState(false);
  const [viewingDoc, setViewingDoc] = useState(null); // The document currently being viewed
  const [acceptedDocs, setAcceptedDocs] = useState({}); // Local state for checkboxes
  const [allDocs, setAllDocs] = useState([]);

  useEffect(() => {
    if (open && missingDocuments) {
      setAllDocs(missingDocuments);
      // Reset accepted state
      const initial = {};
      missingDocuments.forEach(d => initial[d.id] = false);
      setAcceptedDocs(initial);
    }
  }, [open, missingDocuments]);

  if (!open || !missingDocuments || missingDocuments.length === 0) {
    return null;
  }

  const handleAcceptOne = (docId) => {
    setAcceptedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };

  const handleAcceptSubmit = async () => {
    // Check if all displayed docs are checked
    const allChecked = allDocs.every(d => acceptedDocs[d.id]);
    if (!allChecked) {
      toast.error('Debes aceptar todos los documentos para continuar.');
      return;
    }

    setLoading(true);
    try {
      // Process acceptances sequentially or parallel
      const promises = allDocs.map(doc => 
        legalApi.acceptDocument(doc.document_type, doc.version, 'LOGIN_UPDATE')
      );
      
      await Promise.all(promises);
      
      toast.success('Documentos aceptados correctamente');
      if (onAcceptAll) onAcceptAll();
      if (onRefresh) onRefresh();
    } catch (error) {
      console.error(error);
      toast.error('Error al guardar la aceptación. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'TERMS': return <FileText size={24} />;
      case 'PRIVACY': return <Shield size={24} />;
      case 'DATA_POLICY': return <Database size={24} />;
      default: return <FileText size={24} />;
    }
  };

  /* const getLabel = (type) => {
    switch (type) {
      case 'TERMS': return 'Términos y Condiciones';
      case 'PRIVACY': return 'Política de Privacidad';
      case 'DATA_POLICY': return 'Política de Datos';
      case 'SUBSCRIPTION': return 'Acuerdo de Suscripción';
      default: return 'Documento Legal';
    }
  }; */

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 flex items-center justify-center p-4"
        style={{ 
          zIndex: 2147483647,
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.95)', // Más opaco para mejor contraste
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          style={{ 
            zIndex: 2147483647,
            width: '90%',
            maxWidth: '700px',
            maxHeight: '85vh',
            backgroundColor: '#ffffff', // Fondo completamente blanco
            borderRadius: '16px',
            boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden'
          }}
        >
          {viewingDoc ? (
            <div className="flex flex-col h-full">
               <div className="p-4 border-b flex justify-between items-center bg-gray-50">
                 <h3 className="font-bold text-lg">{viewingDoc.title}</h3>
                 <button onClick={() => setViewingDoc(null)} className="text-gray-500 hover:text-gray-700">
                   Cerrar
                 </button>
               </div>
               <div className="flex-1 overflow-y-auto p-6 prose prose-sm max-w-none">
                 <div style={{ whiteSpace: 'pre-wrap', fontFamily: 'sans-serif' }}>{viewingDoc.content}</div>
               </div>
               <div className="p-4 border-t bg-gray-50 flex justify-end">
                 <button 
                   onClick={() => {
                     handleAcceptOne(viewingDoc.id);
                     setViewingDoc(null);
                   }}
                   className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                 >
                   Aceptar y Volver
                 </button>
               </div>
            </div>
          ) : (
            <div className="flex flex-col h-full">
              <div className="p-6 border-b bg-yellow-50">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-yellow-100 rounded-full text-yellow-600">
                    <AlertTriangle size={24} />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Actualización de Documentos Legales</h2>
                    <p className="mt-1 text-gray-600 text-sm">
                      Para continuar utilizando nuestros servicios, necesitamos que revises y aceptes los siguientes documentos actualizados.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-6">
                <div className="space-y-4">
                  {allDocs.map((doc) => (
                    <div 
                      key={doc.id} 
                      className={`p-4 rounded-lg border transition-all ${
                        acceptedDocs[doc.id] ? 'border-green-200 bg-green-50' : 'border-gray-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`mt-1 ${acceptedDocs[doc.id] ? 'text-green-600' : 'text-gray-400'}`}>
                          {acceptedDocs[doc.id] ? <CheckCircle size={24} /> : getIcon(doc.document_type)}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900">{doc.title}</h4>
                          <p className="text-xs text-gray-500 mb-2">Versión {doc.version} • Actualizado {new Date(doc.published_at || doc.created_at).toLocaleDateString()}</p>
                          <button 
                            onClick={() => setViewingDoc(doc)}
                            className="text-sm text-blue-600 hover:underline font-medium"
                          >
                            Leer documento completo
                          </button>
                        </div>
                        <div className="flex items-center">
                          <input 
                            type="checkbox" 
                            id={`accept-${doc.id}`}
                            checked={acceptedDocs[doc.id] || false}
                            onChange={() => handleAcceptOne(doc.id)}
                            className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-6 border-t bg-gray-50 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <input 
                    type="checkbox" 
                    id="accept-all"
                    checked={allDocs.every(d => acceptedDocs[d.id])}
                    onChange={(e) => {
                      const newState = {};
                      allDocs.forEach(d => newState[d.id] = e.target.checked);
                      setAcceptedDocs(newState);
                    }}
                    className="w-4 h-4 rounded border-gray-300 text-blue-600"
                  />
                  <label htmlFor="accept-all" className="cursor-pointer select-none">
                    He leído y acepto todos los documentos listados anteriormente.
                  </label>
                </div>
                
                <button
                  onClick={handleAcceptSubmit}
                  disabled={loading || !allDocs.every(d => acceptedDocs[d.id])}
                  className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-all ${
                    loading || !allDocs.every(d => acceptedDocs[d.id])
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700 shadow-md transform hover:-translate-y-0.5'
                  }`}
                >
                  {loading ? 'Procesando...' : 'Confirmar y Continuar'}
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default LegalAcceptanceModal;
