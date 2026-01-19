import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, Loader2, X } from 'lucide-react';
import './ConfirmacionVenta.css';

const ConfirmacionVenta = ({ 
  isVisible, 
  isLoading, 
  isSuccess, 
  onClose, 
  ventaData = null 
}) => {
  const containerVariants = {
    hidden: { 
      opacity: 0, 
      scale: 0.8,
      y: 50
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0,
      transition: {
        type: "spring",
        damping: 25,
        stiffness: 300,
        duration: 0.6
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8,
      y: 50,
      transition: {
        duration: 0.3
      }
    }
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { duration: 0.3 }
    },
    exit: { 
      opacity: 0,
      transition: { duration: 0.3 }
    }
  };

  const checkVariants = {
    hidden: { 
      scale: 0,
      rotate: -180
    },
    visible: { 
      scale: 1,
      rotate: 0,
      transition: {
        type: "spring",
        damping: 15,
        stiffness: 200,
        delay: 0.2
      }
    }
  };

  const pulseVariants = {
    pulse: {
      scale: [1, 1.1, 1],
      transition: {
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const successTextVariants = {
    hidden: { 
      opacity: 0,
      y: 20
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.4,
        duration: 0.5
      }
    }
  };

  const ventaDetailsVariants = {
    hidden: { 
      opacity: 0,
      y: 30
    },
    visible: { 
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.6,
        duration: 0.5,
        staggerChildren: 0.1
      }
    }
  };

  const detailItemVariants = {
    hidden: { 
      opacity: 0,
      x: -20
    },
    visible: { 
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.3
      }
    }
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="confirmacion-venta-overlay"
          variants={overlayVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          onClick={onClose}
        >
          <motion.div
            className="confirmacion-venta-container"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Botón de cerrar */}
            <motion.button
              className="confirmacion-venta-close"
              onClick={onClose}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X size={20} />
            </motion.button>

            {isLoading && (
              <motion.div
                className="confirmacion-venta-loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  variants={pulseVariants}
                  animate="pulse"
                  className="confirmacion-venta-spinner"
                >
                  <Loader2 size={48} className="spinner-icon" />
                </motion.div>
                <motion.h3
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Procesando venta...
                </motion.h3>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  Por favor espera mientras confirmamos tu transacción
                </motion.p>
              </motion.div>
            )}

            {isSuccess && (
              <motion.div
                className="confirmacion-venta-success"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <motion.div
                  className="confirmacion-venta-icon"
                  variants={checkVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <CheckCircle size={64} />
                </motion.div>

                <motion.div
                  className="confirmacion-venta-text"
                  variants={successTextVariants}
                  initial="hidden"
                  animate="visible"
                >
                  <h3>¡Venta Confirmada!</h3>
                  <p>Tu transacción se ha procesado exitosamente</p>
                </motion.div>

                {ventaData && ventaData.total !== undefined ? (
                  <motion.div
                    className="confirmacion-venta-details"
                    variants={ventaDetailsVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">
                        ${ventaData.total?.toLocaleString() || '0'}
                      </span>
                    </motion.div>
                    
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Método de pago:</span>
                      <span className="detail-value">
                        {ventaData.metodo_pago || 'Efectivo'}
                      </span>
                    </motion.div>
                    
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Productos:</span>
                      <span className="detail-value">
                        {ventaData.cantidadProductos || ventaData.items?.length || 0} artículo(s)
                      </span>
                    </motion.div>
                  </motion.div>
                ) : (
                  <motion.div
                    className="confirmacion-venta-details"
                    variants={ventaDetailsVariants}
                    initial="hidden"
                    animate="visible"
                  >
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Total:</span>
                      <span className="detail-value">Cargando...</span>
                    </motion.div>
                    
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Método de pago:</span>
                      <span className="detail-value">Cargando...</span>
                    </motion.div>
                    
                    <motion.div
                      className="confirmacion-venta-detail-item"
                      variants={detailItemVariants}
                    >
                      <span className="detail-label">Productos:</span>
                      <span className="detail-value">Cargando...</span>
                    </motion.div>
                  </motion.div>
                )}

                <motion.button
                  className="confirmacion-venta-continue"
                  onClick={onClose}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                >
                  Continuar
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ConfirmacionVenta;
