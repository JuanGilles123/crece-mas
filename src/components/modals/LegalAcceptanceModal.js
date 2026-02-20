import { legalApi } from '../../services/api/legalApi';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
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

// Estilos como objetos para garantizar aplicación
const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    zIndex: 2147483647,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f2937',
    overflow: 'auto',
    padding: '20px'
  },
  modal: {
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  header: {
    padding: '32px',
    background: 'linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)',
    borderBottom: '1px solid #e5e7eb'
  },
  headerContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  headerIcon: {
    padding: '16px',
    backgroundColor: '#2563eb',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#111827',
    margin: 0,
    marginBottom: '8px'
  },
  headerSubtitle: {
    fontSize: '16px',
    color: '#4b5563',
    margin: 0
  },
  documentsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px'
  },
  card: {
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #e5e7eb',
    backgroundColor: '#ffffff',
    marginBottom: '16px',
    transition: 'all 0.2s ease'
  },
  cardAccepted: {
    padding: '24px',
    borderRadius: '12px',
    border: '2px solid #86efac',
    backgroundColor: '#f0fdf4',
    marginBottom: '16px',
    transition: 'all 0.2s ease'
  },
  cardContent: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px'
  },
  cardIcon: {
    padding: '12px',
    borderRadius: '50%',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardIconAccepted: {
    padding: '12px',
    borderRadius: '50%',
    backgroundColor: '#dcfce7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0
  },
  cardBody: {
    flex: 1,
    minWidth: 0
  },
  cardTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#111827',
    margin: 0,
    marginBottom: '8px'
  },
  cardMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontSize: '14px',
    color: '#6b7280',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  cardMetaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '4px'
  },
  viewButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '10px 16px',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: '8px',
    border: 'none',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    flexShrink: 0
  },
  checkbox: {
    width: '24px',
    height: '24px',
    accentColor: '#2563eb',
    cursor: 'pointer'
  },
  checkboxLabel: {
    fontSize: '16px',
    fontWeight: '500',
    color: '#374151',
    cursor: 'pointer'
  },
  footer: {
    padding: '32px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb'
  },
  confirmationBox: {
    padding: '16px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '12px',
    marginBottom: '24px',
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px'
  },
  confirmationText: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1e40af',
    margin: 0,
    marginBottom: '4px'
  },
  confirmationSubtext: {
    fontSize: '14px',
    color: '#1d4ed8',
    margin: 0
  },
  footerActions: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px'
  },
  progressText: {
    fontSize: '14px',
    color: '#6b7280'
  },
  submitButton: {
    padding: '16px 32px',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  submitButtonDisabled: {
    padding: '16px 32px',
    backgroundColor: '#9ca3af',
    color: '#ffffff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '18px',
    fontWeight: '700',
    cursor: 'not-allowed'
  },
  viewerHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '10px 14px',
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    borderRadius: '10px',
    marginBottom: 0,
    gap: '10px',
    fontSize: '14px',
    minWidth: '200px',
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    color: '#111827',
    margin: 0
  },
  viewerMeta: {
    fontSize: '14px',
    color: '#6b7280',
    margin: 0
  },
  closeButton: {
    padding: '8px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '50%',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  viewerContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '32px'
  },
  viewerFooter: {
    padding: '14px 10px',
    backgroundColor: '#f9fafb',
    borderTop: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px',
    rowGap: '12px',
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    color: '#4b5563',
    border: 'none',
    fontSize: '16px',
    fontWeight: '500',
    cursor: 'pointer'
  },
  viewerActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    flexWrap: 'wrap'
  },
  acceptButton: {
    padding: '12px 24px',
    backgroundColor: '#9ca3af', // gris
    color: '#ffffff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'not-allowed',
    transition: 'all 0.2s ease',
    lineHeight: 1.3,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    margin: 0,
    marginBottom: 0,
    display: 'inline',
    /* Eliminar duplicados */
  },
  acceptButtonGreen: {
    padding: '12px 24px',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    borderRadius: '12px',
    border: 'none',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  infoMessage: {
    marginTop: '10px',
    color: '#2563eb',
    fontSize: '14px',
    textAlign: 'center',
    background: '#eff6ff',
    borderRadius: '8px',
    padding: '8px 12px',
    border: '1px solid #bfdbfe',
    maxWidth: '350px',
    marginLeft: 'auto',
    marginRight: 'auto'
  }
};

const LegalAcceptanceModal = ({ missingDocuments, open, onAcceptAll, onRefresh }) => {
  const [viewingDoc, setViewingDoc] = useState(null);
  const [acceptedDocs, setAcceptedDocs] = useState({});
  const [allDocs, setAllDocs] = useState([]);
  const [hasScrolledToEnd, setHasScrolledToEnd] = useState({});
  const [checkboxes, setCheckboxes] = useState({});
  const viewerContentRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (open && missingDocuments) {
      setAllDocs(missingDocuments);
      const initial = {};
      const initialScroll = {};
      const initialCheckboxes = {};
      missingDocuments.forEach(d => {
        initial[d.id] = false;
        initialScroll[d.id] = false;
        initialCheckboxes[d.id] = false;
      });
      setAcceptedDocs(initial);
      setHasScrolledToEnd(initialScroll);
      setCheckboxes(initialCheckboxes);
    }
  }, [open, missingDocuments]);

  const handleCheckbox = useCallback((docId) => {
    setCheckboxes(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  }, []);

  const handleAcceptOne = useCallback(async (docId) => {
    const doc = allDocs.find(d => d.id === docId);
    if (!doc) return;
    try {
      // Registrar aceptación en Supabase
      await legalApi.acceptDocument(doc.document_type, doc.version, 'LOGIN_UPDATE');
      setAcceptedDocs(prev => ({
        ...prev,
        [docId]: true
      }));
      // Avanzar automáticamente al siguiente documento si existe
      setTimeout(() => {
        const currentIndex = allDocs.findIndex(d => d.id === docId);
        const nextDoc = allDocs[currentIndex + 1];
        if (nextDoc) {
          setViewingDoc(nextDoc);
          toast.success(`Ahora estás viendo: ${getDocumentTitle(nextDoc)} (versión ${nextDoc.version})`);
        } else {
          setViewingDoc(null);
        }
      }, 300);
    } catch (error) {
      toast.error('Error al registrar la aceptación. Intenta de nuevo.');
    }
  }, [allDocs]);

  // Scroll handler para el visor
  const handleScrollViewer = useCallback((docId) => {
    if (!viewerContentRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = viewerContentRef.current;
    if (scrollTop + clientHeight >= scrollHeight - 10) {
      setHasScrolledToEnd(prev => ({ ...prev, [docId]: true }));
    }
  }, []);


  useEffect(() => {
    if (open) {
      const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
          if (!allDocs.every(d => acceptedDocs[d.id])) {
            toast.error('Debes aceptar todos los documentos para continuar.');
          }
        }
      };
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [open, allDocs, acceptedDocs]);

  if (!open || !missingDocuments || missingDocuments.length === 0) {
    return null;
  }

  const getDocumentIcon = (type, isAccepted) => {
    if (isAccepted) {
      return <CheckCircle size={28} color="#16a34a" />;
    }
    switch (type) {
      case 'TERMS': return <FileText size={28} color="#2563eb" />;
      case 'PRIVACY': return <Shield size={28} color="#16a34a" />;
      case 'DATA_POLICY': return <Database size={28} color="#7c3aed" />;
      case 'SUBSCRIPTION': return <Bookmark size={28} color="#ea580c" />;
      default: return <FileText size={28} color="#6b7280" />;
    }
  };

  const getDocumentTitle = (doc) => {
    return doc.title || {
      'TERMS': 'Términos y Condiciones de Uso',
      'PRIVACY': 'Política de Privacidad',
      'DATA_POLICY': 'Política de Tratamiento de Datos Personales',
      'SUBSCRIPTION': 'Acuerdo de Suscripción'
    }[doc.document_type] || 'Documento Legal';
  };

  const DocumentCard = ({ doc }) => {
    const isAccepted = acceptedDocs[doc.id];
    const title = getDocumentTitle(doc);
    
    return (
      <div style={isAccepted ? styles.cardAccepted : styles.card}>
        <div style={styles.cardContent}>
          <div style={isAccepted ? styles.cardIconAccepted : styles.cardIcon}>
            {getDocumentIcon(doc.document_type, isAccepted)}
          </div>
          
          <div style={styles.cardBody}>
            <h3 style={styles.cardTitle}>{title}</h3>
            
            <div style={styles.cardMeta}>
              <span style={styles.cardMetaItem}>
                <Clock size={16} color="#6b7280" />
                <span>Versión {doc.version}</span>
              </span>
              <span>•</span>
              <span>Vigente desde {new Date(doc.published_at || doc.created_at).toLocaleDateString('es-CO')}</span>
            </div>
            
            <button 
              style={styles.viewButton}
              onClick={() => setViewingDoc(doc)}
            >
              <Eye size={18} />
              Ver documento completo
              <ChevronRight size={18} />
            </button>
          </div>
          
          <div style={styles.checkboxContainer}>
            {isAccepted && (
              <CheckCircle size={24} color="#2563eb" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const modalContent = (
    <AnimatePresence>
      {open && (
        <div style={styles.overlay}>
          <motion.div
            ref={modalRef}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            style={styles.modal}
          >
            {viewingDoc ? (
              /* Document Viewer */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh' }}>
                <div style={styles.viewerHeader}>
                  <div style={styles.viewerHeaderLeft}>
                    {getDocumentIcon(viewingDoc.document_type, false)}
                    <div>
                      <h2 style={styles.viewerTitle}>{getDocumentTitle(viewingDoc)}</h2>
                      <p style={styles.viewerMeta}>
                        Versión {viewingDoc.version} • {new Date(viewingDoc.published_at || viewingDoc.created_at).toLocaleDateString('es-CO')}
                      </p>
                    </div>
                  </div>
                  <button 
                    style={styles.closeButton}
                    onClick={() => setViewingDoc(null)}
                  >
                    <X size={28} color="#6b7280" />
                  </button>
                </div>

                <div
                  style={styles.viewerContent}
                  ref={viewerContentRef}
                  onScroll={() => viewingDoc && handleScrollViewer(viewingDoc.id)}
                >
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      h1: ({children}) => (
                        <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#111827', marginBottom: '1.5rem', paddingBottom: '0.75rem', borderBottom: '1px solid #e5e7eb' }}>
                          {children}
                        </h1>
                      ),
                      h2: ({children}) => (
                        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', color: '#374151', marginBottom: '1rem', marginTop: '2rem' }}>
                          {children}
                        </h2>
                      ),
                      h3: ({children}) => (
                        <h3 style={{ fontSize: '1.25rem', fontWeight: '500', color: '#374151', marginBottom: '0.75rem', marginTop: '1.5rem' }}>
                          {children}
                        </h3>
                      ),
                      p: ({children}) => (
                        <p style={{ color: '#4b5563', marginBottom: '1rem', lineHeight: '1.75' }}>
                          {children}
                        </p>
                      ),
                      ul: ({children}) => (
                        <ul style={{ listStyleType: 'disc', paddingLeft: '1.5rem', marginBottom: '1rem', color: '#4b5563' }}>
                          {children}
                        </ul>
                      ),
                      ol: ({children}) => (
                        <ol style={{ listStyleType: 'decimal', paddingLeft: '1.5rem', marginBottom: '1rem', color: '#4b5563' }}>
                          {children}
                        </ol>
                      ),
                      li: ({children}) => (
                        <li style={{ lineHeight: '1.75', marginBottom: '0.5rem' }}>
                          {children}
                        </li>
                      ),
                      strong: ({children}) => (
                        <strong style={{ fontWeight: '600', color: '#111827' }}>
                          {children}
                        </strong>
                      )
                    }}
                  >
                    {viewingDoc.content}
                  </ReactMarkdown>
                </div>

                <div style={styles.viewerFooter}>
                  <button 
                    style={styles.backButton}
                    onClick={() => setViewingDoc(null)}
                  >
                    ← Volver a la lista
                  </button>
                  <div style={{display: 'flex', flexDirection: 'row', alignItems: 'flex-start', flex: 1, gap: '14px', flexWrap: 'wrap', minWidth: 0}}>
                    <label style={{...styles.checkboxContainer, minWidth: '180px', marginBottom: 0}}>
                      <input
                        type="checkbox"
                        style={styles.checkbox}
                        checked={checkboxes[viewingDoc.id] || false}
                        onChange={() => handleCheckbox(viewingDoc.id)}
                        disabled={acceptedDocs[viewingDoc.id]}
                      />
                      <span style={styles.checkboxLabel}>He leído y acepto este documento.</span>
                    </label>
                    <div style={styles.confirmationBox}>
                      <AlertCircle size={18} color="#1e40af" style={{marginTop: 2}} />
                      <div>
                        <span style={{
                          ...styles.confirmationText,
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          display: 'inline-block',
                          width: '100%'
                        }}>
                          Al hacer clic en 'Aceptar y Continuar', usted declara haber leído, entendido y aceptado el contenido completo del documento en su versión actual. Esta acción es legalmente vinculante.
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    style={acceptedDocs[viewingDoc.id] ? styles.acceptButtonGreen :
                      (hasScrolledToEnd[viewingDoc.id] && checkboxes[viewingDoc.id]) ? styles.acceptButtonActive : styles.acceptButton}
                    onClick={() => {
                      if (!(hasScrolledToEnd[viewingDoc.id] && checkboxes[viewingDoc.id]) && !acceptedDocs[viewingDoc.id]) return;
                      if (!acceptedDocs[viewingDoc.id]) {
                        handleAcceptOne(viewingDoc.id);
                      }
                    }}
                    disabled={!(hasScrolledToEnd[viewingDoc.id] && checkboxes[viewingDoc.id]) && !acceptedDocs[viewingDoc.id]}
                    title={!(hasScrolledToEnd[viewingDoc.id] && checkboxes[viewingDoc.id]) && !acceptedDocs[viewingDoc.id] ? 'Debes leer hasta el final y aceptar el checkbox para continuar' : ''}
                  >
                    {acceptedDocs[viewingDoc.id] ? 'Continuar' : 'Aceptar y Continuar'}
                  </button>
                </div>
              </div>
            ) : (
              /* Main Modal */
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '90vh' }}>
                {/* Header */}
                <div style={styles.header}>
                  <div style={styles.headerContent}>
                    <div style={styles.headerIcon}>
                      <AlertCircle size={32} color="#ffffff" />
                    </div>
                    <div>
                      <h1 style={styles.headerTitle}>Actualización de Documentos Legales</h1>
                      <p style={styles.headerSubtitle}>
                        Para continuar utilizando CreceMas, debes revisar y aceptar los siguientes documentos.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Documents List */}
                <div style={styles.documentsList}>
                  {allDocs.map((doc) => (
                    <DocumentCard key={doc.id} doc={doc} />
                  ))}
                </div>

                {/* Footer: botón continuar */}
                {allDocs.length > 0 && allDocs.every(d => acceptedDocs[d.id]) && (
                  <div style={{display: 'flex', justifyContent: 'center', padding: '24px'}}>
                    <button
                      style={styles.acceptButtonGreen}
                      onClick={() => {
                        if (onAcceptAll) onAcceptAll();
                      }}
                    >
                      Continuar
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default LegalAcceptanceModal;
